import { useState } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Collapse from '@mui/material/Collapse'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'

export type GridSizePreset = 'small' | 'medium' | 'large'

export const GRID_SIZE_PRESETS: Record<GridSizePreset, { columns: number; rows: number; label: string; description: string }> = {
  small: { columns: 8, rows: 6, label: 'Small', description: '8 \u00d7 6 (40 \u00d7 30 ft)' },
  medium: { columns: 12, rows: 10, label: 'Medium', description: '12 \u00d7 10 (60 \u00d7 50 ft)' },
  large: { columns: 16, rows: 12, label: 'Large', description: '16 \u00d7 12 (80 \u00d7 60 ft)' },
}

type EncounterGridSetupProps = {
  value: GridSizePreset
  onChange: (preset: GridSizePreset) => void
}

export function EncounterGridSetup({ value, onChange }: EncounterGridSetupProps) {
  const [expanded, setExpanded] = useState(false)
  const current = GRID_SIZE_PRESETS[value]

  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Combat Grid
          </Typography>
          {!expanded && (
            <Typography variant="body2" color="text.secondary">
              {current.label} &mdash; {current.description}
            </Typography>
          )}
        </Box>
        <Button variant="text" color="inherit" size="small" onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Collapse' : 'Configure'}
        </Button>
      </Stack>

      <Collapse in={expanded}>
        <Stack spacing={2} sx={{ mt: 2 }}>
          <ToggleButtonGroup
            exclusive
            value={value}
            onChange={(_, next) => { if (next) onChange(next) }}
            size="small"
          >
            {(Object.entries(GRID_SIZE_PRESETS) as [GridSizePreset, typeof current][]).map(([key, preset]) => (
              <ToggleButton key={key} value={key} sx={{ textTransform: 'none', px: 3 }}>
                <Stack alignItems="center" spacing={0.25}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{preset.label}</Typography>
                  <Typography variant="caption" color="text.secondary">{preset.description}</Typography>
                </Stack>
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>
      </Collapse>
    </Paper>
  )
}
