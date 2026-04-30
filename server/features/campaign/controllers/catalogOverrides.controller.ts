import type { Request, Response } from 'express';
import { fetchCatalogOverridesForCampaign } from '../services/resolveCampaignCatalog.server';

export async function getCampaignCatalogOverrides(req: Request, res: Response) {
  const campaignId = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];
  const catalogOverrides = await fetchCatalogOverridesForCampaign(campaignId);
  res.json({ catalogOverrides });
}
