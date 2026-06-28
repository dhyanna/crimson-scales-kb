// deckbuilder.js — Deck Builder for Crimson Scales KB
// Depends on: campaign.js (for sb(), CLASS_DISPLAY, classIcon), app.js (for CLASS_REGISTRY)

// ── STATE ────────────────────────────────────────────────────
let db = {
  character: null,     // characters row
  player: null,        // players row
  state: null,         // character_state row
  cards: [],           // character_cards rows
  allClassCards: [],   // full card list from JS data for this class
  activeBuild: null,
  activeCardTab: 'milestone',
};

// ── HAND SIZES PER CLASS ─────────────────────────────────────
const BASE_HAND_SIZES = {
  chainguard: 10,
  luminary:   10,
  chieftain:  10,
  hierophant: 11,
  hollowpact: 10,
  mirefoot:   10,
};

function getHandSize() {
  const base = BASE_HAND_SIZES[db.character?.class_id] ?? 10;
  return db.state?.milestone_earned ? base + 1 : base;
}

// ── MILESTONE REWARD CARD IDS ────────────────────────────────
const MILESTONE_REWARD_IDS = {
  chainguard: 'rope-pit',
  luminary:   'drawn-into-the-light',
  chieftain:  'call-of-the-wild',
  hierophant: 'uplifting-ascension',
  hollowpact: 'the-void-consumes',
  mirefoot:   'giant-slayer',
};

// ── DB HELPERS ───────────────────────────────────────────────
async function loadCharacterData(characterId) {
  const [stateRes, cardsRes] = await Promise.all([
    sb().from('character_state').select('*').eq('character_id', characterId).single(),
    sb().from('character_cards').select('*').eq('character_id', characterId),
  ]);
  db.state = stateRes.data;
  db.cards = cardsRes.data ?? [];
}

async function initCharacter(character) {
  const handSize = BASE_HAND_SIZES[character.class_id] ?? 10;
  const { data: state, error } = await sb()
    .from('character_state')
    .insert({ character_id: character.id, hand_size: handSize })
    .select().single();
  if (error) { console.error('initCharacter state error:', error); return; }
  db.state = state;

  // Add all Level 1 and Level X cards to the pool (only if KB data exists)
  const classData = CLASS_REGISTRY[character.class_id];
  if (!classData) { db.cards = []; return; }

  const startingCards = classData.cards.filter(c => c.level === '1' || c.level === 'X');
  const rows = startingCards.map(c => ({
    character_id: character.id,
    card_id: c.id || slugify(c.name),
    class_id: character.class_id,
    in_hand: false,
    level_obtained: null,
  }));
  if (rows.length) {
    const { data: cards } = await sb().from('character_cards').insert(rows).select();
    db.cards = cards ?? [];
  } else {
    db.cards = [];
  }
}

async function saveHandToggle(cardId, inHand) {
  const row = db.cards.find(c => c.card_id === cardId);
  if (!row) return;
  await sb().from('character_cards').update({ in_hand: inHand }).eq('id', row.id);
  row.in_hand = inHand;
}

async function saveMilestoneChecks(checks) {
  await sb().from('character_state')
    .update({ milestone_checks: checks, updated_at: new Date().toISOString() })
    .eq('id', db.state.id);
  db.state.milestone_checks = checks;
}

async function earnMilestone() {
  const classId = db.character.class_id;
  const rewardId = MILESTONE_REWARD_IDS[classId];
  const newHandSize = getHandSize() + 1;

  // Add reward card to pool AND hand
  const { data: newCard } = await sb().from('character_cards').insert({
    character_id: db.character.id,
    card_id: rewardId,
    class_id: classId,
    in_hand: true,
    level_obtained: null,
  }).select().single();
  if (newCard) db.cards.push(newCard);

  await sb().from('character_state').update({
    milestone_earned: true,
    hand_size: newHandSize,
    updated_at: new Date().toISOString(),
  }).eq('id', db.state.id);
  db.state.milestone_earned = true;
  db.state.hand_size = newHandSize;
}

