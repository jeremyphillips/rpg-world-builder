/**
 * Campaign / system location content types.
 * Vocabulary (scale, connections, label shape) comes from shared/domain/locations — not redefined here.
 */
import type {
  LocationConnection,
  LocationLabel,
  LocationScaleId,
} from '@/shared/domain/locations';
import type {
  ContentId,
  ContentInput,
  ContentItem,
} from '@/features/content/shared/domain/types/content.types';

export type LocationId = ContentId;

export interface LocationFields {
  id: LocationId;
  name: string;
  description?: string;
  scale: LocationScaleId;
  category?: string;
  imageKey?: string | null;
  parentId?: string;
  ancestorIds?: string[];
  sortOrder?: number;
  label?: LocationLabel;
  aliases?: string[];
  tags?: string[];
  connections?: LocationConnection[];
}

export type Location = ContentItem & LocationFields;

/** List row: resolved location plus optional ruleset allow flag. */
export type LocationSummary = Location & { allowedInCampaign?: boolean };

export type LocationInput = ContentInput & Partial<LocationFields>;
