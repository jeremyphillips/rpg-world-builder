import { resolveImageUrl } from '@/utils/image'
import { useCharacters } from '@/features/character/hooks'
import { NpcMediaTopCard } from '@/features/npc/cards'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import { AppAlert } from '@/ui/primitives'

export default function NpcGallerySection() {
  const {
    characters: npcs,
    loading: loadingNpcs,
  } = useCharacters({ type: 'npc' })

  return (
    <>
      <h3>NPCs</h3>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: 2,
        }}
      >
        {loadingNpcs ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : npcs.length === 0 ? (
          <AppAlert tone="info">No NPCs in this campaign.</AppAlert>
        ) : (
          npcs.map((npc) => (
            <NpcMediaTopCard
              characterId={npc._id}
              key={npc._id}
              name={npc.name}
              classes={npc.classes}
              imageUrl={resolveImageUrl(npc.imageKey)}
              status={npc.status}
              link={`/npcs/${npc._id}`}
              race={npc.race ?? ''}
            />
          ))
        )}
      </Box>
    </>
  )
}
