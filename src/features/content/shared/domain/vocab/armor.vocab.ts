export const ARMOR_MATERIAL_OPTIONS = [
  { value: 'metal', label: 'Metal' },
  { value: 'organic', label: 'Organic' },
  { value: 'fabric', label: 'Fabric' },
  { value: 'wood', label: 'Wood' },
  { value: 'stone', label: 'Stone' },
] as const;

export type Material = (typeof ARMOR_MATERIAL_OPTIONS)[number]['value'];

export const ARMOR_CATEGORY_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'medium', label: 'Medium' },
  { value: 'heavy', label: 'Heavy' },
  { value: 'shields', label: 'Shields' },
] as const;

export type ArmorCategory = (typeof ARMOR_CATEGORY_OPTIONS)[number]['value'];

export const ARMOR_DEX_CONTRIBUTION_OPTIONS = [
  { value: 'full', label: 'Full' },
  { value: 'capped', label: 'Capped' },
  { value: 'none', label: 'None' },
] as const;

export type DexContributionMode = (typeof ARMOR_DEX_CONTRIBUTION_OPTIONS)[number]['value'];
