import { useCallback, useMemo, useState } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import ButtonBase from '@mui/material/ButtonBase'
import Collapse from '@mui/material/Collapse'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

import { AppBadge, AppTooltipWrap } from '@/ui/primitives'
import { AppDrawer } from '@/ui/patterns'
import type { CombatActionDefinition, CombatActionKind } from '@/features/mechanics/domain/encounter/resolution/combat-action.types'
import {
  deriveBucketChrome,
  deriveBucketState,
  type CombatStateSection,
  type EnrichedPresentableEffect,
} from '../../../domain'
import { ActionRow } from '../action-row/ActionRow'
import { CasterOptionsFields } from '../action-row/CasterOptionsFields'

type CombatantActionDrawerProps = {
  open: boolean
  onClose: () => void
  title: string
  actions: CombatActionDefinition[]
  bonusActions: CombatActionDefinition[]
  availableActionIds?: Set<string>
  /** Actions that are valid against the currently selected target. */
  validActionIdsForTarget?: Set<string>
  selectedActionId?: string
  onSelectAction?: (actionId: string) => void
  selectedCasterOptions?: Record<string, string>
  onCasterOptionsChange?: (values: Record<string, string>) => void
  combatEffects: Record<CombatStateSection, EnrichedPresentableEffect[]>
  targetLabel?: string | null
  canResolveAction?: boolean
  onResolveAction?: () => void
  onEndTurn?: () => void
}

const SECTION_LABELS: Record<CombatStateSection, string> = {
  'critical-now': 'Critical',
  'ongoing-effects': 'Ongoing Effects',
  restrictions: 'Restrictions',
  'turn-triggers': 'Turn Triggers',
  'system-details': 'System Details',
}

