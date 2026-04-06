import type {
  CAMPAIGN_LOCATION_LIST_SCALE_IDS,
  CONTENT_LOCATION_SCALE_IDS,
  INTERIOR_CONTENT_LOCATION_SCALE_IDS,
  LOCATION_CATEGORY_IDS,
  LOCATION_CONNECTION_KIND_IDS,
  LOCATION_MAP_ZONE_KIND_IDS,
  LOCATION_SCALE_IDS_WITH_LEGACY,
  LOCATION_SCALE_RANK_ORDER_LEGACY,
  SURFACE_CONTENT_LOCATION_SCALE_IDS,
} from './location.constants';

/**
 * Persisted `location.scale` and API scale string — **compatibility union** (see `LOCATION_SCALE_IDS_WITH_LEGACY`).
 * Includes legacy `region` / `subregion` / `district` rows; not every member is a creatable scale in new authoring.
 * For first-class content scales only, use `ContentLocationScaleId` / `CONTENT_LOCATION_SCALE_IDS`.
 */
export type LocationScaleId = (typeof LOCATION_SCALE_IDS_WITH_LEGACY)[number];

/** First-class content location scales only — **new authoring** vocabulary (no region/subregion/district). */
export type ContentLocationScaleId = (typeof CONTENT_LOCATION_SCALE_IDS)[number];

/** Map subdivisions within a parent map — not standalone content scales for new authoring. */
export type LocationMapZoneKindId = (typeof LOCATION_MAP_ZONE_KIND_IDS)[number];

/** @deprecated Use {@link LocationMapZoneKindId}. */
export type LegacyMapZoneLocationScaleId = LocationMapZoneKindId;

/**
 * Scales exposed as **campaign list filter** chips — superset of creatable scales for legacy row matching.
 * See `CAMPAIGN_LOCATION_LIST_SCALE_IDS` in `location.constants.ts`.
 */
export type CampaignLocationListScaleId = (typeof CAMPAIGN_LOCATION_LIST_SCALE_IDS)[number];

/** Standalone create + top-level campaign surface list (world, city, site, building). */
export type SurfaceLocationContentScaleId = (typeof SURFACE_CONTENT_LOCATION_SCALE_IDS)[number];

/** Floor and room under a building (interior UX). */
export type InteriorLocationScaleId = (typeof INTERIOR_CONTENT_LOCATION_SCALE_IDS)[number];

export type LocationCategoryId = (typeof LOCATION_CATEGORY_IDS)[number];

export type LocationConnectionKindId = (typeof LOCATION_CONNECTION_KIND_IDS)[number];

/** Member of {@link LOCATION_SCALE_RANK_ORDER_LEGACY} — for sorting/ranking only. */
export type LocationScaleRankOrderLegacy = (typeof LOCATION_SCALE_RANK_ORDER_LEGACY)[number];

/** Display label block (short title / numbering) used by campaign locations. */
export type LocationLabel = {
  short?: string;
  number?: string;
};

export type LocationConnection = {
  toId: string;
  kind: LocationConnectionKindId;
  bidirectional?: boolean;
  locked?: boolean;
  dc?: number;
  keyItemId?: string;
};
