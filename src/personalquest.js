// personalquest.js — Personal Quest system for Crimson Scales KB
// Depends on: campaign.js (sb(), showToast), deckbuilder.js (openDeckBuilder)

const BASE_CS_PQ = "https://raw.githubusercontent.com/any2cards/worldhaven/master/images/personal-quests/crimson-scales/";
const BASE_TOA_PQ = "https://raw.githubusercontent.com/any2cards/worldhaven/master/images/personal-quests/trail-of-ashes/";

// ── ALL CLASSES ───────────────────────────────────────────────
const ALL_CLASSES = {
  // Crimson Scales — starting group classes
  mirefoot:    { name: "Quatryl Mirefoot",    symbol: "Sprig",         icon: "cs-mirefoot-icon.svg",    locked: false, pqCards: ["cs-pq-346", "cs-pq-347"] },
  hollowpact:  { name: "Savvas Hollowpact",   symbol: "Vortex",        icon: "cs-hollowpact-icon.svg",  locked: false, pqCards: ["cs-pq-342", "cs-pq-343"] },
  chieftain:   { name: "Orchid Chieftain",    symbol: "Tusk",          icon: "cs-chieftain-icon.svg",   locked: false, pqCards: ["cs-pq-336", "cs-pq-337"] },
  luminary:    { name: "Lurker Luminary",     symbol: "Crescent Sun",  icon: "cs-luminary-icon.svg",    locked: false, pqCards: ["cs-pq-344", "cs-pq-345"] },
  chainguard:  { name: "Inox Chainguard",     symbol: "Chained Helm",  icon: "cs-chainguard-icon.svg",  locked: false, pqCards: ["cs-pq-334", "cs-pq-335"] },
  hierophant:  { name: "Human Hierophant",    symbol: "Leaf",          icon: "cs-hierophant-icon.svg",  locked: false, pqCards: ["cs-pq-340", "cs-pq-341"] },
  bombard:     { name: "Quatryl Bombard",     symbol: "Target",        icon: "cs-bombard-icon.svg", locked: false, pqCards: ["cs-pq-330", "cs-pq-331"] },
  fireknight:  { name: "Valrath Fire Knight", symbol: "Ladder Axe",    icon: "cs-fireknight-icon.svg", locked: false, pqCards: ["cs-pq-338", "cs-pq-339"] },
  brightspark: { name: "Human Brightspark",   symbol: "Flask",         icon: "cs-brightspark-icon.svg", locked: false, pqCards: ["cs-pq-332", "cs-pq-333"] },
  starslinger: { name: "Aesther Starslinger", symbol: "Galaxy",        icon: "cs-starslinger-icon.svg", locked: false, pqCards: ["cs-pq-350", "cs-pq-351"] },
  // Crimson Scales — always locked
  amberaegis:  { name: "Harrower Amber Aegis",   symbol: "Beetle",        icon: null, locked: true, pqCards: ["cs-pq-aa-001", "cs-pq-aa-002"] },
  artificer:   { name: "Quatryl Artificer",       symbol: "Tools",         icon: null, locked: true, pqCards: ["cs-pq-qa-001", "cs-pq-qa-002"] },
  ruinmaw:     { name: "Vermling Ruinmaw",        symbol: "Bleeding Claw", icon: null, locked: true, pqCards: ["cs-pq-rm-001", "cs-pq-rm-002"] },
  spiritcaller: { name: "Vermling Spirit Caller", symbol: "Skull",         icon: null, locked: true, pqCards: ["cs-pq-348", "cs-pq-349"] },
  // Crimson Scales — unlocked via scenario (no PQ cards)
  shardrender: { name: "Orchid Shardrender",  symbol: "Gemstone",      icon: null, locked: true, pqCards: [] },
  vanquisher:  { name: "Valrath Vanquisher",  symbol: "ENVV",          icon: null, locked: true, pqCards: [] },
  // Trail of Ashes — locked, have PQ cards
  incarnate:   { name: "Inox Incarnate",      symbol: "Three Eyes",    icon: null, locked: true, pqCards: ["toa-pq-641", "toa-pq-642"] },
  rimehearth:  { name: "Savvas Rimehearth",   symbol: "Ice Meteor",    icon: null, locked: true, pqCards: ["toa-pq-643", "toa-pq-644"] },
  tempest:     { name: "Orchid Tempest",      symbol: "Lightning Ball", icon: null, locked: true, pqCards: ["toa-pq-645", "toa-pq-646"] },
  thornreaper: { name: "Orchid Thornreaper",  symbol: "Spiked Ring",   icon: null, locked: true, pqCards: ["toa-pq-647", "toa-pq-648"] },
};

