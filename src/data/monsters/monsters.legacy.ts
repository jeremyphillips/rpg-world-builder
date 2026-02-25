import type { Monster } from './monsters.types'
import { monstersLankhmar } from "./monsters.lankhmar"

export const MONSTER_LABELS = {
  // Top-level
  description: 'Description',
  type: 'Creature Type',
  subtype: 'Subtype',
  sizeCategory: 'Size Category',
  languages: 'Languages',
  vision: 'Vision',
  diet: 'Diet',
  setting: 'Settings',

  // Edition rules
  hitDice: 'Hit Dice',
  source: 'Source',

  // Mechanics
  armorClass: 'Armor Class',
  movement: 'Movement',
  attacks: 'Attacks',
  specialAttacks: 'Special Attacks',
  specialDefenses: 'Special Defenses',
  thac0: 'THAC0',
  hitDieModifier: 'Hit Die Modifier',
  hitDiceAsterisks: 'Special Abilities (*)',
  psionicAbility: 'Psionic Ability',
  morale: 'Morale',
  saveAs: 'Save As',
  attackBonus: 'Attack Bonus',
  baseAttackBonus: 'Base Attack Bonus',
  level: 'Level',
  role: 'Role',
  hitPoints: 'Hit Points',
  fortitude: 'Fortitude',
  reflex: 'Reflex',
  will: 'Will',
  initiative: 'Initiative',
  proficiencyBonus: 'Proficiency Bonus',
  abilities: 'Ability Scores',
  traits: 'Traits',
  actions: 'Actions',

  // Lore
  alignment: 'Alignment',
  xpValue: 'XP Value',
  xpPerHp: 'XP / Hit Point',
  frequency: 'Frequency',
  organization: 'Organization',
  numberAppearing: 'Number Appearing',
  percentInLair: '% In Lair',
  treasureType: 'Treasure Type',
  intelligence: 'Intelligence',
  size: 'Size',
  challengeRating: 'Challenge Rating',
  environment: 'Environment',
  origin: 'Origin',
} as const

