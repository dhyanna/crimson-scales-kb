// campaign.js — Campaign management (schema v2)
// Players = real people. Characters = class instances belonging to a campaign.

const SUPABASE_URL  = 'https://djssjkjcckqkgwzkjnif.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqc3Nqa2pjY2txa2d3emtqbmlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMjcwNzgsImV4cCI6MjA5NzkwMzA3OH0.mKpyxNhSAW7zFhX2A71CoC1WbGMYOr4rJ8hHnLw1jJs';

// DEV MODE: add ?dev to URL to bypass auth and use player picker
const DEV_MODE = new URLSearchParams(window.location.search).has('dev');

// ── SUPABASE ─────────────────────────────────────────────────
let _sb = null;
function sb() {
  if (!_sb) _sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
  return _sb;
}

// ── AUTH STATE ───────────────────────────────────────────────
let currentUser = null;
let currentPlayer = null; // players row for the authenticated user

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
  const { data } = await sb()
    .from('players')
    .select('*')
    .eq('user_id', currentUser.id)
    .limit(1)
    .single();
  if (!data) {
    // Claim unclaimed player row matching this email
    const { data: unclaimed } = await sb()
      .from('players')
      .select('*')
      .eq('player_email', currentUser.email)
      .is('user_id', null)
      .limit(1)
      .single();
    if (unclaimed) {
      await sb().from('players').update({ user_id: currentUser.id }).eq('id', unclaimed.id);
      currentPlayer = { ...unclaimed, user_id: currentUser.id };
    }
  } else {
    currentPlayer = data;
  }
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
  currentUser = null; currentPlayer = null; devPlayerOverride = null;
  updateAuthUI(); loadCampaigns();
}

function updateAuthUI() {
  const area = document.getElementById('campaign-auth-area');
  if (!area) return;
  if (DEV_MODE) {
    area.innerHTML = '<div class="auth-dev-badge">🛠 Dev Mode</div>';
    return;
  }
  if (currentUser) {
    area.innerHTML = `
      <div class="auth-user-info">
        <span class="auth-email">${currentUser.email}</span>
        <button class="auth-signout-btn" id="auth-signout-btn">Sign out</button>
      </div>`;
    document.getElementById('auth-signout-btn')?.addEventListener('click', signOut);
  } else {
    area.innerHTML = `
      <div class="auth-signin-prompt">
        <input class="wizard-input auth-email-input" id="auth-email-input" type="email" placeholder="Your email address">
        <button class="campaign-new-btn auth-magic-btn" id="auth-magic-btn">✉️ Send Magic Link</button>
        <p class="auth-hint">Enter the email used when your campaign was created.</p>
      </div>`;
    document.getElementById('auth-magic-btn')?.addEventListener('click', async () => {
      const email = document.getElementById('auth-email-input')?.value?.trim();
      if (!email) return;
      try { await sendMagicLink(email); showToast('Magic link sent! Check your email.'); }
      catch (err) { showToast('Error: ' + err.message, true); }
    });
  }
}

// ── DEV PLAYER OVERRIDE ──────────────────────────────────────
let devPlayerOverride = null; // players.id

function getEffectivePlayer(players) {
  if (DEV_MODE && devPlayerOverride) return players.find(p => p.id === devPlayerOverride) ?? null;
  if (currentUser) return players.find(p => p.user_id === currentUser.id) ?? null;
  return null;
}

function getActiveCharacter(characters, playerId) {
  return characters.find(c => c.assigned_player_id === playerId && c.status === 'active') ?? null;
}

// ── STARTING GROUPS ──────────────────────────────────────────
const STARTING_GROUPS = {
  naturalists:  { name: "Naturalists",  icon: '<img src="naturalists.png" class="wizard-group-img-icon" alt="Naturalists">', tagline: "Masters of terrain, conditions, and the wild", classes: ["mirefoot","hollowpact","chieftain","luminary"], description: "The Naturalists excel at controlling the battlefield with terrain and conditions." },
  militants:    { name: "Militants",    icon: "⚔️", tagline: "Front-line fighters built for aggression",      classes: ["bombard","fireknight","hierophant","mirefoot"],     description: "A hard-hitting offensive group — Bombard lays down Projectile devastation from range while Hierophant buffs and heals, Mirefoot applies upgraded conditions, and Fire Knight provides adjacency support and AoE." },
  protectors:   { name: "Protectors",  icon: "🛡️", tagline: "Shields and support for the whole party",       classes: ["chainguard","chieftain","fireknight","hierophant"],  description: "A defensively-minded group built around tanking, healing, and team support — Chainguard and Chieftain hold the front line while Fire Knight and Hierophant keep everyone alive and buffed." },
  explorers:    { name: "Explorers",   icon: "🗺️", tagline: "Mobility, looting, and scenario objectives",    classes: ["brightspark","chainguard","hollowpact","starslinger"], description: "A mobile, versatile group — Brightspark applies conditions and heals from range, Chainguard anchors the front line, Hollowpact manipulates the void, and Starslinger delivers positional AoE damage and hex-pattern ally support." },
  trailblazers: { name: "Trailblazers",icon: "🔥", tagline: "Blazing a path through any obstacle",          classes: ["bombard","brightspark","luminary","starslinger"],    description: "A ranged powerhouse group — Bombard lays down Projectile devastation, Brightspark applies conditions and heals, Luminary buffs with Glow and Scuttle, and Starslinger delivers stellar AoE and hex-pattern support." },
};

