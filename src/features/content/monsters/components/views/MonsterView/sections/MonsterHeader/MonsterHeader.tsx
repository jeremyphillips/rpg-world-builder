import type { Monster } from '@/features/content/monsters/domain/types/monster.types'
import { StatRow } from '../../components'

import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Divider from '@mui/material/Divider'

export const MONSTER_LABELS = {
  // Top-level
  type: 'Creature Type',
  sizeCategory: 'Size',
  languages: 'Languages',
  vision: 'Vision',
  description: 'Description',

  // Meta
  campaign: 'Campaign',
  source: 'Source',

  // Mechanics
  armorClass: 'Armor Class',
  movement: 'Movement',
  abilities: 'Ability Scores',
  traits: 'Traits',
  actions: 'Actions',
  morale: 'Morale',
  proficiencyBonus: 'Proficiency Bonus',
  // Lore
  alignment: 'Alignment',
  xpValue: 'XP Value',
  challengeRating: 'Challenge Rating',
} as const

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
