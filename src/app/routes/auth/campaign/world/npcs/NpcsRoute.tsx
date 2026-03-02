import { useBreadcrumbs } from '@/hooks'
import { CharacterBuilderLauncher } from '@/features/characterBuilder/components'
import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider'
import { NpcGallerySection } from '@/features/npc/sections' 

import { Breadcrumbs } from '@/ui/patterns'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

export default function NpcsRoute() {
  const { loading: activeCampaignLoading } = useActiveCampaign()

  const breadcrumbs = useBreadcrumbs()

  if (activeCampaignLoading) return <CircularProgress />

  return (
    <Box>
      <Breadcrumbs items={breadcrumbs} />
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h1" >
          NPCs
        </Typography>
        <CharacterBuilderLauncher
          buttonLabel="Create NPC"
          characterType="npc"
        />
      </Stack>

      <NpcGallerySection />
    </Box>
  )
}
