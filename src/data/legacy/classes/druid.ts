import { startingWealth5e } from "@/data/startingWealth5e"
import { startingWealth4e } from "@/data/startingWealth4e"
import { startingWealthTiers35e } from "@/data/startingWealth35e"
import type { CharacterClass } from './types'
import { FULL_CASTER_SLOTS_5E, FULL_CASTER_SLOTS_35E, PRIEST_SLOTS_2E, DRUID_SLOTS_1E } from './spellSlotTables'
import { resolveAvailable2eSkills } from "@/features/character/domain/edition/2e"
import { TWOE_GENERAL_PROFICIENCY_SKILLS, TWOE_PRIEST_GROUP_PROFICIENCY_SKILLS } from "@/data/editions/proficiencySkillsByEdition"

export const druid = {
  id: 'druid',
  name: 'Druid',
  definitions: [
    {
      edition: '5e',
      id: 'druidCircle',
      name: 'Druid Circle',
      selectionLevel: 2,
      options: [
        { id: 'dreams', name: 'Circle of Dreams', source: 'XGE' },
        { id: 'land', name: 'Circle of the Land', source: 'PHB' },
        { id: 'moon', name: 'Circle of the Moon', source: 'PHB' },
        { id: 'shepherd', name: 'Circle of the Shepherd', source: 'XGE' },
        { id: 'spores', name: 'Circle of Spores', source: 'GGR' },
        { id: 'stars', name: 'Circle of the Stars', source: 'TCOE' },
        { id: 'wildfire', name: 'Circle of Wildfire', source: 'TCOE' }
      ]
    },
    {
      edition: '4e',
      name: 'Primal Aspect',
      selectionLevel: 1,
      options: [
        { id: 'guardian-druid', name: 'Guardian Druid', source: 'PHB2' },
        { id: 'predator-druid', name: 'Predator Druid', source: 'PHB2' },
        { id: 'swarm-druid', name: 'Swarm Druid', source: 'PrP' },
        { id: 'sentinel', name: 'Sentinel', source: 'PHSF' }
      ]
    },
    {
      edition: '2e',
      name: 'Druid Kit',
      selectionLevel: 1,
      options: [
        { id: 'adviser', name: 'Adviser', parentId: 'priest', source: 'CWH' },
        { id: 'avenger', name: 'Avenger', parentId: 'priest', source: 'CWH' },
        { id: 'beastfriend', name: 'Beastfriend', parentId: 'priest', source: 'CWH' },
        { id: 'guardian', name: 'Guardian', parentId: 'priest', source: 'CWH' },
        { id: 'hivemaster', name: 'Hivemaster', parentId: 'priest', source: 'CWH' },
        { id: 'lost-druid', name: 'Lost Druid', parentId: 'priest', source: 'CWH' },
        { id: 'naturalist', name: 'Naturalist', parentId: 'priest', source: 'CWH' },
        { id: 'outlaw-druid', name: 'Outlaw Druid', parentId: 'priest', source: 'CWH' },
        { id: 'totemic-druid', name: 'Totemic Druid', parentId: 'priest', source: 'CWH' }
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
          categories: ['light', 'medium', 'shields'],
          individuals: 'none',
          disallowedMaterials: ['metal']
        },
        weapons: {
          categories: ['simple'],
          individuals: ['scimitar']
          // Note: 5e Druids CAN use metal weapons (Scimitars/Daggers), 
          // the taboo only applies to Armor/Shields.
        },
        notes: [
          { id: 'druidMetalTaboo', text: 'Druids will not wear armor or shields made of metal.' }
        ]
      },
      multiclassing: {
        logic: 'and',
        note: 'Requires 13 Wisdom',
        options: [{ wisdom: 13 }]
      },
      startingWealth: { ...startingWealth5e }
    },
    {
      edition: '2e',
      allowedRaces: ['human', 'halfElf'],
      levelCaps: { halfElf: 9, human: 'unlimited' },
      minStats: { wisdom: 12, charisma: 15 },
      allowedAlignments: ['n'], // Strictly True Neutral in 2e
      equipment: {
        armor: {
          categories: 'none',
          individuals: ['leather', 'padded', 'hide']
        },
        weapons: {
          categories: 'none',
          individuals: ['club', 'dagger', 'dart', 'hammer', 'scimitar', 'sling', 'spear', 'staff']
        },
        notes: [
          { id: 'druidWoodenShield', text: 'Druids may only use wooden shields.' }
        ]
      },
      startingWealth: {
        classInitialGold: "3d6 * 10", // 2e Priest group roll: 30-180gp
        avgGold: 105,
        goldPerLevel: 150 // Low scaling; Druids are forbidden from most expensive gear
      }
    },
    // 1e AD&D
    {
      edition: '1e',
      allowedRaces: ['human', 'half-elf'],
      allowedAlignments: ['n'],
      equipment: { armor: { categories: 'none', individuals: ['leather', 'hide'] }, weapons: { categories: 'none', individuals: ['club', 'dagger', 'dart', 'hammer', 'scimitar', 'sling', 'spear', 'staff'] } },
      startingWealth: {
        classInitialGold: "3d6 * 10", // 1e Druid (Priest group): 30-180gp
        avgGold: 105,
        goldPerLevel: 150
      }
    },
    // 3.5e
    {
      edition: '3.5e',
      allowedRaces: 'all',
      allowedAlignments: ['ln', 'n', 'cn', 'ng', 'ne'],
      equipment: { armor: { categories: ['light', 'medium', 'shields'], individuals: 'none', disallowedMaterials: ['metal'] }, weapons: { categories: 'none', individuals: ['club', 'dagger', 'dart', 'quarterstaff', 'scimitar', 'sickle', 'shortspear', 'sling', 'spear'] } },
      startingWealth: {
        classInitialGold: "2d4 * 10", // 3.5e Druid: 20-80gp
        avgGold: 50,
        tiers: startingWealthTiers35e
      }
    },
    // 4e
    {
      edition: '4e',
      allowedRaces: 'all',
      allowedAlignments: 'any',
      equipment: { armor: { categories: ['light', 'hide'], individuals: 'none' }, weapons: { categories: ['simple'], individuals: ['staff', 'totem'] } },
      startingWealth: { ...startingWealth4e }
    }
  ],
  proficiencies: {
    '5e': {
      skills: [
        {
          type: 'choice',
          count: 2,
          level: 1,
          from: [
            'arcana',
            'animalHandling',
            'insight',
            'medicine',
            'nature',
            'perception',
            'religion',
            'survival'
          ]
        }
      ],
      weapons: [
        {
          type: 'fixed',
          level: 1,
          items: [ 'club', 'dagger', 'dart', 'javelin', 'mace', 'quarterstaff', 'scimitar', 'sickle', 'sling', 'spear' ],
          categories: [ 'simple', 'martial' ],
        }
      ],
      armor: [
        {
          type: 'fixed',
          level: 1,
          categories: [ 'light', 'medium', 'shields' ],
        }
      ],
    },
    '2e': {
      skills: [
        {
          type: 'choice',
          slots: 4,
          level: 1,
          from: resolveAvailable2eSkills(TWOE_GENERAL_PROFICIENCY_SKILLS, TWOE_PRIEST_GROUP_PROFICIENCY_SKILLS)
        }
      ],
    }
  },
  progression: [
    {
      edition: '5e',
      hitDie: 8,
      attackProgression: 'average',
      primaryAbilities: ['wis', 'int'],
      armorProficiency: ['light', 'medium', 'shields'],
      weaponProficiency: ['club', 'dagger', 'dart', 'javelin', 'mace', 'quarterstaff', 'scimitar', 'sickle', 'sling', 'spear'],
      savingThrows: ['int', 'wis'],
      spellcasting: 'full',
      spellProgression: {
        type: 'prepared',
        preparedFormula: 'wis+level',
        cantripsKnown: [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
        spellSlots: FULL_CASTER_SLOTS_5E,
        maxSpellLevel: 9,
      },
      asiLevels: [4, 8, 12, 16, 19],
      features: [
        { level: 1, name: 'Druidic' },
        { level: 1, name: 'Spellcasting' },
        { level: 2, name: 'Wild Shape' },
        { level: 2, name: 'Druid Circle' },
        { level: 18, name: 'Timeless Body' },
        { level: 18, name: 'Beast Spells' },
        { level: 20, name: 'Archdruid' },
      ],
    },
    {
      edition: '4e',
      hitDie: 0,
      hpPerLevel: 5,
      attackProgression: 'average',
      primaryAbilities: ['wis', 'con'],
      armorProficiency: ['light', 'hide'],
      weaponProficiency: ['simple', 'staff', 'totem'],
      role: 'Controller',
      powerSource: 'Primal',
      healingSurges: 7,
      surgeValue: '1/4 HP',
      fortitudeBonus: 0,
      reflexBonus: 0,
      willBonus: 2,
    },
    {
      edition: '3.5e',
      hitDie: 8,
      attackProgression: 'average',
      primaryAbilities: ['wis'],
      armorProficiency: ['light', 'medium', 'shields'],
      weaponProficiency: ['club', 'dagger', 'dart', 'quarterstaff', 'scimitar', 'sickle', 'shortspear', 'sling', 'spear'],
      fortSave: 'good',
      refSave: 'poor',
      willSave: 'good',
      skillPointsPerLevel: 4,
      spellProgression: {
        type: 'prepared',
        preparedFormula: 'wis+level',
        cantripsKnown: [3, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6],
        spellSlots: FULL_CASTER_SLOTS_35E,
        maxSpellLevel: 9,
      },
    },
    {
      edition: '2e',
      classGroup: 'priest',
      hitDie: 8,
      attackProgression: 'average',
      primaryAbilities: ['wis', 'cha'],
      armorProficiency: ['leather', 'padded', 'hide'],
      weaponProficiency: ['club', 'dagger', 'dart', 'hammer', 'scimitar', 'sling', 'spear', 'staff'],
      spellProgression: {
        type: 'prepared',
        // 2e Druid uses the priest slot table; access to specific spheres determines available spells
        spellSlots: PRIEST_SLOTS_2E,
        maxSpellLevel: 7,
      },
    },
    {
      edition: '1e',
      hitDie: 8,
      attackProgression: 'average',
      primaryAbilities: ['wis', 'cha'],
      armorProficiency: ['leather', 'hide'],
      weaponProficiency: ['club', 'dagger', 'dart', 'hammer', 'scimitar', 'sling', 'spear', 'staff'],
      spellProgression: {
        type: 'prepared',
        spellSlots: DRUID_SLOTS_1E,
        maxSpellLevel: 7,
      },
    },
  ],
  generation: {
    abilityPriority: ['wisdom', 'constitution']
  }
} satisfies CharacterClass;
