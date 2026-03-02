import { useParams } from 'react-router-dom'
import { Breadcrumbs } from '@/ui/patterns'
import { useBreadcrumbs } from '@/hooks'
import { monsters } from '@/data'
import type { Monster } from '@/data'
import MonsterView from '@/features/monster/MonsterView/MonsterView'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { AppAlert } from '@/ui/primitives'

export default function MonsterRoute() {
  const { monsterId } = useParams<{ id: string; monsterId: string }>()

  const breadcrumbs = useBreadcrumbs()

  const monster: Monster | undefined = monsters.find((m) => m.id === monsterId)

  if (!monster) {
    return (
      <Box sx={{ py: 4 }}>
        <AppAlert tone="danger">Monster not found.</AppAlert>
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 720 }}>
      <Breadcrumbs items={breadcrumbs} />
      {/* Header */}
      <Typography variant="overline" color="text.secondary">
        Monster
      </Typography>
      <Typography variant="h1" sx={{ mb: 2 }}>
        {monster.name}
      </Typography>

      <MonsterView monster={monster} />
    </Box>
  )
}