async function undoLevelUp() {
  if (db.state.current_level <= 1) return;

  const lastLevel = db.state.current_level;

  // Find the card added at the last level-up
  const lastCard = db.cards.find(c => c.level_obtained === lastLevel);
  if (!lastCard) return;

  // Remove it from character_cards
  await sb().from('character_cards').delete().eq('id', lastCard.id);
  db.cards = db.cards.filter(c => c.id !== lastCard.id);

  // Remove ALL cards that were involved in this level-up from passed_over_cards
  // (the chosen card + the ones passed over at that level — identified as the
  // two new-level cards and any previously passed-over cards that were in the picker)
  const newLevel = lastLevel - 1;
  const classData = CLASS_REGISTRY[db.character.class_id];
  const newLevelCardIds = (classData?.cards ?? [])
    .filter(c => parseInt(c.level) === lastLevel)
    .map(c => c.id || slugify(c.name));

  // Strip all cards from this level out of passed_over_cards
  const passedOver = (db.state.passed_over_cards ?? [])
    .filter(id => !newLevelCardIds.includes(id) && id !== lastCard.card_id);

  await sb().from('character_state').update({
    current_level: newLevel,
    passed_over_cards: passedOver,
    updated_at: new Date().toISOString(),
  }).eq('id', db.state.id);
  db.state.current_level = newLevel;
  db.state.passed_over_cards = passedOver;

  renderDeckBuilder();
  showToast(`Level up undone — back to Level ${newLevel}.`);
}

async function levelUp(chosenCardId, passedOverIds) {
  const newLevel = db.state.current_level + 1;

  // Add chosen card to pool (sideboard by default)
  const classId = db.character.class_id;
  const { data: newCard } = await sb().from('character_cards').insert({
    character_id: db.character.id,
    card_id: chosenCardId,
    class_id: classId,
    in_hand: false,
    level_obtained: newLevel,
  }).select().single();
  if (newCard) db.cards.push(newCard);

  // Merge passed-over cards into state
  const existing = db.state.passed_over_cards ?? [];
  const merged = [...new Set([...existing, ...passedOverIds])];

  await sb().from('character_state').update({
    current_level: newLevel,
    passed_over_cards: merged,
    updated_at: new Date().toISOString(),
  }).eq('id', db.state.id);
  db.state.current_level = newLevel;
  db.state.passed_over_cards = merged;
}

// ── HELPERS ──────────────────────────────────────────────────
function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function getCardData(classId, cardId) {
  const classData = CLASS_REGISTRY[classId];
  if (!classData) return null;
  return classData.cards.find(c => (c.id || slugify(c.name)) === cardId) ?? null;
}

function getMilestoneCardData(classId) {
  const classData = CLASS_REGISTRY[classId];
  if (!classData) return null;
  return classData.cards.find(c => c.level === 'M') ?? null;
}

function ownedCardIds() {
  return new Set(db.cards.map(c => c.card_id));
}

function handCardIds() {
  return new Set(db.cards.filter(c => c.in_hand).map(c => c.card_id));
}

function handCount() {
  return db.cards.filter(c => c.in_hand).length;
}

// ── OPEN / CLOSE ─────────────────────────────────────────────
async function openDeckBuilder(character, player) {
  db.character = character;
  db.player = player;
  db.allClassCards = CLASS_REGISTRY[character.class_id]?.cards ?? [];
  db.activeBuild = null;
  db.activeCardTab = 'milestone';

  const overlay = document.getElementById('deckbuilder-overlay');
  overlay.classList.add('db-open');
  renderDeckBuilderLoading();

  // If this class has no KB data, we can still show the deck builder
  // but card pool will be empty — show a notice
  const hasKbData = !!CLASS_REGISTRY[player.class_id];

  await loadCharacterData(character.id);

  if (!db.state) {
    await initCharacter(character);
  }

  // If state still null after init (e.g. DB error), show error
  if (!db.state) {
    document.getElementById('deckbuilder-content').innerHTML =
      `<div class="db-loading">Error loading character data. Please close and try again.</div>`;
    return;
  }

  // First time setup: name character and pick PQ card
  if (!character.character_name || !character.pq_card_id) {
    runFirstTimeSetup(character, player, () => {
      db.character = character;
      renderDeckBuilder();
    });
    return;
  }

  renderDeckBuilder();
}

