import type { WeaponItem } from './weapons.types'

export const weapons: readonly WeaponItem[] = [
  // SIMPLE MELEE WEAPONS
  { 
    id: 'club', 
    name: 'Club', 
    damageType: 'bludgeoning', 
    weight: '2 lb.',
    editionData: [
      {
        edition: '5e',
        category: 'simple',
        type: 'melee',
        damage: { default: '1d4' },
        cost: '1 sp',
        properties: ['light'],
        mastery: 'slow'
      },
      {
        edition: '2e',
        cost: '0 gp', // Often free or improvised
        speedFactor: 4,
        damage: { sm: '1d6', l: '1d3' }
      },
      {
        edition: '3e',
        category: 'simple',
        type: 'melee',
        damage: { default: '1d6' },
        critical: { multiplier: 2 },
        cost: '0 gp',
        properties: []
      },
      {
        edition: '4e',
        category: 'simple',
        type: 'melee',
        damage: { default: '1d6' },
        proficiencyBonus: 2,
        weaponGroup: ['mace'],
        cost: '1 gp',
        properties: []
      }
    ]
  },
  { 
    id: 'dagger', 
    name: 'Dagger', 
    damageType: 'piercing', 
    weight: '1 lb.',
    editionData: [
      {
        edition: '5e',
        category: 'simple',
        type: 'melee',
        damage: { default: '1d4' },
        cost: '2 gp',
        properties: ['finesse', 'light', 'thrown'],
        range: '20/60',
        mastery: 'nick'
      },
      {
        edition: '2e',
        cost: '2 gp',
        speedFactor: 2,
        damage: { sm: '1d4', l: '1d3' }
      },
      {
        edition: '3e',
        category: 'simple',
        type: 'melee',
        damage: { default: '1d4' },
        critical: { range: 19, multiplier: 2 },
        cost: '2 gp',
        rangeIncrement: 10,
        properties: ['light', 'thrown']
      },
      {
        edition: '4e',
        category: 'simple',
        type: 'melee',
        damage: { default: '1d4' },
        proficiencyBonus: 3,
        weaponGroup: ['light-blade'],
        cost: '1 gp',
        range: '5/10',
        properties: ['light-thrown', 'off-hand']
      }
    ]
  },
  { 
    id: 'greatclub', 
    name: 'Greatclub', 
    damageType: 'bludgeoning', 
    weight: '10 lb.',
    editionData: [
      {
        edition: '5e',
        category: 'simple',
        type: 'melee',
        damage: { default: '1d8' },
        cost: '2 sp',
        properties: ['two-handed'],
        mastery: 'push'
      },
      {
        edition: '2e', // Represented as Footman's Mace or Club (Large)
        cost: '1 gp',
        speedFactor: 7,
        damage: { sm: '2d4', l: '1d6+1' }
      },
      {
        edition: '3e',
        category: 'simple',
        type: 'melee',
        damage: { default: '1d10' },
        critical: { multiplier: 2 },
        cost: '5 gp',
        properties: ['two-handed']
      },
      {
        edition: '4e',
        category: 'simple',
        type: 'melee',
        damage: { default: '2d4' },
        proficiencyBonus: 2,
        weaponGroup: ['mace'],
        cost: '1 gp',
        properties: ['two-handed']
      }
    ]
  },
  { 
    id: 'handaxe', 
    name: 'Handaxe', 
    damageType: 'slashing', 
    weight: '2 lb.',
    editionData: [
      {
        edition: '5e',
        category: 'simple',
        type: 'melee',
        damage: { default: '1d6' },
        cost: '5 gp',
        properties: ['light', 'thrown'],
        range: '20/60',
        mastery: 'vex'
      },
      {
        edition: '2e',
        cost: '1 gp',
        speedFactor: 4,
        damage: { sm: '1d6', l: '1d4' }
      },
      {
        edition: '3e',
        category: 'simple',
        type: 'melee',
        damage: { default: '1d6' },
        critical: { multiplier: 3 },
        cost: '6 gp',
        rangeIncrement: 10,
        properties: ['light', 'thrown']
      },
      {
        edition: '4e',
        category: 'military',
        type: 'melee',
        damage: { default: '1d6' },
        proficiencyBonus: 2,
        weaponGroup: ['axe'],
        cost: '5 gp',
        range: '5/10',
        properties: ['off-hand', 'heavy-thrown']
      }
    ]
  },
  { 
    id: 'javelin', 
    name: 'Javelin', 
    damageType: 'piercing', 
    weight: '2 lb.',
    editionData: [
      {
        edition: '5e',
        category: 'simple',
        type: 'melee',
        damage: { default: '1d6' },
        cost: '5 sp',
        properties: ['thrown'],
        range: '30/120',
        mastery: 'slow'
      },
      {
        edition: '2e',
        cost: '5 sp',
        speedFactor: 4,
        damage: { sm: '1d6', l: '1d6' }
      },
      {
        edition: '3e',
        category: 'simple',
        type: 'ranged',
        damage: { default: '1d6' },
        critical: { multiplier: 2 },
        cost: '1 gp',
        rangeIncrement: 30,
        properties: ['thrown']
      },
      {
        edition: '4e',
        category: 'simple',
        type: 'ranged',
        damage: { default: '1d6' },
        proficiencyBonus: 2,
        weaponGroup: ['spear'],
        cost: '5 sp',
        range: '10/20',
        properties: ['heavy-thrown']
      }
    ]
  },
  { 
    id: 'light-hammer', 
    name: 'Light Hammer', 
    damageType: 'bludgeoning', 
    weight: '2 lb.',
    editionData: [
      {
        edition: '5e',
        category: 'simple',
        type: 'melee',
        damage: { default: '1d4' },
        cost: '2 gp',
        properties: ['light', 'thrown'],
        range: '20/60',
        mastery: 'nick'
      },
      {
        edition: '2e',
        cost: '1 gp',
        speedFactor: 4,
        damage: { sm: '1d4+1', l: '1d4' }
      },
      {
        edition: '3e',
        category: 'martial',
        type: 'melee',
        damage: { default: '1d4' },
        critical: { multiplier: 2 },
        cost: '1 gp',
        rangeIncrement: 20,
        properties: ['light', 'thrown']
      },
      {
        edition: '4e',
        category: 'military',
        type: 'melee',
        damage: { default: '1d6' },
        proficiencyBonus: 2,
        weaponGroup: ['hammer'],
        cost: '5 gp',
        range: '5/10',
        properties: ['off-hand', 'heavy-thrown']
      }
    ]
  },
  { 
    id: 'mace', 
    name: 'Mace', 
    damageType: 'bludgeoning', 
    weight: '4 lb.',
    editionData: [
      {
        edition: '5e',
        category: 'simple',
        type: 'melee',
        damage: { default: '1d6' },
        cost: '5 gp',
        properties: [],
        mastery: 'sap'
      },
      {
        edition: '2e', // Footman's Mace
        cost: '8 gp',
        speedFactor: 7,
        damage: { sm: '1d6+1', l: '1d6' }
      },
      {
        edition: '3e',
        category: 'simple',
        type: 'melee',
        damage: { default: '1d8' },
        critical: { multiplier: 2 },
        cost: '12 gp',
        properties: []
      },
      {
        edition: '4e',
        category: 'simple',
        type: 'melee',
        damage: { default: '1d8' },
        proficiencyBonus: 2,
        weaponGroup: ['mace'],
        cost: '5 gp',
        properties: ['versatile']
      }
    ]
  },
  { 
    id: 'quarterstaff', 
    name: 'Quarterstaff', 
    damageType: 'bludgeoning', 
    weight: '4 lb.',
    editionData: [
      {
        edition: '5e',
        category: 'simple',
        type: 'melee',
        damage: { default: '1d6', versatile: '1d8' },
        cost: '2 sp',
        properties: ['versatile'],
        mastery: 'topple'
      },
      {
        edition: '2e',
        cost: '0 gp',
        speedFactor: 4,
        damage: { sm: '1d6', l: '1d6' }
      },
      {
        edition: '3e',
        category: 'simple',
        type: 'melee',
        damage: { default: '1d6', versatile: '1d8' },
        critical: { multiplier: 2 },
        cost: '0 gp',
        properties: ['double', 'monk']
      },
      {
        edition: '4e',
        category: 'simple',
        type: 'melee',
        damage: { default: '1d8' },
        proficiencyBonus: 2,
        weaponGroup: ['staff'],
        cost: '5 gp',
        properties: ['versatile']
      }
    ]
  },
  { 
    id: 'sickle', 
    name: 'Sickle', 
    damageType: 'slashing', 
    weight: '2 lb.',
    editionData: [
      {
        edition: '5e',
        category: 'simple',
        type: 'melee',
        damage: { default: '1d4' },
        cost: '1 gp',
        properties: ['light'],
        mastery: 'nick'
      },
      {
        edition: '2e',
        cost: '6 sp',
        speedFactor: 4,
        damage: { sm: '1d4+1', l: '1d4' }
      },
      {
        edition: '3e',
        category: 'simple',
        type: 'melee',
        damage: { default: '1d6' },
        critical: { multiplier: 2 },
        cost: '6 gp',
        properties: ['light', 'trip']
      },
      {
        edition: '4e',
        category: 'simple',
        type: 'melee',
        damage: { default: '1d6' },
        proficiencyBonus: 2,
        weaponGroup: ['light-blade'],
        cost: '2 gp',
        properties: ['light']
      }
    ]
  },
  { 
    id: 'spear', 
    name: 'Spear', 
    damageType: 'piercing', 
    weight: '3 lb.',
    editionData: [
      {
        edition: '5e',
        category: 'simple',
        type: 'melee',
        damage: { default: '1d6', versatile: '1d8' },
        cost: '1 gp',
        properties: ['thrown', 'versatile'],
        range: '20/60',
        mastery: 'sap'
      },
      {
        edition: '2e',
        cost: '8 sp',
        speedFactor: 6,
        damage: { sm: '1d6', l: '1d8' }
      },
      {
        edition: '3e',
        category: 'simple',
        type: 'melee',
        damage: { default: '1d8' },
        critical: { multiplier: 3 },
        cost: '2 gp',
        rangeIncrement: 20,
        properties: ['thrown']
      },
      {
        edition: '4e',
        category: 'simple',
        type: 'melee',
        damage: { default: '1d8' },
        proficiencyBonus: 2,
        weaponGroup: ['spear'],
        cost: '5 gp',
        range: '10/20',
        properties: ['versatile', 'heavy-thrown']
      }
    ]
  },

  // SIMPLE RANGED WEAPONS
  { 
    id: 'light-crossbow', 
    name: 'Crossbow, Light', 
    damageType: 'piercing', 
    weight: '5 lb.',
    editionData: [
      {
        edition: '5e',
        category: 'simple',
        type: 'ranged',
        damage: { default: '1d8' },
        cost: '25 gp',
        properties: ['ammunition', 'loading', 'two-handed'],
        range: '80/320',
        mastery: 'slow'
      },
      {
        edition: '2e',
        cost: '35 gp',
        speedFactor: 7,
        damage: { sm: '1d4', l: '1d4' },
        range: '60/120/180'
      },
      {
        edition: '3e',
        category: 'simple',
        type: 'ranged',
        damage: { default: '1d8' },
        critical: { range: 19, multiplier: 2 },
        cost: '35 gp',
        rangeIncrement: 80,
        properties: []
      },
      {
        edition: '4e',
        category: 'simple',
        type: 'ranged',
        damage: { default: '1d8' },
        proficiencyBonus: 2,
        weaponGroup: ['crossbow'],
        cost: '25 gp',
        range: '15/30',
        properties: ['load-minor']
      }
    ]
  },
  { 
    id: 'dart', 
    name: 'Dart', 
    damageType: 'piercing', 
    weight: '0.25 lb.',
    editionData: [
      {
        edition: '5e',
        category: 'simple',
        type: 'ranged',
        damage: { default: '1d4' },
        cost: '5 cp',
        properties: ['finesse', 'thrown'],
        range: '20/60',
        mastery: 'vex'
      },
      {
        edition: '2e',
        cost: '5 cp',
        speedFactor: 2,
        damage: { sm: '1d3', l: '1d2' },
        range: '10/20/40'
      },
      {
        edition: '3e',
        category: 'simple',
        type: 'ranged',
        damage: { default: '1d4' },
        critical: { multiplier: 2 },
        cost: '5 sp',
        rangeIncrement: 20,
        properties: ['thrown']
      },
      {
        edition: '4e',
        // No official 4e dart; approximate as simple thrown
        category: 'simple',
        type: 'ranged',
        damage: { default: '1d4' },
        proficiencyBonus: 3,
        weaponGroup: ['light-blade'],
        cost: '5 sp',
        range: '5/10',
        properties: ['light-thrown']
      }
    ]
  },
  { 
    id: 'shortbow', 
    name: 'Shortbow', 
    damageType: 'piercing', 
    weight: '2 lb.',
    editionData: [
      {
        edition: '5e',
        category: 'simple',
        type: 'ranged',
        damage: { default: '1d6' },
        cost: '25 gp',
        properties: ['ammunition', 'two-handed'],
        range: '80/320',
        mastery: 'vex'
      },
      {
        edition: '2e',
        cost: '30 gp',
        speedFactor: 7,
        damage: { sm: '1d6', l: '1d6' },
        range: '50/100/150'
      },
      {
        edition: '3e',
        category: 'simple',
        type: 'ranged',
        damage: { default: '1d6' },
        critical: { multiplier: 3 },
        cost: '30 gp',
        rangeIncrement: 60,
        properties: []
      },
      {
        edition: '4e',
        category: 'military',
        type: 'ranged',
        damage: { default: '1d8' },
        proficiencyBonus: 2,
        weaponGroup: ['bow'],
        cost: '25 gp',
        range: '15/30',
        properties: ['load-free', 'small']
      }
    ]
  },
  { 
    id: 'sling', 
    name: 'Sling', 
    damageType: 'bludgeoning', 
    weight: '0 lb.',
    editionData: [
      {
        edition: '5e',
        category: 'simple',
        type: 'ranged',
        damage: { default: '1d4' },
        cost: '1 sp',
        properties: ['ammunition'],
        range: '30/120',
        mastery: 'slow'
      },
      {
        edition: '2e',
        cost: '5 cp',
        speedFactor: 6,
        damage: { sm: '1d4', l: '1d4' },
        range: '40/80/160'
      },
      {
        edition: '3e',
        category: 'simple',
        type: 'ranged',
        damage: { default: '1d4' },
        critical: { multiplier: 2 },
        cost: '0 gp',
        rangeIncrement: 50,
        properties: []
      },
      {
        edition: '4e',
        category: 'simple',
        type: 'ranged',
        damage: { default: '1d6' },
        proficiencyBonus: 2,
        weaponGroup: ['sling'],
        cost: '1 gp',
        range: '10/20',
        properties: ['load-free']
      }
    ]
  },

  // MARTIAL MELEE
  { 
    id: 'battleaxe', 
    name: 'Battleaxe', 
    damageType: 'slashing', 
    weight: '4 lb.',
    editionData: [
      {
        edition: '5e',
        category: 'martial',
        type: 'melee',
        damage: { default: '1d8', versatile: '1d10' },
        cost: '10 gp',
        properties: ['versatile'],
        mastery: 'topple'
      },
      {
        edition: '2e',
        cost: '5 gp',
        speedFactor: 7,
        damage: { sm: '1d8', l: '1d8' }
      },
      {
        edition: '3e',
        category: 'martial',
        type: 'melee',
        damage: { default: '1d8' },
        critical: { multiplier: 3 },
        cost: '10 gp',
        properties: []
      },
      {
        edition: '4e',
        category: 'military',
        type: 'melee',
        damage: { default: '1d10' },
        proficiencyBonus: 2,
        weaponGroup: ['axe'],
        cost: '15 gp',
        properties: ['versatile']
      }
    ]
  },
  { 
    id: 'flail', 
    name: 'Flail', 
    damageType: 'bludgeoning', 
    weight: '2 lb.',
    editionData: [
      {
        edition: '5e',
        category: 'martial',
        type: 'melee',
        damage: { default: '1d8' },
        cost: '10 gp',
        properties: [],
        mastery: 'sap'
      },
      {
        edition: '2e', // Horseman's Flail
        cost: '8 gp',
        speedFactor: 6,
        damage: { sm: '1d4+1', l: '1d4+1' }
      },
      {
        edition: '3e',
        category: 'martial',
        type: 'melee',
        damage: { default: '1d8' },
        critical: { multiplier: 2 },
        cost: '8 gp',
        properties: []
      },
      {
        edition: '4e',
        category: 'military',
        type: 'melee',
        damage: { default: '1d10' },
        proficiencyBonus: 2,
        weaponGroup: ['flail'],
        cost: '10 gp',
        properties: ['versatile']
      }
    ]
  },
  { 
    id: 'glaive', 
    name: 'Glaive', 
    damageType: 'slashing', 
    weight: '6 lb.',
    editionData: [
      {
        edition: '5e',
        category: 'martial',
        type: 'melee',
        damage: { default: '1d10' },
        cost: '20 gp',
        properties: ['heavy', 'reach', 'two-handed'],
        mastery: 'graze'
      },
      {
        edition: '2e',
        cost: '6 gp',
        speedFactor: 8,
        damage: { sm: '1d6', l: '1d10' }
      },
      {
        edition: '3e',
        category: 'martial',
        type: 'melee',
        damage: { default: '1d10' },
        critical: { multiplier: 3 },
        cost: '8 gp',
        properties: ['reach', 'two-handed']
      },
      {
        edition: '4e',
        category: 'superior',
        type: 'melee',
        damage: { default: '2d4' },
        proficiencyBonus: 2,
        weaponGroup: ['polearm', 'heavy-blade'],
        cost: '25 gp',
        properties: ['reach', 'two-handed']
      }
    ]
  },
  { 
    id: 'greataxe', 
    name: 'Greataxe', 
    damageType: 'slashing', 
    weight: '7 lb.',
    editionData: [
      {
        edition: '5e',
        category: 'martial',
        type: 'melee',
        damage: { default: '1d12' },
        cost: '30 gp',
        properties: ['heavy', 'two-handed'],
        mastery: 'cleave'
      },
      {
        edition: '2e', // Battle Axe (Two-handed version)
        cost: '5 gp',
        speedFactor: 7,
        damage: { sm: '1d8', l: '1d8' }
      },
      {
        edition: '3e',
        category: 'martial',
        type: 'melee',
        damage: { default: '1d12' },
        critical: { multiplier: 3 },
        cost: '20 gp',
        properties: ['two-handed']
      },
      {
        edition: '4e',
        category: 'military',
        type: 'melee',
        damage: { default: '1d12' },
        proficiencyBonus: 2,
        weaponGroup: ['axe'],
        cost: '30 gp',
        properties: ['two-handed', 'high-crit']
      }
    ]
  },
   { 
    id: 'greatsword', 
    name: 'Greatsword', 
    damageType: 'slashing', 
    weight: '6 lb.',
    editionData: [
      {
        edition: '5e',
        category: 'martial',
        type: 'melee',
        damage: { default: '2d6' },
        cost: '50 gp',
        properties: ['heavy', 'two-handed'],
        mastery: 'graze'
      },
      {
        edition: '2e', // Two-handed Sword
        cost: '50 gp',
        speedFactor: 10,
        damage: { sm: '1d10', l: '3d6' }
      },
      {
        edition: '3e',
        category: 'martial',
        type: 'melee',
        damage: { default: '2d6' },
        critical: { range: 19, multiplier: 2 },
        cost: '50 gp',
        properties: ['two-handed']
      },
      {
        edition: '4e',
        category: 'military',
        type: 'melee',
        damage: { default: '1d10' },
        proficiencyBonus: 3,
        weaponGroup: ['heavy-blade'],
        cost: '30 gp',
        properties: ['two-handed']
      }
    ]
  },
  { 
    id: 'halberd', 
    name: 'Halberd', 
    damageType: 'slashing', 
    weight: '6 lb.',
    editionData: [
      {
        edition: '5e',
        category: 'martial',
        type: 'melee',
        damage: { default: '1d10' },
        cost: '20 gp',
        properties: ['heavy', 'reach', 'two-handed'],
        mastery: 'cleave'
      },
      {
        edition: '2e',
        cost: '10 gp',
        speedFactor: 9,
        damage: { sm: '1d10', l: '2d6' }
      },
      {
        edition: '3e',
        category: 'martial',
        type: 'melee',
        damage: { default: '1d10' },
        critical: { multiplier: 3 },
        cost: '10 gp',
        properties: ['two-handed', 'trip']
      },
      {
        edition: '4e',
        category: 'military',
        type: 'melee',
        damage: { default: '1d10' },
        proficiencyBonus: 2,
        weaponGroup: ['polearm', 'axe'],
        cost: '25 gp',
        properties: ['reach', 'two-handed', 'versatile']
      }
    ]
  },
  { 
    id: 'lance', 
    name: 'Lance', 
    damageType: 'piercing', 
    weight: '6 lb.',
    editionData: [
      {
        edition: '5e',
        category: 'martial',
        type: 'melee',
        damage: { default: '1d12' },
        cost: '10 gp',
        properties: ['reach', 'special'],
        mastery: 'topple'
      },
      {
        edition: '2e', // Jousting Lance
        cost: '6 gp',
        speedFactor: 8,
        damage: { sm: '1d6+1', l: '3d6' }
      },
      {
        edition: '3e',
        category: 'martial',
        type: 'melee',
        damage: { default: '1d8' },
        critical: { multiplier: 3 },
        cost: '10 gp',
        properties: ['reach']
      },
      {
        edition: '4e',
        // No standard 4e lance; approximate as military spear
        category: 'military',
        type: 'melee',
        damage: { default: '1d10' },
        proficiencyBonus: 2,
        weaponGroup: ['spear'],
        cost: '10 gp',
        properties: ['reach', 'mounted']
      }
    ]
  },
  { 
    id: 'longsword', 
    name: 'Longsword', 
    damageType: 'slashing', 
    weight: '3 lb.',
    editionData: [
      {
        edition: '5e',
        category: 'martial',
        type: 'melee',
        damage: { default: '1d8', versatile: '1d10' },
        cost: '15 gp',
        properties: ['versatile'],
        mastery: 'sap'
      },
      {
        edition: '2e',
        cost: '15 gp',
        speedFactor: 5,
        damage: { sm: '1d8', l: '1d12' }
      },
      {
        edition: '3e',
        category: 'martial',
        type: 'melee',
        damage: { default: '1d8' },
        critical: { range: 19, multiplier: 2 },
        cost: '15 gp',
        properties: []
      },
      {
        edition: '4e',
        category: 'military',
        type: 'melee',
        damage: { default: '1d8' },
        proficiencyBonus: 3,
        weaponGroup: ['heavy-blade'],
        cost: '15 gp',
        properties: ['versatile']
      }
    ]
  },
  { 
    id: 'maul', 
    name: 'Maul', 
    damageType: 'bludgeoning', 
    weight: '10 lb.',
    editionData: [
      {
        edition: '5e',
        category: 'martial',
        type: 'melee',
        damage: { default: '2d6' },
        cost: '10 gp',
        properties: ['heavy', 'two-handed'],
        mastery: 'topple'
      },
      {
        edition: '2e', // Heavy Horseman's Mace/Maul
        cost: '5 gp',
        speedFactor: 7,
        damage: { sm: '1d6+1', l: '1d6' }
      },
      {
        edition: '3e',
        // 3e doesn't have "maul" — closest is greatclub or warhammer (two-handed)
        category: 'martial',
        type: 'melee',
        damage: { default: '1d10' },
        critical: { multiplier: 3 },
        cost: '15 gp',
        properties: ['two-handed']
      },
      {
        edition: '4e',
        category: 'military',
        type: 'melee',
        damage: { default: '2d6' },
        proficiencyBonus: 2,
        weaponGroup: ['hammer'],
        cost: '30 gp',
        properties: ['two-handed']
      }
    ]
  },
  { 
    id: 'morningstar', 
    name: 'Morningstar', 
    damageType: 'piercing', 
    weight: '4 lb.',
    editionData: [
      {
        edition: '5e',
        category: 'martial',
        type: 'melee',
        damage: { default: '1d8' },
        cost: '15 gp',
        properties: [],
        mastery: 'sap'
      },
      {
        edition: '2e',
        cost: '10 gp',
        speedFactor: 7,
        damage: { sm: '2d4', l: '1d6+1' }
      },
      {
        edition: '3e',
        category: 'simple',
        type: 'melee',
        damage: { default: '1d8' },
        critical: { multiplier: 2 },
        cost: '8 gp',
        properties: []
      },
      {
        edition: '4e',
        category: 'military',
        type: 'melee',
        damage: { default: '1d10' },
        proficiencyBonus: 2,
        weaponGroup: ['mace'],
        cost: '10 gp',
        properties: ['versatile']
      }
    ]
  },
  { 
    id: 'pike', 
    name: 'Pike', 
    damageType: 'piercing', 
    weight: '18 lb.',
    editionData: [
      {
        edition: '5e',
        category: 'martial',
        type: 'melee',
        damage: { default: '1d10' },
        cost: '5 gp',
        properties: ['heavy', 'reach', 'two-handed'],
        mastery: 'push'
      },
      {
        edition: '2e',
        cost: '3 gp',
        speedFactor: 13,
        damage: { sm: '1d6', l: '1d12' }
      },
      {
        edition: '3e',
        // 3e longspear
        category: 'simple',
        type: 'melee',
        damage: { default: '1d8' },
        critical: { multiplier: 3 },
        cost: '5 gp',
        properties: ['reach', 'two-handed']
      },
      {
        edition: '4e',
        // 4e longspear
        category: 'military',
        type: 'melee',
        damage: { default: '1d10' },
        proficiencyBonus: 2,
        weaponGroup: ['polearm', 'spear'],
        cost: '10 gp',
        properties: ['reach', 'two-handed']
      }
    ]
  },
  { 
    id: 'rapier', 
    name: 'Rapier', 
    damageType: 'piercing', 
    weight: '2 lb.',
    editionData: [
      {
        edition: '5e',
        category: 'martial',
        type: 'melee',
        damage: { default: '1d8' },
        cost: '25 gp',
        properties: ['finesse'],
        mastery: 'vex'
      },
      {
        edition: '2e',
        cost: '15 gp',
        speedFactor: 4,
        damage: { sm: '1d6+1', l: '1d8+1' }
      },
      {
        edition: '3e',
        category: 'martial',
        type: 'melee',
        damage: { default: '1d6' },
        critical: { range: 18, multiplier: 2 },
        cost: '20 gp',
        properties: ['finesse']
      },
      {
        edition: '4e',
        category: 'military',
        type: 'melee',
        damage: { default: '1d8' },
        proficiencyBonus: 3,
        weaponGroup: ['light-blade'],
        cost: '25 gp',
        properties: []
      }
    ]
  },
  { 
    id: 'scimitar', 
    name: 'Scimitar', 
    damageType: 'slashing', 
    weight: '3 lb.',
    editionData: [
      {
        edition: '5e',
        category: 'martial',
        type: 'melee',
        damage: { default: '1d6' },
        cost: '25 gp',
        properties: ['finesse', 'light'],
        mastery: 'nick'
      },
      {
        edition: '2e',
        cost: '15 gp',
        speedFactor: 5,
        damage: { sm: '1d8', l: '1d8' }
      },
      {
        edition: '3e',
        category: 'martial',
        type: 'melee',
        damage: { default: '1d6' },
        critical: { range: 18, multiplier: 2 },
        cost: '15 gp',
        properties: ['light']
      },
      {
        edition: '4e',
        category: 'military',
        type: 'melee',
        damage: { default: '1d8' },
        proficiencyBonus: 2,
        weaponGroup: ['heavy-blade'],
        cost: '10 gp',
        properties: ['high-crit']
      }
    ]
  },
  { 
    id: 'shortsword', 
    name: 'Shortsword', 
    damageType: 'piercing', 
    weight: '2 lb.',
    editionData: [
      {
        edition: '5e',
        category: 'martial',
        type: 'melee',
        damage: { default: '1d6' },
        cost: '10 gp',
        properties: ['finesse', 'light'],
        mastery: 'vex'
      },
      {
        edition: '2e',
        cost: '10 gp',
        speedFactor: 3,
        damage: { sm: '1d6', l: '1d8' }
      },
      {
        edition: '3e',
        category: 'martial',
        type: 'melee',
        damage: { default: '1d6' },
        critical: { range: 19, multiplier: 2 },
        cost: '10 gp',
        properties: ['light']
      },
      {
        edition: '4e',
        category: 'military',
        type: 'melee',
        damage: { default: '1d6' },
        proficiencyBonus: 3,
        weaponGroup: ['light-blade'],
        cost: '10 gp',
        properties: ['off-hand', 'light']
      }
    ]
  },
  { 
    id: 'trident', 
    name: 'Trident', 
    damageType: 'piercing', 
    weight: '4 lb.',
    editionData: [
      {
        edition: '5e',
        category: 'martial',
        type: 'melee',
        damage: { default: '1d6', versatile: '1d8' },
        cost: '5 gp',
        properties: ['thrown', 'versatile'],
        range: '20/60',
        mastery: 'topple'
      },
      {
        edition: '2e',
        cost: '15 gp',
        speedFactor: 7,
        damage: { sm: '1d6+1', l: '3d4' }
      },
      {
        edition: '3e',
        category: 'martial',
        type: 'melee',
        damage: { default: '1d8' },
        critical: { multiplier: 2 },
        cost: '15 gp',
        rangeIncrement: 10,
        properties: ['thrown']
      },
      {
        edition: '4e',
        category: 'military',
        type: 'melee',
        damage: { default: '1d8' },
        proficiencyBonus: 2,
        weaponGroup: ['spear'],
        cost: '10 gp',
        range: '3/6',
        properties: ['versatile', 'heavy-thrown']
      }
    ]
  },
  { 
    id: 'war-pick', 
    name: 'War Pick', 
    damageType: 'piercing', 
    weight: '2 lb.',
    editionData: [
      {
        edition: '5e',
        category: 'martial',
        type: 'melee',
        damage: { default: '1d8' },
        cost: '5 gp',
        properties: [],
        mastery: 'sap'
      },
      {
        edition: '2e', // Footman's Pick
        cost: '8 gp',
        speedFactor: 7,
        damage: { sm: '1d6+1', l: '2d4' }
      },
      {
        edition: '3e',
        category: 'martial',
        type: 'melee',
        damage: { default: '1d6' },
        critical: { multiplier: 4 },
        cost: '8 gp',
        properties: []
      },
      {
        edition: '4e',
        category: 'military',
        type: 'melee',
        damage: { default: '1d8' },
        proficiencyBonus: 2,
        weaponGroup: ['pick'],
        cost: '15 gp',
        properties: ['versatile', 'high-crit']
      }
    ]
  },
  { 
    id: 'warhammer', 
    name: 'Warhammer', 
    damageType: 'bludgeoning', 
    weight: '2 lb.',
    editionData: [
      {
        edition: '5e',
        category: 'martial',
        type: 'melee',
        damage: { default: '1d8', versatile: '1d10' },
        cost: '15 gp',
        properties: ['versatile'],
        mastery: 'push'
      },
      {
        edition: '2e', // Footman's Warhammer
        cost: '2 gp',
        speedFactor: 4,
        damage: { sm: '1d4+1', l: '1d4' }
      },
      {
        edition: '3e',
        category: 'martial',
        type: 'melee',
        damage: { default: '1d8' },
        critical: { multiplier: 3 },
        cost: '12 gp',
        properties: []
      },
      {
        edition: '4e',
        category: 'military',
        type: 'melee',
        damage: { default: '1d10' },
        proficiencyBonus: 2,
        weaponGroup: ['hammer'],
        cost: '15 gp',
        properties: ['versatile']
      }
    ]
  },
  { 
    id: 'whip', 
    name: 'Whip', 
    damageType: 'slashing', 
    weight: '3 lb.',
    editionData: [
      {
        edition: '5e',
        category: 'martial',
        type: 'melee',
        damage: { default: '1d4' },
        cost: '2 gp',
        properties: ['finesse', 'reach'],
        mastery: 'slow'
      },
      {
        edition: '2e',
        cost: '1 sp',
        speedFactor: 8,
        damage: { sm: '1d2', l: '1' }
      },
      {
        edition: '3e',
        category: 'exotic',
        type: 'melee',
        damage: { default: '1d3' },
        critical: { multiplier: 2 },
        cost: '1 gp',
        properties: ['reach', 'finesse']
      },
      {
        edition: '4e',
        // No standard 4e whip in PHB; approximate as superior
        category: 'superior',
        type: 'melee',
        damage: { default: '1d4' },
        proficiencyBonus: 3,
        weaponGroup: ['flail'],
        cost: '5 gp',
        properties: ['reach']
      }
    ]
  },
  // MARTIAL RANGED WEAPONS
  { 
    id: 'blowgun', 
    name: 'Blowgun', 
    damageType: 'piercing', 
    weight: '1 lb.',
    editionData: [
      {
        edition: '5e',
        category: 'martial',
        type: 'ranged',
        damage: { default: '1' },
        cost: '10 gp',
        properties: ['ammunition', 'loading'],
        range: '25/100',
        mastery: 'vex'
      },
      {
        edition: '2e',
        cost: '5 gp',
        speedFactor: 5,
        damage: { sm: '1d3', l: '1d2' },
        range: '10/20/30'
      },
      {
        edition: '3e',
        category: 'simple',
        type: 'ranged',
        damage: { default: '1' },
        critical: { multiplier: 2 },
        cost: '1 gp',
        rangeIncrement: 10,
        properties: []
      },
      {
        edition: '4e',
        category: 'superior',
        type: 'ranged',
        damage: { default: '1d4' },
        proficiencyBonus: 3,
        weaponGroup: ['blowgun'],
        cost: '5 gp',
        range: '5/10',
        properties: ['load-free']
      }
    ]
  },
  { 
    id: 'hand-crossbow', 
    name: 'Crossbow, Hand', 
    damageType: 'piercing', 
    weight: '3 lb.',
    editionData: [
      {
        edition: '5e',
        category: 'martial',
        type: 'ranged',
        damage: { default: '1d6' },
        cost: '75 gp',
        properties: ['ammunition', 'light', 'loading'],
        range: '30/120',
        mastery: 'vex'
      },
      {
        edition: '2e',
        cost: '300 gp', // Historically very expensive in 2e
        speedFactor: 5,
        damage: { sm: '1d3', l: '1d2' },
        range: '20/40/60'
      },
      {
        edition: '3e',
        category: 'exotic',
        type: 'ranged',
        damage: { default: '1d4' },
        critical: { range: 19, multiplier: 2 },
        cost: '100 gp',
        rangeIncrement: 30,
        properties: []
      },
      {
        edition: '4e',
        category: 'superior',
        type: 'ranged',
        damage: { default: '1d6' },
        proficiencyBonus: 3,
        weaponGroup: ['crossbow'],
        cost: '25 gp',
        range: '10/20',
        properties: ['load-free', 'off-hand']
      }
    ]
  },
  { 
    id: 'heavy-crossbow', 
    name: 'Crossbow, Heavy', 
    damageType: 'piercing', 
    weight: '18 lb.',
    editionData: [
      {
        edition: '5e',
        category: 'martial',
        type: 'ranged',
        damage: { default: '1d10' },
        cost: '50 gp',
        properties: ['ammunition', 'heavy', 'loading', 'two-handed'],
        range: '100/400',
        mastery: 'push'
      },
      {
        edition: '2e',
        cost: '50 gp',
        speedFactor: 10,
        damage: { sm: '1d4+1', l: '1d6+1' },
        range: '80/160/240'
      },
      {
        edition: '3e',
        category: 'simple',
        type: 'ranged',
        damage: { default: '1d10' },
        critical: { range: 19, multiplier: 2 },
        cost: '50 gp',
        rangeIncrement: 120,
        properties: []
      },
      {
        edition: '4e',
        // No standard 4e heavy crossbow in PHB; approximate as military
        category: 'military',
        type: 'ranged',
        damage: { default: '1d10' },
        proficiencyBonus: 2,
        weaponGroup: ['crossbow'],
        cost: '30 gp',
        range: '15/30',
        properties: ['load-minor', 'two-handed']
      }
    ]
  },
  { 
    id: 'longbow', 
    name: 'Longbow', 
    damageType: 'piercing', 
    weight: '2 lb.',
    editionData: [
      {
        edition: '5e',
        category: 'martial',
        type: 'ranged',
        damage: { default: '1d8' },
        cost: '50 gp',
        properties: ['ammunition', 'heavy', 'two-handed'],
        range: '150/600',
        mastery: 'slow'
      },
      {
        edition: '2e', // Composite Longbow
        cost: '100 gp',
        speedFactor: 9,
        damage: { sm: '1d8', l: '1d8' },
        range: '60/120/210'
      },
      {
        edition: '3e',
        category: 'martial',
        type: 'ranged',
        damage: { default: '1d8' },
        critical: { multiplier: 3 },
        cost: '75 gp',
        rangeIncrement: 100,
        properties: []
      },
      {
        edition: '4e',
        category: 'military',
        type: 'ranged',
        damage: { default: '1d10' },
        proficiencyBonus: 2,
        weaponGroup: ['bow'],
        cost: '30 gp',
        range: '20/40',
        properties: ['load-free']
      }
    ]
  },
  { 
    id: 'net', 
    name: 'Net', 
    damageType: 'none', 
    weight: '3 lb.',
    editionData: [
      {
        edition: '5e',
        category: 'martial',
        type: 'ranged',
        damage: { default: '-' },
        cost: '1 gp',
        properties: ['special', 'thrown'],
        range: '5/15',
        mastery: 'topple'
      },
      {
        edition: '2e',
        cost: '5 gp',
        speedFactor: 10,
        damage: { sm: '-', l: '-' },
        range: '0/0/0' // Range based on Strength/Special rules in 2e
      },
      {
        edition: '3e',
        category: 'exotic',
        type: 'ranged',
        damage: { default: '-' },
        critical: { multiplier: 2 },
        cost: '20 gp',
        rangeIncrement: 10,
        properties: ['entangle']
      },
      {
        edition: '4e',
        // No standard 4e net; approximate as superior
        category: 'superior',
        type: 'ranged',
        damage: { default: '-' },
        proficiencyBonus: 0,
        weaponGroup: ['net'],
        cost: '5 gp',
        range: '3/6',
        properties: ['special']
      }
    ]
  }
]