export const monsters: readonly Monster[] = [
  ...monstersLankhmar,
  {
    id: "goblin",
    name: "Goblin",
    description: {
      short: "Small, malicious humanoids that dwell in dark underground lairs.",
      long: "Goblins are small, black-hearted creatures that lair in despoiled dungeons and other dismal settings. Individually weak, they gather in large numbers to torment other creatures.",
    },
    type: "Humanoid",
    subtype: "Goblinoid",
    sizeCategory: "Small",
    languages: ["Common", "Goblin"],
    editionRules: [
      {
        edition: "5e",
        mechanics: {
          hitDice: 2,
          hitDieSize: 6,
          armorClass: 15,
          attackBonus: 4,
          movement: { ground: 30 },
          attacks: [
            { name: "Scimitar", dice: "1d6 + 2" },
            { name: "Shortbow", dice: "1d6 + 2" }
          ],
          abilities: {
            str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8
          },
          traits: ["Nimble Escape"],
          actions: [
            { name: "Scimitar", bonus: 4, damage: "1d6 + 2" },
            { name: "Shortbow", bonus: 4, damage: "1d6 + 2" }
          ],
        },
        lore: {
          alignment: "Neutral Evil",
          challengeRating: 0.25,
          xpValue: 50,
          intelligence: "Average (8–10)",
        },
        source: { book: "Monster Manual" }
      },
      {
        edition: "2e",
        mechanics: {
          hitDice: 1,
          hitDieSize: 8,
          armorClass: 6,
          thac0: 20,
          movement: { ground: 6 },
          attacks: [{ name: "Weapon", dice: "1-6" }],
          morale: { category: "Steady", value: 10 },
        },
        lore: {
          alignment: "Lawful Evil",
          xpValue: 15,
          frequency: "Uncommon",
          organization: "Tribal",
          treasureType: "C",
          intelligence: "Average",
        },
        source: { book: "Monstrous Manual" }
      },
      {
        edition: "1e",
        mechanics: {
          hitDice: 1,
          hitDieModifier: -1, // Represents the "1-1" notation
          armorClass: 6,
          thac0: 20, // Technically calculated via Attack Matrix, but 20 is the base
          movement: { ground: 6 }, // 1e "scale" notation
          attacks: [{ name: "Weapon", dice: "1d6" }],
          specialAttacks: ["-1 to hit in bright sunlight"],
          specialDefenses: ["Infravision 60ft"],
          psionicAbility: { min: null, max: null },
        },
        lore: {
          alignment: "Lawful Evil",
          xpValue: 10, // 10 base
          xpPerHp: 1, // + 1/hp
          numberAppearing: { min: 40, max: 400 },
          percentInLair: 50,
          frequency: "Uncommon",
          treasureType: {
            individual: "K",
            lair: "C",
          },
          intelligence: "Average (low)",
          size: "Small (4ft tall)",
        },
        source: { book: "Monster Manual (1977)", page: 47 }
      },
      {
        edition: "becmi",
        mechanics: {
          hitDice: 1,
          hitDieSize: 8,
          hitDieModifier: -1,
          armorClass: 6,
          thac0: 19,
          movement: { ground: 30 },          // 90'(30') encounter rate
          attacks: [{ name: "Weapon", dice: "1d6" }],
          specialAttacks: ["-1 to hit in bright sunlight"],
          specialDefenses: ["Infravision 90ft"],
          saveAs: { class: "Normal Human", level: 0 },
          morale: 7,
        },
        lore: {
          alignment: "Chaotic",
          xpValue: 5,
          numberAppearing: { wandering: "2d4", lair: "6d10" },
          treasureType: "R (C)",
          intelligence: "Average (9)",
        },
        source: { book: "Rules Cyclopedia", page: 179 }
      },
      {
        edition: "bx",
        mechanics: {
          hitDice: 1,
          hitDieSize: 8,
          hitDieModifier: -1,
          armorClass: 6,
          thac0: 19,
          movement: { ground: 30 },
          attacks: [{ name: "Weapon", dice: "1d6" }],
          specialAttacks: ["-1 to hit in bright sunlight"],
          specialDefenses: ["Infravision 90ft"],
          saveAs: { class: "Normal Human", level: 0 },
          morale: 7,
        },
        lore: {
          alignment: "Chaotic",
          xpValue: 5,
          numberAppearing: { wandering: "2d4", lair: "6d10" },
          treasureType: "R (C)",
          intelligence: "Average (9)",
        },
        source: { book: "Basic Set (Moldvay)", page: 34 }
      },
      {
        edition: "b",
        mechanics: {
          hitDice: 1,
          hitDieModifier: -1,
          armorClass: 6,
          thac0: 19,
          movement: { ground: 20 },              // 6"
          attacks: [{ name: "Weapon", dice: "1d6" }],
          specialAttacks: ["-1 to hit in bright sunlight"],
        },
        lore: {
          alignment: "Lawful Evil",
          xpValue: 5,
          numberAppearing: "2d4",
          percentInLair: 50,
          treasureType: "C",
          intelligence: "Average",
        },
        source: { book: "Basic Set (Holmes)", page: 26 }
      },
      {
        edition: "odd",
        mechanics: {
          hitDice: 1,
          hitDieSize: 6,
          hitDieModifier: -1,
          armorClass: 6,
          thac0: 19,
          movement: { ground: 20 },              // 6"
          attacks: [{ name: "Weapon", dice: "1d6" }],
          specialAttacks: ["-1 to hit in bright sunlight"],
        },
        lore: {
          alignment: "Chaotic",
          xpValue: 100,
          numberAppearing: "2d4",
          percentInLair: 50,
          treasureType: "C",
          intelligence: "Average",
        },
        source: { book: "Monsters & Treasure", page: 4 }
      },
      {
        edition: "3.5e",
        mechanics: {
          hitDice: 1,
          hitDieSize: 8,
          armorClass: 15,                            // 10 +1 size +1 Dex +2 leather +1 light shield
          baseAttackBonus: 1,
          movement: { ground: 30 },
          attacks: [{ name: "Morningstar", dice: "1d6" }],
          abilities: { str: 8, dex: 13, con: 11, int: 10, wis: 9, cha: 6 },
        },
        lore: {
          alignment: "Neutral Evil",
          xpValue: 300,
          challengeRating: 0.33,
          organization: "Gang (4–9), band (10–100 plus 100% noncombatants), or tribe (40–400)",
          environment: "Temperate plains",
          intelligence: "Low",
        },
        source: { book: "Monster Manual (3.5e)", page: 133 }
      },
      {
        edition: "4e",
        mechanics: {
          level: 1,
          role: "Lurker",
          hitPoints: 25,
          armorClass: 15,
          fortitude: 12,
          reflex: 14,
          will: 12,
          initiative: 3,
          movement: { ground: 30 },                  // 6 squares
          attacks: [{ name: "Short Sword", dice: "1d6+4" }],
          specialAttacks: ["Sneaky (combat advantage deals +1d6 damage)"],
          abilities: { str: 14, dex: 17, con: 13, int: 8, wis: 12, cha: 8 },
        },
        lore: {
          alignment: "Evil",
          xpValue: 100,
          origin: "Natural",
          intelligence: "Low",
        },
        source: { book: "Monster Manual (4e)", page: 136 }
      }
    ]
  },
  {
    id: "skeleton",
    name: "Skeleton",
    description: {
      short: "Animated bones of the dead, mindlessly carrying out their creator's bidding.",
      long: "Skeletons are the animated bones of the dead, given a semblance of life through dark magic. They obey the commands of their creator without question or hesitation.",
    },
    type: "Undead",
    sizeCategory: "Medium",
    languages: ["Understands languages it knew in life but can't speak"],
    vision: "Darkvision 60 ft.",
    editionRules: [
      {
        edition: "5e",
        mechanics: {
          hitDice: 2,
          hitDieSize: 8,
          armorClass: 13,
          attackBonus: 4,
          movement: { ground: 30 },
          attacks: [{ name: "Shortsword", dice: "1d6 + 2", damageType: "piercing" }],
          abilities: { str: 10, dex: 14, con: 15, int: 6, wis: 8, cha: 5 },
          traits: ["Vulnerable to Bludgeoning", "Immune to Poisoned/Exhaustion"],
        },
        lore: {
          alignment: "Lawful Evil",
          challengeRating: 0.25,
          xpValue: 50,
          intelligence: "Low (5–7)",
        },
        source: { book: "Monster Manual" }
      },
      {
        edition: "2e",
        mechanics: {
          hitDice: 1,
          hitDieSize: 8,
          armorClass: 7,
          thac0: 19,
          movement: { ground: 12 },
          attacks: [{ name: "Weapon", dice: "1-6" }],
          specialDefenses: ["Immune to sleep, charm, hold, and cold-based spells"],
          morale: { category: "Special", value: 20 },
        },
        lore: {
          alignment: "Neutral",
          xpValue: 65,
          frequency: "Rare",
          organization: "Nil",
          treasureType: "Nil",
          intelligence: "Non- (0)",
        },
        source: { book: "Monstrous Manual" }
      },
      {
        edition: "1e",
        mechanics: {
          hitDice: 1,
          armorClass: 7,
          thac0: 20,
          movement: { ground: 12 },
          attacks: [{ name: "Weapon", dice: "1d6" }],
          specialDefenses: ["Half damage from edged/piercing weapons", "Immune to sleep, charm, hold, cold"],
          psionicAbility: { min: null, max: null },
        },
        lore: {
          alignment: "Neutral",
          xpValue: 14,
          xpPerHp: 1,
          numberAppearing: { min: 3, max: 30 },
          percentInLair: 0,
          frequency: "Rare",
          treasureType: "Nil",
          intelligence: "Non-intelligent",
          size: "Medium (6ft)",
        },
        source: { book: "Monster Manual (1977)", page: 87 }
      },
      {
        edition: "becmi",
        mechanics: {
          hitDice: 1,
          hitDieSize: 8,
          armorClass: 7,
          thac0: 19,
          movement: { ground: 20 },          // 60'(20') encounter rate
          attacks: [{ name: "Weapon", dice: "1d6" }],
          specialDefenses: ["Immune to sleep, charm, hold", "Unaffected by cold"],
          saveAs: { class: "Fighter", level: 1 },
          morale: 12,
        },
        lore: {
          alignment: "Chaotic",
          xpValue: 10,
          numberAppearing: { wandering: "3d4", lair: "3d10" },
          treasureType: "Nil",
          intelligence: "Non-intelligent (1)",
        },
        source: { book: "Rules Cyclopedia", page: 196 }
      },
      {
        edition: "bx",
        mechanics: {
          hitDice: 1,
          hitDieSize: 8,
          armorClass: 7,
          thac0: 19,
          movement: { ground: 20 },
          attacks: [{ name: "Weapon", dice: "1d6" }],
          specialDefenses: ["Immune to sleep, charm, hold", "Unaffected by cold"],
          saveAs: { class: "Fighter", level: 1 },
          morale: 12,
        },
        lore: {
          alignment: "Chaotic",
          xpValue: 10,
          numberAppearing: { wandering: "3d4", lair: "3d10" },
          treasureType: "Nil",
          intelligence: "Non-intelligent (1)",
        },
        source: { book: "Basic Set (Moldvay)", page: 42 }
      },
      {
        edition: "b",
        mechanics: {
          hitDice: 1,
          armorClass: 7,
          thac0: 19,
          movement: { ground: 20 },              // 6"
          attacks: [{ name: "Weapon", dice: "1d6" }],
          specialDefenses: ["Immune to sleep, charm, hold"],
        },
        lore: {
          alignment: "Neutral",
          xpValue: 10,
          numberAppearing: "3d4",
          percentInLair: 0,
          treasureType: "Nil",
          intelligence: "Non-intelligent",
        },
        source: { book: "Basic Set (Holmes)", page: 35 }
      },
      {
        edition: "odd",
        mechanics: {
          hitDice: 1,
          hitDieSize: 6,
          armorClass: 7,
          thac0: 19,
          movement: { ground: 20 },              // 6"
          attacks: [{ name: "Weapon", dice: "1d6" }],
          specialDefenses: ["Immune to sleep, charm, hold"],
        },
        lore: {
          alignment: "Neutral",
          xpValue: 100,
          numberAppearing: "3d4",
          percentInLair: 0,
          treasureType: "Nil",
          intelligence: "Non-intelligent",
        },
        source: { book: "Monsters & Treasure", page: 10 }
      },
      {
        edition: "3.5e",
        mechanics: {
          hitDice: 1,
          hitDieSize: 12,
          armorClass: 13,                            // 10 +2 natural +1 Dex (no Con bonus for undead)
          baseAttackBonus: 0,
          movement: { ground: 30 },
          attacks: [
            { name: "Claw", dice: "1d4" },
            { name: "Claw", dice: "1d4" }
          ],
          specialDefenses: ["DR 5/bludgeoning", "Immune to cold"],
          abilities: { str: 10, dex: 12, con: 0, int: 0, wis: 10, cha: 1 },
        },
        lore: {
          alignment: "Neutral Evil",
          xpValue: 300,
          challengeRating: 0.33,
          organization: "Any",
          environment: "Any",
          intelligence: "Non-intelligent",
        },
        source: { book: "Monster Manual (3.5e)", page: 225 }
      },
      {
        edition: "4e",
        mechanics: {
          level: 3,
          role: "Soldier",
          hitPoints: 45,
          armorClass: 18,
          fortitude: 16,
          reflex: 14,
          will: 15,
          initiative: 5,
          movement: { ground: 30 },                  // 6 squares
          attacks: [{ name: "Longsword", dice: "1d8+3" }],
          specialDefenses: ["Immune to disease, poison", "Resist 10 necrotic"],
          abilities: { str: 15, dex: 14, con: 13, int: 3, wis: 14, cha: 3 },
        },
        lore: {
          alignment: "Evil",
          xpValue: 150,
          origin: "Natural",
          intelligence: "Low",
        },
        source: { book: "Monster Manual (4e)", page: 234 }
      }
    ]
  },
  {
    id: "gnoll",
    name: "Gnoll",
    description: {
      short: "Hulking hyena-headed humanoids driven by an insatiable hunger.",
      long: "Gnolls are tall, lanky humanoids with hyena-like heads. They are savage raiders who worship the demon lord Yeenoghu and leave destruction in their wake.",
    },
    type: "Humanoid",
    subtype: "Gnoll",
    sizeCategory: "Medium",
    languages: ["Gnoll"],
    diet: ["Carnivore"],
    editionRules: [
      {
        edition: "5e",
        mechanics: {
          hitDice: 5,
          hitDieSize: 8,
          armorClass: 15,
          attackBonus: 4,
          movement: { ground: 30 },
          attacks: [
            { name: "Spear", dice: "1d6 + 2", damageType: "piercing" },
            { name: "Bite", dice: "1d4 + 2", damageType: "piercing" }
          ],
          abilities: { str: 14, dex: 12, con: 11, int: 6, wis: 10, cha: 7 },
          traits: ["Rampage"],
        },
        lore: {
          alignment: "Chaotic Evil",
          challengeRating: 0.5,
          xpValue: 100,
          intelligence: "Low (5–7)",
        },
        source: { book: "Monster Manual" }
      },
      {
        edition: "2e",
        mechanics: {
          hitDice: 2,
          hitDieSize: 8,
          armorClass: 5,
          thac0: 19,
          movement: { ground: 9 },
          attacks: [{ name: "Weapon", dice: "2-8" }],
          morale: { category: "Steady", value: 11 },
        },
        lore: {
          alignment: "Chaotic Evil",
          xpValue: 35,
          frequency: "Uncommon",
          organization: "Tribal",
          treasureType: "C",
          intelligence: "Low (5-7)",
        },
        source: { book: "Monstrous Manual" }
      },
      {
        edition: "1e",
        mechanics: {
          hitDice: 2,
          armorClass: 5,
          thac0: 16,
          movement: { ground: 9 },
          attacks: [{ name: "Weapon", dice: "2d4" }],
          psionicAbility: { min: null, max: null },
        },
        lore: {
          alignment: "Chaotic Evil",
          xpValue: 28,
          xpPerHp: 2,
          numberAppearing: { min: 20, max: 200 },
          percentInLair: 20,
          frequency: "Uncommon",
          treasureType: {
            individual: "L, M",
            lair: "D",
          },
          intelligence: "Low (5-7)",
          size: "Large (7ft+)",
        },
        source: { book: "Monster Manual (1977)", page: 46 }
      },
      {
        edition: "becmi",
        mechanics: {
          hitDice: 2,
          hitDieSize: 8,
          armorClass: 5,
          thac0: 18,
          movement: { ground: 30 },          // 90'(30') encounter rate
          attacks: [{ name: "Weapon", dice: "2d4" }],
          saveAs: { class: "Fighter", level: 2 },
          morale: 8,
        },
        lore: {
          alignment: "Chaotic",
          xpValue: 20,
          numberAppearing: { wandering: "1d6", lair: "3d6" },
          treasureType: "D",
          intelligence: "Average (9)",
        },
        source: { book: "Rules Cyclopedia", page: 178 }
      },
      {
        edition: "bx",
        mechanics: {
          hitDice: 2,
          hitDieSize: 8,
          armorClass: 5,
          thac0: 18,
          movement: { ground: 30 },
          attacks: [{ name: "Weapon", dice: "2d4" }],
          saveAs: { class: "Fighter", level: 2 },
          morale: 8,
        },
        lore: {
          alignment: "Chaotic",
          xpValue: 20,
          numberAppearing: { wandering: "1d6", lair: "3d6" },
          treasureType: "D",
          intelligence: "Average (9)",
        },
        source: { book: "Expert Set (Cook/Marsh)", page: 28 }
      },
      {
        edition: "b",
        mechanics: {
          hitDice: 2,
          armorClass: 5,
          thac0: 18,
          movement: { ground: 30 },              // 9"
          attacks: [{ name: "Weapon", dice: "2d4" }],
        },
        lore: {
          alignment: "Chaotic Evil",
          xpValue: 20,
          numberAppearing: "1d6",
          percentInLair: 30,
          treasureType: "D",
          intelligence: "Average",
        },
        source: { book: "Basic Set (Holmes)", page: 25 }
      },
      {
        edition: "odd",
        mechanics: {
          hitDice: 2,
          hitDieSize: 6,
          armorClass: 5,
          thac0: 18,
          movement: { ground: 30 },              // 9"
          attacks: [{ name: "Weapon", dice: "1d6" }],
        },
        lore: {
          alignment: "Chaotic",
          xpValue: 200,
          numberAppearing: "1d6",
          percentInLair: 30,
          treasureType: "D",
          intelligence: "Average",
        },
        source: { book: "Monsters & Treasure", page: 5 }
      },
      {
        edition: "3.5e",
        mechanics: {
          hitDice: 2,
          hitDieSize: 8,
          armorClass: 15,                            // 10 +1 natural +1 Dex +2 leather +1 light shield
          baseAttackBonus: 1,
          movement: { ground: 30 },
          attacks: [{ name: "Battleaxe", dice: "1d8+2" }],
          abilities: { str: 15, dex: 10, con: 13, int: 8, wis: 11, cha: 8 },
        },
        lore: {
          alignment: "Chaotic Evil",
          xpValue: 600,
          challengeRating: 1,
          organization: "Pair, hunting party (2–5 plus 1–2 hyenas), band (10–100), or tribe (20–200)",
          environment: "Warm plains",
          intelligence: "Low",
        },
        source: { book: "Monster Manual (3.5e)", page: 130 }
      },
      {
        edition: "4e",
        mechanics: {
          level: 5,
          role: "Skirmisher",
          hitPoints: 63,
          armorClass: 19,
          fortitude: 17,
          reflex: 18,
          will: 15,
          initiative: 7,
          movement: { ground: 40 },                  // 8 squares
          attacks: [
            { name: "Handaxe", dice: "1d6+4" },
            { name: "Longbow", dice: "1d10+4" }
          ],
          specialAttacks: ["Pack Attack (+5 damage when adjacent ally)"],
          abilities: { str: 16, dex: 18, con: 15, int: 8, wis: 12, cha: 9 },
        },
        lore: {
          alignment: "Chaotic Evil",
          xpValue: 200,
          origin: "Natural",
          intelligence: "Low",
        },
        source: { book: "Monster Manual (4e)", page: 132 }
      }
    ]
  },
  {
    id: "orc",
    name: "Orc",
    description: {
      short: "Brutish, aggressive humanoids that plague civilized lands.",
      long: "Orcs are aggressive humanoids that raid, pillage, and battle other creatures. They are driven by a hatred of the civilized races and a desire for conquest.",
    },
    type: "Humanoid",
    subtype: "Orc",
    sizeCategory: "Medium",
    languages: ["Common", "Orc"],
    vision: "Darkvision 60 ft.",
    editionRules: [
      {
        edition: "5e",
        mechanics: {
          hitDice: 2,
          hitDieSize: 8,
          armorClass: 13,
          attackBonus: 5,
          movement: { ground: 30 },
          attacks: [
            { name: "Greataxe", dice: "2d12 + 3", damageType: "slashing" },
            { name: "Javelin", dice: "1d6 + 3", damageType: "piercing" }
          ],
          abilities: { str: 16, dex: 12, con: 16, int: 7, wis: 11, cha: 10 },
          traits: ["Aggressive", "Darkvision"],
        },
        lore: {
          alignment: "Chaotic Evil",
          challengeRating: 0.5,
          xpValue: 100,
          intelligence: "Average (8–10)",
        },
        source: { book: "Monster Manual" }
      },
      {
        edition: "2e",
        mechanics: {
          hitDice: 1,
          hitDieSize: 8,
          armorClass: 6,
          thac0: 19,
          movement: { ground: 12 },
          attacks: [{ name: "Weapon", dice: "1-8" }],
          morale: { category: "Steady", value: 12 },
        },
        lore: {
          alignment: "Chaotic Evil",
          xpValue: 15,
          frequency: "Common",
          organization: "Tribal",
          treasureType: "C",
          intelligence: "Average",
        },
        source: { book: "Monstrous Manual" }
      },
      {
        edition: "1e",
        mechanics: {
          hitDice: 1,
          armorClass: 6,
          thac0: 20,
          movement: { ground: 9 },
          attacks: [{ name: "Weapon", dice: "1d8" }],
          specialAttacks: ["-1 to hit in bright sunlight"],
          specialDefenses: ["Infravision 60ft"],
          psionicAbility: { min: null, max: null },
        },
        lore: {
          alignment: "Lawful Evil",
          xpValue: 10,
          xpPerHp: 1,
          numberAppearing: { min: 30, max: 300 },
          percentInLair: 35,
          frequency: "Common",
          treasureType: {
            individual: "L",
            lair: "C",
          },
          intelligence: "Average",
          size: "Medium (6ft)",
        },
        source: { book: "Monster Manual (1977)", page: 76 }
      },
      {
        edition: "becmi",
        mechanics: {
          hitDice: 1,
          hitDieSize: 8,
          armorClass: 6,
          thac0: 19,
          movement: { ground: 40 },          // 120'(40') encounter rate
          attacks: [{ name: "Weapon", dice: "1d6" }],
          specialAttacks: ["-1 to hit in bright sunlight"],
          specialDefenses: ["Infravision 60ft"],
          saveAs: { class: "Fighter", level: 1 },
          morale: 8,
        },
        lore: {
          alignment: "Chaotic",
          xpValue: 10,
          numberAppearing: { wandering: "2d4", lair: "1d10x10" },
          treasureType: "D",
          intelligence: "Low (7)",
        },
        source: { book: "Rules Cyclopedia", page: 191 }
      },
      {
        edition: "bx",
        mechanics: {
          hitDice: 1,
          hitDieSize: 8,
          armorClass: 6,
          thac0: 19,
          movement: { ground: 40 },
          attacks: [{ name: "Weapon", dice: "1d6" }],
          specialAttacks: ["-1 to hit in bright sunlight"],
          specialDefenses: ["Infravision 60ft"],
          saveAs: { class: "Fighter", level: 1 },
          morale: 8,
        },
        lore: {
          alignment: "Chaotic",
          xpValue: 10,
          numberAppearing: { wandering: "2d4", lair: "1d10x10" },
          treasureType: "D",
          intelligence: "Low (7)",
        },
        source: { book: "Basic Set (Moldvay)", page: 40 }
      },
      {
        edition: "b",
        mechanics: {
          hitDice: 1,
          armorClass: 6,
          thac0: 19,
          movement: { ground: 30 },              // 9"
          attacks: [{ name: "Weapon", dice: "1d6" }],
          specialAttacks: ["-1 to hit in bright sunlight"],
        },
        lore: {
          alignment: "Lawful Evil",
          xpValue: 10,
          numberAppearing: "2d4",
          percentInLair: 50,
          treasureType: "D",
          intelligence: "Average",
        },
        source: { book: "Basic Set (Holmes)", page: 32 }
      },
      {
        edition: "odd",
        mechanics: {
          hitDice: 1,
          hitDieSize: 6,
          armorClass: 6,
          thac0: 19,
          movement: { ground: 30 },              // 9"
          attacks: [{ name: "Weapon", dice: "1d6" }],
          specialAttacks: ["-1 to hit in bright sunlight"],
        },
        lore: {
          alignment: "Chaotic",
          xpValue: 100,
          numberAppearing: "2d4",
          percentInLair: 50,
          treasureType: "D",
          intelligence: "Average",
        },
        source: { book: "Monsters & Treasure", page: 4 }
      },
      {
        edition: "3.5e",
        mechanics: {
          hitDice: 1,
          hitDieSize: 8,
          armorClass: 13,                            // 10 +3 studded leather
          baseAttackBonus: 1,
          movement: { ground: 30 },
          attacks: [{ name: "Falchion", dice: "2d4+4" }],
          abilities: { str: 17, dex: 11, con: 12, int: 8, wis: 7, cha: 6 },
        },
        lore: {
          alignment: "Chaotic Evil",
          xpValue: 300,
          challengeRating: 0.5,
          organization: "Gang (2–4), squad (11–20 plus 2 sergeants and 1 leader), or band (30–100)",
          environment: "Temperate hills",
          intelligence: "Low",
        },
        source: { book: "Monster Manual (3.5e)", page: 203 }
      },
      {
        edition: "4e",
        mechanics: {
          level: 4,
          role: "Brute",
          hitPoints: 67,
          armorClass: 16,
          fortitude: 18,
          reflex: 14,
          will: 13,
          initiative: 3,
          movement: { ground: 30 },                  // 6 squares
          attacks: [{ name: "Greataxe", dice: "1d12+6" }],
          specialAttacks: ["Warrior's Surge (recharge 5–6, melee basic attack as free action when bloodied)"],
          abilities: { str: 20, dex: 13, con: 17, int: 8, wis: 10, cha: 9 },
        },
        lore: {
          alignment: "Chaotic Evil",
          xpValue: 175,
          origin: "Natural",
          intelligence: "Low",
        },
        source: { book: "Monster Manual (4e)", page: 203 }
      }
    ]
  },
  {
    id: "kobold",
    name: "Kobold",
    description: {
      short: "Diminutive, reptilian humanoids with a knack for traps and ambushes.",
      long: "Kobolds are craven reptilian humanoids that commonly infest dungeons. They are physically weak but make up for it with cunning traps, overwhelming numbers, and a fanatical devotion to dragons.",
    },
    type: "Humanoid",
    subtype: "Kobold",
    sizeCategory: "Small",
    languages: ["Common", "Draconic"],
    vision: "Darkvision 60 ft.",
    editionRules: [
      {
        edition: "5e",
        mechanics: {
          hitDice: 2,
          hitDieSize: 6,
          armorClass: 12,
          attackBonus: 4,
          movement: { ground: 30 },
          attacks: [{ name: "Dagger", dice: "1d4 + 2", damageType: "piercing" }],
          abilities: { str: 7, dex: 15, con: 9, int: 8, wis: 7, cha: 8 },
          traits: ["Sunlight Sensitivity", "Pack Tactics"],
        },
        lore: {
          alignment: "Lawful Evil",
          challengeRating: 0.125,
          xpValue: 25,
          intelligence: "Average (8–10)",
        },
        source: { book: "Monster Manual" }
      },
      {
        edition: "2e",
        mechanics: {
          hitDice: 1,
          hitDieSize: 8,
          armorClass: 7,
          thac0: 20,
          movement: { ground: 6 },
          attacks: [{ name: "Weapon", dice: "1-4" }],
          morale: { category: "Unsteady", value: 12 },
        },
        lore: {
          alignment: "Lawful Evil",
          xpValue: 15,
          frequency: "Common",
          organization: "Tribal",
          treasureType: "J, K, L",
          intelligence: "Average",
        },
        source: { book: "Monstrous Manual" }
      },
      {
        edition: "1e",
        mechanics: {
          hitDice: 1, // 1/2 HD (1d4 hp in 1e)
          hitDieModifier: -4,
          armorClass: 7,
          thac0: 20,
          movement: { ground: 6 },
          attacks: [{ name: "Weapon", dice: "1d4" }],
          specialAttacks: ["-1 to hit in bright sunlight"],
          specialDefenses: ["Infravision 60ft"],
          psionicAbility: { min: null, max: null },
        },
        lore: {
          alignment: "Lawful Evil",
          xpValue: 5,
          xpPerHp: 1,
          numberAppearing: { min: 40, max: 400 },
          percentInLair: 40,
          frequency: "Common",
          treasureType: {
            individual: "J",
            lair: "O, Q",
          },
          intelligence: "Average (low)",
          size: "Small (3ft)",
        },
        source: { book: "Monster Manual (1977)", page: 57 }
      },
      {
        edition: "becmi",
        mechanics: {
          hitDice: 1,
          hitDieSize: 8,
          hitDieModifier: -4,               // 1/2 HD (1d4 hp)
          armorClass: 7,
          thac0: 19,
          movement: { ground: 30 },          // 90'(30') encounter rate
          attacks: [{ name: "Weapon", dice: "1d4" }],
          specialAttacks: ["-1 to hit in bright sunlight"],
          specialDefenses: ["Infravision 90ft"],
          saveAs: { class: "Normal Human", level: 0 },
          morale: 6,
        },
        lore: {
          alignment: "Chaotic",
          xpValue: 5,
          numberAppearing: { wandering: "4d4", lair: "6d10" },
          treasureType: "J (C)",
          intelligence: "Average (9)",
        },
        source: { book: "Rules Cyclopedia", page: 183 }
      },
      {
        edition: "bx",
        mechanics: {
          hitDice: 1,
          hitDieSize: 8,
          hitDieModifier: -4,
          armorClass: 7,
          thac0: 19,
          movement: { ground: 30 },
          attacks: [{ name: "Weapon", dice: "1d4" }],
          specialAttacks: ["-1 to hit in bright sunlight"],
          specialDefenses: ["Infravision 90ft"],
          saveAs: { class: "Normal Human", level: 0 },
          morale: 6,
        },
        lore: {
          alignment: "Chaotic",
          xpValue: 5,
          numberAppearing: { wandering: "4d4", lair: "6d10" },
          treasureType: "J (C)",
          intelligence: "Average (9)",
        },
        source: { book: "Basic Set (Moldvay)", page: 36 }
      },
      {
        edition: "b",
        mechanics: {
          hitDice: 1,
          hitDieModifier: -4,
          armorClass: 7,
          thac0: 19,
          movement: { ground: 20 },              // 6"
          attacks: [{ name: "Weapon", dice: "1d4" }],
          specialAttacks: ["-1 to hit in bright sunlight"],
        },
        lore: {
          alignment: "Lawful Evil",
          xpValue: 5,
          numberAppearing: "4d4",
          percentInLair: 50,
          treasureType: "J",
          intelligence: "Average",
        },
        source: { book: "Basic Set (Holmes)", page: 28 }
      },
      {
        edition: "odd",
        mechanics: {
          hitDice: 1,
          hitDieSize: 6,
          hitDieModifier: -3,                    // 1/2 HD (1d6/2)
          armorClass: 7,
          thac0: 19,
          movement: { ground: 20 },              // 6"
          attacks: [{ name: "Weapon", dice: "1d6" }],
          specialAttacks: ["-1 to hit in bright sunlight"],
        },
        lore: {
          alignment: "Chaotic",
          xpValue: 50,
          numberAppearing: "4d4",
          percentInLair: 50,
          treasureType: "J",
          intelligence: "Average",
        },
        source: { book: "Monsters & Treasure", page: 4 }
      },
      {
        edition: "3.5e",
        mechanics: {
          hitDice: 1,
          hitDieSize: 8,
          armorClass: 15,                            // 10 +1 size +1 natural +1 Dex +2 leather
          baseAttackBonus: 1,
          movement: { ground: 30 },
          attacks: [{ name: "Spear", dice: "1d6-1" }],
          specialAttacks: ["Light sensitivity"],
          abilities: { str: 9, dex: 13, con: 10, int: 10, wis: 9, cha: 8 },
        },
        lore: {
          alignment: "Lawful Evil",
          xpValue: 300,
          challengeRating: 0.25,
          organization: "Gang (4–9), band (10–100 plus 100% noncombatants), or tribe (40–400)",
          environment: "Temperate forests",
          intelligence: "Average",
        },
        source: { book: "Monster Manual (3.5e)", page: 161 }
      },
      {
        edition: "4e",
        mechanics: {
          level: 1,
          role: "Skirmisher",
          hitPoints: 27,
          armorClass: 15,
          fortitude: 11,
          reflex: 14,
          will: 11,
          initiative: 5,
          movement: { ground: 30 },                  // 6 squares
          attacks: [
            { name: "Spear", dice: "1d8" },
            { name: "Sling", dice: "1d6+3" }
          ],
          specialAttacks: ["Shifty (shift as minor action)", "Mob Attack (+1 per adjacent kobold ally)"],
          abilities: { str: 8, dex: 16, con: 12, int: 9, wis: 12, cha: 10 },
        },
        lore: {
          alignment: "Evil",
          xpValue: 100,
          origin: "Natural",
          intelligence: "Average",
        },
        source: { book: "Monster Manual (4e)", page: 167 }
      }
    ]
  },
  {
    id: "wolf",
    name: "Wolf",
    description: {
      short: "Pack hunters found throughout temperate and subarctic wilderness.",
      long: "Wolves are cunning and social predators that hunt in packs, using coordinated tactics to bring down prey larger than themselves.",
    },
    type: "Beast",
    sizeCategory: "Medium",
    languages: [],
    vision: "Passive Perception 13",
    editionRules: [
      {
        edition: "5e",
        mechanics: {
          hitDice: 2,
          hitDieSize: 8,
          armorClass: 13,
          attackBonus: 4,
          movement: { ground: 40 },
          attacks: [{ name: "Bite", dice: "2d4 + 2", damageType: "piercing" }],
          abilities: { str: 12, dex: 15, con: 12, int: 3, wis: 12, cha: 6 },
          traits: ["Keen Hearing and Smell", "Pack Tactics"],
        },
        lore: {
          alignment: "Neutral",
          challengeRating: 0.25,
          xpValue: 50,
          intelligence: "Semi- (2–4)",
        },
        source: { book: "Monster Manual" }
      },
      {
        edition: "2e",
        mechanics: {
          hitDice: 2,
          hitDieSize: 8,
          armorClass: 7,
          thac0: 19,
          movement: { ground: 18 },
          attacks: [{ name: "Bite", dice: "2-5" }],
          morale: { category: "Steady", value: 14 },
        },
        lore: {
          alignment: "Neutral",
          xpValue: 65,
          frequency: "Common",
          organization: "Pack",
          treasureType: "Nil",
          intelligence: "Semi- (2–4)",
        },
        source: { book: "Monstrous Manual" }
      },
      {
        edition: "1e",
        mechanics: {
          hitDice: 2,
          hitDieModifier: 2,
          armorClass: 7,
          thac0: 16,
          movement: { ground: 18 },
          attacks: [{ name: "Bite", dice: "2d4" }],
          psionicAbility: { min: null, max: null },
        },
        lore: {
          alignment: "Neutral",
          xpValue: 35,
          xpPerHp: 2,
          numberAppearing: { min: 2, max: 12 },
          percentInLair: 10,
          frequency: "Common",
          treasureType: "Nil",
          intelligence: "Semi- (2-4)",
          size: "Small (3ft at shoulder)",
        },
        source: { book: "Monster Manual (1977)", page: 100 }
      },
      {
        edition: "becmi",
        mechanics: {
          hitDice: 2,
          hitDieSize: 8,
          hitDieModifier: 2,
          armorClass: 7,
          thac0: 17,
          movement: { ground: 60 },          // 180'(60') encounter rate
          attacks: [{ name: "Bite", dice: "1d6" }],
          saveAs: { class: "Fighter", level: 1 },
          morale: 8,
        },
        lore: {
          alignment: "Neutral",
          xpValue: 25,
          numberAppearing: { wandering: "2d6", lair: "3d6" },
          treasureType: "Nil",
          intelligence: "Semi- (2)",
        },
        source: { book: "Rules Cyclopedia", page: 215 }
      },
      {
        edition: "bx",
        mechanics: {
          hitDice: 2,
          hitDieSize: 8,
          hitDieModifier: 2,
          armorClass: 7,
          thac0: 17,
          movement: { ground: 60 },
          attacks: [{ name: "Bite", dice: "1d6" }],
          saveAs: { class: "Fighter", level: 1 },
          morale: 8,
        },
        lore: {
          alignment: "Neutral",
          xpValue: 25,
          numberAppearing: { wandering: "2d6", lair: "3d6" },
          treasureType: "Nil",
          intelligence: "Semi- (2)",
        },
        source: { book: "Basic Set (Moldvay)", page: 46 }
      },
      {
        edition: "b",
        mechanics: {
          hitDice: 2,
          hitDieModifier: 2,
          armorClass: 7,
          thac0: 18,
          movement: { ground: 60 },              // 18"
          attacks: [{ name: "Bite", dice: "1d6" }],
        },
        lore: {
          alignment: "Neutral",
          xpValue: 25,
          numberAppearing: "2d6",
          percentInLair: 10,
          treasureType: "Nil",
          intelligence: "Semi-intelligent",
        },
        source: { book: "Basic Set (Holmes)", page: 41 }
      },
      {
        edition: "odd",
        mechanics: {
          hitDice: 2,
          hitDieSize: 6,
          hitDieModifier: 2,
          armorClass: 7,
          thac0: 18,
          movement: { ground: 60 },              // 18"
          attacks: [{ name: "Bite", dice: "1d6" }],
        },
        lore: {
          alignment: "Neutral",
          xpValue: 200,
          numberAppearing: "2d6",
          percentInLair: 10,
          treasureType: "Nil",
          intelligence: "Semi-intelligent",
        },
        source: { book: "Monsters & Treasure", page: 14 }
      },
      {
        edition: "3.5e",
        mechanics: {
          hitDice: 2,
          hitDieSize: 8,
          armorClass: 14,                            // 10 +2 natural +2 Dex
          baseAttackBonus: 1,
          movement: { ground: 50 },
          attacks: [{ name: "Bite", dice: "1d6+1" }],
          specialAttacks: ["Trip"],
          abilities: { str: 13, dex: 15, con: 15, int: 2, wis: 12, cha: 6 },
        },
        lore: {
          alignment: "True Neutral",
          xpValue: 600,
          challengeRating: 1,
          organization: "Solitary, pair, or pack (7–16)",
          environment: "Temperate forests",
          intelligence: "Animal",
        },
        source: { book: "Monster Manual (3.5e)", page: 283 }
      },
      {
        edition: "4e",
        mechanics: {
          level: 2,
          role: "Skirmisher",
          hitPoints: 38,
          armorClass: 14,
          fortitude: 14,
          reflex: 12,
          will: 12,
          initiative: 3,
          movement: { ground: 40 },                  // 8 squares
          attacks: [{ name: "Bite", dice: "1d6+2" }],
          specialAttacks: ["Pack Attack (+1d6 per adjacent wolf ally)", "Knockdown (target prone on hit)"],
          abilities: { str: 13, dex: 14, con: 14, int: 2, wis: 14, cha: 10 },
        },
        lore: {
          alignment: "Unaligned",
          xpValue: 125,
          origin: "Natural",
          intelligence: "Animal",
        },
        source: { book: "Monster Manual (4e)", page: 264 }
      }
    ]
  },
  {
    id: "zombie",
    name: "Zombie",
    description: {
      short: "Shambling corpses animated by dark necromantic energy.",
      long: "Zombies are mindless undead created through necromantic magic. They are slow but relentless, obeying simple commands from their creator without hesitation or self-preservation.",
    },
    type: "Undead",
    sizeCategory: "Medium",
    languages: ["Understands languages it knew in life but can't speak"],
    vision: "Darkvision 60 ft.",
    editionRules: [
      {
        edition: "5e",
        mechanics: {
          hitDice: 3,
          hitDieSize: 8,
          armorClass: 8,
          attackBonus: 3,
          movement: { ground: 20 },
          attacks: [{ name: "Slam", dice: "1d6 + 1", damageType: "bludgeoning" }],
          abilities: { str: 13, dex: 6, con: 16, int: 3, wis: 6, cha: 5 },
          traits: ["Undead Fortitude"],
        },
        lore: {
          alignment: "Neutral Evil",
          challengeRating: 0.25,
          xpValue: 50,
          intelligence: "Non- (0)",
        },
        source: { book: "Monster Manual" }
      },
      {
        edition: "2e",
        mechanics: {
          hitDice: 2,
          hitDieSize: 8,
          armorClass: 8,
          thac0: 19,
          movement: { ground: 6 },
          attacks: [{ name: "Slam", dice: "1-8" }],
          specialDefenses: ["Immune to sleep, charm, hold, and cold-based spells"],
          morale: { category: "Special", value: 20 },
        },
        lore: {
          alignment: "Neutral",
          xpValue: 65,
          frequency: "Uncommon",
          organization: "Solitary or pack",
          treasureType: "Nil",
          intelligence: "Non- (0)",
        },
        source: { book: "Monstrous Manual" }
      },
      {
        edition: "1e",
        mechanics: {
          hitDice: 2,
          armorClass: 8,
          thac0: 16,
          movement: { ground: 6 },
          attacks: [{ name: "Slam", dice: "1d8" }],
          specialAttacks: ["Always strikes last in a round"],
          specialDefenses: ["Immune to sleep, charm, hold, cold, poison"],
          psionicAbility: { min: null, max: null },
        },
        lore: {
          alignment: "Neutral",
          xpValue: 20,
          xpPerHp: 2,
          numberAppearing: { min: 3, max: 24 },
          percentInLair: 0,
          frequency: "Rare",
          treasureType: "Nil",
          intelligence: "Non-intelligent",
          size: "Medium (6ft)",
        },
        source: { book: "Monster Manual (1977)", page: 103 }
      },
      {
        edition: "becmi",
        mechanics: {
          hitDice: 2,
          hitDieSize: 8,
          armorClass: 8,
          thac0: 18,
          movement: { ground: 30 },          // 90'(30') encounter rate
          attacks: [{ name: "Claw", dice: "1d8" }],
          specialAttacks: ["Always loses initiative"],
          specialDefenses: ["Immune to sleep, charm, hold", "Unaffected by cold"],
          saveAs: { class: "Fighter", level: 1 },
          morale: 12,
        },
        lore: {
          alignment: "Chaotic",
          xpValue: 20,
          numberAppearing: { wandering: "2d4", lair: "4d6" },
          treasureType: "Nil",
          intelligence: "Non-intelligent (1)",
        },
        source: { book: "Rules Cyclopedia", page: 217 }
      },
      {
        edition: "bx",
        mechanics: {
          hitDice: 2,
          hitDieSize: 8,
          armorClass: 8,
          thac0: 18,
          movement: { ground: 30 },
          attacks: [{ name: "Claw", dice: "1d8" }],
          specialAttacks: ["Always loses initiative"],
          specialDefenses: ["Immune to sleep, charm, hold", "Unaffected by cold"],
          saveAs: { class: "Fighter", level: 1 },
          morale: 12,
        },
        lore: {
          alignment: "Chaotic",
          xpValue: 20,
          numberAppearing: { wandering: "2d4", lair: "4d6" },
          treasureType: "Nil",
          intelligence: "Non-intelligent (1)",
        },
        source: { book: "Basic Set (Moldvay)", page: 47 }
      },
      {
        edition: "b",
        mechanics: {
          hitDice: 2,
          armorClass: 8,
          thac0: 18,
          movement: { ground: 20 },              // 6"
          attacks: [{ name: "Claw", dice: "1d8" }],
          specialAttacks: ["Always loses initiative"],
          specialDefenses: ["Immune to sleep, charm, hold"],
        },
        lore: {
          alignment: "Neutral",
          xpValue: 20,
          numberAppearing: "2d4",
          percentInLair: 0,
          treasureType: "Nil",
          intelligence: "Non-intelligent",
        },
        source: { book: "Basic Set (Holmes)", page: 41 }
      },
      {
        edition: "odd",
        mechanics: {
          hitDice: 2,
          hitDieSize: 6,
          armorClass: 8,
          thac0: 18,
          movement: { ground: 20 },              // 6"
          attacks: [{ name: "Claw", dice: "1d6" }],
          specialAttacks: ["Always loses initiative"],
          specialDefenses: ["Immune to sleep, charm, hold"],
        },
        lore: {
          alignment: "Neutral",
          xpValue: 200,
          numberAppearing: "2d4",
          percentInLair: 0,
          treasureType: "Nil",
          intelligence: "Non-intelligent",
        },
        source: { book: "Monsters & Treasure", page: 10 }
      },
      {
        edition: "3.5e",
        mechanics: {
          hitDice: 2,
          hitDieSize: 12,
          armorClass: 11,                            // 10 +1 natural (no Dex bonus, no Con bonus)
          baseAttackBonus: 1,
          movement: { ground: 30 },
          attacks: [
            { name: "Slam", dice: "1d6+1" },
          ],
          specialDefenses: ["DR 5/slashing", "Single actions only"],
          abilities: { str: 12, dex: 10, con: 0, int: 0, wis: 10, cha: 1 },
        },
        lore: {
          alignment: "Neutral Evil",
          xpValue: 600,
          challengeRating: 0.5,
          organization: "Any",
          environment: "Any",
          intelligence: "Non-intelligent",
        },
        source: { book: "Monster Manual (3.5e)", page: 265 }
      },
      {
        edition: "4e",
        mechanics: {
          level: 2,
          role: "Brute",
          hitPoints: 40,
          armorClass: 13,
          fortitude: 14,
          reflex: 10,
          will: 10,
          initiative: 0,
          movement: { ground: 20 },                  // 4 squares
          attacks: [{ name: "Slam", dice: "1d6+3" }],
          specialDefenses: ["Immune to disease, poison"],
          abilities: { str: 14, dex: 8, con: 13, int: 1, wis: 8, cha: 3 },
        },
        lore: {
          alignment: "Unaligned",
          xpValue: 125,
          origin: "Natural",
          intelligence: "Non-intelligent",
        },
        source: { book: "Monster Manual (4e)", page: 274 }
      }
    ]
  },
  {
    id: "bugbear",
    name: "Bugbear",
    description: {
      short: "Stealthy, brutish goblinoids that delight in ambush and cruelty.",
      long: "Bugbears are the largest of the goblinoid races, combining brute strength with a surprising talent for stealth. They prefer ambush over direct confrontation and bully weaker creatures into servitude.",
    },
    type: "Humanoid",
    subtype: "Goblinoid",
    sizeCategory: "Medium",
    languages: ["Common", "Goblin"],
    vision: "Darkvision 60 ft.",
    editionRules: [
      {
        edition: "5e",
        mechanics: {
          hitDice: 5,
          hitDieSize: 8,
          armorClass: 16,
          attackBonus: 4,
          movement: { ground: 30 },
          attacks: [
            { name: "Morningstar", dice: "2d8 + 2", damageType: "piercing" },
            { name: "Javelin", dice: "2d6 + 2", damageType: "piercing" }
          ],
          abilities: { str: 15, dex: 14, con: 13, int: 8, wis: 11, cha: 9 },
          traits: ["Brute", "Surprise Attack", "Stealthy"],
        },
        lore: {
          alignment: "Chaotic Evil",
          challengeRating: 1,
          xpValue: 200,
          intelligence: "Average (8–10)",
        },
        source: { book: "Monster Manual" }
      },
      {
        edition: "2e",
        mechanics: {
          hitDice: 3,
          hitDieSize: 8,
          armorClass: 5,
          thac0: 17,
          movement: { ground: 9 },
          attacks: [{ name: "Weapon", dice: "2-8" }],
          morale: { category: "Steady", value: 12 },
        },
        lore: {
          alignment: "Chaotic Evil",
          xpValue: 65,
          frequency: "Uncommon",
          organization: "Tribal",
          treasureType: "C",
          intelligence: "Average",
        },
        source: { book: "Monstrous Manual" }
      },
      {
        edition: "1e",
        mechanics: {
          hitDice: 3,
          hitDieModifier: 1,
          armorClass: 5,
          thac0: 16,
          movement: { ground: 9 },
          attacks: [{ name: "Weapon", dice: "2d4" }],
          specialAttacks: ["Surprise on 1-3 (d6)"],
          psionicAbility: { min: null, max: null },
        },
        lore: {
          alignment: "Chaotic Evil",
          xpValue: 60,
          xpPerHp: 3,
          numberAppearing: { min: 5, max: 20 },
          percentInLair: 25,
          frequency: "Uncommon",
          treasureType: {
            individual: "B",
            lair: "B",
          },
          intelligence: "Low to average",
          size: "Large (7ft)",
        },
        source: { book: "Monster Manual (1977)", page: 12 }
      },
      {
        edition: "becmi",
        mechanics: {
          hitDice: 3,
          hitDieSize: 8,
          hitDieModifier: 1,
          armorClass: 5,
          thac0: 16,
          movement: { ground: 30 },          // 90'(30') encounter rate
          attacks: [{ name: "Weapon", dice: "2d4" }],
          specialAttacks: ["Surprise on 1-3 (d6)"],
          saveAs: { class: "Fighter", level: 3 },
          morale: 9,
        },
        lore: {
          alignment: "Chaotic",
          xpValue: 50,
          numberAppearing: { wandering: "2d4", lair: "5d4" },
          treasureType: "B",
          intelligence: "Average (9)",
        },
        source: { book: "Rules Cyclopedia", page: 163 }
      },
      {
        edition: "bx",
        mechanics: {
          hitDice: 3,
          hitDieSize: 8,
          hitDieModifier: 1,
          armorClass: 5,
          thac0: 16,
          movement: { ground: 30 },
          attacks: [{ name: "Weapon", dice: "2d4" }],
          specialAttacks: ["Surprise on 1-3 (d6)"],
          saveAs: { class: "Fighter", level: 3 },
          morale: 9,
        },
        lore: {
          alignment: "Chaotic",
          xpValue: 50,
          numberAppearing: { wandering: "2d4", lair: "5d4" },
          treasureType: "B",
          intelligence: "Average (9)",
        },
        source: { book: "Basic Set (Moldvay)", page: 30 }
      },
      {
        edition: "b",
        mechanics: {
          hitDice: 3,
          hitDieModifier: 1,
          armorClass: 5,
          thac0: 16,
          movement: { ground: 30 },              // 9"
          attacks: [{ name: "Weapon", dice: "2d4" }],
          specialAttacks: ["Surprise on 1-3 (d6)"],
        },
        lore: {
          alignment: "Chaotic Evil",
          xpValue: 50,
          numberAppearing: "2d4",
          percentInLair: 25,
          treasureType: "B",
          intelligence: "Average",
        },
        source: { book: "Basic Set (Holmes)", page: 22 }
      },
      {
        edition: "odd",
        mechanics: {
          hitDice: 3,
          hitDieSize: 6,
          hitDieModifier: 1,
          armorClass: 5,
          thac0: 16,
          movement: { ground: 30 },              // 9"
          attacks: [{ name: "Weapon", dice: "1d6" }],
          specialAttacks: ["Surprise on 1-3 (d6)"],
        },
        lore: {
          alignment: "Chaotic",
          xpValue: 300,
          numberAppearing: "2d4",
          percentInLair: 25,
          treasureType: "B",
          intelligence: "Average",
        },
        source: { book: "Monsters & Treasure", page: 5 }
      },
      {
        edition: "3.5e",
        mechanics: {
          hitDice: 3,
          hitDieSize: 8,
          armorClass: 17,                            // 10 +1 Dex +3 natural +2 leather +1 light shield
          baseAttackBonus: 2,
          movement: { ground: 30 },
          attacks: [{ name: "Morningstar", dice: "1d8+2" }],
          abilities: { str: 15, dex: 12, con: 13, int: 10, wis: 10, cha: 9 },
        },
        lore: {
          alignment: "Chaotic Evil",
          xpValue: 900,
          challengeRating: 2,
          organization: "Solitary, pair, gang (3–4), or band (5–12)",
          environment: "Temperate mountains",
          intelligence: "Average",
        },
        source: { book: "Monster Manual (3.5e)", page: 29 }
      },
      {
        edition: "4e",
        mechanics: {
          level: 5,
          role: "Brute",
          hitPoints: 75,
          armorClass: 17,
          fortitude: 18,
          reflex: 15,
          will: 14,
          initiative: 4,
          movement: { ground: 30 },                  // 6 squares
          attacks: [{ name: "Morningstar", dice: "2d10+5" }],
          specialAttacks: ["Predatory Eye (free action, target grants combat advantage)"],
          abilities: { str: 20, dex: 14, con: 15, int: 10, wis: 12, cha: 9 },
        },
        lore: {
          alignment: "Evil",
          xpValue: 200,
          origin: "Natural",
          intelligence: "Average",
        },
        source: { book: "Monster Manual (4e)", page: 135 }
      }
    ]
  },
  {
    id: "ogre",
    name: "Ogre",
    description: {
      short: "Dim-witted, hulking giants that use brute strength to dominate.",
      long: "Ogres are large, ugly, and bad-tempered creatures that subsist through raiding and scavenging. They are often employed as mercenaries or enforcers by more cunning evil leaders.",
    },
    type: "Giant",
    sizeCategory: "Large",
    languages: ["Common", "Giant"],
    vision: "Darkvision 60 ft.",
    editionRules: [
      {
        edition: "5e",
        mechanics: {
          hitDice: 7,
          hitDieSize: 10,
          armorClass: 11,
          attackBonus: 6,
          movement: { ground: 40 },
          attacks: [
            { name: "Greatclub", dice: "2d8 + 4", damageType: "bludgeoning" },
            { name: "Javelin", dice: "2d6 + 4", damageType: "piercing" }
          ],
          abilities: { str: 19, dex: 8, con: 16, int: 5, wis: 7, cha: 7 },
        },
        lore: {
          alignment: "Chaotic Evil",
          challengeRating: 2,
          xpValue: 450,
          intelligence: "Low (5–7)",
        },
        source: { book: "Monster Manual" }
      },
      {
        edition: "2e",
        mechanics: {
          hitDice: 4,
          hitDieSize: 8,
          armorClass: 5,
          thac0: 17,
          movement: { ground: 12 },
          attacks: [{ name: "Weapon", dice: "1-10" }],
          morale: { category: "Steady", value: 12 },
        },
        lore: {
          alignment: "Chaotic Evil",
          xpValue: 270,
          frequency: "Uncommon",
          organization: "Tribal",
          treasureType: "C",
          intelligence: "Low (5–7)",
        },
        source: { book: "Monstrous Manual" }
      },
      {
        edition: "1e",
        mechanics: {
          hitDice: 4,
          hitDieModifier: 1,
          armorClass: 5,
          thac0: 15,
          movement: { ground: 9 },
          attacks: [{ name: "Weapon", dice: "1d10" }],
          psionicAbility: { min: null, max: null },
        },
        lore: {
          alignment: "Chaotic Evil",
          xpValue: 90,
          xpPerHp: 4,
          numberAppearing: { min: 1, max: 6 },
          percentInLair: 20,
          frequency: "Uncommon",
          treasureType: {
            individual: "M",
            lair: "C, Q",
          },
          intelligence: "Low (5-7)",
          size: "Large (9ft+)",
        },
        source: { book: "Monster Manual (1977)", page: 75 }
      },
      {
        edition: "becmi",
        mechanics: {
          hitDice: 4,
          hitDieSize: 8,
          hitDieModifier: 1,
          armorClass: 5,
          thac0: 15,
          movement: { ground: 30 },          // 90'(30') encounter rate
          attacks: [{ name: "Club", dice: "1d10" }],
          saveAs: { class: "Fighter", level: 4 },
          morale: 10,
        },
        lore: {
          alignment: "Chaotic",
          xpValue: 125,
          numberAppearing: { wandering: "1d6", lair: "2d6" },
          treasureType: "C + 1000gp",
          intelligence: "Low (6)",
        },
        source: { book: "Rules Cyclopedia", page: 190 }
      },
      {
        edition: "bx",
        mechanics: {
          hitDice: 4,
          hitDieSize: 8,
          hitDieModifier: 1,
          armorClass: 5,
          thac0: 15,
          movement: { ground: 30 },
          attacks: [{ name: "Club", dice: "1d10" }],
          saveAs: { class: "Fighter", level: 4 },
          morale: 10,
        },
        lore: {
          alignment: "Chaotic",
          xpValue: 125,
          numberAppearing: { wandering: "1d6", lair: "2d6" },
          treasureType: "C + 1000gp",
          intelligence: "Low (6)",
        },
        source: { book: "Expert Set (Cook/Marsh)", page: 36 }
      },
      {
        edition: "b",
        mechanics: {
          hitDice: 4,
          hitDieModifier: 1,
          armorClass: 5,
          thac0: 15,
          movement: { ground: 30 },              // 9"
          attacks: [{ name: "Club", dice: "1d10" }],
        },
        lore: {
          alignment: "Chaotic Evil",
          xpValue: 125,
          numberAppearing: "1d6",
          percentInLair: 30,
          treasureType: "C",
          intelligence: "Low",
        },
        source: { book: "Basic Set (Holmes)", page: 31 }
      },
      {
        edition: "odd",
        mechanics: {
          hitDice: 4,
          hitDieSize: 6,
          hitDieModifier: 1,
          armorClass: 5,
          thac0: 15,
          movement: { ground: 30 },              // 9"
          attacks: [{ name: "Club", dice: "1d6" }],
        },
        lore: {
          alignment: "Chaotic",
          xpValue: 400,
          numberAppearing: "1d6",
          percentInLair: 30,
          treasureType: "C",
          intelligence: "Low",
        },
        source: { book: "Monsters & Treasure", page: 6 }
      },
      {
        edition: "3.5e",
        mechanics: {
          hitDice: 4,
          hitDieSize: 8,
          armorClass: 16,                            // 10 -1 size +5 natural +2 hide armor
          baseAttackBonus: 3,
          movement: { ground: 40 },
          attacks: [{ name: "Greatclub", dice: "2d8+7" }],
          abilities: { str: 21, dex: 8, con: 15, int: 6, wis: 10, cha: 7 },
        },
        lore: {
          alignment: "Chaotic Evil",
          xpValue: 1200,
          challengeRating: 3,
          organization: "Solitary, pair, gang (3–4), or band (5–8)",
          environment: "Temperate hills",
          intelligence: "Low",
        },
        source: { book: "Monster Manual (3.5e)", page: 198 }
      },
      {
        edition: "4e",
        mechanics: {
          level: 8,
          role: "Brute",
          hitPoints: 111,
          armorClass: 20,
          fortitude: 22,
          reflex: 17,
          will: 17,
          initiative: 5,
          movement: { ground: 40 },                  // 8 squares
          attacks: [{ name: "Greatclub", dice: "2d10+7" }],
          specialAttacks: ["Angry Smash (recharge 5–6, 3d10+7 damage and push 2 squares)"],
          abilities: { str: 21, dex: 12, con: 19, int: 4, wis: 10, cha: 6 },
        },
        lore: {
          alignment: "Chaotic Evil",
          xpValue: 350,
          origin: "Natural",
          intelligence: "Low",
        },
        source: { book: "Monster Manual (4e)", page: 198 }
      }
    ]
  },
  {
    id: "troll",
    name: "Troll",
    description: {
      short: "Loathsome giants with terrible claws and fearsome regeneration.",
      long: "Trolls are fearsome green-skinned giants known for their ability to regenerate even the most grievous wounds. Only fire and acid can permanently halt their regeneration.",
    },
    type: "Giant",
    sizeCategory: "Large",
    languages: ["Giant"],
    vision: "Darkvision 60 ft.",
    editionRules: [
      {
        edition: "5e",
        mechanics: {
          hitDice: 8,
          hitDieSize: 10,
          armorClass: 15,
          attackBonus: 7,
          movement: { ground: 30 },
          attacks: [
            { name: "Bite", dice: "1d6 + 4", damageType: "piercing" },
            { name: "Claw", dice: "2d6 + 4", damageType: "slashing" }
          ],
          abilities: { str: 18, dex: 13, con: 20, int: 7, wis: 9, cha: 7 },
          traits: ["Keen Smell", "Regeneration"],
        },
        lore: {
          alignment: "Chaotic Evil",
          challengeRating: 5,
          xpValue: 1800,
          intelligence: "Low (5–7)",
        },
        source: { book: "Monster Manual" }
      },
      {
        edition: "2e",
        mechanics: {
          hitDice: 6,
          hitDieSize: 8,
          armorClass: 4,
          thac0: 15,
          movement: { ground: 12 },
          attacks: [
            { name: "Claw", dice: "1-4" },
            { name: "Claw", dice: "1-4" },
            { name: "Bite", dice: "1-8" }
          ],
          specialDefenses: ["Regenerates 3 hp/round; fire and acid prevent regeneration"],
          morale: { category: "Steady", value: 12 },
        },
        lore: {
          alignment: "Chaotic Evil",
          xpValue: 975,
          frequency: "Uncommon",
          organization: "Solitary or pack",
          treasureType: "C",
          intelligence: "Low (5–7)",
        },
        source: { book: "Monstrous Manual" }
      },
      {
        edition: "1e",
        mechanics: {
          hitDice: 6,
          hitDieModifier: 6,
          armorClass: 4,
          thac0: 13,
          movement: { ground: 12 },
          attacks: [
            { name: "Claw", dice: "1d4+4" },
            { name: "Claw", dice: "1d4+4" },
            { name: "Bite", dice: "2d6" }
          ],
          specialDefenses: ["Regeneration 3 hp/round; fire and acid prevent regeneration"],
          psionicAbility: { min: null, max: null },
        },
        lore: {
          alignment: "Chaotic Evil",
          xpValue: 450,
          xpPerHp: 6,
          numberAppearing: { min: 1, max: 12 },
          percentInLair: 40,
          frequency: "Uncommon",
          treasureType: {
            individual: "D",
            lair: "D",
          },
          intelligence: "Low (5-7)",
          size: "Large (9ft+)",
        },
        source: { book: "Monster Manual (1977)", page: 97 }
      },
      {
        edition: "becmi",
        mechanics: {
          hitDice: 6,
          hitDieSize: 8,
          hitDiceAsterisks: 1,              // regeneration
          hitDieModifier: 3,
          armorClass: 4,
          thac0: 13,
          movement: { ground: 40 },          // 120'(40') encounter rate
          attacks: [
            { name: "Claw", dice: "1d6" },
            { name: "Claw", dice: "1d6" },
            { name: "Bite", dice: "1d10" }
          ],
          specialAttacks: ["Regeneration 3 hp/round after 3 rounds"],
          specialDefenses: ["Fire and acid prevent regeneration"],
          saveAs: { class: "Fighter", level: 6 },
          morale: 10,
        },
        lore: {
          alignment: "Chaotic",
          xpValue: 650,
          numberAppearing: { wandering: "1d8", lair: "1d8" },
          treasureType: "D",
          intelligence: "Low (7)",
        },
        source: { book: "Rules Cyclopedia", page: 208 }
      },
      {
        edition: "bx",
        mechanics: {
          hitDice: 6,
          hitDieSize: 8,
          hitDiceAsterisks: 1,
          hitDieModifier: 3,
          armorClass: 4,
          thac0: 13,
          movement: { ground: 40 },
          attacks: [
            { name: "Claw", dice: "1d6" },
            { name: "Claw", dice: "1d6" },
            { name: "Bite", dice: "1d10" }
          ],
          specialAttacks: ["Regeneration 3 hp/round after 3 rounds"],
          specialDefenses: ["Fire and acid prevent regeneration"],
          saveAs: { class: "Fighter", level: 6 },
          morale: 10,
        },
        lore: {
          alignment: "Chaotic",
          xpValue: 650,
          numberAppearing: { wandering: "1d8", lair: "1d8" },
          treasureType: "D",
          intelligence: "Low (7)",
        },
        source: { book: "Expert Set (Cook/Marsh)", page: 41 }
      },
      {
        edition: "b",
        mechanics: {
          hitDice: 6,
          hitDieModifier: 3,
          armorClass: 4,
          thac0: 13,
          movement: { ground: 40 },              // 12"
          attacks: [
            { name: "Claw", dice: "1d6" },
            { name: "Claw", dice: "1d6" },
            { name: "Bite", dice: "1d10" }
          ],
          specialAttacks: ["Regeneration 3 hp/round after 3 rounds"],
          specialDefenses: ["Fire and acid prevent regeneration"],
        },
        lore: {
          alignment: "Chaotic Evil",
          xpValue: 650,
          numberAppearing: "1d8",
          percentInLair: 40,
          treasureType: "D",
          intelligence: "Low",
        },
        source: { book: "Basic Set (Holmes)", page: 39 }
      },
      {
        edition: "odd",
        mechanics: {
          hitDice: 6,
          hitDieSize: 6,
          hitDieModifier: 3,
          armorClass: 4,
          thac0: 13,
          movement: { ground: 40 },              // 12"
          attacks: [
            { name: "Claw", dice: "1d6" },
            { name: "Claw", dice: "1d6" },
            { name: "Bite", dice: "1d6" }
          ],
          specialAttacks: ["Regeneration 3 hp/round"],
          specialDefenses: ["Fire and acid prevent regeneration"],
        },
        lore: {
          alignment: "Chaotic",
          xpValue: 700,
          numberAppearing: "1d8",
          percentInLair: 40,
          treasureType: "D",
          intelligence: "Low",
        },
        source: { book: "Monsters & Treasure", page: 6 }
      },
      {
        edition: "3.5e",
        mechanics: {
          hitDice: 6,
          hitDieSize: 8,
          armorClass: 16,                            // 10 -1 size +7 natural
          baseAttackBonus: 4,
          movement: { ground: 30 },
          attacks: [
            { name: "Claw", dice: "1d6+6" },
            { name: "Claw", dice: "1d6+6" },
            { name: "Bite", dice: "1d6+3" }
          ],
          specialAttacks: ["Rend 2d6+9"],
          specialDefenses: ["Regeneration 5"],
          abilities: { str: 23, dex: 14, con: 23, int: 6, wis: 9, cha: 6 },
        },
        lore: {
          alignment: "Chaotic Evil",
          xpValue: 1800,
          challengeRating: 5,
          organization: "Solitary or gang (3–5)",
          environment: "Cold mountains",
          intelligence: "Low",
        },
        source: { book: "Monster Manual (3.5e)", page: 247 }
      },
      {
        edition: "4e",
        mechanics: {
          level: 9,
          role: "Brute",
          hitPoints: 100,
          armorClass: 19,
          fortitude: 22,
          reflex: 18,
          will: 17,
          initiative: 6,
          movement: { ground: 40 },                  // 8 squares
          attacks: [
            { name: "Claw", dice: "2d6+5" },
            { name: "Claw", dice: "2d6+5" }
          ],
          specialAttacks: ["Frenzied Strike (recharge when bloodied)"],
          specialDefenses: ["Regeneration 10 (disabled by fire or acid)", "Troll Healing"],
          abilities: { str: 22, dex: 18, con: 20, int: 5, wis: 12, cha: 8 },
        },
        lore: {
          alignment: "Chaotic Evil",
          xpValue: 400,
          origin: "Natural",
          intelligence: "Low",
        },
        source: { book: "Monster Manual (4e)", page: 254 }
      }
    ]
  },
  {
    id: "owlbear",
    name: "Owlbear",
    description: {
      short: "A monstrous cross between a giant owl and a bear.",
      long: "The owlbear is a ferocious predator with the body of a bear and the head of a giant owl. Its origin is commonly attributed to a wizard's experiment gone wrong.",
    },
    type: "Monstrosity",
    sizeCategory: "Large",
    languages: [],
    vision: "Darkvision 60 ft.",
    editionRules: [
      {
        edition: "5e",
        mechanics: {
          hitDice: 7,
          hitDieSize: 10,
          armorClass: 13,
          attackBonus: 7,
          movement: { ground: 40 },
          attacks: [
            { name: "Beak", dice: "2d8 + 5", damageType: "piercing" },
            { name: "Claws", dice: "2d6 + 5", damageType: "slashing" }
          ],
          abilities: { str: 20, dex: 12, con: 17, int: 3, wis: 12, cha: 7 },
          traits: ["Keen Sight and Smell"],
        },
        lore: {
          alignment: "Chaotic Neutral",
          challengeRating: 3,
          xpValue: 700,
          intelligence: "Animal (2–4)",
        },
        source: { book: "Monster Manual" }
      },
      {
        edition: "2e",
        mechanics: {
          hitDice: 5,
          hitDieSize: 8,
          armorClass: 5,
          thac0: 15,
          movement: { ground: 12 },
          attacks: [
            { name: "Claw", dice: "1-6" },
            { name: "Claw", dice: "1-6" },
            { name: "Bite", dice: "1-8" }
          ],
          morale: { category: "Steady", value: 12 },
        },
        lore: {
          alignment: "Neutral",
          xpValue: 975,
          frequency: "Rare",
          organization: "Solitary or pair",
          treasureType: "C",
          intelligence: "Semi- (2–4)",
        },
        source: { book: "Monstrous Manual" }
      },
      {
        edition: "1e",
        mechanics: {
          hitDice: 5,
          hitDieModifier: 2,
          armorClass: 5,
          thac0: 15,
          movement: { ground: 12 },
          attacks: [
            { name: "Claw", dice: "1d6" },
            { name: "Claw", dice: "1d6" },
            { name: "Bite", dice: "2d6" }
          ],
          specialAttacks: ["Hug for 2d8 if both claws hit"],
          psionicAbility: { min: null, max: null },
        },
        lore: {
          alignment: "Neutral",
          xpValue: 225,
          xpPerHp: 5,
          numberAppearing: { min: 2, max: 5 },
          percentInLair: 30,
          frequency: "Rare",
          treasureType: "C",
          intelligence: "Low (5-7)",
          size: "Large (8ft)",
        },
        source: { book: "Monster Manual (1977)", page: 77 }
      },
      {
        edition: "becmi",
        mechanics: {
          hitDice: 5,
          hitDieSize: 8,
          armorClass: 5,
          thac0: 15,
          movement: { ground: 40 },          // 120'(40') encounter rate
          attacks: [
            { name: "Claw", dice: "1d8" },
            { name: "Claw", dice: "1d8" },
            { name: "Bite", dice: "1d8" }
          ],
          specialAttacks: ["Hug for 2d8 if both claws hit"],
          saveAs: { class: "Fighter", level: 3 },
          morale: 9,
        },
        lore: {
          alignment: "Neutral",
          xpValue: 175,
          numberAppearing: { wandering: "1d4", lair: "1d4" },
          treasureType: "C",
          intelligence: "Semi- (2)",
        },
        source: { book: "Rules Cyclopedia", page: 191 }
      },
      {
        edition: "bx",
        mechanics: {
          hitDice: 5,
          hitDieSize: 8,
          armorClass: 5,
          thac0: 15,
          movement: { ground: 40 },
          attacks: [
            { name: "Claw", dice: "1d8" },
            { name: "Claw", dice: "1d8" },
            { name: "Bite", dice: "1d8" }
          ],
          specialAttacks: ["Hug for 2d8 if both claws hit"],
          saveAs: { class: "Fighter", level: 3 },
          morale: 9,
        },
        lore: {
          alignment: "Neutral",
          xpValue: 175,
          numberAppearing: { wandering: "1d4", lair: "1d4" },
          treasureType: "C",
          intelligence: "Semi- (2)",
        },
        source: { book: "Expert Set (Cook/Marsh)", page: 36 }
      },
      {
        edition: "b",
        mechanics: {
          hitDice: 5,
          armorClass: 5,
          thac0: 15,
          movement: { ground: 40 },              // 12"
          attacks: [
            { name: "Claw", dice: "1d8" },
            { name: "Claw", dice: "1d8" },
            { name: "Bite", dice: "1d8" }
          ],
          specialAttacks: ["Hug for 2d8 if both claws hit"],
        },
        lore: {
          alignment: "Neutral",
          xpValue: 225,
          numberAppearing: "1d4",
          percentInLair: 30,
          treasureType: "C",
          intelligence: "Semi-intelligent",
        },
        source: { book: "Basic Set (Holmes)", page: 33 }
      },
      {
        edition: "odd",
        mechanics: {
          hitDice: 5,
          hitDieSize: 6,
          armorClass: 5,
          thac0: 15,
          movement: { ground: 40 },              // 12"
          attacks: [
            { name: "Claw", dice: "1d6" },
            { name: "Claw", dice: "1d6" },
            { name: "Bite", dice: "1d6" }
          ],
          specialAttacks: ["Hug for 2d6 if both claws hit"],
        },
        lore: {
          alignment: "Neutral",
          xpValue: 500,
          numberAppearing: "1d4",
          percentInLair: 30,
          treasureType: "C",
          intelligence: "Semi-intelligent",
        },
        source: { book: "Monsters & Treasure", page: 5 }
      },
      {
        edition: "3.5e",
        mechanics: {
          hitDice: 5,
          hitDieSize: 10,
          armorClass: 15,                            // 10 -1 size +3 Dex +3 natural
          baseAttackBonus: 3,
          movement: { ground: 30 },
          attacks: [
            { name: "Claw", dice: "1d6+5" },
            { name: "Claw", dice: "1d6+5" },
            { name: "Bite", dice: "1d8+2" }
          ],
          specialAttacks: ["Improved Grab"],
          abilities: { str: 21, dex: 12, con: 21, int: 2, wis: 12, cha: 10 },
        },
        lore: {
          alignment: "True Neutral",
          xpValue: 1500,
          challengeRating: 4,
          organization: "Solitary, pair, or pack (3–8)",
          environment: "Temperate forests",
          intelligence: "Animal",
        },
        source: { book: "Monster Manual (3.5e)", page: 206 }
      },
      {
        edition: "4e",
        mechanics: {
          level: 8,
          role: "Brute",
          roleModifier: "Elite",
          hitPoints: 212,
          armorClass: 21,
          fortitude: 21,
          reflex: 18,
          will: 18,
          initiative: 5,
          movement: { ground: 35 },                  // 7 squares
          attacks: [
            { name: "Claw", dice: "1d10+5" },
            { name: "Claw", dice: "1d10+5" }
          ],
          specialAttacks: ["Double Attack (two claw attacks as standard)", "Bear Hug (2d8+5 and grabbed)"],
          abilities: { str: 20, dex: 12, con: 20, int: 2, wis: 12, cha: 10 },
        },
        lore: {
          alignment: "Unaligned",
          xpValue: 700,
          origin: "Natural",
          intelligence: "Animal",
        },
        source: { book: "Monster Manual (4e)", page: 212 }
      }
    ]
  },
  {
    id: "gelatinous-cube",
    name: "Gelatinous Cube",
    description: {
      short: "A nearly transparent ooze that fills dungeon corridors.",
      long: "The gelatinous cube is a transparent, ten-foot cube of gelatinous material that scours dungeon corridors clean of organic refuse. Treasures of past victims float suspended within its body.",
    },
    type: "Ooze",
    sizeCategory: "Large",
    languages: [],
    vision: "Blindsight 60 ft. (blind beyond)",
    editionRules: [
      {
        edition: "5e",
        mechanics: {
          hitDice: 8,
          hitDieSize: 10,
          armorClass: 6,
          attackBonus: 5,
          movement: { ground: 15 },
          attacks: [
            { name: "Pseudopod", dice: "1d6 + 2", damageType: "bludgeoning" }
          ],
          abilities: { str: 14, dex: 3, con: 20, int: 1, wis: 6, cha: 1 },
          traits: ["Ooze Cube", "Transparent", "Engulf"],
        },
        lore: {
          alignment: "Unaligned",
          challengeRating: 2,
          xpValue: 450,
          intelligence: "Non- (0)",
        },
        source: { book: "Monster Manual" }
      },
      {
        edition: "2e",
        mechanics: {
          hitDice: 6,
          hitDieSize: 8,
          armorClass: 8,
          thac0: 19,
          movement: { ground: 6 },
          attacks: [{ name: "Engulf", dice: "2-8" }],
          specialDefenses: ["Immune to sleep, charm, hold, and cold-based spells"],
          morale: { category: "Special", value: 20 },
        },
        lore: {
          alignment: "Neutral",
          xpValue: 975,
          frequency: "Rare",
          organization: "Solitary",
          treasureType: "V",
          intelligence: "Non- (0)",
        },
        source: { book: "Monstrous Manual" }
      },
      {
        edition: "1e",
        mechanics: {
          hitDice: 4,
          armorClass: 8,
          thac0: 15,
          movement: { ground: 6 },
          attacks: [{ name: "Engulf", dice: "2d4" }],
          specialAttacks: ["Anesthetization", "Paralysis"],
          specialDefenses: ["Immune to electricity, fear, holds, paralysis, sleep"],
          psionicAbility: { min: null, max: null },
        },
        lore: {
          alignment: "Neutral",
          xpValue: 110,
          xpPerHp: 4,
          numberAppearing: { min: 1, max: 1 },
          percentInLair: 0,
          frequency: "Uncommon",
          treasureType: "Incidental",
          intelligence: "Non-intelligent",
          size: "Large (10ft cube)",
        },
        source: { book: "Monster Manual (1977)", page: 43 }
      },
      {
        edition: "becmi",
        mechanics: {
          hitDice: 4,
          hitDieSize: 8,
          hitDiceAsterisks: 1,              // paralysis
          armorClass: 8,
          thac0: 16,
          movement: { ground: 20 },          // 60'(20') encounter rate
          attacks: [{ name: "Engulf", dice: "2d4" }],
          specialAttacks: ["Paralysis (save vs. paralysis)", "Surprise on 1-4"],
          specialDefenses: ["Immune to lightning and cold"],
          saveAs: { class: "Fighter", level: 2 },
          morale: 12,
        },
        lore: {
          alignment: "Neutral",
          xpValue: 125,
          numberAppearing: { wandering: "1", lair: "0" },
          treasureType: "V",
          intelligence: "Non-intelligent (1)",
        },
        source: { book: "Rules Cyclopedia", page: 177 }
      },
      {
        edition: "bx",
        mechanics: {
          hitDice: 4,
          hitDieSize: 8,
          hitDiceAsterisks: 1,
          armorClass: 8,
          thac0: 16,
          movement: { ground: 20 },
          attacks: [{ name: "Engulf", dice: "2d4" }],
          specialAttacks: ["Paralysis (save vs. paralysis)", "Surprise on 1-4"],
          specialDefenses: ["Immune to lightning and cold"],
          saveAs: { class: "Fighter", level: 2 },
          morale: 12,
        },
        lore: {
          alignment: "Neutral",
          xpValue: 125,
          numberAppearing: { wandering: "1", lair: "0" },
          treasureType: "V",
          intelligence: "Non-intelligent (1)",
        },
        source: { book: "Basic Set (Moldvay)", page: 33 }
      },
      {
        edition: "b",
        mechanics: {
          hitDice: 4,
          armorClass: 8,
          thac0: 16,
          movement: { ground: 20 },              // 6"
          attacks: [{ name: "Engulf", dice: "2d4" }],
          specialAttacks: ["Paralysis (save vs. paralysis)", "Surprise on 1-4"],
          specialDefenses: ["Immune to lightning and cold"],
        },
        lore: {
          alignment: "Neutral",
          xpValue: 125,
          numberAppearing: "1",
          percentInLair: 0,
          treasureType: "V",
          intelligence: "Non-intelligent",
        },
        source: { book: "Basic Set (Holmes)", page: 25 }
      },
      {
        edition: "odd",
        mechanics: {
          hitDice: 4,
          hitDieSize: 6,
          armorClass: 8,
          thac0: 16,
          movement: { ground: 20 },              // 6"
          attacks: [{ name: "Engulf", dice: "1d6" }],
          specialAttacks: ["Paralysis (save vs. paralysis)", "Surprise on 1-4"],
          specialDefenses: ["Immune to lightning and cold"],
        },
        lore: {
          alignment: "Neutral",
          xpValue: 400,
          numberAppearing: "1",
          percentInLair: 0,
          treasureType: "V",
          intelligence: "Non-intelligent",
        },
        source: { book: "Monsters & Treasure", page: 13 }
      },
      {
        edition: "3.5e",
        mechanics: {
          hitDice: 4,
          hitDieSize: 10,
          armorClass: 3,                             // 10 -1 size +4 natural (transparent)
          baseAttackBonus: 3,
          movement: { ground: 15 },
          attacks: [{ name: "Slam", dice: "1d6+1" }],
          specialAttacks: ["Engulf", "Paralysis", "Acid (1d6)"],
          specialDefenses: ["Blindsight 60 ft.", "Immune to electricity"],
          abilities: { str: 12, dex: 1, con: 26, int: 0, wis: 1, cha: 1 },
        },
        lore: {
          alignment: "True Neutral",
          xpValue: 1200,
          challengeRating: 3,
          organization: "Solitary",
          environment: "Underground",
          intelligence: "Non-intelligent",
        },
        source: { book: "Monster Manual (3.5e)", page: 201 }
      },
      {
        edition: "4e",
        mechanics: {
          level: 5,
          role: "Brute",
          roleModifier: "Elite",
          hitPoints: 160,
          armorClass: 16,
          fortitude: 19,
          reflex: 12,
          will: 14,
          initiative: 0,
          movement: { ground: 15 },                  // 3 squares
          attacks: [{ name: "Slam", dice: "1d6+4" }],
          specialAttacks: ["Engulf (targets in area absorbed, 2d6+3 acid per round)", "Paralysis"],
          specialDefenses: ["Blindsight 5", "Immune to gaze effects"],
          abilities: { str: 14, dex: 1, con: 20, int: 1, wis: 8, cha: 1 },
        },
        lore: {
          alignment: "Unaligned",
          xpValue: 400,
          origin: "Natural",
          intelligence: "Non-intelligent",
        },
        source: { book: "Monster Manual (4e)", page: 202 }
      }
    ]
  },
  {
    id: "mimic",
    name: "Mimic",
    description: {
      short: "A shapeshifting predator that disguises itself as mundane objects.",
      long: "Mimics are shapeshifting creatures that can alter their form to resemble ordinary dungeon objects such as treasure chests, doors, or furniture, using a powerful adhesive to trap unsuspecting prey.",
    },
    type: "Monstrosity",
    sizeCategory: "Medium",
    languages: [],
    vision: "Darkvision 60 ft.",
    editionRules: [
      {
        edition: "5e",
        mechanics: {
          hitDice: 9,
          hitDieSize: 8,
          armorClass: 12,
          attackBonus: 5,
          movement: { ground: 15 },
          attacks: [{ name: "Pseudopod", dice: "1d8 + 3", damageType: "bludgeoning" }],
          abilities: { str: 17, dex: 12, con: 15, int: 5, wis: 13, cha: 8 },
          traits: ["Shapechanger", "Adhesive", "Grappler"],
        },
        lore: {
          alignment: "Neutral",
          challengeRating: 2,
          xpValue: 450,
          intelligence: "Average (8–10)",
        },
        source: { book: "Monster Manual" }
      },
      {
        edition: "2e",
        mechanics: {
          hitDice: 7,
          hitDieSize: 8,
          armorClass: 7,
          thac0: 13,
          movement: { ground: 6 },
          attacks: [{ name: "Crush", dice: "3-12" }],
          specialDefenses: ["Immune to acid"],
          morale: { category: "Steady", value: 12 },
        },
        lore: {
          alignment: "Neutral",
          xpValue: 1400,
          frequency: "Rare",
          organization: "Solitary",
          treasureType: "D",
          intelligence: "Average",
        },
        source: { book: "Monstrous Manual" }
      },
      {
        edition: "1e",
        mechanics: {
          hitDice: 9,
          armorClass: 7,
          thac0: 12,
          movement: { ground: 3 },
          attacks: [{ name: "Crush", dice: "3d4" }],
          specialAttacks: ["Adhesive (glue)"],
          specialDefenses: ["Camouflage", "Immune to acid"],
          psionicAbility: { min: null, max: null },
        },
        lore: {
          alignment: "Neutral",
          xpValue: 900,
          xpPerHp: 10,
          numberAppearing: { min: 1, max: 1 },
          percentInLair: 100,
          frequency: "Rare",
          treasureType: "Incidental",
          intelligence: "Semi- to Average",
          size: "Large",
        },
        source: { book: "Monster Manual (1977)", page: 70 }
      }
    ]
  },
  {
    id: "young-red-dragon",
    name: "Young Red Dragon",
    description: {
      short: "A fearsome young chromatic dragon wreathed in flame.",
      long: "Red dragons are the most covetous and arrogant of the chromatic dragons. Even in youth they are formidable predators, capable of unleashing devastating gouts of fire upon any who dare approach their growing hoards.",
    },
    type: "Dragon",
    subtype: "Chromatic",
    sizeCategory: "Large",
    languages: ["Common", "Draconic"],
    vision: "Blindsight 30 ft., Darkvision 120 ft.",
    editionRules: [
      {
        edition: "5e",
        mechanics: {
          hitDice: 16,
          hitDieSize: 10,
          armorClass: 18,
          attackBonus: 11,
          movement: { ground: 40 },
          attacks: [
            { name: "Bite", dice: "2d10 + 6", damageType: "piercing" },
            { name: "Claw", dice: "2d6 + 6", damageType: "slashing" }
          ],
          abilities: { str: 23, dex: 10, con: 17, int: 12, wis: 11, cha: 15 },
          traits: ["Fire Breath", "Legendary Resistance"],
        },
        lore: {
          alignment: "Chaotic Evil",
          challengeRating: 10,
          xpValue: 5900,
          intelligence: "Average (8–10)",
        },
        source: { book: "Monster Manual" }
      },
      {
        edition: "2e",
        mechanics: {
          hitDice: 8,
          hitDieSize: 8,
          armorClass: 0,
          thac0: 13,
          movement: { ground: 12, fly: 6 },
          attacks: [
            { name: "Claw", dice: "1-4" },
            { name: "Claw", dice: "1-4" },
            { name: "Bite", dice: "3-12" }
          ],
          specialDefenses: ["Immune to fire"],
          morale: { category: "Fanatic", value: 17 },
        },
        lore: {
          alignment: "Chaotic Evil",
          xpValue: 7000,
          frequency: "Uncommon",
          organization: "Solitary or family",
          treasureType: "H",
          intelligence: "Average",
        },
        source: { book: "Monstrous Manual" }
      },
      {
        edition: "1e",
        mechanics: {
          hitDice: 9, // Young age category
          armorClass: -1,
          thac0: 12,
          movement: { ground: 9, fly: 24 },
          attacks: [
            { name: "Claw", dice: "1d8" },
            { name: "Claw", dice: "1d8" },
            { name: "Bite", dice: "3d10" }
          ],
          specialAttacks: ["Breath weapon (fire cone)"],
          specialDefenses: ["Immune to fire"],
          psionicAbility: { min: null, max: null },
        },
        lore: {
          alignment: "Chaotic Evil",
          xpValue: 4400,
          xpPerHp: 12,
          numberAppearing: { min: 1, max: 1 },
          percentInLair: 60,
          frequency: "Very Rare",
          treasureType: "H",
          intelligence: "Exceptional (15-16)",
          size: "Large",
        },
        source: { book: "Monster Manual (1977)", page: 34 }
      },
      {
        edition: "becmi",
        mechanics: {
          hitDice: 10,
          hitDieSize: 8,
          hitDiceAsterisks: 2,              // breath weapon + spells
          armorClass: -1,
          thac0: 10,
          movement: { ground: 30, fly: 80 }, // 90'(30') Fly 240'(80')
          attacks: [
            { name: "Claw", dice: "1d8" },
            { name: "Claw", dice: "1d8" },
            { name: "Bite", dice: "4d8" }
          ],
          specialAttacks: ["Breath weapon (fire cone, 90' long, 30' wide)", "Up to 3 spells per day"],
          specialDefenses: ["Immune to fire"],
          saveAs: { class: "Fighter", level: 36 },
          morale: 10,
        },
        lore: {
          alignment: "Chaotic",
          xpValue: 2300,
          numberAppearing: { wandering: "1d4", lair: "1d4" },
          treasureType: "H",
          intelligence: "High (12)",
        },
        source: { book: "Rules Cyclopedia", page: 170 }
      },
      {
        edition: "bx",
        mechanics: {
          hitDice: 10,
          hitDieSize: 8,
          hitDiceAsterisks: 2,
          armorClass: -1,
          thac0: 10,
          movement: { ground: 30, fly: 80 },
          attacks: [
            { name: "Claw", dice: "1d8" },
            { name: "Claw", dice: "1d8" },
            { name: "Bite", dice: "4d8" }
          ],
          specialAttacks: ["Breath weapon (fire cone, 90' long, 30' wide)", "Up to 3 spells per day"],
          specialDefenses: ["Immune to fire"],
          saveAs: { class: "Fighter", level: 36 },
          morale: 10,
        },
        lore: {
          alignment: "Chaotic",
          xpValue: 2300,
          numberAppearing: { wandering: "1d4", lair: "1d4" },
          treasureType: "H",
          intelligence: "High (12)",
        },
        source: { book: "Expert Set (Cook/Marsh)", page: 20 }
      },
      {
        edition: "b",
        mechanics: {
          hitDice: 10,
          armorClass: -1,
          thac0: 10,
          movement: { ground: 30, fly: 80 },     // 9"/24"
          attacks: [
            { name: "Claw", dice: "1d8" },
            { name: "Claw", dice: "1d8" },
            { name: "Bite", dice: "4d8" }
          ],
          specialAttacks: ["Breath weapon (fire cone, 90' long, 30' wide)", "Up to 3 spells per day"],
          specialDefenses: ["Immune to fire"],
        },
        lore: {
          alignment: "Chaotic Evil",
          xpValue: 2300,
          numberAppearing: "1d4",
          percentInLair: 60,
          treasureType: "H",
          intelligence: "High",
        },
        source: { book: "Basic Set (Holmes)", page: 23 }
      },
      {
        edition: "odd",
        mechanics: {
          hitDice: 10,
          hitDieSize: 6,
          armorClass: 2,                         // OD&D Red Dragon AC 2
          thac0: 10,
          movement: { ground: 30, fly: 80 },     // 9"/24"
          attacks: [{ name: "Bite", dice: "1d6" }],
          specialAttacks: ["Breath weapon (fire cone, damage = dragon's current HP)"],
          specialDefenses: ["Immune to fire"],
        },
        lore: {
          alignment: "Chaotic",
          xpValue: 1100,
          numberAppearing: "1d4",
          percentInLair: 60,
          treasureType: "H",
          intelligence: "High",
        },
        source: { book: "Monsters & Treasure", page: 8 }
      },
      {
        edition: "3.5e",
        mechanics: {
          hitDice: 13,
          hitDieSize: 12,
          armorClass: 21,                            // 10 -1 size +12 natural
          baseAttackBonus: 13,
          movement: { ground: 40, fly: 150 },
          attacks: [
            { name: "Bite", dice: "2d6+6" },
            { name: "Claw", dice: "1d8+3" },
            { name: "Claw", dice: "1d8+3" }
          ],
          specialAttacks: ["Breath weapon (fire cone, 6d10)"],
          specialDefenses: ["Immune to fire", "Vulnerable to cold"],
          abilities: { str: 23, dex: 10, con: 17, int: 12, wis: 13, cha: 12 },
        },
        lore: {
          alignment: "Chaotic Evil",
          xpValue: 4500,
          challengeRating: 7,
          organization: "Solitary or clutch (2–5)",
          environment: "Warm mountains",
          intelligence: "Average",
        },
        source: { book: "Monster Manual (3.5e)", page: 75 }
      },
      {
        edition: "4e",
        mechanics: {
          level: 7,
          role: "Soldier",
          roleModifier: "Solo",
          hitPoints: 332,
          armorClass: 25,
          fortitude: 22,
          reflex: 20,
          will: 20,
          initiative: 9,
          movement: { ground: 30, fly: 50 },         // 6/10 squares
          attacks: [
            { name: "Bite", dice: "2d8+5" },
            { name: "Claw", dice: "1d6+5" },
            { name: "Claw", dice: "1d6+5" }
          ],
          specialAttacks: [
            "Breath Weapon (close blast 5, 3d8+4 fire, recharge 5–6)",
            "Bloodied Breath (free action when first bloodied)",
            "Frightful Presence (close burst 5, targets stunned)"
          ],
          specialDefenses: ["Immune to fire", "Resist 15 fire"],
          abilities: { str: 19, dex: 15, con: 17, int: 12, wis: 13, cha: 12 },
        },
        lore: {
          alignment: "Evil",
          xpValue: 2500,
          origin: "Natural",
          intelligence: "Average",
        },
        source: { book: "Monster Manual (4e)", page: 80 }
      }
    ]
  },
  {
    id: "beholder",
    name: "Beholder",
    description: {
      short: "A floating spherical horror with a central eye and deadly eyestalks.",
      long: "The beholder is one of the most feared creatures in existence. Its large central eye projects an anti-magic cone, while ten smaller eyestalks each fire a different magical ray. Paranoid and tyrannical, beholders believe themselves superior to all other life.",
    },
    type: "Aberration",
    sizeCategory: "Medium",
    languages: ["Beholder", "Common"],
    vision: "Darkvision 120 ft.",
    editionRules: [
      {
        edition: "5e",
        mechanics: {
          hitDice: 19,
          hitDieSize: 10,
          armorClass: 18,
          attackBonus: 10,
          movement: { ground: 0 },
          attacks: [
            { name: "Bite", dice: "2d10 + 4", damageType: "piercing" }
          ],
          abilities: { str: 10, dex: 14, con: 18, int: 17, wis: 15, cha: 17 },
          traits: ["Antimagic Cone", "Eye Rays", "Floating"],
        },
        lore: {
          alignment: "Lawful Evil",
          challengeRating: 13,
          xpValue: 10000,
          intelligence: "Exceptional (15–16)",
        },
        source: { book: "Monster Manual" }
      },
      {
        edition: "2e",
        mechanics: {
          hitDice: 6,
          hitDieSize: 8,
          armorClass: 0,
          thac0: 13,
          movement: { ground: 0, fly: 6 },
          attacks: [{ name: "Eyestalk", dice: "varies" }],
          specialDefenses: ["Immune to sleep, charm, hold, and cold-based spells"],
          morale: { category: "Steady", value: 12 },
        },
        lore: {
          alignment: "Lawful Evil",
          xpValue: 8000,
          frequency: "Very Rare",
          organization: "Solitary",
          treasureType: "F",
          intelligence: "Exceptional (15–16)",
        },
        source: { book: "Monstrous Manual" }
      },
      {
        edition: "1e",
        mechanics: {
          hitDice: 10, // Approximate; 1e beholders had variable hp (45-75)
          armorClass: 0,
          thac0: 10,
          movement: { fly: 3 },
          attacks: [{ name: "Bite", dice: "2d4" }],
          specialAttacks: ["10 eye rays (charm, sleep, telekinesis, flesh to stone, disintegrate, etc.)"],
          specialDefenses: ["Anti-magic ray (central eye)"],
          psionicAbility: { min: null, max: null },
        },
        lore: {
          alignment: "Lawful Evil",
          xpValue: 12000,
          xpPerHp: 16,
          numberAppearing: { min: 1, max: 1 },
          percentInLair: 80,
          frequency: "Very Rare",
          treasureType: "I, S, T",
          intelligence: "Exceptional (15-16)",
          size: "Medium to Large (4-6ft diameter)",
        },
        source: { book: "Monster Manual (1977)", page: 10 }
      }
    ]
  },
] as const