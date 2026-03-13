import type { Session } from './session.types'
import type { CampaignRole } from '@/shared/types'
import { isUpcomingSession } from './dates'

export const canEditSession = (
  session: Session,
  _role: CampaignRole | null,
  opts?: { isOwner?: boolean },
): boolean =>
  opts?.isOwner || isUpcomingSession(session.date)
