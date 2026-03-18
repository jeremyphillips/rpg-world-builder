// features/levelUp/steps/LevelUpConfirmStep.tsx
//
// Final summary of all level-up choices before confirmation.

import { useMemo } from 'react'
import { getSubclassNameById } from '@/features/mechanics/domain/progression/subclass'
import { getClassProgression } from '@/features/mechanics/domain/progression/class'
import { getSystemSpells } from '@/features/mechanics/domain/rulesets/system/spells'
import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/rulesets/ids/systemIds'
import type { LevelUpState } from '../levelUp.types'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface LevelUpConfirmStepProps {
  state: LevelUpState
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSpellName(id: string): string {
  const spells = getSystemSpells(DEFAULT_SYSTEM_RULESET_ID)
  const spell = spells.find((s) => s.id === id)
  return spell?.name ?? id
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LevelUpConfirmStep({ state }: LevelUpConfirmStepProps) {
  const {
    characterName,
    currentLevel,
    pendingLevel,
    primaryClassId,
    classes,
    hpGained,
    hpMethod,
    newSpells,
    removedSpells,
    subclassId,
  } = state

  const primaryClass = classes.find(c => c.classId === primaryClassId)
  const className =
    primaryClassId.charAt(0).toUpperCase() + primaryClassId.slice(1)

  const subclassName = useMemo(
    () => getSubclassNameById(primaryClassId, subclassId ?? primaryClass?.subclassId),
    [primaryClassId, subclassId, primaryClass?.subclassId],
  )

  const prog = useMemo(
    () => getClassProgression(primaryClassId),
    [primaryClassId],
  )

  const hitDieLabel = prog
    ? !prog.hitDie && prog.hpPerLevel
      ? `${prog.hpPerLevel} HP/level`
      : `d${prog.hitDie}`
    : '—'

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Confirm Level-Up
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Review your choices before advancing <strong>{characterName}</strong>{' '}
        to level <strong>{pendingLevel}</strong>.
      </Typography>

      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            {/* Level change */}
            <Box>
              <Stack direction="row" alignItems="center" spacing={1}>
                <CheckCircleIcon color="success" fontSize="small" />
                <Typography variant="subtitle2" fontWeight={600}>
                  Level
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ ml: 4 }}>
                {className} {currentLevel} &rarr; {pendingLevel}
              </Typography>
            </Box>

            <Divider />

            {/* Subclass */}
            {subclassId && (
              <>
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CheckCircleIcon color="success" fontSize="small" />
                    <Typography variant="subtitle2" fontWeight={600}>
                      Subclass
                    </Typography>
                  </Stack>
                  <Typography variant="body2" sx={{ ml: 4 }}>
                    {subclassName ?? subclassId}
                  </Typography>
                </Box>
                <Divider />
              </>
            )}

            {/* Hit Points */}
            <Box>
              <Stack direction="row" alignItems="center" spacing={1}>
                <CheckCircleIcon
                  color={hpGained != null ? 'success' : 'disabled'}
                  fontSize="small"
                />
                <Typography variant="subtitle2" fontWeight={600}>
                  Hit Points
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ ml: 4 }}>
                {hpGained != null
                  ? `+${hpGained} HP (${hpMethod === 'rolled' ? `rolled ${hitDieLabel}` : `average of ${hitDieLabel}`})`
                  : 'Not yet selected'}
              </Typography>
            </Box>

            {/* Spells */}
            {(newSpells.length > 0 || removedSpells.length > 0) && (
              <>
                <Divider />
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CheckCircleIcon color="success" fontSize="small" />
                    <Typography variant="subtitle2" fontWeight={600}>
                      Spells
                    </Typography>
                  </Stack>
                  <Box sx={{ ml: 4, mt: 0.5 }}>
                    {newSpells.length > 0 && (
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mb: 0.5 }}>
                        {newSpells.map(id => (
                          <Chip
                            key={id}
                            label={`+ ${getSpellName(id)}`}
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        ))}
                      </Stack>
                    )}
                    {removedSpells.length > 0 && (
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {removedSpells.map(id => (
                          <Chip
                            key={id}
                            label={`- ${getSpellName(id)}`}
                            size="small"
                            color="error"
                            variant="outlined"
                          />
                        ))}
                      </Stack>
                    )}
                  </Box>
                </Box>
              </>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
