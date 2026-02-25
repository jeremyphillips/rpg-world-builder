import { startingWealth5e } from "@/data/startingWealth5e"
import { startingWealth4e } from "@/data/startingWealth4e"
import type { CharacterClass } from './types'
import { ARTIFICER_SLOTS_5E } from './spellSlotTables'

export const artificer = {
  id: 'artificer',
  name: 'Artificer',
  definitions: [
    {
      edition: '5e',
      id: 'artificerSpecialist',
      name: 'Artificer Specialist',
      selectionLevel: 3,
      options: [
        { id: 'alchemist', name: 'Alchemist', source: 'TCOE' },
        { id: 'armorer', name: 'Armorer', source: 'TCOE' },
        { id: 'artillerist', name: 'Artillerist', source: 'TCOE' },
        { id: 'battle-smith', name: 'Battle Smith', source: 'TCOE' }
      ]
    },
    {
      edition: '4e',
      name: 'Artificer Build',
      selectionLevel: 1,
      options: [
        { id: 'battlesmith', name: 'Battlesmith', source: 'EPG' },
        { id: 'tinkerer', name: 'Tinkerer', source: 'EPG' }
      ]
    },
    {
      edition: '2e',
      name: 'Artisan Kit',
      selectionLevel: 1,
      options: [
        { id: 'artisan-dwarf', name: 'Artisan', parentId: 'warrior', source: 'CBH' },
        { id: 'tinkerer-gnome', name: 'Tinkerer Gnome', parentId: 'wizard', source: 'CWH' }
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
          notes: [{ id: 'armorerBonus', text: 'The Armorer specialist grants proficiency with Heavy Armor.' }]
        },
        weapons: {
          categories: ['simple'],
          individuals: [],
          notes: [
            { id: 'firearmProficiency', text: 'If firearms exist in the setting, you are proficient with them.' },
            { id: 'battleSmithBonus', text: 'The Battle Smith specialist grants proficiency with Martial Weapons.' }
          ]
        },
        tools: {
          categories: 'none',
          individuals: ['thieves-tools', 'tinkers-tools'],
          notes: [{ id: 'toolSpellcasting', text: 'You must use thieves’ tools or artisan’s tools as a spellcasting focus.' }]
        },
      },
      multiclassing: {
        logic: 'and',
        note: 'Requires 13 Intelligence',
        options: [{ intelligence: 13 }]
      },
      startingWealth: { ...startingWealth5e }
    },
    // 4e
    {
      edition: '4e',
      allowedRaces: 'all',
      allowedAlignments: 'any',
      equipment: { armor: { categories: ['light'], individuals: 'none' }, weapons: { categories: ['simple'], individuals: 'none' } },
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
            'history',
            'investigation',
            'medicine',
            'nature',
            'perception',
            'sleightOfHand'
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
          categories: ['light', 'medium', 'shields'],
        }
      ]
    },
    // {
    //   edition: '5e',
    //   taxonomy: 'Tool',
    //   choiceCount: 1,
    //   fixed: [
    //     { id: 'thieves-tools', name: 'Thieves\' Tools' },
    //     { id: 'tinkers-tools', name: 'Tinker\'s Tools' }
    //   ],
    //   options: 'all-artisan-tools'
    // }
  },
  progression: [
    {
      edition: '5e',
      hitDie: 8,
      attackProgression: 'average',
      primaryAbilities: ['int', 'con'],
      savingThrows: ['con', 'int'],
      spellcasting: 'half',
      spellProgression: {
        type: 'prepared',
        preparedFormula: 'int+halfLevel',
        cantripsKnown: [2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4],
        spellSlots: ARTIFICER_SLOTS_5E,
        maxSpellLevel: 5,
      },
      asiLevels: [4, 8, 12, 16, 19],
      features: [
        { level: 1, name: 'Magical Tinkering' },
        { level: 1, name: 'Spellcasting' },
        { level: 2, name: 'Infuse Item' },
        { level: 3, name: 'Artificer Specialist' },
        { level: 3, name: 'The Right Tool for the Job' },
        { level: 6, name: 'Tool Expertise' },
        { level: 7, name: 'Flash of Genius' },
        { level: 10, name: 'Magic Item Adept' },
        { level: 11, name: 'Spell-Storing Item' },
        { level: 14, name: 'Magic Item Savant' },
        { level: 18, name: 'Magic Item Master' },
        { level: 20, name: 'Soul of Artifice' },
      ],
    },
    {
      edition: '4e',
      hitDie: 0,
      hpPerLevel: 5,
      attackProgression: 'average',
      primaryAbilities: ['int', 'wis'],
      armorProficiency: ['light'],
      weaponProficiency: ['simple'],
      role: 'Leader',
      powerSource: 'Arcane',
      healingSurges: 6,
      surgeValue: '1/4 HP',
      fortitudeBonus: 1,
      reflexBonus: 0,
      willBonus: 1,
    },
  ]
} satisfies CharacterClass