function closeDeckBuilder() {
  document.getElementById('deckbuilder-overlay')?.classList.remove('db-open');
  db = { character: null, player: null, state: null, cards: [], allClassCards: [], activeBuild: null, activeCardTab: 'milestone' };
}

// ── RENDER ───────────────────────────────────────────────────
function renderDeckBuilderLoading() {
  document.getElementById('deckbuilder-content').innerHTML =
    '<div class="db-loading">Loading deck…</div>';
}

function renderDeckBuilder() {
  const cls = CLASS_DISPLAY[db.character.class_id] ?? ALL_CLASSES?.[db.character.class_id];
  const hasKbData = !!CLASS_REGISTRY[db.character.class_id];
  db.hasKbData = hasKbData;
  const handSize = getHandSize();
  const hand = handCount();
  const owned = ownedCardIds();
  const inHand = handCardIds();
  const milestoneCard = getMilestoneCardData(db.character.class_id);

  // Partition cards
  const handCards = db.allClassCards.filter(c => inHand.has(c.id || slugify(c.name)));
  const sideboardCards = db.allClassCards.filter(c => {
    const cid = c.id || slugify(c.name);
    return owned.has(cid) && !inHand.has(cid) && c.level !== 'M';
  });

  const noKbNotice = !hasKbData ? `
    <div class="db-section" style="margin-bottom:16px">
      <div class="db-section-header">
        <div class="db-section-title">📖 No Class Guide Yet</div>
      </div>
      <div style="padding:16px;font-size:13px;color:var(--color-text-secondary,#888);line-height:1.6">
        A class guide for <strong>${cls?.name ?? db.player.class_id}</strong> hasn't been added to the
        Knowledge Base yet. Milestone, PQ tracking, and character management are still available above.
        Card pool management will be enabled once the guide is added.
      </div>
    </div>
  ` : '';

  const handFull = hand >= handSize;
  const handOk = hand === handSize;

  // Build toggle buttons from CLASS_BUILDS
  const buildsData = CLASS_BUILDS?.[db.character.class_id];
  const buildToggles = buildsData?.builds?.length ? `
    <div class="db-build-toggles">
      <span class="db-build-label">Highlight build:</span>
      ${buildsData.builds.map(b => `
        <button class="db-build-toggle ${db.activeBuild === b.id ? 'db-build-toggle-active' : ''}"
          data-build="${b.id}">${b.name}</button>
      `).join('')}
    </div>
  ` : '';

  const cardBuildClass = (card) => {
    if (!db.activeBuild) return '';
    const builds = card.builds ?? [];
    return (builds.includes(db.activeBuild) || builds.includes('both')) ? 'db-card-highlighted' : 'db-card-dimmed';
  };

  document.getElementById('deckbuilder-content').innerHTML = `
    <div class="db-layout">

      <!-- Header -->
      <div class="db-header">
        <div class="db-header-left">
          ${classIcon(db.character.class_id, 40)}
          <div>
            <div class="db-class-name">${db.character.character_name ? `${db.character.character_name} · ` : ''}${cls.name}</div>
            <div class="db-player-name">${db.player.player_name} · Level ${db.state.current_level}</div>
          </div>
        </div>
        <div class="db-header-actions">
          ${db.state.current_level < 9 ? `<button class="db-btn db-btn-secondary" id="db-levelup-btn">⬆ Level Up</button>` : ''}
          ${db.state.current_level > 1 ? `<button class="db-btn db-btn-secondary" id="db-undo-levelup-btn" ${!db.hasKbData ? 'disabled' : ''}>↩ Undo Level Up</button>` : ''}
          <button class="db-btn db-btn-secondary db-btn-retire" id="db-retire-btn">⚰️ Retire / Set Aside</button>
          <button class="db-btn db-btn-close" id="db-close-btn">✕ Close</button>
        </div>
      </div>

      <!-- Milestone / PQ tabs -->
      ${renderCardTabs(milestoneCard)}

      ${noKbNotice}

      <!-- Hand deck -->
      ${hasKbData ? `
        <div class="db-section-header">
          <div class="db-section-title">
            Hand Deck
            <span class="db-count ${handOk ? 'db-count-ok' : hand > handSize ? 'db-count-over' : 'db-count-under'}">
              ${hand} / ${handSize}
            </span>
          </div>
          <div class="db-section-hint-row">
            <span>${handOk ? '✓ Ready' : hand > handSize ? '⚠ Too many cards' : `Need ${handSize - hand} more`}</span>
            ${buildToggles}
          </div>
        </div>
        <div class="db-card-grid" id="db-hand-grid">
          ${handCards.map(c => renderCardTile(c, true, false, cardBuildClass(c))).join('')}
          ${hand === 0 ? '<div class="db-empty">No cards in hand — move cards up from your sideboard</div>' : ''}
        </div>
      </div>

      <!-- Sideboard -->
      <div class="db-section">
        <div class="db-section-header">
          <div class="db-section-title">
            Sideboard
            <span class="db-count">${sideboardCards.length}</span>
          </div>
          <div class="db-section-hint">Cards available but not in your hand</div>
        </div>
        <div class="db-card-grid" id="db-sideboard-grid">
          ${sideboardCards.map(c => renderCardTile(c, false, handFull, cardBuildClass(c))).join('')}
          ${sideboardCards.length === 0 ? '<div class="db-empty">All available cards are in your hand</div>' : ''}
        </div>
      </div>` : ''}

    </div>
  `;

  bindDeckBuilderEvents();
}

