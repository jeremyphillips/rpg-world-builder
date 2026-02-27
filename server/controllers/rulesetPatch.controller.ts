import type { Request, Response } from 'express';
import * as rulesetPatchService from '../services/rulesetPatch.service';

export async function getRulesetPatch(req: Request, res: Response) {
  const { id: campaignId } = req.params;

  const patch = await rulesetPatchService.getPatchByCampaignId(campaignId);
  if (!patch) {
    res.status(404).json({ error: 'No ruleset patch found for this campaign' });
    return;
  }

  res.json({ patch });
}

export async function upsertRulesetPatch(req: Request, res: Response) {
  const { id: campaignId } = req.params;

  const result = await rulesetPatchService.upsertPatch(campaignId, req.body);

  if ('errors' in result) {
    res.status(400).json({ errors: result.errors });
    return;
  }

  res.json({ patch: result.patch });
}
