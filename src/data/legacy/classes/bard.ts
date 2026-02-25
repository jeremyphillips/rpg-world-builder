import { startingWealth5e } from "@/data/startingWealth5e"
import { startingWealthTiers35e } from "@/data/startingWealth35e"
import type { CharacterClass } from './types'
import { FULL_CASTER_SLOTS_5E, BARD_SLOTS_35E, BARD_SLOTS_2E } from './spellSlotTables'
import {
  FIVE_E_INTELLIGENCE_SKILLS, FIVE_E_WISDOM_SKILLS,
  FIVE_E_CHARISMA_SKILLS, FIVE_E_DEXTERITY_SKILLS, FIVE_E_STRENGTH_SKILLS,
  TWOE_GENERAL_PROFICIENCY_SKILLS, TWOE_ROGUE_GROUP_PROFICIENCY_SKILLS,
} from "@/data/editions/proficiencySkillsByEdition"
import { resolveAvailable2eSkills } from "@/features/character/domain/edition/2e"

export const bard = {
  id: 'bard',
  name: 'Bard',
  parentId: 'rogue',
  definitions: [
    {
      edition: '5e',
      id: 'bardicCollege',
      name: 'Bardic College',
      selectionLevel: 3,
      options: [
        { id: 'creation', name: 'College of Creation', source: 'TCOE' },
        { id: 'eloquence', name: 'College of Eloquence', source: 'TCOE' },
        { id: 'glamour', name: 'College of Glamour', source: 'XGE' },
        { id: 'lore', name: 'College of Lore', source: 'PHB' },
        { id: 'spirits', name: 'College of Spirits', source: 'VRGR' },
        { id: 'swords', name: 'College of Swords', source: 'XGE' },
        { id: 'valor', name: 'College of Valor', source: 'PHB' },
        { id: 'whispers', name: 'College of Whispers', source: 'XGE' }
      ]
    },
    {
      edition: '2e',
      name: 'Bard Kit',
      selectionLevel: 1,
      options: [
        { id: 'blade', name: 'Blade', parentId: 'bard', source: 'CBH' },
        { id: 'charlatan', name: 'Charlatan', parentId: 'bard', source: 'CBH' },
        { id: 'gallant', name: 'Gallant', parentId: 'bard', source: 'CBH' },
        { id: 'gypsy-bard', name: 'Gypsy-bard', parentId: 'bard', source: 'CBH' },
        { id: 'herald', name: 'Herald', parentId: 'bard', source: 'CBH' },
        { id: 'jester', name: 'Jester', parentId: 'bard', source: 'CBH' },
        { id: 'loremaster', name: 'Loremaster', parentId: 'bard', source: 'CBH' },
        { id: 'meistersinger', name: 'Meistersinger', parentId: 'bard', source: 'CBH' },
        { id: 'riddlemaster', name: 'Riddlemaster', parentId: 'bard', source: 'CBH' },
        { id: 'thespian', name: 'Thespian', parentId: 'bard', source: 'CBH' }
      ]
    }
  ],
  requirements: [
    {
      edition: '5e',
      allowedRaces: 'all',
      allowedAlignments: 'any',
      equipment: {
        armor: {
          categories: ['light'],
          individuals: []
        },
        weapons: {
          categories: ['simple'],
          individuals: ['hand-crossbow', 'longsword', 'rapier', 'shortsword']
        },
        notes: []
      },
      multiclassing: {
        logic: 'and',
        note: 'Requires 13 Charisma',
        options: [{ charisma: 13 }]
      },
      startingWealth: { ...startingWealth5e }
    },
    {
      edition: '2e',
      allowedRaces: ['human', 'halfElf'],
      levelCaps: { halfElf: 20, human: 'unlimited' },
      minStats: { dexterity: 12, intelligence: 13, charisma: 15 },
      allowedAlignments: ['n', 'ng', 'ne', 'cn', 'ln'],
      equipment: {
        armor: {
          categories: 'none',
          individuals: ['leather', 'padded', 'studded-leather', 'chain-mail'],
          notes: [
            { id: 'bardArmorRestriction', text: 'Bards cannot use thieving skills or cast spells while wearing armor heavier than leather.' }
          ]
        },
        weapons: {
          categories: 'none',
          individuals: ['all']
        }
      },
      startingWealth: {
        classInitialGold: "2d6 * 10", // 2e Rogue group roll: 20-120gp
        avgGold: 70,
        goldPerLevel: 250 // Higher than Thief; covers instruments, spell research, and social upkeep
      }
    },
    // 3.5e
    {
      edition: '3.5e',
      allowedRaces: 'all',
      allowedAlignments: ['ng', 'cg', 'ln', 'n', 'cn', 'ne', 'ce'],
      equipment: { armor: { categories: ['light', 'shields'], individuals: 'none' }, weapons: { categories: ['simple'], individuals: ['longsword', 'rapier', 'sap', 'shortsword', 'shortbow', 'whip'] } },
      startingWealth: {
        classInitialGold: "4d4 * 10", // 3.5e Bard: 40-160gp
        avgGold: 100,
        tiers: startingWealthTiers35e
      }
    }
  ],
  proficiencies: {
    '5e': {
      skills: [
        {
          type: 'choice',
          count: 3,
          level: 1,
          from: [
            ...Object.keys(FIVE_E_STRENGTH_SKILLS),
            ...Object.keys(FIVE_E_DEXTERITY_SKILLS),
            ...Object.keys(FIVE_E_INTELLIGENCE_SKILLS),
            ...Object.keys(FIVE_E_WISDOM_SKILLS),
            ...Object.keys(FIVE_E_CHARISMA_SKILLS)
          ]
        }
      ],
      weapons: [
        {
          type: 'fixed',
          level: 1,
          categories: ['simple'],
        }
      ],
      armor: [
        {
          type: 'fixed',
          level: 1,
          categories: ['light'],
        }
      ],
    },
    '2e': {
      skills: [
        {
          type: 'choice',
          slots: 3,
          level: 1,
          // TODO: check if crowdWorking, poetry, and readingWriting are available
          from: resolveAvailable2eSkills(
            TWOE_GENERAL_PROFICIENCY_SKILLS,
            TWOE_ROGUE_GROUP_PROFICIENCY_SKILLS
          )
        },
        // {
        //   type: 'fixed',
        //   level: 1,
        //   from: ['singing', 'musicalInstrument'],
        // }
      ],
      weapons: [
        {
          type: 'fixed',
          slots: 3,
          level: 1,
          categories: ['simple'],
        }
      ],
      armor: [
        {
          type: 'fixed',
          slots: 1,
          level: 1,
          categories: ['light'],
        }
      ],
    },
  },
  progression: [
    {
      edition: '5e',
      hitDie: 8,
      attackProgression: 'average',
      primaryAbilities: ['cha', 'dex'],
      armorProficiency: ['light'],
      weaponProficiency: ['simple', 'hand-crossbow', 'longsword', 'rapier', 'shortsword'],
      savingThrows: ['dex', 'cha'],
      spellcasting: 'full',
      spellProgression: {
        type: 'known',
        cantripsKnown: [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
        spellsKnown:   [4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 15, 16, 18, 19, 19, 20, 22, 22, 22],
        spellSlots: FULL_CASTER_SLOTS_5E,
        maxSpellLevel: 9,
      },
      asiLevels: [4, 8, 12, 16, 19],
      features: [
        { level: 1, name: 'Bardic Inspiration' },
        { level: 1, name: 'Spellcasting' },
        { level: 2, name: 'Jack of All Trades' },
        { level: 2, name: 'Song of Rest' },
        { level: 3, name: 'Bardic College' },
        { level: 3, name: 'Expertise' },
        { level: 5, name: 'Font of Inspiration' },
        { level: 6, name: 'Countercharm' },
        { level: 10, name: 'Magical Secrets' },
        { level: 20, name: 'Superior Inspiration' },
      ],
    },
    {
      edition: '3.5e',
      hitDie: 6,
      attackProgression: 'average',
      primaryAbilities: ['cha'],
      armorProficiency: ['light', 'shields'],
      weaponProficiency: ['simple', 'longsword', 'rapier', 'sap', 'shortsword', 'shortbow', 'whip'],
      fortSave: 'poor',
      refSave: 'good',
      willSave: 'good',
      skillPointsPerLevel: 6,
      spellProgression: {
        type: 'known',
        cantripsKnown: [4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
        spellsKnownByLevel: [
          /* L1  */ [2],
          /* L2  */ [3],
          /* L3  */ [3],
          /* L4  */ [3, 2],
          /* L5  */ [4, 3],
          /* L6  */ [4, 3],
          /* L7  */ [4, 3, 2],
          /* L8  */ [4, 4, 3],
          /* L9  */ [4, 4, 3],
          /* L10 */ [4, 4, 3, 2],
          /* L11 */ [4, 4, 4, 3],
          /* L12 */ [4, 4, 4, 3],
          /* L13 */ [4, 4, 4, 3, 2],
          /* L14 */ [4, 4, 4, 4, 3],
          /* L15 */ [4, 4, 4, 4, 3],
          /* L16 */ [5, 4, 4, 4, 3, 2],
          /* L17 */ [5, 5, 4, 4, 4, 3],
          /* L18 */ [5, 5, 5, 4, 4, 3],
          /* L19 */ [5, 5, 5, 5, 4, 4],
          /* L20 */ [5, 5, 5, 5, 5, 4],
        ],
        spellSlots: BARD_SLOTS_35E,
        maxSpellLevel: 6,
      },
    },
    {
      edition: '2e',
      classGroup: 'rogue',
      hitDie: 6,
      attackProgression: 'average',
      primaryAbilities: ['dex', 'int', 'cha'],
      armorProficiency: ['leather', 'padded', 'studded-leather', 'chain-mail'],
      weaponProficiency: ['all'],
      spellProgression: {
        type: 'known',
        // 2e Bard: casts from the wizard spell list, gains spells at level 2
        spellSlots: BARD_SLOTS_2E,
        maxSpellLevel: 6,
      },
    },
  ],
  generation: {
    abilityPriority: ['charisma', 'dexterity']
  }
} satisfies CharacterClass
