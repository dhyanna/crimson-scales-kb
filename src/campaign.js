// campaign.js — Campaign management with Supabase Auth
// Requires: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

const SUPABASE_URL  = 'https://djssjkjcckqkgwzkjnif.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqc3Nqa2pjY2txa2d3emtqbmlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMjcwNzgsImV4cCI6MjA5NzkwMzA3OH0.mKpyxNhSAW7zFhX2A71CoC1WbGMYOr4rJ8hHnLw1jJs';

// ── DEV BYPASS ───────────────────────────────────────────────
// Add ?dev to the URL to enable dev mode (skips auth, shows player picker)
// e.g. https://cs.searing-plains.com?dev
const DEV_MODE = new URLSearchParams(window.location.search).has('dev');
let devPlayerOverride = null; // set to a campaign_players.id when bypassing

// ── SUPABASE CLIENT ──────────────────────────────────────────
let _sb = null;
function sb() {
  if (!_sb) _sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
  return _sb;
}

// ── AUTH STATE ───────────────────────────────────────────────
let currentUser = null;
let currentPlayer = null; // campaign_players row claimed by this user

async function initAuth() {
  const { data: { session } } = await sb().auth.getSession();
  currentUser = session?.user ?? null;
  updateAuthUI();

  sb().auth.onAuthStateChange(async (_event, session) => {
    currentUser = session?.user ?? null;
    if (currentUser) await resolveCurrentPlayer();
    updateAuthUI();
    loadCampaigns();
  });

  if (currentUser) await resolveCurrentPlayer();
}

async function resolveCurrentPlayer() {
  if (!currentUser) return;
  // Find any campaign_player row with this user's email that hasn't been claimed yet
  const { data } = await sb()
    .from('campaign_players')
    .select('*')
    .eq('player_email', currentUser.email)
    .is('user_id', null)
    .limit(1);

  if (data && data.length > 0) {
    // Claim this player record
    await sb()
      .from('campaign_players')
      .update({ user_id: currentUser.id })
      .eq('id', data[0].id);
  }

  // Now load their player record
  const { data: players } = await sb()
    .from('campaign_players')
    .select('*')
    .eq('user_id', currentUser.id);

  currentPlayer = players?.[0] ?? null;
}

async function sendMagicLink(email) {
  const { error } = await sb().auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.href }
  });
  if (error) throw error;
}

async function signOut() {
  await sb().auth.signOut();
  currentUser = null;
  currentPlayer = null;
  devPlayerOverride = null;
  updateAuthUI();
  loadCampaigns();
}

function getEffectivePlayer(allPlayers) {
  if (DEV_MODE && devPlayerOverride) {
    return allPlayers.find(p => p.id === devPlayerOverride) ?? null;
  }
  if (currentUser) {
    return allPlayers.find(p => p.user_id === currentUser.id) ?? null;
  }
  return null;
}

function updateAuthUI() {
  const authArea = document.getElementById('campaign-auth-area');
  if (!authArea) return;

  if (DEV_MODE) {
    authArea.innerHTML = `
      <div class="auth-dev-badge">🛠 Dev Mode</div>
    `;
    return;
  }

  if (currentUser) {
    authArea.innerHTML = `
      <div class="auth-user-info">
        <span class="auth-email">${currentUser.email}</span>
        <button class="auth-signout-btn" id="auth-signout-btn">Sign out</button>
      </div>
    `;
    document.getElementById('auth-signout-btn')?.addEventListener('click', signOut);
  } else {
    authArea.innerHTML = `
      <div class="auth-signin-prompt">
        <input class="wizard-input auth-email-input" id="auth-email-input"
          type="email" placeholder="Your email address">
        <button class="campaign-new-btn auth-magic-btn" id="auth-magic-btn">
          ✉️ Send Magic Link
        </button>
        <p class="auth-hint">Enter the email used when your campaign was created.</p>
      </div>
    `;
    document.getElementById('auth-magic-btn')?.addEventListener('click', async () => {
      const email = document.getElementById('auth-email-input')?.value?.trim();
      if (!email) return;
      try {
        await sendMagicLink(email);
        showToast('Magic link sent! Check your email.');
        document.getElementById('auth-email-input').value = '';
      } catch (err) {
        showToast('Error: ' + err.message, true);
      }
    });
  }
}

