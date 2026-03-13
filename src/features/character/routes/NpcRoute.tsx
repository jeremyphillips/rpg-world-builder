import { useParams } from 'react-router-dom'
import { Breadcrumbs } from '@/ui/patterns'
import { useBreadcrumbs } from '@/app/navigation'
import { CharacterView } from '@/features/character/components/views'
import { useCharacter, useCharacterActions, useCharacterForm } from '@/features/character/hooks'

import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

const NpcRoute = () => {
  const { npcId } = useParams<{ npcId: string }>()

  const breadcrumbs = useBreadcrumbs()

  const {
    character: npc,
    loading: loadingNpc,
    setCharacter: setNpc,
    setCampaigns: setCampaigns,
    setPendingMemberships: setPendingMemberships,
    setError: setError,
    setSuccess: setSuccess,
    error,
    success,
    isOwner,
    isAdmin,
    campaigns,
  } = useCharacter(npcId)

  const form = useCharacterForm(npc)

  const actions = useCharacterActions(npcId, {
    character: npc,
    setCharacter: setNpc,
    setCampaigns: setCampaigns,
    setPendingMemberships: setPendingMemberships,
    setError: setError,
    setSuccess: setSuccess,
    syncFromCharacter: form.syncFromCharacter,
  })

  if (loadingNpc) return <CircularProgress />
  if (!npc) return <Typography>NPC not found</Typography>

  return (
    <Box>
      <Breadcrumbs items={breadcrumbs} />

      <Typography variant="h1">
        {npc.name ?? ''}
      </Typography>

      <CharacterView
        name={npc.name ?? ''}
        character={npc}
        campaigns={campaigns}
        pendingMemberships={[]}
        isOwner={isOwner}
        isAdmin={isAdmin}
        ownerName={undefined}
        error={error}
        success={success}
        setError={setError}
        narrative={{ backstory: '', personalityTraits: [], ideals: '', bonds: '', flaws: '' }}
        race={(typeof npc.race === 'object' && npc.race ? npc.race.id : '') as never}
        alignment={(npc.alignment ?? '') as never}
        totalLevel={npc.totalLevel ?? npc.level ?? 1}
        alignmentOptions={[]}
        raceOptions={form.raceOptions}
        imageKey={form.imageKey}
        setImageKey={form.setImageKey}
        breadcrumbs={breadcrumbs}
        actions={actions}
      />
    </Box>
  )
}

export default NpcRoute
