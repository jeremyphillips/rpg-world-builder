import type { LocationMapSelection } from '@/features/content/locations/components/workspace/locationEditorRail.types';

/**
 * Select-mode click-only refinement: when the base resolver would select a region again
 * and the map already has that same region selected, drill into the clicked cell instead.
 *
 * Does not apply to hover — only call from click handlers after
 * {@link resolveSelectModeInteractiveTarget}.
 *
 * Preconditions (caller must ensure base resolution already ran):
 * - If object/edge/path won, `resolved` is not `{ type: 'region' }`, so this no-ops.
 */
export function refineSelectModeClickAfterRegionDrill(
  resolved: LocationMapSelection,
  previousSelection: LocationMapSelection,
  clickedCellId: string,
): LocationMapSelection {
  if (
    resolved.type === 'region' &&
    previousSelection.type === 'region' &&
    previousSelection.regionId === resolved.regionId
  ) {
    return { type: 'cell', cellId: clickedCellId };
  }
  return resolved;
}
