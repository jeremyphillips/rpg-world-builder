import type { Session } from './session.types'
import type { CampaignRole } from '@/shared'
import { isUpcomingSession } from './dates'

export const canEditSession = (
  session: Session,
  role: CampaignRole | null,
  opts?: { isOwner?: boolean },
): boolean =>
  opts?.isOwner || isUpcomingSession(session.date)
