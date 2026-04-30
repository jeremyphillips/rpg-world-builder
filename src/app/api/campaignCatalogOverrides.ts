import { apiFetch } from '@/app/api';
import type { CampaignCatalog } from '@/features/mechanics/domain/rulesets/system/catalog';

export async function fetchCampaignCatalogOverrides(
  campaignId: string,
): Promise<Partial<CampaignCatalog>> {
  const data = await apiFetch<{ catalogOverrides: Partial<CampaignCatalog> }>(
    `/api/campaigns/${campaignId}/catalog-overrides`,
  );
  return data.catalogOverrides ?? {};
}
