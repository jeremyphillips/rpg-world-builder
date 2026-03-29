import {
  LOCATION_CATEGORY_IDS,
  LOCATION_CONNECTION_KIND_IDS,
  LOCATION_SCALE_ORDER,
} from './location.constants';

export type LocationScaleId = (typeof LOCATION_SCALE_ORDER)[number];

export type LocationCategoryId = (typeof LOCATION_CATEGORY_IDS)[number];

export type LocationConnectionKindId = (typeof LOCATION_CONNECTION_KIND_IDS)[number];

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
