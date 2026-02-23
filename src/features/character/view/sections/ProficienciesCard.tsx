import type { CharacterDoc } from '@/shared'
import { editions } from '@/data'
import type { EditionProficiency } from '@/data/types'

import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Tooltip from '@mui/material/Tooltip'
import EditIcon from '@mui/icons-material/Edit'

type ProficienciesCardProps = {
  proficiencies: CharacterDoc['proficiencies']
  wealth: CharacterDoc['wealth']
  edition?: string
  /** When provided, renders an Edit button for skills. */
  onEdit?: () => void
  /** Disables the skills Edit button (e.g. no proficiency slots available for the character's class). */
  editDisabled?: boolean
  /** When provided, renders an Edit button for wealth. */
  onEditWealth?: () => void
}

export default function ProficienciesCard({ proficiencies, wealth, edition, onEdit, editDisabled, onEditWealth }: ProficienciesCardProps) {
  const skillIds = proficiencies?.skills ?? []

  const editionObj = edition ? editions.find(e => e.id === edition) : undefined
  const skillMap: Record<string, EditionProficiency> =
    (editionObj?.proficiencies as any)?.[edition ?? '']?.skills ?? {}

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
        {skillIds.length > 0 ? (
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
            {skillIds.map((id) => (
              <Chip key={id} label={skillMap[id]?.name ?? id} size="small" variant="outlined" />
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
