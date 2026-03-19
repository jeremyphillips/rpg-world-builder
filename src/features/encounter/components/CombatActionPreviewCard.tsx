import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'

import { AppBadge } from '@/ui/primitives'
import type { CombatActionDefinition } from '@/features/mechanics/domain/encounter/resolution/combat-action.types'
import { formatSigned } from '../helpers'

type CombatActionPreviewCardProps = {
  action: CombatActionDefinition | null
  placeholder?: string
}

export function CombatActionPreviewCard({
  action,
  placeholder = 'No action selected',
}: CombatActionPreviewCardProps) {
  if (!action) {
    return (
      <Paper variant="outlined" sx={{ p: 2, borderStyle: 'dashed' }}>
        <Typography variant="body2" color="text.secondary">{placeholder}</Typography>
      </Paper>
    )
  }

  const costParts: string[] = []
  if (action.cost.action) costParts.push('Action')
  if (action.cost.bonusAction) costParts.push('Bonus Action')
  if (action.cost.reaction) costParts.push('Reaction')

  const detailParts: string[] = []
  if (action.attackProfile) {
    detailParts.push(`${formatSigned(action.attackProfile.attackBonus)} to hit`)
    if (action.attackProfile.damage) {
      detailParts.push(
        action.attackProfile.damageType
          ? `${action.attackProfile.damage} ${action.attackProfile.damageType}`
          : action.attackProfile.damage,
      )
    }
  }
  if (action.saveProfile) {
    detailParts.push(`DC ${action.saveProfile.dc} ${action.saveProfile.ability.toUpperCase()} save`)
  }
  if (action.damage && !action.attackProfile) {
    detailParts.push(
      action.damageType ? `${action.damage} ${action.damageType}` : action.damage,
    )
  }
  if (action.targeting) {
    const targetLabels: Record<string, string> = {
      'single-target': 'Single Target',
      'all-enemies': 'All Enemies',
      'entered-during-move': 'Entered During Move',
      'self': 'Self',
      'single-creature': 'Single Creature',
      'dead-creature': 'Dead Creature',
    }
    detailParts.push(targetLabels[action.targeting.kind] ?? action.targeting.kind)
  }

  return (
    <Paper
      variant="outlined"
      sx={{ 
        p: 2,
        borderColor: 'primary.main',
        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
        color: 'white',
      }}
    >
      <Stack spacing={0.5}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{action.label}</Typography>
          {costParts.map((cost) => (
            <AppBadge key={cost} label={cost} tone="default" variant="outlined" size="small" />
          ))}
        </Stack>
        {detailParts.length > 0 && (
          <Typography variant="body2" color="text.secondary">{detailParts.join(' · ')}</Typography>
        )}
      </Stack>
    </Paper>
  )
}
