import { useCallback, useMemo, useState } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import ButtonBase from '@mui/material/ButtonBase'
import Collapse from '@mui/material/Collapse'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

import { AppBadge, AppTooltipWrap } from '@/ui/primitives'
import { AppDrawer } from '@/ui/patterns'
import type { CombatActionDefinition } from '@/features/mechanics/domain/encounter/resolution/combat-action.types'
import {
  deriveBucketChrome,
  deriveBucketState,
  type CombatStateSection,
  type EnrichedPresentableEffect,
} from '../../../domain'
import type { ActionSemanticCategory } from '../../../domain/badges/action/action-presentation.types'
import { deriveActionPresentation } from '../../../domain/badges/action/action-presentation'
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

// ---------------------------------------------------------------------------
// Category grouping
// ---------------------------------------------------------------------------

const CATEGORY_ORDER: ActionSemanticCategory[] = ['attack', 'heal', 'buff', 'utility', 'item']

const CATEGORY_LABELS: Record<ActionSemanticCategory, string> = {
  attack: 'Attacks',
  heal: 'Healing',
  buff: 'Buffs',
  utility: 'Utility',
  item: 'Items',
}

type CategoryGroup = {
  category: ActionSemanticCategory
  label: string
  actions: CombatActionDefinition[]
}

function groupActionsByCategory(actions: CombatActionDefinition[]): CategoryGroup[] {
  const groups = new Map<ActionSemanticCategory, CombatActionDefinition[]>()
  for (const action of actions) {
    const { category } = deriveActionPresentation(action)
    const list = groups.get(category)
    if (list) list.push(action)
    else groups.set(category, [action])
  }
  return CATEGORY_ORDER
    .filter((cat) => groups.has(cat))
    .map((cat) => ({ category: cat, label: CATEGORY_LABELS[cat], actions: groups.get(cat)! }))
}

// ---------------------------------------------------------------------------
// Recommended actions
// ---------------------------------------------------------------------------

const MAX_RECOMMENDED = 3

function hasSequence(action: CombatActionDefinition): boolean {
  return action.sequence != null && action.sequence.length > 0
}

const CATEGORY_SORT_PRIORITY: Record<string, number> = {
  attack: 0,
  heal: 1,
  buff: 2,
  utility: 3,
  item: 4,
}

function deriveRecommendedActions(
  actions: CombatActionDefinition[],
  availableActionIds: Set<string> | undefined,
  validActionIdsForTarget: Set<string> | undefined,
): CombatActionDefinition[] {
  if (validActionIdsForTarget == null) return []

  const allTreatAsAvailable = availableActionIds == null

  const candidates = actions.filter((a) => {
    const resourceAvailable = allTreatAsAvailable || availableActionIds!.has(a.id)
    const validForTarget = validActionIdsForTarget.has(a.id)
    return resourceAvailable && validForTarget
  })

  if (candidates.length === 0) return []

  const multiattackChildLabels = new Set<string>()
  for (const c of candidates) {
    if (hasSequence(c)) {
      for (const step of c.sequence!) {
        multiattackChildLabels.add(step.actionLabel)
      }
    }
  }

  const hasMultiattack = multiattackChildLabels.size > 0
  const filtered = hasMultiattack
    ? candidates.filter((c) => hasSequence(c) || !multiattackChildLabels.has(c.label))
    : candidates

  filtered.sort((a, b) => {
    const aSeq = hasSequence(a) ? 0 : 1
    const bSeq = hasSequence(b) ? 0 : 1
    if (aSeq !== bSeq) return aSeq - bSeq

    const aCat = CATEGORY_SORT_PRIORITY[deriveActionPresentation(a).category] ?? 99
    const bCat = CATEGORY_SORT_PRIORITY[deriveActionPresentation(b).category] ?? 99
    if (aCat !== bCat) return aCat - bCat

    return a.label.localeCompare(b.label)
  })

  return filtered.slice(0, MAX_RECOMMENDED)
}

// ---------------------------------------------------------------------------
// Action list rendering
// ---------------------------------------------------------------------------

function ActionItem({
  action,
  isAvailable,
  isSelected,
  onSelectAction,
}: {
  action: CombatActionDefinition
  isAvailable: boolean
  isSelected: boolean
  onSelectAction?: (actionId: string) => void
}) {
  return (
    <ActionRow
      action={action}
      isSelected={isSelected}
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
  const groups = useMemo(() => groupActionsByCategory(actions), [actions])
  const recommended = useMemo(
    () => deriveRecommendedActions(actions, availableActionIds, validActionIdsForTarget),
    [actions, availableActionIds, validActionIdsForTarget],
  )

  const needsHeaders = groups.length > 1
  const allTreatAsAvailable = availableActionIds == null
  const showRecommended = recommended.length > 0

  function isActionAvailable(action: CombatActionDefinition): boolean {
    const resourceAvailable = allTreatAsAvailable || availableActionIds!.has(action.id)
    const validForTarget = validActionIdsForTarget == null || validActionIdsForTarget.has(action.id)
    return resourceAvailable && validForTarget
  }

  if (actions.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ pt: 0.5 }}>
        No actions available.
      </Typography>
    )
  }

  return (
    <Stack spacing={1} sx={{ pt: 0.5 }}>
      {showRecommended && (
        <>
          <Box>
            <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.6rem', letterSpacing: '0.08em' }}>
              For this target
            </Typography>
            <Stack spacing={0.75}>
              {recommended.map((action) => (
                <ActionItem
                  key={`rec-${action.id}`}
                  action={action}
                  isAvailable={isActionAvailable(action)}
                  isSelected={action.id === selectedActionId}
                  onSelectAction={onSelectAction}
                />
              ))}
            </Stack>
          </Box>
          <Divider sx={{ my: 0.5 }} />
        </>
      )}

      {groups.map(({ category, label, actions: groupActions }) => (
        <Box key={category}>
          {needsHeaders && (
            <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
              {label}
            </Typography>
          )}
          <Stack spacing={1}>
            {groupActions.map((action) => (
              <ActionItem
                key={action.id}
                action={action}
                isAvailable={isActionAvailable(action)}
                isSelected={action.id === selectedActionId}
                onSelectAction={onSelectAction}
              />
            ))}
          </Stack>
        </Box>
      ))}
    </Stack>
  )
}

// ---------------------------------------------------------------------------
// Drawer
// ---------------------------------------------------------------------------

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
