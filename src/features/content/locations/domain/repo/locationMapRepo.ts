/**
 * Campaign location maps API — grid lives on LocationMap, not on Location.
 */
import { apiFetch } from '@/app/api';
import type { LocationMapBase } from '@/shared/domain/locations';

export async function listLocationMaps(
  campaignId: string,
  locationId: string,
): Promise<LocationMapBase[]> {
  const data = await apiFetch<{ maps: LocationMapBase[] }>(
    `/api/campaigns/${campaignId}/locations/${locationId}/maps`,
  );
  return data.maps ?? [];
}

export async function createLocationMap(
  campaignId: string,
  locationId: string,
  body: Record<string, unknown>,
): Promise<LocationMapBase> {
  const data = await apiFetch<{ map: LocationMapBase }>(
    `/api/campaigns/${campaignId}/locations/${locationId}/maps`,
    { method: 'POST', body },
  );
  return data.map;
}

export async function updateLocationMap(
  campaignId: string,
  locationId: string,
  mapId: string,
  body: Record<string, unknown>,
): Promise<LocationMapBase> {
  const data = await apiFetch<{ map: LocationMapBase }>(
    `/api/campaigns/${campaignId}/locations/${locationId}/maps/${encodeURIComponent(mapId)}`,
    { method: 'PATCH', body },
  );
  return data.map;
}
