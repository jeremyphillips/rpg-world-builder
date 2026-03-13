import type { Request, Response } from 'express';
import * as monstersService from '../services/monsters.service';
import { canViewContent } from '../../../../../shared/domain/capabilities';

export async function listCampaignMonsters(req: Request, res: Response) {
  const { id: campaignId } = req.params;
  const allMonsters = await monstersService.listByCampaign(campaignId);

  const ctx = req.viewerContext!;
  const monsters = allMonsters.filter((m) => canViewContent(ctx, m.accessPolicy));

  res.json({ monsters });
}

export async function getCampaignMonster(req: Request, res: Response) {
  const { id: campaignId, monsterId } = req.params;
  const monster = await monstersService.getById(campaignId, monsterId);
  if (!monster) {
    res.status(404).json({ error: 'Campaign monster not found' });
    return;
  }

  if (!canViewContent(req.viewerContext!, monster.accessPolicy)) {
    res.status(404).json({ error: 'Campaign monster not found' });
    return;
  }

  res.json({ monster });
}

export async function createCampaignMonster(req: Request, res: Response) {
  const { id: campaignId } = req.params;
  const result = await monstersService.create(campaignId, req.body);
  if ('errors' in result) {
    res.status(400).json({ errors: result.errors });
    return;
  }
  res.status(201).json({ monster: result.monster });
}

export async function updateCampaignMonster(req: Request, res: Response) {
  const { id: campaignId, monsterId } = req.params;
  const result = await monstersService.update(campaignId, monsterId, req.body);
  if (!result) {
    res.status(404).json({ error: 'Campaign monster not found' });
    return;
  }
  if ('errors' in result) {
    res.status(400).json({ errors: result.errors });
    return;
  }
  res.json({ monster: result.monster });
}

export async function deleteCampaignMonster(req: Request, res: Response) {
  const { id: campaignId, monsterId } = req.params;
  const deleted = await monstersService.remove(campaignId, monsterId);
  if (!deleted) {
    res.status(404).json({ error: 'Campaign monster not found' });
    return;
  }
  res.json({ ok: true });
}
