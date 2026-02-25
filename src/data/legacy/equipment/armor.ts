import type { ArmorItem } from './armor.types'

export const armor: readonly ArmorItem[] = [
  // LIGHT ARMOR
  {
    id: 'padded',
    name: 'Padded',
    material: 'fabric',
    weight: '8 lb.',
    editionData: [
      { edition: '5e', category: 'light', cost: '5 gp', baseAC: 11, stealthDisadvantage: true, properties: ['dexterity-modifier-full'] },
      { edition: '2e', cost: '4 gp', acValue: 8, encumbrance: 'light' },
      { edition: '3e', category: 'light', cost: '5 gp', baseAC: 1, maxDexBonus: 8, armorCheckPenalty: 0, arcaneSpellFailure: 5, speed: { '30': 30, '20': 20 } },
      { edition: '4e', category: 'cloth', cost: '1 gp', baseAC: 0, checkPenalty: 0, speedPenalty: 0, properties: [] }
    ]
  },
  {
    id: 'leather',
    name: 'Leather',
    material: 'organic',
    weight: '10 lb.',
    editionData: [
      { edition: '5e', category: 'light', cost: '10 gp', baseAC: 11, stealthDisadvantage: false, properties: ['dexterity-modifier-full'] },
      { edition: '2e', cost: '5 gp', acValue: 8, encumbrance: 'light' },
      { edition: '3e', category: 'light', cost: '10 gp', baseAC: 2, maxDexBonus: 6, armorCheckPenalty: 0, arcaneSpellFailure: 10, speed: { '30': 30, '20': 20 } },
      { edition: '4e', category: 'leather', cost: '25 gp', baseAC: 2, checkPenalty: 0, speedPenalty: 0, properties: [] }
    ]
  },
  {
    id: 'studded-leather',
    name: 'Studded Leather',
    material: 'metal', // Metal studs make this "metal" for strict Druid taboos
    weight: '13 lb.',
    editionData: [
      { edition: '5e', category: 'light', cost: '45 gp', baseAC: 12, stealthDisadvantage: false, properties: ['dexterity-modifier-full'] },
      { edition: '2e', cost: '20 gp', acValue: 7, encumbrance: 'light' },
      { edition: '3e', category: 'light', cost: '25 gp', baseAC: 3, maxDexBonus: 5, armorCheckPenalty: -1, arcaneSpellFailure: 15, speed: { '30': 30, '20': 20 } },
      // No direct 4e studded leather; use leather stats
      { edition: '4e', category: 'leather', cost: '25 gp', baseAC: 2, checkPenalty: 0, speedPenalty: 0, properties: [] }
    ]
  },

  // MEDIUM ARMOR
  {
    id: 'hide',
    name: 'Hide',
    material: 'organic',
    weight: '12 lb.',
    editionData: [
      { edition: '5e', category: 'medium', cost: '10 gp', baseAC: 12, stealthDisadvantage: false, properties: ['dexterity-modifier-max-2'] },
      { edition: '2e', cost: '15 gp', acValue: 6, encumbrance: 'medium' },
      { edition: '3e', category: 'medium', cost: '15 gp', baseAC: 3, maxDexBonus: 4, armorCheckPenalty: -3, arcaneSpellFailure: 20, speed: { '30': 20, '20': 15 } },
      { edition: '4e', category: 'hide', cost: '30 gp', baseAC: 3, checkPenalty: -1, speedPenalty: 0, properties: [] }
    ]
  },
  {
    id: 'chain-shirt',
    name: 'Chain Shirt',
    material: 'metal',
    weight: '20 lb.',
    editionData: [
      { edition: '5e', category: 'medium', cost: '50 gp', baseAC: 13, stealthDisadvantage: false, properties: ['dexterity-modifier-max-2'] },
      { edition: '2e', cost: '75 gp', acValue: 5, encumbrance: 'medium' },
      { edition: '3e', category: 'light', cost: '100 gp', baseAC: 4, maxDexBonus: 4, armorCheckPenalty: -2, arcaneSpellFailure: 20, speed: { '30': 30, '20': 20 } },
      { edition: '4e', category: 'chainmail', cost: '40 gp', baseAC: 6, checkPenalty: -1, speedPenalty: -1, properties: [] }
    ]
  },
  {
    id: 'scale-mail',
    name: 'Scale Mail',
    material: 'metal',
    weight: '45 lb.',
    editionData: [
      { edition: '5e', category: 'medium', cost: '50 gp', baseAC: 14, stealthDisadvantage: true, properties: ['dexterity-modifier-max-2'] },
      { edition: '2e', cost: '120 gp', acValue: 6, encumbrance: 'medium' },
      { edition: '3e', category: 'medium', cost: '50 gp', baseAC: 4, maxDexBonus: 3, armorCheckPenalty: -4, arcaneSpellFailure: 25, speed: { '30': 20, '20': 15 } },
      { edition: '4e', category: 'scale', cost: '45 gp', baseAC: 7, checkPenalty: 0, speedPenalty: -1, properties: [] }
    ]
  },
  {
    id: 'breastplate',
    name: 'Breastplate',
    material: 'metal',
    weight: '20 lb.',
    editionData: [
      { edition: '5e', category: 'medium', cost: '400 gp', baseAC: 14, stealthDisadvantage: false, properties: ['dexterity-modifier-max-2'] },
      { edition: '2e', cost: '80 gp', acValue: 5, encumbrance: 'heavy' },
      { edition: '3e', category: 'medium', cost: '200 gp', baseAC: 5, maxDexBonus: 3, armorCheckPenalty: -4, arcaneSpellFailure: 25, speed: { '30': 20, '20': 15 } },
      // No direct 4e breastplate; scale or plate category
      { edition: '4e', category: 'scale', cost: '45 gp', baseAC: 7, checkPenalty: 0, speedPenalty: -1, properties: [] }
    ]
  },
  {
    id: 'half-plate',
    name: 'Half Plate',
    material: 'metal',
    weight: '40 lb.',
    editionData: [
      { edition: '5e', category: 'medium', cost: '750 gp', baseAC: 15, stealthDisadvantage: true, properties: ['dexterity-modifier-max-2'] },
      { edition: '2e', cost: '500 gp', acValue: 2, encumbrance: 'heavy' },
      { edition: '3e', category: 'heavy', cost: '600 gp', baseAC: 7, maxDexBonus: 0, armorCheckPenalty: -7, arcaneSpellFailure: 40, speed: { '30': 20, '20': 15 } },
      // No direct 4e half plate; approximate as plate
      { edition: '4e', category: 'plate', cost: '45 gp', baseAC: 8, checkPenalty: -2, speedPenalty: -1, properties: [] }
    ]
  },

  // HEAVY ARMOR
  {
    id: 'ring-mail',
    name: 'Ring Mail',
    material: 'metal',
    weight: '40 lb.',
    editionData: [
      { edition: '5e', category: 'heavy', cost: '30 gp', baseAC: 14, stealthDisadvantage: true, properties: ['dexterity-modifier-none'] },
      { edition: '2e', cost: '100 gp', acValue: 7, encumbrance: 'medium' },
      // 3e: no ring mail; approximate as chainmail
      { edition: '3e', category: 'heavy', cost: '150 gp', baseAC: 5, maxDexBonus: 2, armorCheckPenalty: -5, arcaneSpellFailure: 30, speed: { '30': 20, '20': 15 } },
      { edition: '4e', category: 'chainmail', cost: '40 gp', baseAC: 6, checkPenalty: -1, speedPenalty: -1, properties: [] }
    ]
  },
  {
    id: 'chain-mail',
    name: 'Chain Mail',
    material: 'metal',
    weight: '55 lb.',
    editionData: [
      { edition: '5e', category: 'heavy', cost: '75 gp', baseAC: 16, stealthDisadvantage: true, minStrength: 13, properties: ['dexterity-modifier-none'] },
      { edition: '2e', cost: '75 gp', acValue: 5, encumbrance: 'heavy' },
      { edition: '3e', category: 'heavy', cost: '150 gp', baseAC: 5, maxDexBonus: 2, armorCheckPenalty: -5, arcaneSpellFailure: 30, speed: { '30': 20, '20': 15 } },
      { edition: '4e', category: 'chainmail', cost: '40 gp', baseAC: 6, checkPenalty: -1, speedPenalty: -1, properties: [] }
    ]
  },
  {
    id: 'splint',
    name: 'Splint',
    material: 'metal',
    weight: '60 lb.',
    editionData: [
      { edition: '5e', category: 'heavy', cost: '200 gp', baseAC: 17, stealthDisadvantage: true, minStrength: 15, properties: ['dexterity-modifier-none'] },
      { edition: '2e', cost: '80 gp', acValue: 4, encumbrance: 'heavy' },
      { edition: '3e', category: 'heavy', cost: '200 gp', baseAC: 6, maxDexBonus: 0, armorCheckPenalty: -7, arcaneSpellFailure: 40, speed: { '30': 20, '20': 15 } },
      // No direct 4e splint; approximate as plate
      { edition: '4e', category: 'plate', cost: '45 gp', baseAC: 8, checkPenalty: -2, speedPenalty: -1, properties: [] }
    ]
  },
  {
    id: 'plate',
    name: 'Plate',
    material: 'metal',
    weight: '65 lb.',
    editionData: [
      { edition: '5e', category: 'heavy', cost: '1500 gp', baseAC: 18, stealthDisadvantage: true, minStrength: 15, properties: ['dexterity-modifier-none'] },
      { edition: '2e', cost: '2000 gp', acValue: 1, encumbrance: 'extra-heavy' },
      { edition: '3e', category: 'heavy', cost: '1500 gp', baseAC: 8, maxDexBonus: 1, armorCheckPenalty: -6, arcaneSpellFailure: 35, speed: { '30': 20, '20': 15 } },
      { edition: '4e', category: 'plate', cost: '50 gp', baseAC: 8, checkPenalty: -2, speedPenalty: -1, properties: [] }
    ]
  },

  // SHIELDS
  {
    id: 'shield-wood',
    name: 'Shield (Wood)',
    material: 'organic',
    weight: '6 lb.',
    editionData: [
      { edition: '5e', category: 'shields', cost: '10 gp', acBonus: 2 },
      { edition: '2e', cost: '7 gp', acBonus: 1 },
      { edition: '3e', category: 'shields', cost: '3 gp', acBonus: 1, armorCheckPenalty: -1, arcaneSpellFailure: 5 },
      { edition: '4e', category: 'shields', cost: '5 gp', acBonus: 1, properties: ['light-shield'] }
    ]
  },
  {
    id: 'shield-steel',
    name: 'Shield (Steel)',
    material: 'metal',
    weight: '6 lb.',
    editionData: [
      { edition: '5e', category: 'shields', cost: '10 gp', acBonus: 2 },
      { edition: '2e', cost: '15 gp', acBonus: 1 },
      { edition: '3e', category: 'shields', cost: '9 gp', acBonus: 2, armorCheckPenalty: -2, arcaneSpellFailure: 15 },
      { edition: '4e', category: 'shields', cost: '10 gp', acBonus: 2, properties: ['heavy-shield'] }
    ]
  }
]
