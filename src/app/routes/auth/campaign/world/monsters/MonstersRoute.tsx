import { useParams } from 'react-router-dom'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import { Breadcrumbs } from '@/ui/patterns'
import { useBreadcrumbs } from '@/hooks'
import { monsters } from '@/data/monsters'
import { MonsterMediaTopCard } from '@/features/monster/components'
import { ROUTES } from '@/app/routes'

export default function MonstersRoute() {
  const { id: campaignId } = useParams<{ id: string }>()

  const breadcrumbs = useBreadcrumbs()
  const first100 = monsters.slice(0, 100)

  return (
    <Box>
      <Breadcrumbs items={breadcrumbs} />
      <Typography variant="h1" sx={{ mb: 4 }}>
        Monsters
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: 2,
        }}
      >
        {first100.map((monster) => (
          <MonsterMediaTopCard
            key={monster.id}
            name={monster.name}
            type={monster.type}
            subtype={monster.subtype}
            sizeCategory={monster.sizeCategory}
            description={monster.description?.short}
            link={campaignId ? ROUTES.WORLD_MONSTER.replace(':id', campaignId).replace(':monsterId', monster.id) : undefined}
          />
        ))}
      </Box>
    </Box>
  )
}
