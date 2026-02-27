/**
 * Canonical Race types.
 *
 * Extends the generic ContentItem interfaces with race-specific fields.
 * These replace the legacy `Race` interface in `src/data/types.ts`.
 */
import type {
  ContentId,
  ContentSource,
  ContentSummary,
  ContentItem,
  ContentInput,
} from './content.types';

export type RaceId = ContentId;

export interface RaceSummary extends ContentSummary {
  /** Setting restrictions (legacy, carried forward for compatibility) */
  campaigns?: string[];
}

export interface Race extends ContentItem {
  campaigns?: string[];
}

export interface RaceInput extends ContentInput {
  campaigns?: string[];
}

/** Build a Race from the system catalog data (no DB fields). */
export function toSystemRace(raw: {
  id: string;
  name: string;
  description: string;
  campaigns?: string[];
}): Race {
  return {
    ...raw,
    source: 'system' as ContentSource,
  };
}
