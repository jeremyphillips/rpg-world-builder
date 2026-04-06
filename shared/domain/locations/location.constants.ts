/**
 * Location domain vocabulary: scale ordering, categories, connection kinds.
 *
 * **Quick reference — which constant for which job:**
 *
 * | Intent | Use |
 * |--------|-----|
 * | New location authoring (forms, field policy, creatable scales) | {@link CONTENT_LOCATION_SCALE_IDS} and groupings {@link SURFACE_CONTENT_LOCATION_SCALE_IDS} / {@link INTERIOR_CONTENT_LOCATION_SCALE_IDS} |
 * | Map subdivisions (not persisted as standalone location “kind” for new work) | {@link LOCATION_MAP_ZONE_KIND_IDS} — prefer **MapZone** on parent maps |
 * | Persisted/API `location.scale` typing (may include legacy zone-as-scale rows) | {@link LOCATION_SCALE_IDS_WITH_LEGACY} → `LocationScaleId` in `location.types.ts` |
 * | Campaign **list filter chips** (match old rows incl. legacy scales) | {@link CAMPAIGN_LOCATION_LIST_SCALE_IDS} — **UI filter convenience only**, not “recommended creatable” set |
 * | **Sort / rank** persisted locations or scales in legacy order | {@link LOCATION_SCALE_RANK_ORDER_LEGACY} **only** — not for inferring valid parents or new authoring |
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
 * **Campaign list UI: filter chips only.** Scale ids a user can filter the location list by — includes
 * `region` / `subregion` / `district` so **legacy persisted** rows remain discoverable.
 * Does **not** define creatable scales for new authoring (see {@link CONTENT_LOCATION_SCALE_IDS}).
 * Excludes floor/room (those live under building UX). Order matches list UX expectations, not {@link LOCATION_SCALE_RANK_ORDER_LEGACY}.
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

/**
 * **Expanded compatibility set** — **not** synonymous with “all scales we recommend for new authoring.”
 * First-class content scales {@link CONTENT_LOCATION_SCALE_IDS} plus historical scale-like ids
 * {@link LOCATION_MAP_ZONE_KIND_IDS} (`region`, `subregion`, `district`) that may still appear on persisted locations.
 * Use for API/DB validation, `LocationScaleId` typing, and **read-only** UI that must reflect legacy rows
 * (e.g. edit form scale display). For **new authoring** (create flow, field policy), use
 * {@link CONTENT_LOCATION_SCALE_IDS} or {@link SURFACE_CONTENT_LOCATION_SCALE_IDS} instead.
 *
 * {@link LOCATION_SCALE_RANK_ORDER_LEGACY} is a separate concern: sorting/ranking bridge for persisted rows only.
 */
export const LOCATION_SCALE_IDS_WITH_LEGACY = [...CONTENT_LOCATION_SCALE_IDS, ...LOCATION_MAP_ZONE_KIND_IDS] as const;

/**
 * Canonical coarsest → finest order for **first-class content** locations only (new UI lists that should not imply
 * legacy scales are creatable).
 */
export const LOCATION_SCALE_ORDER = CONTENT_LOCATION_SCALE_IDS;

/**
 * **Sorting / ranking bridge only** (coarse structural order for persisted data). Includes `region`, `subregion`,
 * `district` so mixed legacy + modern rows sort stably. Does **not** imply creatable scales, valid parent/child pairs,
 * or placement eligibility — use `scale/locationScale.policy.ts` for parent rules.
 * Prefer `isContentLocationScaleId` in `scale/locationScale.rules.ts` when checking “first-class content scale.”
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
