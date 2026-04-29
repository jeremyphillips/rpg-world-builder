export const ARMOR_MATERIAL_OPTIONS = [
  { id: 'metal', name: 'Metal' },
  { id: 'organic', name: 'Organic' },
  { id: 'fabric', name: 'Fabric' },
  { id: 'wood', name: 'Wood' },
  { id: 'stone', name: 'Stone' },
] as const;

export type Material = (typeof ARMOR_MATERIAL_OPTIONS)[number]['id'];

export const ARMOR_CATEGORY_OPTIONS = [
  { id: 'light', name: 'Light' },
  { id: 'medium', name: 'Medium' },
  { id: 'heavy', name: 'Heavy' },
  { id: 'shields', name: 'Shields' },
] as const;

export type ArmorCategory = (typeof ARMOR_CATEGORY_OPTIONS)[number]['id'];

export const ARMOR_DEX_CONTRIBUTION_OPTIONS = [
  { id: 'full', name: 'Full' },
  { id: 'capped', name: 'Capped' },
  { id: 'none', name: 'None' },
] as const;

export type DexContributionMode = (typeof ARMOR_DEX_CONTRIBUTION_OPTIONS)[number]['id'];
