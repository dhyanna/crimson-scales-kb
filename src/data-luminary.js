// data-luminary.js — Luminary (Crescent Sun) class data for Crimson Scales Knowledge Base

const LUMINARY_DATA = {
  id: "luminary",
  name: "Lurker Luminary",
  symbol: "Crescent Sun",
  game: "Crimson Scales",
  startingHP: 10,
  handSize: 11,
  builds: ["bruiser", "support"],

  milestone: {
    xws: "luminarymilestone",
    points: 10,
    imageUrl: "https://raw.githubusercontent.com/any2cards/worldhaven/master/images/milestones/crimson-scales/cs-ms-luminary-front.png",
    reward: "Drawn into the Light — a Level M ability card added to your hand permanently once the milestone is complete.",
    commentary: "Goal: Consume an element to perform a Glow action 10 times."
  },

  cards: [
    {
      id: "burning-sparks",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/LU/cs-burning-sparks.jpeg",
      name: "Burning Sparks",
      level: "1", initiative: 33, cardNum: 213,
      tags: ["aoe", "loss"], builds: ["bruiser"],
      top: { text: "Attack 1 · PIERCE 1 · AoE hex pattern (3 hexes) · Fire consumption: +1 Attack · Light consumption: +1 Attack · XP", isLoss: false },
      bottom: { text: "Attack 2 · Move 1", isLoss: false },
      commentary: "Burning Sparks doesn't showcase either class mechanic but is a solid Level 1 action. The Top AoE Attack 1 Pierce 1 varies widely in effectiveness — mediocre without Fire or Light, but reasonable when you can line up an element. Expect it to average Attack 2 Pierce 1 most of the time, which is fine but nothing special. The Initiative at 33 is middling. The Bottom Attack 2 Move 1 is the real reason this card stayed in hand through Level 4 — flexible, scales well with perks, and the Move 1 lets you reposition or chase a kill. A solid workhorse card despite its unassuming appearance."
    },
    {
      id: "chilling-wave",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/LU/cs-chilling-wave.jpeg",
      name: "Chilling Wave",
      level: "1", initiative: 39, cardNum: 214,
      tags: ["scuttle", "loss", "aoe"], builds: ["bruiser"],
      top: { text: "Attack 3 · Dark consumption: STUN · AoE hex pattern · You may Move 1 into any depicted black hex; if you do, generate Ice.", isLoss: false },
      bottom: { text: "Add STUN to your next Glow ability this round. Perform a Glow ability without consuming an element. 2 XP", isLoss: true },
      commentary: "A card that arguably wouldn't exist in Frosthaven balancing — Attack 3 Stun on Dark consumption is a fantastic deal, and Dark ends up being your best element overall so this is far from difficult to line up. The free Ice generation from Scuttling is a nice bonus when Dark isn't available. Initiative 39 is poor for a Stun, but Stuns don't care much when they happen — a stunned monster is still locked down next turn if it survives. The Bottom is niche — a temporary free Glow activation — and was used only once in testing. Always prioritise the Top."
    },
    {
      id: "flickering-lights",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/LU/cs-flickering-lights.jpeg",
      name: "Flickering Lights",
      level: "1", initiative: 19, cardNum: 215,
      tags: ["scuttle", "loss", "aoe"], builds: ["both"],
      top: { text: "Attack 3 · AoE hex pattern (5 hexes) · If a target occupies the hex, generate the element shown · You may Move 1 into any depicted black hex; if you do, generate Light · 2 XP", isLoss: true },
      bottom: { text: "Heal 2 Self · Loot 1 · If you loot two or more money tokens with this ability, generate Wild Element.", isLoss: false },
      commentary: "A quiet powerhouse. The Top Loss generates up to 4 elements while attacking 3 targets — at low levels you likely use 2 elements per turn, but this powers up your next turn significantly. The 2 XP sweetens the deal. Initiative 19 is one of your fastest and pairs well with Chilling Wave to Stun a key target early. The Bottom Heal 2 Self Loot 1 with Wild Element rider is one of the best Level 1/X Loot actions around — this class needs money for enhancements and items, so healing while looting and generating an element is tremendous value. Always happy to have this in hand."
    },
    {
      id: "frosty-glimmer",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/LU/cs-frosty-glimmer.jpeg",
      name: "Frosty Glimmer",
      level: "1", initiative: 55, cardNum: 216,
      tags: [], builds: ["support"],
      top: { text: "Heal 2, Range 3. XP. Dark consumption: Target 2. Ice consumption: +1 Heal, +1 Range.", isLoss: false },
      bottom: { text: "Move 3 · Dark consumption: +1 Move, Jump · Fire consumption: Ignore all traps and disarm one trap moved through", isLoss: false },
      commentary: "A solid support card that scales well with element consumption. The baseline Heal 2 Range 3 is below par, but Dark doubles the targets for an effective 6 healing at Range 4 — excellent when it comes together. Ice adds +1 Heal and +1 Range for a nice secondary option. Initiative 55 is awkward for a Heal — you may not know if your allies are still in range — making this easier to cut as you level. The Bottom Move 3 with Dark Jump is fantastic; the Fire disarm is situationally useful in Crimson Scales. A good, solid card that makes the cut often."
    },
    {
      id: "heat-waves",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/LU/cs-heat-waves.jpeg",
      name: "Heat Waves",
      level: "1", initiative: 73, cardNum: 217,
      tags: ["glow", "aoe"], builds: ["support"],
      top: { text: "Glow — During your turn: Fire consumption: WOUND · AoE hex pattern (3 hexes) · XP · Generate Light · when another Glow is played, discard this card.", isLoss: false },
      bottom: { text: "Move 2 · Generate Ice", isLoss: false },
      commentary: "Your first actual Glow. All low level Glows produce a different element when placed into Active Area, so sometimes you play this purely for the Light generation. Heat Waves is one of the better Level 1 Glows — Fire Wound AoE is good with one target, great with two, and excellent with three. Fire competes with your other offensive elements, and the monsters aren't always in the right pattern, but Wound always shines against low-health targets like Forest Imps. Glows work best on Turn 1 or between rooms — taking a turn 'off' mid-combat to activate one is often awkward. Initiative 73 is unexciting; generally prefer to lead with faster cards."
    },
    {
      id: "moonbeam",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/LU/cs-moonbeam.jpeg",
      name: "Moonbeam",
      level: "1", initiative: 85, cardNum: 218,
      tags: ["glow", "aoe"], builds: ["support"],
      top: { text: "Glow — During your turn: Dark consumption: CURSE · AoE hex pattern (2 hexes) · XP · Generate Ice · when another Glow is played, discard this card.", isLoss: false },
      bottom: { text: "Move 2 · Generate Fire", isLoss: false },
      commentary: "Moonbeam follows the pattern of Glows that want Dark consumption, which puts it in competition with your other Dark needs. The Curse AoE is fine — hitting two targets about half the time — but feels awkward compared to the Stun and Immobilize on other cards. The real reason to play this is the Bottom: Move 2 Infuse Fire was consistently necessary to make this class's AoE cards work. Initiative 85 is a welcome late number. The Bottom Move 2 Infuse Fire was regularly the most useful action available, making this a card you'll often play purely for the Bottom while hoping for a Curse opportunity."
    },
    {
      id: "radiant-glare",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/LU/cs-radiant-glare.jpeg",
      name: "Radiant Glare",
      level: "1", initiative: 36, cardNum: 219,
      tags: ["glow", "aoe"], builds: ["both"],
      top: { text: "Glow — During your turn: Light consumption: IMMOBILIZE · AoE hex pattern (3 hexes) · XP · Generate Fire · when another Glow is played, discard this card.", isLoss: false },
      bottom: { text: "Move 2 · Generate Dark", isLoss: false },
      commentary: "The second best Top Glow combined with the best Bottom Move 2 Infuse — always want this in your opening hand. The Glow Immobilizes on Light, can hit 2 targets fairly easily, and generates Fire on discard. The real star is the Bottom Dark Infusion — Dark is consistently your best element for nearly everything on this class. Initiative 36 is fine. Default to playing the Bottom every rest cycle and look for opportunities to activate the Glow when Light and a good AoE line up. This card was never cut. A cornerstone of both builds."
    },
    {
      id: "shimmering-scuttle",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/LU/cs-shimmering-scuttle.jpeg",
      name: "Shimmering Scuttle",
      level: "1", initiative: 21, cardNum: 220,
      tags: ["scuttle", "aoe"], builds: ["bruiser"],
      top: { text: "Attack 2 · AoE hex pattern (4 hexes) · Light consumption: +1 Attack, XP · You may Move 2 into any depicted black hex; if you do, generate Fire.", isLoss: false },
      bottom: { text: "Add MUDDLE to all Glow abilities targeting enemies this round. (Active) · Move 2", isLoss: false },
      commentary: "A solid role-player at lower levels. The Top 4-hex AoE Scuttle averages roughly Attack 3-4 with Fire generation — harder to hit two targets than it appears due to the claw pattern, but deceptively powerful in the right position. Initiative 21 is one of your faster cards and often reason enough to include it. The Bottom Muddle-to-Glow-abilities is a minor upgrade to a Move 2 that came up occasionally but was rarely actively sought. Expect to use this mostly for the Top attack and Initiative."
    },
    {
      id: "soft-glow",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/LU/cs-soft-glow.jpeg",
      name: "Soft Glow",
      level: "1", initiative: 24, cardNum: 221,
      tags: ["glow", "aoe"], builds: ["support"],
      top: { text: "Glow — During your turn: Ice consumption: STRENGTHEN all allies in the depicted area · AoE hex pattern (4 hexes) · XP · Generate Dark · when another Glow is played, discard this card.", isLoss: false },
      bottom: { text: "Move 2 · Generate Light", isLoss: false },
      commentary: "The last of the four Glow Top / Move 2 Infuse cycle cards at Level 1. Good for both builds — the Bruiser benefits from Strengthen on key turns, while the Support player uses this to generate Dark for multi-target Heals. Playing this alongside Radiant Glare Bottom each rest cycle provides two consistent Dark sources, which was very effective. Initiative 24 is appreciated. The Bottom Light Infusion is strictly useful for Frosty Glimmer and other Light consumers. A solid card that stays in the hand for a long time despite being on the verge of being cut in several scenarios."
    },
    {
      id: "torrid-radiation",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/LU/cs-torrid-radiation.jpeg",
      name: "Torrid Radiation",
      level: "1", initiative: 76, cardNum: 222,
      tags: ["scuttle", "aoe"], builds: ["bruiser"],
      top: { text: "Attack 3 · PIERCE 1 · AoE hex pattern (2 hexes) · Fire consumption: Target suffers 1 damage · You may Move 1 into any depicted black hex; if you do, generate Dark.", isLoss: false },
      bottom: { text: "Move 3 · All adjacent enemies suffer 1 damage. For each enemy that suffered damage, generate Wild Element. 2 XP", isLoss: true },
      commentary: "A card that one guide author enjoyed but the other avoided. The Top Attack 3 Pierce 1 always felt good, and Scuttling for Dark generation was fantastic — though the 2-hex AoE pattern was awkward and the Scuttle space was often occupied. Fire consumption adds true damage, which almost always overperforms. Initiative 76 is mediocre. The Bottom Move 3 true damage to all adjacent enemies with Wild Element generation per hit is good, but competing with the Top means you rarely get to use it. A reasonable card that rewards patient positioning."
    },
    {
      id: "violent-flash",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/LU/cs-violent-flash.jpeg",
      name: "Violent Flash",
      level: "X", initiative: 40, cardNum: 223,
      tags: ["aoe", "loss"], builds: ["bruiser"],
      top: { text: "Attack 3 · AoE hex pattern (4 hexes) · If a target occupies the hex, generate the element shown (Ice, Fire, Light, Dark, Wild) · 2 XP (Loss)", isLoss: true },
      bottom: { text: "Move 2 · Move 2", isLoss: false },
      commentary: "The Luminary's Loss Attacks are often better and more consistent than the non-Loss ones when you have the right elements. Violent Flash hits 3 enemies comfortably and generates a useful suite of elements — play it when your element generation is hampered, Hex Arrays aren't lining up, or you need a reliable last-room payoff. Not a Loss you always look to play, but valuable when things aren't clicking. Initiative 40 is poor — avoid using this as your leading card. The Bottom double Move 2 is a flavor homerun and critically important for a class that can struggle with movement."
    },
    {
      id: "solid-light",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/LU/cs-solid-light.jpeg",
      name: "Solid Light",
      level: "X", initiative: 12, cardNum: 224,
      tags: ["loss"], builds: ["both"],
      top: { text: "Shield 1 Self · Ice consumption: Retaliate 1 Self, XP · The first time you are targeted by an attack this round, generate Light. (Active)", isLoss: false },
      bottom: { text: "Move 3 · Light consumption: +1 Move, Jump · Ice consumption: Heal 2, Range 2", isLoss: false },
      commentary: "Initiative 12 is the best on the class at Level 1 and the primary reason to play this card. The Top is vanilla without Ice — Shield 1 Retaliate 1 is underwhelming for a Level X — and the Light generation from being attacked is unreliable. The Bottom is the card's real strength: Light consumption gives Move 4 Jump for excellent positioning, while Ice gives Heal 2 Range 2 — the best overall use of those two elements. Recommend giving this a try early to see if you need a second heal source. A good card that was ultimately cut in favour of more active options."
    },
    {
      id: "sparkling-glow",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/LU/cs-sparkling-glow.jpeg",
      name: "Sparkling Glow",
      level: "X", initiative: 27, cardNum: 225,
      tags: ["aoe"], builds: ["support"],
      top: { text: "Attack 4 · AoE hex pattern (2 hexes) · Fire + Light consumption: ADD TARGET · Ice + Dark consumption: ADD TARGET · 2 XP (Loss)", isLoss: true },
      bottom: { text: "The next time you perform a Glow ability this round, all allies in the depicted area perform 'Heal 2 Self'. (Active) · Move 2", isLoss: false },
      commentary: "A legitimate payoff for excess elements that didn't quite make the cut. The Top can reach Attack 8-12 cumulative with two of the right elements, with Attack 16 possible in ideal conditions. The biggest issue is unreliability — the AoE pattern requires strange positioning by default before hitting two targets, and you need a specific pair of elements present. The Initiative at 27 is fine but not exciting enough to justify the setup required. The Bottom Heal 2 Self to all allies via Glow is a nice upside, but Shimmering Scuttle's faster Initiative and better Top win out for most builds."
    },
    {
      id: "trickling-sting",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/LU/cs-trickling-sting.jpeg",
      name: "Trickling Sting",
      level: "X", initiative: 43, cardNum: 226,
      tags: ["loss"], builds: ["bruiser"],
      top: { text: "Attack 2 + X where X is equal to the number of elements that are Strong or Waning, up to 4.", isLoss: false },
      bottom: { text: "Move 3 · Create a 4 damage trap in an adjacent empty hex and gain XP · Generate Wild Element and gain XP when the trap is sprung by an enemy, then lose this card.", isLoss: true },
      commentary: "Supposed to be the payoff for excess elements. Unexciting at fewer than 2 elements. The bottom is niche for a class that lacks any way at Level 1/X to manipulate monster movement."
    },
    {
      id: "darkened-overcast",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/LU/cs-darkened-overcast.jpeg",
      name: "Darkened Overcast",
      level: "2", initiative: 10, cardNum: 227,
      tags: ["loss"], builds: ["bruiser"],
      top: { text: "Enemies cannot focus on or target you with attacks this round · All enemies within Range 3 gain Disadvantage on all their attacks this round · Generate Dark (Active)", isLoss: false },
      bottom: { text: "Whenever you perform a Glow ability, gain Shield 1 for the rest of the round. (Active, Persistent Loss) · Generate Wild Element · 2 XP", isLoss: true },
      commentary: "A neat take on the Invisibility problem — quasi-Invisibility for the round plus Disadvantage on all enemies within Range 3, plus generates Dark, all at Initiative 10. Dark is consistently your best element, and having a card that takes you out of danger, saves your allies potential life, AND infuses Dark quickly is outstanding. This is the recommended Level 2 pick for the Bruiser build — it pairs perfectly with Blackened Rage at Level 3. The Bottom Persistent Loss giving Shield 1 per Glow is fine in entrenched fights but mostly functions as Initiative 10 Move 2. All upside on an already excellent card."
    },
    {
      id: "luminescence",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/LU/cs-luminescence.jpeg",
      name: "Luminescence",
      level: "2", initiative: 66, cardNum: 228,
      tags: ["glow", "loss"], builds: ["support"],
      top: { text: "Glow — During your turn: Ice consumption: HEAL 2 all allies in the depicted area · AoE hex pattern (4 hexes) · XP · when another Glow is played, discard this card.", isLoss: false },
      bottom: { text: "Move 3 · Ice consumption: +1 Move, Heal 3 Self, XP", isLoss: false },
      commentary: "A cool support Glow that requires Ice to do anything useful — making it a tough sell against Darkened Overcast at Level 2, which demands nothing and produces Dark. Both halves need Ice before they're exciting. The Top Heal 2 Target 2 (average case) is decent but this is the first Glow that doesn't Infuse an element when played into Active Area, requiring a reliable Ice source and allies who actually need healing. Initiative 66 looks sad next to Overcast's 10. The Bottom Move 4 Heal 3 Self with Ice is historically a great action and the stronger half. Recommended only if your party can reliably generate Ice or if you took Solid Light."
    },
    {
      id: "blackened-rage",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/LU/cs-blackened-rage.jpeg",
      name: "Blackened Rage",
      level: "3", initiative: 45, cardNum: 229,
      tags: ["scuttle", "aoe", "loss"], builds: ["bruiser"],
      top: { text: "Attack 3 · AoE hex pattern (4 hexes) · Dark consumption: +1 Attack, IMMOBILIZE · You may Move 1 into any depicted black hex; if you do, generate Fire.", isLoss: false },
      bottom: { text: "Move 3 Jump · Fire consumption: all enemies moved through suffer 1 damage", isLoss: false },
      commentary: "The card that made the guide author go back and evaluate Level 2 options — a nice payoff for taking Darkened Overcast. The 4-hex AoE with Dark Immobilize ranges between Attack 4 Immobilize on one target to Attack 6-8 Immobilize on two, plus Scuttle Infuse Fire. Since attacks resolve before Scuttling, you always have full information before committing. This is a melee-style AoE that avoids Retaliate by default and works with melee-specific items. Initiative 45 is the main weakness — the Top wants to go early to lock things down. The Bottom Move 3 Jump with optional Fire damage to enemies moved through is a solid, flexible action."
    },
    {
      id: "shining-diversion",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/LU/cs-shining-diversion.jpeg",
      name: "Shining Diversion",
      level: "3", initiative: 29, cardNum: 230,
      tags: ["glow", "loss"], builds: ["support"],
      top: { text: "Glow — During your turn: Light consumption: SHIELD 1 all allies in the depicted area · AoE hex pattern (5 hexes) · Generate Ice · Loot the indicated hexes · XP · when another Glow is played, discard this card.", isLoss: false },
      bottom: { text: "Move 3 · MUDDLE all adjacent enemies · Move 2", isLoss: false },
      commentary: "A strong support Glow for those avoiding the Bruiser path. The Top smartly generates Ice when you consume Light — unlike Level 1 Glows that only produce an element once when played. The Shield 1 to allies is fine but low impact by this point, and the Loot feels like flavor text. Best for builds leaning into the Light-to-Ice conversion pipeline, especially if you took Luminescence at Level 2. Initiative 29 is a decent improvement over Blackened Rage's 45. The Bottom cumulative Move 5 with AoE Muddle in the middle is very good — solid mitigation for a class that's light on it despite high HP. A totally reasonable pick if your party doesn't need Blackened Rage's burst damage."
    },
    {
      id: "empowering-rays",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/LU/cs-empowering-rays.jpeg",
      name: "Empowering Rays",
      level: "4", initiative: 57, cardNum: 231,
      tags: ["aoe", "loss"], builds: ["bruiser"],
      top: { text: "STRENGTHEN Self · Attack 4 · AoE hex pattern (3 hexes) · Generate Fire, Light, and Dark · 2 XP (Loss)", isLoss: true },
      bottom: { text: "Add POISON to your next Glow ability targeting enemies this round. (Active) · Move 3", isLoss: false },
      commentary: "An oddball but a neat twist on an AoE pattern. Strengthens you for this turn and next, fires 3 big attacks, generates Fire/Light/Dark, and earns 2 XP — all at once. Not eye-popping value but a great way to turn around a difficult room, especially when monsters are crowded around a melee ally. The 3-hex pattern can be tricky to land all 3 hits but is far from impossible. Initiative 57 is awful — a continuing frustration on this class. The Bottom AoE Poison via Glow is a nice payoff for Glow-focused builds from Levels 7-9, but is mostly dead weight before then. Consider your long-term build plan when evaluating this card."
    },
    {
      id: "floodlight",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/LU/cs-floodlight.jpeg",
      name: "Floodlight",
      level: "4", initiative: 71, cardNum: 232,
      tags: ["scuttle", "aoe", "loss"], builds: ["bruiser"],
      top: { text: "Attack 4 · POISON · AoE hex pattern (4 hexes) · Ice consumption: Heal 2, affect one ally in a depicted black hex · XP · You may Move 2 Jump into any depicted black hex; if you do, generate Light.", isLoss: false },
      bottom: { text: "You are immune to IMMOBILIZE · The next three times you would generate Light, generate Wild Element and the element shown instead, and gain XP. (Persistent Loss)", isLoss: true },
      commentary: "An evolution of the Level 1 Scuttles — Attack 4 Poison with a potential ally Heal, XP, and the first Jump Scuttle on the class. The Jump makes the Light generation much more reliable than earlier Scuttles since you can reach hexes that would otherwise be blocked. Ice adds a Heal 2 to an ally in a Scuttle hex — niche but welcome. Initiative 71 is another middling number. The Bottom Persistent Loss grants Immobilize immunity with Light-to-Wild Element conversion — clunky in practice since it turns off after three triggers. Used this almost exclusively for the Top. A close contest with Empowering Rays; worth trying both."
    },
    {
      id: "colorful-wavelengths",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/LU/cs-colorful-wavelengths.jpeg",
      name: "Colorful Wavelengths",
      level: "5", initiative: 83, cardNum: 233,
      tags: ["aoe", "loss"], builds: ["bruiser"],
      top: { text: "Attack 5 · AoE hex pattern · Ice consumption: PIERCE 2 and generate Fire · Fire consumption: AoE hex pattern (2 hexes) and generate Ice · Light consumption: PUSH 2 and generate Dark · Dark consumption: CURSE and generate Light", isLoss: false },
      bottom: { text: "Attack 3 · AoE hex pattern (3 hexes) · Generate Ice, Fire, Light, and Dark · 2 XP · Perform a Glow ability without consuming an element. (Loss)", isLoss: true },
      commentary: "The Level 5 Mini-Capstone and a great encapsulation of Luminary's class vision. The Top is a rock-solid Attack 5 where every extra element turns whatever you have into its opposite for next turn — with all 4 elements you can chain into a Scuttle Attack 5 Pierce 2 Push 2 Curse. The fallsafe (plain Attack 5) is high enough to feel rewarding without perfect setup. Initiative 83 is a welcome late number for going after threatening monster actions. The Bottom is a Loss that generates all 4 elements, deals Attack 3 AoE, earns 2 XP, AND provides a free Glow activation — setting up multiple big turns in a row. A landmark card for both builds."
    },
    {
      id: "shadow-claws",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/LU/cs-shadow-claws.jpeg",
      name: "Shadow Claws",
      level: "5", initiative: 25, cardNum: 234,
      tags: ["glow", "loss", "aoe"], builds: ["support"],
      top: { text: "Glow — During your turn: Dark consumption: MUDDLE · AoE hex pattern (4 hexes) · Gain Advantage on all your attacks targeting enemies with MUDDLE this round. (Active) · XP · when another Glow is played, discard this card.", isLoss: false },
      bottom: { text: "Remove one negative condition from Self · Move 2 · Any time you consume at least one element when performing a Glow ability, you may generate Wild Element and discard this card. This element must be different than any consumed by the Glow.", isLoss: false },
      commentary: "The Mini-Capstone for the Glow build — but really a reward for builds that consistently Infuse Dark, which unfortunately none of the earlier level-up Glow picks particularly help with. The Top Glow gives Advantage on attacks against Muddled enemies, but note: you only get this on the turn you activate the Glow AND the target must already be Muddled. A parasitic effect that taxes your Dark for almost everything else. The Bottom Move 2 with conditional Wild Element generation after a Glow is workable but not exciting. Initiative 25 is decent. Give the nod to Colorful Wavelengths — more consistent and more fun."
    },
    {
      id: "encompassing-aura",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/LU/cs-encompassing-aura.jpeg",
      name: "Encompassing Aura",
      level: "6", initiative: 11, cardNum: 235,
      tags: ["aoe"], builds: ["support"],
      top: { text: "Shield 1 and Retaliate 1 · Affect self and all allies in the depicted area · Ice consumption: +1 Shield · Dark consumption: +1 Retaliate · XP", isLoss: false },
      bottom: { text: "Light consumption: IMMOBILIZE · Target all adjacent enemies · Move 2 · Fire consumption: WOUND · Target all adjacent enemies · Move 2", isLoss: false },
      commentary: "Not a Glow card, not a Loss. The Top affects you too, which is easy to miss. Without Ice it's unexciting, but Ice turns it into 6-8 cumulative Shields with bonus Retaliate — substantial defensive output for the whole party. The 11 Initiative is the glue: both halves want to go fast. The Bottom asks for Light for Immobilize and Fire for Wound, each paired with Move 2 — locking down melee enemies and slapping AoE Wound before moving away is solid value. All 4 elements in one card, but even the base (plain Move 4 at Init 11) is fine. Gives the nod here over Imposing Brilliance for the Initiative and multi-element defensive value."
    },
    {
      id: "imposing-brilliance",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/LU/cs-imposing-brilliance.jpeg",
      name: "Imposing Brilliance",
      level: "6", initiative: 86, cardNum: 236,
      tags: ["scuttle", "aoe"], builds: ["bruiser"],
      top: { text: "Attack 3 · AoE hex pattern (5 hexes) · If a target occupies the hex, add the condition shown to the attack · You may Move 1 into any depicted black hex; if you do, generate Dark.", isLoss: false },
      bottom: { text: "Move 3 · If you end this movement adjacent to at least one enemy, generate Fire · If you end adjacent to at least one ally, generate Ice · If you end in the same hex you started in, generate Light", isLoss: false },
      commentary: "Borrows from other Crimson Scales classes with Conditions on specific Hex Array hexes — Immobilize in the back, Poison in the front for allies to capitalize on. Attack 3 is a bit low for Level 6 and the 5-hex formation won't always line up, but it does enough. Note this class's Perks cap out at +0, so Attack 3s don't reliably become Attack 5s at higher levels. Initiative 86 is a welcome late number. The Bottom Move 3 reliably generates one element and often two — fantastic setup for Colorful Wavelengths the following turn. A legitimately tough choice against Encompassing Aura; take Brilliance if you value the multi-element Bottom over the Initiative."
    },
    {
      id: "gamma-energy",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/LU/cs-gamma-energy.jpeg",
      name: "Gamma Energy",
      level: "7", initiative: 65, cardNum: 237,
      tags: ["glow", "aoe", "loss"], builds: ["both"],
      top: { text: "Glow — During your turn: Fire consumption: All enemies in the targeted area suffer 2 damage · AoE hex pattern · XP when another Glow is played, discard this card.", isLoss: false },
      bottom: { text: "Consume all Strong or Waning elements · Attack X · Range 3 · Target X where X equals number of elements consumed. (Loss)", isLoss: true },
      commentary: "The first big payoff for the Glow build. True damage is always fantastic, and 4-6 damage a pop is the kind of Glow that makes you want to turn it on early. The Bottom is a super spicy Loss — wildly varying in damage between Attack 9 and 36 in the absolutely perfect world."
    },
    {
      id: "photonic-defense",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/LU/cs-photonic-defense.jpeg",
      name: "Photonic Defense",
      level: "7", initiative: 9, cardNum: 0,
      tags: ["loss"], builds: ["support"],
      top: { text: "On the next four attacks targeting you, gain either Shield 3 or Retaliate 3 for the attack and generate the element shown. (Loss)", isLoss: true },
      bottom: { text: "Move 3 · If you perform a Glow ability this round, perform Move 3. · Generate Dark.", isLoss: false },
      commentary: "A reactive defensive Loss with a surprisingly strong element generation payoff. The Top gives you Shield 3 or Retaliate 3 on each of the next four incoming attacks, with each trigger generating a different element — netting up to four infusions over the course of the round. This makes the Top both a damage mitigation tool and an element engine, which is unique on this class. Initiative 9 is the best on the class and hugely valuable. The Bottom is a potential Move 6 Infuse Dark — excellent, but only if you also perform a Glow ability this round, making it awkward between rooms or on turns without an active Glow. Gamma Energy is the stronger pick for the Bruiser build; this shines in the Support build where you're cycling Glows regularly."
    },
    {
      id: "dominating-illusion",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/LU/cs-dominating-illumination.jpeg",
      name: "Dominating Illumination",
      level: "8", initiative: 51, cardNum: 0,
      tags: ["glow", "scuttle", "aoe"], builds: ["both"],
      top: { text: "Glow — During your turn: Fire consumption: add +1 Attack to all your attacks this round · Light consumption: BLESS Self · XP when another Glow is played, discard this card.", isLoss: false },
      bottom: { text: "Attack 3 · AoE hex pattern · You may Move 2 into any depicted black hex; if you do, generate Light.", isLoss: false },
      commentary: "A Glow card that rewards having both Fire and Light available. The Top gives +1 Attack to all your attacks on Fire consumption — excellent on a turn with Colorful Wavelengths or other multi-hit AoE — and Bless Self on Light consumption for a free modifier deck boost. Both effects together on the same turn is strong. Initiative 51 is the main weakness; try not to lead with this card. The Bottom is a clean AoE Attack 3 Scuttle that generates Light, making it a reliable element converter and consistent damage action every rest cycle — a better Bottom than it first appears given how valuable Light generation is for triggering the Glow Top."
    },
    {
      id: "optical-refraction",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/LU/cs-optical-refraction.jpeg",
      name: "Optical Refraction",
      level: "8", initiative: 37, cardNum: 0,
      tags: ["scuttle", "aoe"], builds: ["support"],
      top: { text: "Attack 3 · AoE hex pattern · Dark consumption: PIERCE 3 · Wild consumption: Generate Wild Element · You may Move 2 Jump into any depicted black hex; if you do, generate Ice.", isLoss: false },
      bottom: { text: "Once per round, if you perform a Glow ability, you may discard that card from your active area. If you do, all enemies targeted with the ability suffer 2 damage and all allies in the targeted area perform Heal 2 Self. · Generate Wild Element · 2 XP (Persistent Loss)", isLoss: true },
      commentary: "The Top is a solid Attack 3 AoE Scuttle — Dark consumption adds Pierce 3 for excellent scaling against the many Shielded monsters at this level, and Wild consumption generates another Wild Element for next turn. The Jump Scuttle generates Ice, making this a nice element converter. Initiative 37 is mediocre. The Bottom is a fantastic Persistent Loss that rewards aggressive Glow cycling — whenever you discard an active Glow, you simultaneously deal 2 damage to all enemies and heal 2 to all allies in the targeted area, plus generate Wild Element and gain 2 XP. This pairs beautifully with Gamma Energy and Drawn into the Light, as discarding those Glows triggers a free AoE damage+heal burst every rest cycle. The strongest pick at Level 8 for Glow-focused builds."
    },
    {
      id: "blazing-pincers",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/LU/cs-blazing-pincers.jpeg",
      name: "Blazing Pincers",
      level: "9", initiative: 59, cardNum: 0,
      tags: ["scuttle", "aoe"], builds: ["bruiser"],
      top: { text: "Attack 4 · AoE two-line hex pattern and if a target occupies the hex, add the WOUND condition to the attack · You may Move 2 into any depicted black hex; if you do, generate Wild Element.", isLoss: false },
      bottom: { text: "Move 3 · Attack 3 · Generate Wild Element.", isLoss: false },
      commentary: "Rock-solid Level 9. The Top two-line AoE with conditional Wound on occupied hexes translates to Attack 4 Wound on 1-2 targets with a Wild Element Scuttle — consistent and always good. Neither half is a Loss, making this unusually stamina-friendly for a Level 9. Initiative 59 is rough. The Bottom is elegantly simple — Move 3 Attack 3 Infuse Wild Element is something every Luminary will enjoy. Both halves are flexible and contribute damage, movement, and element generation."
    },
    {
      id: "light-the-way",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/LU/cs-light-the-way.jpeg",
      name: "Light the Way",
      level: "9", initiative: 93, cardNum: 0,
      tags: ["glow", "loss"], builds: ["support"],
      top: { text: "Glow — During your turn: Dark + Ice consumption: Summon Gleaming Squid (HP 3, Move 3, Attack 2, PIERCE 3, generate Light on attack) · XP · When another Glow is played, discard this card.", isLoss: false },
      bottom: { text: "Once per turn, if you move four or more hexes during your turn, generate Fire or Light. · Generate Wild Element · 2 XP (Persistent Loss)", isLoss: true },
      commentary: "A Glow Summon at Level 9 — the Gleaming Squid has Pierce 3 and generates Light on each attack, giving excellent late-game scaling. Being a non-Loss Glow means the Squid returns each rest cycle without spending a card. Needs both Dark and Ice simultaneously, so plan your element management carefully. Initiative 93 is fine for a Summon — go late, deploy safely. The Bottom Persistent Loss generates Wild Element each turn and rewards movement — if you move 4+ hexes in a turn you also generate Fire or Light, synergising naturally with the class's many Scuttle abilities. Pairs beautifully with the Level 7 and 8 Glow abilities."
    },
    {
      id: "drawn-into-the-light",
      imageUrl: "https://raw.githubusercontent.com/any2cards/worldhaven/master/images/milestone-ability-cards/trail-of-ashes/toa-msa-luminary.png",
      name: "Drawn into the Light",
      level: "M", initiative: 47, cardNum: 682,
      tags: ["loss"], builds: ["both"],
      top: { text: "Attack 3 · Range 2 · PULL 1 · Wild consumption: +2 Range, +2 PULL, XP · Wild consumption: +1 Attack, generate Wild Element", isLoss: false },
      bottom: { text: "You may have two Glow cards active at once. When a third is played, move one of the others to the discard pile. · Generate Wild Element, XP (Persistent Loss)", isLoss: true },
      commentary: "A fantastic addition to the Luminary's arsenal. The Top is the class's only non-Loss Ranged Attack. The Bottom having two Glows active simultaneously unlocks running 2 Glows at once, and the Wild Element Infusion means you can immediately utilize your second Glow on the next turn."
    }
  ],

  perks: [
    { count: 1, text: "Remove four -1 cards" },
    { count: 1, text: "Replace one -1 card with one +2 card" },
    { count: 1, text: "Replace one -1 card with one +0 Fire Infuse card" },
    { count: 1, text: "Replace one -1 card with one +0 Ice/Dark card" },
    { count: 1, text: "Replace one -1 card with one +0 Fire/Light card" },
    { count: 1, text: "Replace one -1 card with one +0 Dark Infuse card" },
    { count: 1, text: "Replace one -2 card with one +2 'Perform one Glow ability' card" },
    { count: 2, text: "Add one -1 Wild Element card" },
    { count: 2, text: "Add one +0 +1 'Heal 1, Self' card" },
    { count: 2, text: "Add one -1 'POISON — Target all enemies in the depicted area' card" },
    { count: 1, text: "Ignore negative scenario effects and remove one -1 card" },
    { count: 1, text: "Ignore negative item effects and add one +0 Ice/Dark/Wild Element card" }
  ],

  tips: [
    { category: "Elements", text: "Dark is your best element by a wide margin — it enhances Stun (Chilling Wave), Immobilize (Radiant Glare/Blackened Rage), extra targets (Frosty Glimmer), and powers Darkened Overcast. Build your play around having Dark available as often as possible." },
    { category: "Glow abilities", text: "Glow abilities are best played on Turn 1 or between rooms — they produce a different element when placed into your Active Area, and activating them mid-combat by taking a turn off is awkward. Plan your Glow usage carefully at the start of each room." },
    { category: "Movement", text: "This class struggles with movement. You're purely Melee and need to reach your enemies, but many of your cards are Move 2 Infuse actions. Boots of Striding is almost mandatory — you will have very mopey turns if you only have a Move 2 or two each rest cycle." },
    { category: "Initiative", text: "Initiative Control is a constant problem. You only have two cards that can guarantee going before most monsters (Solid Light at 12, Darkened Overcast at 10). Plan your Initiative weaving carefully — the class has a lot of 30-80 range cards that give you middling options." },
    { category: "Scuttle", text: "Scuttle moves you into a black hex depicted on AoE cards after your attack, letting you infuse a specific element for free. You resolve the Attacks first, then decide whether to Scuttle — so you always have complete information before committing. The hex must be empty and reachable." },
    { category: "Builds", text: "The Bruiser/Scuttle build focuses on AoE attacks with element consumption bonuses. The Glow/Support build focuses on Glow abilities that Heal, Shield, and Strengthen allies. Radiant Glare (Move 2 Infuse Dark) and Flickering Lights (Heal 2 Self Loot 1) are core to both." },
    { category: "Perks", text: "Start with the -1 to +0 Infuse replacement perks first — they thin your deck and give you element generation. Then go for the Remove 4 -1 cards perk. Avoid the AoE Poison perk initially as it will typically only hit 1-2 targets." },
    { category: "Losses", text: "Oddly, the Luminary's Loss Attacks are often better and more consistent than the non-Loss ones when you have the right element consumptions. Don't be afraid to use your Loss Tops — the class has 11 cards and solid HP to sustain longer campaigns without them." },
    { category: "Items", text: "Focus on movement items (Boots of Striding) and elemental Infusion items early. This class likes gold a lot — Flickering Lights' Loot + Wild Element rider helps fund your enhancements and items." },
    { category: "Milestone", text: "Everyone gets Drawn into the Light eventually — it requires 10 checkmarks toward your personal goal. Prioritize completing it as the double-Glow ability from the Bottom is a significant upgrade for the Support build, and the Ranged Attack is invaluable in scenarios where reaching Melee isn't possible." }
  ]
};
