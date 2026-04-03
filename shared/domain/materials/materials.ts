/**
 * Cross-domain material identifiers and display labels.
 * Domain features (e.g. locations) should take **subsets** of {@link MaterialId} rather than
 * redefining material spellings locally.
 */

/** Canonical material ids — single vocabulary for stone/wood/tile across domains. */
export const MATERIAL_IDS = ['stone', 'wood', 'tile'] as const;

export type MaterialId = (typeof MATERIAL_IDS)[number];

/**
 * Human-readable labels for each {@link MaterialId}.
 * Ids are listed explicitly so they stay aligned with {@link MATERIAL_IDS}.
 */
export const MATERIAL_META = {
  stone: { id: 'stone', label: 'Stone' },
  wood: { id: 'wood', label: 'Wood' },
  tile: { id: 'tile', label: 'Tile' },
} as const satisfies Record<MaterialId, { id: MaterialId; label: string }>;
