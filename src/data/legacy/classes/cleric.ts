import { startingWealth5e } from "@/data/startingWealth5e"
import { startingWealth4e } from "@/data/startingWealth4e"
import { startingWealthTiers35e } from "@/data/startingWealth35e"
import type { CharacterClass } from './types'
import { FULL_CASTER_SLOTS_5E, FULL_CASTER_SLOTS_35E, PRIEST_SLOTS_2E, CLERIC_SLOTS_1E, CLERIC_SLOTS_BASIC } from './spellSlotTables'
import { TWOE_GENERAL_PROFICIENCY_SKILLS, TWOE_PRIEST_GROUP_PROFICIENCY_SKILLS } from "@/data/editions/proficiencySkillsByEdition"
import { resolveAvailable2eSkills } from "@/features/character/domain/edition/2e"

export const cleric = {
  id: 'cleric',
  name: 'Cleric',
  definitions: [
    {
      edition: '5e',
      id: 'divineDomain',
      name: 'Divine Domain',
      selectionLevel: 1,
      options: [
        { id: 'arcana', name: 'Arcana Domain', source: 'SCAG' },
        { id: 'death', name: 'Death Domain', source: 'DMG' },
        { id: 'forge', name: 'Forge Domain', source: 'XGE' },
        { id: 'grave', name: 'Grave Domain', source: 'XGE' },
        { id: 'knowledge', name: 'Knowledge Domain', source: 'PHB' },
        { id: 'life', name: 'Life Domain', source: 'PHB' },
        { id: 'light', name: 'Light Domain', source: 'PHB' },
        { id: 'nature', name: 'Nature Domain', source: 'PHB' },
        { id: 'order', name: 'Order Domain', source: 'TCOE' },
        { id: 'peace', name: 'Peace Domain', source: 'TCOE' },
        { id: 'tempest', name: 'Tempest Domain', source: 'PHB' },
        { id: 'trickery', name: 'Trickery Domain', source: 'PHB' },
        { id: 'twilight', name: 'Twilight Domain', source: 'TCOE' },
        { id: 'war', name: 'War Domain', source: 'PHB' }
      ]
    },
    {
      edition: '4e',
      name: 'Divine Channeling',
      selectionLevel: 1,
      options: [
        { id: 'battle-cleric', name: 'Battle Cleric', source: 'MP' },
        { id: 'devout-cleric', name: 'Devout Cleric', source: 'PHB' },
        { id: 'shielding-cleric', name: 'Shielding Cleric', source: 'DP' },
        { id: 'war-priest', name: 'War Priest', source: 'PHSL' }
      ]
    },
    {
      edition: '2e',
      name: 'Priest Kit',
      selectionLevel: 1,
      options: [
        { id: 'amazon-priestess', name: 'Amazon Priestess', parentId: 'priest', source: 'CPH' },
        { id: 'noble-priest', name: 'Noble Priest', parentId: 'priest', source: 'CPH' },
        { id: 'pacifist', name: 'Pacifist', parentId: 'priest', source: 'CPH' },
        { id: 'prophet', name: 'Prophet', parentId: 'priest', source: 'CPH' },
        { id: 'scholar-priest', name: 'Scholar Priest', parentId: 'priest', source: 'CPH' },
        { id: 'fighting-priest', name: 'Fighting Priest', parentId: 'priest', source: 'CPH' },
        { id: 'priest-specific-mythos', name: 'Priest of a Specific Mythos', parentId: 'priest', source: 'PHB' }
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
          individuals: 'none'
        },
        weapons: {
          categories: ['simple'],
          individuals: 'none'
        },
        notes: [
          { id: 'subclassArmorBonus', text: 'Certain Domains (Life, Tempest, War, etc.) grant proficiency with Heavy Armor.' },
          { id: 'subclassWeaponBonus', text: 'Certain Domains (Tempest, War, etc.) grant proficiency with Martial Weapons.' }
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
      allowedRaces: 'all',
      levelCaps: { dwarf: 10, elf: 12, gnome: 9, halfElf: 14, halfling: 8, human: 'unlimited' },
      minStats: { wisdom: 9 },
      allowedAlignments: 'any',
      equipment: {
        armor: {
          categories: 'none',
          individuals: ['all'] // Clerics could wear any armor/shields in 2e
        },
        weapons: {
          categories: 'none',
          individuals: ['club', 'flail', 'mace', 'morningstar', 'staff', 'war-hammer']
        },
        notes: [
          { id: 'bluntWeaponRestriction', text: 'Standard Priests are forbidden from using weapons that draw blood (bladed/pointed).' }
        ]
      },
      startingWealth: {
        classInitialGold: "3d6 * 10", // 2e Priest group roll: 30-180gp
        avgGold: 105,
        goldPerLevel: 350 // High scaling; covers heavy armor and tithes/temple donations
      }
    },
    // 1e AD&D
    {
      edition: '1e',
      allowedRaces: 'all',
      allowedAlignments: 'any',
      equipment: { armor: { categories: 'all', individuals: 'all' }, weapons: { categories: 'none', individuals: ['club', 'flail', 'mace', 'morningstar', 'staff', 'war-hammer'] } },
      startingWealth: {
        classInitialGold: "3d6 * 10", // 1e Cleric: 30-180gp
        avgGold: 105,
        goldPerLevel: 200
      }
    },
    // 3.5e
    {
      edition: '3.5e',
      allowedRaces: 'all',
      allowedAlignments: 'any',
      equipment: { armor: { categories: 'all', individuals: 'all' }, weapons: { categories: ['simple'], individuals: 'none' } },
      startingWealth: {
        classInitialGold: "5d4 * 10", // 3.5e Cleric: 50-200gp
        avgGold: 125,
        tiers: startingWealthTiers35e
      }
    },
    // 4e
    {
      edition: '4e',
      allowedRaces: 'all',
      allowedAlignments: 'any',
      equipment: { armor: { categories: ['light', 'chainmail', 'shields'], individuals: 'none' }, weapons: { categories: ['simple', 'military-melee'], individuals: 'none' } },
      startingWealth: { ...startingWealth4e }
    },
    // OD&D & Basic (Holmes): humans only — demihumans use race-as-class (Fighting Man)
    {
      edition: 'odd',
      allowedRaces: ['human'],
      allowedAlignments: 'any',
      equipment: { armor: { categories: 'all', individuals: 'all' }, weapons: { categories: 'none', individuals: ['club', 'flail', 'mace', 'staff', 'war-hammer'] } },
      startingWealth: {
        classInitialGold: "3d6 * 10",
        avgGold: 105,
        goldPerLevel: 150
      }
    },
    {
      edition: 'b',
      allowedRaces: ['human'],
      allowedAlignments: 'any',
      equipment: { armor: { categories: 'all', individuals: 'all' }, weapons: { categories: 'none', individuals: ['club', 'flail', 'mace', 'staff', 'war-hammer'] } },
      startingWealth: {
        classInitialGold: "3d6 * 10",
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
            'history',
            'insight',
            'medicine',
            'persuasion',
            'religion'
          ]
        }
      ],
      weapons: [
        {
          type: 'fixed',
          level: 1,
          // TODO: account for Martial weapons added via the Subclass/Domain data (not currently supported)
          categories: ['simple'],
        }
      ],
      armor: [
        {
          type: 'fixed',
          level: 1,
          categories: ['light', 'medium', 'shields'],
        }
      ],
    },
    '2e': {
      skills: [
        {
          type: 'choice',
          slots: 3,
          level: 1,
          from: resolveAvailable2eSkills(
            TWOE_GENERAL_PROFICIENCY_SKILLS, 
            TWOE_PRIEST_GROUP_PROFICIENCY_SKILLS
          )
        }
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
          level: 1,
          categories: ['light', 'medium', 'shields'],
        }
      ],
    }
  },
  progression: [
    {
      edition: '5e',
      hitDie: 8,
      attackProgression: 'average',
      primaryAbilities: ['wis', 'str'],
      armorProficiency: ['light', 'medium', 'shields'],
      weaponProficiency: ['simple'],
      savingThrows: ['wis', 'cha'],
      spellcasting: 'full',
      spellProgression: {
        type: 'prepared',
        preparedFormula: 'wis+level',
        cantripsKnown: [3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
        spellSlots: FULL_CASTER_SLOTS_5E,
        maxSpellLevel: 9,
      },
      asiLevels: [4, 8, 12, 16, 19],
      features: [
        { level: 1, name: 'Spellcasting' },
        { level: 1, name: 'Divine Domain' },
        { level: 2, name: 'Channel Divinity' },
        { level: 5, name: 'Destroy Undead' },
        { level: 10, name: 'Divine Intervention' },
        { level: 20, name: 'Divine Intervention Improvement' },
      ],
    },
    {
      edition: '4e',
      hitDie: 0,
      hpPerLevel: 5,
      attackProgression: 'average',
      primaryAbilities: ['wis', 'str'],
      armorProficiency: ['light', 'chainmail', 'shields'],
      weaponProficiency: ['simple', 'military-melee'],
      role: 'Leader',
      powerSource: 'Divine',
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
      primaryAbilities: ['wis', 'cha'],
      armorProficiency: ['all'],
      weaponProficiency: ['simple'],
      fortSave: 'good',
      refSave: 'poor',
      willSave: 'good',
      skillPointsPerLevel: 2,
      spellProgression: {
        type: 'prepared',
        preparedFormula: 'wis+level',
        // 3.5e: Clerics also get +1 domain spell per spell level per day (not included in base table)
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
      primaryAbilities: ['wis'],
      armorProficiency: ['all'],
      weaponProficiency: ['club', 'flail', 'mace', 'morningstar', 'staff', 'war-hammer'],
      spellProgression: {
        type: 'prepared',
        // 2e: prepared count = slot count; bonus slots from high Wisdom (handled separately)
        spellSlots: PRIEST_SLOTS_2E,
        maxSpellLevel: 7,
      },
    },
    {
      edition: '1e',
      hitDie: 8,
      attackProgression: 'average',
      primaryAbilities: ['wis'],
      armorProficiency: ['all'],
      weaponProficiency: ['club', 'flail', 'mace', 'morningstar', 'staff', 'war-hammer'],
      spellProgression: {
        type: 'prepared',
        spellSlots: CLERIC_SLOTS_1E,
        maxSpellLevel: 7,
      },
    },
    {
      edition: 'b',
      hitDie: 8,
      attackProgression: 'average',
      primaryAbilities: ['wis'],
      armorProficiency: ['all'],
      weaponProficiency: ['club', 'flail', 'mace', 'morningstar', 'staff', 'war-hammer'],
      spellProgression: {
        type: 'prepared',
        // Basic: Clerics get no spells at level 1
        spellSlots: CLERIC_SLOTS_BASIC,
        maxSpellLevel: 5,
      },
    },
  ],
  generation: {
    abilityPriority: ['wisdom', 'constitution']
  }
} satisfies CharacterClass
