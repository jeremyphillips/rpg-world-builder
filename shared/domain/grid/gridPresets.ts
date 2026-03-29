/**
 * Generic rectangular grid size presets (columns × rows only).
 * Feature UIs add their own labels/copy.
 */
export type GridSizePreset = 'small' | 'medium' | 'large';

export type GridSizePresetDef = {
  columns: number;
  rows: number;
};

export const GRID_SIZE_PRESETS: Record<GridSizePreset, GridSizePresetDef> = {
  small: { columns: 8, rows: 6 },
  medium: { columns: 12, rows: 10 },
  large: { columns: 16, rows: 12 },
};