// PQ card id → class id mapping
// Milestone tracker data: condition text for each class
// All milestones require 10 completions
const MILESTONE_TRACKER_DATA = {
  // ── Crimson Scales ──────────────────────────────────────────────
  amberaegis:   "Place a Colony token.",
  artificer:    "Accumulate and spend Scrap (10 times).",
  bombard:      "Trigger a Projectile ability.",
  brightspark:  "Complete all of the persistent tracks of an action on an ability card.",
  chainguard:   "Kill a Shackled enemy.",
  chieftain:    "Perform a summon action and mount the summon during the same turn.",
  fireknight:   "Place your Ladder and end your turn on it during the same turn.",
  hierophant:   "Give an ally one Prayer ability card and experience them playing it.",
  hollowpact:   "Perform Voidsight while you have at least one Void Energy token.",
  luminary:     "Consume an element to perform a Glow action.",
  mirefoot:     "Apply POISON 2 or WOUND 2 to an enemy.",
  ruinmaw:      "Become Sated.",
  spiritcaller: "Experience a Spirit dying in a hex adjacent to you.",
  starslinger:  "Affect an ally in a yellow hex and target an enemy in a red hex during the same action.",
  shardrender:  "Move the character token off the last use slot of a Crystallize.",
  vanquisher:   "Play a Rage card for its top action.",
  // ── Trail of Ashes ───────────────────────────────────────────────
  incarnate:    "Experience a turn where you augment two different actions, each with a different spirit.",
  rimehearth:   "Apply one or more negative conditions to yourself.",
  tempest:      "Dodge an attack.",
  thornreaper:  "Consume Earth element.",
};

// Battle Goal data: all Gloomhaven battle goal cards
// checks: 1 = single perk check, 2 = double perk check
const BATTLE_GOAL_DATA = {
  'gh-aggressor':  { id: 474, title: 'Aggressor',  checks: 2, condition: "Have one or more monsters on the map at the beginning of every round during the scenario." },
  'gh-diehard':    { id: 478, title: 'Diehard',    checks: 1, condition: "Never allow your current HP value to drop below half your maximum HP value (rounded up) during the scenario." },
  'gh-dynamo':     { id: 475, title: 'Dynamo',     checks: 1, condition: "Kill a monster during the scenario by causing at least 4 more points of damage to it than necessary." },
  'gh-executioner':{ id: 479, title: 'Executioner',checks: 1, condition: "Kill an undamaged monster with a single attack during the scenario." },
  'gh-explorer':   { id: 467, title: 'Explorer',   checks: 1, condition: "Reveal a room tile by opening a door on your turn during the scenario." },
  'gh-fast-healer':{ id: 463, title: 'Fast Healer',checks: 1, condition: "Your current HP value must equal your maximum HP value at the end of the scenario." },
  'gh-hoarder':    { id: 468, title: 'Hoarder',    checks: 1, condition: "Loot five or more money tokens during the scenario." },
  'gh-hunter':     { id: 472, title: 'Hunter',     checks: 1, condition: "Kill one or more elite monsters during the scenario." },
  'gh-indigent':   { id: 469, title: 'Indigent',   checks: 2, condition: "Loot no money tokens or treasure overlay tiles during the scenario." },
  'gh-layabout':   { id: 459, title: 'Layabout',   checks: 2, condition: "Gain 7 or fewer experience points during the scenario." },
  'gh-masochist':  { id: 462, title: 'Masochist',  checks: 1, condition: "Your current HP value must be equal to or less than 2 at the end of the scenario." },
  'gh-neutralizer':{ id: 464, title: 'Neutralizer',checks: 1, condition: "Cause a trap to be sprung or disarmed on your turn or the turn of your summons during the scenario." },
  'gh-opener':     { id: 477, title: 'Opener',     checks: 1, condition: "Be the first to kill a monster during the scenario." },
  'gh-pacifist':   { id: 470, title: 'Pacifist',   checks: 1, condition: "Kill three or fewer monsters during the scenario." },
  'gh-plunderer':  { id: 465, title: 'Plunderer',  checks: 1, condition: "Loot a treasure overlay tile during the scenario." },
  'gh-professional':{ id: 473, title: 'Professional',checks: 1, condition: "Use your equipped items a number of times equal to or greater than your level plus 2 during the scenario." },
  'gh-protector':  { id: 466, title: 'Protector',  checks: 1, condition: "Allow none of your character allies to become exhausted during the scenario." },
  'gh-purist':     { id: 476, title: 'Purist',     checks: 2, condition: "Use no items during the scenario." },
  'gh-sadist':     { id: 471, title: 'Sadist',     checks: 1, condition: "Kill 5 or more monsters during the scenario." },
  'gh-scrambler':  { id: 481, title: 'Scrambler',  checks: 1, condition: "Take only short rests during the scenario." },
  'gh-straggler':  { id: 480, title: 'Straggler',  checks: 1, condition: "Take only long rests during the scenario." },
  'gh-streamliner':{ id: 458, title: 'Streamliner',checks: 1, condition: "Have 5 or more total cards in your hand and discard at the end of the scenario." },
  'gh-workhorse':  { id: 460, title: 'Workhorse',  checks: 1, condition: "Gain 13 or more experience points during the scenario." },
  'gh-zealot':     { id: 461, title: 'Zealot',     checks: 1, condition: "Have 3 or fewer total cards in your hand and discard at the end of the scenario." },
};

// Reverse lookup: card number → slug key
const BATTLE_GOAL_BY_NUM = Object.fromEntries(
  Object.entries(BATTLE_GOAL_DATA).map(([slug, data]) => [data.id, slug])
);

// Resolve a battle goal input — accepts card number (e.g. "474") or slug (e.g. "gh-aggressor")
function resolveBattleGoalKey(input) {
  if (!input) return null;
  const trimmed = input.toString().trim();
  if (BATTLE_GOAL_DATA[trimmed]) return trimmed; // already a slug
  const num = parseInt(trimmed);
  return BATTLE_GOAL_BY_NUM[num] ?? trimmed; // convert number to slug, fall back to raw input
}

