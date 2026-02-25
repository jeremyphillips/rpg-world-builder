import type { AppNotification } from './notification.types'

export function getNotificationRoute(
  n: AppNotification,
  routeMap: { CAMPAIGN: string; CHARACTER?: string; INVITE?: string; MESSAGING_CONVERSATION?: string; SESSION?: string; SESSIONS?: string },
): string | null {
  if (n.type === 'campaign.invite' && 'inviteId' in n.context && n.context.inviteId) {
    return `/invites/${String(n.context.inviteId)}`
  }
  if (n.type === 'new_message' && 'conversationId' in n.context && n.context.conversationId && 'campaignId' in n.context && n.context.campaignId && routeMap.MESSAGING_CONVERSATION) {
    return routeMap.MESSAGING_CONVERSATION
      .replace(':id', String(n.context.campaignId))
      .replace(':conversationId', String(n.context.conversationId))
  }
  if (n.type === 'character_pending_approval' && 'characterId' in n.context && n.context.characterId && routeMap.CHARACTER) {
    return routeMap.CHARACTER.replace(':id', String(n.context.characterId))
  }
  if (n.type === 'newPartyMember' && 'characterId' in n.context && n.context.characterId && routeMap.CHARACTER) {
    return routeMap.CHARACTER.replace(':id', String(n.context.characterId))
  }
  if (n.type === 'character_approved' && 'campaignId' in n.context && n.context.campaignId) {
    return routeMap.CAMPAIGN.replace(':id', String(n.context.campaignId))
  }
  if (n.type === 'character_rejected' && 'campaignId' in n.context && n.context.campaignId) {
    return routeMap.CAMPAIGN.replace(':id', String(n.context.campaignId))
  }
  // Session invite / RSVP → session detail page
  if (
    (n.type === 'session.invite' || n.type === 'session.rsvp') &&
    'campaignId' in n.context && n.context.campaignId &&
    routeMap.SESSION
  ) {
    const sessionId =
      ('sessionInviteId' in n.context && n.context.sessionInviteId)
        ? String(n.context.sessionInviteId)
        : (n.payload.sessionId ? String(n.payload.sessionId) : null)
    if (sessionId) {
      return routeMap.SESSION
        .replace(':id', String(n.context.campaignId))
        .replace(':sessionId', sessionId)
    }
  }
  // Session cancelled → sessions list page
  if (
    n.type === 'session.cancelled' &&
    'campaignId' in n.context && n.context.campaignId &&
    routeMap.SESSIONS
  ) {
    return routeMap.SESSIONS.replace(':id', String(n.context.campaignId))
  }
  if (n.type === 'levelUp.cancelled' && 'characterId' in n.context && n.context.characterId && routeMap.CHARACTER) {
    return routeMap.CHARACTER.replace(':id', String(n.context.characterId))
  }
  if ((n.type === 'character.deceased' || n.type === 'character.left') && 'characterId' in n.context && n.context.characterId && routeMap.CHARACTER) {
    return routeMap.CHARACTER.replace(':id', String(n.context.characterId))
  }
  if ('campaignId' in n.context && n.context.campaignId) {
    return routeMap.CAMPAIGN.replace(':id', String(n.context.campaignId))
  }
  return null
}
