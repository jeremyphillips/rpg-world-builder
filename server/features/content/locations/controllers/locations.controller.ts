import type { Request, Response } from 'express';
import type { CampaignViewerContext } from '../../../../shared/auth/resolveCampaignViewerContext';
import * as locationsService from '../services/locations.service';
import * as locationMapsService from '../services/locationMaps.service';
import * as locationTransitionsService from '../services/locationTransitions.service';
import { canViewContent } from '../../../../../shared/domain/capabilities';

type CampaignScopedRequest = Request & { viewerContext?: CampaignViewerContext };

function pid(req: Request, key: string): string {
  return String(req.params[key]);
}

export async function listLocations(req: CampaignScopedRequest, res: Response) {
  const campaignId = pid(req, 'id');
  const all = await locationsService.listLocationsByCampaign(campaignId);
  const ctx = req.viewerContext!;
  const locations = all.filter((loc) => canViewContent(ctx, loc.accessPolicy));
  res.json({ locations });
}

export async function getLocation(req: CampaignScopedRequest, res: Response) {
  const campaignId = pid(req, 'id');
  const locationId = pid(req, 'locationId');
  const location = await locationsService.getLocationById(campaignId, locationId);
  if (!location) {
    res.status(404).json({ error: 'Location not found' });
    return;
  }
  if (!canViewContent(req.viewerContext!, location.accessPolicy)) {
    res.status(404).json({ error: 'Location not found' });
    return;
  }
  res.json({ location });
}

export async function createLocation(req: CampaignScopedRequest, res: Response) {
  const campaignId = pid(req, 'id');
  const result = await locationsService.createLocation(campaignId, req.body);
  if ('errors' in result) {
    res.status(400).json({ errors: result.errors });
    return;
  }
  res.status(201).json({ location: result.location });
}

export async function updateLocation(req: CampaignScopedRequest, res: Response) {
  const campaignId = pid(req, 'id');
  const locationId = pid(req, 'locationId');
  const result = await locationsService.updateLocation(campaignId, locationId, req.body);
  if (!result) {
    res.status(404).json({ error: 'Location not found' });
    return;
  }
  if ('errors' in result) {
    res.status(400).json({ errors: result.errors });
    return;
  }
  res.json({ location: result.location });
}

export async function deleteLocation(req: CampaignScopedRequest, res: Response) {
  const campaignId = pid(req, 'id');
  const locationId = pid(req, 'locationId');
  const result = await locationsService.deleteLocation(campaignId, locationId);
  if ('errors' in result) {
    const isNotFound = result.errors.some((e) => e.code === 'NOT_FOUND');
    res.status(isNotFound ? 404 : 400).json({ errors: result.errors });
    return;
  }
  res.json({ ok: true });
}

export async function listLocationMaps(req: CampaignScopedRequest, res: Response) {
  const campaignId = pid(req, 'id');
  const locationId = pid(req, 'locationId');
  const location = await locationsService.getLocationById(campaignId, locationId);
  if (!location) {
    res.status(404).json({ error: 'Location not found' });
    return;
  }
  if (!canViewContent(req.viewerContext!, location.accessPolicy)) {
    res.status(404).json({ error: 'Location not found' });
    return;
  }
  const maps = await locationMapsService.listMapsForLocation(campaignId, locationId);
  res.json({ maps });
}

export async function createLocationMap(req: CampaignScopedRequest, res: Response) {
  const campaignId = pid(req, 'id');
  const locationId = pid(req, 'locationId');
  const location = await locationsService.getLocationById(campaignId, locationId);
  if (!location) {
    res.status(404).json({ error: 'Location not found' });
    return;
  }
  const result = await locationMapsService.createLocationMap(campaignId, locationId, req.body);
  if ('errors' in result) {
    res.status(400).json({ errors: result.errors });
    return;
  }
  res.status(201).json({ map: result.map });
}

export async function updateLocationMap(req: CampaignScopedRequest, res: Response) {
  const campaignId = pid(req, 'id');
  const locationId = pid(req, 'locationId');
  const mapId = pid(req, 'mapId');
  const location = await locationsService.getLocationById(campaignId, locationId);
  if (!location) {
    res.status(404).json({ error: 'Location not found' });
    return;
  }
  if (!canViewContent(req.viewerContext!, location.accessPolicy)) {
    res.status(404).json({ error: 'Location not found' });
    return;
  }
  const map = await locationMapsService.getLocationMapById(campaignId, mapId);
  if (!map || map.locationId !== locationId) {
    res.status(404).json({ error: 'Location map not found' });
    return;
  }
  const result = await locationMapsService.updateLocationMap(campaignId, mapId, req.body);
  if (!result) {
    res.status(404).json({ error: 'Location map not found' });
    return;
  }
  if ('errors' in result) {
    res.status(400).json({ errors: result.errors });
    return;
  }
  res.json({ map: result.map });
}

