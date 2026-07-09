// scenario.js — Scenario Session Manager
// Handles the full-screen scenario view for active scenario play

'use strict';

// ── Asset registry ────────────────────────────────────────────────
const CARD_BACK_ASSETS = {
  chainguard:  { ability: 'cs-cg-back.png',  msBack: 'cs-ms-chainguard-back.png',  msaBack: 'toa-msa-chainguard-back.png',  token: 'cs-chainguard-token.png'  },
  hollowpact:  { ability: 'cs-ho-back.png',  msBack: 'cs-ms-hollowpact-back.png',  msaBack: 'toa-msa-hollowpact-back.png',  token: 'cs-hollowpact-token.png'  },
  brightspark: { ability: 'cs-bk-back.png',  msBack: 'cs-ms-brightspark-back.png', msaBack: 'toa-msa-brightspark-back.png', token: 'cs-brightspark-token.png' },
  starslinger: { ability: 'cs-st-back.png',  msBack: 'cs-ms-starslinger-back.png', msaBack: 'toa-msa-starslinger-back.png', token: 'cs-starslinger-token.png' },
};
const PQ_BACK        = 'cs-pq-back.png';
const BG_BACK        = 'gh-battle-goals-back.png';
function getCardBack(classId)   { return CARD_BACK_ASSETS[classId]?.ability ?? PQ_BACK; }
function getMsBack(classId)     { return CARD_BACK_ASSETS[classId]?.msBack   ?? PQ_BACK; }
function getTokenImg(classId)   { return CARD_BACK_ASSETS[classId]?.token    ?? ''; }

// ── Absent player DB update ──────────────────────────────────────
async function setAbsentPlayer(scenarioPartyId, isAbsent, substitutePlayerId) {
  const { error } = await sb().from('scenario_party')
    .update({ is_absent: isAbsent, substitute_player_id: substitutePlayerId })
    .eq('id', scenarioPartyId);
  if (error) throw error;
  // Update local state
  const member = (sv.scenario.scenario_party ?? []).find(m => m.id === scenarioPartyId);
  if (member) {
    member.is_absent = isAbsent;
    member.substitute_player_id = substitutePlayerId;
  }
}

// ── Scenario state ────────────────────────────────────────────────
let sv = {
  scenario:       null,   // full scenario row with scenario_party
  campaign:       null,
  activePartyIdx: 0,      // which player's play area is showing
  isGM:           false,
  // Per-character play state (keyed by character_id)
  playState:      {},
  // Per-character selected cards queue (max 2, FIFO)
  selectedCards:  {},     // { charId: [cardId, cardId] }
  // Per-player ready state (green initiative icon)
  readyPlayers:   {},     // { playerId: true/false }
  roundPhase:     'select', // 'select' | 'play'
};

// ── Load hand cards from DB ───────────────────────────────────────
async function loadPartyHandCards(party) {
  if (!party.length) return;
  const charIds = party.map(m => m.character_id);

  // Batch fetch — 2 parallel calls instead of 2N sequential
  const [{ data: allCards }, { data: allStates }, { data: allPartyRows }] = await Promise.all([
    sb().from('character_cards').select('*').in('character_id', charIds).eq('in_hand', true),
    sb().from('character_state').select('*').in('character_id', charIds),
    sb().from('scenario_party').select('battle_goal_completed, is_exhausted, play_state, character_id, id').in('character_id', charIds),
  ]);

  for (const member of party) {
    const charId = member.character_id;
    const cards    = (allCards   ?? []).filter(c => c.character_id === charId);
    const stateRow = (allStates  ?? []).find(s => s.character_id === charId);
    const partyRow = (allPartyRows ?? []).find(p => p.character_id === charId);

    // Restore persisted play state if available
    const savedState = partyRow?.play_state ?? {};
    sv.playState[charId] = {
      hand:            savedState.hand       ?? [],
      active:          savedState.active     ?? [],
      discard:         savedState.discard    ?? [],
      lost:            savedState.lost       ?? [],
      handCards:       cards,
      chargeMap:       savedState.chargeMap  ?? {},
      dotCount:        savedState.dotCount   ?? {},
      stateId:         stateRow?.id ?? null,
      partyRowId:      partyRow?.id ?? null,
      milestoneChecks: stateRow?.milestone_checks ?? 0,
      milestoneEarned: stateRow?.milestone_earned ?? false,
      pqChecks:        stateRow?.pq_checks ?? 0,
      pqCompleted:     stateRow?.pq_completed ?? false,
      bgCompleted:     partyRow?.battle_goal_completed ?? false,
      isExhausted:     partyRow?.is_exhausted ?? false,
      isLongResting:   savedState.isLongResting ?? false,
      hasOverrideAbility: savedState.hasOverrideAbility ?? false,
      restPhase:       savedState.restPhase ?? null,
      restCandidate:   savedState.restCandidate ?? null,
    };
  }
}

// ── Save tracker state to DB ──────────────────────────────────────
async function saveMilestoneChecksForChar(charId, checks) {
  const ps = sv.playState[charId];
  if (!ps?.stateId) return;
  await sb().from('character_state').update({ milestone_checks: checks }).eq('id', ps.stateId);
  ps.milestoneChecks = checks;
}

async function savePqChecksForChar(charId, checks) {
  const ps = sv.playState[charId];
  if (!ps?.stateId) return;
  await sb().from('character_state').update({ pq_checks: checks }).eq('id', ps.stateId);
  ps.pqChecks = checks;
}

async function saveExhaustedForChar(charId, exhausted) {
  const member = (sv.scenario?.scenario_party ?? []).find(m => m.character_id === charId);
  if (!member) return;
  await sb().from('scenario_party').update({ is_exhausted: exhausted }).eq('id', member.id);
  member.is_exhausted = exhausted;
  const ps = sv.playState[charId];
  if (ps) ps.isExhausted = exhausted;
}

// Save play state for a character to scenario_party
async function savePlayStateForChar(charId) {
  const ps = sv.playState[charId];
  if (!ps?.partyRowId) return;
  const stateToSave = {
    active:            ps.active,
    discard:           ps.discard,
    lost:              ps.lost,
    chargeMap:         ps.chargeMap,
    dotCount:          ps.dotCount,
    isLongResting:     ps.isLongResting,
    hasOverrideAbility: ps.hasOverrideAbility,
    restPhase:         ps.restPhase,
    restCandidate:     ps.restCandidate,
  };
  await sb().from('scenario_party')
    .update({ play_state: stateToSave })
    .eq('id', ps.partyRowId);
}

// Save all party members' play states
async function saveAllPlayStates() {
  const party = sv.scenario?.scenario_party ?? [];
  await Promise.all(party.map(m => savePlayStateForChar(m.character_id)));
}

// Also save round-level state (selected cards, ready players, round phase)
async function saveRoundState() {
  await sb().from('scenarios')
    .update({
      round_number: sv.scenario.round_number,
    })
    .eq('id', sv.scenario.id);
}

async function saveRoundNumber(roundNum) {
  await sb().from('scenarios').update({ round_number: roundNum }).eq('id', sv.scenario.id);
  sv.scenario.round_number = roundNum;
}

async function saveBgCompletedForChar(charId, completed) {
  // Persist to scenario_party.battle_goal_completed
  const member = (sv.scenario?.scenario_party ?? []).find(m => m.character_id === charId);
  if (!member) return;
  await sb().from('scenario_party').update({ battle_goal_completed: completed }).eq('id', member.id);
  member.battle_goal_completed = completed;
  const ps = sv.playState[charId];
  if (ps) ps.bgCompleted = completed;
}

async function completePqForChar(charId) {
  const ps = sv.playState[charId];
  if (!ps?.stateId) return;
  await sb().from('character_state').update({ pq_completed: true }).eq('id', ps.stateId);
  ps.pqCompleted = true;
}

