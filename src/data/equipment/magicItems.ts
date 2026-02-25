export type MagicItemSlot =
  | 'weapon'
  | 'armor'
  | 'shield'
  | 'potion'
  | 'ring'
  | 'cloak'
  | 'boots'
  | 'gloves'
  | 'helm'
  | 'belt'
  | 'amulet'
  | 'helm'
  | 'wand'
  | 'staff'
  | 'rod'
  | 'scroll'
  | 'wondrous'

export type MagicItemEffect =
  | { kind: 'bonus'; target: string; value: number }
  | { kind: 'modifier'; target: string; mode: 'add' | 'mul' | 'set'; value: any }
  | { kind: 'note'; text: string };

export type MagicItemRarity =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'very-rare'
  | 'legendary'
  | 'artifact';

export type MagicItemCore = {
  id: string;
  name: string;

  slot: MagicItemSlot;
  weight?: string;

  // “derived”/composition
  baseItemId?: string;

  consumable?: boolean;

  // flattened “default ruleset” fields (whatever you treat as canonical for now)
  cost?: string;
  rarity?: MagicItemRarity;
  requiresAttunement?: boolean;

  bonus?: number;
  charges?: number;

  effect?: string;
  effects?: MagicItemEffect[];

  // legacy / alt-systems metadata (optional but handy to keep)
  enhancementLevel?: number;
  xpValue?: number;
  gpValue?: number;
};

export type MagicItem = MagicItemCore;

