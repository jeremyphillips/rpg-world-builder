// features/levelUp/steps/LevelUpSubclassStep.tsx
//
// Lets the character owner choose a subclass when the new level triggers
// the subclass unlock for their class.

import { useMemo, useCallback } from 'react'
import { getAvailableSubclassesByLevel } from '@/features/mechanics/domain/progression/class'
import { ButtonGroup } from '@/ui/patterns'
import type { LevelUpState } from '../levelUp.types'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface LevelUpSubclassStepProps {
  state: LevelUpState
  onChange: (patch: Partial<LevelUpState>) => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LevelUpSubclassStep({
  state,
  onChange,
}: LevelUpSubclassStepProps) {
  const { primaryClassId, pendingLevel, subclassId } = state

  const subclassOptions = useMemo(() => {
    const definitions = getAvailableSubclassesByLevel(primaryClassId, pendingLevel)
    return definitions.map((d) => ({ id: d.id, label: d.name }))
  }, [primaryClassId, pendingLevel])

  const handleSelect = useCallback(
    (id: string) => {
      onChange({ subclassId: id })
    },
    [onChange],
  )

  if (subclassOptions.length === 0) {
    return (
      <Box>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Subclass
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No subclass options are available for this class and edition.
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Choose a Subclass
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Your class unlocks a specialization at level {pendingLevel}. Choose
        your path.
      </Typography>

      <ButtonGroup
        options={subclassOptions}
        value={subclassId ?? undefined}
        onChange={handleSelect}
        autoSelectSingle
      />
    </Box>
  )
}
