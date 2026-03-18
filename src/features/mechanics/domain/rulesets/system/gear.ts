/**
 * System gear catalog — code-defined gear entries per system ruleset.
 *
 * These are the "factory defaults" for gear (SRD_CC_v5_2_1). Campaign-owned
 * custom gear is stored in the DB and merged at runtime by the gearRepo.
 */
import type { Gear, GearFields } from '@/features/content/equipment/gear/domain/types';
import type { SystemRulesetId } from '../types/ruleset.types';
import { DEFAULT_SYSTEM_RULESET_ID } from '../ids/systemIds';

// ---------------------------------------------------------------------------
// Mapper
// ---------------------------------------------------------------------------

export function toSystemGear(systemId: SystemRulesetId, raw: GearFields): Gear {
  return {
    ...raw,
    source: 'system',
    systemId,
    patched: false,
  };
}

// ---------------------------------------------------------------------------
// 5e v1 system gear (SRD_CC_v5_2_1)
// ---------------------------------------------------------------------------

const GEAR_RAW: readonly GearFields[] = [
  // PACKS & CONTAINERS
  { id: 'backpack', name: 'Backpack', category: 'packs-containers', weight: { value: 5, unit: 'lb' }, cost: { coin: 'gp', value: 2 }, capacity: '1 cubic foot / 30 pounds of gear' },
  { id: 'barrel', name: 'Barrel', category: 'packs-containers', weight: { value: 70, unit: 'lb' }, cost: { coin: 'gp', value: 2 }, capacity: '40 gallons liquid' },
  { id: 'basket', name: 'Basket', category: 'packs-containers', weight: { value: 2, unit: 'lb' }, cost: { coin: 'sp', value: 4 }, capacity: '2 cubic feet / 40 lbs' },
  { id: 'bottle-glass', name: 'Bottle, Glass', category: 'packs-containers', weight: { value: 2, unit: 'lb' }, cost: { coin: 'gp', value: 2 } },
  { id: 'bucket', name: 'Bucket', category: 'packs-containers', weight: { value: 2, unit: 'lb' }, cost: { coin: 'cp', value: 5 }, capacity: '3 gallons' },
  { id: 'chest-small', name: 'Chest, Small', category: 'packs-containers', weight: { value: 25, unit: 'lb' }, cost: { coin: 'gp', value: 5 }, capacity: '12 cubic feet / 300 lbs' },
  { id: 'pouch-belt', name: 'Pouch, Belt', category: 'packs-containers', weight: { value: 0.5, unit: 'lb' }, cost: { coin: 'sp', value: 5 }, capacity: '1/5 cubic foot / 6 lbs (e.g. coins)' },
  { id: 'sack', name: 'Sack', category: 'packs-containers', weight: { value: 0.5, unit: 'lb' }, cost: { coin: 'cp', value: 1 }, capacity: '1 cubic foot / 30 lbs' },
  { id: 'waterskin', name: 'Waterskin', category: 'packs-containers', weight: { value: 5, unit: 'lb' }, cost: { coin: 'sp', value: 2 }, capacity: '4 pints' },
  // LIGHTING & FUEL
  { id: 'candle', name: 'Candle', category: 'lighting-fuel', weight: { value: 0, unit: 'lb' }, cost: { coin: 'cp', value: 1 }, duration: '1 hour' },
  { id: 'lantern-bullseye', name: 'Lantern, Bullseye', category: 'lighting-fuel', weight: { value: 2, unit: 'lb' }, cost: { coin: 'gp', value: 10 }, range: '60-foot cone bright, 60 ft dim', duration: '6 hours per pint oil' },
  { id: 'lantern-hooded', name: 'Lantern, Hooded', category: 'lighting-fuel', weight: { value: 2, unit: 'lb' }, cost: { coin: 'gp', value: 5 }, range: '30-foot radius', duration: '6 hours per pint oil' },
  { id: 'lamp', name: 'Lamp', category: 'lighting-fuel', weight: { value: 1, unit: 'lb' }, cost: { coin: 'sp', value: 5 }, range: '15-foot radius', duration: '6 hours per pint oil' },
  { id: 'oil-flask', name: 'Oil (1 pint flask)', category: 'lighting-fuel', weight: { value: 1, unit: 'lb' }, cost: { coin: 'sp', value: 1 }, description: 'Fuel for lamp/lantern; can be lit as flask for 1d4 fire damage' },
  { id: 'torch', name: 'Torch', category: 'lighting-fuel', weight: { value: 1, unit: 'lb' }, cost: { coin: 'cp', value: 1 }, range: '20 ft bright / 20 ft dim', duration: '1 hour' },
  { id: 'tinderbox', name: 'Tinderbox', category: 'lighting-fuel', weight: { value: 1, unit: 'lb' }, cost: { coin: 'sp', value: 5 }, description: 'Flint, steel, tinder; lights torch/lamp in 1 action' },
  // ROPE & CLIMBING
  { id: 'rope-hempen', name: 'Rope, Hempen (50 ft)', category: 'rope-climbing', weight: { value: 10, unit: 'lb' }, cost: { coin: 'gp', value: 1 }, hp: 2, burstDC: 17, description: 'Can support 3,000 lbs' },
  { id: 'rope-silk', name: 'Rope, Silk (50 ft)', category: 'rope-climbing', weight: { value: 5, unit: 'lb' }, cost: { coin: 'gp', value: 10 }, hp: 2, burstDC: 17, description: 'Can support 3,000 lbs; lighter' },
  { id: 'grappling-hook', name: 'Grappling Hook', category: 'rope-climbing', weight: { value: 4, unit: 'lb' }, cost: { coin: 'gp', value: 2 } },
  { id: 'block-and-tackle', name: 'Block and Tackle', category: 'rope-climbing', weight: { value: 5, unit: 'lb' }, cost: { coin: 'gp', value: 1 }, description: 'Multiply lifting power by 4' },
  { id: 'ladder-10ft', name: 'Ladder (10 ft)', category: 'rope-climbing', weight: { value: 25, unit: 'lb' }, cost: { coin: 'sp', value: 1 } },
  { id: 'piton', name: 'Piton', category: 'rope-climbing', weight: { value: 0.25, unit: 'lb' }, cost: { coin: 'cp', value: 5 }, description: "Used with climber's kit or rope" },
  { id: 'climbers-kit', name: "Climber's Kit", category: 'rope-climbing', weight: { value: 12, unit: 'lb' }, cost: { coin: 'gp', value: 25 }, description: 'Pitons, rope, harness; climb with hands free, +10 to checks' },
  // TOOLS & UTILITY
  { id: 'crowbar', name: 'Crowbar', category: 'tools-utility', weight: { value: 5, unit: 'lb' }, cost: { coin: 'gp', value: 2 }, properties: [] },
  { id: 'hammer', name: 'Hammer', category: 'tools-utility', weight: { value: 3, unit: 'lb' }, cost: { coin: 'gp', value: 2 } },
  { id: 'hammer-sledge', name: 'Hammer, Sledge', category: 'tools-utility', weight: { value: 10, unit: 'lb' }, cost: { coin: 'gp', value: 2 } },
  { id: 'pick-miners', name: "Pick, Miner's", category: 'tools-utility', weight: { value: 10, unit: 'lb' }, cost: { coin: 'gp', value: 2 }, description: 'Double as weapon 1d8 piercing' },
  { id: 'shovel', name: 'Shovel', category: 'tools-utility', weight: { value: 5, unit: 'lb' }, cost: { coin: 'gp', value: 2 } },
  { id: 'chain-10ft', name: 'Chain (10 ft)', category: 'tools-utility', weight: { value: 10, unit: 'lb' }, cost: { coin: 'gp', value: 5 }, description: 'HP 10, can be broken DC 20' },
  { id: 'manacles', name: 'Manacles', category: 'tools-utility', weight: { value: 6, unit: 'lb' }, cost: { coin: 'gp', value: 2 }, description: 'Restrain; DC 20 to break or pick' },
  { id: 'lock', name: 'Lock', category: 'tools-utility', weight: { value: 1, unit: 'lb' }, cost: { coin: 'gp', value: 10 }, description: 'DC set by quality; key included' },
  { id: 'ram-portable', name: 'Ram, Portable', category: 'tools-utility', weight: { value: 35, unit: 'lb' }, cost: { coin: 'gp', value: 4 }, description: '+4 to break wooden doors; 2-handed' },
  // ADVENTURING UTILITY
  { id: 'bedroll', name: 'Bedroll', category: 'adventuring-utility', weight: { value: 7, unit: 'lb' }, cost: { coin: 'gp', value: 1 } },
  { id: 'blanket', name: 'Blanket', category: 'adventuring-utility', weight: { value: 3, unit: 'lb' }, cost: { coin: 'sp', value: 5 } },
  { id: 'bell', name: 'Bell', category: 'adventuring-utility', weight: { value: 0, unit: 'lb' }, cost: { coin: 'gp', value: 1 } },
  { id: 'signal-whistle', name: 'Signal Whistle', category: 'adventuring-utility', weight: { value: 0, unit: 'lb' }, cost: { coin: 'cp', value: 5 }, description: 'Hearable up to 0.5 mile' },
  { id: 'ball-bearings', name: 'Ball Bearings (bag of 1,000)', category: 'adventuring-utility', weight: { value: 2, unit: 'lb' }, cost: { coin: 'gp', value: 1 }, description: 'DC 10 Dex or fall prone; cover 10-ft square' },
  { id: 'caltrops', name: 'Caltrops (bag of 20)', category: 'adventuring-utility', weight: { value: 2, unit: 'lb' }, cost: { coin: 'gp', value: 1 }, description: 'DC 15 Dex or 1 damage and speed -10 ft until healed' },
  { id: 'hunting-trap', name: 'Hunting Trap', category: 'adventuring-utility', weight: { value: 25, unit: 'lb' }, cost: { coin: 'gp', value: 5 }, description: 'DC 13 Dex to escape; 1d4 piercing' },
  { id: 'mirror-steel', name: 'Mirror, Steel', category: 'adventuring-utility', weight: { value: 0.5, unit: 'lb' }, cost: { coin: 'gp', value: 5 } },
  { id: 'pole-10ft', name: 'Pole (10 ft)', category: 'adventuring-utility', weight: { value: 7, unit: 'lb' }, cost: { coin: 'cp', value: 5 } },
  { id: 'spike-iron', name: 'Spike, Iron', category: 'adventuring-utility', weight: { value: 0.5, unit: 'lb' }, cost: { coin: 'sp', value: 1 } },
  // WRITING & KNOWLEDGE
  { id: 'book', name: 'Book', category: 'writing-knowledge', weight: { value: 5, unit: 'lb' }, cost: { coin: 'gp', value: 25 }, description: 'Blank or written' },
  { id: 'spellbook-blank', name: 'Spellbook (Blank)', category: 'writing-knowledge', weight: { value: 3, unit: 'lb' }, cost: { coin: 'gp', value: 50 }, pages: 100 },
  { id: 'ink-1oz', name: 'Ink (1 oz bottle)', category: 'writing-knowledge', weight: { value: 0, unit: 'lb' }, cost: { coin: 'gp', value: 10 } },
  { id: 'ink-pen', name: 'Ink Pen', category: 'writing-knowledge', weight: { value: 0, unit: 'lb' }, cost: { coin: 'cp', value: 2 } },
  { id: 'paper-one-sheet', name: 'Paper (one sheet)', category: 'writing-knowledge', weight: { value: 0, unit: 'lb' }, cost: { coin: 'sp', value: 2 } },
  { id: 'parchment-one-sheet', name: 'Parchment (one sheet)', category: 'writing-knowledge', weight: { value: 0, unit: 'lb' }, cost: { coin: 'sp', value: 1 } },
  { id: 'sealing-wax', name: 'Sealing Wax', category: 'writing-knowledge', weight: { value: 0, unit: 'lb' }, cost: { coin: 'sp', value: 5 } },
  { id: 'chalk', name: 'Chalk (1 piece)', category: 'writing-knowledge', weight: { value: 0, unit: 'lb' }, cost: { coin: 'cp', value: 1 } },
  // KITS & FOCUSES
  { id: 'thieves-tools', name: "Thieves' Tools", category: 'kits-focuses', weight: { value: 1, unit: 'lb' }, cost: { coin: 'gp', value: 25 }, proficiency: "thieves' tools", description: 'Required for lock/trap checks' },
  { id: 'healers-kit', name: "Healer's Kit", category: 'kits-focuses', weight: { value: 3, unit: 'lb' }, cost: { coin: 'gp', value: 5 }, charges: 10, description: 'Stabilize dying creature without check' },
  { id: 'holy-symbol-amulet', name: 'Holy Symbol, Amulet', category: 'kits-focuses', weight: { value: 1, unit: 'lb' }, cost: { coin: 'gp', value: 5 }, type: 'spellcasting focus' },
  { id: 'holy-symbol-emblem', name: 'Holy Symbol, Emblem', category: 'kits-focuses', weight: { value: 0, unit: 'lb' }, cost: { coin: 'gp', value: 5 }, type: 'spellcasting focus' },
  { id: 'component-pouch', name: 'Component Pouch', category: 'kits-focuses', weight: { value: 2, unit: 'lb' }, cost: { coin: 'gp', value: 25 }, description: 'Replaces non-consumed material components' },
  { id: 'arcane-focus-crystal', name: 'Arcane Focus, Crystal', category: 'kits-focuses', weight: { value: 1, unit: 'lb' }, cost: { coin: 'gp', value: 10 }, type: 'spellcasting focus' },
  { id: 'arcane-focus-orb', name: 'Arcane Focus, Orb', category: 'kits-focuses', weight: { value: 3, unit: 'lb' }, cost: { coin: 'gp', value: 20 }, type: 'spellcasting focus' },
  { id: 'arcane-focus-rod', name: 'Arcane Focus, Rod', category: 'kits-focuses', weight: { value: 2, unit: 'lb' }, cost: { coin: 'gp', value: 10 }, type: 'spellcasting focus' },
  { id: 'arcane-focus-staff', name: 'Arcane Focus, Staff', category: 'kits-focuses', weight: { value: 4, unit: 'lb' }, cost: { coin: 'gp', value: 5 }, type: 'spellcasting focus' },
  { id: 'arcane-focus-wand', name: 'Arcane Focus, Wand', category: 'kits-focuses', weight: { value: 1, unit: 'lb' }, cost: { coin: 'gp', value: 10 }, type: 'spellcasting focus' },
  { id: 'druidic-focus-sprig', name: 'Druidic Focus, Sprig of Mistletoe', category: 'kits-focuses', weight: { value: 0, unit: 'lb' }, cost: { coin: 'gp', value: 1 }, type: 'spellcasting focus' },
  { id: 'druidic-focus-totem', name: 'Druidic Focus, Totem', category: 'kits-focuses', weight: { value: 0, unit: 'lb' }, cost: { coin: 'gp', value: 1 }, type: 'spellcasting focus' },
  { id: 'druidic-focus-wooden-staff', name: 'Druidic Focus, Wooden Staff', category: 'kits-focuses', weight: { value: 4, unit: 'lb' }, cost: { coin: 'gp', value: 5 }, type: 'spellcasting focus' },
  { id: 'druidic-focus-yew-wand', name: 'Druidic Focus, Yew Wand', category: 'kits-focuses', weight: { value: 1, unit: 'lb' }, cost: { coin: 'gp', value: 1 }, type: 'spellcasting focus' },
  // RATIONS & CONSUMABLES
  { id: 'rations-standard', name: 'Rations (1 day, standard)', category: 'rations-consumables', weight: { value: 2, unit: 'lb' }, cost: { coin: 'sp', value: 5 }, type: 'standard', description: '1 day' },
  { id: 'rations-iron', name: 'Rations (1 day, iron)', category: 'rations-consumables', weight: { value: 1, unit: 'lb' }, cost: { coin: 'sp', value: 5 }, type: 'preserved', description: 'Preserved; 1 day' },
  { id: 'mess-kit', name: 'Mess Kit', category: 'rations-consumables', weight: { value: 1, unit: 'lb' }, cost: { coin: 'sp', value: 2 } },
  { id: 'pot-iron', name: 'Pot, Iron', category: 'rations-consumables', weight: { value: 10, unit: 'lb' }, cost: { coin: 'gp', value: 2 } },
  { id: 'flask-tankard', name: 'Flask or Tankard', category: 'rations-consumables', weight: { value: 1, unit: 'lb' }, cost: { coin: 'cp', value: 2 } },
  { id: 'jug-pitcher', name: 'Jug or Pitcher', category: 'rations-consumables', weight: { value: 4, unit: 'lb' }, cost: { coin: 'cp', value: 2 }, capacity: '1 gallon' },
  // CLOTHING
  { id: 'clothes-common', name: 'Clothes, Common', category: 'clothing', weight: { value: 3, unit: 'lb' }, cost: { coin: 'sp', value: 5 } },
  { id: 'clothes-costume', name: 'Clothes, Costume', category: 'clothing', weight: { value: 4, unit: 'lb' }, cost: { coin: 'gp', value: 5 } },
  { id: 'clothes-fine', name: 'Clothes, Fine', category: 'clothing', weight: { value: 6, unit: 'lb' }, cost: { coin: 'gp', value: 15 } },
  { id: 'clothes-travelers', name: "Clothes, Traveler's", category: 'clothing', weight: { value: 4, unit: 'lb' }, cost: { coin: 'gp', value: 2 } },
  { id: 'robe', name: 'Robe', category: 'clothing', weight: { value: 4, unit: 'lb' }, cost: { coin: 'gp', value: 1 } },
  { id: 'signet-ring', name: 'Signet Ring', category: 'clothing', weight: { value: 0, unit: 'lb' }, cost: { coin: 'gp', value: 5 } },
  // MISC TOOLS
  { id: 'abacus', name: 'Abacus', category: 'misc-tools', weight: { value: 2, unit: 'lb' }, cost: { coin: 'gp', value: 2 } },
  { id: 'fishing-tackle', name: 'Fishing Tackle', category: 'misc-tools', weight: { value: 4, unit: 'lb' }, cost: { coin: 'gp', value: 1 }, description: 'Enough for one person 24 hours' },
  { id: 'magnifying-glass', name: 'Magnifying Glass', category: 'misc-tools', weight: { value: 0, unit: 'lb' }, cost: { coin: 'gp', value: 100 }, description: 'Light to start fire; +2 Investigation small details' },
  { id: 'scale-merchants', name: "Scale, Merchant's", category: 'misc-tools', weight: { value: 3, unit: 'lb' }, cost: { coin: 'gp', value: 5 }, description: 'Weigh coins/gems' },
  { id: 'soap', name: 'Soap', category: 'misc-tools', weight: { value: 0, unit: 'lb' }, cost: { coin: 'cp', value: 2 } },
  { id: 'whetstone', name: 'Whetstone', category: 'misc-tools', weight: { value: 1, unit: 'lb' }, cost: { coin: 'cp', value: 1 }, description: 'Sharpen blade; 20 uses' },
  // CASES & QUIVERS
  { id: 'case-crossbow-bolt', name: 'Case, Crossbow Bolt', category: 'cases-quivers', weight: { value: 1, unit: 'lb' }, cost: { coin: 'gp', value: 1 }, capacity: '20 bolts' },
  { id: 'case-map-scroll', name: 'Case, Map or Scroll', category: 'cases-quivers', weight: { value: 1, unit: 'lb' }, cost: { coin: 'gp', value: 1 }, capacity: 'Scrolls or maps' },
  { id: 'quiver', name: 'Quiver', category: 'cases-quivers', weight: { value: 1, unit: 'lb' }, cost: { coin: 'gp', value: 1 }, capacity: '20 arrows' },
  // TENT & CAMP
  { id: 'tent-two-person', name: 'Tent (two-person)', category: 'tent-camp', weight: { value: 20, unit: 'lb' }, cost: { coin: 'gp', value: 2 } },
  // LUXURY & SPECIAL
  { id: 'spyglass', name: 'Spyglass', category: 'luxury-special', weight: { value: 1, unit: 'lb' }, cost: { coin: 'gp', value: 1000 }, properties: ['magnification'], description: 'Distant objects x2' },
  { id: 'hourglass', name: 'Hourglass', category: 'luxury-special', weight: { value: 1, unit: 'lb' }, cost: { coin: 'gp', value: 25 } },
  { id: 'perfume-vial', name: 'Perfume (vial)', category: 'luxury-special', weight: { value: 0, unit: 'lb' }, cost: { coin: 'gp', value: 5 } },
  // POTIONS & ALCHEMICAL
  { id: 'acid-vial', name: 'Acid (vial)', category: 'potions-alchemical', weight: { value: 1, unit: 'lb' }, cost: { coin: 'gp', value: 25 }, description: '2d6 acid damage; throw or splash' },
  { id: 'alchemists-fire', name: "Alchemist's Fire (flask)", category: 'potions-alchemical', weight: { value: 1, unit: 'lb' }, cost: { coin: 'gp', value: 50 }, description: '1d4 fire; ongoing 1d4 until DC 10 Dex extinguish' },
  { id: 'antitoxin', name: 'Antitoxin (vial)', category: 'potions-alchemical', weight: { value: 0, unit: 'lb' }, cost: { coin: 'gp', value: 50 }, description: 'Advantage on saves vs poison for 1 hour' },
  { id: 'potion-healing', name: 'Potion of Healing', category: 'potions-alchemical', weight: { value: 0.5, unit: 'lb' }, cost: { coin: 'gp', value: 50 }, effect: '2d4 + 2 HP' },
  { id: 'vial', name: 'Vial', category: 'potions-alchemical', weight: { value: 0, unit: 'lb' }, cost: { coin: 'gp', value: 1 }, capacity: '4 oz' },
];

const SYSTEM_GEAR_SRD_CC_V5_2_1: readonly Gear[] = GEAR_RAW.map(g => toSystemGear(DEFAULT_SYSTEM_RULESET_ID, g));

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const SYSTEM_GEAR_BY_SYSTEM_ID: Record<SystemRulesetId, readonly Gear[]> = {
  [DEFAULT_SYSTEM_RULESET_ID]: SYSTEM_GEAR_SRD_CC_V5_2_1,
};

export function getSystemGear(systemId: SystemRulesetId): readonly Gear[] {
  return SYSTEM_GEAR_BY_SYSTEM_ID[systemId] ?? [];
}

export function getSystemGearEntry(systemId: SystemRulesetId, id: string): Gear | undefined {
  return getSystemGear(systemId).find(g => g.id === id);
}
