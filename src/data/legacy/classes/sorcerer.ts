import { startingWealth5e } from "@/data/startingWealth5e"
import { startingWealth4e } from "@/data/startingWealth4e"
import { startingWealthTiers35e } from "@/data/startingWealth35e"
import type { CharacterClass } from './types'
import { FULL_CASTER_SLOTS_5E, SORCERER_SLOTS_35E } from './spellSlotTables'

export const sorcerer = {
  id: 'sorcerer',
  name: 'Sorcerer',
  definitions: [
    {
      edition: '5e',
      id: 'sorcerousOrigin',
      name: 'Sorcerous Origin',
      selectionLevel: 1,
      options: [
        { id: 'aberrant-mind', name: 'Aberrant Mind', source: 'TCOE' },
        { id: 'clockwork-soul', name: 'Clockwork Soul', source: 'TCOE' },
        {
          id: 'draconic-bloodline',
          name: 'Draconic Bloodline',
          source: 'PHB',
          features: [
            {
              kind: 'formula',
              target: 'armor_class',
              level: 1,
              condition: { type: 'unarmored' },
              formula: {
                base: 13,
                ability: 'dexterity'
              }
            },
            {
              kind: 'modifier',
              level: 1,
              target: 'hp_max',
              mode: 'add',
              value: { perLevel: 1 }
            }
          ]
        },
        { id: 'shadow-magic', name: 'Shadow Magic', source: 'XGE' },
        { id: 'storm-sorcery', name: 'Storm Sorcery', source: 'SCAG' },
        { id: 'wild-magic', name: 'Wild Magic', source: 'PHB' }
      ]
    },
    {
      edition: '4e',
      name: 'Sorcerer Build',
      selectionLevel: 1,
      options: [
        { id: 'chaotic-magic', name: 'Chaotic Magic', source: 'PHB2' },
        { id: 'cosmic-magic', name: 'Cosmic Magic', source: 'AP' },
        { id: 'draconic-magic', name: 'Draconic Magic', source: 'PHB2' },
        { id: 'wild-magic-4e', name: 'Wild Magic', source: 'PHB2' }
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
          categories: 'none',
          individuals: 'none',
          notes: [
            { id: 'draconicResilience', text: 'Draconic Bloodline grants a base AC of 13 + Dex modifier when unarmored.' }
          ]
        },
        weapons: {
          categories: [],
          individuals: ['dagger', 'dart', 'sling', 'quarterstaff', 'light-crossbow']
        }
      },
      multiclassing: {
        logic: 'and',
        note: 'Requires 13 Charisma',
        options: [{ charisma: 13 }]
      },
      startingWealth: { ...startingWealth5e }
    },
    // 3.5e
    {
      edition: '3.5e',
      allowedRaces: 'all',
      allowedAlignments: 'any',
      equipment: { armor: { categories: 'none', individuals: 'none' }, weapons: { categories: ['simple'], individuals: 'none' } },
      startingWealth: {
        classInitialGold: "3d4 * 10", // 3.5e Sorcerer: 30-120gp
        avgGold: 75,
        tiers: startingWealthTiers35e
      }
    },
    // 4e
    {
      edition: '4e',
      allowedRaces: 'all',
      allowedAlignments: 'any',
      equipment: { armor: { categories: ['light'], individuals: 'none' }, weapons: { categories: ['simple'], individuals: ['dagger'] } },
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
            'deception',
            'insight',
            'intimidation',
            'persuasion',
            'religion'
          ]
        }
      ],
      weapons: [
        {
          type: 'fixed',
          level: 1,
          items: ['dagger', 'dart', 'sling', 'quarterstaff', 'light-crossbow'],
        }
      ],
      armor: [
        {
          type: 'fixed',
          level: 1,
          categories: [],
        }
      ],
    },
  },
  progression: [
    {
      edition: '5e',
      hitDie: 6,
      attackProgression: 'poor',
      primaryAbilities: ['cha', 'con'],
      armorProficiency: ['none'],
      weaponProficiency: ['dagger', 'dart', 'sling', 'quarterstaff', 'light-crossbow'],
      savingThrows: ['con', 'cha'],
      spellcasting: 'full',
      spellProgression: {
        type: 'known',
        cantripsKnown: [4, 4, 4, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
        spellsKnown:   [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12, 13, 13, 14, 14, 15, 15, 15, 15],
        spellSlots: FULL_CASTER_SLOTS_5E,
        maxSpellLevel: 9,
      },
      asiLevels: [4, 8, 12, 16, 19],
      features: [
        { level: 1, name: 'Spellcasting' },
        { level: 1, name: 'Sorcerous Origin' },
        { level: 2, name: 'Font of Magic' },
        { level: 3, name: 'Metamagic' },
        { level: 20, name: 'Sorcerous Restoration' },
      ],
    },
    {
      edition: '3.5e',
      hitDie: 4,
      attackProgression: 'poor',
      primaryAbilities: ['cha'],
      armorProficiency: ['none'],
      weaponProficiency: ['simple'],
      fortSave: 'poor',
      refSave: 'poor',
      willSave: 'good',
      skillPointsPerLevel: 2,
      spellProgression: {
        type: 'known',
        cantripsKnown: [5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
        spellsKnownByLevel: [
          /* L1  */ [2],
          /* L2  */ [2],
          /* L3  */ [3],
          /* L4  */ [3, 1],
          /* L5  */ [4, 2],
          /* L6  */ [4, 2, 1],
          /* L7  */ [5, 3, 2],
          /* L8  */ [5, 3, 2, 1],
          /* L9  */ [5, 4, 3, 2],
          /* L10 */ [5, 4, 3, 2, 1],
          /* L11 */ [5, 5, 4, 3, 2],
          /* L12 */ [5, 5, 4, 3, 2, 1],
          /* L13 */ [5, 5, 4, 4, 3, 2],
          /* L14 */ [5, 5, 4, 4, 3, 2, 1],
          /* L15 */ [5, 5, 4, 4, 4, 3, 2],
          /* L16 */ [5, 5, 4, 4, 4, 3, 2, 1],
          /* L17 */ [5, 5, 4, 4, 4, 3, 3, 2],
          /* L18 */ [5, 5, 4, 4, 4, 3, 3, 2, 1],
          /* L19 */ [5, 5, 4, 4, 4, 3, 3, 3, 2],
          /* L20 */ [5, 5, 4, 4, 4, 3, 3, 3, 3],
        ],
        spellSlots: SORCERER_SLOTS_35E,
        maxSpellLevel: 9,
      },
    },
    {
      edition: '4e',
      hitDie: 0,
      hpPerLevel: 5,
      attackProgression: 'average',
      primaryAbilities: ['cha', 'dex'],
      armorProficiency: ['light'],
      weaponProficiency: ['simple', 'dagger'],
      role: 'Striker',
      powerSource: 'Arcane',
      healingSurges: 6,
      surgeValue: '1/4 HP',
      fortitudeBonus: 0,
      reflexBonus: 0,
      willBonus: 2,
    },
  ],
  generation: {
    abilityPriority: ['charisma', 'constitution']
  }
} satisfies CharacterClass
