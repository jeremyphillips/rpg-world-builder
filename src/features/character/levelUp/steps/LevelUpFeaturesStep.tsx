// features/levelUp/steps/LevelUpFeaturesStep.tsx
//
// Read-only summary of new class features gained at the pending level.
// Also flags ASI levels (placeholder for future feat/ASI selection).
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Chip from '@mui/material/Chip'
import StarIcon from '@mui/icons-material/Star'

import { useMemo } from 'react'
import { getClassProgression } from '@/features/mechanics/domain/progression/class'
import type { LevelUpState } from '../levelUp.types'
import type { ClassFeature } from '@/features/content/classes/domain/types'
import { AppAlert } from '@/ui/primitives'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface LevelUpFeaturesStepProps {
  state: LevelUpState
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LevelUpFeaturesStep({ state }: LevelUpFeaturesStepProps) {
  const { primaryClassId, classes, pendingLevel, currentLevel } = state

  const primaryClass = classes.find(c => c.classId === primaryClassId)
  const oldClassLevel = primaryClass?.level ?? 1
  const newClassLevel = oldClassLevel + (pendingLevel - currentLevel)

  const prog = useMemo(
    () => getClassProgression(primaryClassId),
    [primaryClassId],
  )

  // Gather features gained between old level (exclusive) and new level (inclusive)
  const newFeatures = useMemo<ClassFeature[]>(() => {
    if (!prog?.features) return []
    return prog.features.filter(
      f => f.level > oldClassLevel && f.level <= newClassLevel,
    )
  }, [prog, oldClassLevel, newClassLevel])

  // Check if this level is an ASI level
  const isAsiLevel = prog?.asiLevels?.includes(newClassLevel) ?? false

  // Check for Extra Attack
  const gainsExtraAttack = prog?.extraAttackLevel === newClassLevel

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        New Features at Level {pendingLevel}
      </Typography>

      {newFeatures.length === 0 && !isAsiLevel && !gainsExtraAttack && (
        <Typography variant="body2" color="text.secondary">
          No new class features at this level.
        </Typography>
      )}

      {/* ASI banner */}
      {isAsiLevel && (
        <AppAlert tone="info" icon={<StarIcon />} sx={{ mb: 2 }}>
          <Typography variant="subtitle2" fontWeight={600}>
            Ability Score Improvement
          </Typography>
          <Typography variant="body2">
            You can increase one ability score by 2, or two ability scores by 1
            each. Alternatively, your DM may allow you to choose a feat.
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            ASI/Feat selection will be available in a future update. For now,
            coordinate with your DM to update ability scores manually.
          </Typography>
        </AppAlert>
      )}

      {/* Extra Attack */}
      {gainsExtraAttack && (
        <Card variant="outlined" sx={{ mb: 2, borderColor: 'primary.light' }}>
          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Chip label={`Level ${newClassLevel}`} size="small" variant="outlined" />
              <Typography variant="subtitle2" fontWeight={600}>
                Extra Attack
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              You can attack twice, instead of once, whenever you take the
              Attack action on your turn.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Class features */}
      <Stack spacing={1.5}>
        {newFeatures.map((feature, idx) => (
          <Card key={idx} variant="outlined">
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Chip
                  label={`Level ${feature.level}`}
                  size="small"
                  variant="outlined"
                />
                <Typography variant="subtitle2" fontWeight={600}>
                  {feature.name}
                </Typography>
              </Stack>
              {feature.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {feature.description}
                </Typography>
              )}
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  )
}
