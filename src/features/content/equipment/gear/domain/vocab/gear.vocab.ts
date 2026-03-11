export const GEAR_CATEGORY_OPTIONS = [
  { value: 'packs-containers', label: 'Packs & Containers' },
  { value: 'lighting-fuel', label: 'Lighting & Fuel' },
  { value: 'rope-climbing', label: 'Rope & Climbing' },
  { value: 'tools-utility', label: 'Tools & Utility' },
  { value: 'adventuring-utility', label: 'Adventuring Utility' },
  { value: 'writing-knowledge', label: 'Writing & Knowledge' },
  { value: 'kits-focuses', label: 'Kits & Focuses' },
  { value: 'rations-consumables', label: 'Rations & Consumables' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'misc-tools', label: 'Misc Tools' },
  { value: 'cases-quivers', label: 'Cases & Quivers' },
  { value: 'tent-camp', label: 'Tent & Camp' },
  { value: 'luxury-special', label: 'Luxury & Special' },
  { value: 'potions-alchemical', label: 'Potions & Alchemical' },
] as const;

export type GearCategory = (typeof GEAR_CATEGORY_OPTIONS)[number]['value'];

export const GEAR_PROPERTY_OPTIONS = [
  { value: 'magnification', label: 'Magnification' },
] as const;

export type GearProperty = (typeof GEAR_PROPERTY_OPTIONS)[number]['value'];
