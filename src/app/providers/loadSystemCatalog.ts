import type { CampaignCatalog } from '@/features/mechanics/domain/rulesets/system/catalog'

let loadPromise: Promise<CampaignCatalog> | null = null

/** Deduped dynamic import of the full SRD catalog (core + spell/monster sub-chunks). */
export function loadSystemCatalog(): Promise<CampaignCatalog> {
  if (!loadPromise) {
    loadPromise = import('@/features/mechanics/domain/rulesets/system/catalog').then((m) =>
      m.loadSystemCatalog(),
    )
  }
  return loadPromise
}

/** Warm the async catalog chunk (e.g. after auth). */
export function prefetchSystemCatalog(): void {
  void loadSystemCatalog()
}
