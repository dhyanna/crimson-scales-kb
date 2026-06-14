// data-luminary.js — Luminary (Crescent Sun) class data for Crimson Scales Knowledge Base
// Guide source: Magatis on Imgur (August 2022)

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
    commentary: "Goal: Consume an element to perform a Glow action 10 times. This is exactly what the Luminary does every turn it has a Glow active and the right element available — so this milestone completes itself naturally as you play. Any element consumption that triggers a Glow ability counts, whether it's Dark for Radiant Glare, Ice for Luminescence, or Fire for Heat Waves. Once complete, Drawn into the Light is added permanently — the class's only non-Loss Ranged Attack and, crucially, the ability to have two Glow cards active simultaneously."
  },

  cards: [
    {
      id: "burning-sparks",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/LU/cs-burning-sparks.jpeg",
      name: "Burning Sparks",
      level: "1",
      initiative: 33,
      cardNum: 213,
      tags: ["aoe", "loss"],
      builds: ["bruiser"],
      top: {
        text: "Attack 1 · PIERCE 1 · AoE hex pattern (3 hexes) · Fire consumption: +1 Attack · Light consumption: +1 Attack (Loss)",
        isLoss: true
      },
      bottom: {
        text: "Attack 2 · Move 1",
        isLoss: false
      },
      commentary: "The first Level 1 card doesn't showcase either class mechanic but is a solid action. The Top AoE Attack scales well with Fire or Light consumption but is far from stellar without them. The Bottom Attack 2 Move 1 is what kept this card in hand until Level 4 — it's flexible and the best non-Loss Bottom action at Level 1."
    },
    {
      id: "chilling-wave",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/LU/cs-chilling-wave.jpeg",
      name: "Chilling Wave",
      level: "1",
      initiative: 39,
      cardNum: 214,
      tags: ["scuttle", "loss"],
      builds: ["bruiser"],
      top: {
        text: "Attack 3 · Dark consumption: STUN · AoE hex pattern · You may Move 1 into any depicted black hex; if you do, generate Ice.",
        isLoss: false
      },
      bottom: {
        text: "Add STUN to your next Glow ability this round · Perform a Glow ability without consuming an element.",
        isLoss: true
      },
      commentary: "Introduces Scuttle with a fantastic Attack 3 Stun — arguably wouldn't exist in Frosthaven with this balancing. Dark is your best element and Stun is your best condition, so this is a near-auto-include. The free Ice generation from Scuttling keeps the card relevant even on turns where you can't consume Dark. Initiative 39 is poor for a Stun but Stuns don't care when they happen. Bottom is niche — a temporary Glow enabler that sees little use."
    },
    {
      id: "flickering-lights",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/LU/cs-flickering-lights.jpeg",
      name: "Flickering Lights",
      level: "1",
      initiative: 19,
      cardNum: 215,
      tags: ["scuttle", "loss"],
      builds: ["both"],
      top: {
        text: "Attack 3 · If a target occupies the hex, generate the element shown · AoE hex pattern · You may Move 1 into any depicted black hex; if you do, generate Light.",
        isLoss: true
      },
      bottom: {
        text: "Heal 2 Self · Loot 1 · If you loot two or more money tokens with this ability, generate Wild Element.",
        isLoss: false
      },
      commentary: "A quiet powerhouse. The Top generates up to 4 elements and attacks 3 targets — probably won't use more than 2 elements on any given turn at low levels, but powering up your next turn is excellent. Initiative 19 is one of your fastest and combos nicely with Chilling Wave to Stun key targets early. The Bottom Heal 2 Self Loot 1 with Wild Element rider is exceptional — among the best Level 1/X Loot actions seen. This class likes gold, and being able to heal and generate an element while looting is tremendous value."
    },
    {
      id: "frosty-glimmer",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/LU/cs-frosty-glimmer.jpeg",
      name: "Frosty Glimmer",
      level: "1",
      initiative: 55,
      cardNum: 216,
      tags: ["glow"],
      builds: ["support"],
      top: {
        text: "Heal 2 · Range 3 · Ice consumption: +1 Heal, +1 Range · Dark consumption: Target 2",
        isLoss: false
      },
      bottom: {
        text: "Move 3 · Dark consumption: +1 Move, Jump · Fire consumption: Ignore all traps and disarm one trap moved through",
        isLoss: false
      },
      commentary: "A good solid card that gets better with element consumption. Dark is the best element for the Luminary, making the extra target on the Top incredible — 6 effective healing at Range 4 when both elements hit. Initiative 55 is awful for a Heal (you need to go before your allies take damage) making this easier to cut. The Bottom Move 3 with Jump is fantastic with Dark, and the Fire disarm is surprisingly useful in Crimson Scales which has decent trap density."
    },
    {
      id: "heat-waves",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/LU/cs-heat-waves.jpeg",
      name: "Heat Waves",
      level: "1",
      initiative: 73,
      cardNum: 217,
      tags: ["glow"],
      builds: ["support"],
      top: {
        text: "Glow — During your turn: Fire consumption: WOUND · AoE hex pattern (enemy targets) · XP when another Glow is played, discard this card.",
        isLoss: false
      },
      bottom: {
        text: "Move 2 · Generate Ice",
        isLoss: false
      },
      commentary: "Your first actual Glow ability. Produces a different element when placed into your Active Area, so there were definitely times playing this purely for the element Infused. Glow abilities are best on Turn 1 and between rooms. Fire Wound on AoE is good against low-health targets like Forest Imps or Living Spirits but hard to have Fire available when you want it. Initiative 73 is fine but not exciting — generally prefer to lead with faster cards to capitalize on available elements and monster positions."
    },
    {
      id: "moonbeam",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/LU/cs-moonbeam.jpeg",
      name: "Moonbeam",
      level: "1",
      initiative: 85,
      cardNum: 218,
      tags: ["glow"],
      builds: ["support"],
      top: {
        text: "Glow — During your turn: Dark consumption: CURSE · AoE hex pattern · XP when another Glow is played, discard this card.",
        isLoss: false
      },
      bottom: {
        text: "Move 2 · Generate Fire",
        isLoss: false
      },
      commentary: "Follows the trend of good Glow effects that want Dark Consumption. Curse AoE is decent — got two targets about half the time in testing, felt fine but not exciting. The Fire Infusion on the Bottom is what made this see regular play as it was often necessary to make the class's AoE cards work. This class struggles a bit with movement when using multiple Move 2 Infuse cards, so Boots of Striding is strongly recommended. The Bottom Move 2 Infuse Fire was consistently useful. Initiative 85 and the Bottom made up for the awkward Top action."
    },
    {
      id: "radiant-glare",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/LU/cs-radiant-glare.jpeg",
      name: "Radiant Glare",
      level: "1",
      initiative: 36,
      cardNum: 219,
      tags: ["glow"],
      builds: ["both"],
      top: {
        text: "Glow — During your turn: Light consumption: IMMOBILIZE · AoE hex pattern · Fire consumption: XP when another Glow is played, discard this card.",
        isLoss: false
      },
      bottom: {
        text: "Move 2 · Generate Dark",
        isLoss: false
      },
      commentary: "The second best Top Glow combined with the best Bottom Move 2 Infuse — something to always want in your opening hand. The Glow Top Immobilizes on Light which is fine, the AoE pattern can hit 2-3 targets, but the real star is the Bottom Dark Infusion. Dark is consistently your best element for nearly everything on this class. Initiative 36 is one of your faster ones. This card was never cut and is a cornerstone of both builds."
    },
    {
      id: "shimmering-scuttle",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/LU/cs-shimmering-scuttle.jpeg",
      name: "Shimmering Scuttle",
      level: "1",
      initiative: 21,
      cardNum: 220,
      tags: ["scuttle"],
      builds: ["bruiser"],
      top: {
        text: "Attack 2 · AoE hex pattern · Light consumption: +1 Attack, XP · You may Move 2 into any depicted black hex; if you do, generate Fire.",
        isLoss: false
      },
      bottom: {
        text: "Add MUDDLE to all Glow abilities targeting enemies this round. (Active) · Move 2",
        isLoss: false
      },
      commentary: "A nice role-player at lower levels with a reasonable Top Attack that generates Fire on Scuttle. The claw-like pattern was harder to land than it appeared — needed to be in an odd spot or have both Melee and Ranged enemies close to hit two targets without the Light element. Averages roughly Attack 3-4 with Fire infusion. Initiative 21 is one of your faster cards and felt necessary regardless of the actual text. The Bottom Muddle to all Glow abilities is a minor upgrade to a generic Move 2 — came up occasionally but was never actively sought."
    },
    {
      id: "soft-glow",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/LU/cs-soft-glow.jpeg",
      name: "Soft Glow",
      level: "1",
      initiative: 24,
      cardNum: 221,
      tags: ["glow"],
      builds: ["support"],
      top: {
        text: "Glow — During your turn: STRENGTHEN · AoE hex pattern (ally targets) · Dark consumption: XP when another Glow is played, discard this card.",
        isLoss: false
      },
      bottom: {
        text: "Move 2 · Generate Light",
        isLoss: false
      },
      commentary: "The last of the four Glow Top / Move 2 Infuse cycle cards at Level 1. Good for both players — the Bruiser benefits from occasional Strengths on key turns and the Support player uses this to set up consistent Dark for multi-target Heals or AoE effects. Initiative 24 is appreciated. The Bottom Light Infusion felt mostly for Frosty Glimmer targets but has some other uses. An overall good card that makes the cut a decent portion of the time."
    },
    {
      id: "torrid-radiation",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/LU/cs-torrid-radiation.jpeg",
      name: "Torrid Radiation",
      level: "1",
      initiative: 76,
      cardNum: 222,
      tags: ["scuttle", "loss"],
      builds: ["bruiser"],
      top: {
        text: "Attack 3 · PIERCE 1 · AoE hex pattern · Fire consumption: Target suffers 1 damage, XP · You may Move 1 into any depicted black hex; if you do, generate Dark.",
        isLoss: true
      },
      bottom: {
        text: "Move 3 · All adjacent enemies suffer 1 damage. For each enemy that suffered damage, generate Wild Element.",
        isLoss: true
      },
      commentary: "A card that the Bruiser player enjoyed for a long time. The Attack 3 Pierce 1 always felt good, Fire consumption added true damage, and Dark generation from Scuttle was fantastic. The Hex Array was awkward and the Scuttle space was often occupied, but the Top stood on its own. Initiative 76 is middling and not a dealbreaker. The Bottom is a true Move 3 Deal 1 damage to all adjacent + generate 2 Wild Elements, which is clearly good but not outstanding enough to prioritize over other Level 1 Losses."
    },
    {
      id: "violent-flash",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/LU/cs-violent-flash.jpeg",
      name: "Violent Flash",
      level: "X",
      initiative: 40,
      cardNum: 223,
      tags: ["aoe", "loss"],
      builds: ["bruiser"],
      top: {
        text: "Attack 3 · AoE hex pattern · If a target occupies the hex, generate the element shown (Ice, Fire, Light, Dark, Wild). (Loss)",
        isLoss: true
      },
      bottom: {
        text: "Move 2 · Move 2",
        isLoss: false
      },
      commentary: "A pretty apt name — hits 3 enemies and generates a nice suite of elements. The odd thing about the Luminary's Loss Attacks is they're better and more consistent than the non-Loss ones when you have the right element consumptions. Not used for the Top often, but this is the kind of Loss you play when element generation was hampered, when Hex Arrays weren't lining up, or when monsters were consuming your elements. Initiative 40 is poor middle-of-the-road. The Bottom double Move 2 is a flavor homerun — a necessary action for this class that struggles with reliable movement."
    },
    {
      id: "solid-light",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/LU/cs-solid-light.jpeg",
      name: "Solid Light",
      level: "X",
      initiative: 12,
      cardNum: 224,
      tags: ["glow", "loss"],
      builds: ["both"],
      top: {
        text: "Shield 1 Self · Ice consumption: Retaliate 1 Self, XP · The first time you are targeted by an attack this round, generate Light. (Active)",
        isLoss: false
      },
      bottom: {
        text: "Move 3 · Ice consumption: +1 Move, Jump · Light consumption: Heal 2 Range 2",
        isLoss: false
      },
      commentary: "Initiative 12 is your best Initiative at Level 1 and a huge reason to play this card. The Top is vanilla without Ice — Shield 1 Retaliate 1 is something you can get on other classes more easily. Most awkward is you can't actually rely on the Light infusion from the Top in key situations. The Bottom Move 3 Jump is excellent with Ice, and is also your best overall use of Ice — both elements here are under less pressure/competition. Ice to Light conversion is also the best overall use of those elements. Recommended to start with this card and see if you need a second heal source."
    },
    {
      id: "sparkling-glow",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/LU/cs-sparkling-glow.jpeg",
      name: "Sparkling Glow",
      level: "X",
      initiative: 27,
      cardNum: 225,
      tags: ["glow", "loss"],
      builds: ["support"],
      top: {
        text: "Attack 4 · AoE hex pattern · Fire + Light consumption: ADD TARGET · Ice + Dark consumption: ADD TARGET (Loss)",
        isLoss: true
      },
      bottom: {
        text: "The next time you perform a Glow ability this round, all allies in the depicted area perform 'Heal 2 Self'. (Active) · Move 2",
        isLoss: false
      },
      commentary: "Didn't make the cut, although the Top potential is a legitimate payoff for excess elements — this will often be Attack 8 cumulative even with two of the right elements, with Attack 12 being rare but possible. The biggest issue is unreliability — the AoE pattern requires a strange positioning and you need either 2 specific elements present. The Bottom Move 2 with a better upside than Shimmering Scuttle's Bottom, but also paired with a worse Top Action. Ultimately Shimmering Scuttle's faster Initiative and better Top win out."
    },
    {
      id: "trickling-sting",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/LU/cs-trickling-sting.jpeg",
      name: "Trickling Sting",
      level: "X",
      initiative: 43,
      cardNum: 226,
      tags: ["loss"],
      builds: ["bruiser"],
      top: {
        text: "Attack 2 + X where X is equal to the number of elements that are Strong or Waning, up to 4.",
        isLoss: false
      },
      bottom: {
        text: "Move 3 · Create a 4 damage trap in an adjacent empty hex and gain XP · Generate Wild Element and gain XP when the trap is sprung by an enemy, then lose this card.",
        isLoss: true
      },
      commentary: "Supposed to be the payoff for excess elements from Losses or double element generation turns. Unexciting at fewer than 2 elements — easily an Attack 3 but not always Attack 4. The bottom is niche for a class that lacks any way at Level 1/X to manipulate monster movement. With the right party members this can be fine, but still fairly unexcited for a Move 3 (possibly) deal 4 damage Infuse Wild for a Loss. Start with the three X cards on the sidelines and make switches as you get a feel for the class."
    },
    {
      id: "darkened-overcast",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/LU/cs-darkened-overcast.jpeg",
      name: "Darkened Overcast",
      level: "2",
      initiative: 10,
      cardNum: 227,
      tags: ["glow", "loss"],
      builds: ["bruiser"],
      top: {
        text: "Enemies cannot focus on or target you with attacks this round · All enemies within Range 3 gain Disadvantage on all their attacks this round · Dark consumption: generate Dark (Active, Loss)",
        isLoss: true
      },
      bottom: {
        text: "Whenever you perform a Glow ability, gain Shield 1 for the rest of the round. (Active, Persistent Loss) · Generate Wild Element, XP",
        isLoss: true
      },
      commentary: "A neat and new take on the Invisibility problem from Gloomhaven — quasi-Invisibility for the round PLUS Disadvantage on all enemies within Range 3, PLUS generates Dark with Dark Consumption, all at a stellar Initiative 10. Dark was consistently the best element at Level 1, and this is even more important at Level 3 as well. Having a card that takes you out of danger, saves your allies potential life AND Infuses Dark quickly is outstanding. The Bottom persistent Shield 1 whenever you use a Glow is reasonable for long entrenched fights, but functions as just Initiative 10 Move 2 most of the time."
    },
    {
      id: "luminescence",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/LU/cs-luminescence.jpeg",
      name: "Luminescence",
      level: "2",
      initiative: 66,
      cardNum: 228,
      tags: ["glow", "loss"],
      builds: ["support"],
      top: {
        text: "Glow — During your turn: Ice consumption: Heal 2 · Affect all allies in the depicted area · XP when another Glow is played, discard this card.",
        isLoss: false
      },
      bottom: {
        text: "Move 3 · Ice consumption: +1 Move, Heal 3 Self, XP",
        isLoss: false
      },
      commentary: "What was taken first time testing Luminary — helped realize this class can struggle to produce the right elements at the right times in low prosperity campaigns. This is still good, but won't be the right fit for everyone. Both halves require Ice before they're exciting for a Level 2 card, making it a tough sell against Darkened Overcast which demands nothing and produces Dark quickly. The Top Heal 2 Target 2 decent portion of the time is fine. Initiative 66 looks sad next to Overcast's Initiative 10. The Bottom Move 4 Heal 3 Self with Ice has historically been a fantastic option. Recommend Darkened Overcast first and see how the rest of your party is equipped."
    },
    {
      id: "blackened-rage",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/LU/cs-blackened-rage.jpeg",
      name: "Blackened Rage",
      level: "3",
      initiative: 45,
      cardNum: 229,
      tags: ["scuttle", "aoe", "loss"],
      builds: ["bruiser"],
      top: {
        text: "Attack 3 · AoE hex pattern · Dark consumption: +1 Attack, IMMOBILIZE · You may Move 1 into any depicted black hex; if you do, generate Fire.",
        isLoss: false
      },
      bottom: {
        text: "Move 3 Jump · All enemies moved through suffer 1 damage. · Fire consumption: all enemies moved through suffer 1 damage.",
        isLoss: false
      },
      commentary: "The card that made going back to evaluate Level 2 options more closely. A nice immediate payoff for taking Overcast at Level 2 that plays well into how the Bruiser build wants to operate. Some tradeoffs needing Fire and Dark available simultaneously, but since you resolve Attacks first and then Scuttle afterwards, you always have all the info needed. Between something like Attack 4 Immobilize two targets and Infuse Fire — Initiative 45 is definitely the worst part. The Bottom Move 3 Jump with true damage while moving is great, and with Fire optionally doing 1-2 points of true damage to nearby targets is a nice little bonus."
    },
    {
      id: "shining-diversion",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/LU/cs-shining-diversion.jpeg",
      name: "Shining Diversion",
      level: "3",
      initiative: 29,
      cardNum: 230,
      tags: ["glow", "loss"],
      builds: ["support"],
      top: {
        text: "Glow — During your turn: Light consumption: Shield 1 · Affect all allies in the depicted area · Ice consumption: Loot the indicated hexes · XP when another Glow is played, discard this card.",
        isLoss: false
      },
      bottom: {
        text: "Move 3 · MUDDLE all adjacent enemies · Move 2",
        isLoss: false
      },
      commentary: "Follows a lot of the same formula as the Level 2 decision but sweetens the deal for those who don't want to go the Bruiser-style path. Fixes some issues with Luminescence at low Prosperity, although still not vastly superior. The Top generates Ice when you consume Light, instead of producing the element once when you play it — means you need a good consistent source of Light beyond the base kit. The Bottom cumulative Move 5 split over 2 mini actions with AoE Muddle in the middle is nice mitigation. Initiative 29 is a decent improvement over Blackened Rage's 45."
    },
    {
      id: "empowering-rays",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/LU/cs-empowering-rays.jpeg",
      name: "Empowering Rays",
      level: "4",
      initiative: 57,
      cardNum: 231,
      tags: ["aoe", "loss"],
      builds: ["bruiser"],
      top: {
        text: "STRENGTHEN Self · Attack 4 · AoE hex pattern · Fire + Light + Dark consumption: gain XP for each enemy targeted. (Loss)",
        isLoss: true
      },
      bottom: {
        text: "Add POISON to your next Glow ability targeting enemies this round. (Active) · Move 3",
        isLoss: false
      },
      commentary: "A bit of an oddball but a neat twist on an AoE pattern for those familiar with the Diviner from Forgotten Circles. Makes all the elements your class cards care about save Ice useful, gives you Strengthen for this turn and the next, right before 3 big Attacks, and has some nice experience to boot. Not eye-popping value but a great way to decimate a room that may not be going as well as hoped. Initiative 57 is sadly awful and continues the trend of cards in the 40-70 Initiative range. The Bottom AoE Poison on your next Glow is a nice payoff for those focused on the Glow build from Levels 7-9."
    },
    {
      id: "floodlight",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/LU/cs-floodlight.jpeg",
      name: "Floodlight",
      level: "4",
      initiative: 71,
      cardNum: 232,
      tags: ["scuttle", "aoe", "loss"],
      builds: ["bruiser"],
      top: {
        text: "Attack 4 · POISON · AoE hex pattern · Heal 2: Affect one ally in a depicted black hex · Dark consumption: +1 Attack · You may Move 2 Jump into any depicted black hex; if you do, generate Light.",
        isLoss: false
      },
      bottom: {
        text: "You are immune to IMMOBILIZE · The next three times you would generate Light, generate Wild Element and the element shown instead, and gain XP. (Persistent Loss)",
        isLoss: true
      },
      commentary: "This definitely feels like an evolution of Level 1 Scuttles that started simple and slowly gained complexity. The Top has a bit of everything — Attack 4 Poison, potentially a nice Heal for an ally, the first Jump Scuttle, and Light generation. The Jump Scuttle helps find a place to stand a much larger portion of the time. Initiative 71 is an improvement from 57 but still similar to many other options. The Bottom Immobilize immunity with Light conversion is a strange Persistent Loss that turns off after triggering the other ability three times — pretty niche but absolutely fine to have available."
    },
    {
      id: "colorful-wavelengths",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/LU/cs-colorful-wavelengths.jpeg",
      name: "Colorful Wavelengths",
      level: "5",
      initiative: 83,
      cardNum: 233,
      tags: ["aoe", "loss"],
      builds: ["bruiser"],
      top: {
        text: "Attack 5 · AoE hex pattern · Fire consumption: PIERCE 2 · Light consumption: PUSH 2 · Dark consumption: CURSE · Ice consumption: Perform a Glow ability without consuming an element. (Loss)",
        isLoss: true
      },
      bottom: {
        text: "Perform a Glow ability without consuming an element. (Active, Loss)",
        isLoss: true
      },
      commentary: "The kind of Level 5 Mini-Capstone card that makes me really excited for a class — a great encapsulation of Luminary's overall class vision and playstyle. A rock solid Attack 5 without anything else going on, which seems unlikely for this class, and any extra effects turn whatever elements you have into their opposite for next turn. If you happen to have all 4 elements, can do this twice in a row with a Stamina Potion and reap the rewards of Attack 5 Pierce 2 Push 2 Curse. Initiative 83 is getting to the point where it's a nice way to go after pretty much every threatening monster action. The Bottom free Glow ability is a way to set up multiple turns of the Top action in a row, at least element-wise."
    },
    {
      id: "shadow-claws",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/LU/cs-shadow-claws.jpeg",
      name: "Shadow Claws",
      level: "5",
      initiative: 25,
      cardNum: 234,
      tags: ["glow", "loss"],
      builds: ["support"],
      top: {
        text: "Glow — During your turn: Dark consumption: MUDDLE · AoE hex pattern · Gain Advantage on all your attacks targeting enemies with MUDDLE this round. (Active) · XP when another Glow is played, discard this card.",
        isLoss: false
      },
      bottom: {
        text: "Remove one negative condition from Self · Move 2 · Any time you consume at least one element when performing a Glow ability, you may generate Wild Element and discard this card. (This element must be different than any consumed by the Glow.)",
        isLoss: false
      },
      commentary: "The Mini-Capstone for the Glow build, though more of a reward for a build that can consistently Infuse Dark. Note you only get the Advantage on your attacks on the turn you activate the Glow, AND if the target is Muddled — this is a parasitic effect, which is fine but will absolutely tax your Dark for almost any other source. The Bottom is pretty wordy — Move 2 that can cleanse negative conditions, and the odd Wild Element generation after a Glow. Colorful Wavelengths given the nod here from both a competitive and fun perspective — Shadow Claws is a little below par compared to other Level 5 options."
    },
    {
      id: "encompassing-aura",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/LU/cs-encompassing-aura.jpeg",
      name: "Encompassing Aura",
      level: "6",
      initiative: 11,
      cardNum: 235,
      tags: ["aoe", "loss"],
      builds: ["support"],
      top: {
        text: "Shield 1 and Retaliate 1 · Affect self and all allies in the depicted area · Ice consumption: +1 Shield · Dark consumption: +1 Retaliate (Loss)",
        isLoss: true
      },
      bottom: {
        text: "IMMOBILIZE · Target all adjacent enemies · Dark consumption: WOUND all adjacent enemies · Move 2 · Fire consumption: Move 2",
        isLoss: false
      },
      commentary: "The Top looks a lot like a Glow ability (it's not) and also looks like it would only affect allies — it affects us too. On a base level without element consumption very unexciting, but Ice makes this a pretty powerful defensive tool for the Support style — giving out 6-8 Shields cumulatively with a bonus little Melee Retaliate. The glue of this card is the nice little 11 Initiative which is actually a huge boon for both halves. The Bottom is sort of reminiscent of Shining Diversion Bottom with stronger Conditions but requires elements. Between the two halves this card asks for all 4 elements the Luminary cares about and I'd argue the Fire and Ice Consumptions are powerful effects worth wanting quite often."
    },
    {
      id: "imposing-brilliance",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/LU/cs-imposing-brilliance.jpeg",
      name: "Imposing Brilliance",
      level: "6",
      initiative: 86,
      cardNum: 236,
      tags: ["scuttle", "aoe"],
      builds: ["bruiser"],
      top: {
        text: "Attack 3 · AoE hex pattern · If a target occupies the hex, add the condition shown to the attack · You may Move 1 into any depicted black hex; if you do, generate Dark.",
        isLoss: false
      },
      bottom: {
        text: "Move 3 · If you end this movement adjacent to at least one enemy, generate Fire · If you end adjacent to at least one ally, generate Ice · If you end in the same hex you started in, generate Light",
        isLoss: false
      },
      commentary: "Borrows from other Crimson Scales classes with Conditions on Hex Arrays for specific Hexes — very interesting. It's also a nice little Side Scuttle to produce the often desired Dark Infusion, and the Conditions inflicted are good — Immobilize in the back with Poison in the front for allies. Attack 3 is definitely a bit on the low side here, and the exact formation to hit all 3 isn't guaranteed. Initiative 86 is a good late one — our Initiatives were really rough in the first few levels. The Bottom Move 3 that will generate one Element and Infuse two a decent portion of the time is fantastic — easily generating 2 elements makes it easy to get the third via a Top Scuttle, and with items it's not impossible to get all 4 for big Wavelengths the following turn."
    },
    {
      id: "gamma-energy",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/LU/cs-gamma-energy.jpeg",
      name: "Gamma Energy",
      level: "7",
      initiative: 65,
      cardNum: 237,
      tags: ["glow", "aoe", "loss"],
      builds: ["both"],
      top: {
        text: "Glow — During your turn: Fire consumption: All enemies in the targeted area suffer 2 damage · AoE hex pattern · XP when another Glow is played, discard this card.",
        isLoss: false
      },
      bottom: {
        text: "Consume all Strong or Waning elements · Attack X · Range 3 · Target X where X equals number of elements consumed. (Loss)",
        isLoss: true
      },
      commentary: "The first big payoff for the Glow build — the first one that made the reviewer look at it and say 'Damn, did I choose the wrong build?' True damage is always fantastic to access, and 4-6 damage a pop is the kind of Glow that makes you want to turn it on early and keep firing on all cylinders throughout the rest cycle. The Initiative 65 is right on the edge between unexciting and fine. The Bottom is a super spicy Loss — the only real Ranged Attack in the base kit, wildly varying in damage somewhere between Attack 9 and 36 in the absolutely perfect world. Fine and fun at 4 elements, very powerful above that. This card is absolutely fine to take irrespective of build as long as you are comfortable with your Fire Infusion."
    },
    {
      id: "drawn-into-the-light",
      imageUrl: "https://raw.githubusercontent.com/any2cards/worldhaven/master/images/milestone-ability-cards/trail-of-ashes/toa-msa-luminary.png",
      name: "Drawn into the Light",
      level: "M",
      initiative: 47,
      cardNum: 682,
      tags: ["glow", "loss"],
      builds: ["both"],
      top: {
        text: "Attack 3 · Range 2 · PULL 1 · Ice consumption: +2 Range, +2 PULL, XP · Dark consumption: +1 Attack, generate Wild Element",
        isLoss: false
      },
      bottom: {
        text: "You may have two Glow cards active at once. When a third is played, move one of the others to the discard pile. · Generate Wild Element, XP (Persistent Loss)",
        isLoss: true
      },
      commentary: "A fantastic addition to the Luminary's arsenal. The Top is the class's only non-Loss Ranged Attack period — absolutely going to be valuable in situations where you simply cannot get within Melee range. Attack 3 Range 2 Pull 1 is a little below par, but both element consumptions boost this to very respectable range, with the +1 Attack actually making this an elemental Conversion for next turn. The Bottom is what frankly shocked the reviewer — having two Glows active simultaneously feels right at home as a nice option to have in your back pocket. As an M card everyone will eventually get it, so you don't have to 'spend' anything to get it. If heading towards a Glow-heavy build this unlocks running 2 Glows at once, and the Wild Element Infusion means you can immediately utilize your second Glow on the next turn!"
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
    {
      category: "Elements",
      text: "Dark is your best element by a wide margin — it enhances Stun (Chilling Wave), Immobilize (Radiant Glare/Blackened Rage), extra targets (Frosty Glimmer), and powers Darkened Overcast. Build your play around having Dark available as often as possible."
    },
    {
      category: "Glow abilities",
      text: "Glow abilities are best played on Turn 1 or between rooms — they produce a different element when placed into your Active Area, and activating them mid-combat by taking a turn off is awkward. Plan your Glow usage carefully at the start of each room."
    },
    {
      category: "Movement",
      text: "This class struggles with movement. You're purely Melee and need to reach your enemies, but many of your cards are Move 2 Infuse actions. Boots of Striding is almost mandatory — you will have very mopey turns if you only have a Move 2 or two each rest cycle."
    },
    {
      category: "Initiative",
      text: "Initiative Control is a constant problem. You only have two cards that can guarantee going before most monsters (Solid Light at 12, Darkened Overcast at 10). Plan your Initiative weaving carefully — the class has a lot of 30-80 range cards that give you middling options."
    },
    {
      category: "Scuttle",
      text: "Scuttle moves you into a black hex depicted on AoE cards after your attack, letting you infuse a specific element for free. You resolve the Attacks first, then decide whether to Scuttle — so you always have complete information before committing. The hex must be empty and reachable."
    },
    {
      category: "Builds",
      text: "The Bruiser/Scuttle build focuses on AoE attacks with element consumption bonuses. The Glow/Support build focuses on Glow abilities that Heal, Shield, and Strengthen allies. Radiant Glare (Move 2 Infuse Dark) and Flickering Lights (Heal 2 Self Loot 1) are core to both."
    },
    {
      category: "Perks",
      text: "Start with the -1 to +0 Infuse replacement perks first — they thin your deck and give you element generation. Then go for the Remove 4 -1 cards perk. Avoid the AoE Poison perk initially as it will typically only hit 1-2 targets."
    },
    {
      category: "Losses",
      text: "Oddly, the Luminary's Loss Attacks are often better and more consistent than the non-Loss ones when you have the right element consumptions. Don't be afraid to use your Loss Tops — the class has 11 cards and solid HP to sustain longer campaigns without them."
    },
    {
      category: "Items",
      text: "Focus on movement items (Boots of Striding) and elemental Infusion items early. This class likes gold a lot — Flickering Lights' Loot + Wild Element rider helps fund your enhancements and items. AoE-friendly weapons (those that work with hex patterns) are preferred over single-target weapons."
    },
    {
      category: "Milestone",
      text: "Everyone gets Drawn into the Light eventually — it requires 10 checkmarks toward your personal goal. Prioritize completing it as the double-Glow ability from the Bottom is a significant upgrade for the Support build, and the Ranged Attack is invaluable in scenarios where reaching Melee isn't possible."
    }
  ]
};
