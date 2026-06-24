// campaign.js — Campaign management module for Crimson Scales KB
// Requires Supabase JS client loaded before this script

// ── CONFIG (replace with real values after Supabase setup) ──
const SUPABASE_URL  = 'https://djssjkjcckqkgwzkjnif.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqc3Nqa2pjY2txa2d3emtqbmlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMjcwNzgsImV4cCI6MjA5NzkwMzA3OH0.mKpyxNhSAW7zFhX2A71CoC1WbGMYOr4rJ8hHnLw1jJs';

let _sb = null;
function sb() {
  if (!_sb) _sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
  return _sb;
}

// ── STARTING GROUPS ──────────────────────────────────────────
const STARTING_GROUPS = {
  naturalists: {
    name: "Naturalists",
    icon: "🌿",
    tagline: "Masters of terrain, conditions, and the wild",
    classes: ["mirefoot", "hollowpact", "chieftain", "luminary"],
    description: "The Naturalists excel at controlling the battlefield with terrain and conditions. The Mirefoot poisons and wounds from range, the Hollowpact teleports and creates Void Pits, the Chieftain commands powerful summon mounts, and the Luminary illuminates the party with Glow abilities."
  },
  militants: {
    name: "Militants",
    icon: "⚔️",
    tagline: "Front-line fighters built for aggression",
    classes: ["chainguard", "unknown1", "unknown2", "unknown3"],
    description: "Coming soon — class guides in development."
  },
  protectors: {
    name: "Protectors",
    icon: "🛡️",
    tagline: "Shields and support for the whole party",
    classes: ["hierophant", "unknown1", "unknown2", "unknown3"],
    description: "Coming soon — class guides in development."
  },
  explorers: {
    name: "Explorers",
    icon: "🗺️",
    tagline: "Mobility, looting, and scenario objectives",
    classes: ["unknown1", "unknown2", "unknown3", "unknown4"],
    description: "Coming soon — class guides in development."
  },
  trailblazers: {
    name: "Trailblazers",
    icon: "🔥",
    tagline: "Blazing a path through any obstacle",
    classes: ["unknown1", "unknown2", "unknown3", "unknown4"],
    description: "Coming soon — class guides in development."
  }
};

// Class display names
const CLASS_DISPLAY = {
  mirefoot:   { name: "Quatryl Mirefoot",   symbol: "Sprig",        icon: "🌿" },
  hollowpact: { name: "Savvas Hollowpact",  symbol: "Vortex",       icon: "🌀" },
  chieftain:  { name: "Orchid Chieftain",   symbol: "Tusks",        icon: "🦏" },
  luminary:   { name: "Lurker Luminary",    symbol: "Crescent Sun", icon: "✨" },
  chainguard: { name: "Inox Chainguard",    symbol: "Chains",       icon: "⛓️" },
  hierophant: { name: "Human Hierophant",   symbol: "Hierophant",   icon: "✝️" },
};

