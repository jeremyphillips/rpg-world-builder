import { resolveAvailable2eSkills } from '@/features/character/domain/edition/2e/proficiencies'
import { TWOE_GENERAL_PROFICIENCY_SKILLS, TWOE_ROGUE_GROUP_PROFICIENCY_SKILLS } from '@/data/editions/proficiencySkillsByEdition'
import type { CharacterClass } from './types'

export const thief = {
  id: 'thief',
  name: 'Thief',
  definitions: [
    {
      edition: '2e',
      name: 'Rogue Kit',
      selectionLevel: 1,
      options: [
        // Thief Group Kits
        { id: 'acrobat', name: 'Acrobat', parentId: 'thief', source: 'CTH' },
        { id: 'assassin', name: 'Assassin', parentId: 'thief', source: 'CTH' },
        { id: 'bandit', name: 'Bandit', parentId: 'thief', source: 'CTH' },
        { id: 'burglar', name: 'Burglar', parentId: 'thief', source: 'CTH' },
        { id: 'cutpurse', name: 'Cutpurse', parentId: 'thief', source: 'CTH' },
        { id: 'scout', name: 'Scout', parentId: 'thief', source: 'CTH' },
        { id: 'swashbuckler-thief', name: 'Swashbuckler', parentId: 'thief', source: 'CTH' },
      ]
    }
  ],
  requirements: [
    {
      edition: '2e',
      allowedRaces: 'all',
      levelCaps: { 
        human: 'unlimited', 
        dwarf: 'unlimited', 
        elf: 'unlimited', 
        gnome: 'unlimited', 
        halfElf: 'unlimited', 
        halfling: 'unlimited' 
      },
      minStats: { dexterity: 9 },
      allowedAlignments: ['ng', 'cg', 'ln', 'n', 'cn', 'le', 'ne', 'ce'],
      equipment: {
        armor: {
          categories: [], // 2e doesn't use categories
          individuals: ['leather', 'padded', 'studded-leather']
        },
        weapons: {
          categories: [], // 2e uses individual weapon lists
          individuals: ['club', 'dagger', 'dart', 'hand-crossbow', 'knife', 'lasso', 'shortbow', 'sling', 'broadsword', 'longsword', 'shortsword']
        },
        notes: [
          { id: 'thiefArmorRestriction', text: 'Using Thief Skills in armor heavier than Leather incurs significant penalties.' }
        ]
      },
      startingWealth: {
        classInitialGold: "2d6 * 10", // 2e Rogue roll: 20-120gp
        avgGold: 70,
        goldPerLevel: 200 // Lower than Warrior; Thieves have lower gear overhead
      }
    },
    // 1e AD&D
    {
      edition: '1e',
      allowedRaces: 'all',
      allowedAlignments: ['ng', 'cg', 'ln', 'n', 'cn', 'le', 'ne', 'ce'],
      equipment: { armor: { categories: 'none', individuals: ['leather'] }, weapons: { categories: 'none', individuals: ['club', 'dagger', 'dart', 'shortsword', 'sling'] } },
      startingWealth: {
        classInitialGold: "2d6 * 10", // 1e Thief: 20-120gp
        avgGold: 70,
        goldPerLevel: 150
      }
    },
    // OD&D & Basic (Holmes): humans only — demihumans use race-as-class (Fighting Man)
    {
      edition: 'odd',
      allowedRaces: ['human'],
      allowedAlignments: 'any',
      equipment: { armor: { categories: 'none', individuals: ['leather'] }, weapons: { categories: 'none', individuals: ['dagger', 'shortsword'] } },
      startingWealth: {
        classInitialGold: "3d6 * 10",
        avgGold: 105,
        goldPerLevel: 100
      }
    },
    {
      edition: 'b',
      allowedRaces: ['human'],
      allowedAlignments: 'any',
      equipment: { armor: { categories: 'none', individuals: ['leather'] }, weapons: { categories: 'none', individuals: ['dagger', 'shortsword'] } },
      startingWealth: {
        classInitialGold: "3d6 * 10",
        avgGold: 105,
        goldPerLevel: 100
      }
    }
  ],
  proficiencies: {
    '2e': {
      skills: [
        {
          type: 'choice',
          slots: 2,
          level: 1,
          from: resolveAvailable2eSkills(
            TWOE_GENERAL_PROFICIENCY_SKILLS,
            TWOE_ROGUE_GROUP_PROFICIENCY_SKILLS
          )
        }
      ],
      weapons: [
        {
          type: 'fixed',
          slots: 2,
          level: 1,
          items: [ 'club', 'dagger', 'dart', 'hand-crossbow', 'shortsword' ],
        }
      ],
    }
    // {
    //   edition: '2e',
    //   taxonomy: 'Thief Skill',
    //   pointPool: {
    //     initial: 60,
    //     perLevel: 30
    //   },
    //   options: [
    //     { id: 'pickPockets', name: 'Pick Pockets' },
    //     { id: 'openLocks', name: 'Open Locks' },
    //     { id: 'findTrap', name: 'Find/Remove Traps' },
    //     { id: 'moveSilently', name: 'Move Silently' },
    //     { id: 'hideInShadows', name: 'Hide in Shadows' },
    //     { id: 'detectNoise', name: 'Detect Noise' },
    //     { id: 'climbWalls', name: 'Climb Walls' },
    //     { id: 'readLanguages', name: 'Read Languages' }
    //   ]
    // }
  },
  progression: [
    {
      edition: '2e',
      classGroup: 'rogue',
      hitDie: 6,
      attackProgression: 'average',
      primaryAbilities: ['dex'],
      armorProficiency: ['leather', 'padded', 'studded-leather'],
      weaponProficiency: ['club', 'dagger', 'dart', 'hand-crossbow', 'knife', 'shortsword'],
    },
    {
      edition: '1e',
      hitDie: 6,
      attackProgression: 'poor',
      primaryAbilities: ['dex'],
      armorProficiency: ['leather'],
      weaponProficiency: ['club', 'dagger', 'dart', 'shortsword', 'sling'],
    },
  ]
} satisfies CharacterClass

  // choicesByEdition: {
  //   '1': {
  //     type: 'subclass',
  //     label: 'Thief subclass',
  //     options: [
  //       { id: 'assassian', name: 'Assassian' }
  //     ]
  //   }
  // }