// ── Entry point ───────────────────────────────────────────────────
async function openScenarioView(scenario, campaign) {
  sv.scenario = scenario;
  sv.campaign = campaign;

  // Determine if current user is GM
  const myPlayer = getEffectivePlayer(campaign.players ?? []);
  sv.isGM = myPlayer?.id === scenario.gm_player_id || IS_DEV;

  // Fetch hand cards and state for each party member
  sv.playState = {};
  await loadPartyHandCards(scenario.scenario_party ?? []);

  // Set active party index to current player's character if possible
  if (myPlayer) {
    const myMemberIdx = (scenario.scenario_party ?? []).findIndex(m => m.player_id === myPlayer.id);
    if (myMemberIdx >= 0) sv.activePartyIdx = myMemberIdx;
  }

  const overlayEl = document.getElementById('scenario-view-overlay');
  renderScenarioView();
  initSpacebarZoom(overlayEl);
}

// ── Main renderer ─────────────────────────────────────────────────
function renderScenarioView() {
  const overlay = document.getElementById('scenario-view-overlay');
  if (!overlay) return;
  // Preserve zoom overlay across re-renders
  const zoomOverlay = document.getElementById('sv-zoom-overlay');
  overlay.innerHTML = buildScenarioViewHTML();
  overlay.style.display = 'flex';
  if (zoomOverlay) overlay.appendChild(zoomOverlay);
  bindScenarioViewEvents();
}

function buildScenarioViewHTML() {
  const s = sv.scenario;
  const party = s.scenario_party ?? [];

  return `
    <div class="sv-container">
      ${buildScenarioBanner(s)}
      ${buildInitiativeTracker(party)}
      ${buildPlayerTabs(party)}
      ${buildPlayArea(party)}
      ${buildGMControls()}
    </div>`;
}

// ── Scenario Banner ───────────────────────────────────────────────
function buildScenarioBanner(s) {
  const currentRound = s.round_number ?? 0;
  const roundBoxes = currentRound > 0 ? Array.from({length: currentRound}, (_, i) => {
    const r = i + 1;
    const isCurrent = r === currentRound;
    return `<div class="sv-round-box${isCurrent ? ' sv-round-current' : ''}">${r}</div>`;
  }).join('') : '';

  return `
    <div class="sv-banner">
      <div class="sv-banner-inner">
        <div class="sv-banner-left">
          <div class="sv-banner-main">
            <span class="sv-scenario-num">Scenario ${s.scenario_number}</span>
            <span class="sv-scenario-name">${s.scenario_name}</span>
          </div>
          ${s.scenario_goal ? `<div class="sv-scenario-goal">${s.scenario_goal}</div>` : ''}
        </div>
        <div class="sv-round-track" id="sv-round-track">
          ${roundBoxes}
        </div>
      </div>
    </div>`;
}

// ── Initiative Tracker ────────────────────────────────────────────
function buildInitiativeTracker(party) {
  const items = party.map((member, i) => {
    const cls = member.characters;
    const classId = cls?.class_id ?? '';
    const assets = CARD_BACK_ASSETS[classId] ?? {};
    const playerName = member.player?.player_name ?? '?';
    const initiative = member.initiative;
    const isReady = sv.readyPlayers[member.player_id] ?? false;
    const isExhausted = sv.playState[member.character_id]?.isExhausted ?? false;
    return `
      <div class="sv-init-item${initiative ? ' sv-init-revealed' : ' sv-init-unrevealed'}${isReady ? ' sv-init-ready' : ''}${isExhausted ? ' sv-init-exhausted' : ''}"
           data-party-idx="${i}"
           data-player-id="${member.player_id}"
           draggable="${sv.isGM ? 'true' : 'false'}">
        <div class="sv-init-icon" style="border-color: var(--class-color-${classId}, #c9a84c)">
          ${assets.token ? `<img src="${assets.token}" class="sv-init-token-img" alt="">` :
            `<div class="sv-init-placeholder">${classId[0]?.toUpperCase() ?? '?'}</div>`}
        </div>
        <div class="sv-init-name">${playerName}</div>
        ${initiative ? `<div class="sv-init-number">${initiative}</div>` : ''}
      </div>`;
  }).join('');
  return `
    <div class="sv-initiative-tracker" id="sv-initiative-tracker">
      <div class="sv-init-label">Initiative</div>
      <div class="sv-init-items" id="sv-init-items">${items}</div>
    </div>`;
}

// ── Player Tabs ───────────────────────────────────────────────────
function buildPlayerTabs(party) {
  const myPlayer = getEffectivePlayer(sv.campaign.players ?? []);
  const myPlayerId = myPlayer?.id ?? null;

  const tabs = party.map((member, i) => {
    const cls = member.characters;
    const classId = cls?.class_id ?? '';
    const playerName = member.player?.player_name ?? '?';
    const isActive = i === sv.activePartyIdx;
    const isAbsent = member.is_absent;
    const isMyChar = member.player_id === myPlayerId;
    const isSubstitute = isAbsent && member.substitute_player_id === myPlayerId;
    const isMyArea = isMyChar || isSubstitute;

    const absentBadge = isAbsent ? '<span class="sv-tab-absent">ABSENT</span>' : '';
    const peekIcon = !isMyArea && !isActive ? '<span class="sv-tab-peek">👁</span>' : '';

    return `
      <button class="sv-player-tab${isActive ? ' sv-player-tab-active' : ''}${isAbsent ? ' sv-tab-is-absent' : ''}"
          data-party-idx="${i}">
        ${CARD_BACK_ASSETS[classId]?.token
          ? `<img src="${getTokenImg(classId)}" class="sv-tab-token" alt="">`
          : `<span class="sv-tab-icon">${classId[0]?.toUpperCase() ?? '?'}</span>`}
        <span class="sv-tab-name">${playerName}</span>
        ${absentBadge}${peekIcon}
      </button>`;
  }).join('');

  // GM absent management button
  const gmAbsentBtn = sv.isGM ? `<button class="sv-gm-absent-btn" id="sv-manage-absent" title="Manage absent players">👤 Absent</button>` : '';

  return `<div class="sv-player-tabs" id="sv-player-tabs">${tabs}${gmAbsentBtn}</div>`;
}

