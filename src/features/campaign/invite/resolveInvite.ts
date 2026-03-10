import { apiFetch } from '@/app/api'
import type { ResolveInviteResponse, AcceptInviteResponse } from './invite.types'

/** Calls the backend to validate an invite token and determine the UX branch. */
export async function resolveInvite(token: string): Promise<ResolveInviteResponse> {
  return apiFetch<ResolveInviteResponse>('/api/auth/resolve-invite', {
    method: 'POST',
    body: { token },
  })
}

/** Consumes the invite token for a logged-in user, joining them to the campaign. */
export async function acceptInvite(token: string): Promise<AcceptInviteResponse> {
  return apiFetch<AcceptInviteResponse>('/api/auth/accept-invite', {
    method: 'POST',
    body: { token },
  })
}