const CLASS_DISPLAY = {
  mirefoot:    { name: "Quatryl Mirefoot",    symbol: "Sprig",        icon: "cs-mirefoot-icon.svg" },
  hollowpact:  { name: "Savvas Hollowpact",   symbol: "Vortex",       icon: "cs-hollowpact-icon.svg" },
  chieftain:   { name: "Orchid Chieftain",    symbol: "Tusk",         icon: "cs-chieftain-icon.svg" },
  luminary:    { name: "Lurker Luminary",     symbol: "Crescent Sun", icon: "cs-luminary-icon.svg" },
  chainguard:  { name: "Inox Chainguard",     symbol: "Chained Helm", icon: "cs-chainguard-icon.svg" },
  hierophant:  { name: "Human Hierophant",    symbol: "Leaf",         icon: "cs-hierophant-icon.svg" },
  bombard:     { name: "Quatryl Bombard",     symbol: "Target",       icon: "cs-bombard-icon.svg" },
  fireknight:  { name: "Valrath Fire Knight", symbol: "Ladder Axe",   icon: "cs-fireknight-icon.svg" },
  brightspark: { name: "Human Brightspark",   symbol: "Flask",        icon: "cs-brightspark-icon.svg" },
  starslinger: { name: "Aesther Starslinger", symbol: "Galaxy",       icon: "cs-starslinger-icon.svg" },
};

function classIcon(classId, size = 32) {
  const cls = CLASS_DISPLAY[classId] ?? ALL_CLASSES?.[classId];
  if (!cls) return '<span style="font-size:20px">?</span>';
  if (cls.icon) return `<img src="${cls.icon}" width="${size}" height="${size}" alt="${cls.name}" class="class-svg-icon">`;
  return `<span class="cls-symbol-badge" style="font-size:${Math.round(size*0.4)}px">${cls.symbol}</span>`;
}