// ── Play Area ─────────────────────────────────────────────────────
function buildPlayArea(party) {
  const member = party[sv.activePartyIdx];
  if (!member) return '<div class="sv-play-area"><p style="color:#888">No party member selected</p></div>';

  const cls = member.characters;
  const classId = cls?.class_id ?? '';
  const charId = member.character_id;
  const myPlayer = getEffectivePlayer(sv.campaign.players ?? []);
  const myPlayerId = myPlayer?.id ?? null;

  // isMyArea: true if this is my own character, OR I am the assigned substitute for an absent player
  const isMyChar = member.player_id === myPlayerId;
  const isSubstitute = member.is_absent && member.substitute_player_id === myPlayerId;
  const isMyArea = isMyChar || isSubstitute;
  const isPeeking = !isMyArea;
  const ps = sv.playState[charId] ?? { hand: [], active: [], discard: [], lost: [] };

  // Get hand cards from character_cards (in_hand = true)
  const classData = CLASS_REGISTRY?.[classId];
  const handCards = ps.handCards ?? [];

  return `
    <div class="sv-play-area${ps.isExhausted ? ' sv-play-area-exhausted' : ''}" id="sv-play-area">
      ${isPeeking ? `<div class="sv-peek-banner">👁 Viewing ${member.player?.player_name ?? '?'}'s play area</div>` : ''}

      <!-- Above mat: Active/Persistent zone -->
      <div class="sv-zone sv-zone-active">
        <div class="sv-zone-label">Active / Persistent</div>
        <div class="sv-zone-cards" id="sv-active-cards">
          ${ps.active.map(cardId => buildActiveCard(cardId, classId, charId)).join('')}
          ${ps.active.length === 0 ? '<div class="sv-zone-empty">Cards played this turn appear here</div>' : ''}
        </div>
      </div>

      <!-- Center row: Discard | Mat | Lost -->
      <div class="sv-center-row">
        <div class="sv-zone sv-zone-discard">
          <div class="sv-zone-label">Discard (${ps.discard.length})</div>
          <div class="sv-pile-stack">
            ${ps.discard.length > 0
              ? `<img src="${getCardBack(classId)}" class="sv-pile-card" alt="Discard pile">`
              : '<div class="sv-zone-empty">—</div>'}
          </div>
        </div>

        <div class="sv-mat-area">
          ${buildCharacterMat(classId, classData)}
        </div>

        <div class="sv-zone sv-zone-lost">
          <div class="sv-zone-label">Lost (${ps.lost.length})</div>
          <div class="sv-pile-stack">
            ${ps.lost.length > 0
              ? `<img src="${getCardBack(classId)}" class="sv-pile-card" alt="Lost pile">`
              : '<div class="sv-zone-empty">—</div>'}
          </div>
        </div>
      </div>

      <!-- Hand cards -->
      <div class="sv-zone sv-zone-hand">
        <div class="sv-zone-label">Hand (${Math.max(0, handCards.length - ps.active.length - ps.discard.length - ps.lost.length)} remaining)</div>
        <div class="sv-hand-cards" id="sv-hand-cards">
          ${buildHandCards(handCards, classId, charId, ps, isPeeking)}
        </div>
      </div>

      <!-- Trackers row -->
      ${buildTrackerRow(member, classId, classData, isPeeking)}

      <!-- Rest action UI -->
      ${!isPeeking && !ps.isExhausted ? buildRestUI(charId, ps) : ''}

      <!-- Play Tips -->
      ${!isPeeking && !ps.isExhausted ? buildPlayTips(classId, member) : ''}

      <!-- Declare exhaustion button -->
      ${!isPeeking && !ps.isExhausted ? `
        <div class="sv-exhaust-trigger">
          <button class="sv-exhaust-btn" data-char-id="${charId}">💀 Declare Exhaustion</button>
        </div>` : ''}

      <!-- Exhausted overlay message -->
      ${ps.isExhausted ? `<div class="sv-exhausted-banner">💀 Exhausted — no longer participating in scenario play</div>` : ''}
    </div>`;
}

// ── Rest UI ──────────────────────────────────────────────────────
function buildRestUI(charId, ps) {
  const discardCount = ps.discard.length;
  const handCount = (ps.handCards ?? []).length - ps.active.length - ps.discard.length - ps.lost.length;
  const canRest = discardCount >= 2;
  const mustRest = handCount < 2 && canRest;
  const isLongResting = ps.isLongResting ?? false;
  const restPhase = ps.restPhase ?? null;

  // Don't show rest UI if already in play phase
  if (sv.roundPhase === 'play') return '';

  // Show exhaustion warning if no options available
  if (!canRest && handCount < 2) return ''; // handled by exhaustion check elsewhere

  // If long resting, show status
  if (isLongResting) return `
    <div class="sv-rest-area">
      <div class="sv-rest-status">🌙 Long Rest selected — no cards to play this round</div>
      <button class="sv-rest-cancel-btn" data-char-id="${charId}">✕ Cancel Rest</button>
    </div>`;

  // Short rest candidate phase
  if (restPhase === 'short-candidate' && ps.restCandidate) {
    const cardData = getCardDataById(charId, ps.restCandidate);
    const cardImg = cardData?.imageUrl ?? getCardBack(getClassIdForChar(charId));
    return `
      <div class="sv-rest-area sv-rest-candidate">
        <div class="sv-rest-title">🎲 Short Rest — Candidate Card</div>
        <div class="sv-rest-card-preview">
          <img src="${cardImg}" class="sv-rest-card-img" alt="${ps.restCandidate}">
          <div class="sv-rest-card-name">${cardData?.name ?? ps.restCandidate}</div>
        </div>
        <div class="sv-rest-actions">
          <button class="sv-rest-btn sv-rest-lose" data-char-id="${charId}" data-action="lose-candidate">✓ Lose this card</button>
          <button class="sv-rest-btn sv-rest-keep" data-char-id="${charId}" data-action="keep-candidate">↩ Keep it (−1 HP)</button>
        </div>
      </div>`;
  }

  // Short rest override phase — show all discard cards for selection
  if (restPhase === 'short-override') {
    const discardCards = ps.discard.map(cardId => {
      const cardData = getCardDataById(charId, cardId);
      const cardImg = cardData?.imageUrl ?? getCardBack(getClassIdForChar(charId));
      return `<div class="sv-rest-override-card" data-char-id="${charId}" data-card-id="${cardId}" data-action="override-select">
        <img src="${cardImg}" class="sv-rest-card-img" alt="${cardId}">
        <div class="sv-rest-card-name">${cardData?.name ?? cardId}</div>
      </div>`;
    }).join('');
    return `
      <div class="sv-rest-area sv-rest-override">
        <div class="sv-rest-title">⚡ Short Rest Override — Choose card to lose</div>
        <div class="sv-rest-override-grid">${discardCards}</div>
        <button class="sv-rest-cancel-btn" data-char-id="${charId}">✕ Cancel</button>
      </div>`;
  }

  // Normal rest prompt
  if (!canRest) return '';
  const overrideOption = ps.hasOverrideAbility
    ? `<button class="sv-rest-btn sv-rest-override-btn" data-char-id="${charId}" data-action="start-override">⚡ Short Rest (Override)</button>`
    : '';
  const overrideCheck = !ps.hasOverrideAbility
    ? `<label class="sv-override-check-label">
        <input type="checkbox" class="sv-override-ability-check" data-char-id="${charId}">
        I have Short Rest Override ability
      </label>`
    : `<label class="sv-override-check-label">
        <input type="checkbox" class="sv-override-ability-check" data-char-id="${charId}" checked>
        I have Short Rest Override ability
      </label>`;

  return `
    <div class="sv-rest-area${mustRest ? ' sv-rest-required' : ''}">
      <div class="sv-rest-title">${mustRest ? '⚠️ Must Rest — not enough cards to play' : '💤 Rest available'}</div>
      ${overrideCheck}
      <div class="sv-rest-actions">
        <button class="sv-rest-btn sv-rest-short" data-char-id="${charId}" data-action="start-short">🎲 Short Rest</button>
        ${overrideOption}
        <button class="sv-rest-btn sv-rest-long" data-char-id="${charId}" data-action="start-long">🌙 Long Rest</button>
      </div>
    </div>`;
}

function getClassIdForChar(charId) {
  const member = (sv.scenario?.scenario_party ?? []).find(m => m.character_id === charId);
  return member?.characters?.class_id ?? '';
}

function getCardDataById(charId, cardId) {
  const classId = getClassIdForChar(charId);
  const classData = CLASS_REGISTRY?.[classId];
  return classData?.cards?.find(c =>
    c.name === cardId ||
    c.name.toLowerCase().replace(/[^a-z0-9]/g, '-') === cardId
  ) ?? null;
}

// ── Character Mat ─────────────────────────────────────────────────
function buildCharacterMat(classId, classData) {
  const frontUrl = classData ? `https://raw.githubusercontent.com/any2cards/worldhaven/master/images/character-mats/crimson-scales/cs-${classId}.png` : '';
  return `
    <div class="sv-mat-wrapper" id="sv-mat-wrapper">
      <img src="${frontUrl}" class="sv-mat-img sv-mat-front" id="sv-mat-front" alt="Character mat">
      <button class="sv-mat-flip-btn" id="sv-mat-flip" title="Flip mat">⟳ Flip</button>
    </div>`;
}

