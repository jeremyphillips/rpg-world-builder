import { useEffect, useMemo, useRef, useState } from 'react';

import { listCampaignLocations } from '@/features/content/locations/domain/repo/locationRepo';
import type { Location } from '@/features/content/locations/domain/types';
import { buildParentLocationPickerOptions } from '@/features/content/locations/domain/forms/utils/parentLocationPickerOptions';
import { getFilteredParentLocationsForChildScale } from '@/features/content/locations/domain/forms/utils/locationFormUiRules';

/**
 * Campaign locations + derived parent-picker options filtered by child scale (shared create/edit).
 */
export function useLocationFormCampaignData(
  campaignId: string | undefined,
  childScale: string,
  excludeLocationId?: string,
  /** Increment to refetch campaign locations (e.g. after creating a child floor). */
  refreshKey?: number,
) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loaded, setLoaded] = useState(false);
  const fetchGeneration = useRef(0);

  useEffect(() => {
    if (!campaignId) {
      return;
    }
    const gen = ++fetchGeneration.current;
    // Reset snapshot when switching campaigns so world/parent rules don't use stale data.
    /* eslint-disable react-hooks/set-state-in-effect -- intentional reset before async list fetch */
    setLoaded(false);
    setLocations([]);
    /* eslint-enable react-hooks/set-state-in-effect */
    let cancelled = false;
    listCampaignLocations(campaignId).then((locs) => {
      if (cancelled || gen !== fetchGeneration.current) return;
      setLocations(locs);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [campaignId, refreshKey]);

  const campaignLocations = useMemo(
    () => (campaignId ? locations : []),
    [campaignId, locations],
  );
  /** True until the first successful list fetch for the current campaignId (when campaignId is set). */
  const loading = Boolean(campaignId) && !loaded;

  const campaignHasWorldLocation = useMemo(
    () => campaignLocations.some((l) => l.scale === 'world'),
    [campaignLocations],
  );

  const parentLocationOptions = useMemo(() => {
    const filtered = getFilteredParentLocationsForChildScale(
      campaignLocations,
      childScale,
      excludeLocationId,
    );
    return buildParentLocationPickerOptions(filtered, {});
  }, [campaignLocations, childScale, excludeLocationId]);

  return {
    locations: campaignLocations,
    loading,
    campaignHasWorldLocation,
    parentLocationOptions,
  };
}
