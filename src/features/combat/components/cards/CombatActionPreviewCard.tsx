import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'

import { AppBadge } from '@/ui/primitives'
import type { CombatActionDefinition } from '@/features/mechanics/domain/combat/resolution/combat-action.types'
import { deriveCombatActionBadges } from '@/features/mechanics/domain/combat/presentation/badges/action/combat-action-badges'

import { combatToneToAppBadgeTone } from './combatant-badges'

const TARGETING_LABELS: Record<string, string> = {
  'single-target': 'Single Target',
  'all-enemies': 'All Enemies',
  'entered-during-move': 'Entered During Move',
  'self': 'Self',
  'single-creature': 'Single Creature',
  'dead-creature': 'Dead Creature',
  'none': 'No Target',
}

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

  const badges = deriveCombatActionBadges(action)
  const targetingLabel = action.targeting
    ? TARGETING_LABELS[action.targeting.kind] ?? action.targeting.kind
    : undefined

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
        {(badges.length > 0 || targetingLabel) && (
          <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" useFlexGap>
            {badges.map((b) => (
              <AppBadge
                key={`${b.kind}-${b.label}`}
                label={b.label}
                tone={combatToneToAppBadgeTone(b.tone)}
                variant="outlined"
                size="small"
              />
            ))}
            {targetingLabel && (
              <Typography variant="caption" color="text.secondary">{targetingLabel}</Typography>
            )}
          </Stack>
        )}
      </Stack>
    </Paper>
  )
}
