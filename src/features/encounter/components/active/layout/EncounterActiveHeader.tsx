// import EditIcon from '@mui/icons-material/Edit'
// import RestartAltIcon from '@mui/icons-material/RestartAlt'
import { useLayoutEffect, useMemo, useRef } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
// import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import type { Monster } from '@/features/content/monsters/domain/types'
import type { CombatantInstance } from '@/features/mechanics/domain/combat'
import type { CombatantTurnResources } from '@/features/mechanics/domain/combat/state/types/combatant.types'

import {
  AppBadge,
  ENCOUNTER_ACTIVE_HEADER_HEIGHT_CSS_VAR,
  encounterActiveBarSx,
} from '@/ui/primitives'

import type {
  EndTurnEmphasis,
  EncounterPerceptionUiFeedback,
  EncounterSimulatorViewerMode,
  ViewerCombatantPresentationKind,
} from '../../../domain'
import {
  deriveTurnResourceBucketState,
  partitionCombatantActionBuckets,
  turnResourceBucketHeaderBadge,
} from '../../../domain'
import { EncounterActiveCombatantIdentity } from './EncounterActiveCombatantIdentity'
import { EncounterPresentationPovField } from './EncounterPresentationPovField'
import { AppTooltipWrap } from '@/ui/primitives'
import IconButton from '@mui/material/IconButton'
import EditIcon from '@mui/icons-material/Edit'
import RestartAltIcon from '@mui/icons-material/RestartAlt'

export type EncounterActiveHeaderProps = {
  roundNumber: number
  turnIndex: number
  turnCount: number
  nextCombatantLabel: string | null
  activeCombatant: CombatantInstance | null
  /** Duplicate-aware title for the active combatant. */
  activeCombatantDisplayLabel: string
  monstersById: Record<string, Monster | undefined>
  turnResources: CombatantTurnResources | null
  baseMovementFt: number
  directive: string
  endTurnEmphasis: EndTurnEmphasis
  /** When false, the Actions control is hidden (e.g. action and bonus action both spent). */
  canOpenActions: boolean
  onOpenActions: () => void
  canEndTurn: boolean
  onEndTurn: () => void
  onEditEncounter: () => void
  onResetEncounter: () => void
  /** Presentation POV for grid/sidebar/header (not turn ownership). */
  simulatorViewerMode: EncounterSimulatorViewerMode
  onSimulatorViewerModeChange: (mode: EncounterSimulatorViewerMode) => void
  /**
   * `simulator`: full POV + edit/reset (Encounter Simulator).
   * `session`: live session play — hides simulator POV switcher and edit/reset affordances.
   */
  toolbarVariant?: 'simulator' | 'session'
  /** Magical darkness / blind veil hints from `deriveEncounterPerceptionUiFeedback` (not the main POV line). */
  perceptionFeedback?: EncounterPerceptionUiFeedback | null
  /** Next combatant’s viewer presentation (strict POV); null when N/A. */
  nextCombatantPresentationKind?: ViewerCombatantPresentationKind | null
}