function CollapsibleSection({
  title,
  count,
  defaultOpen = true,
  children,
}: {
  title: string
  count: number
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [expanded, setExpanded] = useState(defaultOpen)

  return (
    <Box>
      <ButtonBase
        onClick={() => setExpanded((prev) => !prev)}
        sx={{ width: '100%', justifyContent: 'space-between', py: 1, px: 0.5, borderRadius: 1 }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ({count})
          </Typography>
        </Stack>
        {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
      </ButtonBase>
      <Collapse in={expanded}>{children}</Collapse>
    </Box>
  )
}

const ACTION_KIND_ORDER: CombatActionKind[] = ['weapon-attack', 'monster-action', 'spell', 'combat-effect']

const ACTION_KIND_LABELS: Partial<Record<CombatActionKind, string>> = {
  'weapon-attack': 'Weapons',
  'monster-action': 'Natural',
  spell: 'Spells',
  'combat-effect': 'Effects',
}

function groupActionsByKind(actions: CombatActionDefinition[]) {
  const groups = new Map<CombatActionKind, CombatActionDefinition[]>()
  for (const action of actions) {
    const list = groups.get(action.kind)
    if (list) list.push(action)
    else groups.set(action.kind, [action])
  }
  return ACTION_KIND_ORDER.filter((kind) => groups.has(kind)).map((kind) => ({
    kind,
    label: ACTION_KIND_LABELS[kind] ?? kind,
    actions: groups.get(kind)!,
  }))
}

function GroupedActionList({
  actions,
  availableActionIds,
  validActionIdsForTarget,
  selectedActionId,
  onSelectAction,
}: {
  actions: CombatActionDefinition[]
  availableActionIds?: Set<string>
  validActionIdsForTarget?: Set<string>
  selectedActionId?: string
  onSelectAction?: (actionId: string) => void
}) {
  const groups = useMemo(() => groupActionsByKind(actions), [actions])
  const needsHeaders = groups.length > 1
  const allTreatAsAvailable = availableActionIds == null

  return (
    <Stack spacing={1} sx={{ pt: 0.5 }}>
      {actions.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No actions available.
        </Typography>
      ) : (
        groups.map(({ kind, label, actions: groupActions }) => (
          <Box key={kind}>
            {needsHeaders && (
              <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                {label}
              </Typography>
            )}
            <Stack spacing={1}>
              {groupActions.map((action) => {
                const resourceAvailable = allTreatAsAvailable || availableActionIds!.has(action.id)
                const validForTarget = validActionIdsForTarget == null || validActionIdsForTarget.has(action.id)
                const isAvailable = resourceAvailable && validForTarget
                return (
                  <ActionRow
                    key={action.id}
                    action={action}
                    isSelected={action.id === selectedActionId}
                    isAvailable={isAvailable}
                    onSelect={
                      onSelectAction
                        ? () => {
                            if (!isAvailable) return
                            onSelectAction(action.id)
                          }
                        : undefined
                    }
                  />
                )
              })}
            </Stack>
          </Box>
        ))
      )}
    </Stack>
  )
}

export function CombatantActionDrawer({
  open,
  onClose,
  title,
  actions,
  bonusActions,
  availableActionIds,
  validActionIdsForTarget,
  selectedActionId,
  onSelectAction,
  selectedCasterOptions,
  onCasterOptionsChange,
  combatEffects,
  targetLabel,
  canResolveAction,
  onResolveAction,
  onEndTurn,
}: CombatantActionDrawerProps) {
  const effectSections = (Object.entries(combatEffects) as [CombatStateSection, EnrichedPresentableEffect[]][]).filter(
    ([, effects]) => effects.length > 0,
  )
  const totalEffects = effectSections.reduce((sum, [, effects]) => sum + effects.length, 0)

  const availableIdsList = useMemo(
    () => (availableActionIds ? [...availableActionIds] : undefined),
    [availableActionIds],
  )

  const actionsSection = useMemo(() => {
    const state = deriveBucketState(actions, availableIdsList)
    return deriveBucketChrome('Actions', state)
  }, [actions, availableIdsList])

  const bonusSection = useMemo(() => {
    const state = deriveBucketState(bonusActions, availableIdsList)
    return deriveBucketChrome('Bonus Actions', state)
  }, [bonusActions, availableIdsList])

  const effectsSection = useMemo(
    () => deriveBucketChrome('Combat Effects', totalEffects === 0 ? 'empty' : 'available'),
    [totalEffects],
  )

  const selectedActionDefinition = useMemo(() => {
    if (!selectedActionId) return undefined
    return [...actions, ...bonusActions].find((a) => a.id === selectedActionId)
  }, [actions, bonusActions, selectedActionId])
  const casterFields = selectedActionDefinition?.casterOptions
  const stableOnCasterOptions = useCallback(
    (next: Record<string, string>) => {
      onCasterOptionsChange?.(next)
    },
    [onCasterOptionsChange],
  )

  return (
    <AppDrawer open={open} onClose={onClose} anchor="right" title={title} width={420}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ flex: 1, overflow: 'auto', px: 2, py: 2 }}>
          <Stack spacing={2}>
            <CollapsibleSection
              key={`${open}-actions-${actionsSection.title}`}
              title={actionsSection.title}
              count={actions.length}
              defaultOpen={actionsSection.defaultOpen}
            >
              <GroupedActionList
                actions={actions}
                availableActionIds={availableActionIds}
                validActionIdsForTarget={validActionIdsForTarget}
                selectedActionId={selectedActionId}
                onSelectAction={onSelectAction}
              />
            </CollapsibleSection>

            <CollapsibleSection
              key={`${open}-bonus-${bonusSection.title}`}
              title={bonusSection.title}
              count={bonusActions.length}
              defaultOpen={bonusSection.defaultOpen}
            >
              <GroupedActionList
                actions={bonusActions}
                availableActionIds={availableActionIds}
                validActionIdsForTarget={validActionIdsForTarget}
                selectedActionId={selectedActionId}
                onSelectAction={onSelectAction}
              />
            </CollapsibleSection>

            {casterFields &&
              casterFields.length > 0 &&
              selectedActionId &&
              selectedCasterOptions &&
              onCasterOptionsChange && (
                <CasterOptionsFields
                  formKey={selectedActionId}
                  fields={casterFields}
                  value={selectedCasterOptions}
                  onChange={stableOnCasterOptions}
                />
              )}

            <CollapsibleSection
              key={`${open}-effects-${effectsSection.title}`}
              title={effectsSection.title}
              count={totalEffects}
              defaultOpen={effectsSection.defaultOpen}
            >
              <Stack spacing={1} sx={{ pt: 0.5 }}>
                {totalEffects === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No active combat effects.
                  </Typography>
                ) : (
                  effectSections.map(([section, effects]) => (
                    <Box key={section}>
                      <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                        {SECTION_LABELS[section]}
                      </Typography>
                      <Stack spacing={0.5}>
                        {effects.map((effect) => (
                          <Stack key={effect.id} direction="row" spacing={1} alignItems="center">
                            <AppTooltipWrap tooltip={effect.presentation.rulesText}>
                              <AppBadge
                                label={effect.label}
                                tone={effect.presentation.tone === 'neutral' ? 'default' : effect.presentation.tone}
                                size="small"
                              />
                            </AppTooltipWrap>
                            {effect.duration && (
                              <Typography variant="caption" color="text.secondary">
                                {effect.duration}
                              </Typography>
                            )}
                            {effect.summary && (
                              <Typography variant="caption" color="text.secondary">
                                {effect.summary}
                              </Typography>
                            )}
                          </Stack>
                        ))}
                      </Stack>
                    </Box>
                  ))
                )}
              </Stack>
            </CollapsibleSection>
          </Stack>
        </Box>

        <Box
          sx={{
            position: 'sticky',
            bottom: 0,
            bgcolor: 'background.paper',
            borderTop: 1,
            borderColor: 'divider',
            px: 2,
            py: 2,
          }}
        >
          <Stack spacing={1.5}>
            <Typography variant="body2" color="text.secondary" noWrap>
              Target: {targetLabel || 'None selected'}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                fullWidth
                disabled={!canResolveAction}
                onClick={onResolveAction}
              >
                Resolve Action
              </Button>
              <Button variant="outlined" fullWidth onClick={onEndTurn}>
                End Turn
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Box>
    </AppDrawer>
  )
}
