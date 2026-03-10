import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { ROUTES } from '@/app/routes'
import { resolveInvite, acceptInvite } from './resolveInvite'
import type { ResolveInviteResponse, InviteCampaignState } from './invite.types'

export type InviteResolution =
  | { type: 'loading' }
  | { type: 'error'; message: string }
  | { type: 'redirect'; to: string; state?: InviteCampaignState }
  | { type: 'redirect-login'; loginUrl: string }
  | { type: 'redirect-register'; registerUrl: string }

export function useAcceptInvite() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const { loading: authLoading } = useAuth()

  const [resolution, setResolution] = useState<InviteResolution>({ type: 'loading' })

  const resolve = useCallback(async () => {
    if (!token) {
      setResolution({ type: 'error', message: 'No invite token provided.' })
      return
    }

    try {
      const result: ResolveInviteResponse = await resolveInvite(token)

      if (result.status === 'invalid') {
        setResolution({ type: 'error', message: 'This invite link is invalid.' })
        return
      }
      if (result.status === 'expired') {
        setResolution({ type: 'error', message: 'This invite link has expired. Please ask the DM to resend your invite.' })
        return
      }
      if (result.status === 'used') {
        setResolution({ type: 'error', message: 'This invite link has already been used.' })
        return
      }

      const campaignState: InviteCampaignState = {
        campaignName: result.campaignName,
        campaignEdition: result.campaignEdition,
        campaignSetting: result.campaignSetting,
      }

      // Not logged in
      if (!result.loggedIn) {
        const returnUrl = `${ROUTES.ACCEPT_INVITE}?token=${encodeURIComponent(token)}`

        if (result.userExists) {
          setResolution({
            type: 'redirect-login',
            loginUrl: `${ROUTES.LOGIN}?redirect=${encodeURIComponent(returnUrl)}`,
          })
        } else {
          setResolution({
            type: 'redirect-register',
            registerUrl: `${ROUTES.REGISTER}?inviteToken=${encodeURIComponent(token)}`,
          })
        }
        return
      }

      // Logged in — has character already
      if (result.hasCharacter) {
        setResolution({
          type: 'redirect',
          to: ROUTES.CAMPAIGN.replace(':id', result.campaignId!),
        })
        return
      }

      // Logged in — not yet a member, or member without character
      // Consume the token (join campaign) then route to character creation
      if (!result.isMember) {
        try {
          await acceptInvite(token)
        } catch {
          setResolution({ type: 'error', message: 'Failed to join the campaign. The invite may have already been used.' })
          return
        }
      }

      setResolution({
        type: 'redirect',
        to: `${ROUTES.NEW_CHARACTER}?campaignId=${result.campaignId}`,
        state: campaignState,
      })
    } catch (err) {
      setResolution({
        type: 'error',
        message: err instanceof Error ? err.message : 'Something went wrong resolving your invite.',
      })
    }
  }, [token])

  // Run resolution once auth state is settled
  useEffect(() => {
    if (authLoading) return
    resolve()
  }, [authLoading, resolve])

  return { resolution, token }
}
