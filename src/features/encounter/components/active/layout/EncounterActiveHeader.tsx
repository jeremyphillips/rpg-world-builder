// import EditIcon from '@mui/icons-material/Edit'
// import RestartAltIcon from '@mui/icons-material/RestartAlt'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
// import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import type { Monster } from '@/features/content/monsters/domain/types'
import type { CombatantInstance } from '@/features/mechanics/domain/encounter'
import type { CombatantTurnResources } from '@/features/mechanics/domain/encounter/state/types/combatant.types'

import { AppBadge, AppTooltipWrap, encounterActiveBarSx } from '@/ui/primitives'

import type { EndTurnEmphasis } from '../../../domain'
import { EncounterActiveCombatantIdentity } from './EncounterActiveCombatantIdentity'

export type EncounterActiveHeaderProps = {
  roundNumber: number
  turnIndex: number
  turnCount: number
  nextCombatantLabel: string | null
  activeCombatant: CombatantInstance | null
  monstersById: Record<string, Monster | undefined>
  turnResources: CombatantTurnResources | null
  baseMovementFt: number
  directive: string
  endTurnEmphasis: EndTurnEmphasis
  canEndTurn: boolean
  onEndTurn: () => void
  onEditEncounter: () => void
  onResetEncounter: () => void
}

export function EncounterActiveHeader({
  roundNumber,
  turnIndex,
  turnCount,
  nextCombatantLabel,
  activeCombatant,
  monstersById,
  turnResources,
  baseMovementFt,
  directive,
  endTurnEmphasis,
  canEndTurn,
  onEndTurn,
  // onEditEncounter,
  // onResetEncounter,
}: EncounterActiveHeaderProps) {
  const move = turnResources?.movementRemaining ?? 0

  return (
    <Paper
      square
      elevation={2}
      sx={{
        position: 'relative',
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        ...encounterActiveBarSx,
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ md: 'flex-start' }}
      >
        <Box sx={{ flex: { md: '1 1 0' }, minWidth: 0, maxWidth: { md: '34%' } }}>
          {activeCombatant ? (
            <EncounterActiveCombatantIdentity combatant={activeCombatant} monstersById={monstersById} />
          ) : (
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              No active combatant
            </Typography>
          )}
        </Box>

        <Stack
          spacing={0.75}
          sx={{
            flex: { md: '0 1 360px' },
            minWidth: 0,
            alignItems: { md: 'center' },
            textAlign: { md: 'center' },
            alignSelf: { md: 'stretch' },
          }}
        >
          <Typography variant="caption" color="text.primary" sx={{ fontWeight: 600, letterSpacing: '0.06em' }}>
            Round {roundNumber} · Turn {turnIndex + 1}/{turnCount}
          </Typography>
          {nextCombatantLabel && (
            <Typography variant="body2" color="text.secondary" noWrap>
              Next: <strong>{nextCombatantLabel}</strong>
            </Typography>
          )}
          {turnResources && (
            <Stack
              direction="row"
              spacing={0.5}
              flexWrap="wrap"
              useFlexGap
              justifyContent={{ md: 'center' }}
            >
              <AppBadge
                label={`Action ${turnResources.actionAvailable ? '●' : '○'}`}
                tone={turnResources.actionAvailable ? 'success' : 'default'}
                variant="outlined"
                size="small"
              />
              <AppBadge
                label={`Bonus ${turnResources.bonusActionAvailable ? '●' : '○'}`}
                tone={turnResources.bonusActionAvailable ? 'success' : 'default'}
                variant="outlined"
                size="small"
              />
              <AppBadge
                label={`Move ${move}/${baseMovementFt} ft`}
                tone="default"
                variant="outlined"
                size="small"
              />
              <AppBadge
                label={`Reaction ${turnResources.reactionAvailable ? '●' : '○'}`}
                tone={turnResources.reactionAvailable ? 'success' : 'default'}
                variant="outlined"
                size="small"
              />
            </Stack>
          )}
        </Stack>

        <Stack
          spacing={1}
          sx={{
            flex: { md: '1 1 0' },
            minWidth: 0,
            alignItems: { md: 'flex-end' },
            alignSelf: { md: 'stretch' },
            justifyContent: 'center',
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              lineHeight: 1.35,
              textAlign: { xs: 'left', md: 'right' },
            }}
          >
            {directive}
          </Typography>
          <Button
            variant={endTurnEmphasis === 'strong' ? 'contained' : 'outlined'}
            color={endTurnEmphasis === 'strong' ? 'primary' : 'inherit'}
            size="medium"
            disabled={!canEndTurn}
            onClick={onEndTurn}
            sx={{ alignSelf: { xs: 'stretch', md: 'flex-end' }, minWidth: 120 }}
          >
            End Turn
          </Button>
        </Stack>
      </Stack>
      
      {/* leaving commented out until i can find a better place for these buttons */}
      {/* <Stack
        direction="row"
        spacing={0}
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          zIndex: 1,
        }}
      >
        <AppTooltipWrap tooltip="Edit encounter">
          <IconButton
            size="small"
            color="inherit"
            aria-label="Edit encounter"
            onClick={onEditEncounter}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </AppTooltipWrap>
        <AppTooltipWrap tooltip="Reset encounter">
          <IconButton
            size="small"
            color="inherit"
            aria-label="Reset encounter"
            onClick={onResetEncounter}
          >
            <RestartAltIcon fontSize="small" />
          </IconButton>
        </AppTooltipWrap>
      </Stack> */}
    </Paper>
  )
}
