import { startingWealth5e } from "@/data/startingWealth5e"
import { startingWealth4e } from "@/data/startingWealth4e"
import { startingWealthTiers35e } from "@/data/startingWealth35e"
import type { CharacterClass } from './types'
import { HALF_CASTER_SLOTS_5E, RANGER_SLOTS_35E } from './spellSlotTables'
import { TWOE_GENERAL_PROFICIENCY_SKILLS, TWOE_PRIEST_GROUP_PROFICIENCY_SKILLS, TWOE_WARRIOR_GROUP_PROFICIENCY_SKILLS } from "@/data/editions/proficiencySkillsByEdition"
import { resolveAvailable2eSkills } from "@/features/character/domain/edition/2e/proficiencies"

export const ranger = {
  id: 'ranger',
  name: 'Ranger',
  parentId: 'warrior',
  definitions: [
    {
      edition: '5e',
      id: 'rangerArchetype',
      name: 'Ranger Archetype',
      selectionLevel: 3,
      options: [
        { id: 'beast-master', name: 'Beast Master', source: 'PHB' },
        { id: 'fey-wanderer', name: 'Fey Wanderer', source: 'TCOE' },
        { id: 'gloom-stalker', name: 'Gloom Stalker', source: 'XGE' },
        { id: 'horizon-walker', name: 'Horizon Walker', source: 'XGE' },
        { id: 'hunter', name: 'Hunter', source: 'PHB' },
        { id: 'monster-slayer', name: 'Monster Slayer', source: 'XGE' },
        { id: 'swarmkeeper', name: 'Swarmkeeper', source: 'TCOE' },
        { id: 'drake-warden', name: 'Drakewarden', source: 'FTD' }
      ]
    },
    {
      edition: '4e',
      id: 'rangerBuild',
      name: 'Ranger Build',
      selectionLevel: 1,
      options: [
        { id: 'archer-ranger', name: 'Archer Ranger', source: 'PHB' },
        { id: 'beast-master-ranger', name: 'Beast Mastery Ranger', source: 'MP' },
        { id: 'hunter-ranger', name: 'Hunter Ranger', source: 'PHSL' },
        { id: 'scout-ranger', name: 'Scout Ranger', source: 'PHSL' },
        { id: 'two-weapon-ranger', name: 'Two-Weapon Ranger', source: 'PHB' },
        { id: 'marauder-ranger', name: 'Marauder Ranger', source: 'MP2' }
      ]
    },
    {
      edition: '2e',
      id: 'rangerKit',
      name: 'Ranger Kit',
      selectionLevel: 1,
      options: [
        { id: 'beastmaster', name: 'Beastmaster', source: 'CRH' },
        { id: 'falconer', name: 'Falconer', source: 'CRH' },
        { id: 'feral-child', name: 'Feral Child', source: 'CRH' },
        { id: 'forest-runner', name: 'Forest Runner', source: 'CRH' },
        { id: 'giant-killer', name: 'Giant Killer', source: 'CRH' },
        { id: 'green-warden', name: 'Green Warden', source: 'CRH' },
        { id: 'mountain-man', name: 'Mountain Man', source: 'CRH' },
        { id: 'pathfinder', name: 'Pathfinder', source: 'CRH' },
        { id: 'sea-ranger', name: 'Sea Ranger', source: 'CRH' },
        { id: 'stalker', name: 'Stalker', source: 'CRH' },
        { id: 'warden', name: 'Warden', source: 'CRH' }
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
          individuals: []
        },
        weapons: {
          categories: 'all',
          individuals: []
        },
        notes: []
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
      allowedRaces: ['human', 'elf', 'half-elf'],
      levelCaps: { 
        elf: 15, 
        halfElf: 16, 
        human: 'unlimited' 
      },
      minStats: { strength: 13, dexterity: 13, constitution: 14, wisdom: 14 },
      allowedAlignments: ['lg', 'ng', 'cg'], // Rangers must be Good in 2e
      equipment: {
        armor: {
          categories: 'none',
          individuals: ['all'] // Technically can wear all, but lose abilities in heavy
        },
        weapons: {
          categories: 'none',
          individuals: ['all'] // Warrior group permission
        },
        notes: [
          { id: 'stealthArmorRestriction', text: 'Ranger stealth abilities (Hide/Move Silently) only function in Light armor (Leather, Padded, or Studded).' }
        ]
      },
      startingWealth: {
        classInitialGold: "5d4 * 10", // 2e Warriors: 50-200gp
        avgGold: 125,
        goldPerLevel: 300
      }
    },
    // 1e AD&D
    {
      edition: '1e',
      allowedRaces: ['human', 'elf', 'half-elf'],
      allowedAlignments: ['lg', 'ng', 'cg'],
      equipment: { armor: { categories: 'all', individuals: 'all' }, weapons: { categories: 'all', individuals: 'all' } },
      startingWealth: {
        classInitialGold: "5d4 * 10", // 1e Ranger (Warrior group): 50-200gp
        avgGold: 125,
        goldPerLevel: 200
      }
    },
    // 3.5e
    {
      edition: '3.5e',
      allowedRaces: 'all',
      allowedAlignments: 'any',
      equipment: { armor: { categories: ['light'], individuals: 'none' }, weapons: { categories: 'all', individuals: 'all' } },
      startingWealth: {
        classInitialGold: "6d4 * 10", // 3.5e Ranger: 60-240gp
        avgGold: 150,
        tiers: startingWealthTiers35e
      }
    },
    // 4e
    {
      edition: '4e',
      allowedRaces: 'all',
      allowedAlignments: 'any',
      equipment: { armor: { categories: ['light', 'hide'], individuals: 'none' }, weapons: { categories: ['simple', 'military'], individuals: 'none' } },
      startingWealth: { ...startingWealth4e }
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
            'animalHandling',
            'athletics',
            'insight',
            'investigation',
            'nature',
            'perception',
            'stealth',
            'survival'
          ]
        }
      ],
      weapons: [
        {
          type: 'fixed',
          level: 1,
          categories: ['simple', 'martial'],
        }
      ],
      armor: [
        {
          type: 'fixed',
          level: 1,
          categories: ['allArmor', 'shields'],
        }
      ],
    },
    '2e':  {
      skills: [
        {
          type: 'choice',
          count: 3,
          level: 1,
          from: [
            ...resolveAvailable2eSkills(
              TWOE_GENERAL_PROFICIENCY_SKILLS,
              TWOE_WARRIOR_GROUP_PROFICIENCY_SKILLS
            ),
            ...Object.keys(TWOE_PRIEST_GROUP_PROFICIENCY_SKILLS)
          ]
        },
        {
          type: 'fixed',
          level: 1,
          from: ['tracking'],
        }
      ],
    },
    // {
    //   edition: '4e',
    //   taxonomy: 'Trained Skill',
    //   choiceCount: 4,
    //   fixed: [{ id: 'nature', name: 'Nature' }, { id: 'dungeoneering', name: 'Dungeoneering' }],
    //   options: [
    //     { id: 'acrobatics', name: 'Acrobatics' },
    //     { id: 'athletics', name: 'Athletics' },
    //     { id: 'endurance', name: 'Endurance' },
    //     { id: 'heal', name: 'Heal' },
    //     { id: 'perception', name: 'Perception' },
    //     { id: 'stealth', name: 'Stealth' }
    //   ]
    // }
  },
  progression: [
    {
      edition: '5e',
      hitDie: 10,
      attackProgression: 'good',
      primaryAbilities: ['dex', 'wis'],
      armorProficiency: ['light', 'medium', 'shields'],
      weaponProficiency: ['all'],
      savingThrows: ['str', 'dex'],
      spellcasting: 'half',
      spellProgression: {
        type: 'known',
        spellsKnown: [0, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11],
        spellSlots: HALF_CASTER_SLOTS_5E,
        maxSpellLevel: 5,
      },
      extraAttackLevel: 5,
      asiLevels: [4, 8, 12, 16, 19],
      features: [
        { level: 1, name: 'Favored Enemy' },
        { level: 1, name: 'Natural Explorer' },
        { level: 2, name: 'Fighting Style' },
        { level: 2, name: 'Spellcasting' },
        { level: 3, name: 'Ranger Archetype' },
        { level: 3, name: 'Primeval Awareness' },
        { level: 5, name: 'Extra Attack' },
        { level: 8, name: 'Land\'s Stride' },
        { level: 10, name: 'Hide in Plain Sight' },
        { level: 14, name: 'Vanish' },
        { level: 18, name: 'Feral Senses' },
        { level: 20, name: 'Foe Slayer' },
      ],
    },
    {
      edition: '3.5e',
      hitDie: 8,
      attackProgression: 'good',
      primaryAbilities: ['dex', 'wis'],
      armorProficiency: ['light'],
      weaponProficiency: ['all'],
      fortSave: 'good',
      refSave: 'good',
      willSave: 'poor',
      skillPointsPerLevel: 6,
      spellProgression: {
        type: 'prepared',
        // 3.5e Ranger: spells start at level 4, based on Wisdom
        spellSlots: RANGER_SLOTS_35E,
        maxSpellLevel: 4,
      },
    },
    {
      edition: '4e',
      hitDie: 0,
      hpPerLevel: 5,
      attackProgression: 'good',
      primaryAbilities: ['str', 'dex'],
      armorProficiency: ['light', 'hide'],
      weaponProficiency: ['simple', 'military'],
      role: 'Striker',
      powerSource: 'Martial',
      healingSurges: 6,
      surgeValue: '1/4 HP',
      fortitudeBonus: 1,
      reflexBonus: 1,
      willBonus: 0,
    },
    {
      edition: '2e',
      classGroup: 'warrior',
      hitDie: 10,
      attackProgression: 'good',
      primaryAbilities: ['str', 'dex', 'wis'],
      armorProficiency: ['all'],
      weaponProficiency: ['all'],
    },
    {
      edition: '1e',
      hitDie: 8,
      attackProgression: 'good',
      primaryAbilities: ['str', 'int', 'wis'],
      armorProficiency: ['all'],
      weaponProficiency: ['all'],
    },
  ],
  generation: {
    abilityPriority: ['strength', 'dexterity']
  }
} satisfies CharacterClass
