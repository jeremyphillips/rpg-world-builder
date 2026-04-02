import { Navigate, useParams } from 'react-router-dom'
import { useGameSessionRecord } from './GameSessionRecordContext'
import { GameSessionPlayView } from '../components/GameSessionPlayView'
import { deriveGameSessionCanonicalPhase } from '../utils/deriveGameSessionCanonicalPhase'
import { campaignGameSessionLobbyPath } from './gameSessionPaths'

export default function GameSessionPlayRoute() {
  const { id: campaignId } = useParams<{ id: string }>()
  const { session } = useGameSessionRecord()

  if (!campaignId) {
    return null
  }

  if (deriveGameSessionCanonicalPhase(session) !== 'play') {
    return <Navigate to={campaignGameSessionLobbyPath(campaignId, session.id)} replace />
  }

  return <GameSessionPlayView session={session} />
}
