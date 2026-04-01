import type { LocationMapSelection } from '@/features/content/locations/components/workspace/locationEditorRail.types';

/**
 * Whether the grid cell at `cellId` should show default `:hover` background/border chrome
 * (the dimmed hover treatment on the cell button / hex ring).
 *
 * **Select mode:** pass `selectHoverTarget` from {@link resolveSelectModeInteractiveTarget} /
 * pointer resolution. Cell-level hover applies only when the hover **winner** is `cell` for this
 * `cellId`. When the winner is region, object, path, or edge, returns `false` so the cell does
 * not look like the primary hover target.
 *
 * **Other modes:** pass `undefined` for `selectHoverTarget` so every cell keeps normal hover
 * (place, paint, draw, erase, etc.).
 *
 * **`none`:** no resolved hover target (pointer left the map or hit-testing has not produced a
 * cell yet). Cell chrome is suppressed so the pointer does not imply a cell-level target.
 */
export function shouldApplyCellHoverChrome(
  cellId: string,
  selectHoverTarget: LocationMapSelection | undefined,
): boolean {
  if (selectHoverTarget === undefined) {
    return true;
  }
  if (selectHoverTarget.type === 'none') {
    return false;
  }
  if (selectHoverTarget.type === 'cell') {
    return selectHoverTarget.cellId === cellId;
  }
  return false;
}

/**
 * Whether the cell should show **selected** chrome (border, fill, inset shadow) as the map’s
 * cell-level selection. Matches {@link selectedCellIdForMapSelection}: only `cell` and `object`
 * selections set a `selectedCellId`; region/path/edge do not.
 */
export function shouldApplyCellSelectedChrome(
  selectedCellId: string | null | undefined,
  cellId: string,
): boolean {
  return selectedCellId != null && selectedCellId === cellId;
}
