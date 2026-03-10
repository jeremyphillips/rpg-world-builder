/**
 * Placeholder for sending an invite email directly from the client.
 *
 * Currently, email invites for users without accounts are handled
 * server-side in `POST /api/campaigns/:id/members` via `features/email/services/email.service.ts`.
 *
 * This function exists for future use when direct client-to-email-service
 * integration is needed (e.g. Resend, SendGrid).
 */
export async function sendInvite(email: string, campaignId: string): Promise<void> {
  // TODO: Implement direct email invite for users without accounts
  console.warn('sendInvite: not yet implemented client-side', { email, campaignId })
}
