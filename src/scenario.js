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
const GENERIC_BACK   = 'cs-pq-back.png'; // fallback for unknown classes

function getCardBack(classId)   { return CARD_BACK_ASSETS[classId]?.ability ?? GENERIC_BACK; }
function getMsBack(classId)     { return CARD_BACK_ASSETS[classId]?.msBack   ?? GENERIC_BACK; }
function getMsaBack(classId)    { return CARD_BACK_ASSETS[classId]?.msaBack  ?? GENERIC_BACK; }
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
  for (const member of party) {
    const charId = member.character_id;

    // Fetch hand cards
    const { data: cards } = await sb()
      .from('character_cards')
      .select('*')
      .eq('character_id', charId)
      .eq('in_hand', true);

    // Fetch character_state for tracker data
    const { data: stateRow } = await sb()
      .from('character_state')
      .select('*')
      .eq('character_id', charId)
      .maybeSingle();

    if (!sv.playState[charId]) sv.playState[charId] = { hand: [], active: [], discard: [], lost: [], handCards: [], chargeMap: {}, dotCount: {} };
    sv.playState[charId].handCards = cards ?? [];
    sv.playState[charId].stateId = stateRow?.id ?? null;
    sv.playState[charId].milestoneChecks = stateRow?.milestone_checks ?? 0;
    sv.playState[charId].milestoneEarned = stateRow?.milestone_earned ?? false;
    sv.playState[charId].pqChecks = stateRow?.pq_checks ?? 0;
    sv.playState[charId].pqCompleted = stateRow?.pq_completed ?? false;
  }
}

// ── Save tracker state to DB ──────────────────────────────────────
async function saveMilestoneChecksForChar(charId, checks) {
  const ps = sv.playState[charId];
  if (!ps?.stateId) return;
  await sb().from('character_state').update({ milestone_checks: checks }).eq('id', ps.stateId);
  ps.milestoneChecks = checks;
}

async function earnMilestoneForChar(charId) {
  const ps = sv.playState[charId];
  if (!ps?.stateId) return;
  await sb().from('character_state').update({ milestone_earned: true }).eq('id', ps.stateId);
  ps.milestoneEarned = true;
}

async function savePqChecksForChar(charId, checks) {
  const ps = sv.playState[charId];
  if (!ps?.stateId) return;
  await sb().from('character_state').update({ pq_checks: checks }).eq('id', ps.stateId);
  ps.pqChecks = checks;
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

  // Build initial play state for each party member
  sv.playState = {};
  (scenario.scenario_party ?? []).forEach(member => {
    if (!sv.playState[member.character_id]) {
      sv.playState[member.character_id] = { hand: [], active: [], discard: [], lost: [], handCards: [] };
    }
  });

  // Fetch hand cards for each party member from character_cards table
  await loadPartyHandCards(scenario.scenario_party ?? []);

  // Set active party index to current player's character if possible
  if (myPlayer) {
    const myMemberIdx = (scenario.scenario_party ?? []).findIndex(m => m.player_id === myPlayer.id);
    if (myMemberIdx >= 0) sv.activePartyIdx = myMemberIdx;
  }

  renderScenarioView();
}