export async function deleteLocationMap(req: CampaignScopedRequest, res: Response) {
  const campaignId = pid(req, 'id');
  const locationId = pid(req, 'locationId');
  const mapId = pid(req, 'mapId');
  const location = await locationsService.getLocationById(campaignId, locationId);
  if (!location) {
    res.status(404).json({ error: 'Location not found' });
    return;
  }
  if (!canViewContent(req.viewerContext!, location.accessPolicy)) {
    res.status(404).json({ error: 'Location not found' });
    return;
  }
  const map = await locationMapsService.getLocationMapById(campaignId, mapId);
  if (!map || map.locationId !== locationId) {
    res.status(404).json({ error: 'Location map not found' });
    return;
  }
  const result = await locationMapsService.deleteLocationMap(campaignId, mapId);
  if ('errors' in result) {
    const isNotFound = result.errors.some((e) => e.code === 'NOT_FOUND');
    res.status(isNotFound ? 404 : 400).json({ errors: result.errors });
    return;
  }
  res.json({ ok: true });
}

export async function listMapTransitions(req: CampaignScopedRequest, res: Response) {
  const campaignId = pid(req, 'id');
  const mapId = pid(req, 'mapId');
  const map = await locationMapsService.getLocationMapById(campaignId, mapId);
  if (!map) {
    res.status(404).json({ error: 'Location map not found' });
    return;
  }
  const location = await locationsService.getLocationById(campaignId, map.locationId);
  if (!location || !canViewContent(req.viewerContext!, location.accessPolicy)) {
    res.status(404).json({ error: 'Location map not found' });
    return;
  }
  const transitions = await locationTransitionsService.listTransitionsForMap(campaignId, mapId);
  res.json({ transitions });
}

export async function createMapTransition(req: CampaignScopedRequest, res: Response) {
  const campaignId = pid(req, 'id');
  const mapId = pid(req, 'mapId');
  const map = await locationMapsService.getLocationMapById(campaignId, mapId);
  if (!map) {
    res.status(404).json({ error: 'Location map not found' });
    return;
  }
  const location = await locationsService.getLocationById(campaignId, map.locationId);
  if (!location || !canViewContent(req.viewerContext!, location.accessPolicy)) {
    res.status(404).json({ error: 'Location map not found' });
    return;
  }
  const result = await locationTransitionsService.createLocationTransition(campaignId, mapId, req.body);
  if ('errors' in result) {
    res.status(400).json({ errors: result.errors });
    return;
  }
  res.status(201).json({ transition: result.transition });
}

export async function updateMapTransition(req: CampaignScopedRequest, res: Response) {
  const campaignId = pid(req, 'id');
  const mapId = pid(req, 'mapId');
  const transitionId = pid(req, 'transitionId');
  const map = await locationMapsService.getLocationMapById(campaignId, mapId);
  if (!map) {
    res.status(404).json({ error: 'Location map not found' });
    return;
  }
  const location = await locationsService.getLocationById(campaignId, map.locationId);
  if (!location || !canViewContent(req.viewerContext!, location.accessPolicy)) {
    res.status(404).json({ error: 'Location map not found' });
    return;
  }
  const result = await locationTransitionsService.updateLocationTransition(campaignId, mapId, transitionId, req.body);
  if (!result) {
    res.status(404).json({ error: 'Transition not found' });
    return;
  }
  if ('errors' in result) {
    res.status(400).json({ errors: result.errors });
    return;
  }
  res.json({ transition: result.transition });
}

export async function deleteMapTransition(req: CampaignScopedRequest, res: Response) {
  const campaignId = pid(req, 'id');
  const mapId = pid(req, 'mapId');
  const transitionId = pid(req, 'transitionId');
  const map = await locationMapsService.getLocationMapById(campaignId, mapId);
  if (!map) {
    res.status(404).json({ error: 'Location map not found' });
    return;
  }
  const location = await locationsService.getLocationById(campaignId, map.locationId);
  if (!location || !canViewContent(req.viewerContext!, location.accessPolicy)) {
    res.status(404).json({ error: 'Location map not found' });
    return;
  }
  const result = await locationTransitionsService.deleteLocationTransition(campaignId, transitionId);
  if ('errors' in result) {
    const isNotFound = result.errors.some((e) => e.code === 'NOT_FOUND');
    res.status(isNotFound ? 404 : 400).json({ errors: result.errors });
    return;
  }
  res.json({ ok: true });
}
