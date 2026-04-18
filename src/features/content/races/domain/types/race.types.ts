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

import type { RaceDefinitionGroup } from './race-definitions.types';
import type { RaceGrants } from './race-grants.types';

export type RaceId = ContentId;

export interface RaceFields {
  id: RaceId;
  name: string;
  description: string;
  imageKey?: string | null;
  /** Setting restrictions (legacy, carried forward for compatibility) */
  campaigns?: string[];
  /** Ongoing capabilities (senses, traits, …). Traceable in {@link import('@/features/content/shared/domain/vocab/creatureSenses.types').CreatureSense} `source`. */
  grants?: RaceGrants;
  /**
   * Lineage / ancestry / ancestor picks. Vocabulary aligns with class `SubclassSelection` (selectionLevel, options, per-option features)—separate types, same field names.
   */
  definitionGroups?: readonly RaceDefinitionGroup[];
}

export type Race = ContentItem & RaceFields;

export type RaceSummary = ContentSummary & RaceFields & {
  /** Whether this race is enabled for the campaign (from content rule). */
  allowedInCampaign?: boolean;
};

export type RaceInput = ContentInput & Partial<RaceFields>;
