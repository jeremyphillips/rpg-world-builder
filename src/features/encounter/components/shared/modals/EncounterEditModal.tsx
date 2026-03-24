import { useState } from 'react'

import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'

import { AppModal } from '@/ui/patterns'
import type { EnvironmentSetupValues } from '../../setup/options/EncounterEnvironmentSetup'
import { EncounterEnvironmentSetup } from '../../setup/options/EncounterEnvironmentSetup'

type EncounterEditModalProps = {
  open: boolean
  onClose: () => void
  environmentValues: EnvironmentSetupValues
  onSave: (env: EnvironmentSetupValues) => void
  allyLane: React.ReactNode
  opponentLane: React.ReactNode
}

export function EncounterEditModal({
  open,
  onClose,
  environmentValues,
  onSave,
  allyLane,
  opponentLane,
}: EncounterEditModalProps) {
  const [localEnv, setLocalEnv] = useState<EnvironmentSetupValues>(environmentValues)

  const handleSave = () => {
    onSave(localEnv)
    onClose()
  }

  return (
    <AppModal
      open={open}
      onClose={onClose}
      headline="Edit Encounter"
      size="wide"
      primaryAction={{ label: 'Save', onClick: handleSave }}
      secondaryAction={{ label: 'Cancel', onClick: onClose }}
    >
      <Stack spacing={3}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
            gap: 3,
          }}
        >
          {allyLane}
          {opponentLane}
        </Box>

        <EncounterEnvironmentSetup values={localEnv} onChange={setLocalEnv} />
      </Stack>
    </AppModal>
  )
}