// ── STARTING GROUPS ──────────────────────────────────────────
const STARTING_GROUPS = {
  naturalists: {
    name: "Naturalists",
    icon: '<img src="naturalists.png" class="wizard-group-img-icon" alt="Naturalists">',
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

const CLASS_DISPLAY = {
  mirefoot:   { name: "Quatryl Mirefoot",   symbol: "Sprig",        icon: "cs-mirefoot-icon.svg" },
  hollowpact: { name: "Savvas Hollowpact",  symbol: "Vortex",       icon: "cs-hollowpact-icon.svg" },
  chieftain:  { name: "Orchid Chieftain",   symbol: "Tusks",        icon: "cs-chieftain-icon.svg" },
  luminary:   { name: "Lurker Luminary",    symbol: "Crescent Sun", icon: "cs-luminary-icon.svg" },
  chainguard: { name: "Inox Chainguard",    symbol: "Chains",       icon: "cs-chainguard-icon.svg" },
  hierophant: { name: "Human Hierophant",   symbol: "Hierophant",   icon: "cs-hierophant-icon.svg" },
};

function classIcon(classId, size = 32) {
  const cls = CLASS_DISPLAY[classId];
  if (!cls) return '<span style="font-size:20px">?</span>';
  return `<img src="${cls.icon}" width="${size}" height="${size}" alt="${cls.name}" class="class-svg-icon">`;
}

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

async function addPlayer(campaignId, playerName, playerEmail, classId) {
  const { data, error } = await sb()
    .from('campaign_players')
    .insert({
      campaign_id: campaignId,
      player_name: playerName,
      player_email: playerEmail.toLowerCase().trim(),
      class_id: classId
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteCampaign(id) {
  const { error } = await sb().from('campaigns').delete().eq('id', id);
  if (error) throw error;
}

// ── WIZARD STATE ─────────────────────────────────────────────
let wizardState = {
  step: 0,
  campaignName: '',
  players: [
    { name: '', email: '' },
    { name: '', email: '' },
    { name: '', email: '' },
    { name: '', email: '' },
  ],
  selectedGroup: null,
  classAssignments: {},
};

function resetWizard() {
  wizardState = {
    step: 0,
    campaignName: '',
    players: [
      { name: '', email: '' },
      { name: '', email: '' },
      { name: '', email: '' },
      { name: '', email: '' },
    ],
    selectedGroup: null,
    classAssignments: {},
  };
}

// ── RENDER STEPS ─────────────────────────────────────────────
function renderWizardStep() {
  const container = document.getElementById('wizard-content');
  if (!container) return;

  document.querySelectorAll('.wizard-step-dot').forEach(dot => {
    const s = parseInt(dot.dataset.step);
    dot.classList.toggle('active', s === wizardState.step);
    dot.classList.toggle('done', s < wizardState.step);
  });

  const steps = [renderStep0_Name, renderStep1_Players, renderStep2_Group, renderStep3_Assign, renderStep4_Confirm];
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
    ${wizardNav(false, !!wizardState.campaignName)}
  `;
}

function renderStep1_Players() {
  const rows = [0,1,2,3].map(i => `
    <div class="wizard-player-row">
      <span class="wizard-player-num">Player ${i+1}</span>
      <input class="wizard-input wizard-player-name" id="wizard-player-name-${i}"
        type="text" placeholder="Name" maxlength="30"
        value="${wizardState.players[i].name}">
      <input class="wizard-input wizard-player-email" id="wizard-player-email-${i}"
        type="email" placeholder="Email"
        value="${wizardState.players[i].email}">
    </div>
  `).join('');

  const canNext = wizardState.players.every(p => p.name && p.email);
  return `
    <div class="wizard-step">
      <h3 class="wizard-step-title">Players</h3>
      <p class="wizard-step-desc">Enter each player's name and email. A magic link will be sent to each email so they can access their character across any device.</p>
      <div class="wizard-players">${rows}</div>
    </div>
    ${wizardNav(true, canNext)}
  `;
}

function renderStep2_Group() {
  const cards = Object.entries(STARTING_GROUPS).map(([id, g]) => {
    const classes = g.classes
      .map(c => CLASS_DISPLAY[c]
        ? `<span class="wizard-class-pill">${classIcon(c, 18)} ${CLASS_DISPLAY[c].name}</span>`
        : `<span class="wizard-class-pill wizard-class-unknown">Unknown</span>`)
      .join('');
    const selected = wizardState.selectedGroup === id ? 'wizard-group-selected' : '';
    const hasGuides = g.classes.every(c => CLASS_DISPLAY[c]);
    return `
      <div class="wizard-group-card ${selected}" data-group="${id}">
        <div class="wizard-group-header">
          <div class="wizard-group-icon">${g.icon}</div>
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
      <p class="wizard-step-desc">Select the group your party will play.</p>
      <div class="wizard-groups">${cards}</div>
    </div>
    ${wizardNav(true, !!wizardState.selectedGroup)}
  `;
}

function renderStep3_Assign() {
  const group = STARTING_GROUPS[wizardState.selectedGroup];
  const rows = group.classes.map((classId) => {
    const cls = CLASS_DISPLAY[classId];
    if (!cls) return '';
    const opts = wizardState.players
      .map((p, pi) => `<option value="${pi}" ${wizardState.classAssignments[pi] === classId ? 'selected' : ''}>${p.name || `Player ${pi+1}`}</option>`)
      .join('');
    return `
      <div class="wizard-assign-row">
        <div class="wizard-assign-class">
          <span class="wizard-class-icon">${classIcon(classId, 36)}</span>
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
  const knownClasses = group.classes.filter(c => CLASS_DISPLAY[c]);
  const assignedClasses = Object.values(wizardState.classAssignments);
  const assignedPlayers = Object.keys(wizardState.classAssignments);
  return knownClasses.every(c => assignedClasses.includes(c)) &&
         new Set(assignedPlayers).size === assignedPlayers.length;
}

function renderStep4_Confirm() {
  const group = STARTING_GROUPS[wizardState.selectedGroup];
  const rows = Object.entries(wizardState.classAssignments).map(([pi, classId]) => {
    const cls = CLASS_DISPLAY[classId];
    const player = wizardState.players[pi];
    return `<div class="wizard-confirm-row">
      <div class="wizard-confirm-player">
        <div class="wizard-confirm-player-name">${player.name}</div>
        <div class="wizard-confirm-player-email">${player.email}</div>
      </div>
      <span class="wizard-confirm-arrow">→</span>
      <span class="wizard-confirm-class">${classIcon(classId, 20)} ${cls.name}</span>
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
        <div class="wizard-confirm-assignments">${rows}</div>
      </div>
      <p class="wizard-confirm-note">✉️ A magic link will be sent to each player's email so they can access their character on any device.</p>
    </div>
    <div class="wizard-nav">
      <button class="wizard-btn wizard-btn-back" id="wizard-back">← Back</button>
      <button class="wizard-btn wizard-btn-primary" id="wizard-create">🎲 Create Campaign</button>
    </div>
  `;
}

function wizardNav(showBack, canNext) {
  return `
    <div class="wizard-nav">
      ${showBack ? '<button class="wizard-btn wizard-btn-back" id="wizard-back">← Back</button>' : '<span></span>'}
      <button class="wizard-btn wizard-btn-primary" id="wizard-next" ${canNext ? '' : 'disabled'}>Next →</button>
    </div>
  `;
}

function bindWizardEvents() {
  // Step 0
  const nameInput = document.getElementById('wizard-campaign-name');
  if (nameInput) {
    nameInput.addEventListener('input', e => {
      wizardState.campaignName = e.target.value.trim();
      const next = document.getElementById('wizard-next');
      if (next) next.disabled = !wizardState.campaignName;
    });
    nameInput.focus();
  }

  // Step 1 — names and emails
  [0,1,2,3].forEach(i => {
    document.getElementById(`wizard-player-name-${i}`)?.addEventListener('input', e => {
      wizardState.players[i].name = e.target.value.trim();
      updateStep1Next();
    });
    document.getElementById(`wizard-player-email-${i}`)?.addEventListener('input', e => {
      wizardState.players[i].email = e.target.value.trim();
      updateStep1Next();
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

  // Step 3 — assign
  document.querySelectorAll('.wizard-select').forEach(sel => {
    sel.addEventListener('change', e => {
      const classId = sel.dataset.class;
      const playerIdx = e.target.value;
      Object.keys(wizardState.classAssignments).forEach(pi => {
        if (wizardState.classAssignments[pi] === classId) delete wizardState.classAssignments[pi];
      });
      if (playerIdx !== '') {
        Object.keys(wizardState.classAssignments).forEach(pi => {
          if (pi === playerIdx) delete wizardState.classAssignments[pi];
        });
        wizardState.classAssignments[playerIdx] = classId;
      }
      const next = document.getElementById('wizard-next');
      if (next) next.disabled = !isAssignmentComplete();
    });
  });

  // Nav
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

function updateStep1Next() {
  const next = document.getElementById('wizard-next');
  if (next) next.disabled = !wizardState.players.every(p => p.name && p.email);
}

async function submitCampaign() {
  const btn = document.getElementById('wizard-create');
  if (btn) { btn.disabled = true; btn.textContent = 'Creating…'; }
  try {
    const campaign = await createCampaign(wizardState.campaignName, wizardState.selectedGroup);
    for (const [playerIdx, classId] of Object.entries(wizardState.classAssignments)) {
      const p = wizardState.players[playerIdx];
      await addPlayer(campaign.id, p.name, p.email, classId);
    }
    // Send magic links to all players
    if (!DEV_MODE) {
      for (const p of wizardState.players) {
        if (p.email) {
          try { await sendMagicLink(p.email); } catch (_) {}
        }
      }
    }
    resetWizard();
    closeCampaignWizard();
    loadCampaigns();
    showToast(DEV_MODE ? 'Campaign created!' : 'Campaign created! Magic links sent to all players.');
  } catch (err) {
    showToast('Error: ' + err.message, true);
    if (btn) { btn.disabled = false; btn.textContent = '🎲 Create Campaign'; }
  }
}

// ── DEV MODE PLAYER PICKER ───────────────────────────────────
function renderDevPicker(players) {
  if (!DEV_MODE || !players.length) return '';
  const opts = players.map(p => {
    const cls = CLASS_DISPLAY[p.class_id];
    return `<option value="${p.id}" ${devPlayerOverride === p.id ? 'selected' : ''}>
      ${p.player_name} (${cls ? cls.name : p.class_id})
    </option>`;
  }).join('');
  return `
    <div class="dev-picker">
      <span class="dev-picker-label">🛠 Acting as:</span>
      <select class="wizard-select dev-picker-select" id="dev-player-select">
        <option value="">— pick player —</option>
        ${opts}
      </select>
    </div>
  `;
}

// ── CAMPAIGNS LIST ───────────────────────────────────────────
async function loadCampaigns() {
  const container = document.getElementById('campaigns-list');
  if (!container) return;
  container.innerHTML = '<div class="campaigns-loading">Loading…</div>';
  try {
    const campaigns = await getCampaigns();
    if (!campaigns.length) {
      container.innerHTML = '<div class="campaigns-empty">No campaigns yet. Create your first one!</div>';
      return;
    }
    container.innerHTML = campaigns.map(c => renderCampaignCard(c)).join('');
    bindCampaignListEvents(campaigns);
  } catch (err) {
    container.innerHTML = `<div class="campaigns-error">Error: ${err.message}</div>`;
  }
}

function renderCampaignCard(campaign) {
  const players = (campaign.campaign_players || []);
  const allPlayers = players;
  const myPlayer = getEffectivePlayer(allPlayers);

  const playerCards = players.map(p => {
    const cls = CLASS_DISPLAY[p.class_id] || { name: p.class_id };
    const isMe = myPlayer?.id === p.id;
    const claimed = !!p.user_id;
    return `<div class="campaign-player ${isMe ? 'campaign-player-me' : ''}">
      <div class="campaign-player-icon">${classIcon(p.class_id, 36)}</div>
      <div class="campaign-player-info">
        <div class="campaign-player-name">${p.player_name} ${isMe ? '<span class="player-me-badge">You</span>' : ''}</div>
        <div class="campaign-player-class">${cls.name}</div>
        ${!claimed && !DEV_MODE ? '<div class="player-unclaimed">Awaiting login</div>' : ''}
      </div>
    </div>`;
  }).join('');

  const devPicker = DEV_MODE ? renderDevPicker(players) : '';

  return `
    <div class="campaign-card" data-id="${campaign.id}">
      <div class="campaign-card-header">
        <div class="campaign-card-name">${campaign.name}</div>
        <button class="campaign-delete-btn" data-id="${campaign.id}" title="Delete campaign">🗑</button>
      </div>
      <div class="campaign-players">${playerCards}</div>
      ${devPicker}
    </div>
  `;
}

function bindCampaignListEvents(campaigns) {
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

  // Dev picker changes
  document.querySelectorAll('.dev-picker-select').forEach(sel => {
    sel.addEventListener('change', e => {
      devPlayerOverride = e.target.value || null;
      // Re-render to update "You" badges
      loadCampaigns();
    });
  });
}

// ── MODAL OPEN/CLOSE ─────────────────────────────────────────
function openCampaignPanel() {
  document.getElementById('campaign-panel')?.classList.add('campaign-panel-open');
  loadCampaigns();
}
function closeCampaignPanel() {
  document.getElementById('campaign-panel')?.classList.remove('campaign-panel-open');
}
function openCampaignWizard() {
  resetWizard();
  document.getElementById('campaign-wizard-modal')?.classList.add('campaign-modal-open');
  renderWizardStep();
}
function closeCampaignWizard() {
  document.getElementById('campaign-wizard-modal')?.classList.remove('campaign-modal-open');
}

function showToast(msg, isError = false) {
  let toast = document.getElementById('cs-toast');
  if (!toast) { toast = document.createElement('div'); toast.id = 'cs-toast'; document.body.appendChild(toast); }
  toast.textContent = msg;
  toast.className = 'cs-toast' + (isError ? ' cs-toast-error' : '');
  toast.classList.add('cs-toast-show');
  setTimeout(() => toast.classList.remove('cs-toast-show'), 3500);
}

// ── INIT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  document.getElementById('open-campaigns-btn')?.addEventListener('click', openCampaignPanel);
  document.getElementById('close-campaigns-btn')?.addEventListener('click', closeCampaignPanel);
  document.getElementById('campaign-backdrop')?.addEventListener('click', closeCampaignPanel);
  document.getElementById('new-campaign-btn')?.addEventListener('click', openCampaignWizard);
  document.getElementById('close-wizard-btn')?.addEventListener('click', closeCampaignWizard);
  document.getElementById('campaign-wizard-modal')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeCampaignWizard();
  });
});
