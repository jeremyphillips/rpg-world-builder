import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { AppBadge } from '@/ui/primitives'
import {
  ENVIRONMENT_SETTINGS,
  LIGHTING_LEVELS,
  TERRAIN_MOVEMENT_TYPES,
  VISIBILITY_OBSCURED_LEVELS,
} from '@/features/mechanics/domain/encounter/environment'
import type { EnvironmentSetupValues } from '../../setup/options/EncounterEnvironmentSetup'

type EncounterEnvironmentSummaryProps = {
  values: EnvironmentSetupValues
}

export function EncounterEnvironmentSummary({ values }: EncounterEnvironmentSummaryProps) {
  const items = [
    { label: 'Setting', value: ENVIRONMENT_SETTINGS.find((s) => s.id === values.setting)?.name ?? values.setting },
    { label: 'Lighting', value: LIGHTING_LEVELS.find((l) => l.id === values.lightingLevel)?.name ?? values.lightingLevel },
    { label: 'Terrain', value: TERRAIN_MOVEMENT_TYPES.find((t) => t.id === values.terrainMovement)?.name ?? values.terrainMovement },
    { label: 'Visibility', value: VISIBILITY_OBSCURED_LEVELS.find((v) => v.id === values.visibilityObscured)?.name ?? values.visibilityObscured },
  ]

  return (
    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mr: 0.5 }}>
        Environment
      </Typography>
      {items.map((item) => (
        <AppBadge
          key={item.label}
          label={`${item.label}: ${item.value}`}
          tone="default"
          variant="outlined"
          size="small"
        />
      ))}
    </Stack>
  )
}
