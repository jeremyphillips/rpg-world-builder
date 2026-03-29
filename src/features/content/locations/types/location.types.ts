import type { AccessPolicy } from '@/shared/domain/accessPolicy';
import type {
  LocationConnection,
  LocationConnectionKindId,
  LocationLabel,
  LocationScaleId,
} from '@/shared/domain/locations';

/**
 * User-authored location (normalized). `scale` is required for hierarchy and UI.
 * Use `category` for high-level classification (not `kind`).
 */
export type LocationScale = LocationScaleId;

export type LocationConnectionKind = LocationConnectionKindId;

export type { LocationConnection, LocationConnectionKindId, LocationLabel, LocationScaleId };

export type Location = {
  id: string;
  campaignId: string;
  name: string;
  scale: LocationScale;
  category?: string;
  description?: string;
  imageKey?: string | null;
  accessPolicy?: AccessPolicy;
  parentId?: string;
  ancestorIds?: string[];
  sortOrder?: number;
  label?: LocationLabel;
  aliases?: string[];
  tags?: string[];
  connections?: LocationConnection[];
};