// ── Hand Cards ────────────────────────────────────────────────────
function buildHandCards(dbCards, classId, charId, ps, isPeeking) {
  const classData = CLASS_REGISTRY?.[classId];
  const playedSet = new Set([...ps.active, ...ps.discard, ...ps.lost]);
  const available = dbCards.filter(dc => !playedSet.has(dc.card_id));
  if (!available.length) return '<div class="sv-zone-empty">No cards in hand</div>';

  const selected = sv.selectedCards[charId] ?? [];
  const inPlayPhase = sv.roundPhase === 'play';

  return available.map(dc => {
    const cardId = dc.card_id;
    const cardData = classData?.cards?.find(c =>
      c.name === cardId ||
      c.name.toLowerCase().replace(/[^a-z0-9]/g, '-') === cardId
    );
    const cardName = cardData?.name ?? cardId;
    const cardImg = cardData?.imageUrl ?? getCardBack(classId);

    if (isPeeking) {
      return `<div class="sv-hand-card sv-hand-card-facedown" data-card-id="${cardId}" data-char-id="${charId}">
        <img src="${getCardBack(classId)}" class="sv-card-img" alt="Card back">
      </div>`;
    }

    const isSelected = selected.includes(cardId);
    // Find if this player is ready (cards locked once green)
    const memberForChar = (sv.scenario?.scenario_party ?? []).find(m => m.character_id === charId);
    const playerIsReady = memberForChar ? (sv.readyPlayers[memberForChar.player_id] ?? false) : false;
    const isLocked = (inPlayPhase && !isSelected) || (playerIsReady && !isSelected);
    const selIdx = selected.indexOf(cardId);
    const selLabel = selIdx === 0 ? '1st' : selIdx === 1 ? '2nd' : '';

    return `<div class="sv-hand-card${isSelected ? ' sv-card-selected' : ''}${isLocked ? ' sv-card-locked' : ''}"
        data-card-id="${cardId}" data-char-id="${charId}" data-img="${cardImg}">
      <img src="${cardImg}" class="sv-card-img" alt="${cardName}">
      ${isSelected ? `<div class="sv-card-sel-badge">${selLabel}</div>` : ''}
      <div class="sv-card-name">${cardName}</div>
      ${isSelected && inPlayPhase ? `<button class="sv-play-card-btn" data-card-id="${cardId}" data-char-id="${charId}" title="Play card">▶ Play</button>` : ''}
    </div>`;
  }).join('');
}

// ── Active Card ───────────────────────────────────────────────────
function buildActiveCard(cardId, classId, charId) {
  const classData = CLASS_REGISTRY?.[classId];
  const card = classData?.cards?.find(c =>
    c.name === cardId ||
    c.name.toLowerCase().replace(/[^a-z0-9]/g, '-') === cardId
  );
  const displayName = card?.name ?? cardId;
  const imgSrc = card?.imageUrl ?? getCardBack(classId);

  // Charge dots — player manually adds dots as needed for charge tracking
  const ps = sv.playState[charId];
  const chargeMap = ps?.chargeMap ?? {};
  const filledCount = chargeMap[cardId] ?? 0;
  const totalDots = ps?.dotCount?.[cardId] ?? 0;

  const chargeDots = `
    <div class="sv-charge-dots">
      ${Array.from({length: totalDots}, (_, i) =>
        `<button class="sv-charge-dot ${i < filledCount ? 'sv-charge-filled' : ''}"
          data-card-id="${cardId}" data-char-id="${charId}" data-dot="${i}"></button>`
      ).join('')}
      <button class="sv-charge-add-btn" data-card-id="${cardId}" data-char-id="${charId}" title="Add charge slot">+</button>
    </div>`;

  return `
    <div class="sv-active-card" data-card-id="${cardId}" data-char-id="${charId}" data-img="${imgSrc}">
      <img src="${imgSrc}" class="sv-card-img sv-zoomable" alt="${displayName}">
      <div class="sv-card-name">${displayName}</div>
      ${chargeDots}
      <div class="sv-active-card-actions">
        <button class="sv-move-card-btn" data-dest="discard" data-card-id="${cardId}" data-char-id="${charId}">→ Discard</button>
        <button class="sv-move-card-btn" data-dest="lost" data-card-id="${cardId}" data-char-id="${charId}">→ Lost</button>
        <button class="sv-move-card-btn" data-dest="hand" data-card-id="${cardId}" data-char-id="${charId}">→ Hand</button>
      </div>
    </div>`;
}

