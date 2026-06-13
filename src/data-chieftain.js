// data-chieftain.js — Orchid Chieftain (Tusks) class data for Crimson Scales KB
// Guide sources: Magatis on Imgur (July 2022) + anonymous guide (March 2021), aggregated

const CHIEFTAIN_DATA = {
  id: "chieftain",
  name: "Orchid Chieftain",
  symbol: "Tusks",
  game: "Crimson Scales",
  startingHP: 8,
  handSize: 10,
  builds: ["dps", "tank"],

  milestone: {
    xws: "chieftainmilestone",
    points: 10,
    imageUrl: "https://raw.githubusercontent.com/any2cards/worldhaven/master/images/milestones/crimson-scales/cs-ms-chieftain-front.png",
    reward: "Call of the Wild — a Level M ability card added to your hand permanently once the milestone is complete.",
    commentary: "The Orchid Chieftain milestone requires accumulating 10 checkmarks toward the personal goal shown on the milestone card front. Once complete, Call of the Wild is added permanently — a powerful card that fits naturally into both the DPS and Tank builds, enhancing your Summon and Mount capabilities."
  },

  cards: [
    {
      id: "catastrophic-cattle",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CT/cs-catastrophic-cattle.jpeg",
      name: "Catastrophic Cattle",
      level: "1",
      initiative: 88,
      cardNum: 88,
      tags: ["summon", "mount"],
      builds: ["both"],
      top: {
        text: "Summon Fighting Bull: HP 4, Move 2, Attack 2, Push 1 — Mount. While controlling/Mounting: Push 1 is optional.",
        isLoss: true
      },
      bottom: {
        text: "Move 3 · Generate Earth",
        isLoss: false
      },
      commentary: "My wife's personal favorite and the most reliable general-purpose Mount. The Fighting Bull is the most consistent Summon at Level 1 with solid Attack 2 stats. The optional Push 1 while Mounted is a nice bonus. The Bottom Move 3 Infuse Earth is the only Earth generation the class gets besides Skinning Knife at Level 1 — budget one Earth Consumption per rest cycle and don't play more than two cards with Earth Consumption often. Initiative 88 is a standard Summoning number to keep your new friend safe."
    },
    {
      id: "outrun-the-enemy",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CT/cs-outrun-the-enemy.jpeg",
      name: "Outrun the Enemy",
      level: "1",
      initiative: 87,
      cardNum: 89,
      tags: ["summon", "mount", "command"],
      builds: ["dps"],
      top: {
        text: "Summon Speedy Ostrich: HP 4, Move 3, Attack 1 — Mount. While Mounted on this summon at the start of the round, decrease your leading initiative by 10.",
        isLoss: true
      },
      bottom: {
        text: "One summoned ally performs Move +0 with you controlling the ability. Earth consumption: +2 Move, XP",
        isLoss: false
      },
      commentary: "Wife's #2 pick for general Mount. The −10 Initiative is mandatory while Mounted so you go lightning-fast. Fantastic Move 3 base keeps the Ostrich mobile. The Attack 1 is the only real weakness — every point of damage matters with this class. The Bottom Earth Command Move is a solid way to reposition your other Summons. Both guides agree this is a top-tier Level 1 Summon, though lower Attack means you may want Battle Cattle in parallel for damage."
    },
    {
      id: "piercing-darts",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CT/cs-piercing-darts.jpeg",
      name: "Piercing Darts",
      level: "1",
      initiative: 17,
      cardNum: 90,
      tags: ["mount"],
      builds: ["both"],
      top: {
        text: "Attack 1 · Range 3 · Target 2 · PIERCE 2 · Earth consumption: POISON, XP",
        isLoss: false
      },
      bottom: {
        text: "Gain +1 Attack and PIERCE 1 on all your attack actions this round while mounted on a summon. (Active)",
        isLoss: false
      },
      commentary: "A great staple action Top at Initiative 17 — ran all the way to Level 7 in one playthrough. Range 3 multi-target Pierce 2 is excellent against the very plentiful Shielded monsters in Crimson Scales. Poison on 2 targets with Earth is great, and this is the class's best Earth spender at Level 1. The DPS build relies heavily on this card's Bottom as it levels up with incredible synergies — combine with Ceremonial Dance Bottom for Attack 4 Pierce 1 Target 3 Muddle non-loss. Initiative 17 is one of the class's best and this is a viable card for either build."
    },
    {
      id: "pipe-tomahawk",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CT/cs-pipe-tomahawk.jpeg",
      name: "Pipe Tomahawk",
      level: "1",
      initiative: 26,
      cardNum: 91,
      tags: [],
      builds: ["dps"],
      top: {
        text: "Attack 3 · Range 2 · PIERCE 1 · Generate Fire",
        isLoss: false
      },
      bottom: {
        text: "Move 4",
        isLoss: false
      },
      commentary: "Made the cut for a couple of levels before being replaced. Initiative 26 is fine but not standout. The Top Attack 3 Pierce 1 Range 2 is slightly ahead of curve but Range 2 is awkward — you need to be at exactly the right range to avoid Disadvantage. Fire Infusion helps allies but does nothing for Chieftain. The Bottom Move 4 looks attractive but Chieftain needs very little plain movement since the Mount provides free movement when Mounted. Both guides agree this gets cut by Level 2–4. Keep it early if your party needs Fire Infusion or for its Move 4."
    },
    {
      id: "resurrection",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CT/cs-resurrection.jpeg",
      name: "Resurrection",
      level: "1",
      initiative: 32,
      cardNum: 92,
      tags: ["earth"],
      builds: ["both"],
      top: {
        text: "Attack 3 · Earth consumption: +1 Attack, Advantage, XP",
        isLoss: false
      },
      bottom: {
        text: "Recover up to three of your lost cards. · Generate Earth",
        isLoss: true
      },
      commentary: "The card the class is built around — akin to Reviving Ether for the Spellweaver, but not quite as extreme. The Bottom Recover 3 Lost Cards is what makes this class's Summon Losses sustainable, allowing you to buy back up to 3 Lost cards once per scenario. The class simply cannot function effectively without this at Level 1. The Top is a solid but not spectacular Attack 3 with nice upside. Initiative 32 is fine but beware playing this card on rounds you plan to Short Rest — always long rest when possible on this class. Try to play it as soon as you have 3 good cards worth recovering."
    },
    {
      id: "skinning-knife",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CT/cs-skinning-knife.jpeg",
      name: "Skinning Knife",
      level: "1",
      initiative: 54,
      cardNum: 93,
      tags: ["earth"],
      builds: ["both"],
      top: {
        text: "Attack 3 · Generate Earth · XP",
        isLoss: false
      },
      bottom: {
        text: "Loot 1",
        isLoss: false
      },
      commentary: "Hovered between Cut and Play in most scenarios but always landed in the Play pile for key reasons. The Top is the class's easiest way to Infuse Earth, and without it your only other Earth generation at Level 1 is the bottom of Catastrophic Cattle (which is almost always in play as a Summon). The Top is also a reasonable melee Attack 3 with free XP — one of very few melee Attack Top actions at Level 1. The Bottom Loot leverages the class's mobility well since staying at the frontlines means you can loot fairly easily with your Mount. Budget one Earth per rest cycle."
    },
    {
      id: "slow-and-steady",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CT/cs-slow-and-steady.jpeg",
      name: "Slow and Steady",
      level: "1",
      initiative: 93,
      cardNum: 94,
      tags: ["summon", "mount"],
      builds: ["tank"],
      top: {
        text: "Summon Giant Tortoise: HP 6, Move 1, Attack 1, Shield 1. While Mounted on this summon, you and the summon are immune to forced movement.",
        isLoss: true
      },
      bottom: {
        text: "Attack 2",
        isLoss: false
      },
      commentary: "The tankiest Summon at Level 1 with 6HP and Shield 1 — far the easiest to keep alive, especially since it's also the easiest to Heal. The 1 Move and 1 Attack are significant weaknesses that will very often cause it to get left behind. Best used as the Tank build's main Mount for scenarios where you don't need to move far (defense missions, Boss fights). The Initiative 93 and Bottom Attack 2 save this card — free bottom Attack 2 while Mounted is great for triple-attacking. Summon Tank build values this highly; DPS build will find it too slow."
    },
    {
      id: "sucker-punch",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CT/cs-sucker-punch.jpeg",
      name: "Sucker Punch",
      level: "1",
      initiative: 14,
      cardNum: 95,
      tags: [],
      builds: ["tank"],
      top: {
        text: "Attack 3 · IMMOBILIZE",
        isLoss: false
      },
      bottom: {
        text: "Each time a summoned ally would suffer damage this round, you may suffer the damage instead. (Active)",
        isLoss: false
      },
      commentary: "A card simply can't be cut at Level 1 — both halves at the fastest Initiative (14) available are excellent. The Top Immobilize is great for locking down a melee enemy to prevent it from moving away. The Bottom is where the real skill of playing this class comes into play — predicting each rest cycle which turn your Summon is in danger and playing this card to absorb the hit. This is essential for keeping your squishy Mounts alive. Both guides consider this near-mandatory. At Level 4 it gets even better when War Paint lets you act before your mounted summon."
    },
    {
      id: "soul-whisperer",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CT/cs-soul-whisperer.jpeg",
      name: "Soul Whisperer",
      level: "1",
      initiative: 57,
      cardNum: 97,
      tags: ["command"],
      builds: ["both"],
      top: {
        text: "One summoned ally within Range 3 performs Move +0 and Attack +0 with you controlling the abilities.",
        isLoss: false
      },
      bottom: {
        text: "Heal 2 · Affect all summoned allies within Range 2",
        isLoss: false
      },
      commentary: "Two fantastic halves at a terrible Initiative — the classic recipe for a staple action. The Top Command is the easiest and most consistent way to control your Mount at Level 1, numerically like a Scurry for the Mindthief but with more utility and no targeting restriction. Doubling your Mount's Move is extremely powerful for positioning. The Bottom Heal 2 all Summons Range 2 is a necessary option at Level 1 when your Summon takes some damage. Hard to cut this card for the Top alone. Both guides agree it's a core card."
    },
    {
      id: "sniffing-hound",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CT/cs-sniffing-hound.jpeg",
      name: "Sniffing Hound",
      level: "1",
      initiative: 80,
      cardNum: 96,
      tags: ["summon"],
      builds: [],
      top: {
        text: "Summon Scout Dog: HP 4, Move 3, Attack 1 — Upon entering a hex adjacent to a trap, immediately disarm the trap.",
        isLoss: true
      },
      bottom: {
        text: "Move 5",
        isLoss: false
      },
      commentary: "Both guides strongly recommend not taking this card. The Scout Dog has the same stat line as the Ostrich but cannot be Mounted — a critical downside since the class relies on Mounting for free movement and control. The trap-disarming ability almost never comes up when you have Mounded Sight's Push to maneuver enemies into traps instead. The Bottom Move 5 is borderline on a class that doesn't really need plain moves. Easy cut after a few scenarios with this class."
    },
    {
      id: "prepared-rations",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CT/cs-prepared-rations.jpeg",
      name: "Prepared Rations",
      level: "X",
      initiative: 91,
      cardNum: 98,
      tags: ["summon", "mount"],
      builds: ["tank"],
      top: {
        text: "Summon Pack Mule: HP 4, Move 3, Attack 0, Retaliate 1 — Mount. While Mounted on this summon, perform 'Heal 2 Self' at the end of each round.",
        isLoss: true
      },
      bottom: {
        text: "Move 2 · Heal 2 Self",
        isLoss: false
      },
      commentary: "A very interesting Summon card — Pack Mule has no Attack value which is its biggest problem. The Heal 2 Self each round while Mounted is powerful: free healing every turn makes the Chieftain tankier and is excellent when Damage Soaking. The Retaliate 1 is weak. Best used when you want to run two Level 1 effects that change Monster Focus to pull aggro away from your Mount, and use this Summon as a portable healing platform. Bottom is consistently good. An excellent X card for the tank build; Magatis recommends it mainly for Chieftains focusing on not always being Mounted."
    },
    {
      id: "hunters-mark",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CT/cs-hunters-mark.jpeg",
      name: "Hunter's Mark",
      level: "X",
      initiative: 15,
      cardNum: 99,
      tags: ["mount"],
      builds: ["dps"],
      top: {
        text: "The next time a normal or elite enemy attacks a summoned ally you own, place your character token on the enemy. Your next three attacks targeting this enemy gain +2 Attack. (Persistent Active)",
        isLoss: false
      },
      bottom: {
        text: "Retaliate 1 · Affect self and mounted summon. (Active)",
        isLoss: false
      },
      commentary: "Bears similarity to Sucker Punch but with key differences. The Top is a Persistent ability — unlike Sucker Punch's Bottom which is reactive, Hunter's Mark is proactive. Initiative 15 means it goes just before a lot of dangerous monster actions. The +2 Attack on 3 hits is great for targeting high-Shield or beefy enemies. Both guides note the problem: unpredictability and setup, plus it can't be used on bosses. The second guide considers it more situational; Magatis floated it in and out of the main deck until Level 4. Good for the DPS build but keep Sucker Punch as the more reliable option."
    },
    {
      id: "mounded-sight",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CT/cs-mounded-sight.jpeg",
      name: "Mounded Sight",
      level: "X",
      initiative: 82,
      cardNum: 100,
      tags: ["summon", "mount"],
      builds: ["tank"],
      top: {
        text: "Summon Cavalry Camel: HP 5, Move 2, Attack 1 — Mount. This summon is unaffected by difficult and hazardous terrain.",
        isLoss: true
      },
      bottom: {
        text: "Move 2 · PUSH 2 · Target one adjacent enemy",
        isLoss: false
      },
      commentary: "Both guides consider this the weakest Level 1/X card for Chieftain. The Cavalry Camel's ability to ignore difficult and hazardous terrain is situationally useful and the 5 HP is decent, but 1 Attack and 2 Move are below the curve. The Bottom Move 2 Push 2 is useful for pushing enemies toward allies or away from your Summon — the second guide notes good combo potential with Sucker Punch Top's Immobilize. The terrain-ignoring ability would have been more impactful if it helped when controlling the Camel, but you'll often have full control anyway. Cut first from most builds."
    },
    {
      id: "medicine-shield",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CT/cs-medicine-shield.jpeg",
      name: "Medicine Shield",
      level: "2",
      initiative: 19,
      cardNum: 101,
      tags: ["earth"],
      builds: ["tank"],
      top: {
        text: "Heal 3 · Range 3 · Earth consumption: +2 Heal, XP",
        isLoss: false
      },
      bottom: {
        text: "Shield 2 · Heal 1 · Affect self and all allies within Range 3. (Active, Loss)",
        isLoss: true
      },
      commentary: "A simple card with good things going for it. The Top is completely standard without Earth but Earth turns it into Heal 5 Range 3 — your best Earth Consumption option at Level 2 alongside Resurrection and Piercing Darts. The Bottom Shield 2 Heal 1 all allies Range 3 is a flexible Loss for emergency situations or long fights. Tank Build pick; DPS Build takes Ceremonial Dance. Initiative 19 is great for saving your Summons on key turns. Both guides agree on the Level 2 split: DPS → Ceremonial Dance, Tank → Medicine Shield."
    },
    {
      id: "ceremonial-dance",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CT/cs-ceremonial-dance.jpeg",
      name: "Ceremonial Dance",
      level: "2",
      initiative: 23,
      cardNum: 102,
      tags: [],
      builds: ["dps"],
      top: {
        text: "Attack 2 · Target 3 · MUDDLE · XP",
        isLoss: false
      },
      bottom: {
        text: "You and all character allies within Range 3 may perform Move 2.",
        isLoss: false
      },
      commentary: "An absolute must-have for the DPS build. The Top averages out to two Attack 2s with Muddle — mitigates damage and is one of the class's few multi-attack options without relying on a Summon. Critically, combine with the Bottom of Piercing Darts to turn it into an Attack 3 Pierce 1 Target 3 Muddle non-loss. The Bottom group Move 2 has great utility in high player counts and doesn't affect Summons (only characters). Initiative 23 is similar to Medicine Shield's 19 so you can mostly pick based on what you need more. Both guides agree: DPS build takes this, tank build takes Medicine Shield."
    },
    {
      id: "take-the-reins",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CT/cs-take-the-reins.jpeg",
      name: "Take the Reins",
      level: "3",
      initiative: 40,
      cardNum: 103,
      tags: ["command", "mount"],
      builds: ["both"],
      top: {
        text: "One summoned ally within Range 3 performs Attack +1 with you controlling the action. If you are mounted on this summon, add +2 Attack.",
        isLoss: false
      },
      bottom: {
        text: "Move 4 · If you mount a summon with this movement, perform Attack 2.",
        isLoss: false
      },
      commentary: "A great payoff for the Mounted build and your easiest big hit to actually pull off, as this just asks for a Summon you are Mounted on. The Top scales extremely well — Attack 5 Push 1 on the Bull while Mounted, or Attack 4 with any other Summon, which is solid. The Bottom Move 4 + Attack 2 on Mounting is excellent versatility, never a dead card whether or not you're currently Mounted. Both guides agree this is a near-unanimous Level 3 pick for both builds. The second guide notes it's too good to pass up for the DPS build even with the competition from Agile Predator."
    },
    {
      id: "agile-predator",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CT/cs-agile-predator.jpeg",
      name: "Agile Predator",
      level: "3",
      initiative: 90,
      cardNum: 104,
      tags: ["summon", "mount"],
      builds: ["both"],
      top: {
        text: "Summon Black Panther: HP 5, Move 3, Attack 1, Retaliate 1 — Mount. All attacks targeting this summon gain Disadvantage.",
        isLoss: true
      },
      bottom: {
        text: "One summoned ally within Range 3 performs Move +1 with you controlling the ability.",
        isLoss: false
      },
      commentary: "The only Summon available from Levels 2–4, making this decision close simply because of that fact. The Black Panther is Chieftain's strongest recoverable Summon at any level — 5 HP with all attacks against it gaining Disadvantage and Retaliate 1. The second guide calls it the best recoverable Summon period. Both builds want this. The Bottom Command Move +1 is solid repositioning. Initiative 90 is classically good for Summoning. Both guides agree both builds take this at Level 3, alongside Take the Reins for the DPS build or as a pair with Tank build."
    },
    {
      id: "war-paint",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CT/cs-war-paint.jpeg",
      name: "War Paint",
      level: "4",
      initiative: 28,
      cardNum: 105,
      tags: ["earth", "mount"],
      builds: ["tank"],
      top: {
        text: "Enemies cannot focus on or target you and your mounted summon with attacks this round. · Generate Earth",
        isLoss: false
      },
      bottom: {
        text: "Enemies focus on you before focusing on your mounted summon. You may choose to act before your mounted summon. (Persistent Active, Loss)",
        isLoss: true
      },
      commentary: "Both guides consider this nearly non-negotiable for how the class functions. The Top provides quasi-Invisibility for you and your Mount while generating Earth — another reliable Earth source and a way to permanently deal with the problem of going about your business without worrying about your Summon dying. The Bottom Persistent Loss changes the monster focus to you first, and lets you choose to act before your mounted summon — opening extra possibilities like exploring rooms and letting your Summon follow. Both builds want this though the Tank build values it more. Initiative 28 is fine but play it at a fast card to capitalize on the effect."
    },
    {
      id: "spiked-muzzle",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CT/cs-spiked-muzzle.jpeg",
      name: "Spiked Muzzle",
      level: "4",
      initiative: 47,
      cardNum: 106,
      tags: ["mount"],
      builds: ["dps"],
      top: {
        text: "The next three times your mounted summon attacks, add +2 Attack to the attack. (Active)",
        isLoss: false
      },
      bottom: {
        text: "Move 2 · One summoned ally performs Move +1 with you controlling the ability.",
        isLoss: false
      },
      commentary: "A fantastic reusable way to add value to your Mounted Summon — a free +6 Attack per rest cycle spread across three attacks in an easy to set up way. Performing Attack 3/4s instead of 1/2s that also play well with Commands makes this great. The Bottom Move 2 + Command Move +1 is a nice merging of movement actions into one. Initiative 47 is pretty awful and represents a problem at higher levels where you have mostly medium-speed cards. Both guides agree both Level 4 cards are good and you can't go wrong either way; DPS build leans Spiked Muzzle, Tank build leans War Paint but can work with both."
    },
    {
      id: "chest-thumper",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CT/cs-chest-thumper.jpeg",
      name: "Chest Thumper",
      level: "5",
      initiative: 94,
      cardNum: 107,
      tags: ["summon", "mount"],
      builds: ["tank"],
      top: {
        text: "Summon Lowland Gorilla: HP 7, Move 3, Attack 2, Jump — Mount. After killing an enemy, this summon performs 'Heal 2 Self'. (Cannot be Recovered)",
        isLoss: true
      },
      bottom: {
        text: "STRENGTHEN · Affect all allies within Range 2.",
        isLoss: false
      },
      commentary: "The Lowland Gorilla will be a familiar situation to Agile Predator — only Mountable Summon offered for 2 levels until Level 7. The stat spread is great: 7 HP with Move 3 Jump and Attack 2 is a massive upgrade. The Heal 2 on kill helps it stay healthy and alive. The biggest downside is the Cannot be Recovered icon — you absolutely need a backup Mount. The Bottom Strengthen all allies Range 2 is nice synergy with your multi-Summon setup. Initiative 94 is safe. Magatis recommends Lowland Gorilla; second guide agrees for Tank Build but notes Positive Reinforcement is the DPS pick."
    },
    {
      id: "positive-reinforcement",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CT/cs-positive-reinforcement.jpeg",
      name: "Positive Reinforcement",
      level: "5",
      initiative: 24,
      cardNum: 108,
      tags: ["mount", "earth", "command"],
      builds: ["dps"],
      top: {
        text: "Add +1 Attack to all your attacks while you are mounted on a summon. (Persistent Active, Loss)",
        isLoss: true
      },
      bottom: {
        text: "One summoned ally within Range 3 performs Move +0 and Attack +0. Earth consumption: +1 Attack, XP. With you controlling the abilities.",
        isLoss: false
      },
      commentary: "A game-changer for the DPS build — +1 Attack permanently while Mounted turns Ceremonial Dance into a base Attack 3 Target 3 Muddle, and Piercing Darts now becomes Attack 2 Range 3 Pierce 2 Target 2 with Poison. The Initiative 24 is great and the Bottom Earth Command Attack+1 is also very solid. The Top being a Persistent Loss is the caveat: going to 7 cards with Resurrection and War Paint can be demanding. Magatis recommends Lowland Gorilla for most players but acknowledges his wife loved Positive Reinforcement and found it effective riding Battle Cattle. Both guides agree the DPS pick is Positive Reinforcement."
    },
    {
      id: "one-with-nature",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CT/cs-one-with-nature.jpeg",
      name: "One With Nature",
      level: "6",
      initiative: 33,
      cardNum: 109,
      tags: ["earth"],
      builds: ["dps"],
      top: {
        text: "Attack 4 · Earth consumption: +2 Attack, XP",
        isLoss: false
      },
      bottom: {
        text: "Move 5 · Generate Earth",
        isLoss: false
      },
      commentary: "The pinnacle DPS card — Attack 4 becomes Attack 6/7 with Earth and Positive Reinforcement stacked. The second guide calls this the pinnacle card for the Chieftain DPS build that gets even juicier at Level 7. Use the bottom of Catastrophic Cattle or top of War Paint for Earth generation in this build. The Bottom Move 5 Infuse Earth is great and becomes a free Move 3 Infuse Earth when Mounted — pairs nicely with the top of Take the Reins. Initiative 33 is fine but not great. Both guides agree: DPS Build takes One With Nature. Tank Build might consider it but generally prefers Venomous Mayhem."
    },
    {
      id: "venomous-mayhem",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CT/cs-venomous-mayhem.jpeg",
      name: "Venomous Mayhem",
      level: "6",
      initiative: 92,
      cardNum: 110,
      tags: ["summon"],
      builds: ["tank"],
      top: {
        text: "Summon Cottonmouth Snake: HP 5, Move 4, Attack 1, POISON, IMMOBILIZE. (Cannot be Mounted)",
        isLoss: true
      },
      bottom: {
        text: "Attack 3 · POISON",
        isLoss: false
      },
      commentary: "Came at a great time — the Cottonmouth Snake Poisoned a ridiculous amount. The Snake is not mountable which limits its utility, but the play pattern is elegant: have Snake Poison and Immobilize your target, move in on your Mount next, and Command your Snake to safety. The 4 Move means the Snake should always be able to reach targets. The Bottom Attack 3 Poison is too good to ever justify using the top summon — it allows you to add +1 Attack to your top attack and Poison goes a long way. Both guides agree Tank Build takes Venomous Mayhem, DPS Build takes One With Nature."
    },
    {
      id: "impervious-armor",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CT/cs-impervious-armor.jpeg",
      name: "Impervious Armor",
      level: "7",
      initiative: 86,
      cardNum: 111,
      tags: ["summon", "mount"],
      builds: ["tank"],
      top: {
        text: "Summon Battle Rhinoceros: HP 7, Move 2, Attack 2, Shield 1, PIERCE 3 — Mount. While Mounted on this summon, you gain Shield 1.",
        isLoss: true
      },
      bottom: {
        text: "Shield 2 · Affect self and mounted summon. (Active)",
        isLoss: false
      },
      commentary: "We have arrived in style! The Battle Rhino is a great amalgamation of previous Summons — hefty Pierce 3 means this scales pretty much all the way to Level 9. Both you and your Summon gaining Shield 1 while Mounted means War Paint plus this Summon makes trading blows and healing back a great proposition. The only flaw is a slightly sub-par Move 2, but access to many Move Commands compensates. The Bottom Shield 2 for self and mounted Summon is great whenever you're not ready to play the top. From here on, every Summon will have the Cannot be Recovered icon. Both guides agree: Tank Build takes Impervious Armor, DPS Build takes Strapping Bullwhip."
    },
    {
      id: "strapping-bullwhip",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CT/cs-strapping-bullwhip.jpeg",
      name: "Strapping Bullwhip",
      level: "7",
      initiative: 29,
      cardNum: 112,
      tags: ["mount"],
      builds: ["dps"],
      top: {
        text: "Attack 3 · Add +1 Attack for each depicted hex between you and the target. · AoE line pattern",
        isLoss: false
      },
      bottom: {
        text: "If you are mounted on a summon, gain +2 Attack and PIERCE 2 on your next melee attack this round, then discard this card. (Active)",
        isLoss: false
      },
      commentary: "A great card in a very similar situation to Spiked Muzzle — excellent but faces competition from War Paint. The Top AoE Attack 3–5 depending on target distance is Attack 7–9 combined with One With Nature and Positive Reinforcement — a great multi-target option. The second guide highlights this as excellent: Attack 5, 6, and 7 on targets at 0, 1, and 2 hexes away. The Bottom +2 Attack Pierce 2 next melee is a winner-winner-chicken-dinner with One With Nature for Attack 9 Pierce 2! Both guides agree: DPS Build takes Strapping Bullwhip, Tank Build takes Impervious Armor."
    },
    {
      id: "tribal-blessing",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CT/cs-tribal-blessing.jpeg",
      name: "Tribal Blessing",
      level: "8",
      initiative: 46,
      cardNum: 114,
      tags: ["earth"],
      builds: ["tank"],
      top: {
        text: "Heal 5 · BLESS · Self · Earth consumption: Also affect one character ally within Range 3. · XP",
        isLoss: false
      },
      bottom: {
        text: "Move 4 · Heal 3 · Range 3",
        isLoss: false
      },
      commentary: "A doozy of a card — literally doubling the effectiveness with Earth consumption. The Top Heal 5 Bless Self is great in the tank build; Earth makes it affect an ally too. Magatis would like a faster, more relevant Initiative here as this class landslides toward being a decent bit slower at Levels 8/9. The Bottom Move 4 Heal 3 Range 3 is a great staple Bottom action for pretty much any class. The second guide notes this is where the magic happens for the tank build — move onto your Summon and Heal 3 yourself or any Summons as a free bottom. Both guides: Tank Build takes Tribal Blessing, DPS Build takes Majestic Mass."
    },
    {
      id: "majestic-mass",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CT/cs-majestic-mass.jpeg",
      name: "Majestic Mass",
      level: "8",
      initiative: 86,
      cardNum: 113,
      tags: ["summon", "mount"],
      builds: ["dps"],
      top: {
        text: "Summon War Elephant: HP 8, Move 2, Attack 3 (AoE, destroy one adjacent obstacle) — Mount. (Cannot be Recovered)",
        isLoss: true
      },
      bottom: {
        text: "You or a mounted summon performs Move 4.",
        isLoss: false
      },
      commentary: "The first Summon where both halves are actually pretty equal in value — both guides find it flexible to be whichever half you need more in a given scenario. The War Elephant outputs a massive Attack 3 Target 2 (hex formation) each round, and you can finish the target off with high-DPS attacks to ensure the Elephant doesn't get pummeled. The obstacle destruction is mostly flavor/trinket text. The Bottom Move 4 is great utility — you may have cut most Move actions by this point so having this option is very welcome. Both guides: DPS Build takes Majestic Mass, Tank Build takes Tribal Blessing."
    },
    {
      id: "master-the-reins",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CT/cs-master-the-reins.jpeg",
      name: "Master the Reins",
      level: "9",
      initiative: 30,
      cardNum: 115,
      tags: ["command", "mount"],
      builds: ["both"],
      top: {
        text: "All summoned allies you own perform Move +1, Attack +1, Move +1 with you controlling the actions.",
        isLoss: false
      },
      bottom: {
        text: "Place your character token on a summoned ally you own. This summon gains +1 Attack on all its attacks. You now control the actions of this summon. (Active)",
        isLoss: false
      },
      commentary: "Pretty spicy and would absolutely be a Loss (at a lower level) on any other Summoner. With typically 2 Summons operating, this isn't as absurd as it looks — Move 2 Attack 4 Move 2 with the Elephant or Move 2 Attack 3 Pierce 3 Move 2 with the Rhino, or Move 3 Jump Attack 3 Move 3 on the Gorilla. The Bottom quasi-second-Mount token places your character token to gain +1 Attack and full control without needing to be physically Mounted — nice for running 2 strong non-mountable Summons. Both guides agree this is excellent fun regardless of build at Level 9."
    },
    {
      id: "regal-beast",
      imageUrl: "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/character-ability-cards/crimson-scales/CT/cs-regal-beast.jpeg",
      name: "Regal Beast",
      level: "9",
      initiative: 81,
      cardNum: 116,
      tags: ["summon", "mount"],
      builds: ["both"],
      top: {
        text: "Summon Sabretooth Tiger: HP 8, Move 3, Attack 3, Advantage — Mount. While Mounted, your attacks cannot gain Disadvantage. (Cannot be Recovered)",
        isLoss: true
      },
      bottom: {
        text: "Recover up to three of your lost cards with a Summon action and immediately play them for their top Summon actions.",
        isLoss: true
      },
      commentary: "A great name — riding a Sabretooth Tiger is a sweet image. The stat line is sleek: 8 HP Move 3 Attack 3 with permanent Advantage, and while Mounted your attacks cannot gain Disadvantage. The second guide notes this is great combined with the +1 Attack buff from Master the Reins Bottom. The Bottom is super neat — recover 3 Summons and immediately play their tops means you can put the Black Panther out three times in one scenario to absorb a whole slew of attacks. Both guides agree all four Level 9 halves contribute well to both builds — go for what looks most fun."
    },
    {
      id: "call-of-the-wild",
      imageUrl: "https://raw.githubusercontent.com/any2cards/worldhaven/master/images/milestone-ability-cards/trail-of-ashes/toa-msa-chieftain.png",
      name: "Call of the Wild",
      level: "M",
      initiative: 0,
      cardNum: 683,
      tags: ["mount", "command"],
      builds: ["both"],
      top: {
        text: "See milestone ability card image for full card text.",
        isLoss: false
      },
      bottom: {
        text: "See milestone ability card image for full card text.",
        isLoss: false
      },
      commentary: "The Chieftain's Milestone reward card — Call of the Wild. Earned after completing 10 checkmarks of the personal milestone goal. Added permanently to your hand — does not count against hand size. See the card image for the full ability text."
    }
  ],

  perks: [
    { count: 1, text: "Replace one -1 card with one +0 POISON card" },
    { count: 2, text: "Replace one -1 card with one +0 'Heal 1, one summoned ally' card" },
    { count: 1, text: "Replace one -1 card with one +0 'Heal 1, Affect all summoned allies owned' card" },
    { count: 1, text: "Replace one -2 card with one +2 'BLESS Self' card" },
    { count: 1, text: "Replace two +0 cards with one +0 'IMMOBILIZE and PUSH 1' card" },
    { count: 2, text: "Replace one +0 card with one '+X where X is number of summoned allies you own' card" },
    { count: 1, text: "Replace one +1 card with two +0 '+1 Attack if summon is attacking' cards" },
    { count: 1, text: "Add one +0 WOUND PIERCE 1 card" },
    { count: 2, text: "Add one +0 Earth Infuse card" },
    { count: 1, text: "Add two rolling 'PIERCE 2, ignore Retaliate on the target' cards" },
    { count: 1, text: "Ignore negative scenario effects and add one +1 card" }
  ],

  tips: [
    {
      category: "Golden rule",
      text: "Stay Mounted on a summon as often as possible. You get free movement from your Mount, you control its actions to prevent it from doing stupid things, and you free up floor space for allies and other Summons."
    },
    {
      category: "Resurrection",
      text: "Resurrection is the card the class is built around. Play it as soon as you have 3 good Lost cards worth recovering — especially Mounts. Always long rest when possible on this class, as short resting is expensive. Try to use the Top for Earth generation as well."
    },
    {
      category: "Earth",
      text: "Earth is the only element this class cares about. Budget one Earth Consumption per rest cycle and never play more than two Earth Consumption cards often. Your Earth sources at Level 1 are Skinning Knife Top and Catastrophic Cattle Bottom."
    },
    {
      category: "Mounting",
      text: "To Mount a Summon, end your Move action in the hex the Summon occupies. While Mounted you get the Summon's movement for free and fully control both of your actions — top for yourself, bottom for utility, with the Summon attacking on its turn under your control."
    },
    {
      category: "Keeping Summons alive",
      text: "Sucker Punch Bottom is critical for keeping squishy Mounts alive — predict each rest cycle which turn your Summon is in danger and play this card to absorb the hit. Prioritize your Focus-changing abilities (Sucker Punch, Hunter's Mark, War Paint) to pull aggro off your Mount."
    },
    {
      category: "Card selection",
      text: "Cut Sniffing Hound and Mounded Sight first from any build. Both guides strongly agree the Scout Dog cannot be Mounted which is a critical downside. Keep Pipe Tomahawk only if your party needs Fire Infusion or early Move 4."
    },
    {
      category: "Perks",
      text: "Early on: grab the -1 to +0 Poison and -1 to +0 Heal (summoned ally) perks first. Then look at rolling Pierce 2 perks — Retaliate enemies are a significant problem for summon-heavy classes. The +X summon perk scales very well in the late game."
    },
    {
      category: "Items",
      text: "Basic Prosperity 1 items are awkward for this class — not interested in Winged Shoes or Boots of Striding since movement is mostly free from the Mount. Hold off until Boots of Speed are available. Focus item budget on Enhancements for your Summons since they're expensive."
    },
    {
      category: "High Shield enemies",
      text: "High Shield or Retaliate enemies are the class's biggest weakness — Shielded enemies are bad for Summons and Retaliate can wreck your Mount. Be smart about when to abandon your Mount so you don't both get blasted. Piercing Darts and Spiked Muzzle/Strapping Bullwhip help significantly."
    },
    {
      category: "XP generation",
      text: "This class is very good at XP — all Summons give 2+ XP, Commands and Earth Consumptions give XP, and you can buy back Lost cards at the end of a scenario for another 6+ XP. You will often be ahead of your party by a full level by the mid-campaign."
    }
  ]
};
