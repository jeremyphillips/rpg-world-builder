// import type { ArmorItem } from '../equipment/armor.types';

export interface ArmorItem {
  id: string
  name: string
  material: string
  category: string
  cost: string
  baseAC: number
  stealthDisadvantage: boolean
  properties: string[]
  weight: string
  minStrength?: number
  acBonus?: number
}

export const armor: readonly ArmorItem[] = [
  // LIGHT ARMOR
  {
    id: 'leather',
    name: 'Leather',
    material: 'organic',
    category: 'light',
    cost: '10 gp',
    baseAC: 11,
    stealthDisadvantage: false,
    properties: ['dexterity-modifier-full'],
    weight: '10 lb.',
  },
  {
    id: 'studded-leather',
    name: 'Studded Leather',
    material: 'metal',
    category: 'light',
    cost: '45 gp',
    baseAC: 12,
    stealthDisadvantage: false,
    properties: ['dexterity-modifier-full'],
    weight: '13 lb.',
  },

  // MEDIUM ARMOR
  {
    id: 'hide',
    name: 'Hide',
    material: 'organic',
    category: 'medium',
    cost: '10 gp',
    baseAC: 12,
    stealthDisadvantage: false,
    properties: ['dexterity-modifier-max-2'],
    weight: '12 lb.',
  },
  {
    id: 'chain-shirt',
    name: 'Chain Shirt',
    material: 'metal',
    category: 'medium',
    cost: '50 gp',
    baseAC: 13,
    stealthDisadvantage: false,
    properties: ['dexterity-modifier-max-2'],
    weight: '20 lb.',
  },
  {
    id: 'scale-mail',
    name: 'Scale Mail',
    material: 'metal',
    category: 'medium',
    cost: '50 gp',
    baseAC: 14,
    stealthDisadvantage: true,
    properties: ['dexterity-modifier-max-2'],
    weight: '45 lb.',
  },
  {
    id: 'breastplate',
    name: 'Breastplate',
    material: 'metal',
    category: 'medium',
    cost: '400 gp',
    baseAC: 14,
    stealthDisadvantage: false,
    properties: ['dexterity-modifier-max-2'],
    weight: '20 lb.',
  },
  {
    id: 'half-plate',
    name: 'Half Plate',
    material: 'metal',
    category: 'medium',
    cost: '750 gp',
    baseAC: 15,
    stealthDisadvantage: true,
    properties: ['dexterity-modifier-max-2'],
    weight: '40 lb.',
  },

  // HEAVY ARMOR
  {
    id: 'ring-mail',
    name: 'Ring Mail',
    material: 'metal',
    category: 'heavy',
    cost: '30 gp',
    baseAC: 14,
    stealthDisadvantage: true,
    properties: ['dexterity-modifier-none'],
    weight: '40 lb.',
  },
  {
    id: 'chain-mail',
    name: 'Chain Mail',
    material: 'metal',
    category: 'heavy',
    cost: '75 gp',
    baseAC: 16,
    stealthDisadvantage: true,
    minStrength: 13,
    properties: ['dexterity-modifier-none'],
    weight: '55 lb.',
  },
  {
    id: 'splint',
    name: 'Splint',
    material: 'metal',
    category: 'heavy',
    cost: '200 gp',
    baseAC: 17,
    stealthDisadvantage: true,
    minStrength: 15,
    properties: ['dexterity-modifier-none'],
    weight: '60 lb.',
  },
  {
    id: 'plate',
    name: 'Plate',
    material: 'metal',
    category: 'heavy',
    cost: '1500 gp',
    baseAC: 18,
    stealthDisadvantage: true,
    minStrength: 15,
    properties: ['dexterity-modifier-none'],
    weight: '65 lb.',
  },

  // SHIELDS
  {
    id: 'shield-wood',
    name: 'Shield (Wood)',
    material: 'organic',
    category: 'shields',
    cost: '10 gp',
    acBonus: 2,
    weight: '6 lb.',
  },
  {
    id: 'shield-steel',
    name: 'Shield (Steel)',
    material: 'metal',
    category: 'shields',
    cost: '10 gp',
    acBonus: 2,
    weight: '6 lb.',
  },
];