// ── Tracker Row ───────────────────────────────────────────────────
function buildTrackerRow(member, classId, classData, isPeeking = false) {
  const ps = sv.playState[member.character_id] ?? {};
  const charId = member.character_id;

  const msEarned = ps.milestoneEarned ?? false;
  const msChecks = ps.milestoneChecks ?? 0;
  const msImg = classData?.milestone?.imageUrl ?? '';
  const msBack = getMsBack(classId);
  const msDisplayImg = isPeeking ? msBack : msImg;

  const pqId = member.characters?.pq_card_id ?? null;
  const pqChecks = ps.pqChecks ?? 0;
  const pqCompleted = ps.pqCompleted ?? false;

  const bgCard = member.battle_goal_card;

  // Milestone tracker
  function buildMsTracker() {
    if (!msImg) return '';
    if (isPeeking) return `
      <div class="sv-tracker-card sv-tracker-milestone">
        <div class="sv-tracker-label">🏆 Milestone</div>
        <img src="${msBack}" class="sv-tracker-img sv-zoomable" alt="Milestone back">
      </div>`;
    if (msEarned) return `
      <div class="sv-tracker-card sv-tracker-milestone">
        <div class="sv-tracker-label">🏆 Milestone ✅</div>
        <img src="${msImg}" class="sv-tracker-img sv-zoomable" alt="Milestone">
        <div class="sv-tracker-earned">Milestone earned!</div>
      </div>`;
    const dots = Array.from({length: 10}, (_, i) =>
      `<button class="sv-check-box ${i < msChecks ? 'sv-check-filled' : ''}"
        data-tracker="ms" data-idx="${i}" data-char-id="${charId}">${i < msChecks ? '✓' : ''}</button>`
    ).join('');
    return `
      <div class="sv-tracker-card sv-tracker-milestone">
        <div class="sv-tracker-label">🏆 Milestone ${msChecks}/10</div>
        <img src="${msImg}" class="sv-tracker-img sv-zoomable" alt="Milestone">
        <div class="sv-tracker-checks">${dots}</div>
        ${msChecks >= 10 ? `<div class="sv-tracker-earned">✅ All checks complete — claim reward in Deck Builder</div>` : ''}
      </div>`;
  }

  // PQ tracker
  function buildPqTracker() {
    if (!pqId) return '';
    const isToA = pqId.startsWith('toa-');
    const pqFrontUrl = isToA
      ? `https://raw.githubusercontent.com/any2cards/worldhaven/master/images/personal-quests/trail-of-ashes/${pqId}.png`
      : `https://raw.githubusercontent.com/any2cards/worldhaven/master/images/personal-quests/crimson-scales/${pqId}.png`;
    if (isPeeking) return `
      <div class="sv-tracker-card sv-tracker-pq">
        <div class="sv-tracker-label">📜 PQ</div>
        <img src="${PQ_BACK}" class="sv-tracker-img sv-zoomable" alt="PQ back">
      </div>`;
    if (pqCompleted) return `
      <div class="sv-tracker-card sv-tracker-pq">
        <div class="sv-tracker-label">📜 PQ ✅</div>
        <img src="${pqFrontUrl}" class="sv-tracker-img sv-zoomable" alt="PQ card" onerror="this.src='${PQ_BACK}'">
        <div class="sv-tracker-earned">Ready to Retire!</div>
      </div>`;
    const tracker = PQ_TRACKER_DATA?.[pqId];
    if (!tracker) return `
      <div class="sv-tracker-card sv-tracker-pq">
        <div class="sv-tracker-label">📜 PQ</div>
        <img src="${pqFrontUrl}" class="sv-tracker-img sv-zoomable" alt="PQ card" onerror="this.src='${PQ_BACK}'">
      </div>`;

    // Build grouped or flat dots
    let dots = '';
    if (tracker.groups) {
      let offset = 0;
      dots = tracker.groups.map(g => {
        const groupDots = Array.from({length: g.count}, (_, i) => {
          const idx = offset + i;
          return `<button class="sv-check-box ${idx < pqChecks ? 'sv-check-filled' : ''}"
            data-tracker="pq" data-idx="${idx}" data-char-id="${charId}">${idx < pqChecks ? '✓' : ''}</button>`;
        }).join('');
        offset += g.count;
        return `<div class="sv-pq-group-row"><span class="sv-pq-group-lbl">${g.label}</span>${groupDots}</div>`;
      }).join('');
    } else {
      dots = Array.from({length: tracker.count}, (_, i) =>
        `<button class="sv-check-box ${i < pqChecks ? 'sv-check-filled' : ''}"
          data-tracker="pq" data-idx="${i}" data-char-id="${charId}">${i < pqChecks ? '✓' : ''}</button>`
      ).join('');
    }
    const countDone = pqChecks >= tracker.count;
    return `
      <div class="sv-tracker-card sv-tracker-pq">
        <div class="sv-tracker-label">📜 PQ ${Math.min(pqChecks, tracker.count)}/${tracker.count}</div>
        <img src="${pqFrontUrl}" class="sv-tracker-img sv-zoomable" alt="PQ card" onerror="this.src='${PQ_BACK}'">
        <div class="sv-tracker-checks">${dots}</div>
        ${countDone && tracker.phase2 ? `<div class="sv-tracker-phase2">✅ Phase 1 done! Now: ${tracker.phase2}</div>` : ''}
        ${countDone ? `<div class="sv-tracker-earned">✅ Quest complete — mark in Deck Builder during Downtime</div>` : ''}
      </div>`;
  }

  // Battle goal tracker (face down always for peek, face up own view)
  function buildBgTracker() {
    if (!bgCard) return '';
    const bgData = typeof BATTLE_GOAL_DATA !== 'undefined' ? BATTLE_GOAL_DATA[bgCard] : null;
    const bgImgUrl = `https://raw.githubusercontent.com/any2cards/worldhaven/master/images/battle-goals/gloomhaven/${bgCard}.png`;
    const bgDisplayImg = isPeeking ? BG_BACK : bgImgUrl;
    const bgTitle = bgData ? bgData.title : bgCard;
    const bgCompleted = ps.bgCompleted ?? false;
    return `
      <div class="sv-tracker-card sv-tracker-bg">
        <div class="sv-tracker-label">🎯 Battle Goal${bgData ? ` — ${bgData.checks === 2 ? '★★' : '★'}` : ''}</div>
        <img src="${bgDisplayImg}" class="sv-tracker-img sv-zoomable" alt="${bgTitle}" onerror="this.src='${BG_BACK}'">
        ${!isPeeking ? `<div class="sv-tracker-checks" style="margin-top:4px">
          <button class="sv-check-box ${bgCompleted ? 'sv-check-filled' : ''}"
            data-tracker="bg" data-char-id="${charId}">${bgCompleted ? '✓' : ''}</button>
          <span style="font-size:11px;color:#888;margin-left:6px">${bgCompleted ? 'Goal achieved!' : 'Mark if achieved'}</span>
        </div>` : ''}
      </div>`;
  }

  const msHtml = buildMsTracker();
  const pqHtml = buildPqTracker();
  const bgHtml = buildBgTracker();

  return `
    <div class="sv-tracker-row">
      ${msHtml}
      ${msHtml && pqHtml ? '<div class="sv-tracker-sep"></div>' : ''}
      ${pqHtml}
      ${bgHtml}
    </div>`;
}

// ── Play Tips ─────────────────────────────────────────────────────
function buildPlayTips(classId, member) {
  // ── Static card goal tips (always visible) ──────────────────────
  const staticTips = [];

  const msCondition = MILESTONE_TRACKER_DATA?.[classId];
  if (msCondition) staticTips.push({ icon: '🏆', label: 'Milestone', text: msCondition });

  const pqId = member.characters?.pq_card_id;
  const pqTracker = pqId ? PQ_TRACKER_DATA?.[pqId] : null;
  if (pqTracker) staticTips.push({ icon: '📜', label: 'Personal Quest', text: pqTracker.condition });

  const bgCard = member.battle_goal_card;
  const bgData = (bgCard && typeof BATTLE_GOAL_DATA !== 'undefined') ? BATTLE_GOAL_DATA?.[bgCard] : null;
  if (bgData) staticTips.push({ icon: '🎯', label: `Battle Goal (${bgData.checks === 2 ? '★★ double' : '★ single'})`, text: bgData.condition });
  else if (bgCard) staticTips.push({ icon: '🎯', label: 'Battle Goal', text: `${bgCard} — check your card for the goal.` });

  // ── Rotating class guide tips carousel ─────────────────────────
  const classData = CLASS_REGISTRY?.[classId];
  const classTips = classData?.tips ?? [];
  sv.currentTips = classTips;
  sv.tipIndex = sv.tipIndex ?? 0;

  const firstTip = classTips[0];

  return `
    <div class="sv-tips-area">
      ${staticTips.length ? `
        <div class="sv-tips-label" style="margin-bottom:8px">🎯 Round Goals</div>
        <div class="sv-tips-static">
          ${staticTips.map(t => `
            <div class="sv-tip">
              <span class="sv-tip-icon">${t.icon}</span>
              <span class="sv-tip-label">${t.label}:</span>
              <span class="sv-tip-text">${t.text}</span>
            </div>`).join('')}
        </div>
        <div class="sv-tips-divider"></div>` : ''}
      ${classTips.length ? `
        <div class="sv-tips-header">
          <div class="sv-tips-label">💡 Class Tips</div>
          <div class="sv-tips-counter" id="sv-tips-counter">1 / ${classTips.length}</div>
        </div>
        <div class="sv-tip-carousel" id="sv-tip-carousel">
          ${firstTip ? `<div class="sv-tip">
            <span class="sv-tip-label">${firstTip.category}:</span>
            <span class="sv-tip-text">${firstTip.text}</span>
          </div>` : ''}
        </div>
        <div class="sv-tips-nav">
          <button class="sv-tip-nav-btn" id="sv-tip-prev">◀</button>
          <button class="sv-tip-nav-btn" id="sv-tip-next">▶</button>
        </div>` : ''}
    </div>`;
}

function bindTipsCarousel() {
  const carousel = document.getElementById('sv-tip-carousel');
  const counter = document.getElementById('sv-tips-counter');
  if (!carousel || !sv.currentTips?.length) return;

  function showTip(idx) {
    sv.tipIndex = ((idx % sv.currentTips.length) + sv.currentTips.length) % sv.currentTips.length;
    const t = sv.currentTips[sv.tipIndex];
    carousel.innerHTML = `
      <div class="sv-tip sv-tip-fade">
        <span class="sv-tip-label">${t.category}:</span>
        <span class="sv-tip-text">${t.text}</span>
      </div>`;
    if (counter) counter.textContent = `${sv.tipIndex + 1} / ${sv.currentTips.length}`;
  }

  document.getElementById('sv-tip-prev')?.addEventListener('click', () => showTip(sv.tipIndex - 1));
  document.getElementById('sv-tip-next')?.addEventListener('click', () => showTip(sv.tipIndex + 1));

  // Auto-rotate every 10 seconds — only start fresh if not already running
  if (!sv.tipTimer) {
    sv.tipTimer = setInterval(() => showTip(sv.tipIndex + 1), 10000);
  }
}

