import type { Monster } from '@/features/content/monsters/domain/types/monster.types'
import { monstersLankhmar } from "./monsters.lankhmar"

export const MONSTER_LABELS = {
  // Top-level
  type: 'Creature Type',
  sizeCategory: 'Size',
  languages: 'Languages',
  vision: 'Vision',
  description: 'Description',

  // Meta
  campaign: 'Campaign',
  source: 'Source',

  // Mechanics
  hitDice: 'Hit Dice',
  armorClass: 'Armor Class',
  movement: 'Movement',
  // attacks: 'Attacks',
  // attackBonus: 'Attack Bonus',
  // specialAttacks: 'Special Attacks',
  // specialDefenses: 'Special Defenses',
  abilities: 'Ability Scores',
  traits: 'Traits',
  actions: 'Actions',
  morale: 'Morale',
  proficiencyBonus: 'Proficiency Bonus',

  // Lore
  alignment: 'Alignment',
  xpValue: 'XP Value',
  // frequency: 'Frequency',
  // organization: 'Organization',
  // treasureType: 'Treasure Type',
  // intelligence: 'Intelligence',
  challengeRating: 'Challenge Rating',
  // environment: 'Environment',
} as const

export const monsters: readonly Monster[] = [
  //...monstersLankhmar,
  {
    id: "goblin-warrior",
    name: "Goblin Warrior",
    type: "humanoid",
    languages: [{ id: "common" }, { id: "goblin" }],
    sizeCategory: "small",
    description: {
      short: "Small, malicious humanoids that dwell in dark underground lairs.",
      long: "Goblins are small, black-hearted creatures that lair in despoiled dungeons and other dismal settings. Individually weak, they gather in large numbers to torment other creatures.",
    },
    mechanics: {
      hitPoints: {
        count: 3,
        die: 6,
      },
      armorClass: { kind: 'equipment' },
      movement: { ground: 30 },
      abilities: { str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8 },
      traits: ["nimble-escape"],
      actions: [
        { kind: 'weapon', weaponId: "scimitar" },
        { kind: 'weapon', weaponId: "shortbow" },
      ],
      senses: {
        special: [{ type: "darkvision", range: 60 }],
        passivePerception: 9,
      },
      proficiencies: {
        skills: { stealth: { proficiencyLevel: 1 } },
        skillBonuses: {
          stealth: 2,
        },
        weapons: ["scimitar", "shortbow"],
      },
      equipment: {
        weapons: ["scimitar", "shortbow"],
        armor: ["hide", "shield-wood"],
      },
    },
    lore: {
      alignment: "ne",
      challengeRating: 0.25,
      xpValue: 50,
      intelligence: "average",
    },
  },
  {
    id: "skeleton",
    name: "Skeleton",
    type: "undead",
    sizeCategory: "medium",
    languages: [{ id: "common", speaks: false }],
    description: {
      short: "Animated bones of the dead, mindlessly carrying out their creator's bidding.",
      long: "Skeletons are the animated bones of the dead, given a semblance of life through dark magic. They obey the commands of their creator without question or hesitation.",
    },
    mechanics: {
      hitPoints: {
        count: 2,
        die: 8,
        modifier: +4,
      },
      armorClass: {
        kind: 'equipment',
        override: 13,
      },
      movement: { ground: 30 },
      actions: [
        { kind: 'weapon', weaponId: "shortsword" },
        { kind: 'weapon', weaponId: "shortbow" },
      ],
      equipment: {
        weapons: ["shortsword", "shortbow"],
        armor: ["scraps"],
      },
      proficiencies: {
        weapons: ["shortsword", "shortbow"],
      },
      abilities: { str: 10, dex: 14, con: 15, int: 6, wis: 8, cha: 5 },
      senses: {
        special: [{ type: "darkvision", range: 60 }],
        passivePerception: 9,
      },
      traits: ["vulnerable-to-bludgeoning", "immune-to-poison", "immune-to-exhaustion"],
    },
    lore: {
      alignment: "le",
      challengeRating: 0.25,
      xpValue: 50,
      intelligence: "low",
    },
  },
  {
    id: "gnoll-warrior",
    name: "Gnoll Warrior",
    type: "humanoid",
    languages: [{ id: "gnoll" }],
    sizeCategory: "medium",
    description: {
      short: "Hulking hyena-headed humanoids driven by an insatiable hunger.",
      long: "Gnolls are tall, lanky humanoids with hyena-like heads. They are savage raiders who worship the demon lord Yeenoghu and leave destruction in their wake.",
    },
    mechanics: {
      hitPoints: {
        count: 6,
        die: 8,
      },
      armorClass: {
        kind: 'equipment'
      },
      // attackBonus: 4,
      movement: { ground: 30 },
      actions: [
        {
          kind: "natural",
          name: "Rend",
          attackType: "claw",
          toHitBonus: 4,
          reach: 5,
          damage: "1d6",
          damageBonus: 2,
          damageType: "piercing"
        },
        {
          kind: "weapon",
          weaponId: "longbow",
          aliasName: "Bone Bow",
          toHitBonus: 3,
          damageOverride: "1d10",
          damageBonus: 1,
          notes: "Uses a monster-specific bow profile."
        }
      ],
      proficiencies: {
        weapons: ["spear"],
      },
      equipment: {
        weapons: ["spear"],
        armor: ["hide"],
      },
      senses: {
        special: [{ type: "darkvision", range: 60 }],
        passivePerception: 10,
      },
      abilities: { str: 14, dex: 12, con: 11, int: 6, wis: 10, cha: 7 },
      traits: ["rampage"],
    },
    lore: {
      alignment: "ce",
      challengeRating: 0.5,
      xpValue: 100,
      intelligence: "low",
    },
  },
  {
    id: "orc",
    name: "Orc",
    type: "humanoid",
    languages: [{ id: "common" }, { id: "orc" }],
    sizeCategory: "medium",
    description: {
      short: "Brutish, aggressive humanoids that plague civilized lands.",
      long: "Orcs are aggressive humanoids that raid, pillage, and battle other creatures. They are driven by a hatred of the civilized races and a desire for conquest.",
    },
    mechanics: {
      hitPoints: {
        count: 2,
        die: 8,
        modifier: +6,
      },
      armorClass: { kind: 'equipment' },
      movement: { ground: 30 },
      actions: [
        { kind: "weapon", weaponId: "greataxe", toHitBonus: 3 },
        { kind: "weapon", weaponId: "javelin", toHitBonus: 3 },
      ],
      abilities: { str: 16, dex: 12, con: 16, int: 7, wis: 11, cha: 10 },
      senses: { 
        special: [{ type: "darkvision", range: 60 }],
        passivePerception: 10,
      },
      equipment: {
        weapons: ["greataxe", "javelin"],
        armor: ["hide"],
      },
      proficiencies: {
        weapons: ["greataxe", "javelin"],
        skills: { intimidation: { proficiencyLevel: 1 } },
      },
      traits: ["aggressive"],
    },
    lore: {
      alignment: "ce",
      challengeRating: 0.5,
      xpValue: 100,
      intelligence: "average",
    },
  },
  {
    id: "kobold-warrior",
    name: "Kobold Warrior",
    type: "humanoid",
    languages: [{ id: "common" }, { id: "draconic" }],
    sizeCategory: "small",
    description: {
      short: "Diminutive, reptilian humanoids with a knack for traps and ambushes.",
      long: "Kobolds are craven reptilian humanoids that commonly infest dungeons. They are physically weak but make up for it with cunning traps, overwhelming numbers, and a fanatical devotion to dragons.",
    },
    mechanics: {
      hitPoints: {
        count: 2,
        die: 6,
        modifier: -2
      },
      armorClass: { kind: 'equipment' },
      movement: { ground: 30 },
      actions: [
        { kind: 'weapon', weaponId: "dagger" },
        { kind: 'weapon', weaponId: "sling" },
      ],
      abilities: { str: 7, dex: 15, con: 9, int: 8, wis: 7, cha: 8 },
      senses: { 
        special: [{ type: "darkvision", range: 60 }],
        passivePerception: 8,
      },
      traits: ["sunlight-sensitivity", "pack-tactics"],
    },
    lore: {
      alignment: "le",
      challengeRating: 0.125,
      xpValue: 25,
      intelligence: "average",
    },
  },
  {
    id: "wolf",
    name: "Wolf",
    type: "beast",
    languages: [],
    sizeCategory: "medium",
    description: {
      short: "Pack hunters found throughout temperate and subarctic wilderness.",
      long: "Wolves are cunning and social predators that hunt in packs, using coordinated tactics to bring down prey larger than themselves.",
    },
    mechanics: {
      hitPoints: {
        count: 2,
        die: 8,
        modifier: +2,
      },
      armorClass: {
        kind: 'natural',
        base: 13,
      },
      movement: { ground: 40 },
      actions: [
        {
          kind: 'natural',
          attackType: 'bite',
          damage: '2d4',
          damageBonus: 2,
          toHitBonus: 4,
          onHitEffects: [
            {
              kind: 'save',
              save: { ability: 'str', dc: 11 },
              onFail: [{ kind: 'condition', condition: 'prone' }],
            },
          ],
        },
      ],
      abilities: { str: 12, dex: 15, con: 12, int: 3, wis: 12, cha: 6 },
      traits: ["pack-tactics"],
    },
    lore: {
      alignment: "n",
      challengeRating: 0.25,
      xpValue: 50,
      intelligence: "semi",
    },
  },
  {
    id: "zombie",
    name: "Zombie",
    type: "undead",
    languages: [{ id: "common", speaks: false }],
    description: {
      short: "Shambling corpses animated by dark necromantic energy.",
      long: "Zombies are mindless undead created through necromantic magic. They are slow but relentless, obeying simple commands from their creator without hesitation or self-preservation.",
    },
    mechanics: {
      hitPoints: {
        count: 3,
        die: 8,
        modifier: +9,
      },
      armorClass: {
        kind: 'equipment',
      },
      movement: { ground: 20 },
      actions: [{ kind: "natural", attackType: "slam", damage: "1d6" }],
      abilities: { str: 13, dex: 6, con: 16, int: 3, wis: 6, cha: 5 },
      traits: ["undead-fortitude"],
    },
    lore: {
      alignment: "ne",
      challengeRating: 0.25,
      xpValue: 50,
      intelligence: "non",
    },
  },
  {
    id: "bugbear-warrior",
    name: "Bugbear Warrior",
    type: "fey",
    sizeCategory: "medium",
    languages: [{ id: "common" }, { id: "goblin" }],
    description: {
      short: "Stealthy, brutish goblinoids that delight in ambush and cruelty.",
      long: "Bugbears are the largest of the goblinoid races, combining brute strength with a surprising talent for stealth. They prefer ambush over direct confrontation and bully weaker creatures into servitude.",
    },
    mechanics: {
      hitPoints: {
        count: 6,
        die: 8,
        modifier: +6,
      },
      armorClass: {
        kind: 'equipment'
      },
      movement: { ground: 30 },
      actions: [
        {
          kind: "special",
          name: "Grab",
          toHitBonus: 4,
          reach: 10,
          damage: "2d6",
          damageBonus: 2,
          damageType: "bludgeoning",
          description: "If the target is a Medium or smaller creature, it has the Grappled condition with an escape DC of 12.",
          onSuccess: [
            { kind: 'condition', condition: 'grappled', targetSizeMax: 'medium', escapeDc: 12 }
          ]
        },
        {
          kind: "weapon",
          weaponId: "light-hammer",
          toHitBonus: 4,
          damageOverride: "3d4",
          reach: 10,
          notes: "Has advantage if the target is grappled by the bugbear.",
        }
      ],
      proficiencies: {
        skills: { stealth: { proficiencyLevel: 1 }, survival: { proficiencyLevel: 1 } },
        skillBonuses: {
          stealth: 2
        },
        weapons: ["light-hammer"],
      },
      equipment: {
        weapons: ["light-hammer"],
        armor: ["hide"],
      },
      senses: {
        special: [{ type: "darkvision", range: 60 }],
        passivePerception: 10,
      },
      abilities: { str: 15, dex: 14, con: 13, int: 8, wis: 11, cha: 9 },
      traits: ["abduct"],
    },
    lore: {
      alignment: "ce",
      challengeRating: 1,
      xpValue: 200,
      intelligence: "average",
    },
  },
  {
    id: "ogre",
    name: "Ogre",
    type: "giant",
    sizeCategory: "large",
    languages: [{ id: "common" }, { id: "giant" }],
    description: {
      short: "Dim-witted, hulking giants that use brute strength to dominate.",
      long: "Ogres are large, ugly, and bad-tempered creatures that subsist through raiding and scavenging. They are often employed as mercenaries or enforcers by more cunning evil leaders.",
    },
    mechanics: {
      hitPoints: {
        count: 8,
        die: 10,
        modifier: +24,
      },
      armorClass: { kind: 'equipment' },
      movement: { ground: 40 },
      actions: [
        { kind: "weapon", weaponId: "greatclub",  damageOverride: "2d8" },
        { kind: "weapon", weaponId: "javelin", damageOverride: "2d6" },
      ],
      abilities: { str: 19, dex: 8, con: 16, int: 5, wis: 7, cha: 7 },
      equipment: {
        weapons: ["greatclub", "javelin"],
        armor: ["hide"],
      },
      proficiencies: {
        weapons: ["greatclub", "javelin"],
      },
    },
    lore: {
      alignment: "ce",
      challengeRating: 2,
      xpValue: 450,
      intelligence: "low",
    },
  },
  {
    id: "troll",
    name: "Troll",
    type: "giant",
    sizeCategory: "large",
    languages: [{ id: "giant" }],
    description: {
      short: "Loathsome giants with terrible claws and fearsome regeneration.",
      long: "Trolls are fearsome green-skinned giants known for their ability to regenerate even the most grievous wounds. Only fire and acid can permanently halt their regeneration.",
    },
    mechanics: {
      hitPoints: {
        count: 9,
        die: 10,
        modifier: +45,
      },
      armorClass: {
        kind: 'natural',
        base: 15,
        dexApplies: false,
      },
      // attackBonus: 7,
      movement: { ground: 30 },
      actions: [
        {
          kind: "special",
          name: "Multiattack",
          description: "The troll makes three Rend attacks.",
          sequence: [
            { actionName: "Rend", count: 3 }
          ]
        },
        {
          kind: "natural",
          name: "Rend",
          attackType: "claw",
          toHitBonus: 7,
          reach: 10,
          damage: "2d6",
          damageBonus: 4,
          damageType: "slashing"
        }
      ],
      senses: {
        special: [{ type: "darkvision", range: 60 }],
        passivePerception: 15,
      },
      abilities: { str: 18, dex: 13, con: 20, int: 7, wis: 9, cha: 7 },
      traits: ["loathsome-limbs", "regeneration"],
    },
    lore: {
      alignment: "ce",
      challengeRating: 5,
      xpValue: 1800,
      intelligence: "low",
    },
  },
  {
    id: "owlbear",
    name: "Owlbear",
    type: "monstrosity",
    sizeCategory: "large",
    languages: [],
    description: {
      short: "A monstrous cross between a giant owl and a bear.",
      long: "The owlbear is a ferocious predator with the body of a bear and the head of a giant owl. Its origin is commonly attributed to a wizard's experiment gone wrong.",
    },
    mechanics: {
      hitPoints: {
        count: 7,
        die: 10,
        modifier: +21,
      },
      armorClass: {
        kind: 'natural',
        base: 13,
        dexApplies: false,
      },
      // attackBonus: 7,
      movement: { ground: 40, climb: 40 },
      actions: [
        {
          kind: "special",
          name: "Multiattack",
          description: "The owlbear makes two Rend attacks.",
          sequence: [
            { actionName: "Rend", count: 2 }
          ]
        },
        {
          kind: "natural",
          name: "Rend",
          attackType: "claw",
          toHitBonus: 7,
          reach: 5,
          damage: "2d8",
          damageBonus: 5,
          damageType: "slashing"
        }
      ],
      proficiencies: {
        skills: { perception: { proficiencyLevel: 1 } },
        skillBonuses: {
          perception: 2,
        },
      },
      senses: {
        special: [{ type: "darkvision", range: 60 }],
        passivePerception: 15,
      },
      abilities: { str: 20, dex: 12, con: 17, int: 3, wis: 12, cha: 7 },
    },
    lore: {
      alignment: "unaligned",
      challengeRating: 3,
      xpValue: 700,
      intelligence: "animal",
    },
  },
  {
    id: "gelatinous-cube",
    name: "Gelatinous Cube",
    type: "ooze",
    sizeCategory: "large",
    languages: [],
    description: {
      short: "A nearly transparent ooze that fills dungeon corridors.",
      long: "The gelatinous cube is a transparent, ten-foot cube of gelatinous material that scours dungeon corridors clean of organic refuse. Treasures of past victims float suspended within its body.",
    },
    mechanics: {
      hitPoints: {
        count: 6,
        die: 10,
        modifier: +30,
      },
      armorClass: {
        kind: 'natural',
        base: 6,
        dexApplies: false,
      },
      movement: { ground: 15 },
      actions: [
        { kind: 'natural', attackType: "pseudopod", damage: "1d6", damageBonus: 2 },
        {
          kind: "natural",
          attackType: "bite",
          damage: "2d4",
          damageBonus: 2,
          toHitBonus: 4,
          onHitEffects: [
            {
              kind: "save",
              save: {
                ability: 'str',
                dc: 11,
              },
              onFail: [
                {
                  kind: "condition",
                  condition: "prone"
                }
              ]
            }
          ]
        }
      ],
      abilities: { str: 14, dex: 3, con: 20, int: 1, wis: 6, cha: 1 },
      senses: {
        special: [{ type: "blindsight", range: 60 }],
        passivePerception: 8,
      },
      traits: ["ooze-cube", "transparent"],
    },
    lore: {
      alignment: "unaligned",
      challengeRating: 2,
      xpValue: 450,
      intelligence: "non",
    },
  },
  {
    id: "mimic",
    name: "Mimic",
    type: "monstrosity",
    languages: [],
    sizeCategory: "medium",
    description: {
      short: "A shapeshifting predator that disguises itself as mundane objects.",
      long: "Mimics are shapeshifting creatures that can alter their form to resemble ordinary dungeon objects such as treasure chests, doors, or furniture, using a powerful adhesive to trap unsuspecting prey.",
    },
    mechanics: {
      hitPoints: {
        count: 9,
        die: 8,
        modifier: +18,
      },
      armorClass: {
        kind: 'natural',
        base: 12,
        dexApplies: false,
      },
      // attackBonus: 5,
      movement: { ground: 20 },
      actions: [
        {
          kind: "natural",
          name: "Bite",
          attackType: "bite",
          toHitBonus: 5,
          reach: 5,
          damage: "1d8",
          damageBonus: 3,
          damageType: "piercing",
          onHitEffects: [
            {
              kind: "damage",
              damage: "1d8",
              damageType: "acid"
            }
          ]
        },
        {
          kind: "natural",
          name: "Pseudopod",
          attackType: "pseudopod",
          toHitBonus: 5,
          reach: 5,
          damage: "1d8",
          damageBonus: 3,
          damageType: "bludgeoning",
          onHitEffects: [
            {
              kind: "damage",
              damage: "1d8",
              damageType: "acid"
            },
            {
              kind: "condition",
              condition: "grappled",
              targetSizeMax: "large",
              escapeDc: 13,
              escapeCheckDisadvantage: true
            }
          ]
        }
      ],
      abilities: { str: 17, dex: 12, con: 15, int: 5, wis: 13, cha: 8 },
      senses: {
        special: [{ type: "darkvision", range: 60 }],
        passivePerception: 11,
      },
      proficiencies: {
        skills: { stealth: { proficiencyLevel: 1 } },
        skillBonuses: {
          stealth: 2,
        },
      },
      traits: ["adhesive"],
    },
    lore: {
      alignment: "n",
      challengeRating: 2,
      xpValue: 450,
      intelligence: "average",
    },
  },
  {
    id: "young-red-dragon",
    name: "Young Red Dragon",
    type: "dragon",
    description: {
      short: "A fearsome young chromatic dragon wreathed in flame.",
      long: "Red dragons are the most covetous and arrogant of the chromatic dragons. Even in youth they are formidable predators, capable of unleashing devastating gouts of fire upon any who dare approach their growing hoards.",
    },
    mechanics: {
      hitPoints: {
        count: 17,
        die: 10,
        modifier: +85,
      },
      armorClass: {
        kind: 'natural',
        base: 18,
        dexApplies: false,
      },
      // attackBonus: 11,
      movement: { ground: 40 },
      actions: [
        {
          kind: "special",
          name: "Multiattack",
          description: "The dragon makes three Rend attacks.",
          sequence: [
            {
              actionName: "Rend",
              count: 3
            }
          ]
        },
        {
          kind: "natural",
          name: "Rend",
          attackType: "claw",
          toHitBonus: 10,
          reach: 10,
          damage: "2d6",
          damageBonus: 6,
          damageType: "slashing",
          onHitEffects: [
            {
              kind: "damage",
              damage: "1d6",
              damageType: "fire"
            }
          ]
        },
        {
          kind: "special",
          name: "Fire Breath",
          description: "Dexterity Saving Throw: DC 17, each creature in a 30-foot cone.",
          save: { ability: "dex", dc: 17 },
          damage: "16d6",
          damageType: "fire",
          halfDamageOnSave: true,
          area: { kind: "cone", size: 30 },
          target: "creatures-in-area",
          recharge: { min: 5, max: 6 }
        }
      ],
      abilities: { str: 23, dex: 10, con: 17, int: 12, wis: 11, cha: 15 },
      traits: ["fire-breath", "legendary-resistance"],
    },
    lore: {
      alignment: "ce",
      challengeRating: 10,
      xpValue: 5900,
      intelligence: "average",
    },
  }
]
