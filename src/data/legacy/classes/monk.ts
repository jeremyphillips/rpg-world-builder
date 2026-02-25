import { startingWealth5e } from "@/data/startingWealth5e"
import { startingWealth4e } from "@/data/startingWealth4e"
import type { CharacterClass } from './types'
import { resolveAvailable2eSkills } from "@/features/character/domain/edition/2e/proficiencies"
import { TWOE_GENERAL_PROFICIENCY_SKILLS, TWOE_WARRIOR_GROUP_PROFICIENCY_SKILLS } from "@/data/editions/proficiencySkillsByEdition"

export const monk = {
  id: 'monk',
  name: 'Monk',
  definitions: [
    {
      edition: '5e',
      id: 'monasticTradition',
      name: 'Monastic Tradition',
      selectionLevel: 3,
      options: [
        { id: 'astral-self', name: 'Way of the Astral Self', source: 'TCOE' },
        { id: 'drunken-master', name: 'Way of the Drunken Master', source: 'XGE' },
        { id: 'four-elements', name: 'Way of the Four Elements', source: 'PHB' },
        { id: 'kensei', name: 'Way of the Kensei', source: 'XGE' },
        { id: 'long-death', name: 'Way of the Long Death', source: 'SCAG' },
        { id: 'mercy', name: 'Way of Mercy', source: 'TCOE' },
        { id: 'shadow', name: 'Way of Shadow', source: 'PHB' },
        { id: 'open-hand', name: 'Way of the Open Hand', source: 'PHB' },
        { id: 'sun-soul', name: 'Way of the Sun Soul', source: 'XGE' }
      ]
    },
    {
      edition: '4e',
      name: 'Monk Build/Theme',
      selectionLevel: 1,
      options: [
        { id: 'centered-breath-monk', name: 'Centered Breath Monk', source: 'PHB3' },
        { id: 'iron-soul-monk', name: 'Iron Soul Monk', source: 'PHB3' },
        { id: 'psionic-theme', name: 'Psionic Theme', source: 'DSCSB' }
      ]
    },
    {
      edition: '2e',
      name: 'Monk Kit',
      selectionLevel: 1,
      options: [
        { id: 'brotherhood-of-the-crimson-ninja', name: 'Brotherhood of the Crimson Ninja', parentId: 'warrior', source: 'W:ROF' },
        { id: 'brotherhood-of-the-yellow-scarf', name: 'Brotherhood of the Yellow Scarf', parentId: 'warrior', source: 'W:ROF' },
        { id: 'order-of-the-cloud-dragon', name: 'Order of the Cloud Dragon', parentId: 'warrior', source: 'W:ROF' },
        { id: 'order-of-the-open-hand', name: 'Order of the Open Hand', parentId: 'warrior', source: 'W:ROF' },
        { id: 'order-of-the-sun-soul', name: 'Order of the Sun Soul', parentId: 'warrior', source: 'W:ROF' }
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
          notes: [{ id: 'martialArtsRestriction', text: 'Martial Arts features only work when unarmored and not using a shield.' }]
        },
        weapons: {
          categories: ['simple'],
          individuals: ['shortsword'],
          notes: [{ id: 'monkWeaponRestriction', text: 'Monk weapons are shortswords and any simple melee weapons that lack the two-handed or heavy property.' }]
        }
      },
      multiclassing: {
        logic: 'and',
        note: 'Requires 13 Dexterity AND 13 Wisdom',
        options: [
          { dexterity: 13, wisdom: 13 }
        ]
      },
      startingWealth: { ...startingWealth5e }
    },
    {
      edition: '2e',
      allowedRaces: ['human'], // Standard 2e Monk was human only
      allowedAlignments: ['lg'], // Usually Lawful in 2e (reflecting discipline)
      levelCaps: { human: 'unlimited' },
      minStats: { strength: 15, dexterity: 15, constitution: 11, wisdom: 15 },
      equipment: {
        armor: {
          categories: [],
          individuals: 'none' // Monks cannot wear armor in 2e
        },
        weapons: {
          categories: [],
          individuals: ['all-priest-weapons', 'polearm', 'spear', 'staff']
        },
        notes: [
          { id: 'unarmedProgression', text: 'Monks gain unique damage and AC bonuses while unarmored and unarmed.' }
        ]
      },
      startingWealth: {
        classInitialGold: "5d4", // 2e Monk: 5-20gp (NOT ×10)
        avgGold: 12,
        goldPerLevel: 100 // Low overhead; monks acquire little gear
      }
    },
    // 4e
    {
      edition: '4e',
      allowedRaces: 'all',
      allowedAlignments: 'any',
      equipment: { armor: { categories: ['light'], individuals: 'none' }, weapons: { categories: ['simple', 'military-melee', 'staff'], individuals: 'none' } },
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
            'acrobatics',
            'athletics',
            'history',
            'insight',
            'religion',
            'stealth'
          ]
        }
      ],
      weapons: [
        {
          type: 'fixed',
          level: 1,
          categories: ['simple'],
          items: ['shortsword'],
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
    '2e': {
      skills: {
        slots: 2, // 2e Monks typically start with 2 NWP slots
        from: resolveAvailable2eSkills(
          TWOE_GENERAL_PROFICIENCY_SKILLS, 
          TWOE_WARRIOR_GROUP_PROFICIENCY_SKILLS
        )
      },
      weapons: [
        {
          type: 'fixed',
          level: 1,
          items: ['staff', 'polearm', 'sling'],
        }
      ],
      armor: []
    }
  },
  progression: [
    {
      edition: '5e',
      hitDie: 8,
      attackProgression: 'average',
      primaryAbilities: ['dex', 'wis'],
      armorProficiency: ['none'],
      weaponProficiency: ['simple', 'shortsword'],
      savingThrows: ['str', 'dex'],
      spellcasting: 'none',
      extraAttackLevel: 5,
      asiLevels: [4, 8, 12, 16, 19],
      features: [
        { level: 1, name: 'Unarmored Defense' },
        { level: 1, name: 'Martial Arts' },
        { level: 2, name: 'Ki' },
        { level: 2, name: 'Unarmored Movement' },
        { level: 3, name: 'Monastic Tradition' },
        { level: 3, name: 'Deflect Missiles' },
        { level: 4, name: 'Slow Fall' },
        { level: 5, name: 'Extra Attack' },
        { level: 5, name: 'Stunning Strike' },
        { level: 6, name: 'Ki-Empowered Strikes' },
        { level: 7, name: 'Evasion' },
        { level: 7, name: 'Stillness of Mind' },
        { level: 10, name: 'Purity of Body' },
        { level: 13, name: 'Tongue of the Sun and Moon' },
        { level: 14, name: 'Diamond Soul' },
        { level: 15, name: 'Timeless Body' },
        { level: 18, name: 'Empty Body' },
        { level: 20, name: 'Perfect Self' },
      ],
    },
    {
      edition: '4e',
      hitDie: 0,
      hpPerLevel: 5,
      attackProgression: 'average',
      primaryAbilities: ['dex', 'str'],
      armorProficiency: ['light'],
      weaponProficiency: ['simple', 'military-melee', 'staff'],
      role: 'Striker',
      powerSource: 'Psionic',
      healingSurges: 7,
      surgeValue: '1/4 HP',
      fortitudeBonus: 1,
      reflexBonus: 1,
      willBonus: 0,
    },
    {
      edition: '2e',
      classGroup: 'priest',  // 2e Monk is a Priest variant (Complete Priest's Handbook)
      hitDie: 8,
      attackProgression: 'good',
      primaryAbilities: ['str', 'dex', 'wis'],
      armorProficiency: ['none'],
      weaponProficiency: ['staff', 'polearm', 'sling'],
    },
  ],
  generation: {
    abilityPriority: ['dexterity', 'wisdom']
  }
} satisfies CharacterClass