const PQ_UNLOCKS_CLASS = {};

// PQ tracker data: count = total checkboxes, condition = display text
// type: 'counter' = simple count | 'scenario' = unlock+complete a specific scenario after count
const PQ_TRACKER_DATA = {
  // ── Crimson Scales ──────────────────────────────────────────────
  'cs-pq-330': { count: 10, condition: "Kill 10 Inox. Then unlock and complete Scenario 33 'Siege Tower' to retire. Retirement only happens after Scenario 33 is successfully completed.", phase2: "Complete Scenario 33 'Siege Tower'" },
  'cs-pq-331': { count: 15, condition: "Consume 15 single-handed or double-handed items." },
  'cs-pq-332': { count: 30, condition: "Play 30 cards for their lost action." },
  'cs-pq-333': { count: 20, condition: "Reveal a room tile by opening a door 20 times." },
  'cs-pq-334': { count: 15, condition: "Disarm or cause an enemy to spring a trap during your turn 15 times." },
  'cs-pq-335': { count: 10, condition: "Kill 10 Guards or Archers. Then unlock and complete Scenario 35 'Prison Riot' to retire. Retirement only happens after Scenario 35 is successfully completed.", phase2: "Complete Scenario 35 'Prison Riot'" },
  'cs-pq-336': { count: 20, condition: "Kill 20 Oozes, Forest Imps, or Black Imps." },
  'cs-pq-337': { count: 12, condition: "Complete 12 scenarios in which you gained at least 12 experience points." },
  'cs-pq-338': { count: 15, condition: "Kill an enemy and loot its money token in the same round." },
  'cs-pq-339': { count: 30, condition: "Kill 30 enemies that are adjacent to any of your allies." },
  'cs-pq-340': { count: 12, condition: "Draw a BLESS card 12 times during an attack." },
  'cs-pq-341': { count: 20, condition: "Spend 200 gold on enhancements. Each check = 10 gold spent on enhancements." },
  'cs-pq-342': { count: 13, condition: "Experience an ally or enemy dying or becoming exhausted during its own turn 13 times." },
  'cs-pq-343': { count: 10, condition: "Complete 10 scenarios during which you kill an enemy who has a negative condition." },
  'cs-pq-344': { count: 8,  condition: "Generate Fire ×2, Ice ×2, Light ×2, and Dark ×2 (2 of each element — first 2 checks = Fire, next 2 = Ice, next 2 = Light, last 2 = Dark). Then unlock and complete Scenario 37 'Burning Stones' to retire.", phase2: "Complete Scenario 37 'Burning Stones'", groups: [{label:'🔥 Fire',count:2},{label:'❄️ Ice',count:2},{label:'☀️ Light',count:2},{label:'🌑 Dark',count:2}] },
  'cs-pq-345': { count: 15, condition: "Kill 2 or more enemies in the same turn 15 times." },
  'cs-pq-346': { count: 6,  condition: "Occupy difficult terrain in 6 different scenarios. Then unlock and complete Scenario 39 'Festering Mire' to retire.", phase2: "Complete Scenario 39 'Festering Mire'" },
  'cs-pq-347': { count: 20, condition: "Poison 20 different types of monsters. Each monster type only counts once regardless of how many times it is poisoned." },
  'cs-pq-348': { count: 10, condition: "Kill 10 summoned monsters." },
  'cs-pq-349': { count: 10, condition: "Complete 10 scenarios where you only performed one type of rest (long or short) — not both." },
  'cs-pq-350': { count: 7,  condition: "Complete 7 scenarios ending at full health." },
  'cs-pq-351': { count: 30, condition: "Loot 30 money tokens." },
  'cs-pq-aa-001': { count: 8,  condition: "Experience 8 scenarios where you negate damage by losing a card as normal while adjacent to an ally. Then unlock and complete Scenario AA1 'The Riches of Steelsilk' to retire.", phase2: "Complete Scenario AA1 'The Riches of Steelsilk'" },
  'cs-pq-aa-002': { count: 8,  condition: "Complete 8 scenarios without exhausting and with 2 or fewer HP remaining. Then unlock and complete Scenario AA2 'Malign Echoes' to retire.", phase2: "Complete Scenario AA2 'Malign Echoes'" },
  'cs-pq-qa-001': { count: 12, condition: "Use the Power Modulator (Item QA-01) to kill 12 enemies (item granted immediately — cannot be sold). Then unlock and complete Scenario QA1 'Capstone Test' to retire.", phase2: "Complete Scenario QA1 'Capstone Test'" },
  'cs-pq-qa-002': { count: 10, condition: "Loot 2 or more money tokens with a single action 8 times (end-of-turn looting counts), AND loot 2 treasure tiles (2 checks). Then unlock and complete Scenario QA2 'Mother Lode' to retire.", phase2: "Complete Scenario QA2 'Mother Lode'" },
  'cs-pq-rm-001': { count: 30, condition: "Apply WOUND or RUPTURE to 30 enemies using the Serrated Edge design (Item RM-01, granted immediately). Then unlock and complete Scenario RM1 'Mind Your Manners' to retire.", phase2: "Complete Scenario RM1 'Mind Your Manners'" },
  'cs-pq-rm-002': { count: 20, condition: "Experience 20 rounds during or after you perform a LOSS action where an enemy dies. Then unlock and complete Scenario RM2 'Ruined Colony' to retire.", phase2: "Complete Scenario RM2 'Ruined Colony'" },
  // ── Trail of Ashes ───────────────────────────────────────────────
  'toa-pq-641': { count: 15, condition: "Loot 15 money tokens in scenarios with Living Bones, Living Corpses, or Living Spirits. Then unlock and complete Scenario 67 'Ternion Tomb' to retire.", phase2: "Complete Scenario 67 'Ternion Tomb'" },
  'toa-pq-642': { count: 12, condition: "Add the Battle Standard (Item 115) to the city supply. Experience your allies killing 12 enemies with abilities granted by you." },
  'toa-pq-643': { count: 16, condition: "Choose Option A on an event card 8 times AND choose Option B on an event card 8 times.", groups: [{label:'Option A',count:8},{label:'Option B',count:8}] },
  'toa-pq-644': { count: 30, condition: "Kill 30 enemies while they are adjacent to one or more of their allies." },
  'toa-pq-645': { count: 20, condition: "Kill 20 enemies whose initiative is at least 20 slower than yours that round." },
  'toa-pq-646': { count: 10, condition: "Perform a loot action while adjacent to an enemy at least twice during a scenario in 10 different scenarios." },
  'toa-pq-647': { count: 4,  condition: "Complete 4 scenarios that use at least one Bush, Tree, or Thorns overlay tile in the setup. The tile must be part of the scenario setup, not placed during play." },
  'toa-pq-648': { count: 13, condition: "Declare and then perform a long rest while an enemy is in the same room as you 13 times." },
};
for (const [classId, cls] of Object.entries(ALL_CLASSES)) {
  for (const pqId of cls.pqCards) {
    PQ_UNLOCKS_CLASS[pqId] = classId;
  }
}