export function EncounterActiveHeader({
  roundNumber,
  turnIndex,
  turnCount,
  nextCombatantLabel,
  activeCombatant,
  activeCombatantDisplayLabel,
  monstersById,
  turnResources,
  baseMovementFt,
  directive,
  endTurnEmphasis,
  canOpenActions,
  onOpenActions,
  canEndTurn,
  onEndTurn,
  onEditEncounter,
  onResetEncounter,
  simulatorViewerMode,
  onSimulatorViewerModeChange,
  perceptionFeedback,
  nextCombatantPresentationKind = null,
  toolbarVariant = 'simulator',
}: EncounterActiveHeaderProps) {
  const showSimulatorChrome = toolbarVariant === 'simulator'
  const move = turnResources?.movementRemaining ?? 0
  const headerRootRef = useRef<HTMLDivElement>(null)
  const resourcesExhausted = !turnResources || (turnResources.actionAvailable === false && turnResources.bonusActionAvailable === false && turnResources.movementRemaining === 0)
  const actionBonusBadges = useMemo(() => {
    if (!turnResources || !activeCombatant) return null
    const { actionDefs, bonusDefs } = partitionCombatantActionBuckets(activeCombatant.actions)
    const actionState = deriveTurnResourceBucketState(actionDefs, turnResources.actionAvailable)
    const bonusState = deriveTurnResourceBucketState(bonusDefs, turnResources.bonusActionAvailable)
    return {
      action: turnResourceBucketHeaderBadge(actionState, 'action'),
      bonus: turnResourceBucketHeaderBadge(bonusState, 'bonus'),
    }
  }, [activeCombatant, turnResources])

  useLayoutEffect(() => {
    const el = headerRootRef.current
    if (!el) return

    const syncHeightVar = () => {
      const h = Math.ceil(el.getBoundingClientRect().height)
      document.documentElement.style.setProperty(ENCOUNTER_ACTIVE_HEADER_HEIGHT_CSS_VAR, `${h}px`)
    }

    syncHeightVar()
    const ro = new ResizeObserver(syncHeightVar)
    ro.observe(el)
    return () => {
      ro.disconnect()
      document.documentElement.style.removeProperty(ENCOUNTER_ACTIVE_HEADER_HEIGHT_CSS_VAR)
    }
  }, [])

  return (
    <Paper
      ref={headerRootRef}
      square
      elevation={2}
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: (theme) => theme.zIndex.appBar + 1,
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
            <EncounterActiveCombatantIdentity
              combatant={activeCombatant}
              displayLabel={activeCombatantDisplayLabel}
              monstersById={monstersById}
            />
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
          <Stack
            spacing={0.5}
            alignItems={{ md: 'center' }}
            role="status"
            aria-live="polite"
            aria-atomic="true"
            sx={{ maxWidth: '100%', width: '100%' }}
          >
            {showSimulatorChrome ? (
              <EncounterPresentationPovField
                simulatorViewerMode={simulatorViewerMode}
                onSimulatorViewerModeChange={onSimulatorViewerModeChange}
              />
            ) : (
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Session play
              </Typography>
            )}
            {perceptionFeedback?.magicalDarknessLine && (
              <AppTooltipWrap
                tooltip={
                  perceptionFeedback.visibilityHint ??
                  'Visibility rules follow the presentation viewer’s position.'
                }
              >
                <Box component="span" sx={{ display: 'inline-flex', maxWidth: '100%' }}>
                  <AppBadge
                    label={perceptionFeedback.magicalDarknessLine}
                    tone="warning"
                    variant="outlined"
                    size="small"
                  />
                </Box>
              </AppTooltipWrap>
            )}
          </Stack>
          {nextCombatantLabel && (
            <Stack
              direction="row"
              spacing={0.75}
              alignItems="center"
              justifyContent={{ md: 'center' }}
              sx={{ flexWrap: 'wrap', rowGap: 0.5 }}
            >
              <Typography variant="body2" color="text.secondary" noWrap>
                Next: <strong>{nextCombatantLabel}</strong>
              </Typography>
              {nextCombatantPresentationKind === 'out-of-sight' && (
                <AppBadge label="Out of sight" tone="default" variant="outlined" size="small" />
              )}
              {nextCombatantPresentationKind === 'hidden' && (
                <AppBadge label="Hidden" tone="warning" variant="outlined" size="small" />
              )}
            </Stack>
          )}
          {turnResources && (
            <Stack
              direction="row"
              spacing={0.5}
              flexWrap="wrap"
              useFlexGap
              justifyContent={{ md: 'center' }}
            >
              {actionBonusBadges && (
                <>
                  <AppBadge
                    label={actionBonusBadges.action.label}
                    tone={actionBonusBadges.action.tone}
                    variant="outlined"
                    size="small"
                  />
                  <AppBadge
                    label={actionBonusBadges.bonus.label}
                    tone={actionBonusBadges.bonus.tone}
                    variant="outlined"
                    size="small"
                  />
                </>
              )}
              <AppBadge
                label={`Move ${move}/${baseMovementFt} ft`}
                tone="default"
                variant="outlined"
                size="small"
              />
              <Typography variant="caption" color="text.secondary" sx={{  letterSpacing: '0.06em' }}>
                Reaction: <strong>{turnResources.reactionAvailable ? 'ready' : 'spent'}</strong>
              </Typography>
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
            color={resourcesExhausted ? 'warning.main' : 'inherit'}
            sx={{
              fontWeight: 700,
              lineHeight: 1.35,
              textAlign: { xs: 'left', md: 'right' },
            }}
          >
            {directive}
          </Typography>
          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            flexWrap="wrap"
            sx={{
              alignSelf: { xs: 'stretch', md: 'flex-end' },
              justifyContent: { xs: 'stretch', md: 'flex-end' },
            }}
          >
            {canOpenActions && (
              <Button variant="outlined" color="primary" size="medium" onClick={onOpenActions} sx={{ minWidth: 120 }}>
                Actions
              </Button>
            )}
            <Button
              variant={endTurnEmphasis === 'strong' ? 'contained' : 'outlined'}
              color={endTurnEmphasis === 'strong' ? 'primary' : 'inherit'}
              size="medium"
              disabled={!canEndTurn}
              onClick={onEndTurn}
              sx={{ minWidth: 120 }}
            >
              End Turn
            </Button>
          </Stack>
        </Stack>
      </Stack>
      
      {showSimulatorChrome && (
        <Stack
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
        </Stack>
      )}
    </Paper>
  )
}
