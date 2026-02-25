import { 
  standardAlignments, 
  basicAlignments, 
  fourEAlignments
} from "@/data"

import { 
  fiveEExperience,
  fourEExperience,
  threeEExperience,
  twoEClassExperience,
  oneEClassExperience,
  basicClassExperience
} from './xpTablesByEdition'

import {
  FIVE_E_STRENGTH_SKILLS,
  FIVE_E_DEXTERITY_SKILLS,
  FIVE_E_INTELLIGENCE_SKILLS,
  FIVE_E_WISDOM_SKILLS,
  FIVE_E_CHARISMA_SKILLS,
  TWOE_GENERAL_PROFICIENCY_SKILLS,
  TWOE_PRIEST_GROUP_PROFICIENCY_SKILLS,
  TWOE_ROGUE_GROUP_PROFICIENCY_SKILLS,
  TWOE_WARRIOR_GROUP_PROFICIENCY_SKILLS,
  TWOE_WIZARD_GROUP_PROFICIENCY_SKILLS
} from './proficiencySkillsByEdition'

import type { Edition } from './edition.types'

const basicRaces = [
  'human',
  'dwarf',
  'elf',
  'halfling'
] as const

const advancedBasicRaces = [
  ...basicRaces,
  'gnome',
  'halfElf',
  'halfOrc'
] as const

