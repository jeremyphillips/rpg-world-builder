import type { AppNotification } from './notification.types'

export function getNotificationLabel(n: AppNotification): string {
  switch (n.type) {
    case 'campaign.invite':
      return `${n.payload.invitedByName ?? 'Someone'} invited you to ${n.payload.campaignName ?? 'a campaign'}`
    case 'character_pending_approval':
      return `${n.payload.userName ?? 'A player'} has a new character pending approval`
    case 'character_approved':
      return `Your character "${n.payload.characterName ?? ''}" was approved for ${n.payload.campaignName ?? 'the campaign'}`
    case 'character_rejected':
      return `Your character "${n.payload.characterName ?? ''}" was not approved for ${n.payload.campaignName ?? 'the campaign'}`
    case 'new_message':
      return 'You have a new message'
    case 'newPartyMember':
      return `${n.payload.characterName ?? 'A character'} has joined ${n.payload.campaignName ?? 'a'} campaign`
    case 'campaign.removed':
      return `You were removed from ${n.payload.campaignName ?? 'a campaign'}`
    case 'character.created':
      return `Character "${n.payload.characterName ?? ''}" was created`
    case 'admin.actionRequired':
      return (n.payload.message as string) ?? 'Action required'
    case 'system.info':
      return (n.payload.message as string) ?? 'System notification'
    case 'system.warning':
      return (n.payload.message as string) ?? 'System warning'
    case 'session.invite': {
      const date = n.payload.sessionDate
        ? new Date(n.payload.sessionDate as string).toLocaleDateString()
        : 'TBD'
      return `New session scheduled for ${date}. RSVP requested.`
    }
    case 'session.rsvp': {
      const who = (n.payload.userName as string) ?? 'A player'
      const action = (n.payload.action as string) === 'accepted' ? 'accepted' : 'declined'
      const rsvpDate = n.payload.sessionDate
        ? new Date(n.payload.sessionDate as string).toLocaleDateString()
        : 'TBD'
      return `${who} ${action} session scheduled for ${rsvpDate}.`
    }
    case 'session.cancelled': {
      const cancelDate = n.payload.sessionDate
        ? new Date(n.payload.sessionDate as string).toLocaleDateString()
        : 'TBD'
      const title = (n.payload.sessionTitle as string) ?? 'A session'
      return `${title} scheduled for ${cancelDate} has been cancelled.`
    }
    case 'levelUp.cancelled':
      return `Level-up to ${n.payload.pendingLevel ?? 'next level'} for "${n.payload.characterName ?? 'your character'}" was cancelled by the campaign owner.`
    case 'character.deceased':
      return `\u26B0\uFE0F ${n.payload.characterName ?? 'A character'} has deceased.`
    case 'character.left':
      return `${n.payload.characterName ?? 'A character'} has left your party.`
    default:
      return n.type
  }
}