// ── DB HELPERS ───────────────────────────────────────────────
async function getCampaigns() {
  const { data, error } = await sb()
    .from('campaigns')
    .select(`*, players(*), characters(*), campaign_unlocked_classes(*)`)
    .order('is_active', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

async function setActiveCampaign(campaignId) {
  // Clear all active flags first, then set the chosen one
  await sb().from('campaigns').update({ is_active: false }).neq('id', campaignId);
  const { error } = await sb().from('campaigns').update({ is_active: true }).eq('id', campaignId);
  if (error) throw error;
}

async function createCampaign(name, partyName, startingGroup) {
  // Deactivate any existing active campaign
  await sb().from('campaigns').update({ is_active: false }).eq('is_active', true);
  const { data, error } = await sb()
    .from('campaigns')
    .insert({ name, party_name: partyName, starting_group: startingGroup, is_active: true })
    .select().single();
  if (error) throw error;
  return data;
}

async function addPlayerToCampaign(campaignId, playerName, playerEmail, isFoundingMember = false, role = 'player') {
  const { data, error } = await sb()
    .from('players')
    .insert({ campaign_id: campaignId, player_name: playerName, player_email: playerEmail.toLowerCase().trim(), is_founding_member: isFoundingMember, role })
    .select().single();
  if (error) throw error;
  return data;
}

async function createCharacter(campaignId, classId) {
  const { data, error } = await sb()
    .from('characters')
    .insert({ campaign_id: campaignId, class_id: classId, status: 'active' })
    .select().single();
  if (error) throw error;
  return data;
}

async function assignCharacterToPlayer(characterId, playerId) {
  const { error } = await sb()
    .from('characters')
    .update({ assigned_player_id: playerId })
    .eq('id', characterId);
  if (error) throw error;
}

function isCM(players) {
  const myPlayer = getEffectivePlayer(players);
  return myPlayer?.role === 'cm';
}

async function deleteCampaign(id) {
  const { error } = await sb().from('campaigns').delete().eq('id', id);
  if (error) throw error;
}

// ── WIZARD STATE ─────────────────────────────────────────────
let wizardState = {
  step: 0,
  campaignName: '',
  partyName: '',
  players: [
    { name: '', email: '' },
    { name: '', email: '' },
    { name: '', email: '' },
    { name: '', email: '' },
  ],
  selectedGroup: null,
  classAssignments: {}, // playerIndex → classId
};

function resetWizard() {
  wizardState = {
    step: 0, campaignName: '', partyName: '',
    players: [{name:'',email:''},{name:'',email:''},{name:'',email:''},{name:'',email:''}],
    selectedGroup: null, classAssignments: {},
  };
}

// ── WIZARD RENDER ─────────────────────────────────────────────
function renderWizardStep() {
  const container = document.getElementById('wizard-content');
  if (!container) return;
  document.querySelectorAll('.wizard-step-dot').forEach(dot => {
    const s = parseInt(dot.dataset.step);
    dot.classList.toggle('active', s === wizardState.step);
    dot.classList.toggle('done', s < wizardState.step);
  });
  const steps = [renderStep0_Name, renderStep1_Players, renderStep2_Group, renderStep3_PartyName, renderStep4_Assign, renderStep5_Confirm];
  container.innerHTML = steps[wizardState.step]();
  bindWizardEvents();
}

function renderStep0_Name() {
  return `<div class="wizard-step">
    <h3 class="wizard-step-title">Campaign Name</h3>
    <p class="wizard-step-desc">Give your campaign a memorable name.</p>
    <input class="wizard-input" id="wizard-campaign-name" type="text"
      placeholder="e.g. The Searing Plains Campaign" value="${wizardState.campaignName}" maxlength="60">
  </div>${wizardNav(false, !!wizardState.campaignName)}`;
}

function renderStep1_Players() {
  const rows = wizardState.players.map((p, i) => `
    <div class="wizard-player-row">
      <span class="wizard-player-num">Player ${i+1}</span>
      <input class="wizard-input wizard-player-name" id="wizard-player-name-${i}"
        type="text" placeholder="Name" maxlength="30" value="${p.name}">
      <input class="wizard-input wizard-player-email" id="wizard-player-email-${i}"
        type="email" placeholder="Email" value="${p.email}">
    </div>`).join('');
  const canNext = wizardState.players.every(p => p.name && p.email);
  return `<div class="wizard-step">
    <h3 class="wizard-step-title">Players</h3>
    <p class="wizard-step-desc">Enter each player's name and email. Magic links will be sent so they can access their character on any device.</p>
    <div class="wizard-players">${rows}</div>
  </div>${wizardNav(true, canNext)}`;
}

function renderStep2_Group() {
  const cards = Object.entries(STARTING_GROUPS).map(([id, g]) => {
    const classes = g.classes.map(c => CLASS_DISPLAY[c]
      ? `<span class="wizard-class-pill">${classIcon(c, 18)} ${CLASS_DISPLAY[c].name}</span>`
      : `<span class="wizard-class-pill wizard-class-unknown">Unknown</span>`).join('');
    const selected = wizardState.selectedGroup === id ? 'wizard-group-selected' : '';
    const hasGuides = g.classes.every(c => CLASS_DISPLAY[c]);
    return `<div class="wizard-group-card ${selected}" data-group="${id}">
      <div class="wizard-group-header">
        <div class="wizard-group-icon">${g.icon}</div>
        <div><div class="wizard-group-name">${g.name}</div><div class="wizard-group-tagline">${g.tagline}</div></div>
        ${hasGuides ? '<span class="wizard-group-badge">✓ Guides available</span>' : ''}
      </div>
      <div class="wizard-group-classes">${classes}</div>
      <div class="wizard-group-desc">${g.description}</div>
    </div>`;
  }).join('');
  return `<div class="wizard-step">
    <h3 class="wizard-step-title">Choose Starting Group</h3>
    <p class="wizard-step-desc">Select the group your party will play.</p>
    <div class="wizard-groups">${cards}</div>
  </div>${wizardNav(true, !!wizardState.selectedGroup)}`;
}

function renderStep3_PartyName() {
  return `<div class="wizard-step">
    <h3 class="wizard-step-title">Party Name</h3>
    <p class="wizard-step-desc">Give your party of adventurers a name.</p>
    <input class="wizard-input" id="wizard-party-name" type="text"
      placeholder="e.g. The Searing Plains Crew" value="${wizardState.partyName}" maxlength="60">
  </div>${wizardNav(true, !!wizardState.partyName)}`;
}

function renderStep4_Assign() {
  const group = STARTING_GROUPS[wizardState.selectedGroup];
  const rows = group.classes.map(classId => {
    const cls = CLASS_DISPLAY[classId];
    if (!cls) return '';
    const opts = wizardState.players.map((p, pi) =>
      `<option value="${pi}" ${wizardState.classAssignments[pi] === classId ? 'selected' : ''}>${p.name || `Player ${pi+1}`}</option>`
    ).join('');
    return `<div class="wizard-assign-row">
      <div class="wizard-assign-class">
        <span class="wizard-class-icon">${classIcon(classId, 36)}</span>
        <div><div class="wizard-assign-name">${cls.name}</div><div class="wizard-assign-symbol">${cls.symbol}</div></div>
      </div>
      <select class="wizard-select" data-class="${classId}">
        <option value="">Select player…</option>${opts}
      </select>
    </div>`;
  }).join('');
  return `<div class="wizard-step">
    <h3 class="wizard-step-title">Assign Players to Classes</h3>
    <p class="wizard-step-desc">Choose which player will play each class in the <strong>${group.name}</strong> starting group.</p>
    <div class="wizard-assignments">${rows}</div>
  </div>${wizardNav(true, isAssignmentComplete())}`;
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

function renderStep5_Confirm() {
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
  return `<div class="wizard-step">
    <h3 class="wizard-step-title">Confirm Campaign</h3>
    <div class="wizard-confirm-block">
      <div class="wizard-confirm-label">Campaign</div>
      <div class="wizard-confirm-value">${wizardState.campaignName}</div>
    </div>
    <div class="wizard-confirm-block">
      <div class="wizard-confirm-label">Party Name</div>
      <div class="wizard-confirm-value">${wizardState.partyName}</div>
    </div>
    <div class="wizard-confirm-block">
      <div class="wizard-confirm-label">Starting Group</div>
      <div class="wizard-confirm-value">${group.icon} ${group.name}</div>
    </div>
    <div class="wizard-confirm-block">
      <div class="wizard-confirm-label">Players & Classes</div>
      <div class="wizard-confirm-assignments">${rows}</div>
    </div>
    <p class="wizard-confirm-note">✉️ A magic link will be sent to each player's email.</p>
  </div>
  <div class="wizard-nav">
    <button class="wizard-btn wizard-btn-back" id="wizard-back">← Back</button>
    <button class="wizard-btn wizard-btn-primary" id="wizard-create">🎲 Create Campaign</button>
  </div>`;
}

function wizardNav(showBack, canNext) {
  return `<div class="wizard-nav">
    ${showBack ? '<button class="wizard-btn wizard-btn-back" id="wizard-back">← Back</button>' : '<span></span>'}
    <button class="wizard-btn wizard-btn-primary" id="wizard-next" ${canNext ? '' : 'disabled'}>Next →</button>
  </div>`;
}

function bindWizardEvents() {
  const nameInput = document.getElementById('wizard-campaign-name');
  if (nameInput) {
    nameInput.addEventListener('input', e => {
      wizardState.campaignName = e.target.value.trim();
      const next = document.getElementById('wizard-next');
      if (next) next.disabled = !wizardState.campaignName;
    });
    nameInput.focus();
  }
  const partyInput = document.getElementById('wizard-party-name');
  if (partyInput) {
    partyInput.addEventListener('input', e => {
      wizardState.partyName = e.target.value.trim();
      const next = document.getElementById('wizard-next');
      if (next) next.disabled = !wizardState.partyName;
    });
    partyInput.focus();
  }
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
  document.getElementById('wizard-next')?.addEventListener('click', () => { wizardState.step++; renderWizardStep(); });
  document.getElementById('wizard-back')?.addEventListener('click', () => { wizardState.step--; renderWizardStep(); });
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
    const campaign = await createCampaign(wizardState.campaignName, wizardState.partyName, wizardState.selectedGroup);

    // Create all players — first player gets CM role, all are founding members
    const playerRows = [];
    for (let i = 0; i < wizardState.players.length; i++) {
      const p = wizardState.players[i];
      const role = i === 0 ? 'cm' : 'player';
      const row = await addPlayerToCampaign(campaign.id, p.name, p.email, true, role);
      playerRows.push(row);
    }

    // Create characters and assign to players
    for (const [playerIdx, classId] of Object.entries(wizardState.classAssignments)) {
      const char = await createCharacter(campaign.id, classId);
      await assignCharacterToPlayer(char.id, playerRows[playerIdx].id);
    }

    // Init PQ deck and unlocked classes
    await onCampaignCreated(campaign.id, wizardState.selectedGroup);

    // Send magic links (skip in dev mode)
    if (!DEV_MODE) {
      for (const p of wizardState.players) {
        if (p.email) { try { await sendMagicLink(p.email); } catch (_) {} }
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

// ── CAMPAIGN CARD RENDERING ──────────────────────────────────
async function loadCampaigns() {
  const container = document.getElementById('campaigns-list');
  if (!container) return;
  container.innerHTML = '<div class="campaigns-loading">Loading…</div>';
  try {
    const campaigns = await getCampaigns();
    if (!campaigns.length) {
      container.innerHTML = '<div class="campaigns-empty">No campaigns yet. Click + to create one!</div>';
      return;
    }
    container.innerHTML = campaigns.map(c => renderCampaignCard(c)).join('');
    bindCampaignListEvents(campaigns);
    // Update sidebar class grouping from active campaign
    const activeCampaign = campaigns.find(c => c.is_active) ?? campaigns[0] ?? null;
    if (window.updateSidebarFromCampaign) window.updateSidebarFromCampaign(activeCampaign);
  } catch (err) {
    container.innerHTML = `<div class="campaigns-error">Error: ${err.message}</div>`;
  }
}

function renderCampaignCard(campaign) {
  const players = campaign.players ?? [];
  const characters = campaign.characters ?? [];
  const unlockedClassIds = (campaign.campaign_unlocked_classes ?? []).map(r => r.class_id);

  const myPlayer = getEffectivePlayer(players);
  const myChar = myPlayer ? getActiveCharacter(characters, myPlayer.id) : null;

  // Active party: characters with an assigned player
  const activeChars = characters.filter(c => c.status === 'active' && c.assigned_player_id);
  const setAsideChars = characters.filter(c => c.status === 'set_aside');
  const retiredChars = characters.filter(c => c.status === 'retired');

  const activeClassIds = new Set(activeChars.map(c => c.class_id));

  const foundingPlayerIds = new Set(players.filter(p => p.is_founding_member).map(p => p.id));
  const extraPlayers = players.filter(p => !p.is_founding_member);

  function makePartyTile(char) {
    const assignedPlayer = players.find(p => p.id === char.assigned_player_id);
    const cls = CLASS_DISPLAY[char.class_id] ?? ALL_CLASSES?.[char.class_id] ?? { name: char.class_id, symbol: '' };
    const isMe = myChar?.id === char.id;
    return `<div class="campaign-player ${isMe ? 'campaign-player-me' : ''}">
      <div class="campaign-player-icon">${classIcon(char.class_id, 36)}</div>
      <div class="campaign-player-info">
        <div class="campaign-player-name">
          ${assignedPlayer?.player_name ?? '—'}
          ${isMe ? '<span class="player-me-badge">You</span>' : ''}
        </div>
        <div class="campaign-player-class">${char.character_name ? `${char.character_name} · ` : ''}${cls.name}</div>
      </div>
      ${isMe ? `<button class="campaign-deck-btn" data-char-id="${char.id}" data-player-id="${myPlayer.id}">🃏 Deck</button>` : ''}
    </div>`;
  }

  const foundingChars = activeChars.filter(c => foundingPlayerIds.has(c.assigned_player_id));
  const extraChars    = activeChars.filter(c => !foundingPlayerIds.has(c.assigned_player_id));
  const foundingTiles = foundingChars.map(makePartyTile).join('');
  const extraTiles    = extraChars.map(makePartyTile).join('');

  // Players without an active character — need to create one
  const playersWithActiveChar = new Set(activeChars.map(c => c.assigned_player_id));
  const playersNeedingChar = players.filter(p => !playersWithActiveChar.has(p.id));
  const myNeedsChar = myPlayer && playersNeedingChar.some(p => p.id === myPlayer.id);

  const newCharPrompt = myNeedsChar ? `
    <div class="campaign-new-char-prompt">
      <div class="campaign-new-char-msg">You don't have an active character.</div>
      <button class="campaign-new-btn campaign-new-char-btn"
        data-campaign-id="${campaign.id}"
        data-player-id="${myPlayer.id}">
        ⚔️ Create Character
      </button>
    </div>` : '';

  // On the bench
  const benchSection = setAsideChars.filter(c => !activeClassIds.has(c.class_id)).length ? `
    <div class="campaign-available-toggle" data-list-id="bench-${campaign.id}">
      📦 On the Bench (${setAsideChars.filter(c => !activeClassIds.has(c.class_id)).length})
      <span class="campaign-inactive-chevron">▼</span>
    </div>
    <div class="campaign-collapsible" id="bench-${campaign.id}" style="display:none">
      ${setAsideChars.filter(c => !activeClassIds.has(c.class_id)).map(char => {
        const cls = CLASS_DISPLAY[char.class_id] ?? ALL_CLASSES?.[char.class_id] ?? { name: char.class_id };
        return `<div class="campaign-player campaign-player-retired">
          <div class="campaign-player-icon" style="opacity:0.6">${classIcon(char.class_id, 36)}</div>
          <div class="campaign-player-info">
            <div class="campaign-player-name">${char.character_name || cls.name} <span class="player-status-badge player-set-aside">Set Aside</span></div>
            <div class="campaign-player-class">${cls.name}</div>
          </div>
          ${myNeedsChar || DEV_MODE ? `<button class="avail-resume-btn" data-char-id="${char.id}" data-player-id="${myPlayer?.id ?? ''}">▶ Resume</button>` : ''}
        </div>`;
      }).join('')}
    </div>` : '';

  // Retired characters
  const retiredSection = retiredChars.length ? `
    <div class="campaign-available-toggle" data-list-id="retired-${campaign.id}">
      ⚰️ Retired Characters (${retiredChars.length})
      <span class="campaign-inactive-chevron">▼</span>
    </div>
    <div class="campaign-collapsible" id="retired-${campaign.id}" style="display:none">
      ${retiredChars.map(char => {
        const cls = CLASS_DISPLAY[char.class_id] ?? ALL_CLASSES?.[char.class_id] ?? { name: char.class_id };
        const retiredBy = char.retired_by_player_id
          ? players.find(p => p.id === char.retired_by_player_id)
          : null;
        return `<div class="campaign-player campaign-player-retired">
          <div class="campaign-player-icon" style="opacity:0.4">${classIcon(char.class_id, 36)}</div>
          <div class="campaign-player-info">
            <div class="campaign-player-name">${char.character_name || cls.name} <span class="player-status-badge player-retired">Retired</span></div>
            <div class="campaign-player-class">${cls.name}${char.retired_level ? ` · Level ${char.retired_level}` : ''}${retiredBy ? ` · played by ${retiredBy.player_name}` : ''}</div>
          </div>
        </div>`;
      }).join('')}
    </div>` : '';

  // Available to create
  const recruitableClassIds = unlockedClassIds.filter(id => !activeClassIds.has(id));
  const availableSection = recruitableClassIds.length ? `
    <div class="campaign-available-toggle" data-list-id="avail-${campaign.id}">
      ⚔️ Available to Create (${recruitableClassIds.length})
      <span class="campaign-inactive-chevron">▼</span>
    </div>
    <div class="campaign-collapsible" id="avail-${campaign.id}" style="display:none">
      ${recruitableClassIds.map(classId => {
        const cls = ALL_CLASSES?.[classId] ?? CLASS_DISPLAY[classId] ?? { name: classId, symbol: classId };
        const hasKb = !!CLASS_DISPLAY[classId];
        return `<div class="avail-class-tile">
          <div class="avail-class-icon">${classIcon(classId, 28)}</div>
          <div class="avail-class-info">
            <div class="avail-class-name">${cls.name}</div>
            <div class="avail-class-symbol-label">${cls.symbol ?? ''}</div>
          </div>
          ${hasKb ? `<a class="avail-class-kb-link" href="#" data-class="${classId}">📖 Guide</a>` : ''}
        </div>`;
      }).join('')}
    </div>` : '';

  // Dev picker — shows Players (stable), not characters
  const devPicker = DEV_MODE ? renderDevPicker(players, characters) : '';

  const isActive = !!campaign.is_active;
  const amCM = isCM(players);

  return `
    <div class="campaign-card${isActive ? ' campaign-card-active' : ''}" data-id="${campaign.id}">
      <div class="campaign-card-header">
        <div style="display:flex;align-items:center;gap:8px">
          ${isActive ? '<span class="campaign-active-badge">● Active</span>' : ''}
          <div>
            ${campaign.party_name ? `<div class="campaign-card-name">${campaign.party_name}</div><div class="campaign-card-party">${campaign.name}</div>` : `<div class="campaign-card-name">${campaign.name}</div>`}
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:6px">
          ${amCM ? `<button class="campaign-plus-btn campaign-add-player-btn" data-campaign-id="${campaign.id}" title="Add Player">＋</button>` : ''}
          ${amCM ? `<button class="campaign-delete-btn" data-id="${campaign.id}" title="Delete campaign">🗑</button>` : ''}
        </div>
      </div>
      ${!isActive && amCM ? `<div class="campaign-set-active-bar"><button class="campaign-set-active-btn" data-campaign-id="${campaign.id}">⭐ Set as Active Campaign</button></div>` : ''}
      ${newCharPrompt}
      <div class="campaign-player-group">
        <div class="campaign-player-group-label">Founding Players</div>
        ${foundingTiles || '<div class="campaign-player-group-empty">No active founding members</div>'}
      </div>
      ${extraTiles ? `
        <div class="campaign-player-group campaign-player-group-extra">
          <div class="campaign-player-group-label">Extra Players</div>
          ${extraTiles}
        </div>` : ''}
      ${benchSection}
      ${retiredSection}
      ${availableSection}
      ${renderPartyProgress(campaign, players, myPlayer)}
      ${devPicker}
      ${amCM ? `<div class="campaign-card-footer">
        <button class="campaign-unlock-btn" data-campaign-id="${campaign.id}">🔓 Unlock Class</button>
      </div>` : ''}
    </div>`;
}


// ── PARTY PROGRESS ───────────────────────────────────────────
function computeGoals(campaign, players) {
  const founders = players.filter(p => p.is_founding_member);
  if (!founders.length) return null;

  const allDone = (key) => founders.every(p => p[key]);
  const allBattleGoals = founders.every(p => (p.battle_goals_completed ?? 0) >= 5);

  return {
    founders,
    goal1: allBattleGoals,          // 5 battle goals each
    goal2: allDone('xp_100_gained'), // 100 XP each
    goal3: allDone('gold_60_spent'), // 60 gold each
    goal4: allDone('treasure_looted'),// 1 treasure tile each
    goal5: !!campaign.party_goal_side_scenario, // side scenario
  };
}

function renderPartyProgress(campaign, players, myPlayer) {
  const show37d = !campaign.read_37d;
  const goals = computeGoals(campaign, players);
  const show53a = goals && !campaign.read_53a;
  if (!show37d && !show53a) return '';

  const completions = campaign.scenario_completions ?? 0;

  // 37D section
  let section37d = '';
  if (show37d) {
    const boxes = Array.from({ length: 5 }, (_, i) => {
      const checked = i < completions;
      return `<button class="party-check-box ${checked ? 'party-check-filled' : ''}"
        data-tracker="37d" data-campaign-id="${campaign.id}" data-index="${i}">
        ${checked ? '✓' : ''}
      </button>`;
    }).join('');
    const allDone = completions >= 5;
    section37d = `
      <div class="party-tracker">
        <div class="party-tracker-title">📖 Section 37D</div>
        <div class="party-tracker-desc">Complete 5 scenarios to unlock section 37D</div>
        <div class="party-tracker-boxes">${boxes}</div>
        ${allDone ? `
          <div class="party-tracker-banner">
            Read <strong>Section 37D</strong> from the section book!
            <button class="party-mark-read-btn" data-tracker="37d" data-campaign-id="${campaign.id}">
              ✓ Mark as Read
            </button>
          </div>` : ''}
      </div>`;
  }

  // 53A section
  let section53a = '';
  if (show53a) {
    const { founders, goal1, goal2, goal3, goal4, goal5 } = goals;
    const goalsCompleted = [goal1, goal2, goal3, goal4, goal5].filter(Boolean).length;
    const ready = goalsCompleted >= 4;

    const goalRows = [
      {
        label: 'Complete 5 Battle Goals each',
        done: goal1,
        players: founders.map(p => ({ name: p.player_name, done: (p.battle_goals_completed ?? 0) >= 5, detail: `${p.battle_goals_completed ?? 0}/5` })),
      },
      {
        label: 'Gain 100 experience each',
        done: goal2,
        players: founders.map(p => ({ name: p.player_name, done: !!p.xp_100_gained, key: 'xp_100_gained', playerId: p.id })),
      },
      {
        label: 'Spend 60 gold at the Item Shop each',
        done: goal3,
        players: founders.map(p => ({ name: p.player_name, done: !!p.gold_60_spent, key: 'gold_60_spent', playerId: p.id })),
      },
      {
        label: 'Loot 1 treasure tile in a scenario each',
        done: goal4,
        players: founders.map(p => ({ name: p.player_name, done: !!p.treasure_looted, key: 'treasure_looted', playerId: p.id })),
      },
      {
        label: 'Complete one Side Scenario (#51-55)',
        done: goal5,
        party: true,
        campaignId: campaign.id,
      },
    ].map((g, gi) => {
      const playerPips = g.party ? '' : g.players.map(p => {
        const isMe = myPlayer && p.playerId === myPlayer.id;
        const canToggle = isMe && !g.done && !p.done && p.key;
        return `<span class="party-goal-pip ${p.done ? 'pip-done' : ''}"
          ${canToggle ? `data-goal-key="${p.key}" data-player-id="${p.playerId}" style="cursor:pointer" title="Mark complete for ${p.name}"` : `title="${p.name}${p.detail ? ' · ' + p.detail : ''}"`}>
          ${p.done ? '✓' : p.detail ?? '○'}
        </span>`;
      }).join('');

      const sideScenarioBtn = g.party && !g.done
        ? `<button class="party-side-scenario-btn" data-campaign-id="${campaign.id}">Mark Complete</button>`
        : '';

      return `<div class="party-goal-row ${g.done ? 'party-goal-done' : ''}">
        <span class="party-goal-check">${g.done ? '✅' : '⬜'}</span>
        <span class="party-goal-label">${g.label}</span>
        <div class="party-goal-pips">${playerPips}${sideScenarioBtn}</div>
      </div>`;
    }).join('');

    section53a = `
      <div class="party-tracker">
        <div class="party-tracker-title">📖 Section 53A <span class="party-tracker-count">${goalsCompleted}/5 goals</span></div>
        <div class="party-tracker-desc">Complete 4 of 5 party goals to unlock section 53A</div>
        <div class="party-goal-list">${goalRows}</div>
        ${ready ? `
          <div class="party-tracker-banner">
            Read <strong>Section 53A</strong> from the section book!
            <button class="party-mark-read-btn" data-tracker="53a" data-campaign-id="${campaign.id}">
              ✓ Mark as Read
            </button>
          </div>` : ''}
      </div>`;
  }

  return `
    <div class="campaign-available-toggle" data-list-id="progress-${campaign.id}">
      📋 Party Progress
      <span class="campaign-inactive-chevron">▼</span>
    </div>
    <div class="campaign-collapsible" id="progress-${campaign.id}" style="display:none">
      ${section37d}${section53a}
    </div>`;
}

function renderDevPicker(players, characters) {
  if (!DEV_MODE || !players.length) return '';
  const opts = players.map(p => {
    const activeChar = getActiveCharacter(characters, p.id);
    const cls = activeChar ? (CLASS_DISPLAY[activeChar.class_id] ?? ALL_CLASSES?.[activeChar.class_id]) : null;
    const charLabel = activeChar
      ? ` — ${activeChar.character_name || cls?.name || activeChar.class_id}`
      : ' — (no active character)';
    return `<option value="${p.id}" ${devPlayerOverride === p.id ? 'selected' : ''}>
      ${p.player_name}${charLabel}
    </option>`;
  }).join('');
  return `<div class="dev-picker">
    <span class="dev-picker-label">🛠 Acting as:</span>
    <select class="wizard-select dev-picker-select">
      <option value="">— pick player —</option>${opts}
    </select>
  </div>`;
}

function bindCampaignListEvents(campaigns) {
  // Party progress — 37D checkboxes
  document.querySelectorAll('.party-check-box[data-tracker="37d"]').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      const campaignId = btn.dataset.campaignId;
      const idx = parseInt(btn.dataset.index);
      const campaign = campaigns.find(c => c.id === campaignId);
      if (!campaign) return;
      const current = campaign.scenario_completions ?? 0;
      // Toggle: click filled = unfill back to idx, click empty = fill to idx+1
      const newVal = idx < current ? idx : idx + 1;
      await sb().from('campaigns').update({ scenario_completions: newVal }).eq('id', campaignId);
      loadCampaigns();
    });
  });

  // Party progress — mark as read buttons
  document.querySelectorAll('.party-mark-read-btn').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      const campaignId = btn.dataset.campaignId;
      const tracker = btn.dataset.tracker;
      const col = tracker === '37d' ? 'read_37d' : 'read_53a';
      await sb().from('campaigns').update({ [col]: true }).eq('id', campaignId);
      loadCampaigns();
      showToast(`Section ${tracker === '37d' ? '37D' : '53A'} marked as read. Tracker removed.`);
    });
  });

  // Party progress — player goal pips (XP, gold, treasure)
  document.querySelectorAll('.party-goal-pip[data-goal-key]').forEach(pip => {
    pip.addEventListener('click', async e => {
      e.stopPropagation();
      const key = pip.dataset.goalKey;
      const playerId = pip.dataset.playerId;
      await sb().from('players').update({ [key]: true }).eq('id', playerId);
      loadCampaigns();
      showToast('Goal progress updated!');
    });
  });

  // Party progress — side scenario complete
  document.querySelectorAll('.party-side-scenario-btn').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      const campaignId = btn.dataset.campaignId;
      if (!confirm('Mark Side Scenario #51-55 as completed?')) return;
      await sb().from('campaigns').update({ party_goal_side_scenario: true }).eq('id', campaignId);
      loadCampaigns();
      showToast('Side scenario goal completed!');
    });
  });

  // Deck buttons
  document.querySelectorAll('.campaign-deck-btn').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      const charId = btn.dataset.charId;
      const playerId = btn.dataset.playerId;
      // Load full character + player objects
      const { data: char } = await sb().from('characters').select('*').eq('id', charId).single();
      const { data: player } = await sb().from('players').select('*').eq('id', playerId).single();
      if (char && player) {
        closeCampaignPanel();
        openDeckBuilder(char, player);
      }
    });
  });

  // Create character buttons
  document.querySelectorAll('.campaign-new-char-btn').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      const campaignId = btn.dataset.campaignId;
      const playerId = btn.dataset.playerId;
      const { data: player } = await sb().from('players').select('*').eq('id', playerId).single();
      await openNewCharacterWizard(campaignId, playerId, async (newChar) => {
        await assignCharacterToPlayer(newChar.id, playerId);
        loadCampaigns();
        closeCampaignPanel();
        openDeckBuilder(newChar, player);
      });
    });
  });

  // Resume set-aside character
  document.querySelectorAll('.avail-resume-btn').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      const charId = btn.dataset.charId;
      const playerId = btn.dataset.playerId || devPlayerOverride;
      if (!playerId) { showToast('Select a player first.', true); return; }
      const { data: char } = await sb().from('characters').select('*').eq('id', charId).single();
      if (!confirm(`Resume ${char?.character_name || 'this character'}?`)) return;

      // Guard: player must not already have an active character
      const { data: existing } = await sb()
        .from('characters')
        .select('id')
        .eq('assigned_player_id', playerId)
        .eq('status', 'active')
        .maybeSingle();
      if (existing) {
        showToast('Player already has an active character — retire or set it aside first.', true);
        return;
      }

      const { error } = await sb().from('characters').update({
        status: 'active',
        assigned_player_id: playerId,
        set_aside_at: null,
      }).eq('id', charId);

      if (error) { showToast('Error resuming: ' + error.message, true); return; }

      loadCampaigns();
      showToast(`${char?.character_name || 'Character'} is back in the party!`);
    });
  });

  // Collapsible toggles
  document.querySelectorAll('.campaign-available-toggle').forEach(toggle => {
    toggle.addEventListener('click', () => {
      const listId = toggle.dataset.listId;
      const list = document.getElementById(listId);
      const chevron = toggle.querySelector('.campaign-inactive-chevron');
      if (list) {
        const isOpen = list.style.display !== 'none';
        list.style.display = isOpen ? 'none' : 'block';
        if (chevron) chevron.textContent = isOpen ? '▼' : '▲';
      }
    });
  });

  // Guide links
  document.querySelectorAll('.avail-class-kb-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      if (window.switchClass) window.switchClass(link.dataset.class);
      closeCampaignPanel();
    });
  });

  // Set Active Campaign
  document.querySelectorAll('.campaign-set-active-btn').forEach(btn => {
    btn.addEventListener('click', async e => {
      const campaignId = btn.dataset.campaignId;
      try {
        await setActiveCampaign(campaignId);
        await loadCampaigns();
        showToast('Campaign set as active!');
      } catch (err) {
        showToast('Error: ' + err.message, true);
      }
    });
  });

  // Delete campaign
  document.querySelectorAll('.campaign-delete-btn').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      if (!confirm('Delete this campaign? This cannot be undone.')) return;
      try { await deleteCampaign(btn.dataset.id); loadCampaigns(); showToast('Campaign deleted.'); }
      catch (err) { showToast('Error: ' + err.message, true); }
    });
  });

  // Add player button
  document.querySelectorAll('.campaign-add-player-btn').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      openAddPlayerDialog(btn.dataset.campaignId);
    });
  });

  // Unlock class button
  document.querySelectorAll('.campaign-unlock-btn').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      await openManualUnlockDialog(btn.dataset.campaignId, () => loadCampaigns());
    });
  });

  // Dev picker
  document.querySelectorAll('.dev-picker-select').forEach(sel => {
    sel.addEventListener('change', e => {
      devPlayerOverride = e.target.value || null;
      loadCampaigns();
    });
  });
}

