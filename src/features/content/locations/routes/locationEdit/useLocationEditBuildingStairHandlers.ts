import { useCallback, type Dispatch, type SetStateAction } from 'react';

import {
  connectionWouldDuplicateEndpoint,
  createVerticalStairConnection,
  findStairConnectionForEndpoint,
  getCounterpartStairEndpoint,
  LOCATION_MAP_STAIR_ENDPOINT_DEFAULT_DIRECTION,
  removeStairConnectionsInvolvingEndpoint,
  validateStairEndpointsCanPair,
  type LocationVerticalStairConnection,
  type LocationStairEndpointRef,
} from '@/shared/domain/locations';
import type { BuildingWorkspaceFloorItem } from '@/features/content/locations/domain/model/building/buildingWorkspaceFloors';
import type { LocationContentItem } from '@/features/content/locations/domain/repo/locationRepo';
import { patchFloorStairConnectionIdOnDefaultMap } from '@/features/content/locations/domain/model/building/patchFloorStairConnectionMap';

import type { LocationGridDraftState } from '@/features/content/locations/components';

import { applyRemovePlacedObjectToDraft } from './mapSessionDraft.helpers';

export type UseLocationEditBuildingStairHandlersParams = {
  campaignId: string | undefined;
  isBuildingWorkspace: boolean;
  activeFloorId: string | null;
  locationId: string | undefined;
  loc: LocationContentItem | null;
  floorChildren: BuildingWorkspaceFloorItem[];
  buildingStairConnections: LocationVerticalStairConnection[];
  setBuildingStairConnections: Dispatch<
    SetStateAction<LocationVerticalStairConnection[]>
  >;
  setGridDraft: Dispatch<SetStateAction<LocationGridDraftState>>;
};

/**
 * Building-scale stair link/unlink and placed-object removal that patches stair connections.
 * Session-shaped glue for {@link useLocationEditWorkspaceModel}; not generic domain rules.
 */
export function useLocationEditBuildingStairHandlers({
  campaignId,
  isBuildingWorkspace,
  activeFloorId,
  locationId,
  loc,
  floorChildren,
  buildingStairConnections,
  setBuildingStairConnections,
  setGridDraft,
}: UseLocationEditBuildingStairHandlersParams) {
  const handleRemovePlacedObject = useCallback(
    (cellId: string, objectId: string) => {
      if (campaignId && isBuildingWorkspace && activeFloorId) {
        const ref: LocationStairEndpointRef = {
          floorLocationId: activeFloorId,
          cellId,
          objectId,
        };
        let counterpart: LocationStairEndpointRef | undefined;
        setBuildingStairConnections((prev) => {
          const conn = findStairConnectionForEndpoint(prev, ref);
          counterpart = conn ? getCounterpartStairEndpoint(conn, ref) : undefined;
          return removeStairConnectionsInvolvingEndpoint(prev, ref);
        });
        if (counterpart) {
          void patchFloorStairConnectionIdOnDefaultMap(campaignId, counterpart, null);
        }
      }
      setGridDraft((prev) => applyRemovePlacedObjectToDraft(prev, cellId, objectId));
    },
    [campaignId, isBuildingWorkspace, activeFloorId, setBuildingStairConnections, setGridDraft],
  );

  const handleLinkStairPair = useCallback(
    async (
      localCellId: string,
      localObjectId: string,
      remoteFloorId: string,
      remoteCellId: string,
      remoteObjectId: string,
    ) => {
      if (!campaignId || !isBuildingWorkspace || !activeFloorId || !locationId || loc?.scale !== 'building') {
        return;
      }
      const allowed = new Set(floorChildren.map((f) => f.id));
      const a: LocationStairEndpointRef = {
        floorLocationId: activeFloorId,
        cellId: localCellId,
        objectId: localObjectId,
      };
      const b: LocationStairEndpointRef = {
        floorLocationId: remoteFloorId,
        cellId: remoteCellId,
        objectId: remoteObjectId,
      };
      const v = validateStairEndpointsCanPair(locationId, a, b, allowed);
      if (!v.ok) throw new Error(v.reason);
      if (connectionWouldDuplicateEndpoint(buildingStairConnections, a, b)) {
        throw new Error('One of these stair endpoints is already linked.');
      }
      const connectionId = crypto.randomUUID();
      const conn = createVerticalStairConnection(locationId, connectionId, a, b);
      setBuildingStairConnections((prev) => [...prev, conn]);
      setGridDraft((prev) => {
        const objs = prev.objectsByCellId[localCellId] ?? [];
        const nextObjs = objs.map((o) => {
          if (o.id !== localObjectId || o.kind !== 'stairs') return o;
          const base = o.stairEndpoint ?? { direction: LOCATION_MAP_STAIR_ENDPOINT_DEFAULT_DIRECTION };
          return {
            ...o,
            stairEndpoint: {
              direction: base.direction,
              connectionId,
            },
          };
        });
        return {
          ...prev,
          objectsByCellId: { ...prev.objectsByCellId, [localCellId]: nextObjs },
        };
      });
      await patchFloorStairConnectionIdOnDefaultMap(campaignId, a, connectionId);
      await patchFloorStairConnectionIdOnDefaultMap(campaignId, b, connectionId);
    },
    [
      campaignId,
      isBuildingWorkspace,
      activeFloorId,
      locationId,
      loc?.scale,
      floorChildren,
      buildingStairConnections,
      setBuildingStairConnections,
      setGridDraft,
    ],
  );

  const handleUnlinkStairEndpoint = useCallback(
    async (localCellId: string, localObjectId: string) => {
      if (!campaignId || !activeFloorId) return;
      const ref: LocationStairEndpointRef = {
        floorLocationId: activeFloorId,
        cellId: localCellId,
        objectId: localObjectId,
      };
      let counterpart: LocationStairEndpointRef | undefined;
      setBuildingStairConnections((prev) => {
        const conn = findStairConnectionForEndpoint(prev, ref);
        counterpart = conn ? getCounterpartStairEndpoint(conn, ref) : undefined;
        return removeStairConnectionsInvolvingEndpoint(prev, ref);
      });
      setGridDraft((prev) => {
        const objs = prev.objectsByCellId[localCellId] ?? [];
        const nextObjs = objs.map((o) => {
          if (o.id !== localObjectId || o.kind !== 'stairs') return o;
          const base = o.stairEndpoint ?? { direction: LOCATION_MAP_STAIR_ENDPOINT_DEFAULT_DIRECTION };
          return {
            ...o,
            stairEndpoint: {
              direction: base.direction,
              ...(base.targetLocationId?.trim() ? { targetLocationId: base.targetLocationId.trim() } : {}),
            },
          };
        });
        return {
          ...prev,
          objectsByCellId: { ...prev.objectsByCellId, [localCellId]: nextObjs },
        };
      });
      if (counterpart) {
        await patchFloorStairConnectionIdOnDefaultMap(campaignId, counterpart, null);
      }
    },
    [campaignId, activeFloorId, setBuildingStairConnections, setGridDraft],
  );

  return {
    handleRemovePlacedObject,
    handleLinkStairPair,
    handleUnlinkStairEndpoint,
  };
}