function renderCardTabs(milestoneCard) {
  const hasMilestone = !db.state.milestone_earned && milestoneCard;
  const hasPq = !!db.character.pq_card_id;

  // If neither, show nothing
  if (!hasMilestone && !hasPq) return '';

  // If only one, show it directly without tabs
  if (hasMilestone && !hasPq) return renderMilestoneTracker(milestoneCard);
  if (!hasMilestone && hasPq) return renderPqTracker();

  // Both — show tabbed
  const milestoneActive = db.activeCardTab === 'milestone';
  return `
    <div class="db-section db-tabbed-section">
      <div class="db-tab-bar">
        <button class="db-tab ${milestoneActive ? 'db-tab-active' : ''}" data-tab="milestone">
          🏆 Milestone
        </button>
        <button class="db-tab ${!milestoneActive ? 'db-tab-active' : ''}" data-tab="pq">
          📜 Personal Quest
        </button>
      </div>
      <div class="db-tab-content">
        ${milestoneActive ? renderMilestoneInner(milestoneCard) : renderPqInner()}
      </div>
    </div>
  `;
}

function renderMilestoneInner(card) {
  const checks = db.state.milestone_checks;
  const classData = CLASS_REGISTRY[db.character.class_id];
  const milestoneImageUrl = classData?.milestone?.imageUrl ?? card?.imageUrl;
  const boxes = Array.from({ length: 10 }, (_, i) =>
    `<button class="db-check-box ${i < checks ? 'db-check-filled' : ''}" data-check="${i}">
      ${i < checks ? '✓' : ''}
    </button>`
  ).join('');
  return `
    <div class="db-milestone-inner">
      <img src="${milestoneImageUrl}" class="db-milestone-img" alt="Milestone card">
      <div class="db-milestone-checks">
        <div class="db-checks-label">Tap to add / remove checks — ${checks}/10</div>
        <div class="db-checks-grid">${boxes}</div>
        ${checks === 10 ? `
          <button class="db-btn db-btn-primary db-earn-milestone-btn" id="db-earn-milestone">
            🎉 Claim Milestone Reward
          </button>` : ''}
      </div>
    </div>
  `;
}