// Starting group → class ids
const STARTING_GROUP_CLASSES = {
  naturalists:  ["mirefoot", "hollowpact", "chieftain", "luminary"],
  militants:    ["bombard", "fireknight", "hierophant", "mirefoot"],
  protectors:   ["chainguard", "chieftain", "fireknight", "hierophant"],
  explorers:    ["brightspark", "chainguard", "hollowpact", "starslinger"],
  trailblazers: ["bombard", "brightspark", "luminary", "starslinger"],
};

function pqCardUrl(pqId) {
  if (pqId.startsWith("toa-")) return BASE_TOA_PQ + pqId + ".png";
  return BASE_CS_PQ + pqId + ".png";
}

// ── DB HELPERS ───────────────────────────────────────────────
async function initPqDeck(campaignId, startingGroup) {
  const startingClassIds = STARTING_GROUP_CLASSES[startingGroup] ?? [];

  // Build full PQ deck — exclude PQ cards for starting group classes
  const removedIds = new Set(
    startingClassIds.flatMap(cid => ALL_CLASSES[cid]?.pqCards ?? [])
  );

  const rows = [];
  for (const cls of Object.values(ALL_CLASSES)) {
    for (const pqId of cls.pqCards) {
      rows.push({
        campaign_id: campaignId,
        pq_card_id: pqId,
        is_removed: removedIds.has(pqId),
      });
    }
  }

  const { error } = await sb().from('campaign_pq_deck').insert(rows);
  if (error) throw error;
}

async function initUnlockedClasses(campaignId, startingGroup) {
  const startingClassIds = STARTING_GROUP_CLASSES[startingGroup] ?? [];
  const rows = startingClassIds.map(classId => ({ campaign_id: campaignId, class_id: classId }));
  const { error } = await sb().from('campaign_unlocked_classes').insert(rows);
  if (error) throw error;
}

async function getPqDeck(campaignId) {
  const { data, error } = await sb()
    .from('campaign_pq_deck')
    .select('*')
    .eq('campaign_id', campaignId)
    .eq('is_removed', false);
  if (error) throw error;
  return data ?? [];
}

async function getUnlockedClasses(campaignId) {
  const { data, error } = await sb()
    .from('campaign_unlocked_classes')
    .select('*')
    .eq('campaign_id', campaignId);
  if (error) throw error;
  return (data ?? []).map(r => r.class_id);
}

// ── ATOMIC PQ DRAW ───────────────────────────────────────────
// Claim two cards atomically using DB-level update with null check.
// Stale claims (drawn_at > 10 minutes ago) are released before drawing.
const PQ_CLAIM_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

async function releaseStaleClaimsForCampaign(campaignId) {
  const cutoff = new Date(Date.now() - PQ_CLAIM_TIMEOUT_MS).toISOString();
  await sb()
    .from('campaign_pq_deck')
    .update({ drawn_by: null, drawn_at: null })
    .eq('campaign_id', campaignId)
    .eq('is_removed', false)
    .not('drawn_by', 'is', null)
    .lt('drawn_at', cutoff);
}

