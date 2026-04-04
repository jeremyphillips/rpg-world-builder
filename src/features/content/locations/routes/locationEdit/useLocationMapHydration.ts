import { useEffect, type Dispatch, type RefObject, type SetStateAction } from 'react';
import type { UseFormGetValues, UseFormSetValue } from 'react-hook-form';

import { INITIAL_LOCATION_GRID_DRAFT } from '@/features/content/locations/components/locationGridDraft.types';
import type { LocationGridDraftState } from '@/features/content/locations/components/locationGridDraft.types';
import type { LocationFormValues } from '@/features/content/locations/domain';
import type { LocationContentItem } from '@/features/content/locations/domain/repo/locationRepo';
import type { LocationVerticalStairConnection } from '@/shared/domain/locations';

import {
  hydrateDefaultLocationMapState,
  resetGridDraftToInitial,
} from '../hydrateDefaultLocationMap';

import { serializeLocationWorkspacePersistableSnapshot } from './workspacePersistableSnapshot';

function applyWorkspacePersistBaseline(
  getValues: UseFormGetValues<LocationFormValues>,
  setWorkspacePersistBaseline: (snapshot: string) => void,
  draft: LocationGridDraftState,
  buildingStairConnectionsRef: RefObject<LocationVerticalStairConnection[]>,
  loc: LocationContentItem | null,
): void {
  setWorkspacePersistBaseline(
    serializeLocationWorkspacePersistableSnapshot(
      getValues(),
      draft,
      buildingStairConnectionsRef.current ?? [],
      loc,
    ),
  );
}

type UseLocationMapHydrationParams = {
  campaignId: string | null | undefined;
  locationId: string | null | undefined;
  loc: LocationContentItem | null;
  activeFloorId: string | null;
  setValue: UseFormSetValue<LocationFormValues>;
  getValues: UseFormGetValues<LocationFormValues>;
  setGridDraft: Dispatch<SetStateAction<LocationGridDraftState>>;
  setGridDraftBaseline: Dispatch<SetStateAction<LocationGridDraftState>>;
  buildingStairConnectionsRef: RefObject<LocationVerticalStairConnection[]>;
  setWorkspacePersistBaseline: (snapshot: string) => void;
};

/**
 * Loads default map + grid form fields when the edited location (or active building floor) changes.
 * Cancellation matches prior route behavior: ignore async errors after unmount or dependency change.
 */
export function useLocationMapHydration({
  campaignId,
  locationId,
  loc,
  activeFloorId,
  setValue,
  getValues,
  setGridDraft,
  setGridDraftBaseline,
  buildingStairConnectionsRef,
  setWorkspacePersistBaseline,
}: UseLocationMapHydrationParams): void {
  useEffect(() => {
    if (!campaignId || !locationId || !loc || loc.source !== 'campaign') return;
    if (loc.scale === 'building') return;
    let cancelled = false;
    hydrateDefaultLocationMapState(
      campaignId,
      locationId,
      loc.scale,
      setValue,
      setGridDraft,
      setGridDraftBaseline,
    )
      .then((draft) => {
        if (cancelled) return;
        applyWorkspacePersistBaseline(
          getValues,
          setWorkspacePersistBaseline,
          draft,
          buildingStairConnectionsRef,
          loc,
        );
      })
      .catch(() => {
        if (cancelled) return;
        resetGridDraftToInitial(setGridDraft, setGridDraftBaseline);
        applyWorkspacePersistBaseline(
          getValues,
          setWorkspacePersistBaseline,
          INITIAL_LOCATION_GRID_DRAFT,
          buildingStairConnectionsRef,
          loc,
        );
      });
    return () => {
      cancelled = true;
    };
  }, [
    campaignId,
    locationId,
    loc?.id,
    loc?.scale,
    loc?.source,
    setValue,
    getValues,
    setGridDraft,
    setGridDraftBaseline,
    buildingStairConnectionsRef,
    setWorkspacePersistBaseline,
  ]);

  useEffect(() => {
    if (!campaignId || !locationId || !loc || loc.source !== 'campaign') return;
    if (loc.scale !== 'building') return;
    if (!activeFloorId) {
      resetGridDraftToInitial(setGridDraft, setGridDraftBaseline);
      applyWorkspacePersistBaseline(
        getValues,
        setWorkspacePersistBaseline,
        INITIAL_LOCATION_GRID_DRAFT,
        buildingStairConnectionsRef,
        loc,
      );
      return;
    }
    let cancelled = false;
    hydrateDefaultLocationMapState(
      campaignId,
      activeFloorId,
      'floor',
      setValue,
      setGridDraft,
      setGridDraftBaseline,
    )
      .then((draft) => {
        if (cancelled) return;
        applyWorkspacePersistBaseline(
          getValues,
          setWorkspacePersistBaseline,
          draft,
          buildingStairConnectionsRef,
          loc,
        );
      })
      .catch(() => {
        if (cancelled) return;
        resetGridDraftToInitial(setGridDraft, setGridDraftBaseline);
        applyWorkspacePersistBaseline(
          getValues,
          setWorkspacePersistBaseline,
          INITIAL_LOCATION_GRID_DRAFT,
          buildingStairConnectionsRef,
          loc,
        );
      });
    return () => {
      cancelled = true;
    };
  }, [
    campaignId,
    activeFloorId,
    locationId,
    loc?.id,
    loc?.scale,
    loc?.source,
    setValue,
    getValues,
    setGridDraft,
    setGridDraftBaseline,
    buildingStairConnectionsRef,
    setWorkspacePersistBaseline,
  ]);
}
