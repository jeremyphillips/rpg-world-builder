import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider'
import { useCampaignRules } from '@/app/providers/CampaignRulesProvider'
import { useCharacters } from '@/features/character/hooks'
import { listCampaignLocations } from '@/features/content/locations/domain/repo/locationRepo'
import type { Location } from '@/features/content/locations/domain/types'
import { useEncounterOptions } from '@/features/encounter/hooks/useEncounterOptions'
import type { EncounterNpc, OpponentOption } from '@/features/encounter/types'
import { updateGameSession, type GameSessionPatch } from '../api/gameSessionApi'
import { GameSessionSetupView } from '../components/GameSessionSetupView'
import { useGameSessionRecord } from './GameSessionRecordContext'
import { canEditGameSessionSetup } from '../utils/canEditGameSessionSetup'
import type { SelectEntityOption } from '@/ui/patterns'

export default function GameSessionSetupRoute() {
  const { id: campaignId } = useParams<{ id: string }>()
  const { campaign } = useActiveCampaign()
  const { session, refetch } = useGameSessionRecord()
  const { catalog } = useCampaignRules()
  const { characters: npcs } = useCharacters({ type: 'npc' })

  const { opponentOptions, opponentOptionsByKey } = useEncounterOptions({
    allies: [],
    npcs: npcs as EncounterNpc[],
    monstersById: catalog.monstersById,
  })

  const monsterSelectOptions: SelectEntityOption[] = useMemo(
    () =>
      opponentOptions
        .filter((o: OpponentOption) => o.kind === 'monster')
        .map((o: OpponentOption) => ({
          id: o.key,
          label: o.label,
          subtitle: o.subtitle,
          imageKey: o.imageKey,
          imageUrl: o.imageUrl,
        })),
    [opponentOptions],
  )

  const npcSelectOptions: SelectEntityOption[] = useMemo(
    () =>
      opponentOptions
        .filter((o: OpponentOption) => o.kind === 'npc')
        .map((o: OpponentOption) => ({
          id: o.key,
          label: o.label,
          subtitle: o.subtitle,
          imageKey: o.imageKey,
          imageUrl: o.imageUrl,
        })),
    [opponentOptions],
  )

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
    <GameSessionSetupView
      session={session}
      canEdit={canEdit}
      campaignId={campaignId}
      locations={locations}
      monsterSelectOptions={monsterSelectOptions}
      npcSelectOptions={npcSelectOptions}
      opponentOptionsByKey={opponentOptionsByKey}
      onSave={handleSave}
    />
  )
}