async function claimOnePqCard(campaignId, playerId) {
  // Atomically claim one unclaimed, unremoved card
  // We fetch available cards and attempt to claim one by updating
  // where drawn_by IS NULL — the DB enforces this atomically per row.
  const { data: available } = await sb()
    .from('campaign_pq_deck')
    .select('id, pq_card_id')
    .eq('campaign_id', campaignId)
    .eq('is_removed', false)
    .is('drawn_by', null);

  if (!available || available.length === 0) return null;

  // Shuffle client-side to randomise which we try to claim first
  const shuffled = available.sort(() => Math.random() - 0.5);

  for (const card of shuffled) {
    // Attempt atomic claim: update only if drawn_by is still null
    const { data: claimed, error } = await sb()
      .from('campaign_pq_deck')
      .update({ drawn_by: playerId, drawn_at: new Date().toISOString() })
      .eq('id', card.id)
      .is('drawn_by', null)   // atomic guard — won't update if someone else claimed it
      .select()
      .single();

    if (claimed && !error) return claimed;
    // If claim failed (another player got it), try next card
  }
  return null;
}

async function drawTwoPqCards(campaignId, playerId) {
  // Release any stale claims first
  await releaseStaleClaimsForCampaign(campaignId);

  // If deck has never been initialized (campaign predates PQ system), init it now
  const { count } = await sb()
    .from('campaign_pq_deck')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', campaignId);

  if (count === 0) {
    // Look up the campaign's starting group to know which cards to remove
    const { data: campaign } = await sb()
      .from('campaigns')
      .select('starting_group')
      .eq('id', campaignId)
      .single();
    await initPqDeck(campaignId, campaign?.starting_group ?? '');
  }

  // Claim two cards atomically, one at a time
  const card1 = await claimOnePqCard(campaignId, playerId);
  if (!card1) throw new Error("Not enough PQ cards remaining in the deck.");

  const card2 = await claimOnePqCard(campaignId, playerId);
  if (!card2) {
    // Release card1 back to the pool if we couldn't get a second
    await sb().from('campaign_pq_deck')
      .update({ drawn_by: null, drawn_at: null })
      .eq('id', card1.id);
    throw new Error("Not enough PQ cards remaining in the deck.");
  }

  return [card1, card2];
}

async function releasePqClaim(cardId) {
  // Return a card to the pool (player rejected it)
  await sb()
    .from('campaign_pq_deck')
    .update({ drawn_by: null, drawn_at: null })
    .eq('id', cardId);
}

async function assignPqCard(characterId, pqCardId) {
  const { error } = await sb()
    .from('characters')
    .update({ pq_card_id: pqCardId })
    .eq('id', characterId);
  if (error) throw error;
}

async function removePqCardFromDeck(campaignId, pqCardId) {
  const { error } = await sb()
    .from('campaign_pq_deck')
    .update({ is_removed: true })
    .eq('campaign_id', campaignId)
    .eq('pq_card_id', pqCardId);
  if (error) throw error;
}

async function unlockClass(campaignId, classId) {
  const { error } = await sb()
    .from('campaign_unlocked_classes')
    .insert({ campaign_id: campaignId, class_id: classId });
  if (error) throw error;
}

// ── CHARACTER NAMING ─────────────────────────────────────────
async function saveCharacterName(characterId, name) {
  const { error } = await sb()
    .from('characters')
    .update({ character_name: name })
    .eq('id', characterId);
  if (error) throw error;
}

// ── RETIREMENT ───────────────────────────────────────────────
async function retireCharacter(character, campaignId, retiredByPlayerId) {
  const pqCardId = character.pq_card_id;

  // Read current level from character_state
  const { data: stateRow } = await sb()
    .from('character_state')
    .select('current_level')
    .eq('character_id', character.id)
    .single();
  const retiredLevel = stateRow?.current_level ?? 1;

  // Mark character as retired, unassign from player, store level and who retired it
  await sb().from('characters').update({
    status: 'retired',
    retired_at: new Date().toISOString(),
    retired_level: retiredLevel,
    assigned_player_id: null,
    retired_by_player_id: retiredByPlayerId ?? null,
  }).eq('id', character.id);

  if (!pqCardId) return { duplicate: false, classId: null };

  // Remove PQ card from deck permanently
  await removePqCardFromDeck(campaignId, pqCardId);

  // Determine which class is unlocked
  const unlockedClassId = PQ_UNLOCKS_CLASS[pqCardId] ?? null;
  if (!unlockedClassId) return { duplicate: false, classId: null };

  // Check if already unlocked
  const currentlyUnlocked = await getUnlockedClasses(campaignId);
  const isDuplicate = currentlyUnlocked.includes(unlockedClassId);

  if (!isDuplicate) {
    await unlockClass(campaignId, unlockedClassId);
  }

  return { duplicate: isDuplicate, classId: unlockedClassId };
}

async function setAsideCharacter(character) {
  // PQ card stays with the character — do NOT remove from deck
  await sb().from('characters').update({
    status: 'set_aside',
    set_aside_at: new Date().toISOString(),
    assigned_player_id: null,
  }).eq('id', character.id);
}

async function resumeCharacter(playerId) {
  await sb().from('campaign_players').update({
    status: 'active',
    set_aside_at: null,
  }).eq('id', playerId);
}

