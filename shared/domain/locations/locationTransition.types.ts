import { LOCATION_TRANSITION_KIND_IDS } from './locationTransition.constants';

export type LocationTransitionKindId = (typeof LOCATION_TRANSITION_KIND_IDS)[number];

export type LocationTransitionFrom = {
  mapId: string;
  cellId: string;
};

export type LocationTransitionTo = {
  locationId: string;
  mapId?: string;
  targetCellId?: string;
  spawnCellId?: string;
};

export type LocationTransitionTraversal = {
  bidirectional?: boolean;
  locked?: boolean;
  dc?: number;
  keyItemId?: string;
};

/** Transition fields shared by client and API (no campaign scope). */
export type LocationTransitionBase = {
  id: string;
  from: LocationTransitionFrom;
  to: LocationTransitionTo;
  kind: LocationTransitionKindId;
  label?: string;
  traversal?: LocationTransitionTraversal;
};
