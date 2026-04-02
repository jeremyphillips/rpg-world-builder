import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider'
import { listCampaignLocations } from '@/features/content/locations/domain/repo/locationRepo'
import type { Location } from '@/features/content/locations/domain/types'
import { updateGameSession, type GameSessionPatch } from '../api/gameSessionApi'
import { GameSessionSetupView } from '../components/GameSessionSetupView'
import { useGameSessionRecord } from './GameSessionRecordContext'
import { canEditGameSessionSetup } from '../utils/canEditGameSessionSetup'

export default function GameSessionSetupRoute() {
  const { id: campaignId } = useParams<{ id: string }>()
  const { campaign } = useActiveCampaign()
  const { session, refetch } = useGameSessionRecord()

  const [locations, setLocations] = useState<Location[]>([])

  useEffect(() => {
    if (!campaignId) return
    let cancelled = false
    listCampaignLocations(campaignId)
      .then((locs) => {
        if (!cancelled) setLocations(locs)
      })
      .catch(() => {
        if (!cancelled) setLocations([])
      })
    return () => {
      cancelled = true
    }
  }, [campaignId])

  const canEdit = useMemo(() => canEditGameSessionSetup(campaign?.viewer), [campaign?.viewer])

  async function handleSave(patch: GameSessionPatch) {
    if (!campaignId) return
    await updateGameSession(campaignId, session.id, patch)
    await refetch()
  }

  return (
    <GameSessionSetupView session={session} canEdit={canEdit} locations={locations} onSave={handleSave} />
  )
}
