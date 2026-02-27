import type { Request, Response } from 'express';
import * as campaignRaceService from '../services/campaignRace.service';
import { getUserCharacterIds } from '../services/campaignMember.service';
import { canViewContent, type ViewerContext } from '../../shared/domain/capabilities';

function buildViewerContext(req: Request, characterIds: string[]): ViewerContext {
  return {
    campaignRole: req.campaignRole ?? null,
    isOwner: req.isOwner ?? false,
    isPlatformAdmin: req.userRole === 'admin' || req.userRole === 'superadmin',
    characterIds,
  };
}

export async function listCampaignRaces(req: Request, res: Response) {
  const { id: campaignId } = req.params;
  const allRaces = await campaignRaceService.listByCampaign(campaignId);

  const userCharacterIds = await getUserCharacterIds(campaignId, req.userId!);
  const ctx = buildViewerContext(req, userCharacterIds);

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

  const userCharacterIds = await getUserCharacterIds(campaignId, req.userId!);
  const ctx = buildViewerContext(req, userCharacterIds);

  if (!canViewContent(ctx, race.accessPolicy)) {
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
