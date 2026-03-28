import { useState } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Collapse from '@mui/material/Collapse'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import {
  ATMOSPHERE_TAGS,
  ENVIRONMENT_SETTINGS,
  LIGHTING_LEVELS,
  TERRAIN_MOVEMENT_TYPES,
  VISIBILITY_OBSCURED_LEVELS,
} from '@/features/mechanics/domain/encounter/environment'
import type {
  EncounterAtmosphereTag,
  EncounterEnvironmentBaseline,
  EncounterEnvironmentSetting,
  EncounterLightingLevel,
  EncounterTerrainMovement,
  EncounterVisibilityObscured,
} from '@/features/mechanics/domain/encounter/environment'

/** Setup panel edits the global encounter baseline; same shape as {@link EncounterEnvironmentBaseline}. */
export type EnvironmentSetupValues = EncounterEnvironmentBaseline

type EncounterEnvironmentSetupProps = {
  values: EnvironmentSetupValues
  onChange: (values: EnvironmentSetupValues) => void
}

export function EncounterEnvironmentSetup({ values, onChange }: EncounterEnvironmentSetupProps) {
  const [expanded, setExpanded] = useState(false)

  function handleChange<K extends keyof EnvironmentSetupValues>(key: K, value: EnvironmentSetupValues[K]) {
    onChange({ ...values, [key]: value })
  }

  const atmosphereSummary =
    values.atmosphereTags.length > 0
      ? values.atmosphereTags
          .map((id) => ATMOSPHERE_TAGS.find((t) => t.id === id)?.name ?? id)
          .join(', ')
      : null

  const summaryParts = [
    ENVIRONMENT_SETTINGS.find((s) => s.id === values.setting)?.name,
    LIGHTING_LEVELS.find((l) => l.id === values.lightingLevel)?.name,
    TERRAIN_MOVEMENT_TYPES.find((t) => t.id === values.terrainMovement)?.name,
    VISIBILITY_OBSCURED_LEVELS.find((v) => v.id === values.visibilityObscured)?.name,
    atmosphereSummary,
  ].filter(Boolean)

  function toggleAtmosphereTag(tag: EncounterAtmosphereTag) {
    const next = new Set(values.atmosphereTags)
    if (next.has(tag)) next.delete(tag)
    else next.add(tag)
    const ordered = ATMOSPHERE_TAGS.map((t) => t.id).filter((id) => next.has(id as EncounterAtmosphereTag)) as EncounterAtmosphereTag[]
    handleChange('atmosphereTags', ordered)
  }

  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Environment
          </Typography>
          {!expanded && (
            <Typography variant="body2" color="text.secondary">
              {summaryParts.join(', ')}
            </Typography>
          )}
        </Box>
        <Button variant="text" color="inherit" size="small" onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Collapse' : 'Configure'}
        </Button>
      </Stack>

      <Collapse in={expanded}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ mt: 2 }}
        >
          <TextField
            select
            fullWidth
            label="Setting"
            value={values.setting}
            onChange={(e) => handleChange('setting', e.target.value as EncounterEnvironmentSetting)}
            size="small"
          >
            {ENVIRONMENT_SETTINGS.map((option) => (
              <MenuItem key={option.id} value={option.id}>
                {option.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            fullWidth
            label="Lighting"
            value={values.lightingLevel}
            onChange={(e) => handleChange('lightingLevel', e.target.value as EncounterLightingLevel)}
            size="small"
          >
            {LIGHTING_LEVELS.map((option) => (
              <MenuItem key={option.id} value={option.id}>
                {option.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            fullWidth
            label="Terrain"
            value={values.terrainMovement}
            onChange={(e) => handleChange('terrainMovement', e.target.value as EncounterTerrainMovement)}
            size="small"
          >
            {TERRAIN_MOVEMENT_TYPES.map((option) => (
              <MenuItem key={option.id} value={option.id}>
                {option.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            fullWidth
            label="Visibility"
            value={values.visibilityObscured}
            onChange={(e) => handleChange('visibilityObscured', e.target.value as EncounterVisibilityObscured)}
            size="small"
          >
            {VISIBILITY_OBSCURED_LEVELS.map((option) => (
              <MenuItem key={option.id} value={option.id}>
                {option.name}
              </MenuItem>
            ))}
          </TextField>
        </Stack>

        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Atmosphere (optional, additive)
          </Typography>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            {ATMOSPHERE_TAGS.map((option) => {
              const selected = values.atmosphereTags.includes(option.id)
              return (
                <Chip
                  key={option.id}
                  label={option.name}
                  size="small"
                  variant={selected ? 'filled' : 'outlined'}
                  color={selected ? 'primary' : 'default'}
                  onClick={() => toggleAtmosphereTag(option.id)}
                  sx={{ cursor: 'pointer' }}
                />
              )
            })}
          </Stack>
        </Box>
      </Collapse>
    </Paper>
  )
}