export const editions: readonly Edition[] = [
  {
    id: '5e',
    name: '5th Edition',
    settings: [ 'forgottenRealms', 'dragonlance', 'lankhmar', 'ravenloft', 'spellJammer' ],
    alignments: standardAlignments,
    races: [
      ...advancedBasicRaces,
      'dragonborn',
      'tiefling'
    ],
    classes: [
      'artificer',
      'barbarian',
      'bard',
      'druid',
      'fighter',
      'monk',
      'paladin',
      'ranger',
      'rogue',
      'sorcerer',
      'warlock',
      'wizard'
    ],
    proficiencies: {
      skills: {
        ...FIVE_E_STRENGTH_SKILLS,
        ...FIVE_E_DEXTERITY_SKILLS,
        ...FIVE_E_INTELLIGENCE_SKILLS,
        ...FIVE_E_WISDOM_SKILLS,
        ...FIVE_E_CHARISMA_SKILLS,
      }
    },
    progression: {
      maxLevel: 20,
      experience: fiveEExperience
    },
    generation: {
      abilityScoreMethod: '4d6-drop-lowest'
    },
    levelScaling: {
      proficiencyBonus: {
        1: 2,
        2: 2,
        3: 2,
        4: 2,
        5: 3,
        6: 3,
        7: 3,
        8: 3,
        9: 4,
        10: 4,
        11: 4,
        12: 4,
        13: 5,
        14: 5,
        15: 5,
        16: 5,
        17: 6,
        18: 6,
        19: 6,
        20: 6
      }
    },
    multiclassing: { allowed: true },
    equipmentRestrictions: {
      plateArmorMinLevel: 5,
      allowMagicItemsAtCreation: true
    },
    // Xanathar's Guide recommended magic item distribution by tier
    magicItemBudget: {
      maxAttunement: 3,
      tiers: [
        { levelRange: [1, 4],   maxRarity: 'uncommon',  permanentItems: 2,  consumableItems: 9 },
        { levelRange: [5, 10],  maxRarity: 'rare',      permanentItems: 6,  consumableItems: 28 },
        { levelRange: [11, 16], maxRarity: 'very-rare',  permanentItems: 6,  consumableItems: 24 },
        { levelRange: [17, 20], maxRarity: 'legendary',  permanentItems: 6,  consumableItems: 19 }
      ]
    }
  },
  {
    id: '4e',
    name: '4th edition',
    settings: [ 'forgottenRealms' ],
    alignments: fourEAlignments,  
    races: [
      ...basicRaces,
      'dragonborn',
      'eladrin',
      'tiefling'
    ],
    classes: [
      'cleric',
      'fighter',
      'paladin',
      'ranger',
      'rogue',
      'warlock',
      'warlord',
      'wizard'
    ],  
    multiclassing: { allowed: true, maxClasses: 2 },
    progression: {
      maxLevel: 30,
      experience: fourEExperience
    },
    generation: {
      abilityScoreMethod: '4d6-drop-lowest'
    },
    // 4e: Items are gated by item level, not rarity.  The standard treasure
    // parcel gives one item of level+1, level, and level-1.  We approximate
    // this across tier ranges — the domain logic also checks enhancementLevel
    // on each item to enforce the per-level gate.
    magicItemBudget: {
      tiers: [
        { levelRange: [1, 4],   permanentItems: 3,  consumableItems: 4 },
        { levelRange: [5, 10],  permanentItems: 6,  consumableItems: 8 },
        { levelRange: [11, 16], permanentItems: 6,  consumableItems: 8 },
        { levelRange: [17, 20], permanentItems: 6,  consumableItems: 8 },
        { levelRange: [21, 25], permanentItems: 6,  consumableItems: 8 },
        { levelRange: [26, 30], permanentItems: 6,  consumableItems: 8 }
      ]
    }
  },
  {
    id: '3.5e',
    name: '3.5 edition',
    settings: [ 'darkSun', 'dragonlance', 'forgottenRealms', 'ravenloft' ],
    alignments: standardAlignments,
    races: advancedBasicRaces,
    classes: [
      "barbarian",
      "bard",
      "cleric",
      "druid",
      "fighter",
      "monk",
      "paladin",
      "ranger",
      "rogue",
      "sorcerer",
      "wizard"
    ],
    multiclassing: { allowed: true },
    progression: {
      maxLevel: 20,
      experience: threeEExperience
    },
    generation: {
      abilityScoreMethod: '4d6-drop-lowest'
    },
    // 3.5e: Wealth by Level (DMG p135).  Magic items are purchased from the
    // character's total wealth budget.  maxItemValueGp caps any single item.
    magicItemBudget: {
      tiers: [
        { levelRange: [1, 4],   permanentItems: 2,  consumableItems: 4,  maxItemValueGp: 3000 },
        { levelRange: [5, 10],  permanentItems: 4,  consumableItems: 6,  maxItemValueGp: 25000 },
        { levelRange: [11, 16], permanentItems: 6,  consumableItems: 6,  maxItemValueGp: 100000 },
        { levelRange: [17, 20], permanentItems: 8,  consumableItems: 6,  maxItemValueGp: 200000 }
      ]
    }
  },
  {
    id: '3e',
    name: '3rd edition',
    settings: [ 'darkSun', 'dragonlance', 'forgottenRealms', 'ravenloft' ],
    alignments: standardAlignments,
    races: advancedBasicRaces,
    classes: [
      "barbarian",
      "bard",
      "cleric",
      "druid",
      "fighter",
      "monk",
      "paladin",
      "ranger",
      "rogue",
      "sorcerer",
      "wizard"
    ],  
    multiclassing: { allowed: true },
    progression: {
      maxLevel: 20,
      experience: threeEExperience
    },
    generation: {
      abilityScoreMethod: '4d6-drop-lowest'
    },
    // 3e uses the same Wealth by Level system as 3.5e
    magicItemBudget: {
      tiers: [
        { levelRange: [1, 4],   permanentItems: 2,  consumableItems: 4,  maxItemValueGp: 3000 },
        { levelRange: [5, 10],  permanentItems: 4,  consumableItems: 6,  maxItemValueGp: 25000 },
        { levelRange: [11, 16], permanentItems: 6,  consumableItems: 6,  maxItemValueGp: 100000 },
        { levelRange: [17, 20], permanentItems: 8,  consumableItems: 6,  maxItemValueGp: 200000 }
      ]
    }
  },
  {
    id: '2e',
    name: '2nd edition - AD&D',
    settings: [ 'alQadim', 'darkSun', 'dragonlance', 'greyhawk', 'forgottenRealms', 'hollowWorld', 'lankhmar', 'mystara', 'planescape', 'ravenloft', 'spellJammer' ],
    alignments: standardAlignments,
    races: advancedBasicRaces,
    // "mage" resolved to "wizard" via classAliases
    classes: [
      "fighter",
      "paladin",
      "ranger",
      "mage",
      // "specialist wizard",
      "cleric",
      "druid",
      "thief",
      "bard"
    ],
    multiclassing: { allowed: true, maxClasses: 3 },
    progression: {
      maxLevel: 20,
      classExperience: twoEClassExperience
    },
    generation: {
      abilityScoreMethod: '4d6-drop-lowest'
    },
    proficiencies: {
      skills: {
        ...TWOE_GENERAL_PROFICIENCY_SKILLS,
        ...TWOE_PRIEST_GROUP_PROFICIENCY_SKILLS,
        ...TWOE_ROGUE_GROUP_PROFICIENCY_SKILLS,
        ...TWOE_WARRIOR_GROUP_PROFICIENCY_SKILLS,
        ...TWOE_WIZARD_GROUP_PROFICIENCY_SKILLS,
      }
    },
    terminology: {
      skills: 'Non-Weapon Proficiency'
    }
  },
  {
    id: '1e',
    name: '1st edition - AD&D',
    settings: [ 'dragonlance', 'greyhawk', 'forgottenRealms', 'lankhmar', 'mystara', 'ravenloft'],
    alignments: standardAlignments,
    races: advancedBasicRaces,
    // "magicUser" resolved to "wizard" via classAliases
    classes: [
      "cleric",
      "druid",
      "fighter",
      "paladin",
      "ranger",
      "magic-user",   // resolved to "wizard" via classAliases
      "illusionist",  // TODO: no catalog entry yet
      "thief",
      "assassin",     // TODO: no catalog entry yet
      "monk",
      "bard"
    ],
    multiclassing: { allowed: true, maxClasses: 3 },
    progression: {
      maxLevel: 20,
      classExperience: oneEClassExperience
    },
    generation: {
      abilityScoreMethod: '4d6-drop-lowest'
    },
  },
  {
    id: 'becmi',
    name: 'BECMI', // Basic, Expert, Companion, Master, Immortal
    settings: [ 'mystara'],
    alignments: basicAlignments,
    races: basicRaces,
    classes: [
      "cleric",
      "fighter",
      "magicUser",
      "thief",
      // TODO: Race as class
      // "dwarf",
      // "elf",
      // "halfling"
      // TODO: Handle later
      // "mystic"
    ],
    progression: {
      maxLevel: 36,
      classExperience: basicClassExperience
    }
  },
  {
    id: 'bx',
    name: 'Basic, Expert',
    settings: [ 'mystara'],
    alignments: basicAlignments,
    races: basicRaces,
    classes: [
      "cleric",
      "fighter",
      "magicUser",
      "thief",
      // TODO: Race as class
      // "dwarf",
      // "elf",
      // "halfling"
      // TODO: Handle later
      // "mystic"
    ],
    progression: {
      maxLevel: 14,
      classExperience: basicClassExperience
    },
    generation: {
      abilityScoreMethod: '3d6'
    },
  },
  {
    id: 'b',
    name: 'Basic (Holmes)',
    settings: [ 'mystara'],
    alignments: basicAlignments,
    races: basicRaces,
    classes: [
      "cleric",
      "fighter",
      "magic-user",   // resolved to "wizard" via classAliases
      "thief",
      // Race-as-class: demihumans restricted to Fighter via class requirements
    ],
    progression: {
      maxLevel: 3,
      classExperience: basicClassExperience
    },
    generation: {
      abilityScoreMethod: '3d6'
    },
  },
  {
    id: 'odd',
    name: 'OD&D',
    settings: [ 'mystara'],
    alignments: basicAlignments,
    races: basicRaces,
    // Class IDs resolved via classAliases: "fighting-man" → "fighter", "magic-user" → "wizard"
    classes: [
      "fighting-man",
      "magic-user",
      "cleric",
      "thief",
      // TODO: Introduced later
      // "paladin",
      // "monk",
      // "assassin",
      // "druid"
    ],
    progression: {
      maxLevel: 14,
      classExperience: basicClassExperience
    },
    generation: {
      abilityScoreMethod: '3d6'
    },
  }
] as const;


 export type EditionType = keyof typeof editions
