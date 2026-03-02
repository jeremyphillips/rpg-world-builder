import type { MagicItemFields } from "@/features/content/domain";

/** @deprecated to be migrated to system catalog */
export const magicItems: MagicItemFields[] = [
  {
    id: 'flame-tongue',
    name: 'Flame Tongue',
    slot: 'weapon',
    weight: { value: 0, unit: 'lb' },
    cost: { coin: 'gp', value: 5000 },
    rarity: 'rare',
    requiresAttunement: true,
    description:
      'Bonus action to ignite. Deals +2d6 fire damage on hit while active',
    effects: [
      { kind: 'modifier', target: 'damage', mode: 'add', value: { dice: '2d6', type: 'fire' } }
    ]
  },
  {
    id: 'frost-brand',
    name: 'Frost Brand',
    slot: 'weapon',
    weight: { value: 0, unit: 'lb' },
    cost: { coin: 'gp', value: 22000 },
    rarity: 'very-rare',
    requiresAttunement: true,
    bonus: 3,
    description:
      '+1d6 cold damage. Resistance to fire damage. Sheds light in freezing temperatures',
    effects: [
      { kind: 'modifier', target: 'damage', mode: 'add', value: { dice: '1d6', type: 'cold' } },
      { kind: 'modifier', target: 'resistance', mode: 'add', value: 'fire' }
    ]
  },

  // POTIONS
  {
    id: 'potion-of-healing',
    name: 'Potion of Healing',
    slot: 'potion',
    weight: { value: 0.5, unit: 'lb' },
    consumable: true,
    cost: { coin: 'gp', value: 50 },
    rarity: 'common',
    description: 'Regain 2d4 + 2 hit points',
    effects: [
      { kind: 'modifier', target: 'hp', mode: 'add', value: { dice: '2d4+2' } }
    ]
  },
  {
    id: 'potion-of-invisibility',
    name: 'Potion of Invisibility',
    slot: 'potion',
    weight: { value: 0.5, unit: 'lb' },
    consumable: true,
    cost: { coin: 'gp', value: 180 },
    rarity: 'very-rare',
    description:
      'Invisible for 1 hour. Ends early if you attack or cast a spell'
  },
  {
    id: 'potion-of-speed',
    name: 'Potion of Speed',
    slot: 'potion',
    weight: { value: 0.5, unit: 'lb' },
    consumable: true,
    cost: { coin: 'gp', value: 400 },
    rarity: 'very-rare',
    description:
      'Haste for 1 minute (no concentration). +2 AC, advantage on Dex saves, extra action',
    effects: [
      { kind: 'bonus', target: 'armor_class', value: 2 }
    ]
  },

  // RINGS
  {
    id: 'ring-of-protection',
    name: 'Ring of Protection',
    slot: 'ring',
    weight: undefined,
    cost: { coin: 'gp', value: 3500 },
    rarity: 'rare',
    requiresAttunement: true,
    bonus: 1,
    description: '+1 bonus to AC and saving throws',
    effects: [
      { kind: 'bonus', target: 'armor_class', value: 1 },
      { kind: 'bonus', target: 'saving_throws', value: 1 }
    ]
  },
  {
    id: 'ring-of-invisibility',
    name: 'Ring of Invisibility',
    slot: 'ring',
    weight: undefined,
    cost: { coin: 'gp', value: 50000 },
    rarity: 'legendary',
    requiresAttunement: true,
    description:
      'Turn invisible as an action. Ends when you attack or cast a spell'
  },
  {
    id: 'ring-of-spell-storing',
    name: 'Ring of Spell Storing',
    slot: 'ring',
    weight: undefined,
    cost: { coin: 'gp', value: 24000 },
    rarity: 'rare',
    requiresAttunement: true,
    charges: 5,
    description:
      'Stores up to 5 levels of spells. Wearer can cast stored spells'
  },

  // CLOAKS
  {
    id: 'cloak-of-protection',
    name: 'Cloak of Protection',
    slot: 'cloak',
    weight: { value: 1, unit: 'lb' },
    cost: { coin: 'gp', value: 3500 },
    rarity: 'uncommon',
    requiresAttunement: true,
    bonus: 1,
    description: '+1 bonus to AC and saving throws',
    effects: [
      { kind: 'bonus', target: 'armor_class', value: 1 },
      { kind: 'bonus', target: 'saving_throws', value: 1 }
    ]
  },
  {
    id: 'cloak-of-elvenkind',
    name: 'Cloak of Elvenkind',
    slot: 'cloak',
    weight: { value: 1, unit: 'lb' },
    cost: { coin: 'gp', value: 5000 },
    rarity: 'uncommon',
    requiresAttunement: true,
    description:
      'Advantage on Stealth checks. Disadvantage for others trying to see you'
  },

  // BOOTS
  {
    id: 'boots-of-elvenkind',
    name: 'Boots of Elvenkind',
    slot: 'boots',
    weight: { value: 1, unit: 'lb' },
    cost: { coin: 'gp', value: 2500 },
    rarity: 'uncommon',
    requiresAttunement: false,
    description:
      'Silent movement. Advantage on Stealth checks relying on sound'
  },
  {
    id: 'boots-of-speed',
    name: 'Boots of Speed',
    slot: 'boots',
    weight: { value: 1, unit: 'lb' },
    cost: { coin: 'gp', value: 4000 },
    rarity: 'rare',
    requiresAttunement: true,
    description:
      'Bonus action: double speed for 10 minutes (3/day)'
  },

  // GLOVES / BRACERS
  {
    id: 'gauntlets-of-ogre-power',
    name: 'Gauntlets of Ogre Power',
    slot: 'gloves',
    weight: { value: 1, unit: 'lb' },
    cost: { coin: 'gp', value: 8000 },
    rarity: 'uncommon',
    requiresAttunement: true,
    description: 'Strength becomes 19 while worn',
    effects: [
      { kind: 'modifier', target: 'ability_score.str', mode: 'set', value: 19 }
    ]
  },
  {
    id: 'bracers-of-defense',
    name: 'Bracers of Defense',
    slot: 'gloves',
    weight: { value: 1, unit: 'lb' },
    cost: { coin: 'gp', value: 6000 },
    rarity: 'rare',
    requiresAttunement: true,
    bonus: 2,
    description:
      '+2 AC while not wearing armor or using a shield',
    effects: [
      { kind: 'bonus', target: 'armor_class', value: 2 }
    ]
  },
  // BELTS
  {
    id: 'belt-of-giant-strength',
    name: 'Belt of Giant Strength',
    slot: 'belt',
    weight: { value: 1, unit: 'lb' },
    cost: { coin: 'gp', value: 24000 },
    rarity: 'very-rare',
    requiresAttunement: true,
    description:
      'Strength score becomes 23 (Hill Giant). Variants exist for higher STR (Frost: 25, Fire/Cloud: 27, Storm: 29)',
    effects: [
      { kind: 'modifier', target: 'ability_score.str', mode: 'set', value: 23 },
      {
        kind: 'note',
        text: 'Variants: Frost 25, Fire/Cloud 27, Storm 29 (implement as separate items or configurable variant).'
      }
    ]
  },

  // AMULETS
  {
    id: 'amulet-of-health',
    name: 'Amulet of Health',
    slot: 'amulet',
    weight: { value: 1, unit: 'lb' },
    cost: { coin: 'gp', value: 8000 },
    rarity: 'rare',
    requiresAttunement: true,
    description: 'Constitution score becomes 19 while wearing this amulet',
    effects: [{ kind: 'modifier', target: 'ability_score.con', mode: 'set', value: 19 }]
  },

  // HELMS
  {
    id: 'helm-of-brilliance',
    name: 'Helm of Brilliance',
    slot: 'helm',
    weight: { value: 3, unit: 'lb' },
    cost: undefined,
    rarity: 'very-rare',
    requiresAttunement: true,
    description:
      'Studded with gems that allow casting fire-based spells. Gems are consumed on use. Resistance to fire damage',
    effects: [
      { kind: 'modifier', target: 'resistance', mode: 'add', value: 'fire' },
      {
        kind: 'note',
        text: 'Gem-powered spellcasting not yet modeled (charges by gem type). Track as per-item inventory/charges in a later pass.'
      }
    ]
  },

  // WONDROUS ITEMS
  {
    id: 'bag-of-holding',
    name: 'Bag of Holding',
    slot: 'wondrous',
    weight: { value: 15, unit: 'lb' },
    cost: { coin: 'gp', value: 4000 },
    rarity: 'uncommon',
    requiresAttunement: false,
    description:
      'Interior is larger than outside. Holds up to 500 lb. / 64 cu. ft. Always weighs 15 lb.',
    effects: [
      { kind: 'note', text: 'Inventory rule: capacity 500 lb / 64 cu ft; fixed weight 15 lb.' }
    ]
  },
  {
    id: 'portable-hole',
    name: 'Portable Hole',
    slot: 'wondrous',
    weight: { value: 0, unit: 'lb' },
    cost: { coin: 'gp', value: 20000 },
    rarity: 'rare',
    requiresAttunement: false,
    description:
      '6-foot diameter, 10-foot deep extradimensional hole. Putting it inside a Bag of Holding destroys both and opens a gate to the Astral Plane',
    effects: [
      { kind: 'note', text: 'Inventory rule: 6 ft diameter, 10 ft deep extradimensional space.' },
      { kind: 'note', text: 'Edge case: if placed in Bag of Holding, both destroyed; astral gate event.' }
    ]
  },
  {
    id: 'decanter-of-endless-water',
    name: 'Decanter of Endless Water',
    slot: 'wondrous',
    weight: { value: 2, unit: 'lb' },
    cost: { coin: 'gp', value: 135000 },
    rarity: 'uncommon',
    requiresAttunement: false,
    description:
      'Speak command word to produce 1 gallon (stream), 5 gallons (fountain), or 30 gallons/round (geyser)',
    effects: [
      { kind: 'note', text: 'Utility item: produces water in modes (stream/fountain/geyser). Model as item actions later.' }
    ]
  },
  {
    id: 'immovable-rod',
    name: 'Immovable Rod',
    slot: 'wondrous',
    weight: { value: 2, unit: 'lb' },
    cost: { coin: 'gp', value: 5000 },
    rarity: 'uncommon',
    requiresAttunement: false,
    description:
      'Press button to fix the rod in place. Holds up to 8,000 lb. DC 30 Strength check to move it',
    effects: [{ kind: 'note', text: 'World interaction: fixed point; supports 8,000 lb; DC 30 STR to move.' }]
  },

  // WANDS
  {
    id: 'wand-of-magic-missiles',
    name: 'Wand of Magic Missiles',
    slot: 'wand',
    weight: { value: 1, unit: 'lb' },
    cost: { coin: 'gp', value: 8000 },
    rarity: 'uncommon',
    requiresAttunement: false,
    charges: 7,
    description:
      'Expend 1–3 charges to cast Magic Missile. If last charge used, roll d20 — on a 1 the wand crumbles',
    effects: [
      { kind: 'note', text: 'Item action: cast Magic Missile spending 1–3 charges (spell modeling needed).' },
      { kind: 'note', text: 'Recharge: 1d6+1 at dawn (model recharge rules later).' },
      { kind: 'note', text: 'On last charge: d20; on 1, wand crumbles.' }
    ]
  },
  {
    id: 'wand-of-fireballs',
    name: 'Wand of Fireballs',
    slot: 'wand',
    weight: { value: 1, unit: 'lb' },
    cost: { coin: 'gp', value: 32000 },
    rarity: 'rare',
    requiresAttunement: true,
    description:
      'Spellcaster attunement. Expend 1–3 charges to cast Fireball (save DC 15). Extra charges increase level. Crumbles on a 1 if last charge used',
    charges: 7,
    effects: [
      { kind: 'note', text: 'Attunement restriction: spellcaster (store as a rule/validator on item later).' },
      { kind: 'note', text: 'Item action: cast Fireball DC 15 spending 1–3 charges (spell modeling needed).' },
      { kind: 'note', text: 'Recharge: 1d6+1 at dawn (model recharge rules later).' },
      { kind: 'note', text: 'On last charge: d20; on 1, wand crumbles.' }
    ]
  },

  // STAVES
  {
    id: 'staff-of-healing',
    name: 'Staff of Healing',
    slot: 'staff',
    weight: { value: 4, unit: 'lb' },
    cost: { coin: 'gp', value: 13000 },
    rarity: 'rare',
    requiresAttunement: true,
    charges: 10,
    description:
      'Bard/cleric/druid attunement. Expend charges to cast Cure Wounds (1), Lesser Restoration (2), or Mass Cure Wounds (5)',
    effects: [
      { kind: 'note', text: 'Attunement restriction: bard/cleric/druid (store as validator later).' },
      { kind: 'note', text: 'Recharge: 1d6+4 at dawn (model recharge rules later).' },
      { kind: 'note', text: 'Item actions: Cure Wounds(1), Lesser Restoration(2), Mass Cure Wounds(5) (spell modeling needed).' }
    ]
  },
  {
    id: 'staff-of-power',
    name: 'Staff of Power',
    slot: 'staff',
    weight: { value: 4, unit: 'lb' },
    cost: undefined,
    rarity: 'very-rare',
    requiresAttunement: true,
    charges: 20,
    bonus: 2,
    description:
      '+2 to AC, saving throws, and spell attack rolls. Expend charges for spells. Retributive strike option',
    effects: [
      { kind: 'bonus', target: 'armor_class', value: 2 },
      { kind: 'bonus', target: 'saving_throws', value: 2 },
      { kind: 'bonus', target: 'spell_attack', value: 2 },
      { kind: 'note', text: 'Recharge: 2d8+4 at dawn (model recharge rules later).' },
      { kind: 'note', text: 'Retributive Strike not yet modeled (special destruction effect).' }
    ]
  },

  // SCROLLS
  {
    id: 'spell-scroll-1st',
    name: 'Spell Scroll (1st Level)',
    slot: 'scroll',
    weight: { value: 0, unit: 'lb' },
    consumable: true,
    cost: { coin: 'gp', value: 75 },
    rarity: 'common',
    requiresAttunement: false,
    description:
      'Contains one 1st-level spell. If on your class list, you can cast it. Save DC 13, attack bonus +5',
    effects: [
      { kind: 'note', text: 'Consumable. Spell payload not yet modeled (store spellId later).' },
      { kind: 'note', text: 'If cast via scroll: DC 13, spell attack +5 (5e baseline).' }
    ]
  },
  {
    id: 'spell-scroll-3rd',
    name: 'Spell Scroll (3rd Level)',
    slot: 'scroll',
    weight: { value: 0, unit: 'lb' },
    consumable: true,
    cost: { coin: 'gp', value: 200 },
    rarity: 'uncommon',
    requiresAttunement: false,
    description: 'Contains one 3rd-level spell. Save DC 15, attack bonus +7',
    effects: [
      { kind: 'note', text: 'Consumable. Spell payload not yet modeled (store spellId later).' },
      { kind: 'note', text: 'If cast via scroll: DC 15, spell attack +7 (5e baseline).' }
    ]
  }
]