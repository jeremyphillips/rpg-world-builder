import { useGameSessionRecord } from './GameSessionRecordContext'
import { GameSessionLobbyView } from '../components/GameSessionLobbyView'

export default function GameSessionLobbyRoute() {
  const { session } = useGameSessionRecord()
  return <GameSessionLobbyView session={session} />
}
