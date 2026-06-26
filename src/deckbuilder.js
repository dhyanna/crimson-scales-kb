// deckbuilder.js — Deck Builder for Crimson Scales KB
// Depends on: campaign.js (for sb(), CLASS_DISPLAY, classIcon), app.js (for CLASS_REGISTRY)

// ── STATE ────────────────────────────────────────────────────
let db = {
  player: null,        // campaign_players row
  state: null,         // character_state row
  cards: [],           // character_cards rows
  allClassCards: [],   // full card list from JS data for this class
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
  const base = BASE_HAND_SIZES[db.player?.class_id] ?? 10;
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
async function loadCharacterData(playerId) {
  const [stateRes, cardsRes] = await Promise.all([
    sb().from('character_state').select('*').eq('player_id', playerId).single(),
    sb().from('character_cards').select('*').eq('player_id', playerId),
  ]);
  db.state = stateRes.data;
  db.cards = cardsRes.data ?? [];
}

async function initCharacter(player) {
  // Create character_state
  const handSize = BASE_HAND_SIZES[player.class_id] ?? 10;
  const { data: state } = await sb()
    .from('character_state')
    .insert({ player_id: player.id, hand_size: handSize })
    .select().single();
  db.state = state;

  // Add all Level 1 and Level X cards to the pool
  const classData = CLASS_REGISTRY[player.class_id];
  if (!classData) return;
  const startingCards = classData.cards.filter(c => c.level === '1' || c.level === 'X');
  const rows = startingCards.map(c => ({
    player_id: player.id,
    card_id: c.id || slugify(c.name),
    class_id: player.class_id,
    in_hand: false,
    level_obtained: null,
  }));
  const { data: cards } = await sb().from('character_cards').insert(rows).select();
  db.cards = cards ?? [];
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
  const classId = db.player.class_id;
  const rewardId = MILESTONE_REWARD_IDS[classId];
  const newHandSize = getHandSize() + 1;

  // Add reward card to pool AND hand
  const { data: newCard } = await sb().from('character_cards').insert({
    player_id: db.player.id,
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

async function levelUp(chosenCardId, passedOverIds) {
  const newLevel = db.state.current_level + 1;
  const classId = db.player.class_id;

  // Add chosen card to pool (sideboard by default)
  const { data: newCard } = await sb().from('character_cards').insert({
    player_id: db.player.id,
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
async function openDeckBuilder(player) {
  db.player = player;
  db.allClassCards = CLASS_REGISTRY[player.class_id]?.cards ?? [];

  const overlay = document.getElementById('deckbuilder-overlay');
  overlay.classList.add('db-open');
  renderDeckBuilderLoading();

  await loadCharacterData(player.id);

  if (!db.state) {
    await initCharacter(player);
  }

  renderDeckBuilder();
}

function closeDeckBuilder() {
  document.getElementById('deckbuilder-overlay')?.classList.remove('db-open');
  db = { player: null, state: null, cards: [], allClassCards: [] };
}

// ── RENDER ───────────────────────────────────────────────────
function renderDeckBuilderLoading() {
  document.getElementById('deckbuilder-content').innerHTML =
    '<div class="db-loading">Loading deck…</div>';
}

function renderDeckBuilder() {
  const cls = CLASS_DISPLAY[db.player.class_id];
  const handSize = getHandSize();
  const hand = handCount();
  const owned = ownedCardIds();
  const inHand = handCardIds();
  const milestoneCard = getMilestoneCardData(db.player.class_id);

  // Partition cards
  const handCards = db.allClassCards.filter(c => inHand.has(c.id || slugify(c.name)));
  const sideboardCards = db.allClassCards.filter(c => {
    const cid = c.id || slugify(c.name);
    return owned.has(cid) && !inHand.has(cid) && c.level !== 'M';
  });

  const handFull = hand >= handSize;
  const handOk = hand === handSize;

  document.getElementById('deckbuilder-content').innerHTML = `
    <div class="db-layout">

      <!-- Header -->
      <div class="db-header">
        <div class="db-header-left">
          ${classIcon(db.player.class_id, 40)}
          <div>
            <div class="db-class-name">${cls.name}</div>
            <div class="db-player-name">${db.player.player_name} · Level ${db.state.current_level}</div>
          </div>
        </div>
        <div class="db-header-actions">
          ${db.state.current_level < 9 ? `<button class="db-btn db-btn-secondary" id="db-levelup-btn">⬆ Level Up</button>` : ''}
          <button class="db-btn db-btn-close" id="db-close-btn">✕ Close</button>
        </div>
      </div>

      <!-- Milestone card -->
      ${!db.state.milestone_earned && milestoneCard ? renderMilestoneTracker(milestoneCard) : ''}

      <!-- Hand deck -->
      <div class="db-section">
        <div class="db-section-header">
          <div class="db-section-title">
            Hand Deck
            <span class="db-count ${handOk ? 'db-count-ok' : hand > handSize ? 'db-count-over' : 'db-count-under'}">
              ${hand} / ${handSize}
            </span>
          </div>
          <div class="db-section-hint">${handOk ? '✓ Ready' : hand > handSize ? '⚠ Too many cards' : `Need ${handSize - hand} more`}</div>
        </div>
        <div class="db-card-grid" id="db-hand-grid">
          ${handCards.map(c => renderCardTile(c, true)).join('')}
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
          ${sideboardCards.map(c => renderCardTile(c, false, handFull)).join('')}
          ${sideboardCards.length === 0 ? '<div class="db-empty">All available cards are in your hand</div>' : ''}
        </div>
      </div>

    </div>
  `;

  bindDeckBuilderEvents();
}

function renderMilestoneTracker(milestoneCard) {
  const checks = db.state.milestone_checks;
  const classData = CLASS_REGISTRY[db.player.class_id];
  const milestoneImageUrl = classData?.milestone?.imageUrl ?? milestoneCard?.imageUrl;
  const boxes = Array.from({ length: 10 }, (_, i) =>
    `<button class="db-check-box ${i < checks ? 'db-check-filled' : ''}" data-check="${i}">
      ${i < checks ? '✓' : ''}
    </button>`
  ).join('');

  return `
    <div class="db-section db-milestone-section">
      <div class="db-section-header">
        <div class="db-section-title">🏆 Milestone</div>
        <div class="db-section-hint">${checks}/10 checks — ${10 - checks} remaining</div>
      </div>
      <div class="db-milestone-inner">
        <img src="${milestoneImageUrl}" class="db-milestone-img" alt="Milestone card">
        <div class="db-milestone-checks">
          <div class="db-checks-label">Tap to add / remove checks</div>
          <div class="db-checks-grid">${boxes}</div>
          ${checks === 10 ? `
            <button class="db-btn db-btn-primary db-earn-milestone-btn" id="db-earn-milestone">
              🎉 Claim Milestone Reward
            </button>` : ''}
        </div>
      </div>
    </div>
  `;
}

function renderCardTile(card, inHand, handFull = false) {
  const cid = card.id || slugify(card.name);
  const canAdd = !inHand && !handFull;
  const action = inHand ? 'remove' : 'add';
  const btnLabel = inHand ? '↓ Move to Sideboard' : '↑ Add to Hand';
  const btnClass = inHand ? 'db-card-btn-remove' : `db-card-btn-add ${handFull ? 'db-card-btn-disabled' : ''}`;

  return `
    <div class="db-card-tile" data-card-id="${cid}">
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
  const classId = db.player.class_id;
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
  document.getElementById('db-levelup-btn')?.addEventListener('click', openLevelUpPicker);
  document.getElementById('db-earn-milestone')?.addEventListener('click', handleEarnMilestone);

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
    const milestoneImg = e.target.classList?.contains('db-milestone-img') ? e.target : null;
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
    if (!e.target.closest('.db-card-img-wrap') && !e.target.classList?.contains('db-milestone-img')) {
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
