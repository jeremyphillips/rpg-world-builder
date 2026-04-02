import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '@/app/api'
import { useGameSessionRecord } from './GameSessionRecordContext'
import { GameSessionLobbyView } from '../components/GameSessionLobbyView'
import { useCampaignParty } from '@/features/campaign/hooks'
import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider'
import { useGameSessionLobbyPresence } from '../hooks/useGameSessionLobbyPresence'
import { startGameSession } from '../api/gameSessionApi'
import { campaignGameSessionPlayPath } from './gameSessionPaths'

export default function GameSessionLobbyRoute() {
  const navigate = useNavigate()
  const { session, refetch } = useGameSessionRecord()
  const { campaignId } = useActiveCampaign()
  const [startSessionLoading, setStartSessionLoading] = useState(false)
  const [startSessionError, setStartSessionError] = useState<string | null>(null)
  const { party, loading } = useCampaignParty('approved')

  const campaignAligned = campaignId != null && session.campaignId === campaignId
  const { presentUserIdSet } = useGameSessionLobbyPresence(
    campaignAligned ? campaignId : undefined,
    session.id,
  )

  const handleStartSession = useCallback(async () => {
    if (!campaignId) return
    setStartSessionLoading(true)
    setStartSessionError(null)
    try {
      const updated = await startGameSession(campaignId, session.id)
      await refetch()
      navigate(campaignGameSessionPlayPath(campaignId, updated.id), { replace: true })
    } catch (e) {
      const message =
        e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Could not start session'
      setStartSessionError(message)
    } finally {
      setStartSessionLoading(false)
    }
  }, [campaignId, navigate, refetch, session.id])

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
