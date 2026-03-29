/**
 * Location domain vocabulary: scale ordering, categories, connection kinds.
 */

/** Coarsest → finest; used for parent/child validation. */
export const LOCATION_SCALE_ORDER = [
  'world',
  'region',
  'subregion',
  'city',
  'district',
  'site',
  'building',
  'floor',
  'room',
] as const;

export const LOCATION_CATEGORY_IDS = [
  'world',
  'region',
  'subregion',
  'settlement',
  'site',
  'structure',
  'dungeon',
  'city',
  'district',
  'building',
  'floor',
  'room',
  'other',
] as const;

/** Matches persisted connection `kind` enum (CampaignLocation). */
export const LOCATION_CONNECTION_KIND_IDS = [
  'road',
  'river',
  'door',
  'stairs',
  'hall',
  'secret',
  'portal',
] as const;
