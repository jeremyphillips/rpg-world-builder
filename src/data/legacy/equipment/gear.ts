import type { GearItem } from './gear.types'

export const gear: readonly GearItem[] = [
  // ——— PACKS & CONTAINERS ———
  {
    id: 'backpack',
    name: 'Backpack',
    weight: '5 lb.',
    category: 'packs-containers',
    editionData: [
      { edition: '5e', cost: '2 gp', capacity: '1 cubic foot / 30 pounds of gear' },
      { edition: '2e', cost: '2 gp', capacity: '30 lbs', note: 'Standard encumbrance applies' },
      { edition: '3e', cost: '2 gp', capacity: '1 cubic foot / 30 lbs' },
      { edition: '4e', cost: '2 gp', capacity: '1 cubic foot / 30 lbs' }
    ]
  },
  {
    id: 'barrel',
    name: 'Barrel',
    weight: '70 lb.',
    category: 'packs-containers',
    editionData: [
      { edition: '5e', cost: '2 gp', capacity: '40 gallons liquid' },
      { edition: '2e', cost: '2 gp', capacity: '40 gallons', note: 'Empty weight 70 lbs' },
      { edition: '3e', cost: '2 gp', capacity: '40 gallons' },
      { edition: '4e', cost: '2 gp', capacity: '40 gallons' }
    ]
  },
  {
    id: 'basket',
    name: 'Basket',
    weight: '2 lb.',
    category: 'packs-containers',
    editionData: [
      { edition: '5e', cost: '4 sp', capacity: '2 cubic feet / 40 lbs' },
      { edition: '2e', cost: '4 sp', capacity: '40 lbs' },
      { edition: '3e', cost: '4 sp', capacity: '2 cubic feet / 40 lbs' },
      { edition: '4e', cost: '4 sp', capacity: '40 lbs' }
    ]
  },
  {
    id: 'bottle-glass',
    name: 'Bottle, Glass',
    weight: '2 lb.',
    category: 'packs-containers',
    editionData: [
      { edition: '5e', cost: '2 gp' },
      { edition: '2e', cost: '2 gp', note: 'Holds 1.5 pints' },
      { edition: '3e', cost: '2 gp' },
      { edition: '4e', cost: '2 gp' }
    ]
  },
  {
    id: 'bucket',
    name: 'Bucket',
    weight: '2 lb.',
    category: 'packs-containers',
    editionData: [
      { edition: '5e', cost: '5 cp', capacity: '3 gallons' },
      { edition: '2e', cost: '5 cp', capacity: '3 gallons' },
      { edition: '3e', cost: '5 cp', capacity: '3 gallons' },
      { edition: '4e', cost: '5 cp', capacity: '3 gallons' }
    ]
  },
  {
    id: 'chest-small',
    name: 'Chest, Small',
    weight: '25 lb.',
    category: 'packs-containers',
    editionData: [
      { edition: '5e', cost: '5 gp', capacity: '12 cubic feet / 300 lbs' },
      { edition: '2e', cost: '1 gp', capacity: '40 lbs', note: 'Often used for treasure' },
      { edition: '3e', cost: '2 gp', capacity: '2 cubic feet' },
      { edition: '4e', cost: '5 gp', capacity: '12 cubic feet / 300 lbs' }
    ]
  },
  {
    id: 'pouch-belt',
    name: 'Pouch, Belt',
    weight: '0.5 lb.',
    category: 'packs-containers',
    editionData: [
      { edition: '5e', cost: '5 sp', capacity: '1/5 cubic foot / 6 lbs (e.g. coins)' },
      { edition: '2e', cost: '1 sp', capacity: '2 lbs', note: 'Common for spell components' },
      { edition: '3e', cost: '1 gp', capacity: '1/5 cubic foot / 6 lbs' },
      { edition: '4e', cost: '1 gp', capacity: '1/5 cubic foot / 6 lbs' }
    ]
  },
  {
    id: 'sack',
    name: 'Sack',
    weight: '0.5 lb.',
    category: 'packs-containers',
    editionData: [
      { edition: '5e', cost: '1 cp', capacity: '1 cubic foot / 30 lbs' },
      { edition: '2e', cost: '1 cp', capacity: '30 lbs' },
      { edition: '3e', cost: '1 sp', capacity: '1 cubic foot / 30 lbs' },
      { edition: '4e', cost: '1 sp', capacity: '1 cubic foot / 30 lbs' }
    ]
  },
  {
    id: 'waterskin',
    name: 'Waterskin',
    weight: '5 lb. (full)',
    category: 'packs-containers',
    editionData: [
      { edition: '5e', cost: '2 sp', capacity: '4 pints' },
      { edition: '2e', cost: '8 sp', capacity: '1 quart', note: 'Full weight counts for encumbrance' },
      { edition: '3e', cost: '1 gp', capacity: '0.5 gallon' },
      { edition: '4e', cost: '5 sp', capacity: '4 pints' }
    ]
  },

  // ——— LIGHTING & FUEL ———
  {
    id: 'candle',
    name: 'Candle',
    weight: '0 lb.',
    category: 'lighting-fuel',
    editionData: [
      { edition: '5e', cost: '1 cp', duration: '1 hour', note: 'Dim light 5-foot radius' },
      { edition: '2e', cost: '1 cp', duration: '1 hour', note: 'Burns 1 hour; 5 ft radius' },
      { edition: '3e', cost: '1 cp', duration: '1 hour', note: '5-foot radius dim light' },
      { edition: '4e', cost: '1 cp', duration: '1 hour', note: '2-square radius dim light' }
    ]
  },
  {
    id: 'lantern-bullseye',
    name: 'Lantern, Bullseye',
    weight: '2 lb.',
    category: 'lighting-fuel',
    editionData: [
      { edition: '5e', cost: '10 gp', range: '60-foot cone bright, 60 ft dim', duration: '6 hours per pint oil' },
      { edition: '2e', cost: '12 gp', range: '80 ft beam', duration: '6 hours', note: 'Requires oil' },
      { edition: '3e', cost: '12 gp', range: '60-foot cone', duration: '6 hours per pint oil' },
      { edition: '4e', cost: '12 gp', range: '10-square cone bright', duration: '8 hours per pint oil' }
    ]
  },
  {
    id: 'lantern-hooded',
    name: 'Lantern, Hooded',
    weight: '2 lb.',
    category: 'lighting-fuel',
    editionData: [
      { edition: '5e', cost: '5 gp', range: '30-foot radius', duration: '6 hours per pint oil' },
      { edition: '2e', cost: '7 gp', range: '30 ft radius', duration: '6 hours' },
      { edition: '3e', cost: '7 gp', range: '30-foot radius', duration: '6 hours per pint oil' },
      { edition: '4e', cost: '7 gp', range: '6-square radius bright', duration: '8 hours per pint oil' }
    ]
  },
  {
    id: 'lamp',
    name: 'Lamp',
    weight: '1 lb.',
    category: 'lighting-fuel',
    editionData: [
      { edition: '5e', cost: '5 sp', range: '15-foot radius', duration: '6 hours per pint oil' },
      { edition: '2e', cost: '1 gp', range: '15 ft radius', duration: '6 hours' },
      { edition: '3e', cost: '1 sp', range: '15-foot radius', duration: '6 hours per pint oil' },
      { edition: '4e', cost: '1 gp', range: '3-square radius', duration: '8 hours per pint oil' }
    ]
  },
  {
    id: 'oil-flask',
    name: 'Oil (1 pint flask)',
    weight: '1 lb.',
    category: 'lighting-fuel',
    editionData: [
      { edition: '5e', cost: '1 sp', note: 'Fuel for lamp/lantern; can be lit as flask for 1d4 fire damage' },
      { edition: '2e', cost: '6 sp', note: 'Essential for lamps; expensive in 2e economy' },
      { edition: '3e', cost: '1 sp', note: 'Fuel for lanterns; splash weapon for 1d6 fire damage' },
      { edition: '4e', cost: '1 sp', note: 'Fuel for lanterns and lamps' }
    ]
  },
  {
    id: 'torch',
    name: 'Torch',
    weight: '1 lb.',
    category: 'lighting-fuel',
    editionData: [
      { edition: '5e', cost: '1 cp', range: '20 ft bright / 20 ft dim', duration: '1 hour' },
      { edition: '2e', cost: '1 cp', range: '15 ft radius', duration: '30 min', note: 'Shorter burn in 2e' },
      { edition: '3e', cost: '1 cp', range: '20-foot radius', duration: '1 hour' },
      { edition: '4e', cost: '1 cp', range: '5-square radius bright', duration: '1 hour' }
    ]
  },
  {
    id: 'tinderbox',
    name: 'Tinderbox',
    weight: '1 lb.',
    category: 'lighting-fuel',
    editionData: [
      { edition: '5e', cost: '5 sp', note: 'Flint, steel, tinder; lights torch/lamp in 1 action' },
      { edition: '2e', cost: '5 sp', note: 'Required to light fires; 1 turn to light' },
      { edition: '3e', cost: '1 gp', note: 'Flint and steel; full-round action to light' },
      { edition: '4e', cost: '1 gp', note: 'Standard action to light a fire' }
    ]
  },

  // ——— ROPE & CLIMBING ———
  {
    id: 'rope-hempen',
    name: 'Rope, Hempen (50 ft)',
    weight: '10 lb.',
    category: 'rope-climbing',
    editionData: [
      { edition: '5e', cost: '1 gp', hp: 2, burstDC: 17, note: 'Can support 3,000 lbs' },
      { edition: '2e', cost: '1 gp', strength: '1,500 lbs test', note: 'Breakage by weight' },
      { edition: '3e', cost: '1 gp', hp: 2, note: 'Hardness 0; 2 HP; break DC 23' },
      { edition: '4e', cost: '1 gp', note: 'DC 10 Athletics to climb' }
    ]
  },
  {
    id: 'rope-silk',
    name: 'Rope, Silk (50 ft)',
    weight: '5 lb.',
    category: 'rope-climbing',
    editionData: [
      { edition: '5e', cost: '10 gp', hp: 2, burstDC: 17, note: 'Can support 3,000 lbs; lighter' },
      { edition: '2e', cost: '10 gp', strength: '2,000 lbs test', note: 'Elven rope often stronger' },
      { edition: '3e', cost: '10 gp', hp: 4, note: 'Hardness 0; 4 HP; break DC 24; +2 Use Rope' },
      { edition: '4e', cost: '10 gp', note: 'DC 5 Athletics to climb; lighter than hempen' }
    ]
  },
  {
    id: 'grappling-hook',
    name: 'Grappling Hook',
    weight: '4 lb.',
    category: 'rope-climbing',
    editionData: [
      { edition: '5e', cost: '2 gp' },
      { edition: '2e', cost: '8 sp' },
      { edition: '3e', cost: '1 gp' },
      { edition: '4e', cost: '1 gp' }
    ]
  },
  {
    id: 'block-and-tackle',
    name: 'Block and Tackle',
    weight: '5 lb.',
    category: 'rope-climbing',
    editionData: [
      { edition: '5e', cost: '1 gp', note: 'Multiply lifting power by 4' },
      { edition: '2e', cost: '5 gp', note: 'Lifting heavy loads; pulley system' },
      { edition: '3e', cost: '5 gp', note: '+5 Strength check for lifting' },
      { edition: '4e', cost: '2 gp', note: 'Double effective lifting weight' }
    ]
  },
  {
    id: 'ladder-10ft',
    name: 'Ladder (10 ft)',
    weight: '25 lb.',
    category: 'rope-climbing',
    editionData: [
      { edition: '5e', cost: '1 sp' },
      { edition: '2e', cost: '5 cp' },
      { edition: '3e', cost: '5 cp' },
      { edition: '4e', cost: '1 sp' }
    ]
  },
  {
    id: 'piton',
    name: 'Piton',
    weight: '0.25 lb.',
    category: 'rope-climbing',
    editionData: [
      { edition: '5e', cost: '5 cp', note: 'Used with climber\'s kit or rope' },
      { edition: '2e', cost: '5 cp', note: 'Spike for climbing or doors' },
      { edition: '3e', cost: '1 sp', note: 'Spike for climbing or wedging doors' },
      { edition: '4e', cost: '1 sp', note: 'Climbing spike' }
    ]
  },
  {
    id: 'climbers-kit',
    name: "Climber's Kit",
    weight: '12 lb.',
    category: 'rope-climbing',
    editionData: [
      { edition: '5e', cost: '25 gp', note: 'Pitons, rope, harness; climb with hands free, +10 to checks' },
      { edition: '2e', cost: '80 gp', note: 'Specialized ropes, pitons, harness; required for safe climbing' },
      { edition: '3e', cost: '80 gp', note: '+2 circumstance bonus on Climb checks' },
      { edition: '4e', cost: '2 gp', note: '+2 bonus to Athletics checks for climbing' }
    ]
  },

  // ——— TOOLS & UTILITY ———
  {
    id: 'crowbar',
    name: 'Crowbar',
    weight: '5 lb.',
    category: 'tools-utility',
    editionData: [
      { edition: '5e', cost: '2 gp', properties: ['advantage on Strength checks to open'] },
      { edition: '2e', cost: '2 gp', properties: ['open doors bonus'], note: 'Bend bars / lift gates roll' },
      { edition: '3e', cost: '2 gp', properties: ['+2 Strength checks to force open'] },
      { edition: '4e', cost: '2 gp', properties: ['+2 Strength checks to force open'] }
    ]
  },
  {
    id: 'hammer',
    name: 'Hammer',
    weight: '3 lb.',
    category: 'tools-utility',
    editionData: [
      { edition: '5e', cost: '2 gp' },
      { edition: '2e', cost: '2 gp', note: 'General purpose' },
      { edition: '3e', cost: '5 sp' },
      { edition: '4e', cost: '5 sp' }
    ]
  },
  {
    id: 'hammer-sledge',
    name: 'Hammer, Sledge',
    weight: '10 lb.',
    category: 'tools-utility',
    editionData: [
      { edition: '5e', cost: '2 gp' },
      { edition: '2e', cost: '2 gp', note: 'Breaking objects' },
      { edition: '3e', cost: '1 gp' },
      { edition: '4e', cost: '2 gp' }
    ]
  },
  {
    id: 'pick-miners',
    name: "Pick, Miner's",
    weight: '10 lb.',
    category: 'tools-utility',
    editionData: [
      { edition: '5e', cost: '2 gp', note: 'Double as weapon 1d8 piercing' },
      { edition: '2e', cost: '3 gp', note: 'Mining; can be used as weapon' },
      { edition: '3e', cost: '3 gp', note: 'Mining pick; improvised weapon 1d6' },
      { edition: '4e', cost: '2 gp', note: 'Mining tool' }
    ]
  },
  {
    id: 'shovel',
    name: 'Shovel',
    weight: '5 lb.',
    category: 'tools-utility',
    editionData: [
      { edition: '5e', cost: '2 gp' },
      { edition: '2e', cost: '2 gp' },
      { edition: '3e', cost: '2 gp' },
      { edition: '4e', cost: '2 gp' }
    ]
  },
  {
    id: 'chain-10ft',
    name: 'Chain (10 ft)',
    weight: '10 lb.',
    category: 'tools-utility',
    editionData: [
      { edition: '5e', cost: '5 gp', note: 'HP 10, can be broken DC 20' },
      { edition: '2e', cost: '30 gp', note: 'Restrain; break free with bend bars' },
      { edition: '3e', cost: '30 gp', note: 'Hardness 10; HP 5; break DC 26' },
      { edition: '4e', cost: '30 gp', note: 'DC 30 to break' }
    ]
  },
  {
    id: 'manacles',
    name: 'Manacles',
    weight: '6 lb.',
    category: 'tools-utility',
    editionData: [
      { edition: '5e', cost: '2 gp', note: 'Restrain; DC 20 to break or pick' },
      { edition: '2e', cost: '15 gp', note: 'Restrain; escape by pick locks or bend bars' },
      { edition: '3e', cost: '15 gp', note: 'DC 26 Strength or DC 30 Escape Artist' },
      { edition: '4e', cost: '10 gp', note: 'DC 21 Thievery to open; DC 26 Strength to break' }
    ]
  },
  {
    id: 'lock',
    name: 'Lock',
    weight: '1 lb.',
    category: 'tools-utility',
    editionData: [
      { edition: '5e', cost: '10 gp', note: 'DC set by quality; key included' },
      { edition: '2e', cost: '20 gp', note: 'Quality determines pick locks modifier' },
      { edition: '3e', cost: '20 gp', note: 'Average lock; DC 25 Open Lock' },
      { edition: '4e', cost: '20 gp', note: 'DC 20 Thievery to open' }
    ]
  },
  {
    id: 'ram-portable',
    name: 'Ram, Portable',
    weight: '35 lb.',
    category: 'tools-utility',
    editionData: [
      { edition: '5e', cost: '4 gp', note: '+4 to break wooden doors; 2-handed' },
      { edition: '2e', cost: '10 gp', note: 'Batter down doors; open doors roll bonus' },
      { edition: '3e', cost: '10 gp', note: '+2 Strength to break door; two people needed' },
      { edition: '4e', cost: '10 gp', note: '+2 Strength checks to break doors' }
    ]
  },

  // ——— ADVENTURING UTILITY ———
  {
    id: 'bedroll',
    name: 'Bedroll',
    weight: '7 lb.',
    category: 'adventuring-utility',
    editionData: [
      { edition: '5e', cost: '1 gp' },
      { edition: '2e', cost: '2 sp' },
      { edition: '3e', cost: '1 sp' },
      { edition: '4e', cost: '1 sp' }
    ]
  },
  {
    id: 'blanket',
    name: 'Blanket',
    weight: '3 lb.',
    category: 'adventuring-utility',
    editionData: [
      { edition: '5e', cost: '5 sp' },
      { edition: '2e', cost: '5 sp' },
      { edition: '3e', cost: '5 sp' },
      { edition: '4e', cost: '5 sp' }
    ]
  },
  {
    id: 'bell',
    name: 'Bell',
    weight: '0 lb.',
    category: 'adventuring-utility',
    editionData: [
      { edition: '5e', cost: '1 gp' },
      { edition: '2e', cost: '1 gp' },
      { edition: '3e', cost: '1 gp' },
      { edition: '4e', cost: '1 gp' }
    ]
  },
  {
    id: 'signal-whistle',
    name: 'Signal Whistle',
    weight: '0 lb.',
    category: 'adventuring-utility',
    editionData: [
      { edition: '5e', cost: '5 cp', note: 'Hearable up to 0.5 mile' },
      { edition: '2e', cost: '8 sp', note: 'Signaling; 0.5 mile' },
      { edition: '3e', cost: '8 sp', note: 'Audible 0.25 mile' },
      { edition: '4e', cost: '5 cp', note: 'Audible 0.25 mile' }
    ]
  },
  {
    id: 'ball-bearings',
    name: 'Ball Bearings (bag of 1,000)',
    weight: '2 lb.',
    category: 'adventuring-utility',
    editionData: [
      { edition: '5e', cost: '1 gp', note: 'DC 10 Dex or fall prone; cover 10-ft square' },
      { edition: '2e', cost: '1 gp', note: 'Scatter; movement penalty or fall' },
      { edition: '3e', cost: '1 gp', note: 'DC 12 Reflex or fall prone; 10-ft square' },
      { edition: '4e', cost: '1 gp', note: 'Difficult terrain; DC 10 Acrobatics or fall prone' }
    ]
  },
  {
    id: 'caltrops',
    name: 'Caltrops (bag of 20)',
    weight: '2 lb.',
    category: 'adventuring-utility',
    editionData: [
      { edition: '5e', cost: '1 gp', note: 'DC 15 Dex or 1 damage and speed -10 ft until healed' },
      { edition: '2e', cost: '2 gp', note: 'Effective vs barefoot or light-shod; movement penalty' },
      { edition: '3e', cost: '1 gp', note: '1 damage; speed half until healed; DC 15 Reflex to avoid' },
      { edition: '4e', cost: '1 gp', note: 'Difficult terrain; 1 damage when entering square' }
    ]
  },
  {
    id: 'hunting-trap',
    name: 'Hunting Trap',
    weight: '25 lb.',
    category: 'adventuring-utility',
    editionData: [
      { edition: '5e', cost: '5 gp', note: 'DC 13 Dex to escape; 1d4 piercing' },
      { edition: '2e', cost: '5 gp', note: 'Holds creature; damage/escape by DM' },
      { edition: '3e', cost: '5 gp', note: 'DC 20 Craft (trapmaking) to set; 1d6+2 damage' },
      { edition: '4e', cost: '5 gp', note: 'Set as standard action; 1d6 damage' }
    ]
  },
  {
    id: 'mirror-steel',
    name: 'Mirror, Steel',
    weight: '0.5 lb.',
    category: 'adventuring-utility',
    editionData: [
      { edition: '5e', cost: '5 gp' },
      { edition: '2e', cost: '20 gp', note: 'Handcrafted polished steel; luxury in 2e' },
      { edition: '3e', cost: '10 gp' },
      { edition: '4e', cost: '10 gp' }
    ]
  },
  {
    id: 'pole-10ft',
    name: 'Pole (10 ft)',
    weight: '7 lb.',
    category: 'adventuring-utility',
    editionData: [
      { edition: '5e', cost: '5 cp' },
      { edition: '2e', cost: '5 cp', note: 'Probing pits and traps' },
      { edition: '3e', cost: '2 sp' },
      { edition: '4e', cost: '1 sp' }
    ]
  },
  {
    id: 'spike-iron',
    name: 'Spike, Iron',
    weight: '0.5 lb.',
    category: 'adventuring-utility',
    editionData: [
      { edition: '5e', cost: '1 sp' },
      { edition: '2e', cost: '1 sp', note: 'Door spike; climbing' },
      { edition: '3e', cost: '5 cp' },
      { edition: '4e', cost: '1 sp' }
    ]
  },

  // ——— WRITING & KNOWLEDGE ———
  {
    id: 'book',
    name: 'Book',
    weight: '5 lb.',
    category: 'writing-knowledge',
    editionData: [
      { edition: '5e', cost: '25 gp', note: 'Blank or written' },
      { edition: '2e', cost: '15 gp', note: 'Blank; written cost varies' },
      { edition: '3e', cost: '15 gp', note: 'Blank journal; 120 pages' },
      { edition: '4e', cost: '25 gp', note: 'Blank journal' }
    ]
  },
  {
    id: 'spellbook-blank',
    name: 'Spellbook (Blank)',
    weight: '3 lb.',
    category: 'writing-knowledge',
    editionData: [
      { edition: '5e', cost: '50 gp', pages: 100 },
      { edition: '2e', cost: '15 gp', pages: 100, note: 'Traveling vs standard book cost differs' },
      { edition: '3e', cost: '15 gp', pages: 100, note: 'Wizard spellbook; 100 pages' },
      { edition: '4e', cost: '50 gp', pages: 128, note: 'Ritual book' }
    ]
  },
  {
    id: 'ink-1oz',
    name: 'Ink (1 oz bottle)',
    weight: '0 lb.',
    category: 'writing-knowledge',
    editionData: [
      { edition: '5e', cost: '10 gp' },
      { edition: '2e', cost: '8 gp' },
      { edition: '3e', cost: '8 gp' },
      { edition: '4e', cost: '8 gp' }
    ]
  },
  {
    id: 'ink-pen',
    name: 'Ink Pen',
    weight: '0 lb.',
    category: 'writing-knowledge',
    editionData: [
      { edition: '5e', cost: '2 cp' },
      { edition: '2e', cost: '2 cp' },
      { edition: '3e', cost: '1 sp' },
      { edition: '4e', cost: '1 sp' }
    ]
  },
  {
    id: 'paper-one-sheet',
    name: 'Paper (one sheet)',
    weight: '0 lb.',
    category: 'writing-knowledge',
    editionData: [
      { edition: '5e', cost: '2 sp' },
      { edition: '2e', cost: '4 sp' },
      { edition: '3e', cost: '4 sp' },
      { edition: '4e', cost: '2 sp' }
    ]
  },
  {
    id: 'parchment-one-sheet',
    name: 'Parchment (one sheet)',
    weight: '0 lb.',
    category: 'writing-knowledge',
    editionData: [
      { edition: '5e', cost: '1 sp' },
      { edition: '2e', cost: '2 sp' },
      { edition: '3e', cost: '2 sp' },
      { edition: '4e', cost: '2 sp' }
    ]
  },
  {
    id: 'sealing-wax',
    name: 'Sealing Wax',
    weight: '0 lb.',
    category: 'writing-knowledge',
    editionData: [
      { edition: '5e', cost: '5 sp' },
      { edition: '2e', cost: '5 sp' },
      { edition: '3e', cost: '1 gp' },
      { edition: '4e', cost: '1 gp' }
    ]
  },
  {
    id: 'chalk',
    name: 'Chalk (1 piece)',
    weight: '0 lb.',
    category: 'writing-knowledge',
    editionData: [
      { edition: '5e', cost: '1 cp' },
      { edition: '2e', cost: '1 cp' },
      { edition: '3e', cost: '1 cp' },
      { edition: '4e', cost: '1 cp' }
    ]
  },

  // ——— KITS & FOCUSES ———
  {
    id: 'thieves-tools',
    name: "Thieves' Tools",
    weight: '1 lb.',
    category: 'kits-focuses',
    editionData: [
      { edition: '5e', cost: '25 gp', proficiency: 'thieves\' tools', note: 'Required for lock/trap checks' },
      { edition: '2e', cost: '30 gp', note: 'Mandatory for picking locks and finding traps' },
      { edition: '3e', cost: '30 gp', note: 'Required for Open Lock and Disable Device checks' },
      { edition: '4e', cost: '20 gp', note: 'Required for Thievery checks on locks/traps' }
    ]
  },
  {
    id: 'healers-kit',
    name: "Healer's Kit",
    weight: '3 lb.',
    category: 'kits-focuses',
    editionData: [
      { edition: '5e', cost: '5 gp', charges: 10, note: 'Stabilize dying creature without check' },
      { edition: '2e', cost: '25 gp', note: 'Required for Healing NWP bonus; bandages, herbs' },
      { edition: '3e', cost: '50 gp', charges: 10, note: '+2 Heal checks; 10 uses' },
      { edition: '4e', cost: '20 gp', charges: 10, note: 'Used with Heal skill; 10 uses' }
    ]
  },
  {
    id: 'holy-symbol-amulet',
    name: 'Holy Symbol, Amulet',
    weight: '1 lb.',
    category: 'kits-focuses',
    editionData: [
      { edition: '5e', cost: '5 gp', type: 'spellcasting focus' },
      { edition: '2e', cost: '25 gp', note: 'Standard focus for turning undead' },
      { edition: '3e', cost: '25 gp', type: 'divine focus' },
      { edition: '4e', cost: '10 gp', type: 'holy symbol' }
    ]
  },
  {
    id: 'holy-symbol-emblem',
    name: 'Holy Symbol, Emblem',
    weight: '0 lb.',
    category: 'kits-focuses',
    editionData: [
      { edition: '5e', cost: '5 gp', type: 'spellcasting focus' },
      { edition: '2e', cost: '25 gp', note: 'Worn on shield or tabard' },
      { edition: '3e', cost: '25 gp', type: 'divine focus' },
      { edition: '4e', cost: '10 gp', type: 'holy symbol' }
    ]
  },
  {
    id: 'component-pouch',
    name: 'Component Pouch',
    weight: '2 lb.',
    category: 'kits-focuses',
    editionData: [
      { edition: '5e', cost: '25 gp', note: 'Replaces non-consumed material components' },
      { edition: '2e', cost: '25 gp', note: 'Spell components; some spells consume' },
      { edition: '3e', cost: '5 gp', note: 'Holds material components for spellcasting' },
      { edition: '4e', cost: '15 gp', note: 'Holds reagents for rituals' }
    ]
  },
  {
    id: 'arcane-focus-crystal',
    name: 'Arcane Focus, Crystal',
    weight: '1 lb.',
    category: 'kits-focuses',
    editionData: [
      { edition: '5e', cost: '10 gp', type: 'spellcasting focus' },
      { edition: '2e', cost: '20 gp', note: 'Wizard focus; not in core 2e, optional' },
      { edition: '3e', cost: '10 gp', type: 'arcane focus', note: 'Optional; not required in core 3e' },
      { edition: '4e', cost: '15 gp', type: 'orb implement', note: 'Implement for orb users' }
    ]
  },
  {
    id: 'arcane-focus-orb',
    name: 'Arcane Focus, Orb',
    weight: '3 lb.',
    category: 'kits-focuses',
    editionData: [
      { edition: '5e', cost: '20 gp', type: 'spellcasting focus' },
      { edition: '2e', cost: '25 gp' },
      { edition: '3e', cost: '20 gp', type: 'arcane focus' },
      { edition: '4e', cost: '15 gp', type: 'orb implement' }
    ]
  },
  {
    id: 'arcane-focus-rod',
    name: 'Arcane Focus, Rod',
    weight: '2 lb.',
    category: 'kits-focuses',
    editionData: [
      { edition: '5e', cost: '10 gp', type: 'spellcasting focus' },
      { edition: '2e', cost: '15 gp' },
      { edition: '3e', cost: '10 gp', type: 'arcane focus' },
      { edition: '4e', cost: '12 gp', type: 'rod implement' }
    ]
  },
  {
    id: 'arcane-focus-staff',
    name: 'Arcane Focus, Staff',
    weight: '4 lb.',
    category: 'kits-focuses',
    editionData: [
      { edition: '5e', cost: '5 gp', type: 'spellcasting focus' },
      { edition: '2e', cost: '5 gp' },
      { edition: '3e', cost: '5 gp', type: 'arcane focus' },
      { edition: '4e', cost: '5 gp', type: 'staff implement' }
    ]
  },
  {
    id: 'arcane-focus-wand',
    name: 'Arcane Focus, Wand',
    weight: '1 lb.',
    category: 'kits-focuses',
    editionData: [
      { edition: '5e', cost: '10 gp', type: 'spellcasting focus' },
      { edition: '2e', cost: '15 gp' },
      { edition: '3e', cost: '10 gp', type: 'arcane focus' },
      { edition: '4e', cost: '7 gp', type: 'wand implement' }
    ]
  },
  {
    id: 'druidic-focus-sprig',
    name: 'Druidic Focus, Sprig of Mistletoe',
    weight: '0 lb.',
    category: 'kits-focuses',
    editionData: [
      { edition: '5e', cost: '1 gp', type: 'spellcasting focus' },
      { edition: '2e', cost: '1 gp', note: 'Druid holy symbol' },
      { edition: '3e', cost: '1 gp', type: 'druidic focus' },
      { edition: '4e', cost: '5 gp', type: 'totem implement' }
    ]
  },
  {
    id: 'druidic-focus-totem',
    name: 'Druidic Focus, Totem',
    weight: '0 lb.',
    category: 'kits-focuses',
    editionData: [
      { edition: '5e', cost: '1 gp', type: 'spellcasting focus' },
      { edition: '2e', cost: '5 gp' },
      { edition: '3e', cost: '5 gp', type: 'druidic focus' },
      { edition: '4e', cost: '5 gp', type: 'totem implement' }
    ]
  },
  {
    id: 'druidic-focus-wooden-staff',
    name: 'Druidic Focus, Wooden Staff',
    weight: '4 lb.',
    category: 'kits-focuses',
    editionData: [
      { edition: '5e', cost: '5 gp', type: 'spellcasting focus' },
      { edition: '2e', cost: '5 gp' },
      { edition: '3e', cost: '5 gp', type: 'druidic focus' },
      { edition: '4e', cost: '5 gp', type: 'staff implement' }
    ]
  },
  {
    id: 'druidic-focus-yew-wand',
    name: 'Druidic Focus, Yew Wand',
    weight: '1 lb.',
    category: 'kits-focuses',
    editionData: [
      { edition: '5e', cost: '1 gp', type: 'spellcasting focus' },
      { edition: '2e', cost: '1 gp' },
      { edition: '3e', cost: '1 gp', type: 'druidic focus' },
      { edition: '4e', cost: '7 gp', type: 'wand implement' }
    ]
  },

  // ——— RATIONS & CONSUMABLES ———
  {
    id: 'rations-standard',
    name: 'Rations (1 day, standard)',
    weight: '2 lb.',
    category: 'rations-consumables',
    editionData: [
      { edition: '5e', cost: '5 sp', type: 'standard', note: '1 day' },
      { edition: '2e', cost: '3 gp', type: 'standard', note: 'Standard 1 week; iron rations 2 weeks' },
      { edition: '3e', cost: '5 sp', type: 'trail', note: 'Trail rations; 1 day' },
      { edition: '4e', cost: '5 sp', type: 'journeybread', note: 'Journeybread; 1 day' }
    ]
  },
  {
    id: 'rations-iron',
    name: 'Rations (1 day, iron)',
    weight: '1 lb.',
    category: 'rations-consumables',
    editionData: [
      { edition: '5e', cost: '5 sp', type: 'preserved', note: 'Preserved; 1 day' },
      { edition: '2e', cost: '5 gp', type: 'iron', note: 'Lasts 2 weeks; dried, salted' },
      { edition: '3e', cost: '5 sp', type: 'trail', note: 'Same as trail rations in 3e' },
      { edition: '4e', cost: '5 sp', type: 'preserved', note: 'Preserved rations; 1 day' }
    ]
  },
  {
    id: 'mess-kit',
    name: 'Mess Kit',
    weight: '1 lb.',
    category: 'rations-consumables',
    editionData: [
      { edition: '5e', cost: '2 sp' },
      { edition: '2e', cost: '2 sp' },
      { edition: '3e', cost: '2 sp' },
      { edition: '4e', cost: '2 sp' }
    ]
  },
  {
    id: 'pot-iron',
    name: 'Pot, Iron',
    weight: '10 lb.',
    category: 'rations-consumables',
    editionData: [
      { edition: '5e', cost: '2 gp' },
      { edition: '2e', cost: '2 gp' },
      { edition: '3e', cost: '5 sp' },
      { edition: '4e', cost: '2 gp' }
    ]
  },
  {
    id: 'flask-tankard',
    name: 'Flask or Tankard',
    weight: '1 lb.',
    category: 'rations-consumables',
    editionData: [
      { edition: '5e', cost: '2 cp' },
      { edition: '2e', cost: '2 cp' },
      { edition: '3e', cost: '3 cp' },
      { edition: '4e', cost: '2 cp' }
    ]
  },
  {
    id: 'jug-pitcher',
    name: 'Jug or Pitcher',
    weight: '4 lb.',
    category: 'rations-consumables',
    editionData: [
      { edition: '5e', cost: '2 cp', capacity: '1 gallon' },
      { edition: '2e', cost: '2 cp', capacity: '1 gallon' },
      { edition: '3e', cost: '3 cp', capacity: '1 gallon' },
      { edition: '4e', cost: '2 cp', capacity: '1 gallon' }
    ]
  },

  // ——— CLOTHING ———
  {
    id: 'clothes-common',
    name: 'Clothes, Common',
    weight: '3 lb.',
    category: 'clothing',
    editionData: [
      { edition: '5e', cost: '5 sp' },
      { edition: '2e', cost: '5 sp', note: 'Peasant; affects reaction in some settings' },
      { edition: '3e', cost: '5 sp' },
      { edition: '4e', cost: '1 gp' }
    ]
  },
  {
    id: 'clothes-costume',
    name: 'Clothes, Costume',
    weight: '4 lb.',
    category: 'clothing',
    editionData: [
      { edition: '5e', cost: '5 gp' },
      { edition: '2e', cost: '5 gp', note: 'Entertainer or disguise' },
      { edition: '3e', cost: '5 gp', note: 'Entertainer outfit' },
      { edition: '4e', cost: '5 gp' }
    ]
  },
  {
    id: 'clothes-fine',
    name: 'Clothes, Fine',
    weight: '6 lb.',
    category: 'clothing',
    editionData: [
      { edition: '5e', cost: '15 gp' },
      { edition: '2e', cost: '50 gp', note: 'Standard for high-society; required for some reactions' },
      { edition: '3e', cost: '30 gp', note: 'Noble\'s outfit' },
      { edition: '4e', cost: '30 gp', note: 'Noble outfit' }
    ]
  },
  {
    id: 'clothes-travelers',
    name: 'Clothes, Traveler\'s',
    weight: '4 lb.',
    category: 'clothing',
    editionData: [
      { edition: '5e', cost: '2 gp' },
      { edition: '2e', cost: '2 gp' },
      { edition: '3e', cost: '1 gp', note: 'Traveler\'s outfit' },
      { edition: '4e', cost: '5 sp' }
    ]
  },
  {
    id: 'robe',
    name: 'Robe',
    weight: '4 lb.',
    category: 'clothing',
    editionData: [
      { edition: '5e', cost: '1 gp' },
      { edition: '2e', cost: '1 gp', note: 'Common for wizards and scholars' },
      { edition: '3e', cost: '5 sp', note: 'Scholar\'s outfit includes robe' },
      { edition: '4e', cost: '1 gp' }
    ]
  },
  {
    id: 'signet-ring',
    name: 'Signet Ring',
    weight: '0 lb.',
    category: 'clothing',
    editionData: [
      { edition: '5e', cost: '5 gp' },
      { edition: '2e', cost: '5 gp', note: 'House seal; proof of identity' },
      { edition: '3e', cost: '5 gp' },
      { edition: '4e', cost: '5 gp' }
    ]
  },

  // ——— MISC TOOLS ———
  {
    id: 'abacus',
    name: 'Abacus',
    weight: '2 lb.',
    category: 'misc-tools',
    editionData: [
      { edition: '5e', cost: '2 gp' },
      { edition: '2e', cost: '2 gp' },
      { edition: '3e', cost: '2 gp' },
      { edition: '4e', cost: '2 gp' }
    ]
  },
  {
    id: 'fishing-tackle',
    name: 'Fishing Tackle',
    weight: '4 lb.',
    category: 'misc-tools',
    editionData: [
      { edition: '5e', cost: '1 gp', note: 'Enough for one person 24 hours' },
      { edition: '2e', cost: '1 gp', note: 'Fishing NWP; hooks, line' },
      { edition: '3e', cost: '1 gp', note: 'Hooks, line, sinkers, floats' },
      { edition: '4e', cost: '1 gp', note: 'Nature check to fish' }
    ]
  },
  {
    id: 'magnifying-glass',
    name: 'Magnifying Glass',
    weight: '0 lb.',
    category: 'misc-tools',
    editionData: [
      { edition: '5e', cost: '100 gp', note: 'Light to start fire; +2 Investigation small details' },
      { edition: '2e', cost: '100 gp', note: 'Start fire; examine small details' },
      { edition: '3e', cost: '100 gp', note: '+2 Appraise for detailed items; start fire in sunlight' },
      { edition: '4e', cost: '100 gp', note: '+2 Perception for fine details' }
    ]
  },
  {
    id: 'scale-merchants',
    name: "Scale, Merchant's",
    weight: '3 lb.',
    category: 'misc-tools',
    editionData: [
      { edition: '5e', cost: '5 gp', note: 'Weigh coins/gems' },
      { edition: '2e', cost: '5 gp' },
      { edition: '3e', cost: '2 gp', note: 'Balance and weights; +2 Appraise by weight' },
      { edition: '4e', cost: '5 gp' }
    ]
  },
  {
    id: 'soap',
    name: 'Soap',
    weight: '0 lb.',
    category: 'misc-tools',
    editionData: [
      { edition: '5e', cost: '2 cp' },
      { edition: '2e', cost: '5 sp' },
      { edition: '3e', cost: '5 sp' },
      { edition: '4e', cost: '2 cp' }
    ]
  },
  {
    id: 'whetstone',
    name: 'Whetstone',
    weight: '1 lb.',
    category: 'misc-tools',
    editionData: [
      { edition: '5e', cost: '1 cp', note: 'Sharpen blade; 20 uses' },
      { edition: '2e', cost: '1 cp', note: 'Sharpen weapons' },
      { edition: '3e', cost: '2 cp' },
      { edition: '4e', cost: '2 cp' }
    ]
  },

  // ——— CASES & QUIVERS ———
  {
    id: 'case-crossbow-bolt',
    name: 'Case, Crossbow Bolt',
    weight: '1 lb.',
    category: 'cases-quivers',
    editionData: [
      { edition: '5e', cost: '1 gp', capacity: '20 bolts' },
      { edition: '2e', cost: '1 gp', capacity: '20 bolts' },
      { edition: '3e', cost: '1 gp', capacity: '10 bolts' },
      { edition: '4e', cost: '1 gp', capacity: '20 bolts' }
    ]
  },
  {
    id: 'case-map-scroll',
    name: 'Case, Map or Scroll',
    weight: '1 lb.',
    category: 'cases-quivers',
    editionData: [
      { edition: '5e', cost: '1 gp', capacity: 'Scrolls or maps' },
      { edition: '2e', cost: '1 gp' },
      { edition: '3e', cost: '1 gp', capacity: 'Maps or scrolls' },
      { edition: '4e', cost: '1 gp', capacity: 'Maps or scrolls' }
    ]
  },
  {
    id: 'quiver',
    name: 'Quiver',
    weight: '1 lb.',
    category: 'cases-quivers',
    editionData: [
      { edition: '5e', cost: '1 gp', capacity: '20 arrows' },
      { edition: '2e', cost: '1 gp', capacity: '20 arrows' },
      { edition: '3e', cost: '1 gp', capacity: '20 arrows' },
      { edition: '4e', cost: '1 gp', capacity: '30 arrows' }
    ]
  },

  // ——— TENT & CAMP ———
  {
    id: 'tent-two-person',
    name: 'Tent (two-person)',
    weight: '20 lb.',
    category: 'tent-camp',
    editionData: [
      { edition: '5e', cost: '2 gp' },
      { edition: '2e', cost: '20 gp', note: 'Canvas; more expensive in 2e' },
      { edition: '3e', cost: '10 gp' },
      { edition: '4e', cost: '10 gp' }
    ]
  },

  // ——— LUXURY & SPECIAL ———
  {
    id: 'spyglass',
    name: 'Spyglass',
    weight: '1 lb.',
    category: 'luxury-special',
    editionData: [
      { edition: '5e', cost: '1000 gp', properties: ['magnification'], note: 'Distant objects x2' },
      { edition: '2e', cost: '1000 gp', properties: ['magnification'] },
      { edition: '3e', cost: '1000 gp', properties: ['magnification'], note: 'Objects at 10x; +1 Spot at distance' },
      { edition: '4e', cost: '650 gp', properties: ['magnification'], note: '+2 Perception at range' }
    ]
  },
  {
    id: 'hourglass',
    name: 'Hourglass',
    weight: '1 lb.',
    category: 'luxury-special',
    editionData: [
      { edition: '5e', cost: '25 gp' },
      { edition: '2e', cost: '25 gp' },
      { edition: '3e', cost: '25 gp' },
      { edition: '4e', cost: '25 gp' }
    ]
  },
  {
    id: 'perfume-vial',
    name: 'Perfume (vial)',
    weight: '0 lb.',
    category: 'luxury-special',
    editionData: [
      { edition: '5e', cost: '5 gp' },
      { edition: '2e', cost: '5 gp' },
      { edition: '3e', cost: '5 gp' },
      { edition: '4e', cost: '5 gp' }
    ]
  },

  // ——— POTIONS & ALCHEMICAL ———
  {
    id: 'acid-vial',
    name: 'Acid (vial)',
    weight: '1 lb.',
    category: 'potions-alchemical',
    editionData: [
      { edition: '5e', cost: '25 gp', note: '2d6 acid damage; throw or splash' },
      { edition: '2e', cost: '25 gp', note: 'Corrosive; damage by DM' },
      { edition: '3e', cost: '10 gp', note: '1d6 acid splash; ranged touch attack' },
      { edition: '4e', cost: '20 gp', note: '1d10 acid damage; area burst 1' }
    ]
  },
  {
    id: 'alchemists-fire',
    name: "Alchemist's Fire (flask)",
    weight: '1 lb.',
    category: 'potions-alchemical',
    editionData: [
      { edition: '5e', cost: '50 gp', note: '1d4 fire; ongoing 1d4 until DC 10 Dex extinguish' },
      { edition: '2e', cost: '20 gp', note: 'Burning oil; 1d3 ongoing' },
      { edition: '3e', cost: '20 gp', note: '1d6 fire splash; 1d6 following round' },
      { edition: '4e', cost: '20 gp', note: '1d6 fire damage; ongoing 2 fire' }
    ]
  },
  {
    id: 'antitoxin',
    name: 'Antitoxin (vial)',
    weight: '0 lb.',
    category: 'potions-alchemical',
    editionData: [
      { edition: '5e', cost: '50 gp', note: 'Advantage on saves vs poison for 1 hour' },
      { edition: '2e', cost: '200 gp', note: 'Specific concoction for non-magical poisons' },
      { edition: '3e', cost: '50 gp', note: '+5 alchemical bonus on Fortitude saves vs poison for 1 hour' },
      { edition: '4e', cost: '50 gp', note: '+5 to saves vs poison until end of encounter' }
    ]
  },
  {
    id: 'potion-healing',
    name: 'Potion of Healing',
    weight: '0.5 lb.',
    category: 'potions-alchemical',
    editionData: [
      { edition: '5e', cost: '50 gp', effect: '2d4 + 2 HP' },
      { edition: '2e', cost: '250 gp', note: 'Rarely sold; usually found or crafted' },
      { edition: '3e', cost: '50 gp', effect: '1d8 + 1 HP', note: 'Cure Light Wounds potion' },
      { edition: '4e', cost: '50 gp', effect: 'Healing surge + 10 HP' }
    ]
  },
  {
    id: 'vial',
    name: 'Vial',
    weight: '0 lb.',
    category: 'potions-alchemical',
    editionData: [
      { edition: '5e', cost: '1 gp', capacity: '4 oz' },
      { edition: '2e', cost: '1 gp', capacity: '4 oz' },
      { edition: '3e', cost: '1 gp', capacity: '1 oz' },
      { edition: '4e', cost: '1 gp', capacity: '4 oz' }
    ]
  }
]
