import { getSkillIds } from '@/features/character/domain/utils/character-proficiency.utils'
import type { ProficiencyAdjustment } from '@/features/character/domain/types'

import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Tooltip from '@mui/material/Tooltip'
import EditIcon from '@mui/icons-material/Edit'

type ProficiencyItem = { id: string; name: string }
type ProficienciesCardProps = {
  proficiencies: { skills?: Record<string, ProficiencyAdjustment> } | ProficiencyItem[]
  wealth: { gp?: number; sp?: number; cp?: number; baseBudget?: unknown }
  onEdit?: () => void
  editDisabled?: boolean
  onEditWealth?: () => void
}

export default function ProficienciesCard({ proficiencies, wealth, onEdit, editDisabled, onEditWealth }: ProficienciesCardProps) {
  const isResolved = Array.isArray(proficiencies)
  const items = isResolved
    ? (proficiencies as ProficiencyItem[])
    : getSkillIds(proficiencies as { skills?: Record<string, ProficiencyAdjustment> }).map((id) => ({ id, name: id }))

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
            Skills
          </Typography>
          {onEdit && (
            <Tooltip title={editDisabled ? 'All proficiency slots are filled' : ''}>
              <span>
                <Button
                  size="small"
                  startIcon={<EditIcon fontSize="small" />}
                  onClick={onEdit}
                  disabled={editDisabled}
                >
                  Edit
                </Button>
              </span>
            </Tooltip>
          )}
        </Stack>
        {items.length > 0 ? (
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
            {items.map((item) => (
              <Chip key={item.id} label={item.name} size="small" variant="outlined" />
            ))}
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>—</Typography>
        )}

        {/* Wealth */}
        <Divider sx={{ my: 1.5 }} />
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
            Wealth
          </Typography>
          {onEditWealth && (
            <Button
              size="small"
              startIcon={<EditIcon fontSize="small" />}
              onClick={onEditWealth}
            >
              Edit
            </Button>
          )}
        </Stack>
        <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
          <Typography variant="body2" fontWeight={600}>{wealth?.gp ?? 0} gp</Typography>
          <Typography variant="body2">{wealth?.sp ?? 0} sp</Typography>
          <Typography variant="body2">{wealth?.cp ?? 0} cp</Typography>
        </Stack>
      </CardContent>
    </Card>
  )
}
