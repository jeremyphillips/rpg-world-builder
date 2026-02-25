import { startingWealth5e } from "@/data/startingWealth5e"
import { startingWealth4e } from "@/data/startingWealth4e"
import { startingWealthTiers35e } from "@/data/startingWealth35e"
import type { CharacterClass } from './types'
import { FULL_CASTER_SLOTS_5E, FULL_CASTER_SLOTS_35E, WIZARD_SLOTS_2E, MAGIC_USER_SLOTS_1E, MAGIC_USER_SLOTS_BASIC } from './spellSlotTables'

export const wizard =  {
  id: 'wizard',
  name: 'Wizard',
  displayNameByEdition: {
    '2e': 'Mage',
    '1e': 'Magic-User',
    odd: 'Magic-User',
    b: 'Magic-User',
    bx: 'Magic-User',
    becmi: 'Magic-User',
  },
  definitions: [
    {
      edition: '5e',
      name: 'arcaneTradition',
      selectionLevel: 2,
      options: [
        { id: 'abjuration', name: 'School of Abjuration', source: 'PHB' },
        { id: 'bladesinging', name: 'Bladesinging', source: 'TCOE' },
        { id: 'chronurgy', name: 'Chronurgy Magic', source: 'EGW' },
        { id: 'conjuration', name: 'School of Conjuration', source: 'PHB' },
        { id: 'divination', name: 'School of Divination', source: 'PHB' },
        { id: 'enchantment', name: 'School of Enchantment', source: 'PHB' },
        { id: 'evocation', name: 'School of Evocation', source: 'PHB' },
        { id: 'graviturgy', name: 'Graviturgy Magic', source: 'EGW' },
        { id: 'illusion', name: 'School of Illusion', source: 'PHB' },
        { id: 'necromancy', name: 'School of Necromancy', source: 'PHB' },
        { id: 'order-of-scribes', name: 'Order of Scribes', source: 'TCOE' },
        { id: 'transmutation', name: 'School of Transmutation', source: 'PHB' },
        { id: 'war-magic', name: 'War Magic', source: 'XGE' }
      ]
    },
    {
      edition: '5e',
      taxonomy: 'Weapon',
      options: [
        { id: 'dagger', name: 'Dagger', type: 'item' },
        { id: 'dart', name: 'Dart', type: 'item' },
        { id: 'sling', name: 'Sling', type: 'item' },
        { id: 'quarterstaff', name: 'Quarterstaff', type: 'item' },
        { id: 'light-crossbow', name: 'Light Crossbow', type: 'item' }
      ]
    },    
    {
      edition: '4e',
      name: 'Arcane Implement Mastery',
      selectionLevel: 1,
      options: [
        { id: 'orb-of-imposition', name: 'Orb of Imposition', source: 'PHB' },
        { id: 'staff-of-defense', name: 'Staff of Defense', source: 'PHB' },
        { id: 'wand-of-accuracy', name: 'Wand of Accuracy', source: 'PHB' },
        { id: 'tome-of-readiness', name: 'Tome of Readiness', source: 'AP' },
        { id: 'mage', name: 'Mage (Schools)', source: 'PHSL' }
      ]
    },
    {
      edition: '2e',
      name: 'Wizard Specialization',
      selectionLevel: 1,
      options: [
        { id: 'abjurer', name: 'Abjurer', parentId: 'wizard', source: 'PHB' },
        { id: 'conjurer', name: 'Conjurer', parentId: 'wizard', source: 'PHB' },
        { id: 'diviner', name: 'Diviner', parentId: 'wizard', source: 'PHB' },
        { id: 'enchanter', name: 'Enchanter', parentId: 'wizard', source: 'PHB' },
        { id: 'illusionist', name: 'Illusionist', parentId: 'wizard', source: 'PHB' },
        { id: 'invoker', name: 'Invoker', parentId: 'wizard', source: 'PHB' },
        { id: 'necromancer', name: 'Necromancer', parentId: 'wizard', source: 'PHB' },
        { id: 'transmuter', name: 'Transmuter', parentId: 'wizard', source: 'PHB' },
        // Kits from Complete Wizard's Handbook
        { id: 'academician', name: 'Academician', parentId: 'wizard', source: 'CWH' },
        { id: 'amazon-sorceress', name: 'Amazon Sorceress', parentId: 'wizard', source: 'CWH' },
        { id: 'militant-wizard', name: 'Militant Wizard', parentId: 'wizard', source: 'CWH' },
        { id: 'mystic', name: 'Mystic', parentId: 'wizard', source: 'CWH' },
        { id: 'patrician', name: 'Patrician', parentId: 'wizard', source: 'CWH' },
        { id: 'peasant-wizard', name: 'Peasant Wizard', parentId: 'wizard', source: 'CWH' },
        { id: 'savage-wizard', name: 'Savage Wizard', parentId: 'wizard', source: 'CWH' }
      ]
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
            'insight',
            'investigation',
            'medicine',
            'religion'
          ]
        }
      ],
      weapons: [
        {
          type: 'fixed',
          level: 1,
          categories: [],
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
            { id: 'armorSpellcastingBan', text: 'Wearing armor you are not proficient in prevents spellcasting.' },
            { id: 'subclassArmorBonus', text: 'The Bladesinging tradition grants proficiency with Light Armor.' }
          ]
        },
        weapons: {
          categories: 'none',
          individuals: ['dagger', 'dart', 'sling', 'quarterstaff', 'light-crossbow'],
          notes: [
            { id: 'subclassWeaponBonus', text: 'The Bladesinging tradition grants proficiency with one type of one-handed melee weapon.' },
          ]
        },
        notes: [
          { id: 'arcaneRecovery', text: 'You can recover some spell slots on a short rest.' },
          { id: 'arcaneFocus', text: 'You can use an arcane focus as a spellcasting focus for your wizard spells.' }
        ]
      },
      multiclassing: {
        logic: 'and',
        note: 'Requires 13 Intelligence',
        options: [{ intelligence: 13 }]
      },
      startingWealth: { ...startingWealth5e }
    },
    {
      edition: '2e',
      allowedRaces: ['human', 'elf', 'half-elf'],
      levelCaps: { 
        elf: 15, 
        halfElf: 12, 
        human: 'unlimited' 
      },
      minStats: { intelligence: 9 },
      allowedAlignments: 'any',
      equipment: {
        armor: {
          categories: [],
          individuals: 'none', // Standard Mages cannot wear any armor in 2e
          notes: [{ id: 'armorSpellFailure', text: 'Wearing armor prevents all arcane spellcasting in 2e.' }]
        },
        weapons: {
          categories: [],
          individuals: ['dagger', 'dart', 'staff', 'knife'] // The "restricted list"
        },
        notes: [
          { id: 'spellbookRequirement', text: 'You must possess a spellbook to memorize spells.' },
        ]
      },
      startingWealth: {
        classInitialGold: "(1d4 + 1) * 10", // 2e Mage roll: 20-50gp
        avgGold: 35,
        goldPerLevel: 150 // Low gear overhead, but covers ink, vellum, and components
      }
    },
    // 1e AD&D
    {
      edition: '1e',
      allowedRaces: ['human', 'elf', 'half-elf'],
      allowedAlignments: 'any',
      equipment: { armor: { categories: 'none', individuals: 'none' }, weapons: { categories: 'none', individuals: ['dagger', 'dart', 'staff'] } },
      startingWealth: {
        classInitialGold: "2d4 * 10", // 1e Magic-User: 20-80gp
        avgGold: 50,
        goldPerLevel: 100
      }
    },
    // 3.5e
    {
      edition: '3.5e',
      allowedRaces: 'all',
      allowedAlignments: 'any',
      equipment: { armor: { categories: 'none', individuals: 'none' }, weapons: { categories: 'none', individuals: ['club', 'dagger', 'heavy-crossbow', 'light-crossbow', 'quarterstaff'] } },
      startingWealth: {
        classInitialGold: "3d4 * 10", // 3.5e Wizard: 30-120gp
        avgGold: 75,
        tiers: startingWealthTiers35e
      }
    },
    // 4e
    {
      edition: '4e',
      allowedRaces: 'all',
      allowedAlignments: 'any',
      equipment: { armor: { categories: ['light'], individuals: 'none' }, weapons: { categories: ['simple'], individuals: 'none' } },
      startingWealth: { ...startingWealth4e }
    },
    // OD&D & Basic (Holmes): humans only — demihumans use race-as-class (Fighting Man)
    {
      edition: 'odd',
      allowedRaces: ['human'],
      allowedAlignments: 'any',
      equipment: { armor: { categories: 'none', individuals: 'none' }, weapons: { categories: 'none', individuals: ['dagger', 'staff'] } },
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
      equipment: { armor: { categories: 'none', individuals: 'none' }, weapons: { categories: 'none', individuals: ['dagger', 'staff'] } },
      startingWealth: {
        classInitialGold: "3d6 * 10",
        avgGold: 105,
        goldPerLevel: 100
      }
    }
  ],
  progression: [
    {
      edition: '5e',
      hitDie: 6,
      attackProgression: 'poor',
      primaryAbilities: ['int', 'con'],
      armorProficiency: ['none'],
      weaponProficiency: ['dagger', 'dart', 'sling', 'quarterstaff', 'light-crossbow'],
      savingThrows: ['int', 'wis'],
      spellcasting: 'full',
      spellProgression: {
        type: 'prepared',
        preparedFormula: 'int+level',
        cantripsKnown: [3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
        spellSlots: FULL_CASTER_SLOTS_5E,
        maxSpellLevel: 9,
      },
      asiLevels: [4, 8, 12, 16, 19],
      features: [
        { level: 1, name: 'Spellcasting' },
        { level: 1, name: 'Arcane Recovery' },
        { level: 2, name: 'Arcane Tradition' },
        { level: 18, name: 'Spell Mastery' },
        { level: 20, name: 'Signature Spells' },
      ],
    },
    {
      edition: '4e',
      hitDie: 0,
      hpPerLevel: 4,
      attackProgression: 'poor',
      primaryAbilities: ['int', 'wis'],
      armorProficiency: ['light'],
      weaponProficiency: ['simple'],
      role: 'Controller',
      powerSource: 'Arcane',
      healingSurges: 6,
      surgeValue: '1/4 HP',
      fortitudeBonus: 0,
      reflexBonus: 0,
      willBonus: 2,
    },
    {
      edition: '3.5e',
      hitDie: 4,
      attackProgression: 'poor',
      primaryAbilities: ['int'],
      armorProficiency: ['none'],
      weaponProficiency: ['club', 'dagger', 'heavy-crossbow', 'light-crossbow', 'quarterstaff'],
      fortSave: 'poor',
      refSave: 'poor',
      willSave: 'good',
      skillPointsPerLevel: 2,
      spellProgression: {
        type: 'prepared',
        preparedFormula: 'int+level',
        cantripsKnown: [3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
        spellSlots: FULL_CASTER_SLOTS_35E,
        maxSpellLevel: 9,
      },
    },
    {
      edition: '2e',
      classGroup: 'wizard',
      hitDie: 4,
      attackProgression: 'poor',
      primaryAbilities: ['int'],
      armorProficiency: ['none'],
      weaponProficiency: ['dagger', 'dart', 'staff', 'knife'],
      spellProgression: {
        type: 'prepared',
        // 2e: prepared count = slot count (memorize all slots from spellbook)
        spellSlots: WIZARD_SLOTS_2E,
        maxSpellLevel: 9,
      },
    },
    {
      edition: '1e',
      hitDie: 4,
      attackProgression: 'poor',
      primaryAbilities: ['int'],
      armorProficiency: ['none'],
      weaponProficiency: ['dagger', 'dart', 'staff'],
      spellProgression: {
        type: 'prepared',
        spellSlots: MAGIC_USER_SLOTS_1E,
        maxSpellLevel: 9,
      },
    },
    {
      edition: 'b',
      hitDie: 4,
      attackProgression: 'poor',
      primaryAbilities: ['int'],
      armorProficiency: ['none'],
      weaponProficiency: ['dagger', 'staff'],
      spellProgression: {
        type: 'prepared',
        spellSlots: MAGIC_USER_SLOTS_BASIC,
        maxSpellLevel: 6,
      },
    },
  ],
  generation: {
    abilityPriority: ['intelligence', 'constitution']
  }
} satisfies CharacterClass