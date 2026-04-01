import { useEffect, type Dispatch, type SetStateAction } from 'react';
import type { UseFormSetValue } from 'react-hook-form';

import type { LocationFormValues } from '@/features/content/locations/domain';
import type { LocationContentItem } from '@/features/content/locations/domain/repo/locationRepo';
import type { LocationGridDraftState } from '@/features/content/locations/components/locationGridDraft.types';

import {
  hydrateDefaultLocationMapState,
  resetGridDraftToInitial,
} from '../hydrateDefaultLocationMap';

type UseLocationMapHydrationParams = {
  campaignId: string | null | undefined;
  locationId: string | null | undefined;
  loc: LocationContentItem | null;
  activeFloorId: string | null;
  setValue: UseFormSetValue<LocationFormValues>;
  setGridDraft: Dispatch<SetStateAction<LocationGridDraftState>>;
  setGridDraftBaseline: Dispatch<SetStateAction<LocationGridDraftState>>;
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
  setGridDraft,
  setGridDraftBaseline,
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
    ).catch(() => {
      if (cancelled) return;
      resetGridDraftToInitial(setGridDraft, setGridDraftBaseline);
    });
    return () => {
      cancelled = true;
    };
  }, [campaignId, locationId, loc?.scale, loc?.source, setValue, setGridDraft, setGridDraftBaseline]);

  useEffect(() => {
    if (!campaignId || !locationId || !loc || loc.source !== 'campaign') return;
    if (loc.scale !== 'building') return;
    if (!activeFloorId) {
      resetGridDraftToInitial(setGridDraft, setGridDraftBaseline);
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
    ).catch(() => {
      if (cancelled) return;
      resetGridDraftToInitial(setGridDraft, setGridDraftBaseline);
    });
    return () => {
      cancelled = true;
    };
  }, [
    campaignId,
    activeFloorId,
    locationId,
    loc?.scale,
    loc?.source,
    setValue,
    setGridDraft,
    setGridDraftBaseline,
  ]);
}