// ── PQ PICKER UI ─────────────────────────────────────────────
// Called from deck builder when a character has no PQ card yet
async function openPqPicker(character, onComplete) {
  let drawn;
  try {
    drawn = await drawTwoPqCards(character.campaign_id, character.id);
  } catch (e) {
    showToast('Error drawing PQ cards: ' + e.message, true);
    return; // Don't proceed — player must try again
  }

  const modal = document.createElement('div');
  modal.className = 'db-modal-backdrop';
  modal.id = 'pq-picker-modal';
  modal.innerHTML = `
    <div class="db-modal">
      <div class="db-modal-header">
        <h3 class="db-modal-title">📜 Choose Your Personal Quest</h3>
      </div>
      <p class="db-modal-desc">
        Draw two Personal Quest cards and choose one. The other is shuffled back into the deck.
        Your PQ determines when your character retires and what class they unlock.
        Hover a card and hold <kbd>Space</kbd> to zoom.
      </p>
      <div class="db-levelup-grid">
        ${drawn.map(card => `
          <div class="db-levelup-card pq-picker-card" data-pq-id="${card.pq_card_id}">
            <img src="${pqCardUrl(card.pq_card_id)}" class="db-levelup-img pq-picker-img" alt="PQ Card">
            <div class="db-card-label" style="padding:6px 4px">
              <span class="db-card-name">Unlocks: ${ALL_CLASSES[PQ_UNLOCKS_CLASS[card.pq_card_id]]?.name ?? 'Unknown'}</span>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="wizard-nav" style="margin-top:16px">
        <span></span>
        <button class="wizard-btn wizard-btn-primary" id="pq-picker-confirm" disabled>
          ✓ Choose This Quest
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  let selectedPqId = null;

  modal.querySelectorAll('.pq-picker-card').forEach(card => {
    card.addEventListener('mouseover', () => {
      const img = card.querySelector('.pq-picker-img');
      if (img) zoomHoveredCard = { src: img.src, cardId: null };
    });
    card.addEventListener('mouseout', () => { zoomHoveredCard = null; });
    card.addEventListener('click', () => {
      modal.querySelectorAll('.pq-picker-card').forEach(c => c.classList.remove('db-levelup-selected'));
      card.classList.add('db-levelup-selected');
      selectedPqId = card.dataset.pqId;
      document.getElementById('pq-picker-confirm').disabled = false;
    });
  });

  document.getElementById('pq-picker-confirm').addEventListener('click', async () => {
    if (!selectedPqId) return;
    const rejected = drawn.find(c => c.pq_card_id !== selectedPqId);
    const chosen = drawn.find(c => c.pq_card_id === selectedPqId);

    // Assign chosen card to character
    await assignPqCard(character.id, selectedPqId);
    // Clear drawn_by on chosen card (it is now assigned to the player via pq_card_id)
    if (chosen) {
      await sb().from('campaign_pq_deck')
        .update({ drawn_by: null, drawn_at: null })
        .eq('id', chosen.id);
    }
    // Release rejected card back to pool
    if (rejected) await releasePqClaim(rejected.id);

    modal.remove();
    if (onComplete) onComplete(selectedPqId);
    showToast('Personal Quest assigned!');
  });
}

// ── CHARACTER NAMING UI ──────────────────────────────────────
function openCharacterNamingPrompt(character, player, onComplete) {
  const cls = ALL_CLASSES[character.class_id] ?? CLASS_DISPLAY[character.class_id];
  const modal = document.createElement('div');
  modal.className = 'db-modal-backdrop';
  modal.id = 'char-name-modal';
  modal.innerHTML = `
    <div class="db-modal" style="max-width:420px">
      <div class="db-modal-header">
        <h3 class="db-modal-title">⚔️ Name Your Character</h3>
      </div>
      <p class="db-modal-desc">Give your ${cls?.name ?? 'character'} a name before entering the field of battle.</p>
      <input class="wizard-input" id="char-name-input" type="text"
        placeholder="Character name…" maxlength="40" autocomplete="off">
      <div class="wizard-nav" style="margin-top:16px">
        <span></span>
        <button class="wizard-btn wizard-btn-primary" id="char-name-confirm" disabled>
          ✓ Confirm Name
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const input = document.getElementById('char-name-input');
  const btn = document.getElementById('char-name-confirm');
  input.focus();
  input.addEventListener('input', () => { btn.disabled = !input.value.trim(); });
  btn.addEventListener('click', async () => {
    const name = input.value.trim();
    if (!name) return;
    await saveCharacterName(character.id, name);
    character.character_name = name;
    modal.remove();
    if (onComplete) onComplete(name);
  });
}

// ── RETIREMENT / SET ASIDE UI ────────────────────────────────
async function openRetirementDialog(character, campaignId, retiredByPlayerId, onComplete) {
  const modal = document.createElement('div');
  modal.className = 'db-modal-backdrop';
  modal.id = 'retirement-modal';

  const pqClass = PQ_UNLOCKS_CLASS[character.pq_card_id];
  const unlocksName = pqClass ? (ALL_CLASSES[pqClass]?.name ?? pqClass) : 'Unknown';

  modal.innerHTML = `
    <div class="db-modal" style="max-width:480px">
      <div class="db-modal-header">
        <h3 class="db-modal-title">⚰️ Character Retirement</h3>
        <button class="campaign-wizard-close" id="retirement-close">✕</button>
      </div>
      <p class="db-modal-desc">
        <strong>${character.character_name || 'This character'}</strong> has completed their Personal Quest
        and is ready to retire.<br><br>
        Retiring will permanently unlock <strong>${unlocksName}</strong> for the campaign.
        ${character.pq_card_id ? `Their PQ card will be removed from the deck.` : ''}
      </p>
      <div class="retirement-actions">
        <button class="db-btn db-btn-secondary" id="btn-set-aside">
          📦 Set Aside Instead
        </button>
        <button class="db-btn db-btn-primary" id="btn-retire">
          ⚰️ Retire Character
        </button>
      </div>
      <div style="margin-top:10px;text-align:center">
        <button class="db-btn db-btn-close" id="btn-retirement-cancel">Cancel</button>
      </div>
      <p class="retirement-note">
        <strong>Set Aside:</strong> Character goes inactive but keeps their PQ card and state. Can be resumed later by any player.
      </p>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('retirement-close').addEventListener('click', () => modal.remove());
  document.getElementById('btn-retirement-cancel').addEventListener('click', () => modal.remove());

  document.getElementById('btn-set-aside').addEventListener('click', async () => {
    if (!confirm(`Set aside ${character.character_name || 'this character'}? They can be resumed later.`)) return;
    try {
      await setAsideCharacter(character);
      modal.remove();
      showToast(`${character.character_name || 'Character'} set aside.`);
      if (onComplete) onComplete('set_aside');
    } catch (err) {
      showToast('Error: ' + err.message, true);
    }
  });

  document.getElementById('btn-retire').addEventListener('click', async () => {
    if (!confirm(`Retire ${character.character_name || 'this character'}? This cannot be undone.`)) return;
    try {
      const result = await retireCharacter(character, campaignId, retiredByPlayerId);
      modal.remove();
      if (result.duplicate) {
        const className = ALL_CLASSES[result.classId]?.name ?? result.classId;
        showRetirementDuplicateDialog(className);
      } else if (result.classId) {
        const className = ALL_CLASSES[result.classId]?.name ?? result.classId;
        showToast(`${character.character_name || 'Character'} retired! ${className} is now unlocked.`);
      } else {
        showToast(`${character.character_name || 'Character'} retired.`);
      }
      if (onComplete) onComplete('retired', result);
    } catch (err) {
      showToast('Error: ' + err.message, true);
    }
  });
}

