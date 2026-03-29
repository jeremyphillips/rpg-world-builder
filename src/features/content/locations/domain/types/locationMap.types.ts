import type {
  LocationMapBase,
  LocationMapCell,
  LocationMapGrid,
  LocationMapKindId,
} from '@/shared/domain/locations';

export type LocationMapKind = LocationMapKindId;

export type { LocationMapCell, LocationMapGrid, LocationMapKindId };

export type LocationMap = LocationMapBase & { campaignId: string };
