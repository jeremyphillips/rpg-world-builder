import type {
  LocationTransitionBase,
  LocationTransitionFrom,
  LocationTransitionKindId,
  LocationTransitionTo,
  LocationTransitionTraversal,
} from '@/shared/domain/locations';

export type LocationTransitionKind = LocationTransitionKindId;

export type { LocationTransitionFrom, LocationTransitionTo, LocationTransitionTraversal };

export type LocationTransition = LocationTransitionBase & { campaignId: string };
