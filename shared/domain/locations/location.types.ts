import type {
  ALL_LOCATION_SCALE_IDS,
  CAMPAIGN_LOCATION_LIST_SCALE_IDS,
  CONTENT_LOCATION_SCALE_IDS,
  INTERIOR_CONTENT_LOCATION_SCALE_IDS,
  LOCATION_CATEGORY_IDS,
  LOCATION_CONNECTION_KIND_IDS,
  LOCATION_MAP_ZONE_KIND_IDS,
  LOCATION_SCALE_RANK_ORDER_LEGACY,
  SURFACE_CONTENT_LOCATION_SCALE_IDS,
} from './location.constants';

/** Any campaign location scale (first-class content + legacy map-zone-as-location). */
export type LocationScaleId = (typeof ALL_LOCATION_SCALE_IDS)[number];

/** First-class content location scales only (no region/subregion/district). */
export type ContentLocationScaleId = (typeof CONTENT_LOCATION_SCALE_IDS)[number];

/** Map subdivisions within a parent map — not standalone content scales for new authoring. */
export type LocationMapZoneKindId = (typeof LOCATION_MAP_ZONE_KIND_IDS)[number];

/** @deprecated Use {@link LocationMapZoneKindId}. */
export type LegacyMapZoneLocationScaleId = LocationMapZoneKindId;

export type CampaignLocationListScaleId = (typeof CAMPAIGN_LOCATION_LIST_SCALE_IDS)[number];

/** Standalone create + top-level campaign surface list (world, city, site, building). */
export type SurfaceLocationContentScaleId = (typeof SURFACE_CONTENT_LOCATION_SCALE_IDS)[number];

/** Floor and room under a building (interior UX). */
export type InteriorLocationScaleId = (typeof INTERIOR_CONTENT_LOCATION_SCALE_IDS)[number];

export type LocationCategoryId = (typeof LOCATION_CATEGORY_IDS)[number];

export type LocationConnectionKindId = (typeof LOCATION_CONNECTION_KIND_IDS)[number];

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
