// features/levelUp/steps/LevelUpHitPointsStep.tsx
//
// Lets the character owner choose how to generate HP for the new level:
// take the average or roll.

import { useCallback } from 'react'
import { getHitPointInfoByClassId } from '@/features/mechanics/domain/progression/class'
import { getAverageHitPointsForLevel } from '@/features/mechanics/domain/progression/hit-points'
import { rollHitDie } from '@/features/mechanics/domain/dice'
import type { LevelUpState } from '../levelUp.types'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Chip from '@mui/material/Chip'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface LevelUpHitPointsStepProps {
  state: LevelUpState
  onChange: (patch: Partial<LevelUpState>) => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LevelUpHitPointsStep({
  state,
  onChange,
}: LevelUpHitPointsStepProps) {
  const { primaryClassId, hpGained, hpMethod } = state

  const hpInfo = getHitPointInfoByClassId(primaryClassId)

  const { hitDie, averageHp, isFlat, flatHp } = hpInfo

  const handleAverage = useCallback(() => {
    onChange({ hpGained: getAverageHitPointsForLevel(hpInfo), hpMethod: 'average' })
  }, [hpInfo, onChange])

  const handleRoll = useCallback(() => {
    onChange({ hpGained: rollHitDie(hitDie), hpMethod: 'rolled' })
  }, [hitDie, onChange])

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Hit Points
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Choose how to determine hit points for level {state.pendingLevel}.
      </Typography>

      {!isFlat && (
        <Chip
          label={`Hit Die: d${hitDie}`}
          size="small"
          variant="outlined"
          sx={{ mb: 2 }}
        />
      )}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        {/* Average option */}
        <Card
          variant="outlined"
          sx={{
            flex: 1,
            cursor: 'pointer',
            transition: 'border-color 0.15s ease',
            ...(hpMethod === 'average' && {
              borderColor: 'primary.main',
              bgcolor: 'action.hover',
            }),
          }}
          onClick={handleAverage}
        >
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle2" fontWeight={600}>
                {isFlat ? 'Standard' : 'Take Average'}
              </Typography>
              {hpMethod === 'average' && (
                <CheckCircleIcon color="primary" fontSize="small" />
              )}
            </Stack>
            <Typography variant="h4" sx={{ my: 1 }}>
              +{isFlat ? flatHp : averageHp} HP
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {isFlat
                ? `Fixed ${flatHp} HP per level`
                : `Average of d${hitDie} (${hitDie / 2} + 1)`}
            </Typography>
          </CardContent>
        </Card>

        {/* Roll option */}
        {!isFlat && (
          <Card
            variant="outlined"
            sx={{
              flex: 1,
              cursor: 'pointer',
              transition: 'border-color 0.15s ease',
              ...(hpMethod === 'rolled' && {
                borderColor: 'primary.main',
                bgcolor: 'action.hover',
              }),
            }}
            onClick={handleRoll}
          >
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle2" fontWeight={600}>
                  Roll
                </Typography>
                {hpMethod === 'rolled' && (
                  <CheckCircleIcon color="primary" fontSize="small" />
                )}
              </Stack>
              <Typography variant="h4" sx={{ my: 1 }}>
                {hpGained != null && hpMethod === 'rolled'
                  ? `+${hpGained} HP`
                  : `d${hitDie}`}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {hpMethod === 'rolled'
                  ? 'Click again to re-roll'
                  : `Roll 1d${hitDie} for hit points`}
              </Typography>
            </CardContent>
          </Card>
        )}
      </Stack>

      {hpGained != null && (
        <Typography
          variant="body2"
          color="success.main"
          fontWeight={600}
          sx={{ mt: 2 }}
        >
          +{hpGained} hit points will be added.
        </Typography>
      )}
    </Box>
  )
}
