import { useEffect, useMemo, useState } from 'react';

import type { Location } from '@/features/content/locations/domain/model/location';
import type { LocationMapBase } from '@/shared/domain/locations';
import {
  collectBuildingLocationIdsLinkedOnMaps,
  isLocationMapHostScaleForBuildingLink,
} from '@/features/content/locations/domain/authoring/editor/buildingLinkPlacement';
import { listLocationMaps } from '@/features/content/locations/domain/repo/locationMapRepo';
import { deriveBuildingCityLinkStatusForWorkspace } from '@/shared/domain/locations';

type Args = {
  campaignId: string | undefined;
  cityLocationId: string | undefined;
  locations: Location[];
  enabled: boolean;
};

/**
 * City editor: buildings whose parent is this city + linkage health vs city maps / campaign map links.
 */
export function useCityWorkspaceBuildingLinkage({
  campaignId,
  cityLocationId,
  locations,
  enabled,
}: Args): {
  loading: boolean;
  rows: { building: Location; status: ReturnType<typeof deriveBuildingCityLinkStatusForWorkspace> }[];
  warningSummaries: string[];
  hasAnyBuildingChild: boolean;
} {
  const [loading, setLoading] = useState(false);
  const [hostMaps, setHostMaps] = useState<LocationMapBase[]>([]);
  const [allMapsFlat, setAllMapsFlat] = useState<LocationMapBase[]>([]);

  const campaignLocs = useMemo(
    () => locations.filter((l): l is Location & { source: 'campaign' } => l.source === 'campaign'),
    [locations],
  );

  const locationsById = useMemo(
    () => new Map(campaignLocs.map((l) => [l.id, l] as const)),
    [campaignLocs],
  );

  const hostIdsToFetch = useMemo(() => {
    const s = new Set<string>();
    for (const l of campaignLocs) {
      if (isLocationMapHostScaleForBuildingLink(l.scale)) s.add(l.id);
    }
    if (cityLocationId) s.add(cityLocationId);
    return [...s];
  }, [campaignLocs, cityLocationId]);

  useEffect(() => {
    if (!enabled || !campaignId || !cityLocationId?.trim()) {
      setHostMaps([]);
      setAllMapsFlat([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const mapLists = await Promise.all(
          hostIdsToFetch.map((hostId) => listLocationMaps(campaignId, hostId)),
        );
        if (cancelled) return;
        const all = mapLists.flat();
        setAllMapsFlat(all);
        const idx = hostIdsToFetch.indexOf(cityLocationId);
        setHostMaps(idx >= 0 ? mapLists[idx] ?? [] : []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, campaignId, cityLocationId, hostIdsToFetch]);

  const linkedOnThisCity = useMemo(
    () => collectBuildingLocationIdsLinkedOnMaps(hostMaps, locationsById),
    [hostMaps, locationsById],
  );

  const linkedAnywhere = useMemo(
    () => collectBuildingLocationIdsLinkedOnMaps(allMapsFlat, locationsById),
    [allMapsFlat, locationsById],
  );

  const buildingChildren = useMemo(
    () => campaignLocs.filter((l) => l.scale === 'building' && l.parentId === cityLocationId),
    [campaignLocs, cityLocationId],
  );

  const rows = useMemo(
    () =>
      buildingChildren.map((b) => ({
        building: b,
        status: deriveBuildingCityLinkStatusForWorkspace({
          cityHostLocationId: cityLocationId!,
          building: b,
          linkedOnThisCityHost: linkedOnThisCity,
          linkedAnywhereInCampaign: linkedAnywhere,
        }),
      })),
    [buildingChildren, cityLocationId, linkedOnThisCity, linkedAnywhere],
  );

  const warningSummaries = useMemo(() => {
    const msgs: string[] = [];
    const hasNeeds = rows.some((r) => r.status.status === 'needsPlacement');
    const hasConflict = rows.some((r) => r.status.status === 'conflict');
    if (hasNeeds) {
      msgs.push(
        'Some buildings list this city as their parent but are not placed on the city map yet. Place them from the map to finish linking.',
      );
    }
    if (hasConflict) {
      msgs.push(
        'Some buildings have map placement that does not match their parent. Review building parents and map links.',
      );
    }
    return msgs;
  }, [rows]);

  return {
    loading,
    rows,
    warningSummaries,
    hasAnyBuildingChild: buildingChildren.length > 0,
  };
}
