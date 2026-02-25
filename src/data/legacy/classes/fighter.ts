import { startingWealth5e } from "@/data/startingWealth5e"
import { startingWealth4e } from "@/data/startingWealth4e"
import type { CharacterClass } from './types'
import {
  FIVE_E_STRENGTH_SKILLS,
  TWOE_GENERAL_PROFICIENCY_SKILLS,
  TWOE_WARRIOR_GROUP_PROFICIENCY_SKILLS,
} from "@/data/editions/proficiencySkillsByEdition"
import { resolveAvailable2eSkills } from "@/features/character/domain/edition/2e/proficiencies"

export const fighter = {
  id: 'fighter',
  name: 'Fighter',
  parentId: 'warrior',
  displayNameByEdition: {
    odd: 'Fighting Man',
    b: 'Fighting Man',
  },
  definitions: [
    {
      edition: '5e',
      id: 'martialArchetype',
      name: 'Martial Archetype',
      selectionLevel: 3,
      options: [
        { id: 'arcane-archer', name: 'Arcane Archer', source: 'XGE' },
        { id: 'banneret', name: 'Banneret (Purple Dragon Knight)', source: 'SCAG' },
        {
          id: 'battle-master',
          name: 'Battle Master',
          source: 'PHB',
          features: [
            {
              id: 'battleMaster',
              name: 'Battle Master',
              features: [
                {
                  kind: 'resource',
                  resource: {
                    id: 'superiority_dice',
                    max: 4,
                    dice: 'd8',
                    recharge: 'short_rest'
                  }
                },
                {
                  kind: 'trigger',
                  trigger: 'on_weapon_hit',
                  cost: { resource: 'superiority_dice', amount: 1 },
                  effects: [
                    {
                      kind: 'modifier',
                      target: 'damage',
                      mode: 'add',
                      value: { dice: 'superiority_dice' }
                    },
                    {
                      kind: 'save',
                      ability: 'strength',
                      onFail: { applyCondition: 'prone' }
                    }
                  ]
                }  
              ]
            }
          ]
        },
        { id: 'cavalier', name: 'Cavalier', source: 'XGE' },
        { id: 'champion', name: 'Champion', source: 'PHB' },
        { id: 'echo-knight', name: 'Echo Knight', source: 'EGW' },
        { id: 'eldritch-knight', name: 'Eldritch Knight', source: 'PHB' },
        { id: 'psi-warrior', name: 'Psi Warrior', source: 'TCOE' },
        { id: 'rune-knight', name: 'Rune Knight', source: 'TCOE' },
        { id: 'samurai', name: 'Samurai', source: 'XGE' }
      ]
    },
    {
      edition: '4e',
      name: 'Class Build',
      selectionLevel: 1,
      options: [
        { id: 'battlerage-fighter', name: 'Battlerage Fighter', source: 'MP' },
        { id: 'great-weapon-fighter', name: 'Great Weapon Fighter', source: 'PHB' },
        { id: 'guardian-fighter', name: 'Guardian Fighter', source: 'PHB' },
        { id: 'arena-fighter', name: 'Arena Fighter', source: 'DS' },
        { id: 'brawler-fighter', name: 'Brawler Fighter', source: 'MP2' },
        { id: 'knight', name: 'Knight', source: 'PHSL' },
        { id: 'slayer', name: 'Slayer', source: 'PHSL' }
      ]
    },
    {
      edition: '2e',
      name: 'Fighter Kit',
      selectionLevel: 1,
      options: [
        { id: 'amazon', name: 'Amazon', source: 'CFH' },
        { id: 'barbarian', name: 'Barbarian', source: 'CFH' },
        { id: 'beast-rider', name: 'Beast-Rider', source: 'CFH' },
        { id: 'berserker', name: 'Berserker', source: 'CFH' },
        { id: 'cavalier', name: 'Cavalier', source: 'CFH' },
        { id: 'gladiator', name: 'Gladiator', source: 'CFH' },
        { id: 'myrmidon', name: 'Myrmidon', source: 'CFH' },
        { id: 'noble-warrior', name: 'Noble Warrior', source: 'CFH' },
        { id: 'peasant-hero', name: 'Peasant Hero', source: 'CFH' },
        { id: 'pirate', name: 'Pirate/Outlaw', source: 'CFH' },
        { id: 'swashbuckler', name: 'Swashbuckler', source: 'CFH' },
        { id: 'wilderness-warrior', name: 'Wilderness Warrior', source: 'CFH' }
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
          categories: 'all',
          individuals: [] // No special individual items needed
        },
        weapons: {
          categories: 'all',
          individuals: [] // No special individual items needed
        },
        notes: []
      },
      multiclassing: {
        logic: 'or',
        note: 'Requires 13 Strength OR 13 Dexterity',
        options: [
          { strength: 13 },
          { dexterity: 13 }
        ]
      },
      startingWealth: { ...startingWealth5e },
      generationNotes: [
        { id: 'heavyWeaponSizeConstraint', text: 'Small races have disadvantage with heavy weapons.' },
        { id: 'floatingProficiencyRule', text: 'Redundant skill proficiencies from race/class may be swapped.' }
      ]
    },
    {
      edition: '2e',
      allowedRaces: 'all',
      allowedAlignments: 'any',
      levelCaps: { 
        dwarf: 15, 
        elf: 12, 
        gnome: 15, 
        halfElf: 14, 
        halfling: 9, 
        human: 'unlimited' 
      },
      minStats: { strength: 9 },
      equipment: {
        armor: {
          categories: [], // 2e logic uses individuals for specific kit/class lists
          individuals: 'all'
        },
        weapons: {
          categories: [], // 2e logic uses individuals
          individuals: 'all' // Fighter is the only 2e class permitted to use every weapon in the PHB
        },
        notes: [
          { id: 'weaponSpecialization', text: 'Only Fighters can spend an extra slot to specialize in a specific weapon.' }
        ]
      },
      startingWealth: {
        classInitialGold: "5d4 * 10",
        avgGold: 125,
        goldPerLevel: 250
      }
    },
    // 1e AD&D
    {
      edition: '1e',
      allowedRaces: 'all',
      allowedAlignments: 'any',
      equipment: { armor: { categories: 'all', individuals: 'all' }, weapons: { categories: 'all', individuals: 'all' } },
      startingWealth: {
        classInitialGold: "5d4 * 10", // 1e Fighter: 50-200gp
        avgGold: 125,
        goldPerLevel: 200
      }
    },
    // 4e
    {
      edition: '4e',
      allowedRaces: 'all',
      allowedAlignments: 'any',
      equipment: { armor: { categories: 'all', individuals: 'all' }, weapons: { categories: 'all', individuals: 'all' } },
      startingWealth: { ...startingWealth4e }
    },
    // BECMI
    {
      edition: 'becmi',
      allowedRaces: 'all',
      allowedAlignments: 'any',
      equipment: { armor: { categories: 'all', individuals: 'all' }, weapons: { categories: 'all', individuals: 'all' } },
      startingWealth: {
        classInitialGold: "3d6 * 10", // BECMI standard: 30-180gp
        avgGold: 105,
        goldPerLevel: 150
      }
    },
    // OD&D & Basic (Holmes): all races can be a Fighting Man (race-as-class for demihumans)
    {
      edition: 'odd',
      allowedRaces: 'all',
      allowedAlignments: 'any',
      equipment: { armor: { categories: 'all', individuals: 'all' }, weapons: { categories: 'all', individuals: 'all' } },
      startingWealth: {
        classInitialGold: "3d6 * 10", // OD&D standard: 30-180gp
        avgGold: 105,
        goldPerLevel: 150
      }
    },
    {
      edition: 'b',
      allowedRaces: 'all',
      allowedAlignments: 'any',
      equipment: { armor: { categories: 'all', individuals: 'all' }, weapons: { categories: 'all', individuals: 'all' } },
      startingWealth: {
        classInitialGold: "3d6 * 10", // Basic standard: 30-180gp
        avgGold: 105,
        goldPerLevel: 150
      }
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
            ...Object.keys(FIVE_E_STRENGTH_SKILLS),
            'acrobatics', 
            'history', 
            'insight', 
            'intimidation', 
            'perception', 
            'survival'
          ]
        },
      ],
      weapons: [
        {
          type: 'fixed',
          level: 1,
          categories: [ 'simple', 'martial' ],
        }
      ],
      armor: [
        {
          type: 'fixed',
          level: 1,
          categories: [ 'allArmor', 'shields' ],
        }
      ],
    },
    '2e': {
      skills: [
        {
          type: 'choice',
          slots: 4,
          level: 1,
          from: resolveAvailable2eSkills(
            TWOE_GENERAL_PROFICIENCY_SKILLS,
            TWOE_WARRIOR_GROUP_PROFICIENCY_SKILLS
          )
        }
      ],
      weapons: [
        {
          type: 'fixed',
          level: 1,
          categories: [ 'simple', 'martial' ],
        }
      ],
    },
    // {
    //   edition: '2e',
    //   taxonomy: 'Weapon Proficiency',
    //   choiceCount: 4,
    //   canSpecialize: true, // Unique Fighter trait: spend 2 slots on one weapon
    //   options: [
    //     { id: 'bow', name: 'Bow', cost: 1 },
    //     { id: 'crossbow', name: 'Crossbow', cost: 1 },
    //     { id: 'one-handed-melee', name: 'One-handed Melee', cost: 1 },
    //     { id: 'polearm', name: 'Polearm', cost: 1 },
    //     { id: 'spear', name: 'Spear', cost: 1 },
    //     { id: 'two-handed-melee', name: 'Two-handed Melee', cost: 1 }
    //   ]
    // },
  },
  progression: [
    {
      edition: '5e',
      hitDie: 10,
      attackProgression: 'good',
      primaryAbilities: ['str', 'con'],
      savingThrows: ['str', 'con'],
      spellcasting: 'none',
      extraAttackLevel: 5,
      asiLevels: [4, 6, 8, 12, 14, 16, 19],
      features: [
        { level: 1, name: 'Fighting Style' },
        { level: 1, name: 'Second Wind' },
        { level: 2, name: 'Action Surge' },
        { level: 3, name: 'Martial Archetype' },
        { level: 5, name: 'Extra Attack' },
        { level: 9, name: 'Indomitable' },
        { level: 11, name: 'Extra Attack (2)' },
        { level: 20, name: 'Extra Attack (3)' },
      ],
    },
    {
      edition: '4e',
      hitDie: 0,
      hpPerLevel: 6,
      attackProgression: 'good',
      primaryAbilities: ['str', 'con'],
      armorProficiency: ['all'],
      weaponProficiency: ['all'],
      role: 'Defender',
      powerSource: 'Martial',
      healingSurges: 9,
      surgeValue: '1/4 HP',
      fortitudeBonus: 2,
      reflexBonus: 0,
      willBonus: 0,
    },
    {
      edition: '2e',
      classGroup: 'warrior',
      hitDie: 10,
      attackProgression: 'good',
      primaryAbilities: ['str', 'con'],
      armorProficiency: ['all'],
      weaponProficiency: ['all'],
      // THAC0 by level 1-20 (Fighter table)
      thac0ByLevel: [20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
      saves2e: {
        ppd: [14, 14, 13, 13, 11, 11, 10, 10, 8, 8, 7, 7, 5, 5, 4, 4, 3, 3, 3, 3],
        rsw: [16, 16, 15, 15, 13, 13, 12, 12, 10, 10, 9, 9, 7, 7, 6, 6, 5, 5, 5, 5],
        pp:  [15, 15, 14, 14, 12, 12, 11, 11, 9, 9, 8, 8, 6, 6, 5, 5, 4, 4, 4, 4],
        bw:  [17, 17, 16, 16, 13, 13, 12, 12, 9, 9, 8, 8, 5, 5, 4, 4, 4, 4, 4, 4],
        sp:  [17, 17, 16, 16, 14, 14, 13, 13, 11, 11, 10, 10, 8, 8, 7, 7, 6, 6, 6, 6],
      },
      weaponSlotsInitial: 4,
      weaponSlotInterval: 3,
      nwpSlotsInitial: 3,
      nwpSlotInterval: 3,
    },
    {
      edition: '1e',
      hitDie: 10,
      attackProgression: 'good',
      primaryAbilities: ['str'],
      armorProficiency: ['all'],
      weaponProficiency: ['all'],
      weaponSlotsInitial: 4,
      weaponSlotInterval: 3,
    },
    {
      edition: 'becmi',
      hitDie: 8,
      attackProgression: 'good',
      primaryAbilities: ['str'],
      armorProficiency: ['all'],
      weaponProficiency: ['all'],
    },
    {
      edition: 'odd',
      hitDie: 8,
      attackProgression: 'good',
      primaryAbilities: ['str'],
      armorProficiency: ['all'],
      weaponProficiency: ['all'],
    },
  ],
  generation: {
    abilityPriority: ['strength', 'constitution']
  }
} satisfies CharacterClass