// ── Absent Player Modal ───────────────────────────────────────────
function buildAbsentModal(party) {
  const campaignPlayers = sv.campaign.players ?? [];
  const rows = party.map(member => {
    const cls = member.characters;
    const classId = cls?.class_id ?? '';
    const playerName = member.player?.player_name ?? '?';
    const isAbsent = member.is_absent ?? false;
    const subId = member.substitute_player_id ?? '';

    const playerOptions = campaignPlayers.map(p =>
      `<option value="${p.id}" ${p.id === subId ? 'selected' : ''}>${p.player_name}</option>`
    ).join('');

    return `
      <div class="sv-absent-row">
        <div class="sv-absent-player">
          ${classIcon(classId, 20)} <span>${playerName}</span>
        </div>
        <label class="sv-absent-toggle">
          <input type="checkbox" class="sv-absent-check" data-party-id="${member.id}" ${isAbsent ? 'checked' : ''}>
          Absent
        </label>
        <select class="sv-absent-sub wizard-input" data-party-id="${member.id}" ${!isAbsent ? 'disabled' : ''} style="padding:4px 6px;font-size:12px">
          <option value="">— assign substitute —</option>
          ${playerOptions}
        </select>
      </div>`;
  }).join('');

  return `
    <div class="db-modal-overlay" id="sv-absent-modal" style="display:flex">
      <div class="db-modal" style="max-width:480px">
        <div class="db-modal-header">
          <h3 class="db-modal-title">👤 Manage Absent Players</h3>
          <button class="db-modal-close" id="sv-absent-close">✕</button>
        </div>
        <div class="db-modal-body">
          <p style="font-size:12px;color:#888;margin-bottom:12px">Mark absent players and assign a substitute to play their character.</p>
          ${rows}
        </div>
        <div class="db-modal-footer">
          <button class="wizard-btn" id="sv-absent-cancel">Cancel</button>
          <button class="wizard-btn wizard-btn-primary" id="sv-absent-save">Save</button>
        </div>
      </div>
    </div>`;
}

// ── GM Controls ───────────────────────────────────────────────────
function buildGMControls() {
  if (!sv.isGM) return '';
  const party = sv.scenario?.scenario_party ?? [];
  const allReady = party.length > 0 && party.every(m => sv.readyPlayers[m.player_id]);
  const inPlayPhase = sv.roundPhase === 'play';

  return `
    <div class="sv-gm-controls" id="sv-gm-controls">
      ${allReady && !inPlayPhase ? `<button class="sv-gm-btn sv-gm-btn-primary" id="sv-begin-round">⚔️ Begin Round</button>` : ''}
      ${inPlayPhase ? `<button class="sv-gm-btn sv-gm-btn-primary" id="sv-new-round">🔄 New Round</button>` : ''}
      <button class="sv-gm-btn" id="sv-pause-scenario">⏸ Pause</button>
      <button class="sv-gm-btn sv-gm-btn-danger" id="sv-cancel-scenario">✕ Cancel Scenario</button>
    </div>`;
}

