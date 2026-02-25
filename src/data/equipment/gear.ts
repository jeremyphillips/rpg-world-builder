export type GearCategory =
  | 'packs-containers'
  | 'lighting-fuel'
  | 'rope-climbing'
  | 'tools-utility'
  | 'adventuring-utility'
  | 'writing-knowledge'
  | 'kits-focuses'
  | 'rations-consumables'
  | 'clothing'
  | 'misc-tools'
  | 'cases-quivers'
  | 'tent-camp'
  | 'luxury-special'
  | 'potions-alchemical';

export type GearItem = {
  id: string;
  name: string;
  category: GearCategory;
  weight?: string;

  cost?: string;

  // Common optional fields
  note?: string;
  properties?: string[];

  // Containers / storage
  capacity?: string;

  // Lighting
  range?: string;
  duration?: string;

  // Rope / climbing (5e-ish where applicable)
  hp?: number;
  burstDC?: number;

  // Kits / consumables
  charges?: number;

  // Writing
  pages?: number;

  // Rations
  type?: string;

  // Potions / alchemical
  effect?: string;

  // Focus / proficiency
  proficiency?: string;

  // Focus kind (spellcasting focus, implement, etc.)
  kind?: string;
};

export const gear: GearItem[] = [
  // ——— PACKS & CONTAINERS ———
  {
    id: 'backpack',
    name: 'Backpack',
    category: 'packs-containers',
    weight: '5 lb.',
    cost: '2 gp',
    capacity: '1 cubic foot / 30 pounds of gear',
  },
  {
    id: 'barrel',
    name: 'Barrel',
    category: 'packs-containers',
    weight: '70 lb.',
    cost: '2 gp',
    capacity: '40 gallons liquid',
  },
  {
    id: 'basket',
    name: 'Basket',
    category: 'packs-containers',
    weight: '2 lb.',
    cost: '4 sp',
    capacity: '2 cubic feet / 40 lbs',
  },
  {
    id: 'bottle-glass',
    name: 'Bottle, Glass',
    category: 'packs-containers',
    weight: '2 lb.',
    cost: '2 gp',
  },
  {
    id: 'bucket',
    name: 'Bucket',
    category: 'packs-containers',
    weight: '2 lb.',
    cost: '5 cp',
    capacity: '3 gallons',
  },
  {
    id: 'chest-small',
    name: 'Chest, Small',
    category: 'packs-containers',
    weight: '25 lb.',
    cost: '5 gp',
    capacity: '12 cubic feet / 300 lbs',
  },
  {
    id: 'pouch-belt',
    name: 'Pouch, Belt',
    category: 'packs-containers',
    weight: '0.5 lb.',
    cost: '5 sp',
    capacity: '1/5 cubic foot / 6 lbs (e.g. coins)',
  },
  {
    id: 'sack',
    name: 'Sack',
    category: 'packs-containers',
    weight: '0.5 lb.',
    cost: '1 cp',
    capacity: '1 cubic foot / 30 lbs',
  },
  {
    id: 'waterskin',
    name: 'Waterskin',
    category: 'packs-containers',
    weight: '5 lb. (full)',
    cost: '2 sp',
    capacity: '4 pints',
  },

  // ——— LIGHTING & FUEL ———
  {
    id: 'candle',
    name: 'Candle',
    category: 'lighting-fuel',
    weight: '0 lb.',
    cost: '1 cp',
    duration: '1 hour',
    note: 'Dim light 5-foot radius',
  },
  {
    id: 'lantern-bullseye',
    name: 'Lantern, Bullseye',
    category: 'lighting-fuel',
    weight: '2 lb.',
    cost: '10 gp',
    range: '60-foot cone bright, 60 ft dim',
    duration: '6 hours per pint oil',
  },
  {
    id: 'lantern-hooded',
    name: 'Lantern, Hooded',
    category: 'lighting-fuel',
    weight: '2 lb.',
    cost: '5 gp',
    range: '30-foot radius',
    duration: '6 hours per pint oil',
  },
  {
    id: 'lamp',
    name: 'Lamp',
    category: 'lighting-fuel',
    weight: '1 lb.',
    cost: '5 sp',
    range: '15-foot radius',
    duration: '6 hours per pint oil',
  },
  {
    id: 'oil-flask',
    name: 'Oil (1 pint flask)',
    category: 'lighting-fuel',
    weight: '1 lb.',
    cost: '1 sp',
    note: 'Fuel for lamp/lantern; can be lit as flask for 1d4 fire damage',
  },
  {
    id: 'torch',
    name: 'Torch',
    category: 'lighting-fuel',
    weight: '1 lb.',
    cost: '1 cp',
    range: '20 ft bright / 20 ft dim',
    duration: '1 hour',
  },
  {
    id: 'tinderbox',
    name: 'Tinderbox',
    category: 'lighting-fuel',
    weight: '1 lb.',
    cost: '5 sp',
    note: 'Flint, steel, tinder; lights torch/lamp in 1 action',
  },

  // ——— ROPE & CLIMBING ———
  {
    id: 'rope-hempen',
    name: 'Rope, Hempen (50 ft)',
    category: 'rope-climbing',
    weight: '10 lb.',
    cost: '1 gp',
    hp: 2,
    burstDC: 17,
    note: 'Can support 3,000 lbs',
  },
  {
    id: 'rope-silk',
    name: 'Rope, Silk (50 ft)',
    category: 'rope-climbing',
    weight: '5 lb.',
    cost: '10 gp',
    hp: 2,
    burstDC: 17,
    note: 'Can support 3,000 lbs; lighter',
  },
  {
    id: 'grappling-hook',
    name: 'Grappling Hook',
    category: 'rope-climbing',
    weight: '4 lb.',
    cost: '2 gp',
  },
  {
    id: 'block-and-tackle',
    name: 'Block and Tackle',
    category: 'rope-climbing',
    weight: '5 lb.',
    cost: '1 gp',
    note: 'Multiply lifting power by 4',
  },
  {
    id: 'ladder-10ft',
    name: 'Ladder (10 ft)',
    category: 'rope-climbing',
    weight: '25 lb.',
    cost: '1 sp',
  },
  {
    id: 'piton',
    name: 'Piton',
    category: 'rope-climbing',
    weight: '0.25 lb.',
    cost: '5 cp',
    note: "Used with climber's kit or rope",
  },
  {
    id: 'climbers-kit',
    name: "Climber's Kit",
    category: 'rope-climbing',
    weight: '12 lb.',
    cost: '25 gp',
    note: 'Pitons, rope, harness; climb with hands free, +10 to checks',
  },

  // ——— TOOLS & UTILITY ———
  {
    id: 'crowbar',
    name: 'Crowbar',
    category: 'tools-utility',
    weight: '5 lb.',
    cost: '2 gp',
    properties: ['advantage on Strength checks to open'],
  },
  {
    id: 'hammer',
    name: 'Hammer',
    category: 'tools-utility',
    weight: '3 lb.',
    cost: '2 gp',
  },
  {
    id: 'hammer-sledge',
    name: 'Hammer, Sledge',
    category: 'tools-utility',
    weight: '10 lb.',
    cost: '2 gp',
  },
  {
    id: 'pick-miners',
    name: "Pick, Miner's",
    category: 'tools-utility',
    weight: '10 lb.',
    cost: '2 gp',
    note: 'Double as weapon 1d8 piercing',
  },
  {
    id: 'shovel',
    name: 'Shovel',
    category: 'tools-utility',
    weight: '5 lb.',
    cost: '2 gp',
  },
  {
    id: 'chain-10ft',
    name: 'Chain (10 ft)',
    category: 'tools-utility',
    weight: '10 lb.',
    cost: '5 gp',
    note: 'HP 10, can be broken DC 20',
  },
  {
    id: 'manacles',
    name: 'Manacles',
    category: 'tools-utility',
    weight: '6 lb.',
    cost: '2 gp',
    note: 'Restrain; DC 20 to break or pick',
  },
  {
    id: 'lock',
    name: 'Lock',
    category: 'tools-utility',
    weight: '1 lb.',
    cost: '10 gp',
    note: 'DC set by quality; key included',
  },
  {
    id: 'ram-portable',
    name: 'Ram, Portable',
    category: 'tools-utility',
    weight: '35 lb.',
    cost: '4 gp',
    note: '+4 to break wooden doors; 2-handed',
  },

  // ——— ADVENTURING UTILITY ———
  {
    id: 'bedroll',
    name: 'Bedroll',
    category: 'adventuring-utility',
    weight: '7 lb.',
    cost: '1 gp',
  },
  {
    id: 'blanket',
    name: 'Blanket',
    category: 'adventuring-utility',
    weight: '3 lb.',
    cost: '5 sp',
  },
  {
    id: 'bell',
    name: 'Bell',
    category: 'adventuring-utility',
    weight: '0 lb.',
    cost: '1 gp',
  },
  {
    id: 'signal-whistle',
    name: 'Signal Whistle',
    category: 'adventuring-utility',
    weight: '0 lb.',
    cost: '5 cp',
    note: 'Hearable up to 0.5 mile',
  },
  {
    id: 'ball-bearings',
    name: 'Ball Bearings (bag of 1,000)',
    category: 'adventuring-utility',
    weight: '2 lb.',
    cost: '1 gp',
    note: 'DC 10 Dex or fall prone; cover 10-ft square',
  },
  {
    id: 'caltrops',
    name: 'Caltrops (bag of 20)',
    category: 'adventuring-utility',
    weight: '2 lb.',
    cost: '1 gp',
    note: 'DC 15 Dex or 1 damage and speed -10 ft until healed',
  },
  {
    id: 'hunting-trap',
    name: 'Hunting Trap',
    category: 'adventuring-utility',
    weight: '25 lb.',
    cost: '5 gp',
    note: 'DC 13 Dex to escape; 1d4 piercing',
  },
  {
    id: 'mirror-steel',
    name: 'Mirror, Steel',
    category: 'adventuring-utility',
    weight: '0.5 lb.',
    cost: '5 gp',
  },
  {
    id: 'pole-10ft',
    name: 'Pole (10 ft)',
    category: 'adventuring-utility',
    weight: '7 lb.',
    cost: '5 cp',
  },
  {
    id: 'spike-iron',
    name: 'Spike, Iron',
    category: 'adventuring-utility',
    weight: '0.5 lb.',
    cost: '1 sp',
  },

  // ——— WRITING & KNOWLEDGE ———
  {
    id: 'book',
    name: 'Book',
    category: 'writing-knowledge',
    weight: '5 lb.',
    cost: '25 gp',
    note: 'Blank or written',
  },
  {
    id: 'spellbook-blank',
    name: 'Spellbook (Blank)',
    category: 'writing-knowledge',
    weight: '3 lb.',
    cost: '50 gp',
    pages: 100,
  },
  {
    id: 'ink-1oz',
    name: 'Ink (1 oz bottle)',
    category: 'writing-knowledge',
    weight: '0 lb.',
    cost: '10 gp',
  },
  {
    id: 'ink-pen',
    name: 'Ink Pen',
    category: 'writing-knowledge',
    weight: '0 lb.',
    cost: '2 cp',
  },
  {
    id: 'paper-one-sheet',
    name: 'Paper (one sheet)',
    category: 'writing-knowledge',
    weight: '0 lb.',
    cost: '2 sp',
  },
  {
    id: 'parchment-one-sheet',
    name: 'Parchment (one sheet)',
    category: 'writing-knowledge',
    weight: '0 lb.',
    cost: '1 sp',
  },
  {
    id: 'sealing-wax',
    name: 'Sealing Wax',
    category: 'writing-knowledge',
    weight: '0 lb.',
    cost: '5 sp',
  },
  {
    id: 'chalk',
    name: 'Chalk (1 piece)',
    category: 'writing-knowledge',
    weight: '0 lb.',
    cost: '1 cp',
  },

  // ——— KITS & FOCUSES ———
  {
    id: 'thieves-tools',
    name: "Thieves' Tools",
    category: 'kits-focuses',
    weight: '1 lb.',
    cost: '25 gp',
    proficiency: "thieves' tools",
    note: 'Required for lock/trap checks',
  },
  {
    id: 'healers-kit',
    name: "Healer's Kit",
    category: 'kits-focuses',
    weight: '3 lb.',
    cost: '5 gp',
    charges: 10,
    note: 'Stabilize dying creature without check',
  },
  {
    id: 'holy-symbol-amulet',
    name: 'Holy Symbol, Amulet',
    category: 'kits-focuses',
    weight: '1 lb.',
    cost: '5 gp',
    type: 'spellcasting focus',
  },
  {
    id: 'holy-symbol-emblem',
    name: 'Holy Symbol, Emblem',
    category: 'kits-focuses',
    weight: '0 lb.',
    cost: '5 gp',
    type: 'spellcasting focus',
  },
  {
    id: 'component-pouch',
    name: 'Component Pouch',
    category: 'kits-focuses',
    weight: '2 lb.',
    cost: '25 gp',
    note: 'Replaces non-consumed material components',
  },
  {
    id: 'arcane-focus-crystal',
    name: 'Arcane Focus, Crystal',
    category: 'kits-focuses',
    weight: '1 lb.',
    cost: '10 gp',
    type: 'spellcasting focus',
  },
  {
    id: 'arcane-focus-orb',
    name: 'Arcane Focus, Orb',
    category: 'kits-focuses',
    weight: '3 lb.',
    cost: '20 gp',
    type: 'spellcasting focus',
  },
  {
    id: 'arcane-focus-rod',
    name: 'Arcane Focus, Rod',
    category: 'kits-focuses',
    weight: '2 lb.',
    cost: '10 gp',
    type: 'spellcasting focus',
  },
  {
    id: 'arcane-focus-staff',
    name: 'Arcane Focus, Staff',
    category: 'kits-focuses',
    weight: '4 lb.',
    cost: '5 gp',
    type: 'spellcasting focus',
  },
  {
    id: 'arcane-focus-wand',
    name: 'Arcane Focus, Wand',
    category: 'kits-focuses',
    weight: '1 lb.',
    cost: '10 gp',
    type: 'spellcasting focus',
  },
  {
    id: 'druidic-focus-sprig',
    name: 'Druidic Focus, Sprig of Mistletoe',
    category: 'kits-focuses',
    weight: '0 lb.',
    cost: '1 gp',
    type: 'spellcasting focus',
  },
  {
    id: 'druidic-focus-totem',
    name: 'Druidic Focus, Totem',
    category: 'kits-focuses',
    weight: '0 lb.',
    cost: '1 gp',
    type: 'spellcasting focus',
  },
  {
    id: 'druidic-focus-wooden-staff',
    name: 'Druidic Focus, Wooden Staff',
    category: 'kits-focuses',
    weight: '4 lb.',
    cost: '5 gp',
    type: 'spellcasting focus',
  },
  {
    id: 'druidic-focus-yew-wand',
    name: 'Druidic Focus, Yew Wand',
    category: 'kits-focuses',
    weight: '1 lb.',
    cost: '1 gp',
    type: 'spellcasting focus',
  },

  // ——— RATIONS & CONSUMABLES ———
  {
    id: 'rations-standard',
    name: 'Rations (1 day, standard)',
    category: 'rations-consumables',
    weight: '2 lb.',
    cost: '5 sp',
    type: 'standard',
    note: '1 day',
  },
  {
    id: 'rations-iron',
    name: 'Rations (1 day, iron)',
    category: 'rations-consumables',
    weight: '1 lb.',
    cost: '5 sp',
    type: 'preserved',
    note: 'Preserved; 1 day',
  },
  {
    id: 'mess-kit',
    name: 'Mess Kit',
    category: 'rations-consumables',
    weight: '1 lb.',
    cost: '2 sp',
  },
  {
    id: 'pot-iron',
    name: 'Pot, Iron',
    category: 'rations-consumables',
    weight: '10 lb.',
    cost: '2 gp',
  },
  {
    id: 'flask-tankard',
    name: 'Flask or Tankard',
    category: 'rations-consumables',
    weight: '1 lb.',
    cost: '2 cp',
  },
  {
    id: 'jug-pitcher',
    name: 'Jug or Pitcher',
    category: 'rations-consumables',
    weight: '4 lb.',
    cost: '2 cp',
    capacity: '1 gallon',
  },

  // ——— CLOTHING ———
  {
    id: 'clothes-common',
    name: 'Clothes, Common',
    category: 'clothing',
    weight: '3 lb.',
    cost: '5 sp',
  },
  {
    id: 'clothes-costume',
    name: 'Clothes, Costume',
    category: 'clothing',
    weight: '4 lb.',
    cost: '5 gp',
  },
  {
    id: 'clothes-fine',
    name: 'Clothes, Fine',
    category: 'clothing',
    weight: '6 lb.',
    cost: '15 gp',
  },
  {
    id: 'clothes-travelers',
    name: "Clothes, Traveler's",
    category: 'clothing',
    weight: '4 lb.',
    cost: '2 gp',
  },
  {
    id: 'robe',
    name: 'Robe',
    category: 'clothing',
    weight: '4 lb.',
    cost: '1 gp',
  },
  {
    id: 'signet-ring',
    name: 'Signet Ring',
    category: 'clothing',
    weight: '0 lb.',
    cost: '5 gp',
  },

  // ——— MISC TOOLS ———
  {
    id: 'abacus',
    name: 'Abacus',
    category: 'misc-tools',
    weight: '2 lb.',
    cost: '2 gp',
  },
  {
    id: 'fishing-tackle',
    name: 'Fishing Tackle',
    category: 'misc-tools',
    weight: '4 lb.',
    cost: '1 gp',
    note: 'Enough for one person 24 hours',
  },
  {
    id: 'magnifying-glass',
    name: 'Magnifying Glass',
    category: 'misc-tools',
    weight: '0 lb.',
    cost: '100 gp',
    note: 'Light to start fire; +2 Investigation small details',
  },
  {
    id: 'scale-merchants',
    name: "Scale, Merchant's",
    category: 'misc-tools',
    weight: '3 lb.',
    cost: '5 gp',
    note: 'Weigh coins/gems',
  },
  {
    id: 'soap',
    name: 'Soap',
    category: 'misc-tools',
    weight: '0 lb.',
    cost: '2 cp',
  },
  {
    id: 'whetstone',
    name: 'Whetstone',
    category: 'misc-tools',
    weight: '1 lb.',
    cost: '1 cp',
    note: 'Sharpen blade; 20 uses',
  },

  // ——— CASES & QUIVERS ———
  {
    id: 'case-crossbow-bolt',
    name: 'Case, Crossbow Bolt',
    category: 'cases-quivers',
    weight: '1 lb.',
    cost: '1 gp',
    capacity: '20 bolts',
  },
  {
    id: 'case-map-scroll',
    name: 'Case, Map or Scroll',
    category: 'cases-quivers',
    weight: '1 lb.',
    cost: '1 gp',
    capacity: 'Scrolls or maps',
  },
  {
    id: 'quiver',
    name: 'Quiver',
    category: 'cases-quivers',
    weight: '1 lb.',
    cost: '1 gp',
    capacity: '20 arrows',
  },

  // ——— TENT & CAMP ———
  {
    id: 'tent-two-person',
    name: 'Tent (two-person)',
    category: 'tent-camp',
    weight: '20 lb.',
    cost: '2 gp',
  },

  // ——— LUXURY & SPECIAL ———
  {
    id: 'spyglass',
    name: 'Spyglass',
    category: 'luxury-special',
    weight: '1 lb.',
    cost: '1000 gp',
    properties: ['magnification'],
    note: 'Distant objects x2',
  },
  {
    id: 'hourglass',
    name: 'Hourglass',
    category: 'luxury-special',
    weight: '1 lb.',
    cost: '25 gp',
  },
  {
    id: 'perfume-vial',
    name: 'Perfume (vial)',
    category: 'luxury-special',
    weight: '0 lb.',
    cost: '5 gp',
  },

  // ——— POTIONS & ALCHEMICAL ———
  {
    id: 'acid-vial',
    name: 'Acid (vial)',
    category: 'potions-alchemical',
    weight: '1 lb.',
    cost: '25 gp',
    note: '2d6 acid damage; throw or splash',
  },
  {
    id: 'alchemists-fire',
    name: "Alchemist's Fire (flask)",
    category: 'potions-alchemical',
    weight: '1 lb.',
    cost: '50 gp',
    note: '1d4 fire; ongoing 1d4 until DC 10 Dex extinguish',
  },
  {
    id: 'antitoxin',
    name: 'Antitoxin (vial)',
    category: 'potions-alchemical',
    weight: '0 lb.',
    cost: '50 gp',
    note: 'Advantage on saves vs poison for 1 hour',
  },
  {
    id: 'potion-healing',
    name: 'Potion of Healing',
    category: 'potions-alchemical',
    weight: '0.5 lb.',
    cost: '50 gp',
    effect: '2d4 + 2 HP',
  },
  {
    id: 'vial',
    name: 'Vial',
    category: 'potions-alchemical',
    weight: '0 lb.',
    cost: '1 gp',
    capacity: '4 oz',
  },
] 