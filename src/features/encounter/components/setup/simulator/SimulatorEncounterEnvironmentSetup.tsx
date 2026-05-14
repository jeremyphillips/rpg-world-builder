import { useEffect, useMemo } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import AppFormSelect from '@/ui/patterns/form/AppFormSelect'
import {
  ATMOSPHERE_TAGS,
  ENVIRONMENT_SETTINGS,
  LIGHTING_LEVELS,
  TERRAIN_MOVEMENT_TYPES,
  VISIBILITY_OBSCURED_LEVELS,
} from '@/features/mechanics/domain/environment'
import type {
  EncounterAtmosphereTag,
  EncounterEnvironmentBaseline,
  EncounterEnvironmentSetting,
  EncounterLightingLevel,
  EncounterTerrainMovement,
  EncounterVisibilityObscured,
} from '@/features/mechanics/domain/environment'

/** Simulator setup edits the global encounter baseline; same shape as {@link EncounterEnvironmentBaseline}. */
export type EnvironmentSetupValues = EncounterEnvironmentBaseline

type EnvironmentSelectForm = {
  setting: EncounterEnvironmentSetting
  lightingLevel: EncounterLightingLevel
  terrainMovement: EncounterTerrainMovement
  visibilityObscured: EncounterVisibilityObscured
}

type SimulatorEncounterEnvironmentSetupProps = {
  values: EnvironmentSetupValues
  onChange: (values: EnvironmentSetupValues) => void
  /** Second column (e.g. building location picker on simulator setup). */
  buildingLocationSlot?: React.ReactNode
}

function EnvironmentSetupSelectFields({
  values,
  onChange,
}: {
  values: EnvironmentSetupValues
  onChange: (values: EnvironmentSetupValues) => void
}) {
  const methods = useForm<EnvironmentSelectForm>({
    defaultValues: {
      setting: values.setting,
      lightingLevel: values.lightingLevel,
      terrainMovement: values.terrainMovement,
      visibilityObscured: values.visibilityObscured,
    },
  })

  const { reset } = methods

  useEffect(() => {
    reset({
      setting: values.setting,
      lightingLevel: values.lightingLevel,
      terrainMovement: values.terrainMovement,
      visibilityObscured: values.visibilityObscured,
    })
  }, [values.setting, values.lightingLevel, values.terrainMovement, values.visibilityObscured, reset])

  const settingOptions = useMemo(
    () => ENVIRONMENT_SETTINGS.map((o) => ({ value: o.id, label: o.name })),
    [],
  )
  const lightingOptions = useMemo(
    () => LIGHTING_LEVELS.map((o) => ({ value: o.id, label: o.name })),
    [],
  )
  const terrainOptions = useMemo(
    () => TERRAIN_MOVEMENT_TYPES.map((o) => ({ value: o.id, label: o.name })),
    [],
  )
  const visibilityOptions = useMemo(
    () => VISIBILITY_OBSCURED_LEVELS.map((o) => ({ value: o.id, label: o.name })),
    [],
  )

  return (
    <FormProvider {...methods}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <AppFormSelect
          name="setting"
          label="Setting"
          options={settingOptions}
          size="small"
          onAfterChange={(v) =>
            onChange({ ...values, setting: v as EncounterEnvironmentSetting })
          }
        />
        <AppFormSelect
          name="lightingLevel"
          label="Lighting"
          options={lightingOptions}
          size="small"
          onAfterChange={(v) =>
            onChange({ ...values, lightingLevel: v as EncounterLightingLevel })
          }
        />
        <AppFormSelect
          name="terrainMovement"
          label="Terrain"
          options={terrainOptions}
          size="small"
          onAfterChange={(v) =>
            onChange({ ...values, terrainMovement: v as EncounterTerrainMovement })
          }
        />
        <AppFormSelect
          name="visibilityObscured"
          label="Visibility"
          options={visibilityOptions}
          size="small"
          onAfterChange={(v) =>
            onChange({ ...values, visibilityObscured: v as EncounterVisibilityObscured })
          }
        />
      </Stack>
    </FormProvider>
  )
}

/**
 * Environment + optional building column for the **Encounter Simulator** setup route and edit modal.
 * Not a generic “any encounter host” panel — game session uses its own field components.
 */
export function SimulatorEncounterEnvironmentSetup({
  values,
  onChange,
  buildingLocationSlot,
}: SimulatorEncounterEnvironmentSetupProps) {
  function handleChange<K extends keyof EnvironmentSetupValues>(key: K, value: EnvironmentSetupValues[K]) {
    onChange({ ...values, [key]: value })
  }

  function toggleAtmosphereTag(tag: EncounterAtmosphereTag) {
    const next = new Set(values.atmosphereTags)
    if (next.has(tag)) next.delete(tag)
    else next.add(tag)
    const ordered = ATMOSPHERE_TAGS.map((t) => t.id).filter((id) => next.has(id as EncounterAtmosphereTag)) as EncounterAtmosphereTag[]
    handleChange('atmosphereTags', ordered)
  }

  const environmentColumn = (
    <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
      <Stack spacing={2}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Environment
        </Typography>

        <EnvironmentSetupSelectFields values={values} onChange={onChange} />

        <Box>
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
      </Stack>
    </Box>
  )

  return (
    <Paper variant="outlined" sx={{ p: 2.5, width: '100%', boxSizing: 'border-box' }}>
      {buildingLocationSlot ? (
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={3}
          alignItems="flex-start"
          sx={{ width: '100%' }}
        >
          {environmentColumn}
          <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>{buildingLocationSlot}</Box>
        </Stack>
      ) : (
        environmentColumn
      )}
    </Paper>
  )
}
