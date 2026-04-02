import { useGameSessionRecord } from './GameSessionRecordContext'
import { GameSessionLobbyView } from '../components/GameSessionLobbyView'
import { useCampaignParty } from '@/features/campaign/hooks'
import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider'
import { useGameSessionLobbyPresence } from '../hooks/useGameSessionLobbyPresence'

export default function GameSessionLobbyRoute() {
  const { session } = useGameSessionRecord()
  const { campaignId } = useActiveCampaign()
  const { party, loading } = useCampaignParty('approved')

  const campaignAligned = campaignId != null && session.campaignId === campaignId
  const { presentUserIdSet } = useGameSessionLobbyPresence(
    campaignAligned ? campaignId : undefined,
    session.id,
  )

  return (
    <GameSessionLobbyView
      session={session}
      campaignCharacters={campaignAligned ? party : []}
      campaignPartyLoading={loading || !campaignAligned}
      presentUserIdSet={presentUserIdSet}
    />
  )
}
