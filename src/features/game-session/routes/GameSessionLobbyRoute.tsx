import { useCallback, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '@/app/api'
import { useGameSessionRecord } from './GameSessionRecordContext'
import { GameSessionLobbyView } from '../components/GameSessionLobbyView'
import { useCampaignParty } from '@/features/campaign/hooks'
import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider'
import { useGameSessionLobbyPresence } from '../hooks/useGameSessionLobbyPresence'
import { startGameSession } from '../api/gameSessionApi'
import { deriveGameSessionCanonicalPhase } from '../utils/deriveGameSessionCanonicalPhase'
import { campaignGameSessionPlayPath } from './gameSessionPaths'

export default function GameSessionLobbyRoute() {
  const { id: campaignIdFromRoute } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { session, refetch } = useGameSessionRecord()
  const { campaignId } = useActiveCampaign()
  const [startSessionLoading, setStartSessionLoading] = useState(false)
  const [startSessionError, setStartSessionError] = useState<string | null>(null)
  const { party, loading } = useCampaignParty('approved')

  const campaignAligned = campaignId != null && session.campaignId === campaignId
  const { presentUserIds, presentUserIdSet } = useGameSessionLobbyPresence(
    campaignAligned ? campaignId : undefined,
    session.id,
  )

  const handleStartSession = useCallback(async () => {
    if (!campaignId) return
    setStartSessionLoading(true)
    setStartSessionError(null)
    try {
      const updated = await startGameSession(campaignId, session.id, { presentUserIds })
      await refetch()
      navigate(campaignGameSessionPlayPath(campaignId, updated.id), { replace: true })
    } catch (e) {
      const message =
        e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Could not start session'
      setStartSessionError(message)
    } finally {
      setStartSessionLoading(false)
    }
  }, [campaignId, navigate, presentUserIds, refetch, session.id])

  if (campaignIdFromRoute && deriveGameSessionCanonicalPhase(session) === 'play') {
    return (
      <Navigate to={campaignGameSessionPlayPath(campaignIdFromRoute, session.id)} replace />
    )
  }

  return (
    <GameSessionLobbyView
      session={session}
      campaignCharacters={campaignAligned ? party : []}
      campaignPartyLoading={loading || !campaignAligned}
      presentUserIdSet={presentUserIdSet}
      onStartSession={campaignAligned ? handleStartSession : undefined}
      startSessionLoading={startSessionLoading}
      startSessionError={startSessionError}
    />
  )
}