// ── Event Binding ─────────────────────────────────────────────────
function bindScenarioViewEvents() {
  // Player tab switching
  document.querySelectorAll('.sv-player-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      sv.activePartyIdx = parseInt(tab.dataset.partyIdx);
      renderScenarioView();
    });
  });

  // Card selection (click card to select/deselect, max 2, FIFO)
  document.querySelectorAll('.sv-hand-card:not(.sv-hand-card-facedown):not(.sv-card-locked)').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.classList.contains('sv-play-card-btn')) return;
      const { cardId, charId } = card.dataset;
      // Check if this player is ready — if so, cards are locked
      const memberForChar = (sv.scenario?.scenario_party ?? []).find(m => m.character_id === charId);
      const playerIsReady = memberForChar ? (sv.readyPlayers[memberForChar.player_id] ?? false) : false;
      if (playerIsReady || sv.roundPhase === 'play') return;
      if (!sv.selectedCards[charId]) sv.selectedCards[charId] = [];
      const sel = sv.selectedCards[charId];
      const idx = sel.indexOf(cardId);
      if (idx >= 0) {
        sel.splice(idx, 1);
      } else {
        if (sel.length >= 2) sel.shift();
        sel.push(cardId);
      }
      renderScenarioView();
    });
  });

  // Play card button (only visible in play phase for selected cards)
  document.querySelectorAll('.sv-play-card-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const { cardId, charId } = btn.dataset;
      if (!sv.playState[charId]) sv.playState[charId] = { hand: [], active: [], discard: [], lost: [], handCards: [] };
      sv.playState[charId].active.push(cardId);
      // Remove from selected
      if (sv.selectedCards[charId]) {
        sv.selectedCards[charId] = sv.selectedCards[charId].filter(id => id !== cardId);
      }
      renderScenarioView();
    });
  });

  // Initiative icon click — toggle ready state (select phase) OR end turn (play phase)
  const myPlayer = getEffectivePlayer(sv.campaign.players ?? []);
  document.querySelectorAll('.sv-init-item').forEach(item => {
    item.addEventListener('click', async () => {
      const playerId = item.dataset.playerId;
      if (!myPlayer && !IS_DEV) return;
      if (myPlayer && myPlayer.id !== playerId && !IS_DEV) return;

      const isExhausted = (sv.scenario.scenario_party ?? [])
        .find(m => m.player_id === playerId)?.character_id
        ? sv.playState[(sv.scenario.scenario_party ?? []).find(m => m.player_id === playerId)?.character_id]?.isExhausted
        : false;
      if (isExhausted) return;

      if (sv.roundPhase === 'play') {
        // Play phase — green icon click ends the player's turn (turns red)
        const currentlyReady = sv.readyPlayers[playerId] ?? false;
        if (currentlyReady) {
          sv.readyPlayers[playerId] = false;
          // Save play state at end of turn
          const memberForPlayer = (sv.scenario.scenario_party ?? []).find(m => m.player_id === playerId);
          if (memberForPlayer) await savePlayStateForChar(memberForPlayer.character_id);
          showToast('Turn ended.');
          renderScenarioView();
        }
        return;
      }

      // Select phase — toggle ready state
      const currentlyReady = sv.readyPlayers[playerId] ?? false;
      if (!currentlyReady) {
        // Going green — must have 2 cards selected OR be long resting
        const member = (sv.scenario.scenario_party ?? []).find(m => m.player_id === playerId);
        if (!member) return;
        const charId = member.character_id;
        const ps = sv.playState[charId];
        const isLongResting = ps?.isLongResting ?? false;
        const selected = sv.selectedCards[charId] ?? [];
        if (!isLongResting && selected.length < 2) {
          showToast('Select two cards before marking ready.', true);
          return;
        }
      }

      sv.readyPlayers[playerId] = !currentlyReady;
      renderScenarioView();
    });
  });

  // Move card from active zone
  document.querySelectorAll('.sv-move-card-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const { dest, cardId, charId } = btn.dataset;
      const ps = sv.playState[charId];
      if (!ps) return;
      ps.active = ps.active.filter(n => n !== cardId);
      if (dest === 'discard') ps.discard.push(cardId);
      else if (dest === 'lost') ps.lost.push(cardId);
      renderScenarioView();
    });
  });

  // Charge dot tap-to-fill
  document.querySelectorAll('.sv-charge-dot').forEach(dot => {
    dot.addEventListener('click', e => {
      e.stopPropagation();
      const { cardId, charId, dot: dotIdx } = dot.dataset;
      const ps = sv.playState[charId];
      if (!ps) return;
      if (!ps.chargeMap) ps.chargeMap = {};
      const current = ps.chargeMap[cardId] ?? 0;
      const idx = parseInt(dotIdx);
      ps.chargeMap[cardId] = (idx < current) ? idx : idx + 1;
      renderScenarioView();
    });
  });

  // Tracker checkboxes (milestone and PQ)
  document.querySelectorAll('.sv-check-box').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      const { tracker, idx, charId } = btn.dataset;
      const ps = sv.playState[charId];
      if (!ps) return;
      const i = parseInt(idx);

      if (tracker === 'ms') {
        const current = ps.milestoneChecks ?? 0;
        const newVal = i < current ? i : i + 1;
        await saveMilestoneChecksForChar(charId, newVal);
        renderScenarioView();
      } else if (tracker === 'pq') {
        const current = ps.pqChecks ?? 0;
        const newVal = i < current ? i : i + 1;
        await savePqChecksForChar(charId, newVal);
        renderScenarioView();
      } else if (tracker === 'bg') {
        const newVal = !(ps.bgCompleted ?? false);
        await saveBgCompletedForChar(charId, newVal);
        renderScenarioView();
      }
    });
  });

  // Add charge slot button
  document.querySelectorAll('.sv-charge-add-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const { cardId, charId } = btn.dataset;
      const ps = sv.playState[charId];
      if (!ps) return;
      if (!ps.dotCount) ps.dotCount = {};
      ps.dotCount[cardId] = (ps.dotCount[cardId] ?? 0) + 1;
      renderScenarioView();
    });
  });

  // Mat flip
  document.getElementById('sv-mat-flip')?.addEventListener('click', () => {
    const front = document.getElementById('sv-mat-front');
    const classId = sv.scenario.scenario_party[sv.activePartyIdx]?.characters?.class_id;
    const classData = CLASS_REGISTRY?.[classId];
    const frontUrl = `https://raw.githubusercontent.com/any2cards/worldhaven/master/images/character-mats/crimson-scales/cs-${classId}.png`;
    const backUrl  = `https://raw.githubusercontent.com/any2cards/worldhaven/master/images/character-mats/crimson-scales/cs-${classId}-back.png`;
    if (front.src.includes('-back.png')) {
      front.src = frontUrl;
    } else {
      front.src = backUrl;
    }
  });

  // GM absent management
  document.getElementById('sv-manage-absent')?.addEventListener('click', () => {
    const party = sv.scenario.scenario_party ?? [];
    const modalHtml = buildAbsentModal(party);
    const container = document.createElement('div');
    container.id = 'sv-absent-container';
    container.innerHTML = modalHtml;
    document.getElementById('scenario-view-overlay').appendChild(container);

    // Toggle absent checkbox enables/disables substitute select
    container.querySelectorAll('.sv-absent-check').forEach(chk => {
      chk.addEventListener('change', () => {
        const row = chk.closest('.sv-absent-row');
        const sel = row.querySelector('.sv-absent-sub');
        if (sel) sel.disabled = !chk.checked;
      });
    });

    // Close
    ['sv-absent-close', 'sv-absent-cancel'].forEach(id => {
      document.getElementById(id)?.addEventListener('click', () => container.remove());
    });

    // Save
    document.getElementById('sv-absent-save')?.addEventListener('click', async () => {
      try {
        const checks = container.querySelectorAll('.sv-absent-check');
        for (const chk of checks) {
          const partyId = chk.dataset.partyId;
          const isAbsent = chk.checked;
          const row = chk.closest('.sv-absent-row');
          const subSel = row.querySelector('.sv-absent-sub');
          const subId = (isAbsent && subSel?.value) ? subSel.value : null;
          await setAbsentPlayer(partyId, isAbsent, subId);
        }
        container.remove();
        renderScenarioView();
        showToast('Absent player assignments saved.');
      } catch (err) {
        showToast('Error: ' + err.message, true);
      }
    });
  });

  // Rest action handlers
  document.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      const { action, charId, cardId } = btn.dataset;
      const ps = sv.playState[charId];
      if (!ps) return;

      if (action === 'start-long') {
        ps.isLongResting = true;
        ps.restPhase = 'done';
        // Auto-ready the player
        const member = (sv.scenario.scenario_party ?? []).find(m => m.character_id === charId);
        if (member) sv.readyPlayers[member.player_id] = true;
        showToast('🌙 Long Rest selected — you are ready for the round.');
        renderScenarioView();
      }

      else if (action === 'start-short') {
        // Pick random candidate from discard
        if (!ps.discard.length) return;
        const idx = Math.floor(Math.random() * ps.discard.length);
        ps.restCandidate = ps.discard[idx];
        ps.restPhase = 'short-candidate';
        renderScenarioView();
      }

      else if (action === 'lose-candidate') {
        // Move candidate to lost, rest of discard → hand
        const candidate = ps.restCandidate;
        ps.lost.push(candidate);
        ps.discard = ps.discard.filter(id => id !== candidate);
        // Move remaining discard to hand (they're already in handCards, just clear discard)
        ps.discard = [];
        ps.restCandidate = null;
        ps.restPhase = 'done';
        showToast('Card lost. Discard moved to hand — select your two cards.');
        renderScenarioView();
      }

      else if (action === 'keep-candidate') {
        // Keep candidate → hand, draw second random, auto-lose after 5s
        const kept = ps.restCandidate;
        ps.discard = ps.discard.filter(id => id !== kept);
        // kept card stays in hand (already in handCards)
        showToast(`Kept ${kept}. −1 HP (update in Secretariat). Drawing second candidate...`, false);
        ps.restCandidate = null;
        ps.restPhase = 'short-candidate-2';
        renderScenarioView();
        // Pick second random from remaining discard
        if (ps.discard.length > 0) {
          const idx2 = Math.floor(Math.random() * ps.discard.length);
          const candidate2 = ps.discard[idx2];
          ps.restCandidate = candidate2;
          renderScenarioView();
          // Auto-lose after 5 seconds
          setTimeout(() => {
            ps.lost.push(candidate2);
            ps.discard = ps.discard.filter(id => id !== candidate2);
            ps.discard = []; // rest → hand
            ps.restCandidate = null;
            ps.restPhase = 'done';
            showToast('Second candidate lost. Discard moved to hand — select your two cards.');
            renderScenarioView();
          }, 5000);
        } else {
          ps.restPhase = 'done';
          renderScenarioView();
        }
      }

      else if (action === 'start-override') {
        ps.restPhase = 'short-override';
        renderScenarioView();
      }

      else if (action === 'override-select') {
        // Player chose which card to lose
        ps.lost.push(cardId);
        ps.discard = ps.discard.filter(id => id !== cardId);
        ps.discard = []; // rest → hand
        ps.restPhase = 'done';
        showToast('Card lost. Discard moved to hand — select your two cards.');
        renderScenarioView();
      }

      else if (action === 'cancel-rest') {
        ps.isLongResting = false;
        ps.restPhase = null;
        ps.restCandidate = null;
        // Un-ready the player if they were auto-readied by long rest
        const member = (sv.scenario.scenario_party ?? []).find(m => m.character_id === charId);
        if (member) sv.readyPlayers[member.player_id] = false;
        renderScenarioView();
      }
    });
  });

  // Rest cancel button
  document.querySelectorAll('.sv-rest-cancel-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const { charId } = btn.dataset;
      const ps = sv.playState[charId];
      if (!ps) return;
      ps.isLongResting = false;
      ps.restPhase = null;
      ps.restCandidate = null;
      const member = (sv.scenario.scenario_party ?? []).find(m => m.character_id === charId);
      if (member) sv.readyPlayers[member.player_id] = false;
      renderScenarioView();
    });
  });

  // Short Rest Override ability checkbox
  document.querySelectorAll('.sv-override-ability-check').forEach(chk => {
    chk.addEventListener('change', e => {
      const { charId } = chk.dataset;
      const ps = sv.playState[charId];
      if (ps) ps.hasOverrideAbility = chk.checked;
      renderScenarioView();
    });
  });

  // Declare Exhaustion button
  document.querySelectorAll('.sv-exhaust-btn').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      const { charId } = btn.dataset;
      if (!confirm('Declare exhaustion? All your hand, active, and discard cards will move to Lost.')) return;
      const ps = sv.playState[charId];
      if (!ps) return;
      // Move all active, discard, hand cards to lost
      ps.lost.push(...ps.active, ...ps.discard);
      ps.active = [];
      ps.discard = [];
      // handCards stay in handCards array but are all "lost" now
      // Track which handCards are lost by adding all to lost pile
      const playedOrLost = new Set([...ps.lost]);
      (ps.handCards ?? []).forEach(dc => {
        if (!playedOrLost.has(dc.card_id)) ps.lost.push(dc.card_id);
      });
      await saveExhaustedForChar(charId, true);
      // Un-ready player
      const member = (sv.scenario.scenario_party ?? []).find(m => m.character_id === charId);
      if (member) sv.readyPlayers[member.player_id] = false;
      showToast('💀 Exhausted. All cards moved to Lost.');
      renderScenarioView();
    });
  });

  // Check for forced exhaustion at start of select phase
  if (sv.roundPhase === 'select') {
    (sv.scenario.scenario_party ?? []).forEach(member => {
      const charId = member.character_id;
      const ps = sv.playState[charId];
      if (!ps || ps.isExhausted) return;
      const handCount = Math.max(0, (ps.handCards ?? []).length - ps.active.length - ps.discard.length - ps.lost.length);
      const discardCount = ps.discard.length;
      if (handCount < 2 && discardCount < 2) {
        // Force exhaustion
        (async () => {
          ps.lost.push(...ps.active, ...ps.discard);
          ps.active = [];
          ps.discard = [];
          (ps.handCards ?? []).forEach(dc => {
            if (!ps.lost.includes(dc.card_id)) ps.lost.push(dc.card_id);
          });
          await saveExhaustedForChar(charId, true);
          showToast(`💀 ${member.player?.player_name ?? 'A player'} is exhausted — not enough cards to continue.`);
          renderScenarioView();
        })();
      }
    });
  }

  // GM Begin Round button
  document.getElementById('sv-begin-round')?.addEventListener('click', async () => {
    sv.roundPhase = 'play';
    const newRound = (sv.scenario.round_number ?? 0) + 1;
    await saveRoundNumber(newRound);
    renderScenarioView();
    showToast(`⚔️ Round ${newRound} begun! Cards are locked in.`);
  });

  // GM New Round button — reset ready states and selection for next round
  document.getElementById('sv-new-round')?.addEventListener('click', async () => {
    sv.roundPhase = 'select';
    sv.readyPlayers = {};
    sv.selectedCards = {};
    // Clear long rest flags for next round
    Object.values(sv.playState).forEach(ps => {
      ps.isLongResting = false;
      ps.restPhase = null;
      ps.restCandidate = null;
    });
    // Save all play states at end of round
    await saveAllPlayStates();
    renderScenarioView();
    showToast(`🔄 Round ${sv.scenario.round_number} — select your cards.`);
  });

  // GM cancel
  document.getElementById('sv-cancel-scenario')?.addEventListener('click', async () => {
    if (!confirm('Cancel this scenario? This will abandon the scenario.')) return;
    try {
      await sb().from('scenarios').update({ status: 'abandoned' }).eq('id', sv.scenario.id);
      await updateCampaignPhase(sv.campaign.id, 'city', 'downtime');
      closeScenarioView();
      await loadCampaigns();
      showToast('Scenario cancelled.');
    } catch (err) {
      showToast('Error: ' + err.message, true);
    }
  });

  // GM pause
  document.getElementById('sv-pause-scenario')?.addEventListener('click', async () => {
    try {
      // Save all play states before pausing
      await saveAllPlayStates();
      await sb().from('scenarios').update({ status: 'paused' }).eq('id', sv.scenario.id);
      closeScenarioView();
      await loadCampaigns();
      showToast('Scenario paused. Resume from the campaign panel.');
    } catch (err) {
      showToast('Error: ' + err.message, true);
    }
  });

  // Tips carousel
  bindTipsCarousel();

  // Spacebar zoom — rebind mouseenter/leave on ALL card images in the view
  document.querySelectorAll('.sv-card-img, .sv-tracker-img, .sv-pile-card, .sv-rest-card-img, .sv-rest-override-card img, .sv-active-card img, .sv-mat-img').forEach(img => {
    img.addEventListener('mouseenter', () => { sv._hoveredCardImg = img.src; });
    img.addEventListener('mouseleave', () => { sv._hoveredCardImg = null; });
  });

  // Drag-to-reorder initiative (GM only)
  if (sv.isGM) {
    bindInitiativeDragDrop();
  }
}

