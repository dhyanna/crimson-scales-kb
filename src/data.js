// data.js — Inox Chainguard class data for Crimson Scales Knowledge Base

const CHAINGUARD_DATA = {
  id: "chainguard",
  name: "Inox Chainguard",
  symbol: "Chained Helmet",
  game: "Crimson Scales",
  startingHP: 10,
  handSize: 10,
  builds: ["bruiser", "trap"],

  milestone: {
    xws: "chainguardmilestone",
    points: 20,
    imageUrl: "https://raw.githubusercontent.com/any2cards/worldhaven/master/images/milestones/crimson-scales/cs-ms-chainguard-front.png",
    reward: "Rope Pit — a Level M ability card added to your hand permanently once the milestone is complete.",
    commentary: "Goal: Kill a Shackled enemy 10 times. This plays directly into the Chainguard's core loop — Shackle a target, beat it down, and finish it off. The Bruiser build completes this naturally since Shackle is your primary mechanic from turn one. The Trap build takes longer since you're more focused on controlling enemies through traps, but any kill on a Shackled enemy counts regardless of what dealt the killing blow. Once complete, Rope Pit is added permanently — a game-changer for the Trap build that lets you create a Range 2 trap that auto-Shackles when triggered."
  },

  cards: [
    {
      id: "chokehold",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CG/cs-chokehold.jpeg",
      name: "Chokehold",
      level: "1",
      initiative: 22,
      cardNum: 60,
      tags: ["shackle"],
      builds: ["bruiser"],
      top: {
        text: "Shackle one adjacent enemy. On your next three attacks targeting a Shackled enemy, add +X Attack where X is equal to the value shown (+2 / +2 / +3).",
        isLoss: false
      },
      bottom: {
        text: "Move 4 · One adjacent Shackled enemy suffers 1 damage.",
        isLoss: false
      },
      commentary: "Chainguard's primary Shackle card at Level 1. The attack bonus accumulates to 7 extra damage over three hits — well distributed and somewhat insulated from Nulls. The Move 4 bottom is excellent and almost never worth cutting."
    },
    {
      id: "drag-through-dirt",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CG/cs-drag-through-dirt.jpeg",
      name: "Drag Through Dirt",
      level: "1",
      initiative: 30,
      cardNum: 61,
      tags: ["shackle", "swing"],
      builds: ["trap"],
      top: {
        text: "SWING 3 · Target one adjacent enemy. Add MUDDLE if the Attack 3 hits.",
        isLoss: false
      },
      bottom: {
        text: "Shackle one adjacent enemy · Move 6 Jump · PULL 6 targeting one Shackled enemy adjacent to the hex you occupied at the start of this action.",
        isLoss: true
      },
      commentary: "Solid Swing top for the Trap build. The bottom is a cool reverse-Scorpion but the Loss cost is steep at 10 cards — normally you just kill the monster rather than drag it 6 hexes away."
    },
    {
      id: "follow-the-chains",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CG/cs-follow-the-chains.jpeg",
      name: "Follow the Chains",
      level: "1",
      initiative: 19,
      cardNum: 62,
      tags: [],
      builds: ["bruiser"],
      top: {
        text: "Attack 3 · PUSH 1 · Add +1 PUSH and gain XP if the target is Shackled.",
        isLoss: false
      },
      bottom: {
        text: "Move 2 · This movement must end adjacent to a Shackled enemy.",
        isLoss: false
      },
      commentary: "Two solid medium-value actions that bundle nicely. The bottom shines in Rest Cycles where you let it free your other action for damage mitigation, trap-placing, or extra movement."
    },
    {
      id: "locking-links",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CG/cs-locking-links.jpeg",
      name: "Locking Links",
      level: "1",
      initiative: 41,
      cardNum: 63,
      tags: ["shackle", "trap"],
      builds: ["both"],
      top: {
        text: "Attack 2 · Shackle · At the start of each of the target's turns, if it is adjacent to you and Shackled, it suffers 1 damage. (Active)",
        isLoss: false
      },
      bottom: {
        text: "Create a 2 damage trap in an adjacent empty hex.",
        isLoss: false
      },
      commentary: "Glue card for Level 1 — both builds want it. The persistent True Damage clock on the top is excellent against Shielded targets and stacks with Wound. The 2-damage Trap bottom is almost always better than a Bottom Attack 2 since it deals True Damage and ignores Shields."
    },
    {
      id: "merciless-beatdown",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CG/cs-merciless-beatdown.jpeg",
      name: "Merciless Beatdown",
      level: "1",
      initiative: 26,
      cardNum: 64,
      tags: ["loss"],
      builds: ["bruiser"],
      top: {
        text: "Attack 3 · Add +2 Attack for each enemy adjacent to the target.",
        isLoss: true
      },
      bottom: {
        text: "Force one adjacent Shackled enemy to perform Attack 3 targeting an enemy adjacent to it, with you controlling the ability.",
        isLoss: false
      },
      commentary: "A tried-and-true situational Loss top that can scale to Attack 5–9+. The bottom forces Shackled enemies to attack each other — conditional but comes up regularly enough to matter, and fun when it works."
    },
    {
      id: "rusty-spikes",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CG/cs-rusty-spikes.jpeg",
      name: "Rusty Spikes",
      level: "1",
      initiative: 18,
      cardNum: 65,
      tags: ["shackle", "trap"],
      builds: ["trap"],
      top: {
        text: "Create a 3 damage POISON trap in an adjacent empty hex.",
        isLoss: false
      },
      bottom: {
        text: "Move 2 · Shackle one adjacent enemy.",
        isLoss: false
      },
      commentary: "Fast Initiative 18 lets Poison land before allies attack, maximizing damage on the afflicted target. Excellent against Shielded or tough targets. The bottom Move 2 Shackle is a staple — don't cut this card early."
    },
    {
      id: "slamming-shove",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CG/cs-slamming-shove.jpeg",
      name: "Slamming Shove",
      level: "1",
      initiative: 25,
      cardNum: 66,
      tags: ["loss"],
      builds: [],
      top: {
        text: "Attack 3 · PUSH 2 · Move 2 · Attack 3.",
        isLoss: true
      },
      bottom: {
        text: "Move 2 · Heal 2 Self",
        isLoss: false
      },
      commentary: "The Bottom Move 2 Heal 2 is the main draw — great for lone-melee parties or groups lacking healing options. The top is a borderline Loss. A flex pick depending on party composition; consider it if your party lacks reliable healing."
    },
    {
      id: "spiked-knuckles",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CG/cs-spiked-knuckles.jpeg",
      name: "Spiked Knuckles",
      level: "1",
      initiative: 66,
      cardNum: 67,
      tags: [],
      builds: ["bruiser"],
      top: {
        text: "Attack 2 · WOUND · Add +1 Attack and gain XP if the target is Shackled. (Active rolling Retaliate)",
        isLoss: false
      },
      bottom: {
        text: "Move 3 · Add PIERCE 1 to all your attacks targeting Shackled enemies this round.",
        isLoss: false
      },
      commentary: "A reasonable inclusion — an Attack 3 Wound equivalent when targeting a Shackled enemy. The bottom Pierce helps against Shielded Shackled targets. Initiative 66 is slow but workable; class has no real issues with XP when using Shackled targets."
    },
    {
      id: "untouchable-keeper",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CG/cs-untouchable-keeper.jpeg",
      name: "Untouchable Keeper",
      level: "1",
      initiative: 14,
      cardNum: 59,
      tags: [],
      builds: ["both"],
      top: {
        text: "Shield 1 Self · Shackled enemies treat you as if you have INVISIBLE this round. (Active, Loss)",
        isLoss: false
      },
      bottom: {
        text: "Heal 3 Self (XP)",
        isLoss: false
      },
      commentary: "Your fastest card all the way to Level 5. The top is your main early damage avoidance — Shackled enemies can't target you, giving you Shield against everything else. The Heal 3 bottom with XP is your primary self-heal at Level 1. Almost never cut."
    },
    {
      id: "wrapped-in-metal",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CG/cs-wrapped-in-metal.jpeg",
      name: "Wrapped in Metal",
      level: "1",
      initiative: 82,
      cardNum: 68,
      tags: [],
      builds: ["both"],
      top: {
        text: "STUN · Range 2 · PULL 1 · Shackle (Loss)",
        isLoss: false
      },
      bottom: {
        text: "Move 3 · PULL 3 targeting one Shackled enemy adjacent to the hex you occupied at the start of this action.",
        isLoss: false
      },
      commentary: "An unconditional Ranged Stun that also Pulls and Shackles — an absolute powerhouse. Your only very slow Initiative tool. Always play this as your leading Initiative card on turns you use the Top. Repeatedly saves the party on key turns; don't consider cutting before Level 5."
    },
    {
      id: "ganging-up",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CG/cs-ganging-up.jpeg",
      name: "Ganging Up",
      level: "X",
      initiative: 74,
      cardNum: 69,
      tags: ["shackle"],
      builds: ["bruiser"],
      top: {
        text: "Attack 2 · Shackle · Force one adjacent Shackled enemy to perform Attack 2 targeting an enemy adjacent to it, with you controlling the ability.",
        isLoss: false
      },
      bottom: {
        text: "One adjacent ally may perform Attack 3 targeting a Shackled enemy adjacent to you.",
        isLoss: false
      },
      commentary: "Doesn't feel like an X card — both halves are normal Chainguard actions. Two Attack 2s is typically better than Attack 4, and having monsters with Retaliate beat each other up is always satisfying. The bottom enhancement pip is conducive to Poison or similar."
    },
    {
      id: "roundhouse-swing",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CG/cs-roundhouse-swing.jpeg",
      name: "Roundhouse Swing",
      level: "X",
      initiative: 79,
      cardNum: 70,
      tags: ["shackle", "loss", "swing"],
      builds: ["bruiser"],
      top: {
        text: "Loot 1 · You may forgo the Loot ability to perform: Shackle and SWING 3 Range 3, Loot each hex the target enters. (Active)",
        isLoss: false
      },
      bottom: {
        text: "Move 3 · Add +2 SWING to your next Swing ability this round, then discard this card.",
        isLoss: false
      },
      commentary: "A solid X card that serves as Loot 2.0. The flexible Shackle+Swing+Loot combo works in many situations. Initiative 79 adds welcome variety to a deck that skews fast. The bottom +2 Swing rarely matters since most Swings are already Ranged."
    },
    {
      id: "vigorous-sway",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CG/cs-vigorous-sway.jpeg",
      name: "Vigorous Sway",
      level: "X",
      initiative: 52,
      cardNum: 71,
      tags: ["shackle", "swing"],
      builds: ["trap"],
      top: {
        text: "Shackle and SWING 3 Range 2 · If you cannot swing the target into a hex because of an obstacle or wall, the target suffers 2 damage and you gain XP. (Active)",
        isLoss: false
      },
      bottom: {
        text: "Move 3 · Shackle one adjacent enemy · Create a 3 damage STUN trap in an adjacent empty hex.",
        isLoss: true
      },
      commentary: "Top is 2 True Damage + XP when walls are nearby — decent success rate in practice. Initiative 52 is terrible for this class. Bottom is a nice last-room Loss play — Move, Shackle, heavy Stun trap — and was a fairly common final room play for our Chainguard."
    },
    {
      id: "agonizing-clamp",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CG/cs-agonizing-clamp.jpeg",
      name: "Agonizing Clamp",
      level: "2",
      initiative: 57,
      cardNum: 72,
      tags: ["shackle", "swing"],
      builds: ["bruiser", "trap"],
      top: {
        text: "Shackle one adjacent enemy · Attack 4 targeting one adjacent Shackled enemy.",
        isLoss: false
      },
      bottom: {
        text: "Move 3 · SWING 3 targeting one adjacent enemy.",
        isLoss: false
      },
      commentary: "Two-in-one Shackle + Attack 4 is great — Attack 4 is a real upgrade at Level 2. Initiative 57 is a drag. Iron Thrust edges it for the Jump on the Bottom, but Agonizing Clamp's Bottom is the better Trap build Bottom since Move 3 Swing 3 pairs well with Top trap-placement actions."
    },
    {
      id: "iron-thrust",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CG/cs-iron-thrust.jpeg",
      name: "Iron Thrust",
      level: "2",
      initiative: 38,
      cardNum: 73,
      tags: [],
      builds: ["both"],
      top: {
        text: "Attack 3 · PUSH 3 · You may push the target through hexes occupied by your allies. In each case, the ally may perform an 'Attack 2' ability targeting that enemy; if they do, the ally gains MUDDLE. XP unconditional.",
        isLoss: false
      },
      bottom: {
        text: "Move 3 Jump · Shackle one enemy moved through with the Move ability.",
        isLoss: false
      },
      commentary: "Top enables nice trap-delivery combos and ally chain attacks. Bottom Move 3 Jump Shackle is excellent — Jump is surprisingly scarce on this class and critically important for positioning Swings and Push/Pull plays. Both builds want this card."
    },
    {
      id: "latch-and-tow",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CG/cs-latch-and-tow.jpeg",
      name: "Latch and Tow",
      level: "2",
      initiative: 81,
      cardNum: 74,
      tags: ["shackle"],
      builds: ["trap"],
      top: {
        text: "PULL 3 · Shackle · Range 4 · If a trap is sprung by the target of the Pull ability, the target suffers 3 damage, gains MUDDLE, and you gain XP.",
        isLoss: false
      },
      bottom: {
        text: "PULL 4 Self towards one enemy within Range 5 · If you end the Pull ability adjacent to the targeted enemy, Shackle and MUDDLE the target.",
        isLoss: false
      },
      commentary: "Core Trap build card. The top makes all your traps deal minimum 5 True Damage + Muddle + XP. This combo with Dizzying Release bottom results in 7 True Damage + Wound + Muddle + 2 XP. The bottom self-Pull Shackle is niche but useful when you need to reposition toward a specific enemy."
    },
    {
      id: "sweeping-collision",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CG/cs-sweeping-collision.jpeg",
      name: "Sweeping Collision",
      level: "3",
      initiative: 20,
      cardNum: 75,
      tags: ["shackle", "swing"],
      builds: ["both"],
      top: {
        text: "Shackle and SWING 4 targeting one adjacent enemy · Attack 3 targeting the enemy targeted with the Swing ability and one enemy the target moved through.",
        isLoss: false
      },
      bottom: {
        text: "You and all allies gain PIERCE 2 on all your attacks targeting Shackled enemies · While Shackled, enemies lose Flying.",
        isLoss: true
      },
      commentary: "Top is roughly a double Attack 3 with True Damage on the moved-through enemy. Bottom is huge for both builds — Pierce 2 for the entire party plus grounding Fliers, which is a major weakness of this class. Initiative 20 is excellent. Both builds want this card."
    },
    {
      id: "dizzying-release",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CG/cs-dizzying-release.jpeg",
      name: "Dizzying Release",
      level: "4",
      initiative: 24,
      cardNum: 76,
      tags: ["swing"],
      builds: ["trap"],
      top: {
        text: "SWING 6 targeting one Shackled enemy · At any point during the ability, you may perform 'PUSH 3' targeting the Shackled enemy · Attack X where X is equal to the number of hexes the enemy moved with this action.",
        isLoss: true
      },
      bottom: {
        text: "Create a 3 damage WOUND trap in an adjacent empty hex · If the trap is sprung by a Shackled enemy, remove Shackle from the enemy, discard this card, and it suffers 1 additional damage.",
        isLoss: false
      },
      commentary: "Top is Attack 5–7 in practice — good but not worth it as a Level 4 Loss in isolation. The bottom Wound Trap is the real draw: paired with Latch and Tow Top, you get 7 True Damage + Wound + Muddle + 2 XP with essentially no setup. Core Trap build card."
    },
    {
      id: "double-ko",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CG/cs-double-ko.jpeg",
      name: "Double K.O.",
      level: "4",
      initiative: 92,
      cardNum: 77,
      tags: [],
      builds: ["bruiser"],
      top: {
        text: "Attack 4 · If this attack kills the target, perform 'Attack 4' and gain XP.",
        isLoss: false
      },
      bottom: {
        text: "Move 3 · Double the value of your next attack.",
        isLoss: false
      },
      commentary: "Top Attack 4×2 is excellent with good modifiers — both Attack 4s can be enhanced. Initiative 92 is a great selling point; very late Initiative is valuable for a class that otherwise lacks it. Most Chainguards play this as the Top 95% of the time. Bruiser builds prefer this; Trap builds lean Dizzying Release."
    },
    {
      id: "impending-power",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CG/cs-impending-power.jpeg",
      name: "Impending Power",
      level: "5",
      initiative: 12,
      cardNum: 78,
      tags: ["loss"],
      builds: ["both"],
      top: {
        text: "On the next five attacks targeting you this round, gain Shield 2 or Retaliate 1 for the attack. At the end of the round, perform 'Heal X Self', where X is equal to the number of untriggered spaces.",
        isLoss: false
      },
      bottom: {
        text: "Whenever you may create a trap in an adjacent hex, you may create the trap in an empty hex within Range 2 instead · Whenever you cause an enemy to spring a trap during your turn, that enemy suffers 2 damage.",
        isLoss: true
      },
      commentary: "The mini-capstone that both builds want. The Top solves the feel-bad of temporary defensive cards — if monsters don't attack you, you Heal 5. The Bottom extends all trap placement to Range 2 and adds 2 bonus damage on every spring. Initiative 12 becomes your fastest card after this point."
    },
    {
      id: "tighten-the-chains",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CG/cs-tighten-the-chains.jpeg",
      name: "Tighten the Chains",
      level: "5",
      initiative: 17,
      cardNum: 79,
      tags: ["loss"],
      builds: ["bruiser"],
      top: {
        text: "Attack 4 · Add +1 Attack and gain XP if the target is Shackled · Retaliate 1 Self, only applies to attacks by Shackled enemies. (Active)",
        isLoss: false
      },
      bottom: {
        text: "At the end of each of your turns, you may perform 'PULL 1 Range 2' targeting one Shackled enemy.",
        isLoss: true
      },
      commentary: "Pales next to Impending Power. The top is Attack 4 with very conditional Retaliate flavor text. The bottom persistent Pull is numerically weak — it's really only a Move 1 most of the time. Both builds almost universally take Impending Power instead."
    },
    {
      id: "suffering-steel",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CG/cs-suffering-steel.jpeg",
      name: "Suffering Steel",
      level: "6",
      initiative: 9,
      cardNum: 80,
      tags: ["loss"],
      builds: ["bruiser"],
      top: {
        text: "Retaliate 4 Self · Ignore all sources of damage from attacks targeting you by Shackled enemies this round.",
        isLoss: true
      },
      bottom: {
        text: "Move 3 · Retaliate 2 Self (Active)",
        isLoss: false
      },
      commentary: "Initiative 09 is the second fastest on the class. The top Retaliate 4 + damage immunity from your Shackled target is thematic but feels like a lot to ask for a Level 6 Loss. Making this Ranged would have elevated it significantly. The bottom Move 3 Retaliate 2 is solid if unexciting."
    },
    {
      id: "titanic-chainwhip",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CG/cs-titanic-chainwhip.jpeg",
      name: "Titanic Chainwhip",
      level: "6",
      initiative: 29,
      cardNum: 81,
      tags: ["shackle"],
      builds: ["both"],
      top: {
        text: "Attack 4 · Range 3 · PULL 2 · Shackle",
        isLoss: false
      },
      bottom: {
        text: "PULL 4 · Range 5 · WOUND · Shackle",
        isLoss: false
      },
      commentary: "Your only real Ranged option and it does not disappoint. The top Attack 4 Pull 2 Shackle is your most consistent trap setup action. The bottom long-range Pull Wound Shackle is the simplest way to trigger a top Trap in the same turn. Default pick for both builds at Level 6."
    },
    {
      id: "clamping-snare",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CG/cs-clamping-snare.jpeg",
      name: "Clamping Snare",
      level: "7",
      initiative: 27,
      cardNum: 82,
      tags: ["trap"],
      builds: ["trap"],
      top: {
        text: "Create a 5 damage MUDDLE trap in an adjacent empty hex · When the trap is sprung, all enemies adjacent to the trap suffer 2 damage, then discard this card.",
        isLoss: false
      },
      bottom: {
        text: "Move 4 · Shield 3 Self, only applies to attacks by Shackled enemies. (Active)",
        isLoss: false
      },
      commentary: "The first real AoE Trap — 5 True Damage + Muddle + 2 splash damage is huge game, often 7–11 total True Damage. The bottom Move 4 Shield 3 is massive defensive upside. A landmark Level 7 card for the Trap build. Bruiser builds lean toward Meteor Hammer instead."
    },
    {
      id: "meteor-hammer",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CG/cs-meteor-hammer.jpeg",
      name: "Meteor Hammer",
      level: "7",
      initiative: 45,
      cardNum: 83,
      tags: [],
      builds: ["bruiser"],
      top: {
        text: "Attack 5 · Add DISARM and gain XP if the target is Shackled.",
        isLoss: false
      },
      bottom: {
        text: "Move 3 · During all your attacks against Shackled enemies this round, ignore the Shield value of the target.",
        isLoss: false
      },
      commentary: "Top Disarm via Shackle is excellent mitigation — easy to set up on this class. The bottom Shield Ignore addresses a core class weakness; often results in +2–3 effective damage against high-Shield enemies. Initiative 45 is awful for a Disarm. Bruiser builds prefer this; Trap builds take Clamping Snare."
    },
    {
      id: "pivot-and-smash",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CG/cs-pivot-and-smash.jpeg",
      name: "Pivot and Smash",
      level: "8",
      initiative: 28,
      cardNum: 84,
      tags: ["shackle", "swing"],
      builds: ["trap"],
      top: {
        text: "SWING 4 targeting one enemy within 2 hexes · One enemy the target moves through suffers 2 damage · Attack 5 targeting the enemy targeted with the Swing ability.",
        isLoss: false
      },
      bottom: {
        text: "Move 4 Jump · Shackle one enemy moved through with the Move ability · PULL 3 targeting one Shackled enemy.",
        isLoss: false
      },
      commentary: "Top is roughly 7 True Damage with a nice Swing 4 and triggers traps. Trap build favors this at Level 8. The bottom Move 4 Jump Shackle + Pull is superb utility for both builds — Jump continues to be incredibly valuable on this class."
    },
    {
      id: "syndicated-assault",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CG/cs-syndicated-assault.jpeg",
      name: "Syndicated Assault",
      level: "8",
      initiative: 68,
      cardNum: 85,
      tags: ["swing"],
      builds: ["bruiser"],
      top: {
        text: "SWING 6 Range 3 · The target may move through your allies with this ability. All allies moved through may immediately perform an 'Attack 3' ability targeting that enemy.",
        isLoss: false
      },
      bottom: {
        text: "Move 2 · Attack 3 targeting all adjacent enemies.",
        isLoss: false
      },
      commentary: "Top can reach Attack 9–15 in parties with summons or multiple allies — truly excellent ceiling for the Bruiser build. The bottom AoE Attack 3 is a rare and very welcome option for a class that fundamentally struggles with hitting multiple targets. Bruiser builds strongly prefer this."
    },
    {
      id: "champion-of-chains",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CG/cs-champion-of-chains.jpeg",
      name: "Champion of Chains",
      level: "9",
      initiative: 10,
      cardNum: 86,
      tags: ["shackle", "loss"],
      builds: ["bruiser"],
      top: {
        text: "You may have up to three enemies Shackled at any time. Whenever you Shackle an enemy, that enemy gains WOUND. (Persistent Loss)",
        isLoss: true
      },
      bottom: {
        text: "PULL 2 · Range 3 · Target 3 · Shackle (Active, then discard)",
        isLoss: false
      },
      commentary: "Groundbreaking. Three simultaneous Shackles plus Wound on each Shackle fundamentally changes the class — breathing room for your whole party. Near-instant setup on Turn 1, as this is your second fastest Initiative card. The Bottom is overkill once Top is active but excellent forced movement for Trap-heavy scenarios."
    },
    {
      id: "unending-torment",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CG/cs-unending-torment.jpeg",
      name: "Unending Torment",
      level: "9",
      initiative: 33,
      cardNum: 87,
      tags: [],
      builds: ["trap"],
      top: {
        text: "Whenever you cause a Shackled enemy to spring a damage trap during your turn, that enemy suffers double the damage value of the trap. (Persistent Loss)",
        isLoss: false
      },
      bottom: {
        text: "Force one Shackled enemy to perform Move 3 with you controlling the ability · Shackled enemies suffer 1 damage each time they are targeted with an attack this round. (Active)",
        isLoss: false
      },
      commentary: "Double Trap damage is the Trap build victory lap — makes your 5-damage traps deal 10, your 3-damage Locking Links deal 6 per turn. The bottom forced movement + damage amplifier is a nice coordination tool. Level 9 Trap builds almost certainly take this."
    },
    {
      id: "rope-pit",
      imageUrl: "https://raw.githubusercontent.com/any2cards/worldhaven/master/images/milestone-ability-cards/trail-of-ashes/toa-msa-chainguard.png",
      name: "Rope Pit",
      level: "M",
      initiative: 32,
      cardNum: 677,
      tags: ["shackle", "trap"],
      builds: ["both"],
      top: {
        text: "Create a 3 damage trap in an adjacent empty hex within Range 2. When the trap is sprung by an enemy, perform 'PULL 3, Shackle' targeting the enemy, then discard this card.",
        isLoss: false
      },
      bottom: {
        text: "Move one trap within Range 2 to a different empty hex within Range 2. Move 4.",
        isLoss: false
      },
      commentary: "The Milestone card and a game-changer for low-level Trap builds. The top gives you a free Shackle whenever the trap triggers — meaning you don't need to spend a card action setting up Shackle before your trap turn. This lets your other actions focus entirely on damage. The bottom Move 4 with trap repositioning is excellent utility — move a pre-placed trap to exactly where you need it and still get your full movement. Even Bruiser builds will likely keep this for most of their career."
    }
  ],

  perks: [
    { count: 2, text: 'Replace one +1 card with one +1 "Shackle" card' },
    { count: 2, text: 'Replace one +0 card with one "+2 if the target is Shackled" card' },
    { count: 1, text: 'Replace two +0 cards with one rolling "Shield 1, Self" card' },
    { count: 1, text: 'Add two rolling "Retaliate 1, Self" cards' },
    { count: 1, text: 'Add three rolling SWING 3 cards' },
    { count: 1, text: 'Replace one +1 card with one +2 WOUND card' },
    { count: 1, text: 'Add one +1 "DISARM if the target is Shackled" card' },
    { count: 1, text: 'Add one +1 "Create a 2 damage trap in an empty hex within Range 2" card' },
    { count: 1, text: 'Add two rolling "Heal 1, Self" cards' },
    { count: 2, text: 'Add one +2 "Shackle" card' },
    { count: 1, text: 'Ignore negative item effects and remove one +0 card' }
  ],

  tips: [
    {
      category: "Initiative",
      text: "Initiative Control is critical. Your deck skews heavily 10–60 — plan which fast cards to lead with each round. Hold Wrapped in Metal (Init 82) as your emergency Stun; going slow is often worth it when something dangerous is about to activate."
    },
    {
      category: "Shackle",
      text: "Shackle is abundant — it appears on many cards and several perks. Don't panic about maintaining a Shackled target; you'll almost always have access to one. Focus on which enemy to Shackle, not whether you can."
    },
    {
      category: "Trap build",
      text: "Traps deal True Damage and completely ignore Shields. Against high-Shield enemies the Trap build significantly outperforms the Bruiser build — a 3-damage Trap is effectively better than a 5-damage attack against a Shield 2 enemy."
    },
    {
      category: "Perks",
      text: "Remove -1 cards with your first perks. Then prioritize the rolling +1 Shackle cards or rolling Swing 3 cards. The Free 2 Damage Trap perk (+1 'Create a 2 damage trap within Range 2') is excellent for both builds — even Bruisers trigger traps frequently."
    },
    {
      category: "Traps vs. attacks",
      text: "Locking Links Bottom (2-damage Trap) is almost always better than a Bottom Attack 2. It deals True Damage, ignores Shields and Retaliate, stacks with Wound, and is consistent round after round."
    },
    {
      category: "Card management",
      text: "Untouchable Keeper (Init 14) is your fastest card and your primary self-Heal at Level 1. Almost never cut it early — you need both what it does and its Initiative number."
    },
    {
      category: "Positioning",
      text: "Jump is scarce at Level 1. Prioritize Iron Thrust or Agonizing Clamp at Level 2 to address this gap — positioning is critical for setting up Swings, Push/Pull combos, and trap triggers."
    },
    {
      category: "Milestone card",
      text: "Rope Pit (Milestone card) is huge for low-level Trap builds. A Range 2 trap that auto-Shackles on trigger lets you maintain momentum without spending a card action on Shackle setup."
    },
    {
      category: "Boss fights",
      text: "Many bosses are immune to Immobilize (and thus Shackle). Lean on the non-Shackle halves of your cards in these scenarios. The Trap build naturally handles bosses better, since True Damage bypasses most defensive abilities."
    },
    {
      category: "Party composition",
      text: "The class comes into its own at Level 5 when Impending Power is available. Before then, lean on your allies to deal damage while you control the battlefield with Shackle, Stuns, and trap setups."
    }
  ]
};
