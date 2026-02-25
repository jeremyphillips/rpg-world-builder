// Lankhmar (2e) specific monsters

import type { Monster } from './monsters.types'

export const monstersLankhmar: readonly Monster[] = [
  {
    id: "ghoul-lankhmar",
    name: "Ghoul (Lankhmar)",
    description: {
      short: "Corpse-eaters that haunt the catacombs and graveyards beneath Lankhmar.",
      long: "In Lankhmar, ghouls are cunning undead that lurk beneath the city in vast networks of tunnels, feeding on the dead and occasionally the living.",
    },
    type: "Undead",
    sizeCategory: "Medium",
    languages: ["Common", "Ghoul"],
    vision: "Darkvision 60 ft.",
    setting: ["lankhmar"],
    editionRules: [
      {
        edition: "2e",
        mechanics: {
          hitDice: 2,
          hitDieSize: 8,
          armorClass: 6,
          thac0: 19,
          movement: { ground: 9 },
          attacks: [
            { name: "Claw", dice: "1-3" },
            { name: "Claw", dice: "1-3" },
            { name: "Bite", dice: "1-6" }
          ],
          specialDefenses: ["Immune to sleep, charm, hold, and cold-based spells", "Paralyzing touch"],
          morale: { category: "Steady", value: 12 }
        },
        lore: {
          alignment: "Chaotic Evil",
          xpValue: 650,
          frequency: "Uncommon",
          organization: "Pack",
          treasureType: "B",
          intelligence: "Low (5–7)"
        },
        source: { book: "Lankhmar: City of Adventure" }
      }
    ]
  },
  {
    id: "ghoul-kleshite",
    name: "Ghoul, Kleshite",
    description: {
      short: "Elite ghouls from the Kleshite cult, more cunning and dangerous than common ghouls.",
      long: "Kleshite ghouls are members of a ghoulish cult that retains intelligence and organization from life. They are more dangerous than common ghouls, spreading disease with their touch.",
    },
    type: "Undead",
    sizeCategory: "Medium",
    languages: ["Kleshite", "Common"],
    vision: "Darkvision 60 ft.",
    setting: ["lankhmar"],
    editionRules: [
      {
        edition: "2e",
        mechanics: {
          hitDice: 3,
          hitDieSize: 8,
          armorClass: 5,
          thac0: 17,
          movement: { ground: 12 },
          attacks: [
            { name: "Claw", dice: "1-4" },
            { name: "Claw", dice: "1-4" },
            { name: "Bite", dice: "1-8" }
          ],
          specialDefenses: ["Immune to sleep, charm, hold", "Paralyzing touch", "Disease"],
          morale: { category: "Steady", value: 14 }
        },
        lore: {
          alignment: "Chaotic Evil",
          xpValue: 975,
          frequency: "Rare",
          organization: "Cult",
          treasureType: "C",
          intelligence: "Average"
        },
        source: { book: "Lankhmar: City of Adventure" }
      }
    ]
  },
  {
    id: "devourer-lankhmar",
    name: "Devourer (Lankhmar)",
    description: {
      short: "A terrifying undead that feeds on souls, imprisoning them within its ribcage.",
      long: "The Devourer is among the most feared undead in Nehwon. It traps the souls of its victims within its exposed ribcage, drawing on their stolen essence to fuel its dark power.",
    },
    type: "Undead",
    sizeCategory: "Large",
    languages: ["Common", "Nehwon"],
    vision: "Darkvision 90 ft.",
    setting: ["lankhmar"],
    editionRules: [
      {
        edition: "2e",
        mechanics: {
          hitDice: 8,
          hitDieSize: 8,
          armorClass: 0,
          thac0: 13,
          movement: { ground: 12 },
          attacks: [
            { name: "Touch", dice: "1-8" }
          ],
          specialDefenses: ["Spell theft", "Soul imprisonment", "Immune to sleep, charm, hold"],
          morale: { category: "Fanatic", value: 17 }
        },
        lore: {
          alignment: "Chaotic Evil",
          xpValue: 9000,
          frequency: "Very Rare",
          organization: "Solitary",
          treasureType: "E",
          intelligence: "Exceptional (15–16)"
        },
        source: { book: "Lankhmar: City of Adventure" }
      }
    ]
  },
  {
    id: "cold-woman",
    name: "Cold Woman",
    description: {
      short: "Mysterious women from the Cold Waste who drain warmth from the living.",
      long: "Cold Women appear as beautiful, pale women who dwell in the frozen wastes of Nehwon. Their icy touch drains the warmth and life from any who draw near.",
    },
    type: "Humanoid",
    sizeCategory: "Medium",
    languages: ["Common", "Cold Waste"],
    vision: "Darkvision 60 ft.",
    setting: ["lankhmar"],
    editionRules: [
      {
        edition: "2e",
        mechanics: {
          hitDice: 4,
          hitDieSize: 8,
          armorClass: 6,
          thac0: 17,
          movement: { ground: 12 },
          attacks: [
            { name: "Ice Touch", dice: "2-8" }
          ],
          specialDefenses: ["Immunity to cold", "Charm resistance"],
          morale: { category: "Steady", value: 12 }
        },
        lore: {
          alignment: "Chaotic Evil",
          xpValue: 650,
          frequency: "Rare",
          organization: "Coven",
          treasureType: "C",
          intelligence: "Average"
        },
        source: { book: "Lankhmar: City of Adventure" }
      }
    ]
  },
  {
    id: "astral-wolf",
    name: "Astral Wolf",
    description: {
      short: "Ethereal wolves that phase between planes, requiring magical weapons to harm.",
      long: "Astral Wolves are supernatural predators that hunt in packs across the borders between the material and ethereal planes. Only silver or magical weapons can harm them.",
    },
    type: "Monstrosity",
    sizeCategory: "Medium",
    languages: [],
    vision: "Darkvision 60 ft.",
    setting: ["lankhmar"],
    editionRules: [
      {
        edition: "2e",
        mechanics: {
          hitDice: 3,
          hitDieSize: 8,
          armorClass: 4,
          thac0: 17,
          movement: { ground: 18 },
          attacks: [
            { name: "Bite", dice: "2-8" }
          ],
          specialDefenses: ["Ethereal shift", "Silver or magic to hit"],
          morale: { category: "Steady", value: 14 }
        },
        lore: {
          alignment: "Chaotic Neutral",
          xpValue: 420,
          frequency: "Very Rare",
          organization: "Pack",
          treasureType: "Nil",
          intelligence: "Semi- (2–4)"
        },
        source: { book: "Lankhmar: City of Adventure" }
      }
    ]
  },
  {
    id: "war-cat",
    name: "Cat, War",
    description: {
      short: "Large, fierce felines trained for battle by the warriors of Nehwon.",
      long: "War Cats are large, powerful felines bred and trained for combat. They serve as mounts and companions to warriors across the world of Nehwon.",
    },
    type: "Beast",
    sizeCategory: "Large",
    languages: [],
    vision: "Low-light vision",
    setting: ["lankhmar"],
    editionRules: [
      {
        edition: "2e",
        mechanics: {
          hitDice: 5,
          hitDieSize: 8,
          armorClass: 5,
          thac0: 15,
          movement: { ground: 15 },
          attacks: [
            { name: "Claw", dice: "1-4" },
            { name: "Claw", dice: "1-4" },
            { name: "Bite", dice: "1-6" }
          ],
          morale: { category: "Steady", value: 14 }
        },
        lore: {
          alignment: "Neutral",
          xpValue: 975,
          frequency: "Rare",
          organization: "Solitary or pair",
          treasureType: "Nil",
          intelligence: "Semi- (2–4)"
        },
        source: { book: "Lankhmar: City of Adventure" }
      }
    ]
  },
  {
    id: "sea-cloaker",
    name: "Cloaker, Sea",
    description: {
      short: "A ray-like aberration that lurks in the waters around Nehwon.",
      long: "Sea Cloakers are aquatic relatives of the subterranean cloaker. They use their moan to cause fear and can shift through shadows to ambush prey near the coasts of Nehwon.",
    },
    type: "Aberration",
    sizeCategory: "Large",
    languages: ["Common"],
    vision: "Darkvision 60 ft.",
    setting: ["lankhmar"],
    editionRules: [
      {
        edition: "2e",
        mechanics: {
          hitDice: 6,
          hitDieSize: 8,
          armorClass: 3,
          thac0: 15,
          movement: { ground: 6, fly: 9 },
          attacks: [
            { name: "Tail", dice: "1-6" },
            { name: "Tail", dice: "1-6" },
            { name: "Bite", dice: "1-4" },
            { name: "Bite", dice: "1-4" }
          ],
          specialDefenses: ["Moan causes fear", "Shadow shift"],
          morale: { category: "Steady", value: 12 }
        },
        lore: {
          alignment: "Chaotic Evil",
          xpValue: 975,
          frequency: "Rare",
          organization: "Solitary",
          treasureType: "D",
          intelligence: "Average"
        },
        source: { book: "Lankhmar: City of Adventure" }
      }
    ]
  },
  {
    id: "horag",
    name: "Horag",
    description: {
      short: "A regenerating, spell-resistant horror of the Nehwon wilderness.",
      long: "Horags are large, fearsome monstrosities that dwell in the wilds of Nehwon. Their regenerative abilities and resistance to magic make them nearly impossible to kill.",
    },
    type: "Monstrosity",
    sizeCategory: "Large",
    languages: ["Horag"],
    vision: "Darkvision 90 ft.",
    setting: ["lankhmar"],
    editionRules: [
      {
        edition: "2e",
        mechanics: {
          hitDice: 7,
          hitDieSize: 8,
          armorClass: 2,
          thac0: 13,
          movement: { ground: 12 },
          attacks: [
            { name: "Claw", dice: "1-8" },
            { name: "Claw", dice: "1-8" }
          ],
          specialDefenses: ["Regeneration", "Spell resistance"],
          morale: { category: "Fanatic", value: 16 }
        },
        lore: {
          alignment: "Chaotic Evil",
          xpValue: 3000,
          frequency: "Very Rare",
          organization: "Solitary",
          treasureType: "F",
          intelligence: "Average"
        },
        source: { book: "Lankhmar: City of Adventure" }
      }
    ]
  },
  {
    id: "howler-lankhmar",
    name: "Howler",
    description: {
      short: "A large predator whose howl causes magical confusion in its prey.",
      long: "Howlers are large, predatory creatures that hunt in packs. Their terrible howl causes magical confusion, leaving victims helpless before the pack closes in.",
    },
    type: "Monstrosity",
    sizeCategory: "Large",
    languages: [],
    vision: "Darkvision 60 ft.",
    setting: ["lankhmar"],
    editionRules: [
      {
        edition: "2e",
        mechanics: {
          hitDice: 5,
          hitDieSize: 8,
          armorClass: 6,
          thac0: 15,
          movement: { ground: 15 },
          attacks: [
            { name: "Claw", dice: "1-6" },
            { name: "Claw", dice: "1-6" }
          ],
          specialDefenses: ["Howl causes confusion", "Sonic attack"],
          morale: { category: "Steady", value: 12 }
        },
        lore: {
          alignment: "Chaotic Evil",
          xpValue: 975,
          frequency: "Rare",
          organization: "Pack",
          treasureType: "C",
          intelligence: "Semi- (2–4)"
        },
        source: { book: "Lankhmar: City of Adventure" }
      }
    ]
  },
  {
    id: "invisible-stardock",
    name: "Invisible of Stardock",
    description: {
      short: "Permanently invisible beings that dwell in the mountain citadel of Stardock.",
      long: "The Invisibles of Stardock are a mysterious race of permanently invisible beings that inhabit the high mountain fortress of Stardock. They can only be harmed by magical means.",
    },
    type: "Aberration",
    sizeCategory: "Medium",
    languages: ["Invisible"],
    vision: "Blindsight 60 ft.",
    setting: ["lankhmar"],
    editionRules: [
      {
        edition: "2e",
        mechanics: {
          hitDice: 4,
          hitDieSize: 8,
          armorClass: 4,
          thac0: 17,
          movement: { ground: 12 },
          attacks: [
            { name: "Touch", dice: "1-4" }
          ],
          specialDefenses: ["Permanently invisible", "Magic to hit"],
          morale: { category: "Steady", value: 12 }
        },
        lore: {
          alignment: "Lawful Neutral",
          xpValue: 1400,
          frequency: "Very Rare",
          organization: "Enclave",
          treasureType: "D",
          intelligence: "High (13–14)"
        },
        source: { book: "Lankhmar: City of Adventure" }
      }
    ]
  },
  {
    id: "living-web",
    name: "Web, Living",
    description: {
      short: "A sentient, mobile web that engulfs and constricts its prey.",
      long: "Living Webs are ooze-like creatures that resemble enormous spider webs. They slowly engulf prey, constricting and digesting anything organic they encounter.",
    },
    type: "Ooze",
    sizeCategory: "Large",
    languages: [],
    vision: "Blindsight 30 ft.",
    setting: ["lankhmar"],
    editionRules: [
      {
        edition: "2e",
        mechanics: {
          hitDice: 6,
          hitDieSize: 8,
          armorClass: 6,
          thac0: 15,
          movement: { ground: 3 },
          attacks: [
            { name: "Constrict", dice: "2-12" }
          ],
          specialDefenses: ["Immune to sleep, charm, hold", "Web entangle"],
          morale: { category: "Special", value: 20 }
        },
        lore: {
          alignment: "Neutral",
          xpValue: 975,
          frequency: "Rare",
          organization: "Solitary",
          treasureType: "Nil",
          intelligence: "Non- (0)"
        },
        source: { book: "Lankhmar: City of Adventure" }
      }
    ]
  },
  {
    id: "wraith-spider",
    name: "Wraith-Spider",
    description: {
      short: "An undead spider that drains life force and traps victims in spectral webs.",
      long: "Wraith-Spiders are undead arachnids that spin webs of shadow. Their bite drains life energy, and they are immune to most physical attacks.",
    },
    type: "Undead",
    sizeCategory: "Medium",
    languages: [],
    vision: "Darkvision 60 ft.",
    setting: ["lankhmar"],
    editionRules: [
      {
        edition: "2e",
        mechanics: {
          hitDice: 3,
          hitDieSize: 8,
          armorClass: 4,
          thac0: 17,
          movement: { ground: 12 },
          attacks: [
            { name: "Bite", dice: "1-4" }
          ],
          specialDefenses: ["Immune to sleep, charm, hold", "Level drain", "Web"],
          morale: { category: "Steady", value: 14 }
        },
        lore: {
          alignment: "Chaotic Evil",
          xpValue: 650,
          frequency: "Rare",
          organization: "Solitary",
          treasureType: "B",
          intelligence: "Low (5–7)"
        },
        source: { book: "Lankhmar: City of Adventure" }
      }
    ]
  },
  {
    id: "sea-zombie",
    name: "Zombie, Sea",
    description: {
      short: "Waterlogged undead that crew ghost ships and patrol sunken ruins.",
      long: "Sea Zombies are the animated corpses of drowned sailors and coastal dwellers. They cannot drown and often serve as crew aboard ghost ships or as guardians of sunken treasure.",
    },
    type: "Undead",
    sizeCategory: "Medium",
    languages: [],
    vision: "Darkvision 60 ft.",
    setting: ["lankhmar"],
    editionRules: [
      {
        edition: "2e",
        mechanics: {
          hitDice: 3,
          hitDieSize: 8,
          armorClass: 6,
          thac0: 17,
          movement: { ground: 6, swim: 12 },
          attacks: [
            { name: "Slam", dice: "1-8" }
          ],
          specialDefenses: ["Immune to sleep, charm, hold", "Does not drown"],
          morale: { category: "Special", value: 20 }
        },
        lore: {
          alignment: "Neutral",
          xpValue: 270,
          frequency: "Uncommon",
          organization: "Crew",
          treasureType: "C",
          intelligence: "Non- (0)"
        },
        source: { book: "Lankhmar: City of Adventure" }
      }
    ]
  },
  {
    id: "bird-of-tyaa",
    name: "Bird of Tyaa",
    description: {
      short: "Raptor-like creatures with a petrifying gaze from the lands beyond Nehwon.",
      long: "Birds of Tyaa are winged predators whose gaze can turn victims to stone. They hunt in flocks over the remote regions of Nehwon.",
    },
    type: "Monstrosity",
    sizeCategory: "Medium",
    languages: [],
    vision: "Darkvision 60 ft.",
    setting: ["lankhmar"],
    editionRules: [
      {
        edition: "2e",
        mechanics: {
          hitDice: 3,
          hitDieSize: 8,
          armorClass: 5,
          thac0: 17,
          movement: { ground: 6, fly: 18 },
          attacks: [
            { name: "Claw", dice: "1-4" },
            { name: "Claw", dice: "1-4" },
            { name: "Beak", dice: "1-6" }
          ],
          specialDefenses: ["Petrifying gaze"],
          morale: { category: "Steady", value: 12 }
        },
        lore: {
          alignment: "Chaotic Evil",
          xpValue: 420,
          frequency: "Rare",
          organization: "Flock",
          treasureType: "Nil",
          intelligence: "Semi- (2–4)"
        },
        source: { book: "Lankhmar: City of Adventure" }
      }
    ]
  },
  {
    id: "snow-serpent",
    name: "Snow Serpent",
    description: {
      short: "A large serpent of the Cold Waste whose breath freezes its victims.",
      long: "Snow Serpents are large reptiles adapted to the frozen wastes of Nehwon. They are immune to cold and can breathe a blast of freezing air to incapacitate their prey.",
    },
    type: "Beast",
    sizeCategory: "Large",
    languages: [],
    vision: "Darkvision 60 ft.",
    setting: ["lankhmar"],
    editionRules: [
      {
        edition: "2e",
        mechanics: {
          hitDice: 5,
          hitDieSize: 8,
          armorClass: 5,
          thac0: 15,
          movement: { ground: 9 },
          attacks: [
            { name: "Bite", dice: "2-8" }
          ],
          specialDefenses: ["Cold immunity", "Freezing breath"],
          morale: { category: "Steady", value: 14 }
        },
        lore: {
          alignment: "Neutral",
          xpValue: 650,
          frequency: "Uncommon",
          organization: "Solitary or nest",
          treasureType: "Nil",
          intelligence: "Animal (2–4)"
        },
        source: { book: "Lankhmar: City of Adventure" }
      }
    ]
  },
  {
    id: "behemoth-nehwon",
    name: "Behemoth",
    description: {
      short: "A gargantuan four-legged predator resembling a killer whale with stubby legs.",
      long: "Behemoths are enormous, voracious carnivores found across Nehwon. They resemble killer whales with four stubby legs and are ferocious predators with no fear of humans. Three species exist: swamp, snow, and black.",
    },
    type: "Monstrosity",
    sizeCategory: "Gargantuan",
    languages: [],
    setting: ["lankhmar"],
    editionRules: [
      {
        edition: "2e",
        mechanics: {
          hitDice: 14,
          hitDieSize: 8,
          armorClass: 4,
          thac0: 5,
          movement: { ground: 12, swim: 18 },
          attacks: [{ name: "Bite", dice: "4d10" }],
          morale: { category: "Steady", value: 12 },
        },
        lore: {
          alignment: "Neutral",
          xpValue: 6000,
          frequency: "Very Rare",
          organization: "Solitary",
          treasureType: "Nil",
          intelligence: "Animal (1)",
        },
        source: { book: "Lankhmar: City of Adventure" }
      }
    ]
  },
  {
    id: "gladiator-lizard",
    name: "Gladiator Lizard",
    description: {
      short: "An extremely rare, agile fighting lizard found only on the Bleak Shore.",
      long: "Gladiator lizards are fearless, intelligent reptiles found naturally on the Bleak Shore of Nehwon. They appear to be of magical or alien origin, never needing food, and are sometimes used as guardian creatures for sacred treasures.",
    },
    type: "Monstrosity",
    sizeCategory: "Large",
    languages: [],
    setting: ["lankhmar"],
    editionRules: [
      {
        edition: "2e",
        mechanics: {
          hitDice: 7,
          hitDieSize: 8,
          armorClass: -3,
          thac0: 13,
          movement: { ground: 15 },
          attacks: [
            { name: "Claw", dice: "1d10" },
            { name: "Claw", dice: "1d10" }
          ],
          specialDefenses: ["Brood mate mental link (+1 to hit for second attacker)"],
          morale: { category: "Fearless", value: 20 },
        },
        lore: {
          alignment: "Neutral Evil",
          xpValue: 1400,
          frequency: "Very Rare",
          organization: "Group",
          treasureType: "Nil",
          intelligence: "Very (11-12)",
        },
        source: { book: "Lankhmar: City of Adventure" }
      }
    ]
  },
  {
    id: "haunt-lankhmar",
    name: "Haunt",
    description: {
      short: "A restless spirit that possesses the living to complete an unfinished task.",
      long: "A haunt is the restless spirit of a person who died leaving a vital task unfinished. It takes over living bodies to complete its goal, draining Dexterity with its touch until it can slip inside and seize control.",
    },
    type: "Undead",
    sizeCategory: "Medium",
    languages: [],
    setting: ["lankhmar"],
    editionRules: [
      {
        edition: "2e",
        mechanics: {
          hitDice: 5,
          hitDieSize: 8,
          armorClass: 0,
          thac0: 15,
          movement: { ground: 6 },
          attacks: [{ name: "Touch", dice: "special" }],
          specialAttacks: ["Dexterity drain (2 per hit)", "Possession at 0 Dex"],
          specialDefenses: ["Silver or magical weapons to hit", "Cannot be turned"],
          morale: { category: "Champion", value: 16 },
        },
        lore: {
          alignment: "Any",
          xpValue: 2000,
          frequency: "Very Rare",
          organization: "Solitary",
          treasureType: "Nil",
          intelligence: "Non- (0)",
        },
        source: { book: "Lankhmar: City of Adventure" }
      }
    ]
  },
  {
    id: "ice-gnome",
    name: "Ice Gnome",
    description: {
      short: "Fierce, nomadic gnomes of the Cold Waste who roam in massive tribal hordes.",
      long: "Ice gnomes are small but dangerous humanoids that roam the Cold Wastes in numbers large enough to wipe out entire human tribes. They serve the Invisibles of Stardock as servants, warriors, and slaves.",
    },
    type: "Humanoid",
    subtype: "Gnome",
    sizeCategory: "Small",
    languages: ["Ice Gnome"],
    setting: ["lankhmar"],
    editionRules: [
      {
        edition: "2e",
        mechanics: {
          hitDice: 2,
          hitDieSize: 8,
          armorClass: 6,
          thac0: 19,
          movement: { ground: 6 },
          attacks: [{ name: "Weapon", dice: "by weapon" }],
          specialDefenses: ["+2 on saves vs. cold"],
          morale: { category: "Average", value: 9 },
        },
        lore: {
          alignment: "Lawful Neutral",
          xpValue: 65,
          frequency: "Rare",
          organization: "Tribal",
          treasureType: "K (C)",
          intelligence: "Low to average",
        },
        source: { book: "Lankhmar: City of Adventure" }
      }
    ]
  },
  {
    id: "ophidian",
    name: "Ophidian",
    description: {
      short: "Snake-bodied humanoids with chameleon-like camouflage and a transforming bite.",
      long: "Ophidia, or snakemen, resemble large snakes with humanoid arms and hands. Their chameleonlike ability to change color makes them expert ambushers, and their venomous bite can slowly transform victims into ophidians.",
    },
    type: "Monstrosity",
    sizeCategory: "Medium",
    languages: ["Ophidian", "Common"],
    setting: ["lankhmar"],
    editionRules: [
      {
        edition: "2e",
        mechanics: {
          hitDice: 3,
          hitDieSize: 8,
          armorClass: 5,
          thac0: 17,
          movement: { ground: 9, swim: 18 },
          attacks: [
            { name: "Bite", dice: "1d3" },
            { name: "Weapon", dice: "by weapon" }
          ],
          specialAttacks: ["Transforming bite (save vs. poison or become ophidian)"],
          specialDefenses: ["Camouflage (-2 opponent surprise)"],
          morale: { category: "Unsteady", value: 6 },
        },
        lore: {
          alignment: "Chaotic Neutral",
          xpValue: 175,
          frequency: "Uncommon",
          organization: "Clan",
          treasureType: "U",
          intelligence: "Low to very (5-12)",
        },
        source: { book: "Lankhmar: City of Adventure" }
      }
    ]
  },
  {
    id: "invisible-flying-ray",
    name: "Ray, Invisible Flying",
    description: {
      short: "A naturally invisible, manta-like creature that flies using a gas bladder.",
      long: "Invisible flying rayfish are graceful, manta-like creatures that swim through the air using a bladder of lighter-than-air gas. Found in the mountains of Nehwon, they are bred as flying mounts by the Invisibles of Stardock.",
    },
    type: "Beast",
    sizeCategory: "Large",
    languages: [],
    vision: "Normal",
    setting: ["lankhmar"],
    editionRules: [
      {
        edition: "2e",
        mechanics: {
          hitDice: 6,
          hitDieSize: 8,
          armorClass: -1,
          thac0: 15,
          movement: { ground: 1, fly: 21 },
          attacks: [{ name: "Wing Buffet", dice: "1d10" }],
          specialDefenses: ["Invisibility"],
          morale: { category: "Unsteady", value: 6 },
        },
        lore: {
          alignment: "Neutral",
          xpValue: 650,
          frequency: "Very Rare",
          organization: "Solitary",
          treasureType: "Nil",
          intelligence: "Semi- (2-4)",
        },
        source: { book: "Lankhmar: City of Adventure" }
      }
    ]
  },
  {
    id: "simorgyan",
    name: "Simorgyan",
    description: {
      short: "Fish-like humanoids from the sunken empire of Simorgya who can shapechange.",
      long: "Simorgyans are the ancient inhabitants of the sunken empire of Simorgya. They resemble fish-like humanoids with sharklike mouths and can magically shapechange into attractive human forms or sharks. They seek vengeance against surface dwellers.",
    },
    type: "Humanoid",
    subtype: "Aquatic",
    sizeCategory: "Medium",
    languages: ["Simorgyan", "Common"],
    setting: ["lankhmar"],
    editionRules: [
      {
        edition: "2e",
        mechanics: {
          hitDice: 6,
          hitDieSize: 8,
          armorClass: 5,
          thac0: 15,
          movement: { ground: 12, swim: 24 },
          attacks: [
            { name: "Claw", dice: "1d4" },
            { name: "Claw", dice: "1d4" },
            { name: "Bite", dice: "1d10" }
          ],
          specialAttacks: ["Shapechange (human or shark)", "Command sea creatures"],
          morale: { category: "Champion", value: 16 },
        },
        lore: {
          alignment: "Neutral Evil",
          xpValue: 650,
          frequency: "Very Rare",
          organization: "Tribal",
          treasureType: "R (F, I)",
          intelligence: "High (13-14)",
        },
        source: { book: "Lankhmar: City of Adventure" }
      }
    ]
  },
  {
    id: "thunder-child",
    name: "Thunder Child",
    description: {
      short: "Malicious storm creatures that feed on fear during violent thunderstorms.",
      long: "Thunder children are shiny black, gaunt humanoids with vestigial wings and lightning-flash eyes. They emerge during violent storms to terrorize the living, feeding on the fear they create. They can cast chain lightning and assume gaseous form.",
    },
    type: "Fey",
    sizeCategory: "Small",
    languages: ["Thunder Child", "Common"],
    vision: "Infravision 120 ft.",
    setting: ["lankhmar"],
    editionRules: [
      {
        edition: "2e",
        mechanics: {
          hitDice: 7,
          hitDieSize: 8,
          armorClass: -1,
          thac0: 14,
          movement: { ground: 6, fly: 18 },
          attacks: [{ name: "Bite", dice: "2d8" }],
          specialAttacks: ["Chain lightning", "Fear aura (Wisdom drain)", "Electrical bite (save or +10 damage)"],
          specialDefenses: ["+1 or better weapon to hit", "Immune to fear", "Gaseous form"],
          morale: { category: "Average", value: 9 },
        },
        lore: {
          alignment: "Neutral Evil",
          xpValue: 2000,
          frequency: "Rare",
          organization: "Group",
          treasureType: "F",
          intelligence: "Average (8-10)",
        },
        source: { book: "Lankhmar: City of Adventure" }
      }
    ]
  },
  {
    id: "monolisk",
    name: "Monolisk",
    description: {
      short: "A massive, electrically charged aquatic mammal that stuns prey with shocks.",
      long: "The monolisk is a gargantuan water-breathing mammal with shiny black skin and gray stripes. It hunts by electrically charging the water in a 30-foot radius, stunning everything nearby before scooping prey into its huge maw.",
    },
    type: "Beast",
    sizeCategory: "Gargantuan",
    languages: [],
    setting: ["lankhmar"],
    editionRules: [
      {
        edition: "2e",
        mechanics: {
          hitDice: 14,
          hitDieSize: 8,
          armorClass: -1,
          thac0: 7,
          movement: { swim: 21 },
          attacks: [
            { name: "Bite", dice: "2d4" },
            { name: "Tail Swipe", dice: "1d6" }
          ],
          specialAttacks: ["Electrical shock (30ft radius, stun 2d4 rounds, save vs. spell negates)"],
          morale: { category: "Elite", value: 13 },
        },
        lore: {
          alignment: "Neutral",
          xpValue: 5000,
          frequency: "Very Rare",
          organization: "Solitary",
          treasureType: "Nil",
          intelligence: "Animal (1)",
        },
        source: { book: "LNR1 Wonders of Lankhmar" }
      }
    ]
  },
  {
    id: "wolvern",
    name: "Wolvern",
    description: {
      short: "An intelligent, telepathic canine hybrid that hunts in coordinated packs.",
      long: "Wolverns are intelligent canine hybrids with a semi-telepathic ability that allows them to predict where prey will run or where an opponent will strike. They respect creatures of intelligence and can be befriended through speech.",
    },
    type: "Beast",
    sizeCategory: "Small",
    languages: ["Wolvern"],
    setting: ["lankhmar"],
    editionRules: [
      {
        edition: "2e",
        mechanics: {
          hitDice: 8,
          hitDieSize: 8,
          armorClass: 4,
          thac0: 13,
          movement: { ground: 14 },
          attacks: [
            { name: "Claw", dice: "1d4" },
            { name: "Claw", dice: "1d4" },
            { name: "Bite", dice: "2d4" }
          ],
          specialDefenses: ["Telepathy (+2 attack, -2 to opponents; negated by telepathic foes)"],
          morale: { category: "Steady", value: 12 },
        },
        lore: {
          alignment: "Neutral",
          xpValue: 1400,
          frequency: "Rare",
          organization: "Pack",
          treasureType: "Nil",
          intelligence: "Very (11-12)",
        },
        source: { book: "LNR1 Wonders of Lankhmar" }
      }
    ]
  }
]
