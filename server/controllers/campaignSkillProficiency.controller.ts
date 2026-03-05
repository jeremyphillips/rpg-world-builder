import type { Request, Response } from 'express';
import * as campaignSkillProficiencyService from '../services/campaignSkillProficiency.service';
import { canViewContent } from '../../shared/domain/capabilities';

export async function listCampaignSkillProficiencies(
  req: Request,
  res: Response,
) {
  const { id: campaignId } = req.params;
  const all = await campaignSkillProficiencyService.listByCampaign(campaignId);

  const ctx = req.viewerContext!;
  const items = all.filter((item) =>
    canViewContent(ctx, item.accessPolicy),
  );

  res.json({ skillProficiencies: items });
}

export async function getCampaignSkillProficiency(req: Request, res: Response) {
  const { id: campaignId, skillProficiencyId } = req.params;
  const item = await campaignSkillProficiencyService.getById(
    campaignId,
    skillProficiencyId,
  );
  if (!item) {
    res.status(404).json({ error: 'Campaign skill proficiency not found' });
    return;
  }

  if (!canViewContent(req.viewerContext!, item.accessPolicy)) {
    res.status(404).json({ error: 'Campaign skill proficiency not found' });
    return;
  }

  res.json({ skillProficiency: item });
}

export async function createCampaignSkillProficiency(
  req: Request,
  res: Response,
) {
  const { id: campaignId } = req.params;
  const result = await campaignSkillProficiencyService.create(
    campaignId,
    req.body,
  );
  if ('errors' in result) {
    res.status(400).json({ errors: result.errors });
    return;
  }
  res.status(201).json({ skillProficiency: result.skillProficiency });
}

export async function updateCampaignSkillProficiency(
  req: Request,
  res: Response,
) {
  const { id: campaignId, skillProficiencyId } = req.params;
  const result = await campaignSkillProficiencyService.update(
    campaignId,
    skillProficiencyId,
    req.body,
  );
  if (!result) {
    res.status(404).json({ error: 'Campaign skill proficiency not found' });
    return;
  }
  if ('errors' in result) {
    res.status(400).json({ errors: result.errors });
    return;
  }
  res.json({ skillProficiency: result.skillProficiency });
}

export async function deleteCampaignSkillProficiency(
  req: Request,
  res: Response,
) {
  const { id: campaignId, skillProficiencyId } = req.params;
  const deleted = await campaignSkillProficiencyService.remove(
    campaignId,
    skillProficiencyId,
  );
  if (!deleted) {
    res.status(404).json({ error: 'Campaign skill proficiency not found' });
    return;
  }
  res.json({ ok: true });
}
