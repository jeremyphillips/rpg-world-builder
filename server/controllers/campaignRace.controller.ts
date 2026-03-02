import type { Request, Response } from 'express';
import * as campaignRaceService from '../services/campaignRace.service';
import { canViewContent } from '../../shared/domain/capabilities';

export async function listCampaignRaces(req: Request, res: Response) {
  const { id: campaignId } = req.params;
  const allRaces = await campaignRaceService.listByCampaign(campaignId);

  const ctx = req.viewerContext!;
  const races = allRaces.filter((race) => canViewContent(ctx, race.accessPolicy));

  res.json({ races });
}

export async function getCampaignRace(req: Request, res: Response) {
  const { id: campaignId, raceId } = req.params;
  const race = await campaignRaceService.getById(campaignId, raceId);
  if (!race) {
    res.status(404).json({ error: 'Campaign race not found' });
    return;
  }

  if (!canViewContent(req.viewerContext!, race.accessPolicy)) {
    res.status(404).json({ error: 'Campaign race not found' });
    return;
  }

  res.json({ race });
}

export async function createCampaignRace(req: Request, res: Response) {
  const { id: campaignId } = req.params;
  const result = await campaignRaceService.create(campaignId, req.body);
  if ('errors' in result) {
    res.status(400).json({ errors: result.errors });
    return;
  }
  res.status(201).json({ race: result.race });
}

export async function updateCampaignRace(req: Request, res: Response) {
  const { id: campaignId, raceId } = req.params;
  const result = await campaignRaceService.update(campaignId, raceId, req.body);
  if (!result) {
    res.status(404).json({ error: 'Campaign race not found' });
    return;
  }
  if ('errors' in result) {
    res.status(400).json({ errors: result.errors });
    return;
  }
  res.json({ race: result.race });
}

export async function deleteCampaignRace(req: Request, res: Response) {
  const { id: campaignId, raceId } = req.params;
  const deleted = await campaignRaceService.remove(campaignId, raceId);
  if (!deleted) {
    res.status(404).json({ error: 'Campaign race not found' });
    return;
  }
  res.json({ ok: true });
}