// ── Initiative drag/drop ──────────────────────────────────────────
function bindInitiativeDragDrop() {
  const container = document.getElementById('sv-init-items');
  if (!container) return;
  let dragIdx = null;

  container.querySelectorAll('.sv-init-item').forEach(item => {
    item.addEventListener('dragstart', () => { dragIdx = parseInt(item.dataset.partyIdx); });
    item.addEventListener('dragover', e => { e.preventDefault(); item.classList.add('sv-drag-over'); });
    item.addEventListener('dragleave', () => { item.classList.remove('sv-drag-over'); });
    item.addEventListener('drop', e => {
      e.preventDefault();
      item.classList.remove('sv-drag-over');
      const dropIdx = parseInt(item.dataset.partyIdx);
      if (dragIdx === null || dragIdx === dropIdx) return;
      // Reorder party
      const party = sv.scenario.scenario_party;
      const [moved] = party.splice(dragIdx, 1);
      party.splice(dropIdx, 0, moved);
      renderScenarioView();
    });
  });
}

// ── Close scenario view ───────────────────────────────────────────
// ── One-time spacebar zoom setup ─────────────────────────────────
function initSpacebarZoom(overlayEl) {
  // Remove any previous zoom overlay
  const existing = document.getElementById('sv-zoom-overlay');
  if (existing) existing.remove();

  const zoomOverlay = document.createElement('div');
  zoomOverlay.id = 'sv-zoom-overlay';
  zoomOverlay.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9999;align-items:center;justify-content:center;';
  const zoomImg = document.createElement('img');
  zoomImg.style.cssText = 'max-height:90vh;max-width:90vw;border-radius:8px;box-shadow:0 0 40px rgba(0,0,0,0.8);';
  zoomOverlay.appendChild(zoomImg);
  overlayEl.appendChild(zoomOverlay);
  zoomOverlay.addEventListener('click', () => {
    document.getElementById('sv-zoom-overlay').style.display = 'none';
  });

  // Use named handlers so they can be removed on close
  sv._zoomKeydown = e => {
    if (e.code === 'Space' && sv._hoveredCardImg) {
      e.preventDefault();
      const zo = document.getElementById('sv-zoom-overlay');
      const zi = zo?.querySelector('img');
      if (zi) { zi.src = sv._hoveredCardImg; zo.style.display = 'flex'; }
    }
  };
  sv._zoomKeyup = e => {
    if (e.code === 'Space') {
      const zo = document.getElementById('sv-zoom-overlay');
      if (zo) zo.style.display = 'none';
    }
  };
  document.addEventListener('keydown', sv._zoomKeydown);
  document.addEventListener('keyup', sv._zoomKeyup);
}

function closeScenarioView() {
  if (sv.tipTimer) { clearInterval(sv.tipTimer); sv.tipTimer = null; }
  if (sv._zoomKeydown) { document.removeEventListener('keydown', sv._zoomKeydown); sv._zoomKeydown = null; }
  if (sv._zoomKeyup)   { document.removeEventListener('keyup',   sv._zoomKeyup);   sv._zoomKeyup = null; }
  const overlay = document.getElementById('scenario-view-overlay');
  if (overlay) { overlay.style.display = 'none'; overlay.innerHTML = ''; }
}
