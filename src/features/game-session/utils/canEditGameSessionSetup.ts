import type { Campaign } from '@/shared/types/campaign.types'

/** DM-facing setup: owners, platform admins, and campaign DMs / co-DMs. */
export function canEditGameSessionSetup(viewer: Campaign['viewer'] | undefined): boolean {
  if (!viewer) return false
  if (viewer.isPlatformAdmin) return true
  if (viewer.isOwner) return true
  const r = viewer.campaignRole
  return r === 'dm' || r === 'co_dm'
}
