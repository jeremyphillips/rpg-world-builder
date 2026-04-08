import type { Location } from '@/features/content/locations/domain/model/location';
import type { LocationVerticalStairConnection } from '@/shared/domain/locations';

/** Floor list for stair target picker (sibling floors under the same building, excluding the map’s floor). */
export type StairWorkspaceInspect = {
  currentFloorLocationId: string;
  candidateTargetFloors: { id: string; label: string }[];
};

/**
 * Building workspace: canonical stair pairing API + resolver inputs.
 * **Traversal** is not implemented — pairing persistence only.
 */
export type StairPairingContext = {
  connections: LocationVerticalStairConnection[];
  campaignId: string;
  locations: Location[];
  onLink: (
    localCellId: string,
    localObjectId: string,
    remoteFloorId: string,
    remoteCellId: string,
    remoteObjectId: string,
  ) => Promise<void>;
  onUnlink: (localCellId: string, localObjectId: string) => Promise<void>;
};