// ── ADD PLAYER DIALOG ────────────────────────────────────────
function openAddPlayerDialog(campaignId) {
  const modal = document.createElement('div');
  modal.className = 'db-modal-backdrop';
  modal.innerHTML = `
    <div class="db-modal" style="max-width:420px">
      <div class="db-modal-header">
        <h3 class="db-modal-title">＋ Add Player</h3>
        <button class="campaign-wizard-close" id="add-player-close">✕</button>
      </div>
      <p class="db-modal-desc">Add a new player to this campaign. They'll receive a magic link and can then create a character.</p>
      <div style="display:flex;flex-direction:column;gap:10px">
        <input class="wizard-input" id="add-player-name" type="text" placeholder="Player name" maxlength="30">
        <input class="wizard-input" id="add-player-email" type="email" placeholder="Email address">
      </div>
      <div class="wizard-nav" style="margin-top:16px">
        <button class="wizard-btn wizard-btn-back" id="add-player-cancel">Cancel</button>
        <button class="wizard-btn wizard-btn-primary" id="add-player-confirm" disabled>＋ Add Player</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  const nameInput = document.getElementById('add-player-name');
  const emailInput = document.getElementById('add-player-email');
  const confirmBtn = document.getElementById('add-player-confirm');
  const updateBtn = () => { confirmBtn.disabled = !nameInput.value.trim() || !emailInput.value.trim(); };
  nameInput.addEventListener('input', updateBtn);
  emailInput.addEventListener('input', updateBtn);
  nameInput.focus();

  const close = () => modal.remove();
  document.getElementById('add-player-close').addEventListener('click', close);
  document.getElementById('add-player-cancel').addEventListener('click', close);

  confirmBtn.addEventListener('click', async () => {
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    confirmBtn.disabled = true; confirmBtn.textContent = 'Adding…';
    try {
      const player = await addPlayerToCampaign(campaignId, name, email);
      if (!DEV_MODE) { try { await sendMagicLink(email); } catch (_) {} }
      modal.remove();
      // Immediately open character creation for the new player
      await openNewCharacterWizard(campaignId, player.id, async (newChar) => {
        await assignCharacterToPlayer(newChar.id, player.id);
        loadCampaigns();
        showToast(`${name} added and character created!`);
      });
    } catch (err) {
      showToast('Error: ' + err.message, true);
      confirmBtn.disabled = false; confirmBtn.textContent = '＋ Add Player';
    }
  });
}

// ── RESUME CHARACTER ─────────────────────────────────────────
async function resumeCharacter(characterId, playerId) {
  await sb().from('characters').update({
    status: 'active',
    assigned_player_id: playerId,
    set_aside_at: null,
  }).eq('id', characterId);
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
