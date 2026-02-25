import { startingWealth5e } from "@/data/startingWealth5e"
import { startingWealth4e } from "@/data/startingWealth4e"
import type { CharacterClass } from './types'

export const rogue = {
  id: 'rogue',
  name: 'Rogue',
  rolesByEdition: {
    '2e': 'group'
  },  
  definitions: [
    {
      edition: '5e',
      id: 'roguishArchetype',
      name: 'Roguish Archetype',
      selectionLevel: 3,
      options: [
        { id: 'arcane-trickster', name: 'Arcane Trickster', source: 'PHB' },
        { id: 'assassin', name: 'Assassin', source: 'PHB' },
        { id: 'inquisitive', name: 'Inquisitive', source: 'XGE' },
        { id: 'mastermind', name: 'Mastermind', source: 'XGE' },
        { id: 'phantom', name: 'Phantom', source: 'TCOE' },
        { id: 'scout', name: 'Scout', source: 'XGE' },
        { id: 'soulknife', name: 'Soulknife', source: 'TCOE' },
        { id: 'swashbuckler', name: 'Swashbuckler', source: 'XGE' },
        { id: 'thief', name: 'Thief', source: 'PHB' }
      ]
    },
    {
      edition: '4e',
      name: 'Class Build',
      selectionLevel: 1,
      options: [
        { id: 'aerial-ist', name: 'Aerialist Rogue', source: 'MP2' },
        { id: 'brawny-rogue', name: 'Brawny Rogue', source: 'PHB' },
        { id: 'cutthroat-rogue', name: 'Cutthroat Rogue', source: 'MP' },
        { id: 'shadowy-rogue', name: 'Shadowy Rogue', source: 'MP' },
        { id: 'thief', name: 'Thief (Essentials)', source: 'PHSL' }
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
          individuals: [],
          notes: [
            { id: 'rogueAgilityConstraint', text: 'Rogues rely on mobility and stealth; proficiency is limited to Light armor to ensure no interference with Dexterity-based skills or Evasion.' },
            { id: 'rogueShieldRestriction', text: 'Rogues are not proficient with shields; using one prevents Sneak Attack and imposes disadvantage on many checks.' }
          ]
        },
        weapons: {
          categories: ['simple'],
          individuals: ['hand-crossbow', 'longsword', 'rapier', 'shortsword'],
          notes: [
            { id: 'sneakAttackRequirement', text: 'Sneak Attack requires a Finesse or Ranged weapon.' }
          ]
        },
        notes: [
          { id: 'thievesToolsFocus', text: 'Proficiency with Thieves\' Tools is required to disarm traps and open locks.' }
        ]
      },
      multiclassing: {
        logic: 'and',
        note: 'Requires 13 Dexterity',
        options: [{ dexterity: 13 }]
      },
      startingWealth: { ...startingWealth5e }
    },
    // 4e
    {
      edition: '4e',
      allowedRaces: 'all',
      allowedAlignments: 'any',
      equipment: { armor: { categories: ['light'], individuals: 'none' }, weapons: { categories: ['simple'], individuals: ['dagger', 'hand-crossbow', 'shortsword', 'shuriken'] } },
      startingWealth: { ...startingWealth4e }
    }
  ],
  proficiencies: {
    '5e': {
      skills: [
        {
          type: 'choice',
          count: 4,
          level: 1,
          from: [
            'acrobatics',
            'athletics',
            'deception',
          'insight',
          'intimidation',
          'investigation',
          'perception',
          'performance',
          'persuasion',
          'sleightOfHand',
          'stealth'
        ]
        }
      ],
      weapons: [
        {
          type: 'fixed',
          level: 1,
          categories: ['simple'],
          items: ['hand-crossbow', 'longsword', 'rapier', 'shortsword'],
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
    // {
    //   edition: '4e',
    //   taxonomy: 'Trained Skill',
    //   choiceCount: 4,
    //   fixed: [{ id: 'stealth', name: 'Stealth' }, { id: 'thievery', name: 'Thievery' }],
    //   options: [
    //     { id: 'acrobatics', name: 'Acrobatics' },
    //     { id: 'athletics', name: 'Athletics' },
    //     { id: 'bluff', name: 'Bluff' },
    //     { id: 'dungeoneering', name: 'Dungeoneering' },
    //     { id: 'insight', name: 'Insight' },
    //     { id: 'perception', name: 'Perception' },
    //     { id: 'streetwise', name: 'Streetwise' }
    //   ]
    // }
  },
  progression: [
    {
      edition: '5e',
      hitDie: 8,
      attackProgression: 'average',
      primaryAbilities: ['dex', 'int'],
      savingThrows: ['dex', 'int'],
      spellcasting: 'none',
      asiLevels: [4, 8, 10, 12, 16, 19],
      features: [
        { level: 1, name: 'Expertise' },
        { level: 1, name: 'Sneak Attack' },
        { level: 1, name: 'Thieves\' Cant' },
        { level: 2, name: 'Cunning Action' },
        { level: 3, name: 'Roguish Archetype' },
        { level: 5, name: 'Uncanny Dodge' },
        { level: 7, name: 'Evasion' },
        { level: 11, name: 'Reliable Talent' },
        { level: 14, name: 'Blindsense' },
        { level: 18, name: 'Elusive' },
        { level: 20, name: 'Stroke of Luck' },
      ],
    },
    {
      edition: '4e',
      hitDie: 0,
      hpPerLevel: 5,
      attackProgression: 'average',
      primaryAbilities: ['dex', 'cha'],
      armorProficiency: ['light'],
      weaponProficiency: ['simple', 'dagger', 'hand-crossbow', 'shortsword', 'shuriken'],
      role: 'Striker',
      powerSource: 'Martial',
      healingSurges: 6,
      surgeValue: '1/4 HP',
      fortitudeBonus: 0,
      reflexBonus: 2,
      willBonus: 0,
    },
  ],
  generation: {
    abilityPriority: ['dexterity', 'intelligence']
  }
} satisfies CharacterClass