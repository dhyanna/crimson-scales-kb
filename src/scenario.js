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

// ── Scenario state ────────────────────────────────────────────────
let sv = {
  scenario:       null,   // full scenario row with scenario_party
  campaign:       null,
  activePartyIdx: 0,      // which player's play area is showing
  isGM:           false,
  // Per-character play state (keyed by character_id)
  // { hand: [...cardIds], active: [...cardIds], discard: [...cardIds], lost: [...cardIds] }
  playState:      {},
};

// ── Load hand cards from DB ───────────────────────────────────────
async function loadPartyHandCards(party) {
  for (const member of party) {
    const charId = member.character_id;
    const { data: cards } = await sb()
      .from('character_cards')
      .select('*')
      .eq('character_id', charId)
      .eq('in_hand', true);
    if (!sv.playState[charId]) sv.playState[charId] = { hand: [], active: [], discard: [], lost: [], handCards: [] };
    sv.playState[charId].handCards = cards ?? [];
  }
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
    return `
      <div class="sv-init-item${initiative ? ' sv-init-revealed' : ' sv-init-unrevealed'}"
           data-party-idx="${i}"
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
  const tabs = party.map((member, i) => {
    const cls = member.characters;
    const classId = cls?.class_id ?? '';
    const playerName = member.player?.player_name ?? '?';
    const isActive = i === sv.activePartyIdx;
    return `
      <button class="sv-player-tab${isActive ? ' sv-player-tab-active' : ''}" data-party-idx="${i}">
        ${CARD_BACK_ASSETS[classId]?.token
          ? `<img src="${getTokenImg(classId)}" class="sv-tab-token" alt="">`
          : `<span class="sv-tab-icon">${classId[0]?.toUpperCase() ?? '?'}</span>`}
        <span class="sv-tab-name">${playerName}</span>
        ${i !== sv.activePartyIdx ? '<span class="sv-tab-peek">👁</span>' : ''}
      </button>`;
  }).join('');
  return `<div class="sv-player-tabs" id="sv-player-tabs">${tabs}</div>`;
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
      ${buildTrackerRow(member, classId, classData)}

      <!-- Play Tips -->
      ${!isPeeking ? buildPlayTips(classId, member) : ''}

      <!-- Tokens -->
      <div class="sv-token-area">
        ${getTokenImg(classId) ? `<img src="${getTokenImg(classId)}" class="sv-char-token" alt="Character token">` : ''}
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
  // dbCards are character_cards rows with card_id and in_hand
  const classData = CLASS_REGISTRY?.[classId];
  const playedSet = new Set([...ps.active, ...ps.discard, ...ps.lost]);

  const available = dbCards.filter(dc => !playedSet.has(dc.card_id));
  if (!available.length) return '<div class="sv-zone-empty">No cards in hand</div>';

  return available.map(dc => {
    const cardId = dc.card_id;
    // Find matching card data in class registry
    const cardData = classData?.cards?.find(c =>
      c.name === cardId ||
      c.name.toLowerCase().replace(/[^a-z0-9]/g, '-') === cardId ||
      cardId.includes(c.name.toLowerCase().replace(/\s+/g, '-'))
    );
    const cardName = cardData?.name ?? cardId;
    const cardImg = cardData?.imageUrl ?? getCardBack(classId);

    if (isPeeking) {
      return `<div class="sv-hand-card sv-hand-card-facedown" data-card-id="${cardId}" data-char-id="${charId}" data-img="${cardImg}">
        <img src="${getCardBack(classId)}" class="sv-card-img" alt="Card back">
      </div>`;
    }
    return `<div class="sv-hand-card" data-card-id="${cardId}" data-char-id="${charId}" data-img="${cardImg}">
      <img src="${cardImg}" class="sv-card-img" alt="${cardName}">
      <div class="sv-card-name">${cardName}</div>
      <button class="sv-play-card-btn" data-card-id="${cardId}" data-char-id="${charId}" title="Play card">▶ Play</button>
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
  return `
    <div class="sv-active-card" data-card-id="${cardId}" data-char-id="${charId}" data-img="${imgSrc}">
      <img src="${imgSrc}" class="sv-card-img sv-zoomable" alt="${displayName}">
      <div class="sv-card-name">${displayName}</div>
      <div class="sv-active-card-actions">
        <button class="sv-move-card-btn" data-dest="discard" data-card-id="${cardId}" data-char-id="${charId}">→ Discard</button>
        <button class="sv-move-card-btn" data-dest="lost" data-card-id="${cardId}" data-char-id="${charId}">→ Lost</button>
        <button class="sv-move-card-btn" data-dest="hand" data-card-id="${cardId}" data-char-id="${charId}">→ Hand</button>
      </div>
    </div>`;
}

