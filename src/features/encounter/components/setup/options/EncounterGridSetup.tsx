import { useState } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Collapse from '@mui/material/Collapse'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'

import {
  GRID_SIZE_PRESETS,
  type GridSizePreset,
} from '@/shared/domain/grid/gridPresets'
import { GridEditor } from '@/features/content/locations/components/mapGrid';

function capitalizePreset(key: string) {
  return key.slice(0, 1).toUpperCase() + key.slice(1)
}

type EncounterGridSetupProps = {
  value: GridSizePreset
  onChange: (preset: GridSizePreset) => void
}

export function EncounterGridSetup({ value, onChange }: EncounterGridSetupProps) {
  const [expanded, setExpanded] = useState(false)
  const [previewSelectedId, setPreviewSelectedId] = useState<string | null>(null)
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
              {capitalizePreset(value)} — {current.columns} × {current.rows}
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
            onChange={(_, next) => {
              if (next) onChange(next)
            }}
            size="small"
          >
            {(Object.entries(GRID_SIZE_PRESETS) as [GridSizePreset, (typeof GRID_SIZE_PRESETS)['small']][]).map(
              ([key, def]) => (
                <ToggleButton key={key} value={key} sx={{ textTransform: 'none', px: 3 }}>
                  <Stack alignItems="center" spacing={0.25}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {capitalizePreset(key)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {def.columns} × {def.rows}
                    </Typography>
                  </Stack>
                </ToggleButton>
              ),
            )}
          </ToggleButtonGroup>
          <Box sx={{ maxHeight: 220, overflow: 'auto' }}>
            <GridEditor
              columns={current.columns}
              rows={current.rows}
              selectedCellId={previewSelectedId}
              onCellClick={(cell) => setPreviewSelectedId(cell.cellId)}
            />
          </Box>
        </Stack>
      </Collapse>
    </Paper>
  )
}
