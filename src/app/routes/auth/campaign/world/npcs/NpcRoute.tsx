import { useParams } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { Breadcrumbs } from '@/ui/patterns'
import { useBreadcrumbs } from '@/hooks'
import { CharacterView } from '@/features/character/view'
import type { Character } from '@/features/character/domain/types'
import { useCharacter, useCharacterActions, useCharacterForm } from '@/features/character/hooks'

import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

export default function NpcRoute() {
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
    error: error,
    success: success,
    isOwner,
    isAdmin,
    campaigns
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
        character={npc as Character}
        campaigns={campaigns} 
        pendingMemberships={[]}
        isOwner={isOwner}
        isAdmin={isAdmin}
        ownerName={undefined}
        error={error}
        success={success}
        setError={setError}
        narrative={{ backstory: '', personalityTraits: [], ideals: '', bonds: '', flaws: '' }}
        race={npc.race ?? ''}
        alignment={npc.alignment ?? ''}
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