// ── Tracker Row ───────────────────────────────────────────────────
function buildTrackerRow(member, classId, classData) {
  const msEarned = false; // TODO: pull from character_state
  const msImg = classData?.milestone?.imageUrl ?? '';
  const msaImg = getMsaBack(classId);
  const pqId = member.characters?.pq_card_id ?? null;
  const bgCard = member.battle_goal_card;

  return `
    <div class="sv-tracker-row">
      ${msImg && !msEarned ? `
        <div class="sv-tracker-card sv-tracker-milestone">
          <div class="sv-tracker-label">🏆 Milestone</div>
          <img src="${msImg}" class="sv-tracker-img" alt="Milestone">
        </div>` : ''}
      ${pqId ? (() => {
        const isToA = pqId.startsWith('toa-');
        const pqUrl = isToA
          ? `https://raw.githubusercontent.com/any2cards/worldhaven/master/images/personal-quests/trail-of-ashes/${pqId}.png`
          : `https://raw.githubusercontent.com/any2cards/worldhaven/master/images/personal-quests/crimson-scales/${pqId}.png`;
        return `<div class="sv-tracker-card sv-tracker-pq">
          <div class="sv-tracker-label">📜 PQ</div>
          <img src="${pqUrl}" class="sv-tracker-img" alt="PQ card" onerror="this.src='${PQ_BACK}'">
        </div>`;
      })() : ''}
      ${bgCard ? `
        <div class="sv-tracker-card sv-tracker-bg">
          <div class="sv-tracker-label">🎯 Battle Goal</div>
          <img src="${BG_BACK}" class="sv-tracker-img" alt="Battle Goal">
        </div>` : ''}
    </div>`;
}

// ── Play Tips ─────────────────────────────────────────────────────
function buildPlayTips(classId, member) {
  const tips = [];

  // Milestone tip
  const msCondition = MILESTONE_TRACKER_DATA?.[classId];
  if (msCondition) {
    tips.push({ icon: '🏆', label: 'Milestone', text: msCondition });
  }

  // PQ tip
  const pqId = member.characters?.pq_card_id;
  const pqTracker = pqId ? PQ_TRACKER_DATA?.[pqId] : null;
  if (pqTracker) {
    tips.push({ icon: '📜', label: 'Personal Quest', text: pqTracker.condition });
  }

  // Battle Goal tip
  const bgCard = member.battle_goal_card;
  const bgTracker = (bgCard && typeof BATTLE_GOAL_DATA !== 'undefined') ? BATTLE_GOAL_DATA?.[bgCard] : null;
  if (bgTracker) {
    tips.push({ icon: '🎯', label: 'Battle Goal', text: bgTracker.condition });
  } else if (bgCard) {
    tips.push({ icon: '🎯', label: 'Battle Goal', text: `Card ${bgCard} — check your card for the goal.` });
  }

  // Class play tips (first 2 from class tips array)
  const classData = CLASS_REGISTRY?.[classId];
  const classTips = classData?.tips?.slice(0, 2) ?? [];
  classTips.forEach(t => {
    tips.push({ icon: '💡', label: t.category, text: t.text });
  });

  if (!tips.length) return '';

  return `
    <div class="sv-tips-area">
      <div class="sv-tips-label">💡 Play Tips</div>
      <div class="sv-tips-list">
        ${tips.map(t => `
          <div class="sv-tip">
            <span class="sv-tip-icon">${t.icon}</span>
            <span class="sv-tip-label">${t.label}:</span>
            <span class="sv-tip-text">${t.text}</span>
          </div>`).join('')}
      </div>
    </div>`;
}

// ── GM Controls ───────────────────────────────────────────────────
function buildGMControls() {
  if (!sv.isGM) return '';
  return `
    <div class="sv-gm-controls" id="sv-gm-controls">
      <button class="sv-gm-btn sv-gm-btn-danger" id="sv-cancel-scenario">✕ Cancel Scenario</button>
      <button class="sv-gm-btn" id="sv-pause-scenario">⏸ Pause</button>
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

  // Play card button
  document.querySelectorAll('.sv-play-card-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const { cardId, charId } = btn.dataset;
      if (!sv.playState[charId]) sv.playState[charId] = { hand: [], active: [], discard: [], lost: [], handCards: [] };
      sv.playState[charId].active.push(cardId);
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
  const overlay = document.getElementById('scenario-view-overlay');
  if (overlay) { overlay.style.display = 'none'; overlay.innerHTML = ''; }
}
