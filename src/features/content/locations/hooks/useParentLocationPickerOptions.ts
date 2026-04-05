import { useEffect, useState } from 'react'

import type { PickerOption } from '@/ui/patterns/form/OptionPickerField'
import { listCampaignLocations } from '@/features/content/locations/domain/repo/locationRepo'
import { buildParentLocationPickerOptions } from '@/features/content/locations/domain/forms/rules/parentLocationPickerOptions'

/**
 * Loads campaign locations and builds parent-picker options (name — scale; ancestor path in description).
 * When `excludeLocationId` is set, that location is omitted (e.g. edit self).
 */
export function useParentLocationPickerOptions(
  campaignId: string | undefined,
  excludeLocationId?: string,
): PickerOption[] {
  const [fetched, setFetched] = useState<PickerOption[]>([])

  useEffect(() => {
    if (!campaignId) {
      return
    }
    let cancelled = false
    listCampaignLocations(campaignId).then((locs) => {
      if (cancelled) return
      setFetched(
        buildParentLocationPickerOptions(locs, { excludeLocationId }),
      )
    })
    return () => {
      cancelled = true
    }
  }, [campaignId, excludeLocationId])

  return campaignId ? fetched : []
}