function showRetirementDuplicateDialog(className) {
  const modal = document.createElement('div');
  modal.className = 'db-modal-backdrop';
  modal.innerHTML = `
    <div class="db-modal" style="max-width:420px">
      <div class="db-modal-header">
        <h3 class="db-modal-title">🎲 Class Already Unlocked</h3>
      </div>
      <p class="db-modal-desc">
        The PQ card would have unlocked <strong>${className}</strong>, but that class is already available.
        Instead, the party gains:
      </p>
      <ul class="retirement-duplicate-list">
        <li>🗺 A random <strong>Side Scenario</strong> (manage in Secretariat)</li>
        <li>🎒 A random <strong>Item</strong> (manage in Secretariat)</li>
      </ul>
      <p class="db-modal-desc" style="margin-top:8px">The PQ card has been permanently removed from the deck.</p>
      <div class="wizard-nav" style="margin-top:16px">
        <span></span>
        <button class="wizard-btn wizard-btn-primary" id="duplicate-ok">Got it</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById('duplicate-ok').addEventListener('click', () => modal.remove());
}

// ── NEW CHARACTER CREATION ───────────────────────────────────
async function openNewCharacterWizard(campaignId, playerId, onComplete) {
  const unlockedClassIds = await getUnlockedClasses(campaignId);

  // Get only active characters to find classes blocked from creation
  const { data: activeChars } = await sb()
    .from('characters')
    .select('class_id, status')
    .eq('campaign_id', campaignId)
    .eq('status', 'active');

  const activeClassIds = new Set((activeChars ?? []).map(c => c.class_id));

  const modal = document.createElement('div');
  modal.className = 'db-modal-backdrop';
  modal.id = 'new-char-modal';

  const availableClassIds = unlockedClassIds.filter(classId => !activeClassIds.has(classId));

  if (!availableClassIds.length) {
    showToast('No classes available — all unlocked classes already have an active character.', true);
    return;
  }

  const classCards = availableClassIds.map(classId => {
    const cls = ALL_CLASSES[classId] ?? CLASS_DISPLAY[classId];
    if (!cls) return '';
    const hasKb = !!CLASS_REGISTRY[classId];
    const iconHtml = cls.icon
      ? `<img src="${cls.icon}" width="48" height="48" class="class-svg-icon" style="filter:brightness(0) invert(1)">`
      : `<span class="new-char-symbol">${cls.symbol}</span>`;
    return `
      <div class="new-char-card" data-class-id="${classId}">
        <div class="new-char-icon">${iconHtml}</div>
        <div class="new-char-name">${cls.name}</div>
        <div class="new-char-symbol-label">${cls.symbol}</div>
        ${hasKb ? '<div class="new-char-kb-badge">✓ Guide available</div>' : ''}
      </div>
    `;
  }).join('');

  modal.innerHTML = `
    <div class="db-modal" style="max-width:640px">
      <div class="db-modal-header">
        <h3 class="db-modal-title">⚔️ Create New Character</h3>
        <button class="campaign-wizard-close" id="new-char-close">✕</button>
      </div>
      <p class="db-modal-desc">Choose a class for your new character. All unlocked classes are available.</p>
      <div class="new-char-grid">${classCards}</div>
      <div class="wizard-nav" style="margin-top:16px">
        <button class="wizard-btn wizard-btn-back" id="new-char-close2">Cancel</button>
        <button class="wizard-btn wizard-btn-primary" id="new-char-confirm" disabled>
          ✓ Create Character
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  let selectedClassId = null;

  modal.querySelectorAll('.new-char-card').forEach(card => {
    card.addEventListener('click', () => {
      modal.querySelectorAll('.new-char-card').forEach(c => c.classList.remove('new-char-selected'));
      card.classList.add('new-char-selected');
      selectedClassId = card.dataset.classId;
      document.getElementById('new-char-confirm').disabled = false;
    });
  });

  const close = () => modal.remove();
  document.getElementById('new-char-close').addEventListener('click', close);
  document.getElementById('new-char-close2').addEventListener('click', close);

  document.getElementById('new-char-confirm').addEventListener('click', async () => {
    if (!selectedClassId) return;
    modal.remove();
    // Create new campaign_players row
    const { data: newChar, error } = await sb()
      .from('characters')
      .insert({
        campaign_id: campaignId,
        class_id: selectedClassId,
        status: 'active',
      })
      .select().single();
    if (error) { showToast('Error creating character: ' + error.message, true); return; }
    if (onComplete) onComplete(newChar);
  });
}

