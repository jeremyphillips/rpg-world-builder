import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'

import { AppBadge } from '@/ui/primitives'
import type { CombatantInstance } from '@/features/mechanics/domain/encounter'

type CombatTargetPreviewCardProps = {
  target: CombatantInstance | null
  placeholder?: string
}

export function CombatTargetPreviewCard({
  target,
  placeholder = 'Select target',
}: CombatTargetPreviewCardProps) {
  if (!target) {
    return (
      <Paper variant="outlined" sx={{ p: 2, borderStyle: 'dashed' }}>
        <Typography variant="body2" color="text.secondary">{placeholder}</Typography>
      </Paper>
    )
  }

  const isDefeated = target.stats.currentHitPoints <= 0

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderColor: 'info.main',
        opacity: isDefeated ? 0.5 : 1,
        bgcolor: (theme) => alpha(theme.palette.info.main, 0.1),
        color: 'white'
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{target.source.label}</Typography>
        <AppBadge
          label={`AC ${target.stats.armorClass}`}
          tone="default"
          variant="outlined"
          size="small"
        />
        <AppBadge
          label={`HP ${target.stats.currentHitPoints}/${target.stats.maxHitPoints}`}
          tone={isDefeated ? 'danger' : 'default'}
          variant="outlined"
          size="small"
        />
        {target.concentration && (
          <AppBadge key="concentrating" label="Concentrating" tone="info" size="small" />
        )}
        {target.conditions.length > 0 && target.conditions.map((c) => (
          <AppBadge key={c.id} label={c.label} tone="warning" size="small" />
        ))}
      </Stack>
    </Paper>
  )
}
