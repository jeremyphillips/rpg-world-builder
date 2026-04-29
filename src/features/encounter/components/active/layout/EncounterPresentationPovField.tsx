import { useEffect } from 'react'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import Box from '@mui/material/Box'

import { AppFormSelect } from '@/ui/patterns'

import type { EncounterSimulatorViewerMode } from '../../../domain'

const POV_OPTIONS: { value: EncounterSimulatorViewerMode; label: string }[] = [
  { value: 'active-combatant', label: 'Active combatant' },
  { value: 'selected-combatant', label: 'Selected combatant' },
  { value: 'dm', label: 'DM' },
]

type PovFormValues = { viewerMode: EncounterSimulatorViewerMode }

export type EncounterPresentationPovFieldProps = {
  simulatorViewerMode: EncounterSimulatorViewerMode
  onSimulatorViewerModeChange: (mode: EncounterSimulatorViewerMode) => void
}

/**
 * Grid/sidebar/header presentation POV — not turn ownership.
 * Uses {@link AppFormSelect} with react-hook-form; keeps form state in sync with parent `simulatorViewerMode`.
 */
export function EncounterPresentationPovField({
  simulatorViewerMode,
  onSimulatorViewerModeChange,
}: EncounterPresentationPovFieldProps) {
  const methods = useForm<PovFormValues>({
    defaultValues: { viewerMode: simulatorViewerMode },
  })

  useEffect(() => {
    methods.reset({ viewerMode: simulatorViewerMode })
  }, [simulatorViewerMode, methods])

  const watched = useWatch({ control: methods.control, name: 'viewerMode' })

  useEffect(() => {
    if (watched === undefined) return
    if (watched !== simulatorViewerMode) {
      onSimulatorViewerModeChange(watched)
    }
  }, [watched, simulatorViewerMode, onSimulatorViewerModeChange])

  return (
    <FormProvider {...methods}>
      <Box
        role="group"
        aria-label="Viewing as — battlefield presentation point of view"
        sx={{ maxWidth: '100%', minWidth: 160 }}
      >
        <AppFormSelect
          name="viewerMode"
          label="Viewing as"
          options={POV_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
        />
      </Box>
    </FormProvider>
  )
}
