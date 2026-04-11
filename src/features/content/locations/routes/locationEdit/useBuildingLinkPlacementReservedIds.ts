import { useEffect, useMemo, useState } from 'react';

import type { Location } from '@/features/content/locations/domain/model/location';
import {
  collectBuildingLocationIdsLinkedElsewhere,
  collectBuildingLocationIdsLinkedOnMaps,
  isLocationMapHostScaleForBuildingLink,
} from '@/features/content/locations/domain/authoring/editor/buildingLinkPlacement';
import { listLocationMaps } from '@/features/content/locations/domain/repo/locationMapRepo';

type Args = {
  campaignId: string | undefined;
  locations: Location[];
  mapHostLocationId: string;
  mapHostScale: string;
  currentCellId: string;
  /** When false, skip network work (e.g. not linking to a building). */
  enabled: boolean;
};

/**
 * Loads maps for all city/site campaign locations and returns building ids already linked on another cell,
 * excluding `(currentMap for mapHostLocationId, currentCellId)`, plus index sets for linkage UX.
 */
export function useBuildingLinkPlacementReservedIds({
  campaignId,
  locations,
  mapHostLocationId,
  mapHostScale,
  currentCellId,
  enabled,
}: Args): {
  reservedBuildingIds: Set<string>;
  /** Building ids linked on any cell of maps for `mapHostLocationId` */
  linkedOnCurrentHostBuildingIds: Set<string>;
  /** Building ids linked on any city/site map cell in the campaign */
  linkedAnywhereBuildingIds: Set<string>;
  isLoading: boolean;
} {
  const [reservedBuildingIds, setReservedBuildingIds] = useState<Set<string>>(new Set());
  const [linkedOnCurrentHostBuildingIds, setLinkedOnCurrentHostBuildingIds] = useState<Set<string>>(
    new Set(),
  );
  const [linkedAnywhereBuildingIds, setLinkedAnywhereBuildingIds] = useState<Set<string>>(
    new Set(),
  );
  const [isLoading, setIsLoading] = useState(false);

  const campaignLocations = useMemo(
    () => locations.filter((l): l is Location & { source: 'campaign' } => l.source === 'campaign'),
    [locations],
  );

  const locationsById = useMemo(
    () => new Map(campaignLocations.map((l) => [l.id, l] as const)),
    [campaignLocations],
  );

  const mapHostIdsToScan = useMemo(() => {
    const ids = new Set<string>();
    for (const l of campaignLocations) {
      if (isLocationMapHostScaleForBuildingLink(l.scale)) ids.add(l.id);
    }
    return [...ids];
  }, [campaignLocations]);

  useEffect(() => {
    if (
      !enabled ||
      !campaignId ||
      !isLocationMapHostScaleForBuildingLink(mapHostScale) ||
      !currentCellId.trim()
    ) {
      setReservedBuildingIds(new Set());
      setLinkedOnCurrentHostBuildingIds(new Set());
      setLinkedAnywhereBuildingIds(new Set());
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    (async () => {
      try {
        const mapLists = await Promise.all(
          mapHostIdsToScan.map((hostId) => listLocationMaps(campaignId, hostId)),
        );
        if (cancelled) return;
        const allMaps = mapLists.flat();
        setLinkedAnywhereBuildingIds(collectBuildingLocationIdsLinkedOnMaps(allMaps, locationsById));

        const hostIdx = mapHostIdsToScan.indexOf(mapHostLocationId);
        const hostMaps = hostIdx >= 0 ? mapLists[hostIdx] ?? [] : [];
        setLinkedOnCurrentHostBuildingIds(
          collectBuildingLocationIdsLinkedOnMaps(hostMaps, locationsById),
        );

        const currentMaps = await listLocationMaps(campaignId, mapHostLocationId);
        if (cancelled) return;
        const currentMap = currentMaps.find((m) => m.isDefault) ?? currentMaps[0];
        if (!currentMap) {
          setReservedBuildingIds(new Set());
          return;
        }

        const next = collectBuildingLocationIdsLinkedElsewhere(
          allMaps,
          locationsById,
          currentMap.id,
          currentCellId,
        );
        setReservedBuildingIds(next);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    enabled,
    campaignId,
    mapHostLocationId,
    mapHostScale,
    currentCellId,
    mapHostIdsToScan,
    locationsById,
  ]);

  return {
    reservedBuildingIds,
    linkedOnCurrentHostBuildingIds,
    linkedAnywhereBuildingIds,
    isLoading,
  };
}
