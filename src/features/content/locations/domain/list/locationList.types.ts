import type { LocationSummary } from '../model/location';

export type LocationListRow = LocationSummary & { allowedInCampaign?: boolean };
