export interface WeaponItem {
  id: string
  name: string
  category: string
  type: string
  properties: string[]
  damage: { default: string }
  damageType: string
  weight: string
  cost: string
  mastery: string
  range?: string
}

export const weapons: readonly WeaponItem[] = [
  // SIMPLE MELEE WEAPONS
  { 
    id: 'club', 
    name: 'Club', 
    category: 'simple',
    type: 'melee',
    properties: ['light'],
    damage: { default: '1d4' },
    damageType: 'bludgeoning', 
    weight: '2 lb.',
    cost: '1 sp',
    mastery: 'slow'
  },
  { 
    id: 'dagger', 
    name: 'Dagger', 
    category: 'simple',
    type: 'melee',
    properties: ['finesse', 'light', 'thrown'],
    damage: { default: '1d4' },
    damageType: 'piercing', 
    weight: '1 lb.',
    cost: '2 gp',
    range: '20/60',
    mastery: 'nick'
  },
  { 
    id: 'greatclub', 
    name: 'Greatclub', 
    category: 'simple',
    type: 'melee',
    properties: ['two-handed'],
    damage: { default: '1d8' },
    damageType: 'bludgeoning', 
    weight: '10 lb.',
    cost: '2 sp',
    mastery: 'push'
  },
  { 
    id: 'handaxe', 
    name: 'Handaxe', 
    category: 'simple',
    type: 'melee',
    properties: ['light', 'thrown'],
    damage: { default: '1d6' },
    damageType: 'slashing', 
    weight: '2 lb.',
    cost: '5 gp',
    range: '20/60',
    mastery: 'vex'
  },
  { 
    id: 'javelin', 
    name: 'Javelin', 
    category: 'simple',
    type: 'melee',
    properties: ['thrown'],
    damage: { default: '1d6' },
    damageType: 'piercing', 
    weight: '2 lb.',
    cost: '5 sp',
    range: '30/120',
    mastery: 'slow'
  },
  { 
    id: 'light-hammer', 
    name: 'Light Hammer', 
    category: 'simple',
    type: 'melee',
    properties: ['light', 'thrown'],
    damage: { default: '1d4' },
    damageType: 'bludgeoning', 
    weight: '2 lb.',
    cost: '2 gp',
    range: '20/60',
    mastery: 'nick'
  },
  { 
    id: 'mace', 
    name: 'Mace', 
    category: 'simple',
    type: 'melee',
    properties: [],
    damage: { default: '1d6' },
    damageType: 'bludgeoning', 
    weight: '4 lb.',
    cost: '5 gp',
    mastery: 'sap'
  },
  { 
    id: 'quarterstaff', 
    name: 'Quarterstaff', 
    category: 'simple',
    type: 'melee',
    properties: ['versatile'],
    damage: { default: '1d6', versatile: '1d8' },
    damageType: 'bludgeoning', 
    weight: '4 lb.',
    cost: '2 sp',
    mastery: 'topple'
  },
  { 
    id: 'sickle', 
    name: 'Sickle', 
    category: 'simple',
    type: 'melee',
    properties: ['light'],
    damage: { default: '1d4' },
    damageType: 'slashing', 
    weight: '2 lb.',
    cost: '1 gp',
    mastery: 'nick'
  },
  { 
    id: 'spear', 
    name: 'Spear', 
    category: 'simple',
    type: 'melee',
    properties: ['thrown', 'versatile'],
    damage: { default: '1d6', versatile: '1d8' },
    damageType: 'piercing', 
    weight: '3 lb.',
    cost: '1 gp',
    range: '20/60',
    mastery: 'sap'
  },
  // SIMPLE RANGED
  { 
    id: 'light-crossbow', 
    name: 'Crossbow, Light', 
    category: 'simple',
    type: 'ranged',
    properties: ['ammunition', 'loading', 'two-handed'],
    damage: { default: '1d8' },
    damageType: 'piercing', 
    weight: '5 lb.',
    cost: '25 gp',
    range: '80/320',
    mastery: 'slow'
  },
  { 
    id: 'dart', 
    name: 'Dart', 
    category: 'simple',
    type: 'ranged',
    properties: ['finesse', 'thrown'],
    damage: { default: '1d4' },
    damageType: 'piercing', 
    weight: '0.25 lb.',
    cost: '5 cp',
    range: '20/60',
    mastery: 'vex'
  },
  { 
    id: 'shortbow', 
    name: 'Shortbow', 
    category: 'simple',
    type: 'ranged',
    properties: ['ammunition', 'two-handed'],
    damage: { default: '1d6' },
    damageType: 'piercing', 
    weight: '2 lb.',
    cost: '25 gp',
    range: '80/320',
    mastery: 'vex'
  },
  { 
    id: 'sling', 
    name: 'Sling', 
    category: 'simple',
    type: 'ranged',
    properties: ['ammunition'],
    damage: { default: '1d4' },
    damageType: 'bludgeoning', 
    weight: '0 lb.',
    cost: '1 sp',
    range: '30/120',
    mastery: 'slow'
  },

  // MARTIAL MELEE
  { 
    id: 'battleaxe', 
    name: 'Battleaxe', 
    category: 'martial',
    type: 'melee',
    properties: ['versatile'],
    damage: { default: '1d8', versatile: '1d10' },
    damageType: 'slashing', 
    weight: '4 lb.',
    cost: '10 gp',
    mastery: 'topple'
  },
  { 
    id: 'flail', 
    name: 'Flail', 
    category: 'martial',
    type: 'melee',
    properties: [],
    damage: { default: '1d8' },
    damageType: 'bludgeoning', 
    weight: '2 lb.',
    cost: '10 gp',
    mastery: 'sap'
  },
  { 
    id: 'glaive', 
    name: 'Glaive', 
    category: 'martial',
    type: 'melee',
    properties: ['heavy', 'reach', 'two-handed'],
    damage: { default: '1d10' },
    damageType: 'slashing', 
    weight: '6 lb.',
    cost: '20 gp',
    mastery: 'graze'
  },
  { 
    id: 'greataxe', 
    name: 'Greataxe', 
    category: 'martial',
    type: 'melee',
    properties: ['heavy', 'two-handed'],
    damage: { default: '1d12' },
    damageType: 'slashing', 
    weight: '7 lb.',
    cost: '30 gp',
    mastery: 'cleave'
  },
  { 
    id: 'greatsword', 
    name: 'Greatsword', 
    category: 'martial',
    type: 'melee',
    properties: ['heavy', 'two-handed'],
    damage: { default: '2d6' },
    damageType: 'slashing', 
    weight: '6 lb.',
    cost: '50 gp',
    mastery: 'graze'
  },
  { 
    id: 'halberd', 
    name: 'Halberd', 
    category: 'martial',
    type: 'melee',
    properties: ['heavy', 'reach', 'two-handed'],
    damage: { default: '1d10' },
    damageType: 'slashing', 
    weight: '6 lb.',
    cost: '20 gp',
    mastery: 'cleave'
  },
  { 
    id: 'lance', 
    name: 'Lance', 
    category: 'martial',
    type: 'melee',
    properties: ['reach', 'special'],
    damage: { default: '1d12' },
    damageType: 'piercing', 
    weight: '6 lb.',
    cost: '10 gp',
    mastery: 'topple'
  },
  { 
    id: 'longsword', 
    name: 'Longsword', 
    category: 'martial',
    type: 'melee',
    properties: ['versatile'],
    damage: { default: '1d8', versatile: '1d10' },
    damageType: 'slashing', 
    weight: '3 lb.',
    cost: '15 gp',
    mastery: 'sap'
  },
  { 
    id: 'maul', 
    name: 'Maul', 
    category: 'martial',
    type: 'melee',
    properties: ['heavy', 'two-handed'],
    damage: { default: '2d6' },
    damageType: 'bludgeoning', 
    weight: '10 lb.',
    cost: '10 gp',
    mastery: 'topple'
  },
  { 
    id: 'morningstar', 
    name: 'Morningstar', 
    category: 'martial',
    type: 'melee',
    properties: [],
    damage: { default: '1d8' },
    damageType: 'piercing', 
    weight: '4 lb.',
    cost: '15 gp',
    mastery: 'sap'
  },
  { 
    id: 'pike', 
    name: 'Pike', 
    category: 'martial',
    type: 'melee',
    properties: ['heavy', 'reach', 'two-handed'],
    damage: { default: '1d10' },
    damageType: 'piercing', 
    weight: '18 lb.',
    cost: '5 gp',
    mastery: 'push'
  },
  { 
    id: 'rapier', 
    name: 'Rapier', 
    category: 'martial',
    type: 'melee',
    properties: ['finesse'],
    damage: { default: '1d8' },
    damageType: 'piercing', 
    weight: '2 lb.',
    cost: '25 gp',
    mastery: 'vex'
  },
  { 
    id: 'scimitar', 
    name: 'Scimitar', 
    category: 'martial',
    type: 'melee',
    properties: ['finesse', 'light'],
    damage: { default: '1d6' },
    damageType: 'slashing', 
    weight: '3 lb.',
    cost: '25 gp',
    mastery: 'nick'
  },
  { 
    id: 'shortsword', 
    name: 'Shortsword', 
    category: 'martial',
    type: 'melee',
    properties: ['finesse', 'light'],
    damage: { default: '1d6' },
    damageType: 'piercing', 
    weight: '2 lb.',
    cost: '10 gp',
    mastery: 'vex'
  },
  { 
    id: 'trident', 
    name: 'Trident', 
    category: 'martial',
    type: 'melee',
    properties: ['thrown', 'versatile'],
    damage: { default: '1d6', versatile: '1d8' },
    damageType: 'piercing', 
    weight: '4 lb.',
    cost: '5 gp',
    range: '20/60',
    mastery: 'topple'
  },
  { 
    id: 'war-pick', 
    name: 'War Pick', 
    category: 'martial',
    type: 'melee',
    properties: [],
    damage: { default: '1d8' },
    damageType: 'piercing', 
    weight: '2 lb.',
    cost: '5 gp',
    mastery: 'sap'
  },
  { 
    id: 'warhammer', 
    name: 'Warhammer', 
    category: 'martial',
    type: 'melee',
    properties: ['versatile'],
    damage: { default: '1d8', versatile: '1d10' },
    damageType: 'bludgeoning', 
    weight: '2 lb.',
    cost: '15 gp',
    mastery: 'push'
  },
  { 
    id: 'whip', 
    name: 'Whip', 
    category: 'martial',
    type: 'melee',
    properties: ['finesse', 'reach'],
    damage: { default: '1d4' },
    damageType: 'slashing', 
    weight: '3 lb.',
    cost: '2 gp',
    mastery: 'slow'
  },

  // MARTIAL RANGED
  { 
    id: 'blowgun', 
    name: 'Blowgun', 
    category: 'martial',
    type: 'ranged',
    properties: ['ammunition', 'loading'],
    damage: { default: '1' },
    damageType: 'piercing', 
    weight: '1 lb.',
    cost: '10 gp',
    range: '25/100',
    mastery: 'vex'
  },
  { 
    id: 'hand-crossbow', 
    name: 'Crossbow, Hand', 
    category: 'martial',
    type: 'ranged',
    properties: ['ammunition', 'light', 'loading'],
    damage: { default: '1d6' },
    damageType: 'piercing', 
    weight: '3 lb.',
    cost: '75 gp',
    range: '30/120',
    mastery: 'vex'
  },
  { 
    id: 'heavy-crossbow', 
    name: 'Crossbow, Heavy', 
    category: 'martial',
    type: 'ranged',
    properties: ['ammunition', 'heavy', 'loading', 'two-handed'],
    damage: { default: '1d10' },
    damageType: 'piercing', 
    weight: '18 lb.',
    cost: '50 gp',
    range: '100/400',
    mastery: 'push'
  },
  { 
    id: 'longbow', 
    name: 'Longbow', 
    category: 'martial',
    type: 'ranged',
    properties: ['ammunition', 'heavy', 'two-handed'],
    damage: { default: '1d8' },
    damageType: 'piercing', 
    weight: '2 lb.',
    cost: '50 gp',
    range: '150/600',
    mastery: 'slow'
  },
  { 
    id: 'net', 
    name: 'Net', 
    category: 'martial',
    type: 'ranged',
    properties: ['special', 'thrown'],
    damage: { default: '-' },
    damageType: 'none', 
    weight: '3 lb.',
    cost: '1 gp',
    range: '5/15',
    mastery: 'topple'
  }
]