function renderPqInner() {
  const pqId = db.character.pq_card_id;
  const unlocksClassId = PQ_UNLOCKS_CLASS[pqId];
  const unlocksClass = unlocksClassId ? (ALL_CLASSES[unlocksClassId]?.name ?? unlocksClassId) : 'Unknown';
  return `
    <div class="db-milestone-inner">
      <img src="${pqCardUrl(pqId)}" class="db-milestone-img db-pq-img" alt="Personal Quest card">
      <div class="db-milestone-checks">
        <div class="db-checks-label">Retirement unlocks: <strong>${unlocksClass}</strong></div>
        <p class="db-checks-label" style="margin-top:8px">
          Complete the quest criteria shown on your PQ card. When ready, use
          <strong>Retire / Set Aside</strong> in the header.
        </p>
      </div>
    </div>
  `;
}

function renderPqTracker() {
  const pqId = db.character.pq_card_id;
  const unlocksClassId = PQ_UNLOCKS_CLASS[pqId];
  const unlocksClass = unlocksClassId ? (ALL_CLASSES[unlocksClassId]?.name ?? unlocksClassId) : 'Unknown';
  return `
    <div class="db-section db-pq-section">
      <div class="db-section-header">
        <div class="db-section-title">📜 Personal Quest</div>
        <div class="db-section-hint">Retirement unlocks: ${unlocksClass}</div>
      </div>
      <div class="db-milestone-inner">
        <img src="${pqCardUrl(pqId)}" class="db-milestone-img db-pq-img" alt="Personal Quest card">
        <div class="db-milestone-checks">
          <p class="db-checks-label">
            Complete the quest criteria shown on your PQ card to retire your character
            and unlock <strong>${unlocksClass}</strong> for the campaign.
          </p>
          <p class="db-checks-label" style="margin-top:8px">
            Use the <strong>Retire / Set Aside</strong> button in the header when ready.
          </p>
        </div>
      </div>
    </div>
  `;
}

function renderMilestoneTracker(milestoneCard) {
  return `
    <div class="db-section db-milestone-section">
      <div class="db-section-header">
        <div class="db-section-title">🏆 Milestone</div>
        <div class="db-section-hint">${db.state.milestone_checks}/10 checks</div>
      </div>
      ${renderMilestoneInner(milestoneCard)}
    </div>
  `;
}

function renderCardTile(card, inHand, handFull = false, highlightClass = '') {
  const cid = card.id || slugify(card.name);
  const action = inHand ? 'remove' : 'add';
  const btnLabel = inHand ? '↓ Move to Sideboard' : '↑ Add to Hand';
  const btnClass = inHand ? 'db-card-btn-remove' : `db-card-btn-add ${handFull ? 'db-card-btn-disabled' : ''}`;

  return `
    <div class="db-card-tile ${highlightClass}" data-card-id="${cid}">
      <div class="db-card-img-wrap" data-card-id="${cid}">
        <img src="${card.imageUrl}" class="db-card-img" alt="${card.name}"
          onerror="this.parentElement.classList.add('db-img-error')">
        <div class="db-card-overlay">
          <button class="db-card-btn ${btnClass}"
            data-action="${action}" data-card-id="${cid}"
            ${!inHand && handFull ? 'disabled' : ''}>
            ${btnLabel}
          </button>
        </div>
      </div>
      <div class="db-card-label">
        <span class="db-card-name">${card.name}</span>
        <span class="db-card-level">L${card.level}</span>
      </div>
    </div>
  `;
}