// ── DB HELPERS ───────────────────────────────────────────────
async function getCampaigns() {
  const { data, error } = await sb()
    .from('campaigns')
    .select(`*, campaign_players(*)`)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

async function createCampaign(name, startingGroup) {
  const { data, error } = await sb()
    .from('campaigns')
    .insert({ name, starting_group: startingGroup })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function addPlayer(campaignId, playerName, classId) {
  const { data, error } = await sb()
    .from('campaign_players')
    .insert({ campaign_id: campaignId, player_name: playerName, class_id: classId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteCampaign(id) {
  const { error } = await sb().from('campaigns').delete().eq('id', id);
  if (error) throw error;
}

async function deletePlayer(id) {
  const { error } = await sb().from('campaign_players').delete().eq('id', id);
  if (error) throw error;
}

// ── WIZARD STATE ─────────────────────────────────────────────
let wizardState = {
  step: 0,
  campaignName: '',
  playerNames: ['', '', '', ''],
  selectedGroup: null,
  classAssignments: {}, // playerIndex → classId
};

function resetWizard() {
  wizardState = {
    step: 0,
    campaignName: '',
    playerNames: ['', '', '', ''],
    selectedGroup: null,
    classAssignments: {},
  };
}

// ── RENDER HELPERS ───────────────────────────────────────────
function renderWizardStep() {
  const container = document.getElementById('wizard-content');
  if (!container) return;

  // Update progress dots
  document.querySelectorAll('.wizard-step-dot').forEach(dot => {
    const s = parseInt(dot.dataset.step);
    dot.classList.toggle('active', s === wizardState.step);
    dot.classList.toggle('done', s < wizardState.step);
  });

  const steps = [
    renderStep0_Name,
    renderStep1_Players,
    renderStep2_Group,
    renderStep3_Assign,
    renderStep4_Confirm,
  ];

  container.innerHTML = steps[wizardState.step]();
  bindWizardEvents();
}

function renderStep0_Name() {
  return `
    <div class="wizard-step">
      <h3 class="wizard-step-title">Campaign Name</h3>
      <p class="wizard-step-desc">Give your campaign a memorable name.</p>
      <input class="wizard-input" id="wizard-campaign-name"
        type="text" placeholder="e.g. The Searing Plains Campaign"
        value="${wizardState.campaignName}" maxlength="60">
    </div>
    ${wizardNav(false, true)}
  `;
}

function renderStep1_Players() {
  const inputs = [0,1,2,3].map(i => `
    <div class="wizard-player-row">
      <span class="wizard-player-num">Player ${i+1}</span>
      <input class="wizard-input wizard-player-input" id="wizard-player-${i}"
        type="text" placeholder="Player name" maxlength="30"
        value="${wizardState.playerNames[i]}">
    </div>
  `).join('');
  return `
    <div class="wizard-step">
      <h3 class="wizard-step-title">Player Names</h3>
      <p class="wizard-step-desc">Enter the names of the four players starting this campaign.</p>
      <div class="wizard-players">${inputs}</div>
    </div>
    ${wizardNav(true, true)}
  `;
}

function renderStep2_Group() {
  const cards = Object.entries(STARTING_GROUPS).map(([id, g]) => {
    const classes = g.classes
      .map(c => CLASS_DISPLAY[c] ? `<span class="wizard-class-pill">${CLASS_DISPLAY[c].icon} ${CLASS_DISPLAY[c].name}</span>` : `<span class="wizard-class-pill wizard-class-unknown">Unknown</span>`)
      .join('');
    const selected = wizardState.selectedGroup === id ? 'wizard-group-selected' : '';
    const hasGuides = g.classes.every(c => CLASS_DISPLAY[c]);
    return `
      <div class="wizard-group-card ${selected}" data-group="${id}">
        <div class="wizard-group-header">
          <span class="wizard-group-icon">${g.icon}</span>
          <div>
            <div class="wizard-group-name">${g.name}</div>
            <div class="wizard-group-tagline">${g.tagline}</div>
          </div>
          ${hasGuides ? '<span class="wizard-group-badge">✓ Guides available</span>' : ''}
        </div>
        <div class="wizard-group-classes">${classes}</div>
        <div class="wizard-group-desc">${g.description}</div>
      </div>
    `;
  }).join('');
  return `
    <div class="wizard-step">
      <h3 class="wizard-step-title">Choose Starting Group</h3>
      <p class="wizard-step-desc">Each starting group contains four character classes. Select the group your party will play.</p>
      <div class="wizard-groups">${cards}</div>
    </div>
    ${wizardNav(true, !!wizardState.selectedGroup)}
  `;
}

function renderStep3_Assign() {
  const group = STARTING_GROUPS[wizardState.selectedGroup];
  const rows = group.classes.map((classId, i) => {
    const cls = CLASS_DISPLAY[classId];
    if (!cls) return '';
    const opts = wizardState.playerNames
      .map((name, pi) => `<option value="${pi}" ${wizardState.classAssignments[pi] === classId ? 'selected' : ''}>${name || `Player ${pi+1}`}</option>`)
      .join('');
    return `
      <div class="wizard-assign-row">
        <div class="wizard-assign-class">
          <span class="wizard-class-icon">${cls.icon}</span>
          <div>
            <div class="wizard-assign-name">${cls.name}</div>
            <div class="wizard-assign-symbol">${cls.symbol}</div>
          </div>
        </div>
        <select class="wizard-select" data-class="${classId}">
          <option value="">Select player…</option>
          ${opts}
        </select>
      </div>
    `;
  }).join('');

  return `
    <div class="wizard-step">
      <h3 class="wizard-step-title">Assign Players to Classes</h3>
      <p class="wizard-step-desc">Choose which player will play each class in the <strong>${group.name}</strong> starting group.</p>
      <div class="wizard-assignments">${rows}</div>
    </div>
    ${wizardNav(true, isAssignmentComplete())}
  `;
}

function isAssignmentComplete() {
  const group = STARTING_GROUPS[wizardState.selectedGroup];
  if (!group) return false;
  const assigned = Object.values(wizardState.classAssignments);
  const knownClasses = group.classes.filter(c => CLASS_DISPLAY[c]);
  return knownClasses.every(c =>
    Object.entries(wizardState.classAssignments).some(([pi, cid]) => cid === c)
  ) && new Set(assigned).size === assigned.length;
}

function renderStep4_Confirm() {
  const group = STARTING_GROUPS[wizardState.selectedGroup];
  const assignments = Object.entries(wizardState.classAssignments).map(([pi, classId]) => {
    const cls = CLASS_DISPLAY[classId];
    return `<div class="wizard-confirm-row">
      <span class="wizard-confirm-player">${wizardState.playerNames[pi] || `Player ${parseInt(pi)+1}`}</span>
      <span class="wizard-confirm-arrow">→</span>
      <span class="wizard-confirm-class">${cls.icon} ${cls.name}</span>
    </div>`;
  }).join('');

  return `
    <div class="wizard-step">
      <h3 class="wizard-step-title">Confirm Campaign</h3>
      <div class="wizard-confirm-block">
        <div class="wizard-confirm-label">Campaign</div>
        <div class="wizard-confirm-value">${wizardState.campaignName}</div>
      </div>
      <div class="wizard-confirm-block">
        <div class="wizard-confirm-label">Starting Group</div>
        <div class="wizard-confirm-value">${group.icon} ${group.name}</div>
      </div>
      <div class="wizard-confirm-block">
        <div class="wizard-confirm-label">Players & Classes</div>
        <div class="wizard-confirm-assignments">${assignments}</div>
      </div>
    </div>
    <div class="wizard-nav">
      <button class="wizard-btn wizard-btn-back" id="wizard-back">← Back</button>
      <button class="wizard-btn wizard-btn-primary" id="wizard-create">🎲 Create Campaign</button>
    </div>
  `;
}

function wizardNav(showBack, canNext) {
  const isLast = wizardState.step === 3;
  return `
    <div class="wizard-nav">
      ${showBack ? '<button class="wizard-btn wizard-btn-back" id="wizard-back">← Back</button>' : '<span></span>'}
      <button class="wizard-btn wizard-btn-primary" id="wizard-next" ${canNext ? '' : 'disabled'}>
        ${isLast ? 'Review →' : 'Next →'}
      </button>
    </div>
  `;
}

function bindWizardEvents() {
  // Step 0 — campaign name
  const nameInput = document.getElementById('wizard-campaign-name');
  if (nameInput) {
    nameInput.addEventListener('input', e => {
      wizardState.campaignName = e.target.value.trim();
      const next = document.getElementById('wizard-next');
      if (next) next.disabled = !wizardState.campaignName;
    });
    nameInput.focus();
  }

  // Step 1 — player names
  [0,1,2,3].forEach(i => {
    const inp = document.getElementById(`wizard-player-${i}`);
    if (inp) inp.addEventListener('input', e => {
      wizardState.playerNames[i] = e.target.value.trim();
      const next = document.getElementById('wizard-next');
      if (next) next.disabled = !wizardState.playerNames.every(n => n);
    });
  });

  // Step 2 — group selection
  document.querySelectorAll('.wizard-group-card').forEach(card => {
    card.addEventListener('click', () => {
      wizardState.selectedGroup = card.dataset.group;
      wizardState.classAssignments = {};
      document.querySelectorAll('.wizard-group-card').forEach(c => c.classList.remove('wizard-group-selected'));
      card.classList.add('wizard-group-selected');
      const next = document.getElementById('wizard-next');
      if (next) next.disabled = false;
    });
  });

  // Step 3 — assign players to classes
  document.querySelectorAll('.wizard-select').forEach(sel => {
    sel.addEventListener('change', e => {
      const classId = sel.dataset.class;
      const playerIdx = e.target.value;
      // Remove any previous assignment for this class
      Object.entries(wizardState.classAssignments).forEach(([pi, cid]) => {
        if (cid === classId) delete wizardState.classAssignments[pi];
      });
      // Remove any previous assignment for this player
      if (playerIdx !== '') {
        Object.entries(wizardState.classAssignments).forEach(([pi, cid]) => {
          if (pi === playerIdx) delete wizardState.classAssignments[pi];
        });
        wizardState.classAssignments[playerIdx] = classId;
      }
      const next = document.getElementById('wizard-next');
      if (next) next.disabled = !isAssignmentComplete();
    });
  });

  // Nav buttons
  document.getElementById('wizard-next')?.addEventListener('click', () => {
    wizardState.step++;
    renderWizardStep();
  });

  document.getElementById('wizard-back')?.addEventListener('click', () => {
    wizardState.step--;
    renderWizardStep();
  });

  document.getElementById('wizard-create')?.addEventListener('click', submitCampaign);
}

async function submitCampaign() {
  const btn = document.getElementById('wizard-create');
  if (btn) { btn.disabled = true; btn.textContent = 'Creating…'; }
  try {
    const campaign = await createCampaign(wizardState.campaignName, wizardState.selectedGroup);
    for (const [playerIdx, classId] of Object.entries(wizardState.classAssignments)) {
      await addPlayer(campaign.id, wizardState.playerNames[playerIdx], classId);
    }
    resetWizard();
    closeCampaignWizard();
    loadCampaigns();
    showToast('Campaign created!');
  } catch (err) {
    showToast('Error creating campaign: ' + err.message, true);
    if (btn) { btn.disabled = false; btn.textContent = '🎲 Create Campaign'; }
  }
}

// ── CAMPAIGNS LIST ───────────────────────────────────────────
async function loadCampaigns() {
  const container = document.getElementById('campaigns-list');
  if (!container) return;
  container.innerHTML = '<div class="campaigns-loading">Loading campaigns…</div>';
  try {
    const campaigns = await getCampaigns();
    if (!campaigns.length) {
      container.innerHTML = '<div class="campaigns-empty">No campaigns yet. Create your first one!</div>';
      return;
    }
    container.innerHTML = campaigns.map(c => renderCampaignCard(c)).join('');
    bindCampaignListEvents();
  } catch (err) {
    container.innerHTML = `<div class="campaigns-error">Error loading campaigns: ${err.message}</div>`;
  }
}

function renderCampaignCard(campaign) {
  const group = STARTING_GROUPS[campaign.starting_group] || {};
  const players = (campaign.campaign_players || []).map(p => {
    const cls = CLASS_DISPLAY[p.class_id] || { icon: '?', name: p.class_id };
    return `<div class="campaign-player">
      <span class="campaign-player-icon">${cls.icon}</span>
      <div class="campaign-player-info">
        <div class="campaign-player-name">${p.player_name}</div>
        <div class="campaign-player-class">${cls.name}</div>
      </div>
    </div>`;
  }).join('');

  return `
    <div class="campaign-card" data-id="${campaign.id}">
      <div class="campaign-card-header">
        <div>
          <div class="campaign-card-name">${campaign.name}</div>
          <div class="campaign-card-group">${group.icon || ''} ${group.name || campaign.starting_group}</div>
        </div>
        <button class="campaign-delete-btn" data-id="${campaign.id}" title="Delete campaign">🗑</button>
      </div>
      <div class="campaign-players">${players}</div>
    </div>
  `;
}

function bindCampaignListEvents() {
  document.querySelectorAll('.campaign-delete-btn').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      if (!confirm('Delete this campaign? This cannot be undone.')) return;
      try {
        await deleteCampaign(btn.dataset.id);
        loadCampaigns();
        showToast('Campaign deleted.');
      } catch (err) {
        showToast('Error: ' + err.message, true);
      }
    });
  });
}

// ── MODAL OPEN/CLOSE ─────────────────────────────────────────
function openCampaignPanel() {
  const panel = document.getElementById('campaign-panel');
  if (panel) panel.classList.add('campaign-panel-open');
  loadCampaigns();
}

function closeCampaignPanel() {
  const panel = document.getElementById('campaign-panel');
  if (panel) panel.classList.remove('campaign-panel-open');
}

function openCampaignWizard() {
  resetWizard();
  const modal = document.getElementById('campaign-wizard-modal');
  if (modal) modal.classList.add('campaign-modal-open');
  renderWizardStep();
}

function closeCampaignWizard() {
  const modal = document.getElementById('campaign-wizard-modal');
  if (modal) modal.classList.remove('campaign-modal-open');
}

function showToast(msg, isError = false) {
  let toast = document.getElementById('cs-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'cs-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = 'cs-toast' + (isError ? ' cs-toast-error' : '');
  toast.classList.add('cs-toast-show');
  setTimeout(() => toast.classList.remove('cs-toast-show'), 3000);
}

// ── INIT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('open-campaigns-btn')?.addEventListener('click', openCampaignPanel);
  document.getElementById('close-campaigns-btn')?.addEventListener('click', closeCampaignPanel);
  document.getElementById('campaign-backdrop')?.addEventListener('click', closeCampaignPanel);
  document.getElementById('new-campaign-btn')?.addEventListener('click', openCampaignWizard);
  document.getElementById('close-wizard-btn')?.addEventListener('click', closeCampaignWizard);
  document.getElementById('campaign-wizard-modal')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeCampaignWizard();
  });
});
