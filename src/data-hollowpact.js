// data-hollowpact.js — Savvas Hollowpact (Vortex class)
// Guide source: Magatis on Imgur (imgur.com/a/g4iTKCf, Aug 2022)
// Card images: github.com/cmlenius/gloomhaven-card-browser (images branch)
// Path pattern: images/character-ability-cards/crimson-scales/HO/cs-{card-slug}.jpeg

const BASE_HO = "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/HO/";
const BASE_WH = "https://raw.githubusercontent.com/any2cards/worldhaven/master/images/";

const HOLLOWPACT_DATA = {
  id: "hollowpact",
  name: "Savvas Hollowpact",
  symbol: "Vortex",
  game: "Crimson Scales",
  startingHP: 7,
  handSize: 10,

  milestone: {
    imageUrl: BASE_WH + "milestones/crimson-scales/cs-ms-hollowpact-front.png",
    reward: "Permanently add <strong>The Void Consumes</strong> (Level M card) to your supply. The top action spends Triple Void for Attack 6 with Push 1 and Advantage — one of the hardest hitting single attacks on the class — while also creating a Void Pit and infusing Dark, keeping your element and obstacle economy going simultaneously. The bottom is a flexible utility action: Move 2, destroy an adjacent obstacle to gain a Void and optionally replace it with a Void Pit, then Immobilize any enemy adjacent to a Void Pit. Both halves synergise perfectly with the class's Void Pit focus and make this a card you'll want to play every scenario.",
    commentary: "Goal: Perform Voidsight while you have at least one Void Energy token 10 times. This is the Hollowpact's core gameplay loop — using Voidsight while managing Void Energy is something you'll do naturally every scenario. Cards like Touch of the Void, Find an Opening, and Nether Blades all trigger Voidsight, so this milestone completes itself as long as you remember to hold at least one Void when you use them. Once complete, The Void Consumes is added permanently to your hand.",
  },

  cards: [
    // ── LEVEL 1 ────────────────────────────────────────────
    {
      name: "Void Step",
      level: "1",
      initiative: 20,
      imageUrl: BASE_HO + "cs-void-step.jpeg",
      tags: ["void", "teleport"],
      builds: ["trapbuild"],
      top: { text: "Teleport 2 · Attack 2 · Gain 1 Void · XP", isLoss: false },
      bottom: { text: "Void consumption: Teleport 4 · Generate Dark · Infuse Dark", isLoss: false },
      commentary: "A strong start and a card played for the entire Level 1-5 time as Hollowpact. Teleport 2 Attack 2 upgradeable to Attack 3 with a spare Void is great — very reminiscent of the Mindthief's Scurry at the same Initiative 20. The Bottom is where this card really shines: suffer 1 damage to immediately gain a Void, which can then be spent on the spot to Teleport 4. This makes it one of your most reliable Void dumps — you're always in control of when you trigger it, unlike attack-tied Void consumptions that depend on enemies being in range. Plays similarly to a Move 2 Jump that can be executed even while Immobilized, which is a notable edge case worth keeping in mind."
    },
    {
      name: "Nether Blades",
      level: "1",
      initiative: 55,
      imageUrl: BASE_HO + "cs-nether-blades.jpeg",
      tags: ["aoe", "voidsight"],
      builds: ["both"],
      top: { text: "Voidsight · Attack 2 · AoE hex pattern · Gain 1 Void", isLoss: false },
      bottom: { text: "Move 2 · Void consumption: Teleport 4 · Infuse Dark", isLoss: false },
      commentary: "The Top looked better in theory than practice — the AoE formation doesn't come together as naturally as it seems, as monsters rarely form the right pattern unless you reposition. Often read as just Voidsight Attack 2 Gain Void, which is fine at Level 1 but felt lackluster a few levels in. The Voidsight is your best (damage-free) way to generate Void at Level 1, but not consistent enough to rely on. Initiative 55 is poor for this class. The Bottom is where this card earns its keep — Move 2 with an optional Void consumption for Teleport 4 and Dark Infusion. This makes it one of your most reliable ways to dump Void while also generating Dark, your most valuable element. Unlike Void Step's suffer-1-damage trigger, this one costs no HP — a meaningful difference at a class that already takes incidental damage from various effects."
    },
    {
      name: "Withering Deluge",
      level: "1",
      initiative: 52,
      imageUrl: BASE_HO + "cs-withering-deluge.jpeg",
      tags: ["aoe", "void"],
      builds: ["bruiser"],
      top: { text: "Void consumption: Attack 5 · WOUND · Target 2 · Gain 2 Void · XP (Loss)", isLoss: true },
      bottom: { text: "Move 3 · Create a Void Pit obstacle in an adjacent empty hex", isLoss: false },
      commentary: "A card personally cut at Level 1, though its Bottom got significantly better with the finalized version's greater focus on Void Pit obstacles. The Top is an opportunistic Loss requiring careful timing with a Bottom Generator to avoid Muddle. Attack 5 Wound on 2 targets is excellent but demands both Void available and good target positioning — subpar and best suited as a 'last room' play without both. The new Bottom is an unconditional Move 3 Create Void Pit, which is great value and brings this solidly into the middle of the Level 1 pack."
    },
    {
      name: "Enervating Strike",
      level: "1",
      initiative: 37,
      imageUrl: BASE_HO + "cs-enervating-strike.jpeg",
      tags: ["void"],
      builds: ["both"],
      top: { text: "Attack 3 · Heal 1 Self · Void consumption: POISON and MUDDLE", isLoss: false },
      bottom: { text: "Move 4 Jump · Self and all adjacent figures suffer 2 damage · Gain 2 Void · 2 XP (Loss)", isLoss: true },
      commentary: "A clean Level 1 card that mostly reads as Attack 2 Heal 1 Self with optional Poison and Muddle from Void consumption — not bad at all for Level 1, and the fast Initiative 37 helps. The Top was used mostly for self-healing as the party lacked a dedicated Damage Soak; Poison/Muddle consumption will vary party to party. The Bottom is a 2 XP Loss — Move 4 Jump where you and all adjacent figures suffer 2 damage and gain 2 Void. The self-damage and friendly-fire make this situational at best, but the 2 Void gain on top of a Jump is interesting for those turns when you desperately need to dump or generate Void fast. Mostly this card lives as a reliable Top action and the Bottom stays in reserve. Won't stick in the hand for long as better options arrive, but earns its keep early."
    },
    {
      name: "Borrowed Vitality",
      level: "1",
      initiative: 37,
      imageUrl: BASE_HO + "cs-borrowed-vitality.jpeg",
      tags: ["void"],
      builds: ["trapbuild"],
      top: { text: "Heal 3 Self · Gain 2 Void · Void consumption: Heal 2 bonus, REGENERATE", isLoss: false },
      bottom: { text: "Move 3 · Dark consumption: Heal 2 Self, REGENERATE", isLoss: false },
      commentary: "Exclusively ran at Level 1 then cut immediately at Level 2. Heal 3 Self top is below curve and the extra ability was difficult to utilize. The 2 Void plus bonus Heal is net neutral barring specific affects. The Bottom is what pushed it — Move 3 with Dark consumption giving Heal 2 and Regenerate plays nicely with the self-damaging (and Void-Wounding) aspects of the class. Dark is always lying around on this class. Initiative 37 is on the awkward side of fast. Ultimately a fine cut for many aspirant Hollowpacts given the Level 1 competition."
    },
    {
      name: "Untethered Advance",
      level: "1",
      initiative: 46,
      imageUrl: BASE_HO + "cs-untethered-advance.jpeg",
      tags: ["aoe", "void"],
      builds: ["bruiser"],
      top: { text: "Attack 4 · AoE hex pattern · Move 2 after · Void consumption: Create Void Pit · XP", isLoss: false },
      bottom: { text: "Move 3 · You may disarm one adjacent trap or destroy one adjacent obstacle. If you do, gain 1 Void.", isLoss: false },
      commentary: "A classic card with two good halves and an abysmal Initiative to compensate — a sign the developer knew the power level and used Initiative as a lever. The Top AoE Attack 4 is one of the hardest hitting single attacks for quite a long time, feeling like Attack 4 XP or Attack 3 Move 2 depending on how the hit lands. The Move 2 afterwards plays into the Hit and Run aspect this class wants to emphasize. The Bottom is a decent terrain control option — Move 3 followed by the option to disarm a trap or destroy an obstacle for a free Void token. This pairs naturally with the class's Void Pit creation, as you can convert enemy obstacles or traps into Void Pits on subsequent turns. Initiative 46 is close to the worst — ensure you play some fast and slow cards to compensate."
    },
    {
      name: "Touch of the Void",
      level: "1",
      initiative: 29,
      imageUrl: BASE_HO + "cs-touch-of-the-void.jpeg",
      tags: ["void", "voidsight"],
      builds: ["trapbuild"],
      top: { text: "Voidsight · Attack 1/2 · STUN · Gain 1 Void · Dark Infuse · XP", isLoss: false },
      bottom: { text: "Heal 7 Self · POISON and WOUND Self · Gain 1 Void (Loss)", isLoss: true },
      commentary: "Ran for the entire career because of one simple word: Stun. Voidsight Attack 1/2 is reasonable but adding an unconditional Stun takes this to territory where any Gloomhaven aficionado will take it. One of the better non-Loss Stuns in the expansion; many Crimson Scales classes will likely be our last look at non-Loss Stuns without heavy conditions. Converting Void to +1 Attack, a Dark Infusion AND xp is fantastic. Initiative 29 is fine (on a CC ability) but dicey when you need the Stun for a specific monster. The Bottom is a massive Heal 7 with two significant downsides — used almost exclusively as a Top action card."
    },
    {
      name: "Find an Opening",
      level: "1",
      initiative: 15,
      imageUrl: BASE_HO + "cs-find-an-opening.jpeg",
      tags: ["void", "voidsight"],
      builds: ["both"],
      top: { text: "Voidsight · Attack 2 · DISARM adjacent ally · Gain 1 Void · DEMONS: extra targets", isLoss: false },
      bottom: { text: "Move 2 · Allies within Range 3 may perform Attack 1 targeting an adjacent Void Pit · Gain Void per ally attack", isLoss: false },
      commentary: "A staple for a couple of different reasons — the whole card is good and the Bottom Action in particular got even better from when it was tested. Voidsight at Initiative 15 combined with even more welcome top attack makes this great. Note the Bottom action got better in the finalized version as it also works with your Void Pit obstacles. Initiative 15 may be your fastest card period depending on card choice at 4 and 5. The Damage Aura aspect is huge, even if you can't always utilize it — a great way to set up your draws while also buffing ally actions."
    },
    {
      name: "Reaching Darkness",
      level: "1",
      initiative: 79,
      imageUrl: BASE_HO + "cs-reaching-darkness.jpeg",
      tags: ["void"],
      builds: ["trapbuild"],
      top: { text: "Attack 2 · Range 5 · POISON · Void consumption: +1 Attack · Gain 1 Void · XP", isLoss: false },
      bottom: { text: "2 damage · Teleport nebulous range · Attack 2 · STUN · Infuse Dark · XP (Loss)", isLoss: true },
      commentary: "So liked it was the first enhancement in Crimson Scales — adding Poison for good value. The simplicity of Attack 2 Range 5 that makes both elements you care about just great, and such a nice enabler for next turn. Almost never felt bad to play this Top action as this was often a Room and/or Scenario opener — hit at slow Initiative to stay safe and get ready for an explosive turn 2. Initiative 79 is one of the slowest ones early on but staple useful. The Bottom is a situational but powerful Loss: 2 Damage plus a Teleport of nebulous range plus Attack 2 Stun Infuse Dark has some nice final room potential. Used the Top a vast majority of the time."
    },    {
      name: "Channel the Void",
      level: "1",
      initiative: 33,
      imageUrl: BASE_HO + "cs-channel-the-void.jpeg",
      tags: ["void"],
      builds: ["both"],
      top: { text: "Self and all adjacent figures suffer 1 damage · Gain 1 Void · Disarm one adjacent trap or destroy one adjacent obstacle · If you do, gain 1 Void", isLoss: false },
      bottom: { text: "Attack 1 · WOUND · Double Void consumption: Attack 3 · WOUND", isLoss: false },
      commentary: "A strange card where both halves feel like they belong on an X card. The Top asks you to damage yourself and adjacent allies to gain Void, then optionally control terrain for a second Void — netting up to 2 Void while converting a trap or obstacle, which sets up the class's Void Pit synergies nicely. The self-damage and friendly fire are the sticking point, making this best used when you have space to operate. The Bottom is a rare bottom attack — Attack 1 Wound by default, upgradeable to Attack 3 Wound by spending Double Void. A clean Void dump with meaningful upside, and a Wound is always welcome. Think carefully about which half you need most each turn — both are genuinely useful but rarely simultaneously."
    },

    {
      name: "Hollow Embrace",
      level: "X",
      initiative: 51,
      imageUrl: BASE_HO + "cs-hollow-embrace.jpeg",
      tags: ["void"],
      builds: ["trapbuild"],
      top: { text: "Suffer 2 damage · Attack 3 · Gain 1 Void · Target 2 if ally is adjacent to one target · Range 2", isLoss: false },
      bottom: { text: "Dark consumption: Heal 2 Self · Void consumption: Heal 2 Self", isLoss: false },
      commentary: "Will straddle the play vs cut line depending on what the player needs. Both halves are decent but not overly exciting, and the Initiative is another awful 50-something. The Top required an adjacent ally and ideally two monsters within Range 2, plus willingness to take 2 damage — roughly equivalent to two Attack 3s. Not impressive with one target and fine but scary with two. The Bottom was where more energy was spent — a nice Bottom Heal mid combat with a powerful way to spend the Dark. There's space within level 1 Hollowpact kit for this effect and the Heal action, so this has some extra value."
    },

    // ── LEVEL X ────────────────────────────────────────────
    {
      name: "One with Nothingness",
      level: "X",
      initiative: 31,
      imageUrl: BASE_HO + "cs-one-with-nothingness.jpeg",
      tags: ["void", "voidsight"],
      builds: ["both"],
      top: { text: "Voidsight · INVISIBLE Self · Gain 1 Void · Dark Infuse · XP (Loss)", isLoss: false },
      bottom: { text: "Move 3 · Void consumption: Move 5 Self, MUDDLE Self", isLoss: false },
      commentary: "Definitely worthy of the X card category — takes the 'downsides to powerful abilities' concept that both Cragheart and Hollowpact possess and hones it. Voidsight, Invisible, Dark and Void, even XP — a lot of nice little bonuses especially when added together. Disarming self is a hell of a cost, and this boiled down to primarily a way to safely Long Rest when things turned sour. Dark Infusion was trinket text barring another ally needing it. The Bottom continues the trend of a card with a bit of everything — Move 3 is always fine, and the optional Void consumption gives quasi-Move 5 with Muddle Self."
    },
    {
      name: "Greed Before Need",
      level: "X",
      initiative: 33,
      imageUrl: BASE_HO + "cs-greed-before-need.jpeg",
      tags: ["void"],
      builds: ["bruiser"],
      top: { text: "Loot 2 · Create Void Pit · XP if enemy is adjacent to the Void Pit", isLoss: false },
      bottom: { text: "Move 3 · Earth or Wild element consumption: Hold Over Dark for next turn", isLoss: false },
      commentary: "Personally ran due to Personal Quest needing to loot, and liking both halves enough where it didn't feel like a burden primarily as a Loot. The Top is a nice nod to Loot 2.0 from Frosthaven — some nice incidental damage and doing something the class wants to do (Create a Void). Won't always happen as you will be looting 'empty' rooms a reasonable amount. Initiative 33 is fine but nothing particularly impressive. The Bottom is Move 3 with upside, with this one's usefulness initially being pretty locked in to what allies can produce. My party had incidental Earth generation that my party member didn't always need, so this was absolutely a welcome ability."
    },

    // ── LEVEL 2 ────────────────────────────────────────────
    {
      name: "Nether Binding",
      level: "2",
      initiative: 64,
      imageUrl: BASE_HO + "cs-nether-binding.jpeg",
      tags: ["void", "teleport"],
      builds: ["both"],
      top: { text: "PUSH 3 · IMMOBILIZE · Void Pit: Create Void Pit and Void Energy", isLoss: false },
      bottom: { text: "Teleport 4-5 · Heal 4 ally · Infuse Dark · Earth consumption: Wound ally (minor downside)", isLoss: false },
      commentary: "Personally took this at Level 2 and was happy with it for its party, however in a vacuum it may be the weaker of the two Level 2 choices overall. The Top was rarely used — the version played didn't have a ton of interactions with Void Pit obstacles (that really came online at Level 3/4). Has some nice synergy with locking down a melee enemy through Push/Immobilize, combined with a Void Pit obstacle and Void energy afterwards. Initiative 64 is definitely the worst part of this card. The Bottom Teleport 4-5 Heal 4 Infuse Dark is fantastic — almost always wanted the Void for it to work properly."
    },
    {
      name: "Shrouded Grasp",
      level: "2",
      initiative: 23,
      imageUrl: BASE_HO + "cs-shrouded-grasp.jpeg",
      tags: ["void"],
      builds: ["trapbuild"],
      top: { text: "Attack 3 · IMMOBILIZE · Dark consumption: INVISIBLE Self, CURSE", isLoss: false },
      bottom: { text: "Move 4 · Create Void Pit · PULL target adjacent to Void Pit", isLoss: false },
      commentary: "A similar trajectory to Nether Binding — two solid halves, although both are a little weaker in vacuum, packed with a much better Initiative at 23. The Top is definitely something where you would not be looking to play it without the Dark Consumption — Attack 3 Immobilize with no extra mobility is nothing special. The Invisibility definitely pushes this to great, as it's a cheeky way to ensure your enemy doesn't land an Attack while not even having to move away. The Bottom is marginally weaker but solid — a way to bring an enemy to you without actually jumping into the fray yourself, functioning as a Move 4 Create Void. Both halves are swingy in nature requiring conditions to shine."
    },
    {
      name: "Empowered Assault",
      level: "3",
      initiative: 19,
      imageUrl: BASE_HO + "cs-empowered-assault.jpeg",
      tags: ["void", "teleport"],
      builds: ["trapbuild"],
      top: { text: "Teleport 2 · Attack 2 · MUDDLE Self · Suffer 1 damage · Void consumption: +2 Attack · XP", isLoss: false },
      bottom: { text: "Teleport 4 · Suffer 1 damage · Dark consumption: STUN adjacent enemy · Void consumption: Gain Void", isLoss: false },
      commentary: "Numerically superior to Void Step although the similarity in Initiative (19 vs 20) makes this a sort of non-pick for some, as both cards do similar things but Assault also introduces more downsides (Muddle on Top, extra damage on Bottom). Both halves are definitely an improvement over Void Step, but it's a fairly nebulous comparison. The Bottom Dark Consumption to Stun an adjacent enemy after Teleport is fantastic — the most impactful upgrade over Void Step. Note that due to card formatting you can skip the 2 damage/Void generation when using the Bottom, which is important. Magatis gives the nod to Majestic Malevolence over both for its solid new things and best late Initiative."
    },

    // ── LEVEL 3 ────────────────────────────────────────────
    {
      name: "Majestic Malevolence",
      level: "3",
      initiative: 89,
      imageUrl: BASE_HO + "cs-majestic-malevolence.jpeg",
      tags: ["void"],
      builds: ["bruiser"],
      top: { text: "Attack 3 · Range 3 · Void Pit or obstacle: target from it instead · Heal Self · Dark Infuse · 2 XP", isLoss: false },
      bottom: { text: "Create Void Pit · Gain Void Energy · Attack 3 · MUDDLE (optional 2 Void: better version)", isLoss: false },
      commentary: "Already happy with this card, and since played they added text for the Top to target from Void Pit Obstacles instead of yourself — fantastic utility that solidifies Nether Binding as a strong pick at Level 2. The Top is flexible and reasonable without Dark, getting a lot better with it (a reoccurring trend). Range 1 would be fairly prohibitive normally, but between you and your Void Pits this should be easy enough to have a couple targets — you can always target yourself for the Heal. The Bottom underwent a big change: looks like a reasonable way to make both a Void Pit and gain Void Energy, with a nice option to spend 2 Voids for Attack 3 Muddle. Initiative 89 is great and the best late Initiative period."
    },
    {
      name: "Void-Enhanced Armory",
      level: "4",
      initiative: 17,
      imageUrl: BASE_HO + "cs-void-enhanced-armory.jpeg",
      tags: ["void"],
      builds: ["trapbuild"],
      top: { text: "Attack 3 · Shield 1 · Infuse Dark · Double Void consumption: +2 Attack · 2 XP", isLoss: false },
      bottom: { text: "Gain +1 Attack on all attacks once per turn while spending Void · XP (Persistent Loss)", isLoss: true },
      commentary: "A bit of a strange card that encourages a new sort of playstyle — actually trying to soak some damage for the team via incidental Shielding. You got a couple more cards upcoming with similar effects, so it's a nice option to have but you won't become some sort of main frontliner. Attack 3 Shield 1 Infuse Dark is fine although nothing exceptional, and the Double Void spender for +2 Attack is mostly a way to dump excess Void that may become problematic if held onto too long. Initiative 17 makes good sense for the Top half, where Shields need to go quickly. The Bottom is a strange Persistent Loss clarified to only spend Void once per turn for +1 Attack — leery about spending many Losses on this class, so think this could be good but risky when things go sideways."
    },

    // ── LEVEL 4 ────────────────────────────────────────────
    {
      name: "Obliterate",
      level: "4",
      initiative: 13,
      imageUrl: BASE_HO + "cs-obliterate.jpeg",
      tags: ["void", "aoe"],
      builds: ["bruiser"],
      top: { text: "Attack 3-4 · DISARM · AoE pattern · Void Pit on kill · Infuse Dark · 2 XP (Loss)", isLoss: true },
      bottom: { text: "Move 4 · PUSH 2 · Void consumption: 2-4 True Damage · Generate Dark", isLoss: false },
      commentary: "The pinnacle card — one bit of awkwardness is the similarity in Initiative values (13 vs 17) between the two Level 4 choices, making this a sort of non-pick dilemma. The Top was primarily used with Double Void for a massive Attack 12-18 Disarm 2-3x, but even three Attack 4 Disarms creating Void Pits if they kill is great. This card also Infuses Dark and gives 2xp — used the Top mid to late of almost every scenario. Felt like an ace in the hole to turn pretty much any room into a pile of coins quickly, and any that did live certainly didn't get to attack this round. The Bottom Move 4 Push 2 is great, and being able to gain Void and deal 2-4 True Damage tacked onto it gives a nice payoff for Void Pits nearby."
    },
    {
      name: "Stalking Quarry",
      level: "5",
      initiative: 14,
      imageUrl: BASE_HO + "cs-stalking-quarry.jpeg",
      tags: ["void", "voidsight", "teleport"],
      builds: ["both"],
      top: { text: "Attack 4 · Void Pit: free Teleport 3 if enemy adjacent to any figure · IMMOBILIZE · Double Void: +2 Attack · XP", isLoss: false },
      bottom: { text: "Move 4 · Shield 1 · Infuse Dark · Generate Dark", isLoss: false },
      commentary: "A lot of nice effects that are situational, but with 4 potential different options and a perfectly fine Attack 4 baseline — you want at least one of the other abilities, if not two. The Teleport being conditional on an enemy adjacent to any other figure means it definitely won't come up all the time, but a single Dark is easy enough to get to make this at least Attack 4 Immobilize. The Double Void for +2 Attack is yet another appreciated Void sink. Initiative 14 is once again appreciated but a little unnecessary at this point depending on your card choices at level ups. The Bottom Move 4 Infuse Dark is simply great — with card choice you could pretty easily be almost entirely Melee by this point."
    },

    // ── LEVEL 5 ────────────────────────────────────────────
    {
      name: "Sever Reality",
      level: "5",
      initiative: 78,
      imageUrl: BASE_HO + "cs-sever-reality.jpeg",
      tags: ["void", "voidsight"],
      builds: ["trapbuild"],
      top: { text: "Attack 4 · WOUND · Infuse Dark · Void consumption: Gain Void · 2 XP", isLoss: false },
      bottom: { text: "Voidsight · Teleport 3 · Attack 2 · CURSE · Void consumption: big bonus", isLoss: false },
      commentary: "A reasonable top, a great Bottom action, and a reasonably late Initiative — a card played happily overall although feels quite a bit less 'Transformational' than many other Level 5 cards in Crimson Scales. The Top Attack 4 Wound Infuse Dark and Void is both a setup card and effectively an Attack 5 working great with Voidsight to setup big hits. The Bottom Voidsight Teleport 3 Attack 2 Curse is such a value-packed Bottom action — incidental Curses that don't take away from your Top action, as you can whack something to soften it up with the Curse and finish it off with the Top. Initiative 78 is the first late option since Level 3, and one of the only ones at all between Levels 2-6."
    },
    {
      name: "Enduring Darkness",
      level: "6",
      initiative: 26,
      imageUrl: BASE_HO + "cs-enduring-darkness.jpeg",
      tags: ["void"],
      builds: ["trapbuild"],
      top: { text: "Dark consumption: WARD Self · Gain 2 Void · XP", isLoss: false },
      bottom: { text: "Move 4 · Heal 1 · REGENERATE · Infuse Dark · Infuse something else", isLoss: false },
      commentary: "A truly unique top effect with Dark Consumption — could represent so much damage reduced in the right circumstance. Ward often functions pretty similarly to a Shield 2-3 for a single hit, which is a little less exciting than imagined. Combines nicely with the couple of Shield options at previous level ups, so keep that in mind on your level up if your team needs someone who can absorb damage. Essentially just produces 2 Void for how it actually advances a way forwards to win the scenario — a fairly steep price. If you desperately need Void, or elements (as with the Bottom), this card has legs but both halves are a little underwhelming by Level 6. The Bottom Move 4 Heal Regenerate Infuse elements is a great value action — repeatable actions that hold a lot of value."
    },

    {
      name: "Implosion",
      level: "6",
      initiative: 49,
      imageUrl: BASE_HO + "cs-implosion.jpeg",
      tags: ["void", "aoe"],
      builds: ["bruiser"],
      top: { text: "Attack 3 · AoE MUDDLE · Void Pit requirement: no range limit · Gain Void · 2 Void consumption: better version", isLoss: false },
      bottom: { text: "Move 4 · Infuse Void · PULL optional", isLoss: false },
      commentary: "More of a payoff for simply having Void Pit obstacles than for Void accumulation itself. Creating a Void Pit for 2 Void is a steep cost unless you just want to offload it to avoid the Muddle. With a little bit of preplanning or a Bottom action that creates Void Pits, this becomes a great AoE Attack 3 Muddle without too much setup — works great with the small amount of Cursing the class does. No range restrictions means it fires from any Void Pit adjacent to monsters, so there's no feel bad moment of having the right situation but being too far away. Initiative 49 isn't ideal but is far from a deal breaker. The Bottom is essentially Move 4 Infuse Void, with the Pull being very rarely relevant but helping set up some odds AoEs."
    },

    {
      name: "Gateway to the Abyss",
      level: "7",
      initiative: 66,
      imageUrl: BASE_HO + "cs-gateway-to-the-abyss.jpeg",
      tags: ["void", "aoe"],
      builds: ["bruiser"],
      top: { text: "Double Void consumption: Attack 4 · WOUND · Target all enemies, no range limit · Gain 2 Void · 2 XP (Loss)", isLoss: true },
      bottom: { text: "Move 4 · Void consumption: PUSH 5 adjacent enemy · Deal 2 True Damage", isLoss: false },
      commentary: "Another pretty absurd Loss that requires Double Void to even really exist as a card. No cap on how many monsters it can hit, and an effective Attack 4 counting the Wound on each means this can pretty easily obliterate a room mid combat. Requires fair bit of pre-planning (Double Void for the ability, monsters in the right positions) so this is a Loss you won't play every scenario but will have a large impact when you can line it up. The 3 true damage to allies is unfortunate but potentially a way to reign in a card with such limitless potential. Initiative 66 is at least later than most of our options lately, although still far from the nice late Initiatives in the 80-95 range. The Bottom is pretty vanilla without Void but the class should have no real issues generating Void at this point — the ability to shunt an adjacent target up to 5 hexes away and deal 2 true damage is great when stapled onto a Move 4.",
    },
    // ── LEVEL 6 ────────────────────────────────────────────
    // ── LEVEL 7 ────────────────────────────────────────────
    {
      name: "Ruinous Barrage",
      level: "7",
      initiative: 38,
      imageUrl: BASE_HO + "cs-ruinous-barrage.jpeg",
      tags: ["void"],
      builds: ["trapbuild"],
      top: { text: "Attack 4 · Attack 4 · Attack 4 · STUN one · Dual Void + Dark consumption: better version · 2 XP (Loss)", isLoss: true },
      bottom: { text: "Attack 3 · IMMOBILIZE · Teleport 3 · Suffer 1 damage · Void consumption: gain Void", isLoss: false },
      commentary: "Perhaps the least impressive Level 7 Loss effect by default without meeting any conditions, but having all 3 (Dual Void + Dark) is definitely where you want to be — 2 hefty Attacks that can target different enemies followed by a nice little Stun means this can take care of 2 monsters very easily and potentially 3. Initiative 38 is unimpressive and not fast enough to ensure monsters are still in the right position. The Bottom is a nice hit-and-run style attack — self-sufficient provided you have either the 1 life to pay or already have the Void. Attack 3 Immobilize Teleport 3 as a Bottom action means you can hit something else with your Top, bop a healthy monster with this Bottom and get away scot free. A conditional Top Loss with a good spammable Bottom."
    },

    // ── LEVEL 8 ────────────────────────────────────────────
    {
      name: "Entropy Unleashed",
      level: "8",
      initiative: 28,
      imageUrl: BASE_HO + "cs-entropy-unleashed.jpeg",
      tags: ["void", "voidsight", "aoe"],
      builds: ["bruiser"],
      top: { text: "Attack 2 · AoE 2-3 targets · POISON · Void/element consumption: +1 Poison · Voidsight setup", isLoss: false },
      bottom: { text: "Teleport range · Attack 3 · POISON · Void consumption: extra Wound · Infuse Dark · XP", isLoss: false },
      commentary: "Finally a payoff for the ability to maneuver both ourselves and our enemies into the right positions — also a payoff for creating random Earth we don't really end up using much. The baseline is pretty terrible at this point (Voidsight Attack 2 on two to three targets), but it's really not difficult to get this to be Attack 3 with ANY spare element and this becomes legitimately powerful with the +1 Poison from Double Void. Hitting 2-3 Targets for Attack 4 Poison that is setup by a nice Voidsight means confidence your first hit or two will land on your priority target. Initiative 28 is one of the faster ones since Level 5. You absolutely will want to hit 2 targets with this card, although that shouldn't be difficult — 3 will be challenging but not impossible."
    },
    {
      name: "Tendrils of Night",
      level: "8",
      initiative: 44,
      imageUrl: BASE_HO + "cs-tendrils-of-night.jpeg",
      tags: ["void"],
      builds: ["both"],
      top: { text: "Loot 2 · INVISIBLE · Void/Dark elements · deal random damage to allies (minor)", isLoss: false },
      bottom: { text: "Teleport ~3 · Attack 3 · POISON · Void consumption: +extra Wound · Infuse Dark · XP", isLoss: false },
      commentary: "A strange Top — unsure how it quite fits into the general narrative of the character, but it does feature Void and Dark elements as well as Invisibility, so it's not totally out of left field. The Loot 2 is what makes it strange, as the class doesn't strike as one of the Scoundrel-typed characters, although it does have low health and is Melee. The Top is totally fine but unimpressive by Level 8. Initiative 44 here is not great and probably won't get used much. The Bottom requires a Void but should pretty much always be available — a single target fairly low value Attack at Level 8. Entropy Unleashed addresses some issues with this class in the mid to high levels and is generally the stronger pick."
    },

    // ── LEVEL 9 ────────────────────────────────────────────
    {
      name: "Prescient Voidmastery",
      level: "9",
      initiative: 0,
      imageUrl: BASE_HO + "cs-prescient-voidmastery.jpeg",
      tags: ["void"],
      builds: ["both"],
      top: { text: "Voidsight · Attack 3-5 · DISARM · multiple targets possible · Infuse Dark · 2 XP (Loss)", isLoss: false },
      bottom: { text: "Move 4 · WOUND AoE · Suffer 3 damage · Gain 3 Void", isLoss: false },
      commentary: "A pretty fun Level 9 with two unique halves tied together by a fantastic Initiative that will definitely cement Hollowpact as a good class for Initiative Control, although not the best as they do lack a few more super-late Initiatives. The Top has a Blinkblade sort of feel to it — potentially a couple Attack 3-5s, one of which will likely Disarm a target. Could potentially prevent a lot of damage via killing the monster before they actually get to complete their turn. The Bottom is the latest in a series of Move 4s with pretty big upsides — 3 Damage when we have 17 life isn't the end of the world, but generating 3 Void is definitely going to push you to start spending them ASAP. Dealing some true damage backed by a Wound is a fun way to make this feel powerful, as it's not often big moves also Inflict AoE Wounds."
    },
    {
      name: "No Escape",
      level: "9",
      initiative: 0,
      imageUrl: BASE_HO + "cs-no-escape.jpeg",
      tags: ["void", "teleport"],
      builds: ["both"],
      top: { text: "Attack · STUN · WOUND · potential 6-9 damage · 2 XP (Loss)", isLoss: false },
      bottom: { text: "Create 2 Void Pits and Gain Void Token in a big Range · Teleport 4-9", isLoss: false },
      commentary: "An apt name for a very neat card — reminiscent of Obliterate Bottom which was loved for its flexibility, and tacking on a big Stun and Wound on top and potentially dealing in the realm of 6-9 damage is awesome. This takes up both the Level 9 choice and Top action so it's far from cataclysmic in power level, but Stun is so good it doesn't matter too much what else the card does. The Bottom is quite the action as well — it unconditionally makes two Void Pits as well as a Void Token in a big Range around you, and followed up by something that will range from a Teleport 4-9. The fact that you still get to use the Void Pit obstacles for whatever your other actions want is great, and this sounds so fun to play. A class that was good, zany, and pretty unique, while still feeling like it referenced and built off of Gloomhaven's past."
    },

    // ── LEVEL M (Milestone) ────────────────────────────────
    {
      name: "The Void Consumes",
      level: "M",
      initiative: 0,
      imageUrl: BASE_WH + "milestone-ability-cards/trail-of-ashes/toa-msa-hollowpact.png",
      tags: ["void"],
      builds: ["bruiser"],
      top: { text: "Triple Void consumption: Attack 6 · PUSH 1 · Advantage · Create a Void Pit obstacle in an adjacent empty hex · Infuse Dark · XP", isLoss: false },
      bottom: { text: "Move 2 · Destroy one adjacent obstacle. If you do, gain Void. You may create a Void Pit obstacle in the hex the destroyed obstacle occupied. · IMMOBILIZE — target one enemy adjacent to a Void Pit.", isLoss: false },
      commentary: "A perfect encapsulation of the Hollowpact's identity. The top is the class's hardest hitting single attack — Attack 6 with Advantage and Push 1 — while simultaneously creating a Void Pit and infusing Dark. It requires Triple Void, making careful Void management essential, but the payoff is enormous. The bottom is a flexible utility action at Initiative 35: Move 2, convert any adjacent obstacle into a Void Pit while gaining a Void token, then Immobilize an enemy adjacent to any Void Pit. Both halves feed the Void Pit engine and reward the playstyle the class builds toward all campaign."
    },
  ],

  perks: [
    { count: 1, text: "Replace one -2 card with one +0 'Infuse Earth and two +2 Infuse Dark' card" },
    { count: 1, text: "Replace one -1 card with one +0 Infuse Wild card and one +0 Rolling Curse card" },
    { count: 1, text: "Add one +0 Voidsight card and one +0 Rolling Void card" },
    { count: 1, text: "Add one +0 Voidsight card and one +0 Rolling Void card" },
    { count: 1, text: "Replace one +0 card with one +0 'Create Void Pit' card" },
    { count: 1, text: "Replace one +0 card with one +0 'Create Void Pit' card" },
    { count: 1, text: "Add one -1 Wild Element card" },
    { count: 1, text: "Add one -1 Rolling Curse card" },
    { count: 1, text: "Ignore negative scenario effects and gain +0 Ward Self" },
    { count: 1, text: "Add +3 Regenerate Self" },
    { count: 1, text: "Ignore negative item effects and remove one -1 card" },
  ],

  tips: [
    {
      category: "⚡ Void Energy",
      text: "Void Energy is your class's unique resource — it accumulates each turn and must be spent via abilities. At 2 unspent Void you gain Muddle, at 3 you gain Wound. Managing this is critical: play conservatively early when Void generation is slow, and aggressively once you have reliable spending options."
    },
    {
      category: "⚡ Void Energy",
      text: "The cap is 3 Void Energy. You absolutely want to avoid hitting 3 as Wound is a serious problem. Keep your eyes peeled for simple ways to Consume Void so you don't take the ill effects for too long. It's notably easier to trigger Void consumption tied to movement (like Void Step Bottom) than to attacks."
    },
    {
      category: "🔮 Voidsight",
      text: "Voidsight lets you look at the top 2 attack modifier cards and place one on the bottom — and optionally leave one or both on top in any order. This is much more streamlined than the Diviner's abilities. Use it to guarantee a strong hit on key turns or to purge a -1 or Null before an important attack."
    },
    {
      category: "🕳️ Void Pits",
      text: "Void Pit obstacles are created by many of your abilities and become increasingly important as you level up. Many higher-level cards require an adjacent Void Pit to trigger their best effects. At Level 1 they're incidental — by Level 4 and beyond they're central to your power. Start building habits of placing them strategically early."
    },
    {
      category: "🌑 Dark Element",
      text: "Dark is your most important element and the one you'll generate and consume most frequently. Treat Dark generation abilities like gold — Void Step Bottom, Reaching Darkness Bottom, and your Bottom actions at higher levels all infuse Dark. Don't spend it on subpar effects; save it for Shrouded Grasp's Invisibility or Touch of the Void's Stun bonus."
    },
    {
      category: "🌀 Teleport",
      text: "Teleport is not a Move ability — Boots of Striding and similar movement items do NOT work with Teleport actions. Keep this in mind when item shopping. The class has excellent mobility via Teleport but can't leverage most standard movement item bonuses the way other classes can."
    },
    {
      category: "⚔️ Initiative",
      text: "This class struggles with Initiative — many cards sit in the awkward 33-55 range and you'll want a healthy mix of fast (15-20) and late (70+) cards. Go slow most turns to wait for monsters to engage your allies, then hit them and run. A dead monster can't hurt you!"
    },
    {
      category: "⚔️ Initiative",
      text: "XP generation is genuinely slower on this class than most. Dark and Void consumptions are where the bulk of XP comes from, in addition to Losses. Take every opportunity to Consume both when available, and don't skip Loss plays if they also grant XP — they're more valuable than they look."
    },
    {
      category: "🎒 Items",
      text: "Cloak of Invisibility is a slam dunk first item. Poison Dagger is reasonably good here as well party-depending. Stamina Potion and Boots of Striding are usual suspects, though Boots of Striding are a decent bit worse than normal since Teleport doesn't interact with them. Boots of Speed could be nice for Initiative Control once unlocked."
    },
    {
      category: "🎒 Items",
      text: "The Solo Scenario item for this class is described in the guide as incredible — it entirely removes the downside of having 2 or more Void at the end of your turns. Highly recommended to acquire as soon as you meet the requirements to do so. It allows you to play far more recklessly without worrying about balancing Void generation vs. spending."
    },
    {
      category: "📈 Perks",
      text: "The Hollowpact's perks follow its subtheme of upsides and downsides to effects. The option to add -2 Infuse Earth and two +2 Infuse Dark is referential to the Cragheart, and other perks adding -1 Wild and -1 Rolling Curse are reasonable but not always what you want. Recommend the effects that replace the -2 and -1 cards that add Rolling Void and Curse fairly early — solid and add more ways to get the resources your class wants. The ignore negative scenario effects and gain +0 Ward Self perk felt good as well."
    },
  ],
};
