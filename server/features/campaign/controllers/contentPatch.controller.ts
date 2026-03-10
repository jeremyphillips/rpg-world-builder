import type { Request, Response } from 'express';
import * as contentPatchService from '../services/contentPatch.service';

export async function getContentPatch(req: Request, res: Response) {
  const { id: campaignId } = req.params;

  const patch = await contentPatchService.getPatchByCampaignId(campaignId);

  res.json({
    patch: patch ?? { campaignId, patches: {} },
  });
}

export async function upsertContentPatch(req: Request, res: Response) {
  const { id: campaignId } = req.params;

  const result = await contentPatchService.upsertPatch(campaignId, req.body);

  if ('errors' in result) {
    res.status(400).json({ errors: result.errors });
    return;
  }

  res.json({ patch: result.patch });
}