export const magicItems: MagicItem[] = [
  {
    id: 'flame-tongue',
    name: 'Flame Tongue',
    slot: 'weapon',
    weight: '—',
    cost: '5,000 gp',
    rarity: 'rare',
    requiresAttunement: true,
    effect:
      'Bonus action to ignite. Deals +2d6 fire damage on hit while active',
    effects: [
      { kind: 'modifier', target: 'damage', mode: 'add', value: { dice: '2d6', type: 'fire' } }
    ]
  },
  {
    id: 'frost-brand',
    name: 'Frost Brand',
    slot: 'weapon',
    weight: '—',
    cost: '22,000 gp',
    rarity: 'very-rare',
    requiresAttunement: true,
    bonus: 3,
    effect:
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
    weight: '0.5 lb.',
    consumable: true,
    cost: '50 gp',
    rarity: 'common',
    effect: 'Regain 2d4 + 2 hit points',
    effects: [
      { kind: 'modifier', target: 'hp', mode: 'add', value: { dice: '2d4+2' } }
    ]
  },
  {
    id: 'potion-of-invisibility',
    name: 'Potion of Invisibility',
    slot: 'potion',
    weight: '0.5 lb.',
    consumable: true,
    cost: '180 gp',
    rarity: 'very-rare',
    effect:
      'Invisible for 1 hour. Ends early if you attack or cast a spell'
  },
  {
    id: 'potion-of-speed',
    name: 'Potion of Speed',
    slot: 'potion',
    weight: '0.5 lb.',
    consumable: true,
    cost: '400 gp',
    rarity: 'very-rare',
    effect:
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
    weight: '—',
    cost: '3,500 gp',
    rarity: 'rare',
    requiresAttunement: true,
    bonus: 1,
    effect: '+1 bonus to AC and saving throws',
    effects: [
      { kind: 'bonus', target: 'armor_class', value: 1 },
      { kind: 'bonus', target: 'saving_throws', value: 1 }
    ]
  },
  {
    id: 'ring-of-invisibility',
    name: 'Ring of Invisibility',
    slot: 'ring',
    weight: '—',
    cost: '50,000 gp',
    rarity: 'legendary',
    requiresAttunement: true,
    effect:
      'Turn invisible as an action. Ends when you attack or cast a spell'
  },
  {
    id: 'ring-of-spell-storing',
    name: 'Ring of Spell Storing',
    slot: 'ring',
    weight: '—',
    cost: '24,000 gp',
    rarity: 'rare',
    requiresAttunement: true,
    charges: 5,
    effect:
      'Stores up to 5 levels of spells. Wearer can cast stored spells'
  },

  // CLOAKS
  {
    id: 'cloak-of-protection',
    name: 'Cloak of Protection',
    slot: 'cloak',
    weight: '1 lb.',
    cost: '3,500 gp',
    rarity: 'uncommon',
    requiresAttunement: true,
    bonus: 1,
    effect: '+1 bonus to AC and saving throws',
    effects: [
      { kind: 'bonus', target: 'armor_class', value: 1 },
      { kind: 'bonus', target: 'saving_throws', value: 1 }
    ]
  },
  {
    id: 'cloak-of-elvenkind',
    name: 'Cloak of Elvenkind',
    slot: 'cloak',
    weight: '1 lb.',
    cost: '5,000 gp',
    rarity: 'uncommon',
    requiresAttunement: true,
    effect:
      'Advantage on Stealth checks. Disadvantage for others trying to see you'
  },

  // BOOTS
  {
    id: 'boots-of-elvenkind',
    name: 'Boots of Elvenkind',
    slot: 'boots',
    weight: '1 lb.',
    cost: '2,500 gp',
    rarity: 'uncommon',
    requiresAttunement: false,
    effect:
      'Silent movement. Advantage on Stealth checks relying on sound'
  },
  {
    id: 'boots-of-speed',
    name: 'Boots of Speed',
    slot: 'boots',
    weight: '1 lb.',
    cost: '4,000 gp',
    rarity: 'rare',
    requiresAttunement: true,
    effect:
      'Bonus action: double speed for 10 minutes (3/day)'
  },

  // GLOVES / BRACERS
  {
    id: 'gauntlets-of-ogre-power',
    name: 'Gauntlets of Ogre Power',
    slot: 'gloves',
    weight: '1 lb.',
    cost: '8,000 gp',
    rarity: 'uncommon',
    requiresAttunement: true,
    effect: 'Strength becomes 19 while worn',
    effects: [
      { kind: 'modifier', target: 'ability_score.str', mode: 'set', value: 19 }
    ]
  },
  {
    id: 'bracers-of-defense',
    name: 'Bracers of Defense',
    slot: 'gloves',
    weight: '1 lb.',
    cost: '6,000 gp',
    rarity: 'rare',
    requiresAttunement: true,
    bonus: 2,
    effect:
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
    weight: '1 lb.',
    cost: '24,000 gp',
    rarity: 'very-rare',
    requiresAttunement: true,
    effect:
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
    weight: '1 lb.',
    cost: '8,000 gp',
    rarity: 'rare',
    requiresAttunement: true,
    effect: 'Constitution score becomes 19 while wearing this amulet',
    effects: [{ kind: 'modifier', target: 'ability_score.con', mode: 'set', value: 19 }]
  },

  // HELMS
  {
    id: 'helm-of-brilliance',
    name: 'Helm of Brilliance',
    slot: 'helm',
    weight: '3 lb.',
    cost: '—',
    rarity: 'very-rare',
    requiresAttunement: true,
    effect:
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
    weight: '15 lb.',
    cost: '4,000 gp',
    rarity: 'uncommon',
    requiresAttunement: false,
    effect:
      'Interior is larger than outside. Holds up to 500 lb. / 64 cu. ft. Always weighs 15 lb.',
    effects: [
      { kind: 'note', text: 'Inventory rule: capacity 500 lb / 64 cu ft; fixed weight 15 lb.' }
    ]
  },
  {
    id: 'portable-hole',
    name: 'Portable Hole',
    slot: 'wondrous',
    weight: '0 lb.',
    cost: '20,000 gp',
    rarity: 'rare',
    requiresAttunement: false,
    effect:
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
    weight: '2 lb.',
    cost: '135,000 gp',
    rarity: 'uncommon',
    requiresAttunement: false,
    effect:
      'Speak command word to produce 1 gallon (stream), 5 gallons (fountain), or 30 gallons/round (geyser)',
    effects: [
      { kind: 'note', text: 'Utility item: produces water in modes (stream/fountain/geyser). Model as item actions later.' }
    ]
  },
  {
    id: 'immovable-rod',
    name: 'Immovable Rod',
    slot: 'wondrous',
    weight: '2 lb.',
    cost: '5,000 gp',
    rarity: 'uncommon',
    requiresAttunement: false,
    effect:
      'Press button to fix the rod in place. Holds up to 8,000 lb. DC 30 Strength check to move it',
    effects: [{ kind: 'note', text: 'World interaction: fixed point; supports 8,000 lb; DC 30 STR to move.' }]
  },

  // WANDS
  {
    id: 'wand-of-magic-missiles',
    name: 'Wand of Magic Missiles',
    slot: 'wand',
    weight: '1 lb.',
    cost: '8,000 gp',
    rarity: 'uncommon',
    requiresAttunement: false,
    charges: 7,
    effect:
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
    weight: '1 lb.',
    cost: '32,000 gp',
    rarity: 'rare',
    requiresAttunement: true,
    effect:
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
    weight: '4 lb.',
    cost: '13,000 gp',
    rarity: 'rare',
    requiresAttunement: true,
    charges: 10,
    effect:
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
    weight: '4 lb.',
    cost: '—',
    rarity: 'very-rare',
    requiresAttunement: true,
    charges: 20,
    bonus: 2,
    effect:
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
    weight: '0 lb.',
    consumable: true,
    cost: '75 gp',
    rarity: 'common',
    requiresAttunement: false,
    effect:
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
    weight: '0 lb.',
    consumable: true,
    cost: '200 gp',
    rarity: 'uncommon',
    requiresAttunement: false,
    effect: 'Contains one 3rd-level spell. Save DC 15, attack bonus +7',
    effects: [
      { kind: 'note', text: 'Consumable. Spell payload not yet modeled (store spellId later).' },
      { kind: 'note', text: 'If cast via scroll: DC 15, spell attack +7 (5e baseline).' }
    ]
  }
]