// ── LEVEL UP PICKER ──────────────────────────────────────────
function openLevelUpPicker() {
  const newLevel = db.state.current_level + 1;
  const classId = db.character.class_id;
  const owned = ownedCardIds();
  const passedOver = db.state.passed_over_cards ?? [];

  // Two cards at the new level
  const newLevelCards = db.allClassCards.filter(c => parseInt(c.level) === newLevel);

  // Previously passed-over cards (not yet owned)
  const passedOverCards = db.allClassCards.filter(c => {
    const cid = c.id || slugify(c.name);
    return passedOver.includes(cid) && !owned.has(cid);
  });

  const allOptions = [...newLevelCards, ...passedOverCards];

  const modal = document.createElement('div');
  modal.className = 'db-modal-backdrop';
  modal.id = 'db-levelup-modal';
  modal.innerHTML = `
    <div class="db-modal">
      <div class="db-modal-header">
        <h3 class="db-modal-title">⬆ Level Up to ${newLevel}</h3>
        <button class="campaign-wizard-close" id="db-levelup-close">✕</button>
      </div>
      <p class="db-modal-desc">Choose one card to permanently add to your available pool.</p>
      <div class="db-levelup-grid">
        ${allOptions.map(c => {
          const cid = c.id || slugify(c.name);
          const isPassed = passedOver.includes(cid);
          return `
            <div class="db-levelup-card" data-card-id="${cid}">
              ${isPassed ? '<div class="db-levelup-badge">Previously passed</div>' : `<div class="db-levelup-badge db-levelup-new">Level ${c.level}</div>`}
              <img src="${c.imageUrl}" class="db-levelup-img" alt="${c.name}">
              <div class="db-card-label">
                <span class="db-card-name">${c.name}</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
      <div class="wizard-nav" style="margin-top:16px">
        <button class="wizard-btn wizard-btn-back" id="db-levelup-close2">Cancel</button>
        <button class="wizard-btn wizard-btn-primary" id="db-levelup-confirm" disabled>
          ✓ Confirm Choice
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  let selectedCardId = null;

  modal.querySelectorAll('.db-levelup-card').forEach(card => {
    card.addEventListener('mouseover', () => {
      const img = card.querySelector('.db-levelup-img');
      const cardId = card.dataset.cardId;
      if (img) zoomHoveredCard = { src: img.src, cardId };
    });
    card.addEventListener('mouseout', () => {
      zoomHoveredCard = null;
    });
    card.addEventListener('click', () => {
      modal.querySelectorAll('.db-levelup-card').forEach(c => c.classList.remove('db-levelup-selected'));
      card.classList.add('db-levelup-selected');
      selectedCardId = card.dataset.cardId;
      document.getElementById('db-levelup-confirm').disabled = false;
    });
  });

  const close = () => modal.remove();
  document.getElementById('db-levelup-close').addEventListener('click', close);
  document.getElementById('db-levelup-close2').addEventListener('click', close);

  document.getElementById('db-levelup-confirm').addEventListener('click', async () => {
    if (!selectedCardId) return;
    const passedIds = allOptions
      .map(c => c.id || slugify(c.name))
      .filter(id => id !== selectedCardId);
    modal.remove();
    await levelUp(selectedCardId, passedIds);
    renderDeckBuilder();
    showToast(`Leveled up to ${db.state.current_level}! Card added to sideboard.`);
  });
}

// ── EVENT BINDING ─────────────────────────────────────────────
function bindDeckBuilderEvents() {
  document.getElementById('db-close-btn')?.addEventListener('click', closeDeckBuilder);
  document.getElementById('db-levelup-btn')?.addEventListener('click', () => {
    if (!db.hasKbData) { showToast('Level up cards unavailable — no class guide exists for this class yet.', true); return; }
    openLevelUpPicker();
  });
  document.getElementById('db-undo-levelup-btn')?.addEventListener('click', async () => {
    if (!confirm(`Undo level up? This will remove the card chosen at Level ${db.state.current_level} and return you to Level ${db.state.current_level - 1}.`)) return;
    await undoLevelUp();
  });
  document.getElementById('db-retire-btn')?.addEventListener('click', () => {
    openRetirementDialog(db.character, db.character.campaign_id, db.player.id, (action, result) => {
      closeDeckBuilder();
      loadCampaigns();
    });
  });
  document.getElementById('db-earn-milestone')?.addEventListener('click', handleEarnMilestone);

  // Card tabs (Milestone / PQ)
  document.querySelectorAll('.db-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      db.activeCardTab = btn.dataset.tab;
      renderDeckBuilder();
    });
  });

  // Build toggles
  document.querySelectorAll('.db-build-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const build = btn.dataset.build;
      db.activeBuild = db.activeBuild === build ? null : build;
      renderDeckBuilder();
    });
  });

  // Check boxes
  document.querySelectorAll('.db-check-box').forEach(btn => {
    btn.addEventListener('click', async () => {
      const i = parseInt(btn.dataset.check);
      const checks = db.state.milestone_checks;
      // Toggle: if clicking the last filled box remove it, otherwise fill up to i+1
      const newChecks = (i < checks) ? i : i + 1;
      await saveMilestoneChecks(newChecks);
      renderDeckBuilder();
    });
  });

  // Card move buttons
  document.querySelectorAll('.db-card-btn[data-action]').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      if (btn.disabled) return;
      const cardId = btn.dataset.cardId;
      const action = btn.dataset.action;
      const inHand = action === 'remove';
      await saveHandToggle(cardId, !inHand);
      renderDeckBuilder();
    });
  });
}

