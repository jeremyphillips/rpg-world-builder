/**
 * Location domain vocabulary: scale ordering, categories, connection kinds.
 *
 * `LOCATION_SCALE_ORDER` is the generic ranking (broader ↔ finer). Explicit parent rules
 * live in `locationScale.policy.ts` (`ALLOWED_PARENT_SCALES_BY_SCALE`); do not infer allowed
 * parents from order alone.
 *
 * Map cell authoring (linked locations + objects on a cell) uses `locationMapPlacement.policy.ts`
 * — separate from parent-scale policy and from generic ordering.
 *
 * MapZone (see `zones/`): long-term, **region**, **subregion**, and **district** are intended to
 * move from “first-class linked location targets” toward **painted named zones** on parent maps.
 * They remain in `LOCATION_SCALE_ORDER` for legacy ranking, persisted locations, and UI until
 * migration phases complete — do not infer product intent from order alone.
 */

/** Coarsest → finest; structural ordering for generic comparisons (`locationScale.rules.ts`). */
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
  'wilderness',
  'settlement',
  'district',
  'landmark',
  'structure',
  'interior',
  'dungeon',
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
