import type { Dispatch, SetStateAction } from 'react';
import type { UseFormSetValue } from 'react-hook-form';

import {
  cellEntriesToDraft,
  getDefaultGeometryForScale,
  listLocationMaps,
  type LocationFormValues,
} from '@/features/content/locations/domain';
import type { LocationGridDraftState } from '@/features/content/locations/components/locationGridDraft.types';
import { INITIAL_LOCATION_GRID_DRAFT } from '@/features/content/locations/components/locationGridDraft.types';
import { normalizeLocationMapAuthoringFields } from '@/shared/domain/locations';
import type { LocationScaleId } from '@/shared/domain/locations';

/**
 * Loads the default map for a location id and syncs grid form fields + authoring draft.
 * Caller is responsible for guards (campaign, scale) and cancellation.
 */
export async function hydrateDefaultLocationMapState(
  campaignId: string,
  mapOwnerLocationId: string,
  geometryDefaultScale: LocationScaleId | string,
  setValue: UseFormSetValue<LocationFormValues>,
  setGridDraft: Dispatch<SetStateAction<LocationGridDraftState>>,
  setGridDraftBaseline: Dispatch<SetStateAction<LocationGridDraftState>>,
): Promise<LocationGridDraftState> {
  const maps = await listLocationMaps(campaignId, mapOwnerLocationId);
  const def = maps.find((m) => m.isDefault) ?? maps[0];
  if (def) {
    setValue('gridPreset', '');
    setValue('gridColumns', String(def.grid.width));
    setValue('gridRows', String(def.grid.height));
    setValue('gridCellUnit', String(def.grid.cellUnit));
    setValue(
      'gridGeometry',
      def.grid.geometry ?? getDefaultGeometryForScale(geometryDefaultScale),
    );
    const authoring = normalizeLocationMapAuthoringFields(def);
    const next: LocationGridDraftState = {
      mapSelection: { type: 'none' },
      selectedCellId: null,
      excludedCellIds: def.layout?.excludedCellIds ?? [],
      ...cellEntriesToDraft(authoring.cellEntries),
      regionEntries: authoring.regionEntries,
      pathEntries: authoring.pathEntries,
      edgeEntries: authoring.edgeEntries,
    };
    setGridDraft(next);
    setGridDraftBaseline(structuredClone(next));
    return next;
  }
  setGridDraft(INITIAL_LOCATION_GRID_DRAFT);
  setGridDraftBaseline(structuredClone(INITIAL_LOCATION_GRID_DRAFT));
  return INITIAL_LOCATION_GRID_DRAFT;
}

export function resetGridDraftToInitial(
  setGridDraft: Dispatch<SetStateAction<LocationGridDraftState>>,
  setGridDraftBaseline: Dispatch<SetStateAction<LocationGridDraftState>>,
): void {
  setGridDraft(INITIAL_LOCATION_GRID_DRAFT);
  setGridDraftBaseline(structuredClone(INITIAL_LOCATION_GRID_DRAFT));
}
