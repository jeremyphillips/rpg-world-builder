import { type Monster } from '@/data/monsters'
import { StatRow } from '../../components'
import { MONSTER_LABELS } from '@/data/monsters'

import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Divider from '@mui/material/Divider'

const L = MONSTER_LABELS

export function MonsterHeader({ monster }: { monster: Monster }) {
  return (
    <div>
      <Stack spacing={1} sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 160, color: 'text.secondary' }}>{L.type}</Typography>
          <Chip label={monster.type} size="small" />
        </Box>
        {monster.sizeCategory && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 160, color: 'text.secondary' }}>{L.sizeCategory}</Typography>
            <Chip label={monster.sizeCategory} size="small" variant="outlined" />
          </Box>
        )}
        {monster.vision && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 160, color: 'text.secondary' }}>{L.vision}</Typography>
            <Chip label={monster.vision} size="small" variant="outlined" />
          </Box>
        )}
      </Stack>

      <StatRow label={L.languages} value={monster.languages?.length ? monster.languages.join(', ') : 'None'} />

      <Divider sx={{ my: 3 }} />
    </div>
  )
}
