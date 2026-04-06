/**
 * Location domain vocabulary: scale ordering, categories, connection kinds.
 *
 * **First-class content location scales** (`CONTENT_LOCATION_SCALE_IDS`): persisted location kinds for new authoring
 * (world, city, site, building, floor, room). These are **not** map-zone subdivisions.
 *
 * **Surface vs interior (content):**
 * - `SURFACE_CONTENT_LOCATION_SCALE_IDS` — outdoor / campaign-surface scales (world, city, site, building).
 * - `INTERIOR_CONTENT_LOCATION_SCALE_IDS` — floor, room (building workspace / interior UX).
 *
 * **Map zone kinds** (`LOCATION_MAP_ZONE_KIND_IDS`): authored subdivisions **within** a parent map (`region`, `subregion`,
 * `district`) — **not** standalone creatable content scales for new location authoring. May still appear as legacy
 * persisted `location.scale` values.
 *
 * **Campaign list filter scales** (`CAMPAIGN_LOCATION_LIST_SCALE_IDS`): includes legacy zone-like ids so filters can
 * match old rows — does **not** imply those ids are valid new content scales.
 *
 * **Ranking / sort** of any persisted scale: `LOCATION_SCALE_RANK_ORDER_LEGACY` (includes legacy ids for stable sort).
 *
 * Explicit parent rules: `locationScale.policy.ts`. Map cell authoring: `locationMapPlacement.policy.ts`.
 */

/**
 * Scales that remain first-class **content locations** (field policy, edit display, hierarchy).
 * Does **not** include `region` / `subregion` / `district` (those are {@link LOCATION_MAP_ZONE_KIND_IDS}).
 */
export const CONTENT_LOCATION_SCALE_IDS = [
  'world',
  'city',
  'site',
  'building',
  'floor',
  'room',
] as const;

/**
 * **Interior** content scales — floors and rooms under a building. Not offered in standalone “new location”
 * flows; use building edit + floor strip / interior UX.
 */
export const INTERIOR_CONTENT_LOCATION_SCALE_IDS = ['floor', 'room'] as const;

/**
 * **Surface / campaign** content scales — world, city, site, building. Standalone create + main location list.
 */
export const SURFACE_CONTENT_LOCATION_SCALE_IDS = [
  'world',
  'city',
  'site',
  'building',
] as const;

/**
 * Authored map subdivisions / sections within a parent map — **not** first-class content location scales.
 * Prefer MapZone authoring on the parent map for new work; these ids may still exist on legacy persisted locations.
 */
export const LOCATION_MAP_ZONE_KIND_IDS = ['region', 'subregion', 'district'] as const;

/**
 * Campaign location **list filter** scale ids (excludes interior floor/room), **including** legacy zone-like scales
 * so filters match historical persisted rows. Do **not** treat region/subregion/district as creatable content scales.
 * Same coarse order as {@link LOCATION_SCALE_RANK_ORDER_LEGACY} minus {@link INTERIOR_CONTENT_LOCATION_SCALE_IDS}.
 */
export const CAMPAIGN_LOCATION_LIST_SCALE_IDS = [
  'world',
  'region',
  'subregion',
  'city',
  'district',
  'site',
  'building',
] as const;

/** All scale ids that may appear in API/DB (content + legacy map-zone-as-location). */
export const ALL_LOCATION_SCALE_IDS = [...CONTENT_LOCATION_SCALE_IDS, ...LOCATION_MAP_ZONE_KIND_IDS] as const;

/**
 * Canonical coarsest → finest order for **first-class content** locations only (new UI lists that should not imply
 * legacy scales are creatable).
 */
export const LOCATION_SCALE_ORDER = CONTENT_LOCATION_SCALE_IDS;

/**
 * Sorting/ranking only for persisted legacy rows that still use historical scale ids (including region, subregion,
 * district). Do **not** use this to imply creatable content scales for new authoring.
 */
export const LOCATION_SCALE_RANK_ORDER_LEGACY = [
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