// ── INIT HOOK (called from campaign.js after campaign creation) ──
async function onCampaignCreated(campaignId, startingGroup) {
  await Promise.all([
    initPqDeck(campaignId, startingGroup),
    initUnlockedClasses(campaignId, startingGroup),
  ]);
}

// ── FIRST TIME DECK BUILDER FLOW ─────────────────────────────
// Called from deckbuilder.js when opening a character for the first time
async function runFirstTimeSetup(character, player, onComplete) {
  // Step 1: Name the character
  openCharacterNamingPrompt(character, player, async (name) => {
    // Step 2: Pick PQ card
    await openPqPicker(character, async (pqCardId) => {
      character.pq_card_id = pqCardId;
      if (onComplete) onComplete();
    });
  });
}

// ── MANUAL UNLOCK (Vanquisher / Shardrender) ─────────────────
// Classes with no PQ cards that unlock via scenario progression
const SCENARIO_UNLOCK_CLASSES = ['vanquisher', 'shardrender'];

async function openManualUnlockDialog(campaignId, onComplete) {
  const currentlyUnlocked = await getUnlockedClasses(campaignId);

  const available = SCENARIO_UNLOCK_CLASSES.filter(id => !currentlyUnlocked.includes(id));

  if (!available.length) {
    showToast('Both scenario-unlocked classes are already unlocked.');
    return;
  }

  const modal = document.createElement('div');
  modal.className = 'db-modal-backdrop';
  modal.id = 'manual-unlock-modal';

  const cards = available.map(classId => {
    const cls = ALL_CLASSES[classId];
    return `
      <div class="new-char-card manual-unlock-card" data-class-id="${classId}">
        <div class="new-char-symbol" style="font-size:28px;margin-bottom:8px">${cls.symbol}</div>
        <div class="new-char-name">${cls.name}</div>
        <div class="new-char-symbol-label">Unlocked via scenario</div>
      </div>
    `;
  }).join('');

  modal.innerHTML = `
    <div class="db-modal" style="max-width:420px">
      <div class="db-modal-header">
        <h3 class="db-modal-title">🔓 Unlock Class</h3>
        <button class="campaign-wizard-close" id="manual-unlock-close">✕</button>
      </div>
      <p class="db-modal-desc">
        Select a class unlocked through scenario progression.
        This cannot be undone.
      </p>
      <div class="new-char-grid" style="grid-template-columns:repeat(auto-fill,minmax(160px,1fr))">
        ${cards}
      </div>
      <div class="wizard-nav" style="margin-top:16px">
        <button class="wizard-btn wizard-btn-back" id="manual-unlock-cancel">Cancel</button>
        <button class="wizard-btn wizard-btn-primary" id="manual-unlock-confirm" disabled>
          🔓 Unlock
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  let selectedClassId = null;

  modal.querySelectorAll('.manual-unlock-card').forEach(card => {
    card.addEventListener('click', () => {
      modal.querySelectorAll('.manual-unlock-card').forEach(c => c.classList.remove('new-char-selected'));
      card.classList.add('new-char-selected');
      selectedClassId = card.dataset.classId;
      document.getElementById('manual-unlock-confirm').disabled = false;
    });
  });

  const close = () => modal.remove();
  document.getElementById('manual-unlock-close').addEventListener('click', close);
  document.getElementById('manual-unlock-cancel').addEventListener('click', close);

  document.getElementById('manual-unlock-confirm').addEventListener('click', async () => {
    if (!selectedClassId) return;
    const cls = ALL_CLASSES[selectedClassId];
    if (!confirm(`Unlock ${cls.name}? This cannot be undone.`)) return;
    await unlockClass(campaignId, selectedClassId);
    modal.remove();
    showToast(`${cls.name} is now unlocked!`);
    if (onComplete) onComplete();
  });
}
