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
  activePlayerId: null,   // which player's play area is showing (by player_id)
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
    sb().from('character_state').select('id, character_id, milestone_checks, milestone_earned, pq_checks, pq_completed, pq_group_checks, notes').in('character_id', charIds),
    sb().from('scenario_party').select('battle_goal_completed, is_exhausted, play_state, character_id, id, looted_treasure, pq_checks_start, milestone_checks_start, is_ready').eq('scenario_id', sv.scenario.id).in('character_id', charIds),
  ]);

  for (const member of party) {
    const charId = member.character_id;
    const cards    = (allCards   ?? []).filter(c => c.character_id === charId);
    const stateRow = (allStates  ?? []).find(s => s.character_id === charId); // includes pq_group_checks via select *
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
      pqGroupChecks:   stateRow?.pq_group_checks ?? {},
      notes:           stateRow?.notes ?? '',
      bgCompleted:     partyRow?.battle_goal_completed ?? false,
      isExhausted:     partyRow?.is_exhausted ?? false,
      isLongResting:   savedState.isLongResting ?? false,
      hasOverrideAbility: savedState.hasOverrideAbility ?? false,
      hasActiveNonLoss: savedState.hasActiveNonLoss ?? false,
      restPhase:       savedState.restPhase ?? null,
      restCandidate:   savedState.restCandidate ?? null,
      lootedTreasure:  partyRow?.looted_treasure ?? false,
      // Start snapshots for abandon rollback (only set on first load, not resume)
      pqChecksStart:      partyRow?.pq_checks_start ?? stateRow?.pq_checks ?? 0,
      milestoneChecksStart: partyRow?.milestone_checks_start ?? stateRow?.milestone_checks ?? 0,
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

async function saveNotesForChar(charId, text) {
  const ps = sv.playState[charId];
  if (!ps?.stateId) return;
  const trimmed = text.slice(0, 1024);
  await sb().from('character_state').update({ notes: trimmed }).eq('id', ps.stateId);
  ps.notes = trimmed;
}

async function savePqChecksForChar(charId, checks, groupChecks) {
  const ps = sv.playState[charId];
  if (!ps?.stateId) return;
  const update = { pq_checks: checks };
  if (groupChecks !== undefined) update.pq_group_checks = groupChecks;
  await sb().from('character_state').update(update).eq('id', ps.stateId);
  ps.pqChecks = checks;
  if (groupChecks !== undefined) ps.pqGroupChecks = groupChecks;
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
async function saveReadyState(playerId, isReady) {
  const member = (sv.scenario?.scenario_party ?? []).find(m => m.player_id === playerId);
  if (!member?.id) return;
  await sb().from('scenario_party').update({ is_ready: isReady }).eq('id', member.id);
  // Update local scenario_party reference
  member.is_ready = isReady;
}

async function savePlayStateForChar(charId) {
  const ps = sv.playState[charId];
  if (!ps) return;

  // Look up the party row ID directly rather than relying on cached partyRowId
  // This handles cases where partyRowId wasn't set correctly on load
  let rowId = ps.partyRowId;
  if (!rowId) {
    const { data: partyRow } = await sb()
      .from('scenario_party')
      .select('id')
      .eq('scenario_id', sv.scenario.id)
      .eq('character_id', charId)
      .maybeSingle();
    rowId = partyRow?.id ?? null;
    if (rowId) ps.partyRowId = rowId; // cache it for future saves
  }
  if (!rowId) return; // truly not found
  const member = (sv.scenario?.scenario_party ?? []).find(m => m.character_id === charId);
  const stateToSave = {
    active:             ps.active,
    discard:            ps.discard,
    lost:               ps.lost,
    chargeMap:          ps.chargeMap,
    dotCount:           ps.dotCount,
    isLongResting:      ps.isLongResting,
    hasOverrideAbility: ps.hasOverrideAbility,
    hasActiveNonLoss:   ps.hasActiveNonLoss,
    restPhase:          ps.restPhase,
    restCandidate:      ps.restCandidate,
    // Persist selected cards so GM can read all players' initiatives at Begin Round
    selectedCards:      sv.selectedCards[charId] ?? [],
  };
  const result = await sb().from('scenario_party')
    .update({ play_state: stateToSave })
    .eq('id', rowId)
    .select('id');
  if (result.error) throw new Error(`play_state save failed: ${result.error.message}`);
  if (!result.data || result.data.length === 0) throw new Error(`play_state save matched 0 rows (rowId=${rowId})`);
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

async function broadcastToast(msg, delayMs = 0) {
  if (!sv.scenario?.id) return;
  const fire = async () => {
    showToast(msg);
    await sb().from('scenarios')
      .update({ toast_message: msg, toast_at: new Date().toISOString() })
      .eq('id', sv.scenario.id);
  };
  if (delayMs > 0) setTimeout(fire, delayMs);
  else await fire();
}

async function saveRoundPhase(phase) {
  sv.roundPhase = phase;
  await sb().from('scenarios').update({ scenario_step: phase }).eq('id', sv.scenario.id);
}

async function saveInitiativeOrder() {
  // Save ordered player IDs to scenarios table
  const order = (sv.scenario.scenario_party ?? []).map(m => m.player_id);
  await sb().from('scenarios').update({ initiative_order: JSON.stringify(order) }).eq('id', sv.scenario.id);
  sv.scenario.initiative_order = JSON.stringify(order);
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

// ── Global mobile-friendly handlers ──────────────────────────────
// These are called via inline onclick for iPad/touch compatibility
window._handlePlayCard = async function(cardId, charId) {
  showToast(`▶ Playing card...`);
  if (!sv.playState[charId]) sv.playState[charId] = { hand: [], active: [], discard: [], lost: [], handCards: [] };
  if (sv.playState[charId].active.includes(cardId)) return; // guard double-fire
  sv.playState[charId].active.push(cardId);
  if (sv.selectedCards[charId]) {
    sv.selectedCards[charId] = sv.selectedCards[charId].filter(id => id !== cardId);
  }
  renderScenarioView();
  try {
    await savePlayStateForChar(charId);
    showToast(`✓ Card played`);
  } catch(err) {
    showToast('⚠️ Sync error: ' + err.message, true);
  }
};

window._handleMoveCard = async function(dest, cardId, charId) {
  const ps = sv.playState[charId];
  if (!ps) return;
  if (dest === 'discard' && ps.discard.includes(cardId)) return;
  if (dest === 'lost' && ps.lost.includes(cardId)) return;
  ps.active = ps.active.filter(n => n !== cardId);
  if (dest === 'discard') ps.discard.push(cardId);
  else if (dest === 'lost') ps.lost.push(cardId);
  // Reset charge dots so card plays fresh if returned to active later
  if (ps.chargeMap) delete ps.chargeMap[cardId];
  if (ps.dotCount) delete ps.dotCount[cardId];
  renderScenarioView();
  try { await savePlayStateForChar(charId); }
  catch(err) { showToast('⚠️ Sync error: ' + err.message, true); }
};

// Self-test: fires a toast 3s after scenario opens to confirm JS+toast works on this browser
window._scenarioSelfTest = function() {
  setTimeout(() => showToast('✓ JS running on this browser'), 3000);
};

// ── Entry point ───────────────────────────────────────────────────
async function openScenarioView(scenario, campaign) {
  sv.scenario = scenario;
  sv.campaign = campaign;

  // Determine if current user is GM
  const myPlayer = getEffectivePlayer(campaign.players ?? []);
  // isGM: true only if this player created the scenario
  // In dev mode with no player selected, treat as GM for testing
  sv.isGM = myPlayer
    ? myPlayer.id === scenario.gm_player_id
    : IS_DEV;

  // Reset all local state for new scenario
  sv.playState = {};
  sv.selectedCards = {};
  sv.readyPlayers = {};
  sv.roundPhase = 'select';
  sv.tipIndex = 0;
  sv.currentTips = [];
  if (sv.tipTimer) { clearInterval(sv.tipTimer); sv.tipTimer = null; }
  await loadPartyHandCards(scenario.scenario_party ?? []);

  // Set active player — match current user against scenario party
  if (myPlayer) {
    const myMember = (scenario.scenario_party ?? []).find(m => m.player_id === myPlayer.id);
    if (myMember) sv.activePlayerId = myMember.player_id;
  }
  // Fallback: try matching by email against party's player records
  if (!sv.activePlayerId) {
    const currentEmail = window.currentUser?.email ?? null;
    if (currentEmail) {
      const myMember = (scenario.scenario_party ?? []).find(m =>
        m.player?.player_email === currentEmail
      );
      if (myMember) sv.activePlayerId = myMember.player_id;
    }
  }
  // Final fallback: use first party member (solo or unmatched)
  if (!sv.activePlayerId && scenario.scenario_party?.length) {
    sv.activePlayerId = scenario.scenario_party[0].player_id;
  }

  // Restore ready states from DB
  sv.readyPlayers = {};
  (scenario.scenario_party ?? []).forEach(m => {
    if (m.is_ready) sv.readyPlayers[m.player_id] = true;
  });

  // Restore round phase from DB
  sv.roundPhase = scenario.scenario_step === 'play' ? 'play' : 'select';

  // Store stable join order for player tabs (never reordered)
  // Always reset join order on scenario open to get correct order
  // Use DB creation order (scenario_party rows are ordered by created_at)
  sv.joinOrder = (scenario.scenario_party ?? []).map(m => m.player_id);

  // Restore initiative order if saved
  if (scenario.initiative_order) {
    try {
      const order = JSON.parse(scenario.initiative_order);
      const party = scenario.scenario_party ?? [];
      const sorted = order
        .map(pid => party.find(m => m.player_id === pid))
        .filter(Boolean);
      // Add any members not in saved order at end
      party.forEach(m => { if (!sorted.includes(m)) sorted.push(m); });
      sv.scenario.scenario_party = sorted;
    } catch (e) { /* ignore parse errors */ }
  }

  const overlayEl = document.getElementById('scenario-view-overlay');
  renderScenarioView();
  initSpacebarZoom(overlayEl);
  startPolling();
  // Broadcast opening instruction to all players
  broadcastToast('🃏 Select two cards to play', 1500);
  // Pause campaign polling while in scenario view
  if (typeof campaignPollTimer !== 'undefined' && campaignPollTimer) {
    clearInterval(campaignPollTimer);
  }
}

// ── Main renderer ─────────────────────────────────────────────────
function renderScenarioView() {
  const overlay = document.getElementById('scenario-view-overlay');
  if (!overlay) return;
  // Preserve scroll position and zoom overlay across re-renders
  const zoomOverlay = document.getElementById('sv-zoom-overlay');
  const playContent = document.getElementById('sv-play-content');
  const savedScrollTop = playContent?.scrollTop ?? 0;
  overlay.innerHTML = buildScenarioViewHTML();
  overlay.style.display = 'flex';
  if (zoomOverlay) overlay.appendChild(zoomOverlay);
  // Restore scroll position
  const newPlayContent = document.getElementById('sv-play-content');
  if (newPlayContent && savedScrollTop) newPlayContent.scrollTop = savedScrollTop;
  bindScenarioViewEvents();
}

function buildScenarioViewHTML() {
  const s = sv.scenario;
  const party = s.scenario_party ?? [];

  return `
    <div class="sv-container">
      ${buildScenarioBanner(s)}
      ${buildInitiativeTracker(party)}
      <div class="sv-main-layout">
        <div class="sv-left-tabs">
          ${buildPlayerTabs(party)}
        </div>
        <div class="sv-play-content" id="sv-play-content">
          ${buildPlayArea(party)}
        </div>
      </div>
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

  // GM scenario management buttons — in banner, right side
  const canEndScenario = !sv.isGM ? '' :
    (sv.roundPhase !== 'play' && (s.round_number ?? 0) >= 1)
      ? `<button class="sv-banner-btn sv-banner-btn-gold" id="sv-end-scenario">🏁 End</button>` : '';
  const gmBannerBtns = sv.isGM ? `
    <div class="sv-banner-gm-btns">
      ${canEndScenario}
      <button class="sv-banner-btn" id="sv-pause-scenario">⏸</button>
      <button class="sv-banner-btn sv-banner-btn-danger" id="sv-cancel-scenario">✕</button>
    </div>` : '';

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
        <div class="sv-banner-right">
          <div class="sv-round-track" id="sv-round-track">
            ${roundBoxes}
          </div>
          ${gmBannerBtns}
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
    const charName = member.characters?.character_name || playerName;
    return `
      <div class="sv-init-item${initiative ? ' sv-init-revealed' : ' sv-init-unrevealed'}${isReady ? ' sv-init-ready' : ''}${isExhausted ? ' sv-init-exhausted' : ''}"
           data-party-idx="${i}"
           data-player-id="${member.player_id}"
           draggable="${sv.isGM ? 'true' : 'false'}">
        <div class="sv-init-icon" style="border-color: var(--class-color-${classId}, #c9a84c)">
          ${assets.token ? `<img src="${assets.token}" class="sv-init-token-img" alt="">` :
            `<div class="sv-init-placeholder">${classId[0]?.toUpperCase() ?? '?'}</div>`}
        </div>
        <div class="sv-init-name">${charName}</div>
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

  // Use stable join order for tabs, not initiative order
  const joinOrder = sv.joinOrder ?? party.map(m => m.player_id);
  const orderedParty = joinOrder
    .map(pid => party.find(m => m.player_id === pid))
    .filter(Boolean);
  // Add any members not in join order
  party.forEach(m => { if (!orderedParty.includes(m)) orderedParty.push(m); });

  const tabs = orderedParty.map((member, i) => {
    const cls = member.characters;
    const classId = cls?.class_id ?? '';
    const playerName = member.player?.player_name ?? '?';
    const isActive = member.player_id === sv.activePlayerId;
    const isAbsent = member.is_absent;
    const isMyChar = member.player_id === myPlayerId;
    const isSubstitute = isAbsent && member.substitute_player_id === myPlayerId;
    const isMyArea = isMyChar || isSubstitute;

    // Green highlight for own player or assigned absentee
    const myHighlight = isMyChar ? ' sv-tab-mine' : isSubstitute ? ' sv-tab-substitute' : '';
    const absentBadge = isAbsent
      ? `<span class="sv-tab-absent${isSubstitute ? ' sv-tab-absent-mine' : ''}">ABSENT</span>`
      : '';
    const peekIcon = !isMyArea && !isActive ? '<span class="sv-tab-peek">👁</span>' : '';

    return `
      <button class="sv-player-tab${isActive ? ' sv-player-tab-active' : ''}${isAbsent ? ' sv-tab-is-absent' : ''}${myHighlight}"
          data-player-id="${member.player_id}">
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
  const member = party.find(m => m.player_id === sv.activePlayerId) ?? party[0];
  if (!member) return '<div class="sv-play-area"><p style="color:#888">No party member selected</p></div>';

  const cls = member.characters;
  const classId = cls?.class_id ?? '';
  const charId = member.character_id;
  const myPlayer = getEffectivePlayer(sv.campaign.players ?? []);
  const myPlayerId = myPlayer?.id ?? null;

  // isMyArea: true if this is my own character, OR I am the assigned substitute for an absent player
  // In dev mode with no player selected, treat the active tab as own area
  const isMyChar = myPlayerId ? member.player_id === myPlayerId : true; // dev mode: all areas are own
  const isSubstitute = member.is_absent && member.substitute_player_id === myPlayerId;
  const isMyArea = isMyChar || isSubstitute || (IS_DEV && !myPlayerId);
  const isPeeking = !isMyArea;
  const ps = sv.playState[charId] ?? { hand: [], active: [], discard: [], lost: [] };

  // Get hand cards from character_cards (in_hand = true)
  const classData = CLASS_REGISTRY?.[classId];
  const handCards = ps.handCards ?? [];

  return `
    <div class="sv-play-area${ps.isExhausted ? ' sv-play-area-exhausted' : ''}" id="sv-play-area">
      ${isPeeking ? `<div class="sv-peek-banner">👁 Viewing ${member.player?.player_name ?? '?'}'s play area</div>` : ''}

      <!-- Top action bar: Negate Damage + Declare Exhaustion -->
      ${!ps.isExhausted ? `
        <div class="sv-action-bar">
          ${!isPeeking ? buildNegateDamageCompact(charId, ps) : ''}
          <button class="sv-exhaust-btn" data-char-id="${charId}">💀 Declare Exhaustion</button>
        </div>` : ''}
      ${ps.isExhausted ? `<div class="sv-exhausted-banner">💀 Exhausted — no longer participating in scenario play</div>` : ''}

      <!-- Above mat: Active/Persistent zone -->
      <div class="sv-zone sv-zone-active">
        <div class="sv-zone-label">Active / Persistent</div>
        <div class="sv-zone-cards" id="sv-active-cards">
          ${ps.active.map(cardId => buildActiveCard(cardId, classId, charId, isPeeking)).join('')}
          ${ps.active.length === 0 ? '<div class="sv-zone-empty">Cards played this turn appear here</div>' : ''}
        </div>
      </div>

      <!-- Center row: Discard | Mat | Lost -->
      <div class="sv-center-row">
        <div class="sv-zone sv-zone-discard">
          <div class="sv-zone-label">Discard (${ps.discard.length})</div>
          <div class="sv-pile-stack">
            ${ps.discard.length > 0
              ? `<div class="sv-pile-clickable" data-pile="discard" data-char-id="${charId}">
                  <img src="${getCardBack(classId)}" class="sv-pile-card" alt="Discard pile">
                  <div class="sv-pile-count-badge">${ps.discard.length}</div>
                  ${!isPeeking ? '<div class="sv-pile-view-hint">👁 View</div>' : ''}
                </div>`
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
              ? `<div class="sv-pile-clickable${isPeeking ? ' sv-pile-no-click' : ''}" data-pile="lost" data-char-id="${charId}">
                  <img src="${getCardBack(classId)}" class="sv-pile-card" alt="Lost pile">
                  <div class="sv-pile-count-badge">${ps.lost.length}</div>
                  ${!isPeeking ? '<div class="sv-pile-view-hint">👁 View</div>' : ''}
                </div>`
              : '<div class="sv-zone-empty">—</div>'}
          </div>
        </div>
      </div>

      <!-- Staged cards (selected, waiting to play) -->
      ${!isPeeking ? buildStagedCards(handCards, classId, charId, ps) : ''}

      <!-- Hand cards -->
      <div class="sv-zone sv-zone-hand">
        <div class="sv-zone-label">Hand (${Math.max(0, handCards.length - ps.active.length - ps.discard.length - ps.lost.length - (sv.selectedCards[charId]?.length ?? 0))} remaining)</div>
        <div class="sv-hand-cards" id="sv-hand-cards">
          ${buildHandCards(handCards, classId, charId, ps, isPeeking)}
        </div>
      </div>

      <!-- Rest action UI -->
      ${!isPeeking && !ps.isExhausted ? buildRestUI(charId, ps) : ''}
    </div>

    <!-- Bottom drawer: trackers + tips -->
    ${buildBottomDrawer(member, classId, classData, charId, ps, isPeeking)}`; // drawer hides itself when peeking
}

// ── Rest UI ──────────────────────────────────────────────────────
function buildRestUI(charId, ps) {
  const discardCount = ps.discard.length;
  const handCount = (ps.handCards ?? []).length - ps.active.length - ps.discard.length - ps.lost.length;
  const hasActiveNonLoss = ps.hasActiveNonLoss ?? false;
  const effectiveDiscardCount = discardCount + (hasActiveNonLoss ? ps.active.length : 0);
  const canRest = effectiveDiscardCount >= 2;
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

  // Treasure tile checkbox — show only if player hasn't looted one yet
  const myMember = (sv.scenario?.scenario_party ?? []).find(m => m.character_id === charId);
  const playerTreasureLooted = myMember?.player
    ? (sv.campaign.players ?? []).find(p => p.id === myMember.player_id)?.treasure_looted ?? false
    : false;
  const scenarioTreasureLooted = ps.lootedTreasure ?? false;
  const showTreasureCheck = !playerTreasureLooted;

  const treasureCheck = showTreasureCheck ? `
    <label class="sv-override-check-label">
      <input type="checkbox" class="sv-treasure-check" data-char-id="${charId}" ${scenarioTreasureLooted ? 'checked' : ''}>
      🗝️ I looted a treasure tile this scenario
    </label>` : '';

  // Player state checkboxes — always visible regardless of rest availability
  const overrideCheck = `
    <label class="sv-override-check-label">
      <input type="checkbox" class="sv-override-ability-check" data-char-id="${charId}" ${ps.hasOverrideAbility ? 'checked' : ''}>
      I have Short Rest Override ability
    </label>`;

  const activeNonLossCheck = ps.active.length > 0 ? `
    <label class="sv-override-check-label">
      <input type="checkbox" class="sv-active-nonloss-check" data-char-id="${charId}" ${ps.hasActiveNonLoss ? 'checked' : ''}>
      I have non-loss persistent cards in my active area (count toward discard for Long Rest)
    </label>` : '';

  const overrideOption = ps.hasOverrideAbility
    ? `<button class="sv-rest-btn sv-rest-override-btn" data-char-id="${charId}" data-action="start-override">⚡ Short Rest (Override)</button>`
    : '';

  // Show rest buttons only when canRest
  const restButtons = canRest ? `
    <div class="sv-rest-actions">
      <button class="sv-rest-btn sv-rest-short" data-char-id="${charId}" data-action="start-short">🎲 Short Rest</button>
      ${overrideOption}
      <button class="sv-rest-btn sv-rest-long" data-char-id="${charId}" data-action="start-long">🌙 Long Rest</button>
    </div>` : '';

  return `
    <div class="sv-rest-area${mustRest ? ' sv-rest-required' : ''}">
      <div class="sv-rest-title">${mustRest ? '⚠️ Must Rest — not enough cards to play' : canRest ? '💤 Rest available' : '💤 Rest options'}</div>
      ${treasureCheck}
      ${overrideCheck}
      ${activeNonLossCheck}
      ${restButtons}
    </div>`;
}

function getClassIdForChar(charId) {
  const member = (sv.scenario?.scenario_party ?? []).find(m => m.character_id === charId);
  return member?.characters?.class_id ?? '';
}

function getCardDataById(charId, cardId) {
  if (!cardId) return null;
  const classId = getClassIdForChar(charId);
  const classData = CLASS_REGISTRY?.[classId];
  if (!classData) return null;
  const found = classData.cards?.find(c => {
    if (c.id === cardId) return true;
    if (c.name === cardId) return true;
    // slugify match: "Chokehold" -> "chokehold"
    if (c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g,'') === cardId) return true;
    // imageUrl filename match: extract slug from URL
    const urlSlug = c.imageUrl?.split('/').pop()?.replace(/\.jpe?g$/i,'') ?? '';
    if (urlSlug === cardId) return true;
    return false;
  }) ?? null;
  if (!found) console.warn(`[CSKB] Card not found: classId=${classId} cardId=${cardId}`);
  return found;
}

// ── Compact negate damage (for action bar) ───────────────────────
function buildNegateDamageCompact(charId, ps) {
  const selectedCards = sv.selectedCards[charId] ?? [];
  const playedOrLostOrSelected = new Set([...ps.active, ...ps.discard, ...ps.lost, ...selectedCards]);
  const handCount = Math.max(0, (ps.handCards ?? []).filter(dc => !playedOrLostOrSelected.has(dc.card_id)).length);
  const discardCount = ps.discard.length;
  const canNegateHand = handCount >= 1;
  const canNegateDiscard = discardCount >= 2;
  if (!canNegateHand && !canNegateDiscard) return '';
  return `
    <div class="sv-negate-compact">
      <span class="sv-negate-compact-label">🛡️</span>
      ${canNegateHand ? `<button class="sv-negate-compact-btn" data-char-id="${charId}" data-action="negate-hand" title="Negate: lose 1 hand card">Hand ×1</button>` : ''}
      ${canNegateDiscard ? `<button class="sv-negate-compact-btn" data-char-id="${charId}" data-action="negate-discard" title="Negate: lose 2 discard cards">Discard ×2</button>` : ''}
    </div>`;
}

// ── Bottom drawer: trackers + tips ───────────────────────────────
function buildBottomDrawer(member, classId, classData, charId, ps, isPeeking) {
  const isOpen = sv.drawerOpen ?? false;
  const activeTab = sv.drawerTab ?? 'goals';

  // Goals tab: compact tip-style display matching original drawer format
  function buildGoalsTab() {
    const tips = [];

    // Milestone — only show if not yet earned (#3 fix)
    const msCondition = MILESTONE_TRACKER_DATA?.[classId];
    const msChecks = ps.milestoneChecks ?? 0;
    const msEarned = ps.milestoneEarned ?? false;
    if (msCondition && !msEarned) {
      tips.push({ icon: '🏆', label: `Milestone (${msChecks}/10):`, text: msCondition });
    } else if (msCondition && msEarned) {
      tips.push({ icon: '🏆', label: 'Milestone:', text: '✅ Earned!' });
    }

    // PQ
    const pqId = member.characters?.pq_card_id;
    const pqTracker = pqId ? PQ_TRACKER_DATA?.[pqId] : null;
    const pqChecks = ps.pqChecks ?? 0;
    const pqCompleted = ps.pqCompleted ?? false;
    if (pqTracker) {
      const pqLabel = pqCompleted
        ? 'Personal Quest:'
        : `Personal Quest (${Math.min(pqChecks, pqTracker.count)}/${pqTracker.count}):`;
      tips.push({ icon: '📜', label: pqLabel, text: pqCompleted ? '✅ Complete — Ready to Retire!' : pqTracker.condition });
    }

    // Battle Goal
    const bgCard = member.battle_goal_card;
    const bgData = (bgCard && typeof BATTLE_GOAL_DATA !== 'undefined') ? BATTLE_GOAL_DATA?.[bgCard] : null;
    const bgCompleted = ps.bgCompleted ?? false;
    if (bgData) {
      tips.push({ icon: '🎯', label: `Battle Goal (${bgData.checks === 2 ? '★★' : '★'}):`, text: bgCompleted ? '✅ Achieved!' : bgData.condition });
    } else if (bgCard) {
      tips.push({ icon: '🎯', label: 'Battle Goal:', text: bgCompleted ? '✅ Achieved!' : 'Check your card for the goal.' });
    }

    if (!tips.length) return '<div class="sv-drawer-empty">No goal data available.</div>';
    return `<div class="sv-tips-static">${tips.map(t => `
      <div class="sv-tip">
        <span class="sv-tip-icon">${t.icon}</span>
        <span class="sv-tip-label">${t.label}</span>
        <span class="sv-tip-text">${t.text}</span>
      </div>`).join('')}</div>`;
  }

  // Tips tab: rotating class tips carousel
  function buildTipsTab() {
    const classTips = classData?.tips ?? [];
    sv.currentTips = classTips;
    sv.tipIndex = sv.tipIndex ?? 0;
    const firstTip = classTips[sv.tipIndex] ?? classTips[0];
    if (!classTips.length) return '<div class="sv-drawer-empty">No tips available for this class.</div>';
    return `
      <div class="sv-tips-header">
        <div class="sv-tips-nav-inline">
          <button class="sv-tip-nav-btn" id="sv-tip-prev" tabindex="-1">◀</button>
          <button class="sv-tip-nav-btn" id="sv-tip-next" tabindex="-1">▶</button>
        </div>
        <div class="sv-tips-label">💡 Class Tips</div>
        <div class="sv-tips-counter" id="sv-tips-counter">${(sv.tipIndex ?? 0) + 1} / ${classTips.length}</div>
      </div>
      <div class="sv-tip-carousel" id="sv-tip-carousel">
        ${firstTip ? `<div class="sv-tip">
          <span class="sv-tip-label">${firstTip.category}:</span>
          <span class="sv-tip-text">${firstTip.text}</span>
        </div>` : ''}
      </div>`;
  }

  // Hide drawer entirely when peeking
  if (isPeeking) return '';

  const trackersHtml = buildTrackerRow(member, classId, classData, false);
  const goalsHtml = buildGoalsTab();
  const tipsHtml = !ps.isExhausted ? buildTipsTab() : '';

  // Notes tab
  const notesHtml = `
    <div class="sv-notes-area">
      <textarea class="sv-notes-textarea" id="sv-notes-textarea"
        data-char-id="${charId}"
        maxlength="1024"
        placeholder="Record card combos, round strategies, opening plays..."
        >${(ps.notes ?? '').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</textarea>
      <div class="sv-notes-count" id="sv-notes-count">${(ps.notes ?? '').length}/1024</div>
    </div>`;

  const tabs = [
    { id: 'goals',    label: '🎯 Goals' },
    { id: 'tips',     label: '💡 Tips' },
    { id: 'trackers', label: '📋 Trackers' },
    { id: 'notes',    label: '📝 Notes' },
  ];

  const tabButtons = tabs.map(t => `
    <button class="sv-drawer-tab${activeTab === t.id ? ' sv-drawer-tab-active' : ''}"
        data-tab="${t.id}" tabindex="-1">${t.label}</button>`
  ).join('');

  const tabContent =
    activeTab === 'goals'    ? goalsHtml :
    activeTab === 'tips'     ? tipsHtml :
    activeTab === 'trackers' ? trackersHtml :
    activeTab === 'notes'    ? notesHtml : '';

  return `
    <div class="sv-bottom-drawer${isOpen ? ' sv-drawer-open' : ''}" id="sv-bottom-drawer">
      <button class="sv-drawer-toggle" id="sv-drawer-toggle" tabindex="-1">
        ${isOpen ? '▼ Hide' : '▲ Goals & Tips'}
      </button>
      ${isOpen ? `
        <div class="sv-drawer-tabs">${tabButtons}</div>
        <div class="sv-drawer-content">${tabContent}</div>` : ''}
    </div>`;
}

// ── Pile viewer modal ─────────────────────────────────────────────
function openPileModal(charId, pile, classId) {
  const ps = sv.playState[charId];
  if (!ps) return;
  const cards = pile === 'discard' ? ps.discard : ps.lost;
  const classData = CLASS_REGISTRY?.[classId];
  const pileLabel = pile === 'discard' ? 'Discard Pile' : 'Lost Pile';

  const cardItems = cards.map(cardId => {
    const cardData = getCardDataById(charId, cardId);
    const cardImg = cardData?.imageUrl ?? getCardBack(classId);
    const cardName = cardData?.name ?? cardId;
    return `
      <div class="sv-pile-modal-card" data-card-id="${cardId}" data-pile="${pile}" data-char-id="${charId}">
        <img src="${cardImg}" class="sv-pile-modal-img sv-zoomable" alt="${cardName}">
        <div class="sv-pile-modal-card-name">${cardName}</div>
        <div class="sv-pile-modal-actions">
          <button class="sv-pile-return-btn" data-card-id="${cardId}" data-pile="${pile}" data-char-id="${charId}">
            ↩ Return to Hand
          </button>
        </div>
      </div>`;
  }).join('');

  const modal = document.createElement('div');
  modal.className = 'db-modal-overlay';
  modal.id = 'sv-pile-modal';
  modal.style.display = 'flex';
  modal.innerHTML = `
    <div class="db-modal" style="max-width:600px;max-height:80vh;display:flex;flex-direction:column">
      <div class="db-modal-header">
        <h3 class="db-modal-title">${pileLabel} (${cards.length} cards)</h3>
        <button class="db-modal-close" id="sv-pile-modal-close">✕</button>
      </div>
      <div class="db-modal-body" style="overflow-y:auto;flex:1">
        ${cards.length ? `<div class="sv-pile-modal-grid">${cardItems}</div>`
          : '<p style="color:#888;text-align:center;padding:20px">Pile is empty</p>'}
      </div>
    </div>`;

  document.getElementById('scenario-view-overlay').appendChild(modal);

  document.getElementById('sv-pile-modal-close').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

  // Return to hand buttons
  modal.querySelectorAll('.sv-pile-return-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const { cardId, pile: p, charId: cid } = btn.dataset;
      const ps = sv.playState[cid];
      if (!ps) return;
      if (p === 'discard') ps.discard = ps.discard.filter(id => id !== cardId);
      else ps.lost = ps.lost.filter(id => id !== cardId);
      // Card returns to hand — it's already in handCards so just removing from pile is enough
      modal.remove();
      showToast(`↩ Card returned to hand.`);
      renderScenarioView();
    });
  });
}

// ── Negate: Move hand card to lost ────────────────────────────────
function openHandToLostModal(charId, classId) {
  const ps = sv.playState[charId];
  if (!ps) return;
  const playedSet = new Set([...ps.active, ...ps.discard, ...ps.lost, ...(sv.selectedCards[charId] ?? [])]);
  const availableHand = (ps.handCards ?? []).filter(dc => !playedSet.has(dc.card_id));

  const cardItems = availableHand.map(dc => {
    const cardData = getCardDataById(charId, dc.card_id);
    const cardImg = cardData?.imageUrl ?? getCardBack(classId);
    const cardName = cardData?.name ?? dc.card_id;
    return `
      <div class="sv-pile-modal-card">
        <img src="${cardImg}" class="sv-pile-modal-img sv-zoomable" alt="${cardName}">
        <div class="sv-pile-modal-card-name">${cardName}</div>
        <button class="sv-negate-select-btn" data-card-id="${dc.card_id}" data-char-id="${charId}" data-mode="hand-lost">
          → Lose this card
        </button>
      </div>`;
  }).join('');

  const modal = document.createElement('div');
  modal.className = 'db-modal-overlay';
  modal.id = 'sv-negate-modal';
  modal.style.display = 'flex';
  modal.innerHTML = `
    <div class="db-modal" style="max-width:600px;max-height:80vh;display:flex;flex-direction:column">
      <div class="db-modal-header">
        <h3 class="db-modal-title">🛡️ Negate Damage — Choose 1 Hand Card to Lose</h3>
        <button class="db-modal-close" id="sv-negate-modal-close">✕</button>
      </div>
      <div class="db-modal-body" style="overflow-y:auto;flex:1">
        <div class="sv-pile-modal-grid">${cardItems}</div>
      </div>
    </div>`;

  document.getElementById('scenario-view-overlay').appendChild(modal);
  document.getElementById('sv-negate-modal-close').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

  modal.querySelectorAll('.sv-negate-select-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const { cardId, charId: cid } = btn.dataset;
      const ps = sv.playState[cid];
      if (!ps) return;
      ps.lost.push(cardId);
      modal.remove();
      showToast('🛡️ Damage negated — 1 hand card lost.');
      renderScenarioView();
    });
  });
}

// ── Negate: Move 2 discard cards to lost ──────────────────────────
function openNegateDiscardModal(charId, classId) {
  const ps = sv.playState[charId];
  if (!ps) return;
  let selected = [];

  function buildGrid() {
    return ps.discard.map(cardId => {
      const cardData = getCardDataById(charId, cardId);
      const cardImg = cardData?.imageUrl ?? getCardBack(classId);
      const cardName = cardData?.name ?? cardId;
      const isSelected = selected.includes(cardId);
      return `
        <div class="sv-pile-modal-card${isSelected ? ' sv-negate-selected' : ''}"
            data-card-id="${cardId}">
          <img src="${cardImg}" class="sv-pile-modal-img sv-zoomable" alt="${cardName}">
          <div class="sv-pile-modal-card-name">${cardName}</div>
          ${isSelected ? '<div class="sv-negate-sel-badge">✓ Selected</div>' : ''}
        </div>`;
    }).join('');
  }

  const modal = document.createElement('div');
  modal.className = 'db-modal-overlay';
  modal.id = 'sv-negate-modal';
  modal.style.display = 'flex';

  function render() {
    modal.innerHTML = `
      <div class="db-modal" style="max-width:600px;max-height:80vh;display:flex;flex-direction:column">
        <div class="db-modal-header">
          <h3 class="db-modal-title">🛡️ Negate Damage — Choose 2 Discard Cards to Lose (${selected.length}/2)</h3>
          <button class="db-modal-close" id="sv-negate-modal-close">✕</button>
        </div>
        <div class="db-modal-body" style="overflow-y:auto;flex:1">
          <div class="sv-pile-modal-grid">${buildGrid()}</div>
        </div>
        <div class="db-modal-footer">
          <button class="wizard-btn" id="sv-negate-modal-close2">Cancel</button>
          <button class="wizard-btn wizard-btn-primary" id="sv-negate-confirm" ${selected.length < 2 ? 'disabled' : ''}>
            🛡️ Confirm — Lose 2 Cards
          </button>
        </div>
      </div>`;

    document.getElementById('sv-negate-modal-close')?.addEventListener('click', () => modal.remove());
    document.getElementById('sv-negate-modal-close2')?.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

    modal.querySelectorAll('.sv-pile-modal-card').forEach(card => {
      card.addEventListener('click', () => {
        const cardId = card.dataset.cardId;
        const idx = selected.indexOf(cardId);
        if (idx >= 0) selected.splice(idx, 1);
        else if (selected.length < 2) selected.push(cardId);
        render();
      });
    });

    document.getElementById('sv-negate-confirm')?.addEventListener('click', () => {
      const ps = sv.playState[charId];
      if (!ps) return;
      selected.forEach(cardId => {
        ps.discard = ps.discard.filter(id => id !== cardId);
        ps.lost.push(cardId);
      });
      modal.remove();
      showToast('🛡️ Damage negated — 2 discard cards lost.');
      renderScenarioView();
    });
  }

  document.getElementById('scenario-view-overlay').appendChild(modal);
  render();
}

// ── Long Rest Modal ──────────────────────────────────────────────
function openLongRestModal(charId, classId, playerId) {
  const ps = sv.playState[charId];
  if (!ps) return;

  const hasActiveNonLoss = ps.hasActiveNonLoss ?? false;

  const discardCards = ps.discard.map(cardId => {
    const cardData = getCardDataById(charId, cardId);
    const cardImg = cardData?.imageUrl ?? getCardBack(classId);
    const cardName = cardData?.name ?? cardId;
    return `
      <div class="sv-pile-modal-card" data-card-id="${cardId}" data-char-id="${charId}">
        <img src="${cardImg}" class="sv-pile-modal-img sv-zoomable" alt="${cardName}">
        <div class="sv-pile-modal-card-name">${cardName}</div>
        <button class="sv-long-rest-lose-btn" data-card-id="${cardId}" data-char-id="${charId}">
          → Lose this card
        </button>
      </div>`;
  }).join('');

  const activeNonLossSection = hasActiveNonLoss ? `
    <div class="sv-long-rest-active-note">
      <div class="sv-long-rest-active-title">📌 Non-loss persistent card option</div>
      <p>You declared having non-loss persistent card(s) in your active area. Use the <strong>→ Lost</strong> button on those cards in your play area to move them to your Lost pile manually, then click confirm below to return all remaining discard cards to your hand.</p>
      <button class="sv-long-rest-active-confirm" data-char-id="${charId}">
        ✓ I've lost my active card — return discard to hand
      </button>
    </div>
    <div class="sv-long-rest-divider">— or lose a discard card instead —</div>` : '';

  const modal = document.createElement('div');
  modal.className = 'db-modal-overlay';
  modal.id = 'sv-long-rest-modal';
  modal.style.display = 'flex';
  modal.innerHTML = `
    <div class="db-modal" style="max-width:600px;max-height:80vh;display:flex;flex-direction:column">
      <div class="db-modal-header">
        <h3 class="db-modal-title">🌙 Long Rest — Choose 1 Card to Lose</h3>
      </div>
      <div class="db-modal-body" style="overflow-y:auto;flex:1">
        <p style="font-size:12px;color:#888;padding:0 4px 12px">
          All remaining discard cards will return to your hand after one card is lost.
        </p>
        ${activeNonLossSection}
        <div class="sv-pile-modal-grid">${discardCards}</div>
      </div>
    </div>`;

  document.getElementById('scenario-view-overlay').appendChild(modal);

  async function completeLongRest(charId, lostCardId, source) {
    const ps = sv.playState[charId];
    if (!ps) return;
    if (lostCardId && source === 'discard') {
      ps.discard = ps.discard.filter(id => id !== lostCardId);
      ps.lost.push(lostCardId);
    }
    // Return all remaining discard to hand
    ps.discard = [];
    ps.isLongResting = false;
    ps.hasActiveNonLoss = false;
    ps.restPhase = 'done';
    modal.remove();
    await savePlayStateForChar(charId);
    // NOW mark the turn as ended — only after the lost-card selection is complete,
    // so the round cannot end while this player is still mid-selection
    if (playerId) {
      sv.readyPlayers[playerId] = false;
      await saveReadyState(playerId, false);
    }
    showToast('🌙 Long Rest complete — discard returned to hand.');
    // Flush any renders that were deferred while this modal was open
    sv._pendingRender = false;
    renderScenarioView();
  }

  // Lose a discard card
  modal.querySelectorAll('.sv-long-rest-lose-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      await completeLongRest(btn.dataset.charId, btn.dataset.cardId, 'discard');
    });
  });

  // Confirm active card already manually lost
  modal.querySelector('.sv-long-rest-active-confirm')?.addEventListener('click', async () => {
    await completeLongRest(charId, null, 'active');
  });
}

// ── Negate Damage UI ──────────────────────────────────────────────
function buildNegateDamageUI(charId, ps, classId) {
  const selectedCards = sv.selectedCards[charId] ?? [];
  const playedOrLostOrSelected = new Set([...ps.active, ...ps.discard, ...ps.lost, ...selectedCards]);
  const handCount = Math.max(0, (ps.handCards ?? []).filter(dc => !playedOrLostOrSelected.has(dc.card_id)).length);
  const discardCount = ps.discard.length;
  const canNegateHand = handCount >= 1;
  const canNegateDiscard = discardCount >= 2;
  const canNegate = canNegateHand || canNegateDiscard;

  if (!canNegate) return '';

  return `
    <div class="sv-negate-area">
      <div class="sv-negate-title">🛡️ Negate Damage</div>
      <div class="sv-negate-actions">
        ${canNegateHand ? `<button class="sv-negate-btn sv-negate-hand" data-char-id="${charId}" data-action="negate-hand">
          Hand card → Lost (×1)
        </button>` : ''}
        ${canNegateDiscard ? `<button class="sv-negate-btn sv-negate-discard" data-char-id="${charId}" data-action="negate-discard">
          Discard → Lost (×2)
        </button>` : ''}
      </div>
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
  const playedSet = new Set([...ps.active, ...ps.discard, ...ps.lost]);
  const available = dbCards.filter(dc => !playedSet.has(dc.card_id));
  if (!available.length) return '<div class="sv-zone-empty">No cards in hand</div>';

  const selected = sv.selectedCards[charId] ?? [];
  const inPlayPhase = sv.roundPhase === 'play';
  const memberForChar = (sv.scenario?.scenario_party ?? []).find(m => m.character_id === charId);
  const playerIsReady = memberForChar ? (sv.readyPlayers[memberForChar.player_id] ?? false) : false;

  if (isPeeking) {
    // Peek: show remaining (non-staged) hand cards face down
    return available.filter(dc => !selected.includes(dc.card_id)).map(dc =>
      `<div class="sv-hand-card sv-hand-card-facedown" data-card-id="${dc.card_id}" data-char-id="${charId}">
        <img src="${getCardBack(classId)}" class="sv-card-img" alt="Card back">
      </div>`
    ).join('') || '<div class="sv-zone-empty">No cards in hand</div>';
  }

  // In play phase: staged cards move to their own area, remaining hand is freely interactable
  const stagedSet = inPlayPhase ? new Set(selected) : new Set();
  const remainingCards = available.filter(dc => !stagedSet.has(dc.card_id));

  return remainingCards.map(dc => {
    const cardId = dc.card_id;
    const cardData = getCardDataById(charId, cardId);
    const cardName = cardData?.name ?? cardId;
    const cardImg = cardData?.imageUrl ?? getCardBack(classId);

    const isSelected = !inPlayPhase && selected.includes(cardId);
    const isLocked = !inPlayPhase && playerIsReady && !isSelected;
    const selIdx = selected.indexOf(cardId);
    const selLabel = selIdx === 0 ? '1st' : selIdx === 1 ? '2nd' : '';

    return `<div class="sv-hand-card${isSelected ? ' sv-card-selected' : ''}${isLocked ? ' sv-card-locked' : ''}"
        data-card-id="${cardId}" data-char-id="${charId}" data-img="${cardImg}">
      <img src="${cardImg}" class="sv-card-img" alt="${cardName}">
      ${isSelected ? `<div class="sv-card-sel-badge">${selLabel}</div>` : ''}
      <div class="sv-card-name">${cardName}</div>
    </div>`;
  }).join('') || '<div class="sv-zone-empty">No remaining cards in hand</div>';
}

// ── Staged cards (selected cards waiting to be played) ────────────
function buildStagedCards(dbCards, classId, charId, ps) {
  const selected = sv.selectedCards[charId] ?? [];
  if (!selected.length || sv.roundPhase !== 'play') return '';

  const cards = selected.map(cardId => {
    const cardData = getCardDataById(charId, cardId);
    const cardName = cardData?.name ?? cardId;
    const cardImg = cardData?.imageUrl ?? getCardBack(classId);
    return `<div class="sv-staged-card" data-card-id="${cardId}" data-char-id="${charId}" data-img="${cardImg}">
      <img src="${cardImg}" class="sv-card-img sv-zoomable" alt="${cardName}">
      <div class="sv-card-name">${cardName}</div>
      <button class="sv-play-card-btn" data-card-id="${cardId}" data-char-id="${charId}" title="Play card"
        onclick="window._handlePlayCard('${cardId}','${charId}')">▶ Play</button>
    </div>`;
  }).join('');

  return `
    <div class="sv-staged-area">
      <div class="sv-zone-label">⚔️ Cards to Play</div>
      <div class="sv-staged-cards">${cards}</div>
    </div>`;
}


// ── Active Card ───────────────────────────────────────────────────
function buildActiveCard(cardId, classId, charId, isPeeking = false) {
  const classData = CLASS_REGISTRY?.[classId];
  const card = classData?.cards?.find(c =>
    c.name === cardId ||
    c.name.toLowerCase().replace(/[^a-z0-9]/g, '-') === cardId
  );
  const displayName = card?.name ?? cardId;
  const imgSrc = card?.imageUrl ?? getCardBack(classId);

  // Charge dots — only interactive for own area, view-only when peeking
  const ps = sv.playState[charId];
  const chargeMap = ps?.chargeMap ?? {};
  const filledCount = chargeMap[cardId] ?? 0;
  const totalDots = ps?.dotCount?.[cardId] ?? 0;

  const chargeDots = isPeeking
    ? `<div class="sv-charge-dots">
        ${Array.from({length: totalDots}, (_, i) =>
          `<span class="sv-charge-dot ${i < filledCount ? 'sv-charge-filled' : ''}" style="pointer-events:none"></span>`
        ).join('')}
       </div>`
    : `<div class="sv-charge-dots">
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
      ${!isPeeking ? `<div class="sv-active-card-actions">
        <button class="sv-move-card-btn" data-dest="discard" data-card-id="${cardId}" data-char-id="${charId}"
          onclick="window._handleMoveCard('discard','${cardId}','${charId}')">→ Discard</button>
        <button class="sv-move-card-btn" data-dest="lost" data-card-id="${cardId}" data-char-id="${charId}"
          onclick="window._handleMoveCard('lost','${cardId}','${charId}')">→ Lost</button>
        <button class="sv-move-card-btn" data-dest="hand" data-card-id="${cardId}" data-char-id="${charId}"
          onclick="window._handleMoveCard('hand','${cardId}','${charId}')">→ Hand</button>
      </div>` : ''}
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
      const groupChecks = ps.pqGroupChecks ?? {};
      dots = tracker.groups.map((g, gi) => {
        const gKey = gi.toString();
        const gCount = groupChecks[gKey] ?? 0;
        const groupDone = gCount >= g.count;
        const groupDots = Array.from({length: g.count}, (_, i) => {
          return `<button class="sv-check-box ${i < gCount ? 'sv-check-filled' : ''}"
            data-tracker="pq-group" data-group="${gi}" data-idx="${i}" data-char-id="${charId}">${i < gCount ? '✓' : ''}</button>`;
        }).join('');
        return `<div class="sv-pq-group-row">
          <span class="sv-pq-group-lbl${groupDone ? ' sv-pq-group-done' : ''}">${g.label}${groupDone ? ' ✓' : ''}</span>
          ${groupDots}
        </div>`;
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
        ${!isPeeking ? `<div class="sv-tracker-checks">
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
      ${pqHtml && bgHtml ? '<div class="sv-tracker-sep"></div>' : ''}
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
          <div class="sv-tips-nav-inline">
            <button class="sv-tip-nav-btn" id="sv-tip-prev" tabindex="-1">◀</button>
            <button class="sv-tip-nav-btn" id="sv-tip-next" tabindex="-1">▶</button>
          </div>
          <div class="sv-tips-label">💡 Class Tips</div>
          <div class="sv-tips-counter" id="sv-tips-counter">1 / ${classTips.length}</div>
        </div>
        <div class="sv-tip-carousel" id="sv-tip-carousel">
          ${firstTip ? `<div class="sv-tip">
            <span class="sv-tip-label">${firstTip.category}:</span>
            <span class="sv-tip-text">${firstTip.text}</span>
          </div>` : ''}
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

  // Always restart timer so it uses current sv.currentTips
  if (sv.tipTimer) clearInterval(sv.tipTimer);
  sv.tipTimer = setInterval(() => showTip((sv.tipIndex ?? 0) + 1), 10000);
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
  const party = (sv.scenario?.scenario_party ?? []).filter(m =>
    !(sv.playState[m.character_id]?.isExhausted ?? false)
  );
  const allReady = party.length > 0 && party.every(m => sv.readyPlayers[m.player_id]);
  const allEndedTurns = sv.roundPhase === 'play' && party.length > 0 &&
    party.every(m => !(sv.readyPlayers[m.player_id] ?? false));
  const inPlayPhase = sv.roundPhase === 'play';

  if (!allReady && !allEndedTurns) return ''; // nothing to show
  return `
    <div class="sv-gm-controls" id="sv-gm-controls">
      ${allReady && !inPlayPhase ? `<button class="sv-gm-btn sv-gm-btn-primary" id="sv-begin-round">⚔️ Begin Round</button>` : ''}
      ${allEndedTurns ? `<button class="sv-gm-btn sv-gm-btn-primary" id="sv-new-round">🔄 End Round</button>` : ''}
    </div>`;
}

// ── Event Binding ─────────────────────────────────────────────────
function bindScenarioViewEvents() {
  // Player tab switching
  document.querySelectorAll('.sv-player-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      sv.activePlayerId = tab.dataset.playerId;
      renderScenarioView();
    });
  });

  // Hand card drag-to-reorder
  let dragCardId = null;
  document.querySelectorAll('.sv-hand-card:not(.sv-hand-card-facedown)').forEach(card => {
    card.setAttribute('draggable', 'true');
    card.addEventListener('dragstart', () => { dragCardId = card.dataset.cardId; });
    card.addEventListener('dragover', e => { e.preventDefault(); card.classList.add('sv-drag-over'); });
    card.addEventListener('dragleave', () => { card.classList.remove('sv-drag-over'); });
    card.addEventListener('drop', e => {
      e.preventDefault();
      card.classList.remove('sv-drag-over');
      const dropCardId = card.dataset.cardId;
      const charId = card.dataset.charId;
      if (!dragCardId || dragCardId === dropCardId || !charId) return;
      const ps = sv.playState[charId];
      if (!ps?.handCards) return;
      // Reorder handCards array
      const fromIdx = ps.handCards.findIndex(c => c.card_id === dragCardId);
      const toIdx = ps.handCards.findIndex(c => c.card_id === dropCardId);
      if (fromIdx < 0 || toIdx < 0) return;
      const [moved] = ps.handCards.splice(fromIdx, 1);
      ps.handCards.splice(toIdx, 0, moved);
      dragCardId = null;
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
      // Save selectedCards to DB so GM can read initiative at Begin Round
      savePlayStateForChar(charId).catch(err => {
        showToast('⚠️ Card select sync error: ' + err.message, true);
      });
    });
  });

  // Play card button (only visible in play phase for selected cards)
  document.querySelectorAll('.sv-play-card-btn').forEach(btn => {
    async function handlePlayCard(e) {
      e.stopPropagation();
      e.preventDefault();
      const { cardId, charId } = btn.dataset;
      if (!sv.playState[charId]) sv.playState[charId] = { hand: [], active: [], discard: [], lost: [], handCards: [] };
      // Guard against double-fire from touch+click
      if (sv.playState[charId].active.includes(cardId)) return;
      sv.playState[charId].active.push(cardId);
      if (sv.selectedCards[charId]) {
        sv.selectedCards[charId] = sv.selectedCards[charId].filter(id => id !== cardId);
      }
      renderScenarioView();
      showToast(`▶ Playing card...`);
      try {
        await savePlayStateForChar(charId);
        showToast(`✓ Card played`);
      }
      catch(err) { showToast('⚠️ Sync error: ' + err.message, true); }
    }
    btn.addEventListener('click', handlePlayCard);
    btn.addEventListener('touchend', handlePlayCard, { passive: false });
  });

  // Initiative icon click — toggle ready state (select phase) OR end turn (play phase)
  const myPlayer = getEffectivePlayer(sv.campaign.players ?? []);
  document.querySelectorAll('.sv-init-item').forEach(item => {
    item.addEventListener('click', async () => {
      const playerId = item.dataset.playerId;
      if (!myPlayer) return;
      // Allow if this is the player's own character OR they are the assigned substitute
      const partyMemberForInit = (sv.scenario.scenario_party ?? []).find(m => m.player_id === playerId);
      const isSubstituteForInit = partyMemberForInit?.is_absent && partyMemberForInit?.substitute_player_id === myPlayer?.id;
      // Substitute can only click absentee initiative when actively viewing that player's tab
      const isViewingTheirTab = sv.activePlayerId === playerId;
      if (myPlayer.id !== playerId && !(isSubstituteForInit && isViewingTheirTab)) return;

      const isExhausted = (sv.scenario.scenario_party ?? [])
        .find(m => m.player_id === playerId)?.character_id
        ? sv.playState[(sv.scenario.scenario_party ?? []).find(m => m.player_id === playerId)?.character_id]?.isExhausted
        : false;
      if (isExhausted) return;

      if (sv.roundPhase === 'play') {
        // Play phase — green icon click ends the player's turn (turns red)
        const currentlyReady = sv.readyPlayers[playerId] ?? false;
        if (currentlyReady) {
          // Guard: player must have played all staged cards before ending their turn
          // (Long Rest players are exempt — they have no cards to play)
          const memberForGuard = (sv.scenario.scenario_party ?? []).find(m => m.player_id === playerId);
          if (memberForGuard) {
            const charIdForGuard = memberForGuard.character_id;
            const psForGuard = sv.playState[charIdForGuard];
            const isLongRestingGuard = psForGuard?.isLongResting ?? false;
            const stagedCards = sv.selectedCards[charIdForGuard] ?? [];
            if (!isLongRestingGuard && stagedCards.length > 0) {
              showToast('⚠️ Play your cards first before ending your turn.', true);
              return;
            }
          }
          const memberForPlayer = (sv.scenario.scenario_party ?? []).find(m => m.player_id === playerId);
          if (memberForPlayer) {
            const charId = memberForPlayer.character_id;
            const ps = sv.playState[charId];
            // If player declared Long Rest during card selection, open modal FIRST.
            // Don't mark ready=false (turn ended) until the lost-card selection completes —
            // otherwise the round could end while this player is still mid-selection.
            if (ps?.isLongResting) {
              renderScenarioView();
              openLongRestModal(charId, memberForPlayer.characters?.class_id ?? '', playerId);
              return;
            }
            await savePlayStateForChar(charId);
          }
          sv.readyPlayers[playerId] = false;
          await saveReadyState(playerId, false);
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

      const newReady = !currentlyReady;
      sv.readyPlayers[playerId] = newReady;
      await saveReadyState(playerId, newReady);
      // Also save play state (including selectedCards) when going ready
      if (newReady) {
        const memberForReady = (sv.scenario.scenario_party ?? []).find(m => m.player_id === playerId);
        if (memberForReady) await savePlayStateForChar(memberForReady.character_id);
      }
      renderScenarioView();
    });
  });

  // Move card from active zone
  document.querySelectorAll('.sv-move-card-btn').forEach(btn => {
    async function handleMoveCard(e) {
      e.stopPropagation();
      e.preventDefault();
      const { dest, cardId, charId } = btn.dataset;
      const ps = sv.playState[charId];
      if (!ps) return;
      // Guard against double-fire
      if (dest === 'discard' && ps.discard.includes(cardId)) return;
      if (dest === 'lost' && ps.lost.includes(cardId)) return;
      ps.active = ps.active.filter(n => n !== cardId);
      if (dest === 'discard') ps.discard.push(cardId);
      else if (dest === 'lost') ps.lost.push(cardId);
      renderScenarioView();
      try { await savePlayStateForChar(charId); }
      catch(err) { showToast('⚠️ Sync error: ' + err.message, true); }
    }
    btn.addEventListener('click', handleMoveCard);
    btn.addEventListener('touchend', handleMoveCard, { passive: false });
  });

  // Charge dot tap-to-fill
  document.querySelectorAll('.sv-charge-dot').forEach(dot => {
    dot.addEventListener('click', async e => {
      e.stopPropagation();
      const { cardId, charId, dot: dotIdx } = dot.dataset;
      const ps = sv.playState[charId];
      if (!ps) return;
      if (!ps.chargeMap) ps.chargeMap = {};
      const current = ps.chargeMap[cardId] ?? 0;
      const idx = parseInt(dotIdx);
      ps.chargeMap[cardId] = (idx < current) ? idx : idx + 1;
      await savePlayStateForChar(charId);
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
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      const { cardId, charId } = btn.dataset;
      const ps = sv.playState[charId];
      if (!ps) return;
      if (!ps.dotCount) ps.dotCount = {};
      ps.dotCount[cardId] = (ps.dotCount[cardId] ?? 0) + 1;
      await savePlayStateForChar(charId);
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

  // Bottom drawer toggle
  document.getElementById('sv-drawer-toggle')?.addEventListener('click', () => {
    sv.drawerOpen = !(sv.drawerOpen ?? false);
    if (sv.drawerOpen && !sv.drawerTab) sv.drawerTab = 'goals';
    renderScenarioView();
  });

  // Notes textarea in drawer — debounced auto-save
  const svNotesTextarea = document.getElementById('sv-notes-textarea');
  const svNotesCount = document.getElementById('sv-notes-count');
  if (svNotesTextarea) {
    let svNotesTimer = null;
    svNotesTextarea.addEventListener('input', () => {
      const len = svNotesTextarea.value.length;
      if (svNotesCount) svNotesCount.textContent = `${len}/1024`;
      clearTimeout(svNotesTimer);
      svNotesTimer = setTimeout(async () => {
        const charId = svNotesTextarea.dataset.charId;
        await saveNotesForChar(charId, svNotesTextarea.value);
      }, 800);
    });
    svNotesTextarea.addEventListener('blur', async () => {
      clearTimeout(svNotesTimer);
      const charId = svNotesTextarea.dataset.charId;
      await saveNotesForChar(charId, svNotesTextarea.value);
    });
  }

  // Drawer tab switching
  document.querySelectorAll('.sv-drawer-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      sv.drawerTab = tab.dataset.tab;
      renderScenarioView();
      if (sv.drawerTab === 'tips') bindTipsCarousel();
    });
  });

  // Pile click — open viewer modal
  document.querySelectorAll('.sv-pile-clickable').forEach(pile => {
    pile.addEventListener('click', () => {
      const { pile: pileType, charId } = pile.dataset;
      const member = (sv.scenario.scenario_party ?? []).find(m => m.character_id === charId);
      const classId = member?.characters?.class_id ?? '';
      openPileModal(charId, pileType, classId);
    });
  });

  // Negate damage actions
  document.querySelectorAll('[data-action^="negate"]').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      const { action, charId } = btn.dataset;
      const ps = sv.playState[charId];
      if (!ps) return;
      const member = (sv.scenario.scenario_party ?? []).find(m => m.character_id === charId);
      const classId = member?.characters?.class_id ?? '';

      if (action === 'negate-hand') {
        // Show hand cards to pick one to lose
        openHandToLostModal(charId, classId);
      } else if (action === 'negate-discard') {
        // Show discard to pick 2 cards to lose
        openNegateDiscardModal(charId, classId);
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
        if (member) {
          sv.readyPlayers[member.player_id] = true;
          await saveReadyState(member.player_id, true);
        }
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

  // Active non-loss cards checkbox (count toward discard for Long Rest)
  document.querySelectorAll('.sv-active-nonloss-check').forEach(chk => {
    chk.addEventListener('change', () => {
      const { charId } = chk.dataset;
      const ps = sv.playState[charId];
      if (ps) ps.hasActiveNonLoss = chk.checked;
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
    const newRound = (sv.scenario.round_number ?? 0) + 1;

    // Auto-sort initiative based on first selected card BEFORE saving
    const party = sv.scenario.scenario_party ?? [];
    // Fetch latest play_state for all party members to get their selectedCards
    const { data: freshPartyRows } = await sb()
      .from('scenario_party')
      .select('character_id, play_state, is_ready')
      .eq('scenario_id', sv.scenario.id);

    const withInit = party.map(m => {
      const charId = m.character_id;
      const ps = sv.playState[charId];
      const classId = m.characters?.class_id ?? '';
      let initiative = 99; // default for long rest or unknown

      // Use local selectedCards for own character, DB play_state for others
      const freshRow = (freshPartyRows ?? []).find(r => r.character_id === charId);
      const savedSelected = freshRow?.play_state?.selectedCards ?? [];
      const myPlayer = getEffectivePlayer(sv.campaign?.players ?? []);
      const isMyChar = myPlayer?.id === m.player_id;
      const effectiveSelected = isMyChar
        ? (sv.selectedCards[charId] ?? [])
        : savedSelected;

      if (ps?.isLongResting || freshRow?.play_state?.isLongResting) {
        initiative = 99;
      } else {
        const firstCardId = effectiveSelected[0];
        if (firstCardId) {
          const card = getCardDataById(charId, firstCardId);
          if (card?.initiative) initiative = card.initiative;
          else console.warn(`[CSKB] Initiative lookup FAILED: classId=${classId} cardId=${firstCardId}`);
        } else {
          console.warn(`[CSKB] No selectedCard for charId=${charId} isMyChar=${isMyChar} localSel=${JSON.stringify(sv.selectedCards[charId])} dbSel=${JSON.stringify(savedSelected)} freshRow=${JSON.stringify(freshRow?.play_state)}`);
        }
      }
      console.log(`[CSKB] Initiative: player=${m.player?.player_name} classId=${classId} firstCard=${effectiveSelected[0]} initiative=${initiative} isMyChar=${isMyChar}`);
      return { member: m, initiative };
    });

    // Sort by initiative, preserve existing order for ties (stable sort)
    // Stable sort by initiative
    withInit.sort((a, b) => {
      if (a.initiative !== b.initiative) return a.initiative - b.initiative;
      // Preserve existing order for ties
      const aIdx = (sv.scenario.scenario_party ?? []).indexOf(a.member);
      const bIdx = (sv.scenario.scenario_party ?? []).indexOf(b.member);
      return aIdx - bIdx;
    });
    sv.scenario.scenario_party = withInit.map(w => w.member);

    // Detect ties and notify GM
    const initiatives = withInit.map(w => w.initiative);
    const ties = initiatives.filter((v, i, arr) => arr.indexOf(v) !== i);
    const uniqueTies = [...new Set(ties)];
    if (uniqueTies.length > 0) {
      const tieMsg = uniqueTies.map(initVal => {
        const tied = withInit.filter(w => w.initiative === initVal).map(w => w.member.player?.player_name ?? '?');
        return `Initiative ${initVal}: ${tied.join(' & ')}`;
      }).join('; ');
      showToast(`⚠️ Ties detected — reorder manually if needed: ${tieMsg}`);
    }

    const beginMsg = `⚔️ Round ${newRound} begun! Initiative sorted automatically.`;
    const initiativeOrder = JSON.stringify((sv.scenario.scenario_party ?? []).map(m => m.player_id));
    sv.scenario.initiative_order = initiativeOrder;
    sv.scenario.round_number = newRound;
    sv.roundPhase = 'play'; // set locally BEFORE DB write
    await sb().from('scenarios').update({
      round_number: newRound,
      scenario_step: 'play',
      initiative_order: initiativeOrder,
      toast_message: beginMsg,
      toast_at: new Date().toISOString(),
    }).eq('id', sv.scenario.id);

    renderScenarioView();
    await broadcastToast(beginMsg);
    broadcastToast('⚔️ Play cards in initiative order', 4000);
  });

  // End Scenario button
  document.getElementById('sv-end-scenario')?.addEventListener('click', () => {
    openEndScenarioModal();
  });

  // Treasure tile checkbox
  document.querySelectorAll('.sv-treasure-check').forEach(chk => {
    chk.addEventListener('change', async () => {
      const { charId } = chk.dataset;
      const ps = sv.playState[charId];
      if (!ps) return;
      ps.lootedTreasure = chk.checked;
      // Save to scenario_party
      const member = (sv.scenario.scenario_party ?? []).find(m => m.character_id === charId);
      if (member?.id) {
        await sb().from('scenario_party').update({ looted_treasure: chk.checked }).eq('id', member.id);
      }
      renderScenarioView();
    });
  });

  // GM End Round / New Round button
  document.getElementById('sv-new-round')?.addEventListener('click', async () => {
    // ── END OF ROUND ─────────────────────────────────────────────────
    // Future end-of-round triggers can be inserted here, for example:
    //   - Element consumption/generation resets
    //   - Persistent ability end-of-round effects
    //   - Certain item ability triggers
    //   - Status condition duration tracking
    // ─────────────────────────────────────────────────────────────────

    sv.readyPlayers = {};
    sv.selectedCards = {};
    // Clear rest flags for next round (hasActiveNonLoss persists until manually unchecked)
    Object.values(sv.playState).forEach(ps => {
      ps.isLongResting = false;
      ps.restPhase = null;
      ps.restCandidate = null;
    });
    // Save all play states first
    await saveAllPlayStates();
    // Reset all ready states + phase atomically in parallel
    const party = sv.scenario?.scenario_party ?? [];
    await Promise.all([
      sb().from('scenarios').update({ scenario_step: 'select' }).eq('id', sv.scenario.id),
      ...party.map(m => sb().from('scenario_party').update({ is_ready: false }).eq('id', m.id))
    ]);
    sv.scenario.scenario_step = 'select';
    renderScenarioView();
    await broadcastToast('🔄 End of Round');
    broadcastToast('🃏 Select two cards to play', 4000);
  });

  // GM cancel
  document.getElementById('sv-cancel-scenario')?.addEventListener('click', async () => {
    if (!confirm('Cancel this scenario? This will abandon the scenario and roll back any PQ/milestone progress made during play.')) return;
    try {
      const party = sv.scenario.scenario_party ?? [];

      // Rollback PQ/milestone checks to start snapshots
      for (const member of party) {
        const ps = sv.playState[member.character_id];
        if (!ps?.stateId) continue;
        await sb().from('character_state').update({
          pq_checks: ps.pqChecksStart ?? ps.pqChecks,
          milestone_checks: ps.milestoneChecksStart ?? ps.milestoneChecks,
        }).eq('id', ps.stateId);
      }

      // Clear play_state on all scenario_party rows (abandon = clean slate)
      await Promise.all(party.map(m =>
        sb().from('scenario_party').update({ play_state: {} }).eq('id', m.id)
      ));

      await sb().from('scenarios').update({ status: 'abandoned' }).eq('id', sv.scenario.id);
      await updateCampaignPhase(sv.campaign.id, 'city', 'downtime');
      closeScenarioView();
      await loadCampaigns();
      showToast('Scenario cancelled and progress rolled back.');
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

  // Tips carousel — only bind when tips tab is active
  if ((sv.drawerTab ?? 'goals') === 'tips') bindTipsCarousel();

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
    item.addEventListener('drop', async e => {
      e.preventDefault();
      item.classList.remove('sv-drag-over');
      const dropIdx = parseInt(item.dataset.partyIdx);
      if (dragIdx === null || dragIdx === dropIdx) return;
      // Reorder party
      const party = sv.scenario.scenario_party;
      const [moved] = party.splice(dragIdx, 1);
      party.splice(dropIdx, 0, moved);
      await saveInitiativeOrder(); // persist for all players
      renderScenarioView();
    });
  });
}

// ── Close scenario view ───────────────────────────────────────────
// ── End Scenario Modal ───────────────────────────────────────────
function openEndScenarioModal() {
  const s = sv.scenario;
  const party = s.scenario_party ?? [];
  const modal = document.createElement('div');
  modal.className = 'db-modal-overlay';
  modal.id = 'sv-end-modal';
  modal.style.display = 'flex';
  modal.innerHTML = `
    <div class="db-modal" style="max-width:520px">
      <div class="db-modal-header">
        <h3 class="db-modal-title">🏁 End Scenario ${s.scenario_number}: ${s.scenario_name}</h3>
      </div>
      <div class="db-modal-body">
        <p style="font-size:13px;color:#888;margin-bottom:16px">Select the scenario outcome:</p>
        <div class="sv-outcome-btns">
          <button class="sv-outcome-btn sv-outcome-completed" data-outcome="completed">✅ Completed</button>
          <button class="sv-outcome-btn sv-outcome-lost" data-outcome="lost">❌ Lost</button>
        </div>
        <div id="sv-outcome-details" style="margin-top:16px"></div>
      </div>
    </div>`;

  document.getElementById('scenario-view-overlay').appendChild(modal);

  modal.querySelectorAll('.sv-outcome-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      modal.querySelectorAll('.sv-outcome-btn').forEach(b => b.classList.remove('sv-outcome-selected'));
      btn.classList.add('sv-outcome-selected');
      const outcome = btn.dataset.outcome;
      const details = document.getElementById('sv-outcome-details');
      if (outcome === 'completed') details.innerHTML = buildCompletedDetails(party, s);
      else if (outcome === 'lost') details.innerHTML = buildLostDetails();
      bindOutcomeDetails(modal, outcome);
    });
  });
}

function buildCompletedDetails(party, s) {
  const bgRows = party.map(m => {
    const ps = sv.playState[m.character_id] ?? {};
    const playerName = m.player?.player_name ?? '?';
    const cls = m.characters?.class_id ?? '';
    const bgCard = m.battle_goal_card;
    const bgData = bgCard && typeof BATTLE_GOAL_DATA !== 'undefined' ? BATTLE_GOAL_DATA[bgCard] : null;
    const achieved = ps.bgCompleted ?? false;
    const bgTitle = bgData ? bgData.title : (bgCard ?? 'No BG');
    const battleGoalsDone = (sv.campaign.players ?? []).find(p => p.id === m.player_id)?.battle_goals_completed ?? 0;
    const bgAlreadyDone = battleGoalsDone >= 5;
    return `
      <div class="sv-bg-summary-row">
        ${classIcon(cls, 18)}
        <span class="sv-bg-summary-name">${playerName}</span>
        <span class="sv-bg-summary-card">${bgTitle}</span>
        <span class="sv-bg-summary-result ${achieved ? 'sv-bg-success' : 'sv-bg-fail'}">
          ${bgAlreadyDone ? '⭐ Party goal met' : achieved ? '✅ Success' : '❌ Not achieved'}
        </span>
      </div>`;
  }).join('');

  const isSideScenario = s.scenario_number >= 51 && s.scenario_number <= 55;

  return `
    <div class="sv-outcome-section">
      <div class="sv-outcome-section-title">🎯 Battle Goals</div>
      ${bgRows}
    </div>
    ${isSideScenario ? `<div class="sv-outcome-note">⭐ Side Scenario ${s.scenario_number} — Party Goal will be marked complete</div>` : ''}
    <div class="sv-outcome-section" style="margin-top:12px">
      <label class="sv-override-check-label" style="margin-bottom:8px">
        <input type="checkbox" id="sv-forced-link-check">
        This scenario has a Forced Link to another scenario
      </label>
      <div id="sv-forced-link-fields" style="display:none;margin-top:8px;display:none">
        <input type="number" id="sv-link-num" class="wizard-input" placeholder="Linked scenario number" style="width:100%;margin-bottom:6px">
        <input type="text" id="sv-link-name" class="wizard-input" placeholder="Linked scenario name" style="width:100%">
      </div>
    </div>
    <div class="db-modal-footer" style="margin-top:16px;padding:0">
      <button class="wizard-btn wizard-btn-primary" id="sv-confirm-outcome" data-outcome="completed">✅ Confirm Completed</button>
    </div>`;
}

function buildLostDetails() {
  return `
    <div class="sv-outcome-section">
      <p style="font-size:13px;color:#aaa;margin-bottom:12px">PQ and Milestone checks earned during this scenario will be kept.</p>
      <div style="display:flex;flex-direction:column;gap:8px">
        <button class="sv-outcome-btn sv-outcome-return" data-lost-action="return">
          🏛️ Return to Gloomhaven<br>
          <span style="font-size:11px;font-weight:400;color:#aaa">Triggers City Phase</span>
        </button>
        <button class="sv-outcome-btn sv-outcome-replay" data-lost-action="replay">
          🔄 Replay Scenario<br>
          <span style="font-size:11px;font-weight:400;color:#aaa">Skip City Phase — restart from Campaign Panel</span>
        </button>
      </div>
    </div>`;
}

function bindOutcomeDetails(modal, outcome) {
  // Forced link toggle
  const flCheck = document.getElementById('sv-forced-link-check');
  const flFields = document.getElementById('sv-forced-link-fields');
  if (flCheck && flFields) {
    flCheck.addEventListener('change', () => {
      flFields.style.display = flCheck.checked ? 'block' : 'none';
    });
  }

  // Confirm completed
  document.getElementById('sv-confirm-outcome')?.addEventListener('click', async () => {
    const forcedLink = flCheck?.checked ?? false;
    const linkNum = parseInt(document.getElementById('sv-link-num')?.value ?? '0') || 0;
    const linkName = document.getElementById('sv-link-name')?.value?.trim() ?? '';
    await handleCompletedOutcome(forcedLink, linkNum, linkName);
    modal.remove();
  });

  // Lost actions
  modal.querySelectorAll('[data-lost-action]').forEach(btn => {
    btn.addEventListener('click', async () => {
      await handleLostOutcome(btn.dataset.lostAction);
      modal.remove();
    });
  });
}

// ── Outcome handlers ──────────────────────────────────────────────
function getPartyCharacterNames() {
  return (sv.scenario?.scenario_party ?? [])
    .map(m => m.characters?.character_name ?? m.player?.player_name ?? '?');
}

async function handleCompletedOutcome(forcedLink, linkScenarioNum, linkScenarioName) {
  const s = sv.scenario;
  const party = s.scenario_party ?? [];
  const campaignId = sv.campaign.id;

  // 1. Update scenario status
  await sb().from('scenarios').update({ status: 'completed', forced_link: forcedLink }).eq('id', s.id);

  // 2. Award battle goals for players who succeeded (only if < 5 total)
  for (const m of party) {
    const ps = sv.playState[m.character_id] ?? {};
    const player = (sv.campaign.players ?? []).find(p => p.id === m.player_id);
    if (!player) continue;
    const bgData = m.battle_goal_card && typeof BATTLE_GOAL_DATA !== 'undefined'
      ? BATTLE_GOAL_DATA[m.battle_goal_card] : null;
    const checks = bgData?.checks ?? 1;

    if (ps.bgCompleted && (player.battle_goals_completed ?? 0) < 5) {
      const newCount = Math.min(5, (player.battle_goals_completed ?? 0) + checks);
      await sb().from('players').update({ battle_goals_completed: newCount }).eq('id', player.id);
    }

    // Award treasure tile if looted
    if (ps.lootedTreasure && !player.treasure_looted) {
      await sb().from('players').update({ treasure_looted: true }).eq('id', player.id);
    }
  }

  // 3. Side scenario 51-55
  if (s.scenario_number >= 51 && s.scenario_number <= 55) {
    await sb().from('campaigns').update({ party_goal_side_scenario: true }).eq('id', campaignId);
  }

  // 4. Increment scenario completions
  const currentCompletions = sv.campaign.scenario_completions ?? 0;
  await sb().from('campaigns').update({ scenario_completions: currentCompletions + 1 }).eq('id', campaignId);

  // 5. Create adventure log entry
  const logResult = forcedLink ? 'completed_forced_link' : 'completed';
  if (typeof createScenarioLogEntry === 'function') {
    await createScenarioLogEntry(
      campaignId, s.id, s.scenario_number, s.scenario_name,
      s.is_replay ?? false, s.replay_number ?? null,
      logResult, getPartyCharacterNames(), forcedLink
    );
  }

  // 6. Set phase
  if (forcedLink) {
    // Bypass City Phase — campaign stays available but no active scenario
    await sb().from('campaigns').update({ phase: 'city', city_step: 'downtime' }).eq('id', campaignId);
    showToast(`✅ Scenario completed! Forced link to Scenario ${linkScenarioNum} — start it from the Campaign Panel.`);
  } else {
    await sb().from('campaigns').update({ phase: 'city', city_step: 'city_event' }).eq('id', campaignId);
    showToast('✅ Scenario completed! Return to Gloomhaven — City Phase begins.');
  }

  closeScenarioView();
  await loadCampaigns();
}

async function handleLostOutcome(action) {
  const s = sv.scenario;
  const campaignId = sv.campaign.id;

  // Update scenario status
  await sb().from('scenarios').update({ status: 'lost', replay: action === 'replay' }).eq('id', s.id);

  // Create adventure log entry
  const logResult = action === 'replay' ? 'lost_replay' : 'lost_return';
  if (typeof createScenarioLogEntry === 'function') {
    await createScenarioLogEntry(
      campaignId, s.id, s.scenario_number, s.scenario_name,
      s.is_replay ?? false, s.replay_number ?? null,
      logResult, getPartyCharacterNames(), false
    );
  }

  if (action === 'replay') {
    // Skip City Phase — back to downtime, GM restarts from Campaign Panel
    await sb().from('campaigns').update({ phase: 'city', city_step: 'downtime' }).eq('id', campaignId);
    showToast('❌ Scenario lost. Skip City Phase — restart the scenario from the Campaign Panel.');
  } else {
    // Return to Gloomhaven — City Phase
    await sb().from('campaigns').update({ phase: 'city', city_step: 'city_event' }).eq('id', campaignId);
    showToast('❌ Scenario lost. Return to Gloomhaven — City Phase begins.');
  }

  closeScenarioView();
  await loadCampaigns();
}

// ── One-time spacebar zoom setup ─────────────────────────────────
// ── Supabase Realtime subscriptions ──────────────────────────────
let sv_realtimeChannel = null;

function handleScenarioUpdate(payload) {
  const row = payload.new;
  if (!row || row.id !== sv.scenario?.id) return;

  let changed = false;

  // Scenario ended/paused/cancelled by GM
  if (['completed','lost','abandoned'].includes(row.status) &&
      !['completed','lost','abandoned'].includes(sv.scenario.status ?? '')) {
    sv.scenario.status = row.status;
    closeScenarioView();
    loadCampaigns();
    showToast('The GM has ended the scenario.');
    return;
  }
  if (row.status === 'paused' && sv.scenario.status !== 'paused') {
    sv.scenario.status = row.status;
    closeScenarioView();
    loadCampaigns();
    showToast('The GM has paused the scenario.');
    return;
  }

  // Sync round number
  if (row.round_number !== sv.scenario.round_number) {
    sv.scenario.round_number = row.round_number;
    changed = true;
  }

  // Sync round phase — only act if truly different from local state
  const dbPhase = row.scenario_step === 'play' ? 'play' : 'select';
  if (dbPhase !== sv.roundPhase) {
    sv.roundPhase = dbPhase;
    // Only reset selected/ready when transitioning back to select phase
    // AND the round_number also changed (genuine new round, not a race condition)
    if (dbPhase === 'select' && row.round_number === sv.scenario.round_number) {
      sv.readyPlayers = {};
      sv.selectedCards = {};
    }
    changed = true;
  }

  // Sync initiative order
  if (row.initiative_order && row.initiative_order !== sv.scenario.initiative_order) {
    sv.scenario.initiative_order = row.initiative_order;
    try {
      const order = JSON.parse(row.initiative_order);
      const party = sv.scenario.scenario_party ?? [];
      const sorted = order.map(pid => party.find(m => m.player_id === pid)).filter(Boolean);
      party.forEach(m => { if (!sorted.includes(m)) sorted.push(m); });
      sv.scenario.scenario_party = sorted;
    } catch (e) { /* ignore */ }
    changed = true;
  }

  // Sync toast messages from GM to all players
  if (row.toast_message && row.toast_at && row.toast_at !== sv.scenario.lastToastAt) {
    sv.scenario.lastToastAt = row.toast_at;
    // Show to all non-GM players
    if (!sv.isGM) showToast(row.toast_message);
  }

  if (changed) {
    if (document.getElementById('sv-long-rest-modal') || document.getElementById('sv-negate-modal')) {
      sv._pendingRender = true;
    } else {
      renderScenarioView();
    }
  }
}

function handlePartyUpdate(payload) {
  const row = payload.new;
  if (!row) return;

  const member = (sv.scenario?.scenario_party ?? []).find(m => m.character_id === row.character_id);
  if (!member) return;

  let changed = false;
  const myPlayer = getEffectivePlayer(sv.campaign?.players ?? []);
  // In dev with no player selected, never overwrite local state from DB
  const isMyChar = IS_DEV && !myPlayer
    ? true  // protect all local state in dev
    : (myPlayer?.id === member.player_id ||
       (member.is_absent && member.substitute_player_id === myPlayer?.id));

  // Sync ready state — skip echo for own player (already set locally)
  const wasReady = sv.readyPlayers[member.player_id] ?? false;
  const isNowReady = row.is_ready ?? false;
  if (wasReady !== isNowReady) {
    sv.readyPlayers[member.player_id] = isNowReady;
    member.is_ready = isNowReady;
    changed = true;
  }

  // Sync absent/substitute changes
  const wasAbsent = member.is_absent ?? false;
  const wasSubId = member.substitute_player_id ?? null;
  const nowAbsent = row.is_absent ?? false;
  const nowSubId = row.substitute_player_id ?? null;
  if (wasAbsent !== nowAbsent || wasSubId !== nowSubId) {
    member.is_absent = nowAbsent;
    member.substitute_player_id = nowSubId;
    changed = true;

    // Notify the player who was just assigned as substitute
    const myPlayer = getEffectivePlayer(sv.campaign?.players ?? []);
    if (myPlayer && nowSubId === myPlayer.id && nowAbsent) {
      const absentPlayerName = member.player?.player_name ?? 'an absent player';
      const charName = member.characters?.character_name ?? 'their character';
      showToast(`👤 You have been assigned to play for ${absentPlayerName} (${charName})`);
      sv.activePlayerId = member.player_id;
    }
    // Notify if assignment was removed
    if (myPlayer && wasSubId === myPlayer.id && !nowSubId) {
      showToast(`👤 You are no longer assigned to play for an absent player`);
    }
  }

  const charId = member.character_id;
  const ps = sv.playState[charId];
  if (ps) {
    // Sync exhaustion
    if (ps.isExhausted !== (row.is_exhausted ?? false)) {
      ps.isExhausted = row.is_exhausted ?? false;
      changed = true;
    }

    // Sync BG completion
    if (ps.bgCompleted !== (row.battle_goal_completed ?? false)) {
      ps.bgCompleted = row.battle_goal_completed ?? false;
      changed = true;
    }

    // Sync play state — only for other players' characters
    if (!isMyChar && row.play_state && Object.keys(row.play_state).length) {
      const saved = row.play_state;
      const arrayKeys = ['active', 'discard', 'lost'];
      const objKeys = ['chargeMap', 'dotCount'];
      let playChanged = false;
      [...arrayKeys, ...objKeys].forEach(key => {
        const fallback = arrayKeys.includes(key) ? [] : {};
        const savedVal = JSON.stringify(saved[key] ?? fallback);
        const curVal = JSON.stringify(ps[key] ?? fallback);
        if (savedVal !== curVal) {
          ps[key] = saved[key] ?? fallback;
          playChanged = true;
        }
      });
      if (playChanged) changed = true;
    }
  }

  if (changed) {
    // Don't re-render if a modal requiring user input is open — it would destroy their selection
    if (document.getElementById('sv-long-rest-modal') || document.getElementById('sv-negate-modal')) {
      sv._pendingRender = true;
    } else {
      renderScenarioView();
    }
  }
}

function startPolling() {
  if (!sv.scenario?.id) return;
  stopPolling(); // clean up any existing subscription

  const supabase = sb();
  sv_realtimeChannel = supabase.channel(`scenario-${sv.scenario.id}`)
    .on('postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'scenarios',
        filter: `id=eq.${sv.scenario.id}` },
      handleScenarioUpdate)
    .on('postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'scenario_party',
        filter: `scenario_id=eq.${sv.scenario.id}` },
      handlePartyUpdate)
    .subscribe((status) => {
      console.log('Realtime status:', status);
      if (status === 'SUBSCRIBED') {
        // Clear fallback poll if Realtime works
        if (sv._fallbackPollTimer) {
          clearInterval(sv._fallbackPollTimer);
          sv._fallbackPollTimer = null;
        }
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        // Start fallback polling when Realtime is unreliable
        startFallbackPolling();
      }
    });

  // Start fallback polling immediately as safety net
  // It will be cancelled if Realtime is stable (SUBSCRIBED without CLOSED)
  sv._fallbackPollTimer = setInterval(fallbackPoll, 3000);
  fallbackPoll();
}

async function fallbackPoll() {
  if (!sv.scenario?.id) return;
  try {
    // Poll scenarios for phase/round changes
    const { data: scenarioRow } = await sb()
      .from('scenarios')
      .select('scenario_step, round_number, status, initiative_order, toast_message, toast_at')
      .eq('id', sv.scenario.id)
      .maybeSingle();
    if (scenarioRow) handleScenarioUpdate({ new: scenarioRow });

    // Poll scenario_party for play state changes
    const { data: partyRows } = await sb()
      .from('scenario_party')
      .select('character_id, is_ready, is_exhausted, play_state, battle_goal_completed, is_absent, substitute_player_id')
      .eq('scenario_id', sv.scenario.id);
    (partyRows ?? []).forEach(row => handlePartyUpdate({ new: row }));
  } catch (err) {
    // Silent fail
  }
}

function startFallbackPolling() {
  if (sv._fallbackPollTimer) return;
  fallbackPoll(); // run immediately
  sv._fallbackPollTimer = setInterval(fallbackPoll, 3000);
}

function stopPolling() {
  if (sv_realtimeChannel) {
    sb().removeChannel(sv_realtimeChannel);
    sv_realtimeChannel = null;
  }
  if (sv._fallbackPollTimer) {
    clearInterval(sv._fallbackPollTimer);
    sv._fallbackPollTimer = null;
  }
}

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
      e.stopPropagation();
      const zo = document.getElementById('sv-zoom-overlay');
      const zi = zo?.querySelector('img');
      if (zi) { zi.src = sv._hoveredCardImg; zo.style.display = 'flex'; }
    }
  };
  sv._zoomKeyup = e => {
    if (e.code === 'Space') {
      e.preventDefault();
      const zo = document.getElementById('sv-zoom-overlay');
      if (zo) zo.style.display = 'none';
    }
  };
  document.addEventListener('keydown', sv._zoomKeydown);
  document.addEventListener('keyup', sv._zoomKeyup);

  // Hover zoom — event delegation so it works everywhere including modals, no rebinding needed
  sv._zoomHoverTimer = null;
  sv._zoomMouseenter = e => {
    const img = e.target.closest('.sv-zoomable');
    if (!img) return;
    sv._hoveredCardImg = img.src;
    clearTimeout(sv._zoomHoverTimer);
    sv._zoomHoverTimer = setTimeout(() => {
      const zo = document.getElementById('sv-zoom-overlay');
      const zi = zo?.querySelector('img');
      if (zi && sv._hoveredCardImg) { zi.src = sv._hoveredCardImg; zo.style.display = 'flex'; }
    }, 600);
  };
  sv._zoomMouseleave = e => {
    const img = e.target.closest('.sv-zoomable');
    if (!img) return;
    sv._hoveredCardImg = null;
    clearTimeout(sv._zoomHoverTimer);
    const zo = document.getElementById('sv-zoom-overlay');
    if (zo) zo.style.display = 'none';
  };
  document.addEventListener('mouseover', sv._zoomMouseenter);
  document.addEventListener('mouseout', sv._zoomMouseleave);
}

function closeScenarioView() {
  stopPolling();
  sv.joinOrder = null; // reset for next scenario
  sv.activePlayerId = null;
  if (sv.tipTimer) { clearInterval(sv.tipTimer); sv.tipTimer = null; }
  if (sv._zoomKeydown)    { document.removeEventListener('keydown',  sv._zoomKeydown);    sv._zoomKeydown = null; }
  if (sv._zoomKeyup)      { document.removeEventListener('keyup',    sv._zoomKeyup);      sv._zoomKeyup = null; }
  if (sv._zoomMouseenter) { document.removeEventListener('mouseover', sv._zoomMouseenter); sv._zoomMouseenter = null; }
  if (sv._zoomMouseleave) { document.removeEventListener('mouseout',  sv._zoomMouseleave); sv._zoomMouseleave = null; }
  clearTimeout(sv._zoomHoverTimer);
  const overlay = document.getElementById('scenario-view-overlay');
  if (overlay) { overlay.style.display = 'none'; overlay.innerHTML = ''; }
  // Restart campaign polling
  if (typeof startCampaignPolling === 'function') startCampaignPolling();
}
