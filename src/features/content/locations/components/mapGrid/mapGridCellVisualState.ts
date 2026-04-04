import type { LocationMapSelection } from '@/features/content/locations/components/workspace/locationEditorRail.types';

/**
 * Whether the grid cell at `cellId` should show default `:hover` background/border chrome
 * (the dimmed hover treatment on the cell button / hex ring).
 *
 * **Policy:** see `SELECT_MODE_CHROME_POLICY_DOC` in `selectModeChrome.policy.ts`.
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
 * Select mode: when there is a non-`none` hover winner and this cell is **not** the cell-level
 * hover target, enhanced cell `:hover` chrome is suppressed; callers should mirror idle border/fill
 * on `:hover` so native `<button>` styling does not compete with region/path/object emphasis.
 *
 * **Policy:** see `SELECT_MODE_CHROME_POLICY_DOC`. Used by {@link GridEditor} and
 * {@link HexGridEditor} for equivalent feedback.
 */
export function isSelectHoverChromeSuppressed(
  cellId: string,
  selectHoverTarget: LocationMapSelection | undefined,
  disabled: boolean,
): boolean {
  return (
    !disabled &&
    selectHoverTarget !== undefined &&
    selectHoverTarget.type !== 'none' &&
    !shouldApplyCellHoverChrome(cellId, selectHoverTarget)
  );
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
