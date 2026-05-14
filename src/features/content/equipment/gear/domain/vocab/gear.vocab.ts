export const GEAR_CATEGORY_OPTIONS = [
  { id: 'packs-containers', name: 'Packs & Containers' },
  { id: 'lighting-fuel', name: 'Lighting & Fuel' },
  { id: 'rope-climbing', name: 'Rope & Climbing' },
  { id: 'tools-utility', name: 'Tools & Utility' },
  { id: 'adventuring-utility', name: 'Adventuring Utility' },
  { id: 'writing-knowledge', name: 'Writing & Knowledge' },
  { id: 'kits-focuses', name: 'Kits & Focuses' },
  { id: 'rations-consumables', name: 'Rations & Consumables' },
  { id: 'clothing', name: 'Clothing' },
  { id: 'misc-tools', name: 'Misc Tools' },
  { id: 'cases-quivers', name: 'Cases & Quivers' },
  { id: 'tent-camp', name: 'Tent & Camp' },
  { id: 'luxury-special', name: 'Luxury & Special' },
  { id: 'potions-alchemical', name: 'Potions & Alchemical' },
] as const;

export type GearCategory = (typeof GEAR_CATEGORY_OPTIONS)[number]['id'];

export const GEAR_PROPERTY_OPTIONS = [
  { id: 'magnification', name: 'Magnification' },
] as const;

export type GearProperty = (typeof GEAR_PROPERTY_OPTIONS)[number]['id'];
