// data-hierophant.js — Human Hierophant (Leaf class)
// Source: Leaf Class Damage Build guide by Luke360 (imgur.com/a/DNYtgkX)
// Card images: github.com/cmlenius/gloomhaven-card-browser (images branch)
// Path pattern: images/character-ability-cards/crimson-scales/HP/cs-{card-slug}.jpeg
// Two-letter code "HI" — verify against cmlenius repo if image 404s

const BASE = "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/HP/";

const HIEROPHANT_DATA = {
  name: "Human Hierophant",
  game: "Crimson Scales",
  symbol: "Leaf",
  startingHP: 6,
  handSize: 11,

  // ── CARDS ──────────────────────────────────────────────────
  // builds: "damage" = damage build, "support" = support build, "both" = both
  cards: [

    // ── PRAYER CARDS (Level P) ───────────────────────────────
    // Given to allies — don't count against the Hierophant's hand size.
    // All have initiative 50. Can be used for basic Attack 2 / Move 2.
    // Cannot be burned to prevent damage (except Lamentation).
    {
      name: "Aspiration",
      level: "P",
      initiative: 50,
      imageUrl: BASE + "cs-aspiration.jpeg",
      tags: ["prayercard"],
      builds: ["both"],
      top: {
        text: "The next two times you would gain a negative condition, perform Heal 4 Self instead.",
        isLoss: false,
      },
      bottom: {
        text: "If this card is discarded for any reason, return it to the Hierophant's supply.",
        isLoss: false,
      },
      commentary: "Strong protection against status-heavy enemies. Both charges mitigate negative conditions into healing — very welcome when facing Poison or Wound-spreading monsters.",
    },

    {
      name: "Devotion",
      level: "P",
      initiative: 50,
      imageUrl: BASE + "cs-devotion.jpeg",
      tags: ["prayercard"],
      builds: ["both"],
      top: {
        text: "On the next two melee attacks targeting you, gain Retaliate 2 for each attack.",
        isLoss: false,
      },
      bottom: {
        text: "The next time you would gain a negative condition, perform Retaliate 1 Self. If this card is discarded for any reason, return it to the Hierophant's supply.",
        isLoss: false,
      },
      commentary: "Good for tanky front-liners who expect to take melee hits. Retaliate 2 twice can deal meaningful damage back, especially at higher difficulties.",
    },

    {
      name: "Grace",
      level: "P",
      initiative: 50,
      imageUrl: BASE + "cs-grace.jpeg",
      tags: ["prayercard"],
      builds: ["both"],
      top: {
        text: "The next time you suffer damage from any source, perform Heal 3 Self.",
        isLoss: false,
      },
      bottom: {
        text: "If this card is discarded for any reason, return it to the Hierophant's supply.",
        isLoss: false,
      },
      commentary: "Simple reactive heal — softens the blow of the next hit. Useful for anyone who expects a big incoming attack.",
    },

    {
      name: "Lamentation",
      level: "P",
      initiative: 50,
      imageUrl: BASE + "cs-lamentation.jpeg",
      tags: ["prayercard"],
      builds: ["both"],
      top: {
        text: "Heal 3 Self.",
        isLoss: false,
      },
      bottom: {
        text: "On any source of damage, you may lose this card and suffer no damage instead. If this card is discarded for any reason, return it to the Hierophant's supply.",
        isLoss: false,
      },
      commentary: "The only Prayer card that can be burned to prevent damage — makes it uniquely valuable. The bottom is a get-out-of-jail-free card that prevents what could otherwise be a devastating hit.",
    },

    {
      name: "Meditation",
      level: "P",
      initiative: 50,
      imageUrl: BASE + "cs-meditation.jpeg",
      tags: ["prayercard"],
      builds: ["both"],
      top: {
        text: "The next time you perform a short rest, you may choose which card is lost.",
        isLoss: false,
      },
      bottom: {
        text: "At the start of your next two turns, you may perform Move 2. If this card is discarded for any reason, return it to the Hierophant's supply.",
        isLoss: false,
      },
      commentary: "Considered the second-strongest Prayer overall. Both halves mitigate the biggest downside of each rest type — top gives short rest control, bottom compensates for the lost turn during long rest. Your party will always be happy to receive this one.",
    },

    {
      name: "Ordination",
      level: "P",
      initiative: 50,
      imageUrl: BASE + "cs-ordination.jpeg",
      tags: ["prayercard"],
      builds: ["both"],
      top: {
        text: "The next two times you draw a positive attack modifier card, treat it as a Shield 1 instead.",
        isLoss: false,
      },
      bottom: {
        text: "At the start of your next two turns, you may perform Move 2. If this card is discarded for any reason, return it to the Hierophant's supply.",
        isLoss: false,
      },
      commentary: "Situationally very useful in scenarios with many rooms or escape objectives, or for movement-deficient allies. Not handed out as often as Meditation but can be exactly what a slow ally needs.",
    },

    {
      name: "Penitence",
      level: "P",
      initiative: 50,
      imageUrl: BASE + "cs-penitence.jpeg",
      tags: ["prayercard"],
      builds: ["both"],
      top: {
        text: "On the next two sources of damage from attacks targeting you, gain Shield 1 for those attacks.",
        isLoss: false,
      },
      bottom: {
        text: "The next two times you draw an attack modifier card, treat it as a Bless instead. If this card is discarded for any reason, return it to the Hierophant's supply.",
        isLoss: false,
      },
      commentary: "On the weaker side, but the top is still useful. The Bless-on-draw effect is a weaker form of advantage — useful at low levels or if the ally's deck has curses, ensuring they land attacks when they really need to.",
    },

    {
      name: "Salvation",
      level: "P",
      initiative: 50,
      imageUrl: BASE + "cs-salvation.jpeg",
      tags: ["prayercard"],
      builds: ["both"],
      top: {
        text: "On the next two sources of damage from attacks targeting you, gain Shield 1 for those attacks.",
        isLoss: false,
      },
      bottom: {
        text: "On any source of damage, you may lose this card and suffer no damage instead. If this card is discarded for any reason, return it to the Hierophant's supply.",
        isLoss: false,
      },
      commentary: "Useful for tanky front-liners. Give this to the character who expects to take the most hits — the damage-prevention bottom is a strong safety net. Handed out several times in playthroughs to front-line allies who appreciated it.",
    },


    // ── LEVEL 1 ────────────────────────────────────────────
    {
      name: "Faith Calling",
      level: "1",
      initiative: 13,
      imageUrl: BASE + "cs-faith-calling.jpeg",
      tags: ["prayer"],
      builds: ["both"],
      top: {
        text: "Shield 1, affect all allies within Range 2. If only one ally affected, give that ally a Prayer card.",
        isLoss: false,
      },
      bottom: {
        text: "Attack 1, Range 3. Add CURSE if the target is adjacent to an ally.",
        isLoss: false,
      },
      commentary: "Core card that stays in hand through level 9. Enhance the bottom with a second Curse as your first enhancement — makes this an attack-1 double-curse bottom if an ally is adjacent to the target. Extremely strong and worth the cost.",
    },

    {
      name: "Harsh Rebuke",
      level: "1",
      initiative: 44,
      imageUrl: BASE + "cs-harsh-rebuke.jpeg",
      tags: [],
      builds: ["damage"],
      top: {
        text: "Attack 3, Range 2. If this attack kills an enemy, give one ally an uncharged Prayer card.",
        isLoss: false,
      },
      bottom: {
        text: "Move 3. +1 Move with Earth. With Light: Move 4, Heal 1, Range 3, Shield 1 Self.",
        isLoss: false,
      },
      commentary: "Initiative 44 is awkward — not fast enough to lead, not late enough to go last. Top good for late-initiative plays after allies soften enemies. The bottom's Light consumption makes it above-par for level 1. Eventually cycles out at higher levels.",
    },

    {
      name: "Impetuous Inquisition",
      level: "1",
      initiative: 28,
      imageUrl: BASE + "cs-impetuous-inquisition.jpeg",
      tags: [],
      builds: ["support"],
      top: {
        text: "DISARM an enemy adjacent to an ally. Add CURSE.",
        isLoss: false,
      },
      bottom: {
        text: "Each enemy that causes an ally to suffer 3+ damage from an attack this round suffers 2 damage after the attack. Earth consume: Retaliate 1, affect all allies.",
        isLoss: false,
      },
      commentary: "Usable at low levels for the top CC, but does no damage. Cycles out at level 4 when Rooted Subjugation arrives. The bottom is just not powerful enough to justify spending a card on it.",
    },

    {
      name: "Inner Reflection",
      level: "1",
      initiative: 53,
      imageUrl: BASE + "cs-inner-reflection.jpeg",
      tags: [],
      builds: ["damage"],
      top: {
        text: "Attack 1, Wound, Pierce 3. Gain 1 XP.",
        isLoss: false,
      },
      bottom: {
        text: "Loot 2. You may give each ally within Range 2 one money token. If you give only one ally a token, give them an additional Prayer card.",
        isLoss: false,
      },
      commentary: "Good attack at level 1 and can be brought as a sideboard at higher levels against high-shield enemies. Pierce 3 becomes very relevant once perks have improved your deck. The terrible initiative is the main downside.",
    },

    {
      name: "Inspired Remedy",
      level: "1",
      initiative: 76,
      imageUrl: BASE + "cs-inspired-remedy.jpeg",
      tags: ["prayer"],
      builds: ["support"],
      top: {
        text: "Heal 3, Range 2. Light consume: Heal 4. If the heal affected an ally at or below half HP, give that ally a Prayer card.",
        isLoss: false,
      },
      bottom: {
        text: "At the end of each of your turns, perform Heal 1 to one adjacent ally (persistent).",
        isLoss: false,
      },
      commentary: "One of the two easiest Prayer triggers at level 1. Flex/sideboard card for the damage build — competes with Uplifting Ascension at mid-levels. Worth enhancing the range on the top.",
    },

    {
      name: "Oak's Embrace",
      level: "1",
      initiative: 84,
      imageUrl: BASE + "cs-oaks-embrace.jpeg",
      tags: [],
      builds: ["support"],
      top: {
        text: "The next two times an ally within Range 3 would suffer damage from an attack, they may suffer half the damage instead (rounded down). Gain 1 XP.",
        isLoss: false,
      },
      bottom: {
        text: "Move 4 adjacent ally. Earth consume: give that ally Retaliate 1.",
        isLoss: false,
      },
      commentary: "Only unconditional Move 4 until level 5. Top is effectively two ward charges — functionally mitigates 3–5 points of damage to allies at level 1. Good power level early but rotates out as better options arrive.",
    },

    {
      name: "Restoring Faith",
      level: "1",
      initiative: 64,
      imageUrl: BASE + "cs-restoring-faith.jpeg",
      tags: ["prayer"],
      builds: ["support"],
      top: {
        text: "Heal 1, remove Poison/Wound from one ally. Then Loot 1 (ranged).",
        isLoss: false,
      },
      bottom: {
        text: "Move 3. One ally may move a character token back one space on any one Prayer card.",
        isLoss: false,
      },
      commentary: "Generally underwhelming for the damage build. Top loot can be a sneaky way to collect coins. Bottom is just a normal Move 3 in practice — the extra text rarely comes up. Not recommended for damage build.",
    },

    {
      name: "Sacred Death",
      level: "1",
      initiative: 81,
      imageUrl: BASE + "cs-sacred-death.jpeg",
      tags: ["burn"],
      builds: ["damage"],
      top: {
        text: "Attack 3, Range 3. If this attack kills an enemy, BLESS an ally within Range 2.",
        isLoss: true,
      },
      bottom: {
        text: "Recover one lost card played this round. Immediately play the bottom action of one discarded card recovered this way.",
        isLoss: false,
      },
      commentary: "Core engine card. The bottom replays burn-card bottoms — Soul Strike, Divine Allegiance, and Vocal Sermon top are all compatible. Pair with Curious Pendant (campaign item) for a third use. Worth keeping in hand all the way to level 9.",
    },

    {
      name: "Soul Strike",
      level: "1",
      initiative: 69,
      imageUrl: BASE + "cs-soul-strike.jpeg",
      tags: ["burn"],
      builds: ["damage"],
      top: {
        text: "Attack 4, Range 3, Pierce 3, Wound.",
        isLoss: true,
      },
      bottom: {
        text: "Move 3, Heal 1. Affect all allies moved through with the Move ability.",
        isLoss: false,
      },
      commentary: "Core burn. Feeds Sacred Death bottom — first top burn ability you get access to. Pierce 3 combined with perks scales well at higher levels. Playing it twice via Sacred Death makes it very impactful, and with Curious Pendant you can get a third use. Stays in hand through level 9.",
    },


    {
      name: "Standing Ground",
      level: "1",
      initiative: 22,
      imageUrl: BASE + "cs-standing-ground.jpeg",
      tags: [],
      builds: ["damage"],
      top: {
        text: "Shield 2, affect one adjacent ally. Earth infuse. This Shield ability is unaffected by negative scenario effects.",
        isLoss: false,
      },
      bottom: {
        text: "Attack 2, target one enemy at any range that is adjacent to an ally. Earth consume: Shield 1 to an ally adjacent to the target.",
        isLoss: false,
      },
      commentary: "Strong initiative. Bottom ranged attack has technically infinite range as long as an ally is next to an enemy — very reliable. Used frequently at low levels mostly for the bottom or the initiative. Swapped out at higher levels once better options arrive.",
    },


    {
      name: "Vocal Sermon",
      level: "1",
      initiative: 32,
      imageUrl: BASE + "cs-vocal-sermon.jpeg",
      tags: ["burn", "prayer"],
      builds: ["both"],
      top: {
        text: "You and all allies within Range 3 may each recover one discarded card. Infuse Earth and Light. Gain 1 XP.",
        isLoss: true,
      },
      bottom: {
        text: "Move 3, Jump. Give one ally moved through with this action a Prayer card.",
        isLoss: false,
      },
      commentary: "Both halves are good. Top is the second compatible burn for Sacred Death — like a team stamina potion, but less strong at lower player counts. Bottom is probably the best move ability and the easiest way to give out a Prayer. Cycles to flex spot after Spiritual Gains, but keep if stamina is an issue.",
    },

    // ── LEVEL X ─────────────────────────────────────────────
    {
      name: "Prosperous Concord",
      level: "X",
      initiative: 43,
      imageUrl: BASE + "cs-prosperous-concord.jpeg",
      tags: [],
      builds: ["damage"],
      top: {
        text: "Heal 3, Range 2. Light consume: Heal 4. If you affect an ally, you may deduct −2 Heal to add STRENGTHEN instead. Infuse Light.",
        isLoss: false,
      },
      bottom: {
        text: "Remove all negative conditions from one ally within Range 3. The affected ally may then perform Heal X Self, where X equals the number of conditions removed.",
        isLoss: false,
      },
      commentary: "Strong X card. Top is functionally an attack-4 range-3 infuse-Light when you're boosting an ally who will attack. Only caveat: requires an ally to go after you, so pair with a faster card. Bottom is also strong — you can tailor to what the ally needs. Consumed Light gives Heal 3 + Strengthen. Enhanced range to 2 with 30 gold makes it much easier to use.",
    },

    {
      name: "Soulful Salvation",
      level: "X",
      initiative: 11,
      imageUrl: BASE + "cs-soulful-salvation.jpeg",
      tags: ["burn"],
      builds: ["support"],
      top: {
        text: "Heal 3, Bless all allies adjacent to the hex where the enemy was killed, then discard this card.",
        isLoss: true,
      },
      bottom: {
        text: "On the next source of damage that would reduce a character ally to less than 1 HP, the ally suffers no damage instead and either performs Heal 5 Self or recovers one lost card.",
        isLoss: false,
      },
      commentary: "Not damage-build focused. Top requires a lot of coordination and is best in 4P. Bottom is strong in hunker-down scenarios but this situation doesn't come up every scenario. Only took it once in a survive-for-X-turns scenario.",
    },

    {
      name: "Unruly Repentance",
      level: "X",
      initiative: 25,
      imageUrl: BASE + "cs-unruly-repentance.jpeg",
      tags: ["burn"],
      builds: ["damage"],
      top: {
        text: "Add 2 CURSE cards to the enemy modifier deck. The next time a normal or elite enemy draws a CURSE, that enemy suffers 10 damage after the attack. Then lose this card.",
        isLoss: true,
      },
      bottom: {
        text: "Remove all negative conditions from one ally within Range 3. The affected ally may then perform Heal X Self, where X equals the number of conditions removed.",
        isLoss: false,
      },
      commentary: "Flex/sideboard card. Extremely strong once 3–5 curses are already in the enemy deck via perks and items — triggers very quickly. If scenarios have low-HP enemies like Imps, leave it at home. Bottom is situationally useful against status-heavy monsters. Cannot be recovered by Sacred Death since it goes to active area.",
    },

    // ── LEVEL 2 ─────────────────────────────────────────────
    {
      name: "Divine Allegiance",
      level: "2",
      initiative: 63,
      imageUrl: BASE + "cs-divine-allegiance.jpeg",
      tags: ["burn", "aoe"],
      builds: ["damage"],
      top: {
        text: "Attack 4, Range 3, target enemies in a hex pattern. Suffer 1 true damage per enemy targeted. Gain 1 XP per enemy targeted.",
        isLoss: true,
      },
      bottom: {
        text: "Move 3. Bless one ally moved through with this action.",
        isLoss: false,
      },
      commentary: "Recommended level 2 pick for damage build. Top is the third compatible burn for Sacred Death — multi-target, high damage, XP. Bottom is spammable while waiting to line up the hex pattern. Pushes Vocal Sermon to a flex spot. Enhance top with Curse eventually for massive damage.",
    },

    {
      name: "Weakened Will",
      level: "2",
      initiative: 17,
      imageUrl: BASE + "cs-weakened-will.jpeg",
      tags: [],
      builds: ["support"],
      top: {
        text: "Attack 2, Range 3, Muddle. STRENGTHEN one ally adjacent to the target.",
        isLoss: false,
      },
      bottom: {
        text: "Move 1. All attacks targeting allies gain Disadvantage this round.",
        isLoss: false,
      },
      commentary: "Good choice for a more support-leaning build. Great initiative. Top's Muddle becomes much stronger once curses are in the enemy deck. Bottom is a tiny move but the Disadvantage effect is very strong. Could go back for this at a higher level if damage build wants more support options.",
    },

    // ── LEVEL 3 ─────────────────────────────────────────────
    {
      name: "Encouraged Conviction",
      level: "3",
      initiative: 14,
      imageUrl: BASE + "cs-encouraged-conviction.jpeg",
      tags: ["prayer"],
      builds: ["support"],
      top: {
        text: "Heal 2, affect one ally within Range 3. The affected ally gains Shield 1, Retaliate 1, Range 3. Infuse Light.",
        isLoss: false,
      },
      bottom: {
        text: "One ally within Range 3 with a 'Prayer' ability card in their hand may immediately play the top or bottom action of that card. If they do, gain XP. If they play the bottom action, give the ally one 'Prayer' ability card.",
        isLoss: false,
      },
      commentary: "An excellent support card with an outstanding initiative of 14 — tied for the fastest on the class. The top gives an ally a modest heal plus Shield 1 and Retaliate 1 Range 3, a nice defensive bundle that infuses Light as a bonus. The bottom is uniquely synergistic with the Prayer system — it lets an ally immediately cash in a Prayer card and, if they use the bottom action, you immediately replace it with another Prayer, keeping the chain going. A strong pick for support-focused builds that want to maximise Prayer utility.",
    },

    {
      name: "Vital Bond",
      level: "3",
      initiative: 48,
      imageUrl: BASE + "cs-vital-bond.jpeg",
      tags: ["burn"],
      builds: ["damage"],
      top: {
        text: "Attack 2, Range 4. If you targeted two enemies, you may swap their positions. If you do, both targets gain Muddle.",
        isLoss: false,
      },
      bottom: {
        text: "Recover one lost card and up to two of their discarded cards for one ally. Infuse Earth.",
        isLoss: true,
      },
      commentary: "Top is attack-2 but the swap + Muddle can be situationally powerful — especially with curses in the enemy deck. Bottom is very strong for ally recovery but cannot be paired with Sacred Death. Decent choice at level 3, particularly if allies have powerful burn cards.",
    },

    // ── LEVEL 4 ─────────────────────────────────────────────
    {
      name: "Beacon of Hope",
      level: "4",
      initiative: 82,
      imageUrl: BASE + "cs-beacon-of-hope.jpeg",
      tags: [],
      builds: ["support"],
      top: {
        text: "Heal 3, Range 3. Infuse Light. Attack 2 targeting one enemy adjacent to the figure affected by the Heal ability.",
        isLoss: false,
      },
      bottom: {
        text: "BLESS and BLESS, Range 3. The next time an ally draws a BLESS, the ally may perform 'Heal 6, Self', then lose this card.",
        isLoss: true,
      },
      commentary: "A lovely support card. The top pairs Heal 3 Range 3 with a free Attack 2 on any enemy adjacent to your healed ally — punishing enemies in melee with your party — and infuses Light as a bonus. The bottom double-Bless at Range 3 with a conditional Heal 6 payoff is a strong Loss for a tanky ally who will draw a Bless soon — essentially pre-loading a massive emergency heal. Good alternative to Rooted Subjugation if your party needs more support tools at level 4.",
    },

    {
      name: "Rooted Subjugation",
      level: "4",
      initiative: 30,
      imageUrl: BASE + "cs-rooted-subjugation.jpeg",
      tags: [],
      builds: ["damage"],
      top: {
        text: "Attack 3, Range 3, Pierce 3. Infuse Earth. Bonus effect if target is adjacent to a summoned ally.",
        isLoss: false,
      },
      bottom: {
        text: "Move 3. Retaliate 1, Range 2, affect one adjacent ally.",
        isLoss: false,
      },
      commentary: "Core card from level 4 onward. Pierce 3 + perks deals excellent damage. The huge pierce means adding +1 to the attack would be more impactful at high difficulties. Pushes Impetuous Inquisition out of the hand. Good bottom as a Move 3 carrier.",
    },

    // ── LEVEL 5 ─────────────────────────────────────────────
    {
      name: "Devout Assistance",
      level: "5",
      initiative: 37,
      imageUrl: BASE + "cs-devout-assistance.jpeg",
      tags: [],
      builds: ["support"],
      top: {
        text: "Persistent: at the start of each of your turns, you may consume one element to perform one ability: Shield 1 to one ally within Range 3, or Heal 1 to one ally within Range 3.",
        isLoss: false,
      },
      bottom: {
        text: "Move 5. If you end this movement adjacent to at least one enemy, generate Earth. If adjacent to at least one ally, generate Light.",
        isLoss: false,
      },
      commentary: "Level 5 is a game changer. The top persistent is great for support builds — lets you use extra elements you generate but don't need for other abilities. The Move 5 bottom almost always generates an element and often two. Not taken for the damage build, which picks Spiritual Gains instead.",
    },

    {
      name: "Spiritual Gains",
      level: "5",
      initiative: 94,
      imageUrl: BASE + "cs-spiritual-gains.jpeg",
      tags: ["burn"],
      builds: ["damage"],
      top: {
        text: "Persistent: whenever you perform a burn action, place one character token on this card. Each time you perform a Long Rest, you may remove one token from this card to skip losing a card during that rest.",
        isLoss: false,
      },
      bottom: {
        text: "The next time you end your turn with 2 or fewer cards in hand: recover all discarded cards, refresh all spent items, perform Heal 5 + INVISIBLE, Self. Then lose this card.",
        isLoss: false,
      },
      commentary: "ENGINE. Play on turn 1 every scenario. Changes the entire game — you can play burn cards without losing stamina as long as you Long Rest. Stockpile tokens across multiple burns in a cycle. From this point, routinely burn 5–6 cards per scenario. Also feeds Bringer of Miracles bottom at level 9 immediately for one free token.",
    },

    // ── LEVEL 6 ─────────────────────────────────────────────
    {
      name: "Chains of Light",
      level: "6",
      initiative: 31,
      imageUrl: BASE + "cs-chains-of-light.jpeg",
      tags: [],
      builds: ["damage"],
      top: {
        text: "Melee attack targeting all adjacent enemies. Pull each target 1 hex toward you. Light consume: STUN one adjacent enemy.",
        isLoss: false,
      },
      bottom: {
        text: "Move 3. Push one adjacent enemy 3 hexes. If the enemy ends adjacent to an ally, that enemy gains IMMOBILIZE.",
        isLoss: false,
      },
      commentary: "Recommended level 6 pick for damage build over Unstoppable Force. Effectively Attack 6+ with stun when consuming Light — very solid given how good your attack deck is by this point. Coordinate with allies so you don't absorb all room attacks — your low HP is a real concern here. Only melee attack on this character.",
    },

    {
      name: "Unstoppable Force",
      level: "6",
      initiative: 21,
      imageUrl: BASE + "cs-unstoppable-force.jpeg",
      tags: ["burn"],
      builds: ["support"],
      top: {
        text: "The next five attacks targeting you or an adjacent ally this round gain Shield X (where X is the shown value). Infuse Earth.",
        isLoss: true,
      },
      bottom: {
        text: "Attack 2, Range 4, Wound if the target is adjacent to an ally. Earth consume: Shield 2 to an ally adjacent to the target.",
        isLoss: false,
      },
      commentary: "Best initiative on any Hierophant card — 15. Strong damage mitigation top. Good bottom ranged attack at Range 4. In retrospect, guide author wishes they had taken Chains of Light for the damage build. Still reasonable if you want to stay safely ranged — just a bit low-powered at level 6.",
    },

    // ── LEVEL 7 ─────────────────────────────────────────────
    {
      name: "Revered Protector",
      level: "7",
      initiative: 15,
      imageUrl: BASE + "cs-revered-protector.jpeg",
      tags: [],
      builds: ["both"],
      top: {
        text: "On the next five attacks targeting you or an adjacent ally this round, gain Shield X. This Shield ability is unaffected by negative scenario effects.",
        isLoss: false,
      },
      bottom: {
        text: "Move 4, Jump. Remove one negative condition from each ally moved through.",
        isLoss: false,
      },
      commentary: "Recommended level 7 pick if Faith Calling was enhanced with the extra Curse. Best non-burn initiative card on this character (tied with Unstoppable Force at 15). Top is strong mitigation that also applies to you — your only shield card that does this. Bottom Move 4 Jump is excellent at initiative 15.",
    },

    {
      name: "Symphony of Oppression",
      level: "7",
      initiative: 86,
      imageUrl: BASE + "cs-symphony-of-oppression.jpeg",
      tags: ["burn"],
      builds: ["support"],
      top: {
        text: "Two allies within Range 3 may perform Attack 3, targeting the same enemy within Range 3. If only one ally is affected, add +1 Attack and give that ally a Prayer card.",
        isLoss: false,
      },
      bottom: {
        text: "All allies increase the value of each of their Retaliate and Shield abilities by 1 this round.",
        isLoss: true,
      },
      commentary: "Top requires specific positioning — allies and enemy all within range 3 of you and each other. Bottom burn is weak at level 7 and the initiative 86 is terrible for it. Not recommended for either build. Revered Protector is the stronger pick here.",
    },

    // ── LEVEL 8 ─────────────────────────────────────────────
    {
      name: "Righteous Atonement",
      level: "8",
      initiative: 20,
      imageUrl: BASE + "cs-righteous-atonement.jpeg",
      tags: [],
      builds: ["support"],
      top: {
        text: "Any one ally may suffer up to 5 damage during their turn to add +X Attack to their next single-target attack this round, where X is the amount of damage suffered. Then discard this card.",
        isLoss: false,
      },
      bottom: {
        text: "Recover one lost card for all allies within Range 3 played this round. If only one ally recovers a card this way, give that ally a Prayer card. Infuse Earth and Light.",
        isLoss: false,
      },
      commentary: "Top maxes out at 5 and only works on single-target attacks — too many conditions. Bottom is powerful in 4P when allies have impactful burn cards that resolve this round. Underwhelming for damage build. Consider if you don't have enough burn cards to charge Spiritual Gains.",
    },

    {
      name: "Vengeful Veneration",
      level: "8",
      initiative: 78,
      imageUrl: BASE + "cs-vengeful-veneration.jpeg",
      tags: [],
      builds: ["damage"],
      top: {
        text: "Attack 4, Range 4. Place your character token on the target of the attack. The next time this enemy targets an ally with an attack this round, it suffers 2 damage after the attack. Then discard this card.",
        isLoss: false,
      },
      bottom: {
        text: "Move 3. All adjacent enemies suffer 1 damage. If only one enemy would suffer damage this way, it suffers 2 damage instead.",
        isLoss: false,
      },
      commentary: "Effective Attack 6 at Range 4 when the marked enemy attacks an ally — which is most of the time. Replaces Rooted Subjugation as primary damage card. Keep Rooted for high-shield enemies as a flex swap. Both Unruly Repentance and Soul Strike become flex cards at this point.",
    },

    // ── LEVEL 9 ─────────────────────────────────────────────
    {
      name: "Bringer of Miracles",
      level: "9",
      initiative: 36,
      imageUrl: BASE + "cs-bringer-of-miracles.jpeg",
      tags: ["burn"],
      builds: ["damage"],
      top: {
        text: "Heal 3, Range 3, STRENGTHEN. Light consume: the target of this Heal ability considers any attack against them this round a miss instead and performs Heal 5 Self after the attack.",
        isLoss: false,
      },
      bottom: {
        text: "Remove all BLESS cards from your attack modifier deck and perform BLESS Self. You are now immune to BLESS and gain Advantage on all attacks. If you draw a BLESS, place it in your discard pile and shuffle it back into your deck at the end of the round.",
        isLoss: true,
      },
      commentary: "The endgame payoff. Best initiative on the character. Play turn 1 alongside Spiritual Gains (earns you one free token immediately). Bottom gives permanent Advantage plus a permanent ×2 that reshuffles each round rather than consuming the deck. With perks completed, all attacks are consistently +1 to +3 baseline with ~10% crit. One of the strongest effects in the game.",
    },

    {
      name: "Expansive Permanence",
      level: "9",
      initiative: 9,
      imageUrl: BASE + "cs-expansive-permanence.jpeg",
      tags: ["burn"],
      builds: ["support"],
      top: {
        text: "Shield 2 (Earth consume: +1 Shield and IMMOBILIZE), affect self or one ally within Range 3. The figure affected by this Shield action may target any enemy with their single-target attacks this round, regardless of range.",
        isLoss: false,
      },
      bottom: {
        text: "All allies add +2 Attack to all their attacks this round. All enemies deduct −2 Attack from all their attacks this round.",
        isLoss: true,
      },
      commentary: "The support build's level 9 capstone. Top Shield 3 with Immobilize at initiative 10 is very strong. Bottom is a massive swing in 4P — but significantly weaker in 2P. Damage build takes Bringer of Miracles instead.",
    },

    // ── LEVEL M (Milestone) ──────────────────────────────────
    {
      name: "Uplifting Ascension",
      level: "M",
      initiative: 80,
      imageUrl: BASE + "cs-uplifting-ascension.jpeg",
      tags: ["prayer"],
      builds: ["both"],
      top: {
        text: "Heal 3, Range 3. Place your character token on the figure affected by the Heal. That figure gains Flying while this card is active. The next time the figure suffers any damage, remove the token.",
        isLoss: false,
      },
      bottom: {
        text: "Go Invisible, affect self or one adjacent ally. Range +2 with Earth. Heal 1 with Light. If you affected an ally, give that ally a Prayer card.",
        isLoss: false,
      },
      commentary: "Milestone reward card — competes with Inspired Remedy. Top heal's Flying bonus can be great for escaping terrain or reaching chests; otherwise mostly ignorable. Bottom is strong on its own for invisibility but becomes significantly better consuming Earth — main Earth consumer mid-game. Range enhancement is a good investment.",
    },
  ],

  // ── PERKS ──────────────────────────────────────────────────
  perks: [
    { count: 2, text: "Remove two −1 cards" },
    { count: 2, text: "Replace one +1 card with one +0 CURSE card" },
    { count: 1, text: "Replace two +0 cards with one rolling Light card and one rolling Earth card" },
    { count: 1, text: "Replace two +0 cards with two rolling Light cards" },
    { count: 1, text: "Ignore negative scenario effects and remove one +0 card" },
    { count: 2, text: "Replace one +1 card with one +3 card" },
    { count: 1, text: "At the start of each scenario, gain one BLESS card" },
    { count: 1, text: "Replace one −2 card with one 'give one ally a Prayer ability card' and one +0 card" },
    { count: 1, text: "Replace one +0 card with one +1 Shield 1 Ally card" },
    { count: 2, text: "Add one +1 WOUND and MUDDLE card" },
    { count: 2, text: "Add two rolling Heal 1 Self or Ally cards" },
  ],

  // ── TIPS ───────────────────────────────────────────────────
  tips: [
    {
      category: "🔥 Burn Economy",
      text: "Play Spiritual Gains on turn 1 of every scenario. Each burn card you play earns a token. On Long Rest, spend a token instead of losing a card — this lets you burn 5–6 cards per scenario with minimal stamina cost.",
    },
    {
      category: "🔥 Burn Economy",
      text: "Sacred Death bottom is your primary engine. Soul Strike, Divine Allegiance, and Vocal Sermon top are the three level-1 burns that resolve during your current turn and can be replayed via Sacred Death. Plan your hand around always having one available.",
    },
    {
      category: "🔥 Burn Economy",
      text: "Curious Pendant (a Crimson Scales campaign item reward) lets you recover a lost card during your turn. Combined with Sacred Death, you can use a burn card three times in a scenario. Claim this item over teammates — it is crucial to this build.",
    },
    {
      category: "🪄 Element & Positioning",
      text: "Play right behind your melee allies. Many of your attacks require adjacency conditions or have short range. Being in the second row maximizes attack eligibility, Prayer delivery, and positioning for Chains of Light at level 6.",
    },
    {
      category: "🪄 Element & Positioning",
      text: "Light is your most important element. Prosperous Concord is your only non-burn Light source — keep it in hand until you have another reliable repeatable method of generating Light.",
    },
    {
      category: "💀 Curse Strategy",
      text: "Build toward heavy cursing of the enemy modifier deck. After perks, Unruly Repentance, and orb items, you can have 5–8 curses in the deck. At that density, Muddle becomes extremely punishing and Unruly Repentance's 10-damage payoff triggers very quickly.",
    },
    {
      category: "💀 Curse Strategy",
      text: "Prioritize: Orb of Despair (3 curse charges) and either Orb of Confusion or Sphere of Currents (add Muddle). Once you have these plus your perk curses, most enemy modifier draws will be negatives.",
    },
    {
      category: "📿 Prayer Cards",
      text: "Prayers give allies extra stamina and initiative options. All have Initiative 50 — teammates won't use them for initiative, but they add a card to hand and can be used for basic Attack 2/Move 2. Meditation is considered the second-strongest Prayer overall.",
    },
    {
      category: "📿 Prayer Cards",
      text: "You don't need to maximize Prayer output for this build, but your teammates will always appreciate them. Give Salvation to tanky front-liners and Meditation to characters who do frequent rests.",
    },
    {
      category: "⬆️ Leveling",
      text: "The build hits two major power spikes: Level 5 (Spiritual Gains) and Level 9 (Bringer of Miracles). Level 5 radically changes how you manage stamina. Level 9 gives permanent Advantage and a permanent ×2 in your deck — your attack damage jumps 20–50% overnight.",
    },
    {
      category: "⬆️ Leveling",
      text: "First enhancement: add Curse to Faith Calling's bottom attack. This is the most impactful early investment — makes it a repeatable attack-1 double-curse and it stays in your hand through level 9.",
    },
    {
      category: "⬆️ Leveling",
      text: "Initiative is a persistent weakness — many core cards sit in the 40–70 range. Initiative boots are a strong item choice. Pair slow-initiative burn cards with a faster second card to control your action timing.",
    },
    {
      category: "⚔️ High Levels",
      text: "At level 9, play Spiritual Gains and Bringer of Miracles on turn 1. This immediately earns one Spiritual Gains token (the burn) and gives you permanent Advantage for the rest of the scenario. You effectively become a 9-card class for the rest of the game.",
    },
    {
      category: "⚔️ High Levels",
      text: "Robes of Evocation is the best chest item for this build — adds +1 Attack to your entire attack action. If not yet unlocked, Cloak of Pockets is a strong alternative (extra item slots for orbs).",
    },
  ],

  // ── MILESTONE ──────────────────────────────────────────────
  milestone: {
    imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/milestones/cs-ms-hierophant.jpeg",
    commentary: "Give an ally one 'Prayer' ability card and experience them playing it 10 times. Each time an ally plays a Prayer card you gave them, mark a checkmark. Reach 10 checkmarks to permanently add <strong>Uplifting Ascension</strong> to your supply — it does not count against your hand size.",
    reward: "Permanently add <strong>Uplifting Ascension</strong> (Level M card) to your supply. It provides a Heal 3 / Invisibility card with Prayer delivery on the bottom and Flying on the top — versatile utility that complements both the damage and support builds.",
  },
};
