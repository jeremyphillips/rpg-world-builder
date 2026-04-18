/**
 * Canonical Race content types.
 *
 * Follows the same pattern as Weapon / Armor / Gear:
 * - RaceFields = domain-specific fields
 * - Race = ContentItem & RaceFields
 */

import type {
  ContentId,
  ContentSummary,
  ContentItem,
  ContentInput,
} from '@/features/content/shared/domain/types/content.types';
import type { CreatureSense } from '@/features/content/shared/domain/vocab/creatureSenses.types';

export type RaceId = ContentId;

export interface RaceFields {
  id: RaceId;
  name: string;
  description: string;
  imageKey?: string | null;
  /** Setting restrictions (legacy, carried forward for compatibility) */
  campaigns?: string[];
  /** Structured grants (senses, future: other). Traceable in {@link CreatureSense} `source`. */
  grants?: {
    senses?: readonly CreatureSense[];
  };
}

export type Race = ContentItem & RaceFields;

export type RaceSummary = ContentSummary & RaceFields & {
  /** Whether this race is enabled for the campaign (from content rule). */
  allowedInCampaign?: boolean;
};

export type RaceInput = ContentInput & Partial<RaceFields>;
