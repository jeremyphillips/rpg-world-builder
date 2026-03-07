import { env } from '../shared/config/env'
import type { EmailProvider } from './email.providers/types'
import { etherealProvider } from './email.providers/ethereal.provider'
import { smtpProvider } from './email.providers/smtp.provider'

// ---------------------------------------------------------------------------
// Provider selection — Ethereal for development, SMTP for production
// ---------------------------------------------------------------------------

function getProvider(): EmailProvider {
  if (env.NODE_ENV === 'development') return etherealProvider
  return smtpProvider
}

// ---------------------------------------------------------------------------
// Campaign invite email
// ---------------------------------------------------------------------------

interface InviteEmailParams {
  to: string
  campaignName: string
  invitedBy: string
  inviteToken: string
}

export async function sendCampaignInvite({ to, campaignName, invitedBy, inviteToken }: InviteEmailParams) {
  const signUpUrl = `${env.CLIENT_URL}/accept-invite?token=${inviteToken}`

  const subject = `You've been invited to join "${campaignName}"`

  const text = [
    `Hi there!`,
    ``,
    `${invitedBy} has invited you to join the campaign "${campaignName}" on D&D Character Builder.`,
    ``,
    `Click the link below to accept your invite:`,
    `${signUpUrl}`,
    ``,
    `Happy adventuring!`,
    `— D&D Character Builder`,
  ].join('\n')

  const html = [
    `<p>Hi there!</p>`,
    `<p><strong>${invitedBy}</strong> has invited you to join the campaign <strong>"${campaignName}"</strong> on D&amp;D Character Builder.</p>`,
    `<p>Click the link below to accept your invite:</p>`,
    `<p><a href="${signUpUrl}">Accept Invite</a></p>`,
    `<p>Happy adventuring!<br/>— D&amp;D Character Builder</p>`,
  ].join('\n')

  const provider = getProvider()
  const result = await provider.sendEmail({ to, subject, text, html })

  return { to, subject, body: text, previewUrl: result.previewUrl }
}