// ── Main renderer ─────────────────────────────────────────────────
function renderScenarioView() {
  const overlay = document.getElementById('scenario-view-overlay');
  if (!overlay) return;
  overlay.innerHTML = buildScenarioViewHTML();
  overlay.style.display = 'flex';
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
  return `
    <div class="sv-banner">
      <div class="sv-banner-main">
        <span class="sv-scenario-num">Scenario ${s.scenario_number}</span>
        <span class="sv-scenario-name">${s.scenario_name}</span>
      </div>
      ${s.scenario_goal ? `<div class="sv-scenario-goal">${s.scenario_goal}</div>` : ''}
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
    return `
      <div class="sv-init-item${initiative ? ' sv-init-revealed' : ' sv-init-unrevealed'}${isReady ? ' sv-init-ready' : ''}"
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
    <div class="sv-play-area" id="sv-play-area">
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
        <div class="sv-zone-label">Hand (${handCards.length - ps.active.length - ps.discard.length - ps.lost.length} remaining)</div>
        <div class="sv-hand-cards" id="sv-hand-cards">
          ${buildHandCards(handCards, classId, charId, ps, isPeeking)}
        </div>
      </div>

      <!-- Trackers row -->
      ${buildTrackerRow(member, classId, classData, isPeeking)}

      <!-- Play Tips -->
      ${!isPeeking ? buildPlayTips(classId, member) : ''}
    </div>`;
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
    const bgChecked = ps.bgChecked ?? false;
    return `
      <div class="sv-tracker-card sv-tracker-bg">
        <div class="sv-tracker-label">🎯 Battle Goal${bgData ? ` — ${bgData.checks === 2 ? '★★' : '★'}` : ''}</div>
        <img src="${bgDisplayImg}" class="sv-tracker-img sv-zoomable" alt="${bgTitle}" onerror="this.src='${BG_BACK}'">
        ${!isPeeking ? `<div class="sv-tracker-checks" style="margin-top:4px">
          <button class="sv-check-box ${bgChecked ? 'sv-check-filled' : ''}"
            data-tracker="bg" data-char-id="${charId}">${bgChecked ? '✓' : ''}</button>
          <span style="font-size:11px;color:#888;margin-left:6px">${bgChecked ? 'Goal achieved!' : 'Mark if achieved'}</span>
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

  // Auto-rotate every 10 seconds
  if (sv.tipTimer) clearInterval(sv.tipTimer);
  sv.tipTimer = setInterval(() => showTip(sv.tipIndex + 1), 10000);
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

  // Initiative icon click — toggle ready state
  const myPlayer = getEffectivePlayer(sv.campaign.players ?? []);
  document.querySelectorAll('.sv-init-item').forEach(item => {
    item.addEventListener('click', () => {
      const playerId = item.dataset.playerId;
      // Only current player can toggle their own ready (or GM in dev)
      if (!myPlayer && !IS_DEV) return;
      if (myPlayer && myPlayer.id !== playerId && !IS_DEV) return;

      // Cannot toggle if GM has already started the round
      if (sv.roundPhase === 'play') return;

      const currentlyReady = sv.readyPlayers[playerId] ?? false;

      if (!currentlyReady) {
        // Going green — must have 2 cards selected
        // Find the party member for this player
        const member = (sv.scenario.scenario_party ?? []).find(m => m.player_id === playerId);
        if (!member) return;
        const charId = member.character_id;
        const selected = sv.selectedCards[charId] ?? [];
        if (selected.length < 2) {
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
        ps.bgChecked = !(ps.bgChecked ?? false);
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

  // GM Begin Round button
  document.getElementById('sv-begin-round')?.addEventListener('click', () => {
    sv.roundPhase = 'play';
    renderScenarioView();
    showToast('⚔️ Round begun! Cards are locked in.');
  });

  // GM New Round button — reset ready states and selection for next round
  document.getElementById('sv-new-round')?.addEventListener('click', () => {
    sv.roundPhase = 'select';
    sv.readyPlayers = {};
    sv.selectedCards = {};
    renderScenarioView();
    showToast('🔄 New round started — select your cards.');
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

  // Spacebar zoom — hover over any card and hold spacebar to zoom
  let hoveredCardImg = null;
  document.querySelectorAll('.sv-card-img, .sv-tracker-img, .sv-pile-card').forEach(img => {
    img.addEventListener('mouseenter', () => { hoveredCardImg = img.src; });
    img.addEventListener('mouseleave', () => { hoveredCardImg = null; });
  });

  const zoomOverlay = document.createElement('div');
  zoomOverlay.id = 'sv-zoom-overlay';
  zoomOverlay.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9999;align-items:center;justify-content:center;';
  const zoomImg = document.createElement('img');
  zoomImg.style.cssText = 'max-height:90vh;max-width:90vw;border-radius:8px;box-shadow:0 0 40px rgba(0,0,0,0.8);';
  zoomOverlay.appendChild(zoomImg);
  document.getElementById('scenario-view-overlay').appendChild(zoomOverlay);

  document.addEventListener('keydown', e => {
    if (e.code === 'Space' && hoveredCardImg) {
      e.preventDefault();
      zoomImg.src = hoveredCardImg;
      zoomOverlay.style.display = 'flex';
    }
  });
  document.addEventListener('keyup', e => {
    if (e.code === 'Space') {
      zoomOverlay.style.display = 'none';
    }
  });
  zoomOverlay.addEventListener('click', () => { zoomOverlay.style.display = 'none'; });

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
function closeScenarioView() {
  if (sv.tipTimer) { clearInterval(sv.tipTimer); sv.tipTimer = null; }
  const overlay = document.getElementById('scenario-view-overlay');
  if (overlay) { overlay.style.display = 'none'; overlay.innerHTML = ''; }
}