async function handleEarnMilestone() {
  const rewardCard = getMilestoneCardData(db.player.class_id);
  if (!confirm(`Congratulations! Add "${rewardCard?.name ?? 'the milestone reward card'}" permanently to your hand?`)) return;
  await earnMilestone();
  renderDeckBuilder();
  showToast('Milestone earned! Reward card added to your hand permanently.');
}

// ── CARD ZOOM ────────────────────────────────────────────────
let zoomHoveredCard = null; // { src, cardId }

function initCardZoom() {
  if (!document.getElementById('db-card-zoom')) {
    const zoom = document.createElement('div');
    zoom.id = 'db-card-zoom';
    zoom.className = 'db-card-zoom';
    zoom.innerHTML = `
      <img id="db-zoom-img" src="" alt="Card zoom">
      <div class="db-zoom-commentary" id="db-zoom-commentary"></div>
      <div class="db-zoom-hint">Hold <kbd>Space</kbd> to zoom · Release to dismiss</div>
    `;
    document.body.appendChild(zoom);
  }

  document.addEventListener('mouseover', e => {
    const wrap = e.target.closest('.db-card-img-wrap');
    const milestoneImg = e.target.classList?.contains('db-milestone-img') || e.target.classList?.contains('db-pq-img') ? e.target : null;
    if (wrap) {
      const img = wrap.querySelector('.db-card-img');
      const tile = wrap.closest('.db-card-tile');
      const cardId = tile?.dataset.cardId ?? wrap.closest('[data-card-id]')?.dataset.cardId ?? null;
      zoomHoveredCard = img?.src ? { src: img.src, cardId } : null;
    } else if (milestoneImg) {
      zoomHoveredCard = { src: milestoneImg.src, cardId: null };
    }
  });

  document.addEventListener('mouseout', e => {
    if (!e.target.closest('.db-card-img-wrap') && !e.target.classList?.contains('db-milestone-img') && !e.target.classList?.contains('db-pq-img')) {
      zoomHoveredCard = null;
    }
  });

  document.addEventListener('keydown', e => {
    if (e.code === 'Space' && zoomHoveredCard && document.getElementById('deckbuilder-overlay')?.classList.contains('db-open')) {
      e.preventDefault();
      const zoom = document.getElementById('db-card-zoom');
      const img = document.getElementById('db-zoom-img');
      const commentary = document.getElementById('db-zoom-commentary');
      if (!zoom || !img) return;

      img.src = zoomHoveredCard.src;

      // Fill commentary if we have a cardId
      if (commentary) {
        const cardData = zoomHoveredCard.cardId
          ? getCardData(db.player.class_id, zoomHoveredCard.cardId)
          : null;
        if (cardData) {
          commentary.innerHTML = `
            <div class="db-zoom-card-name">${cardData.name}</div>
            ${cardData.commentary ? `<div class="db-zoom-card-commentary">${cardData.commentary}</div>` : ''}
          `;
        } else {
          commentary.innerHTML = '';
        }
      }

      zoom.classList.add('db-zoom-active');
    }
  });

  document.addEventListener('keyup', e => {
    if (e.code === 'Space') {
      document.getElementById('db-card-zoom')?.classList.remove('db-zoom-active');
    }
  });
}

// ── INIT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initCardZoom();
  document.getElementById('deckbuilder-overlay')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeDeckBuilder();
  });
});
