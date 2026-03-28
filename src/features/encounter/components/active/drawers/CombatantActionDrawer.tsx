import { type ReactNode, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

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
import { actionRequiresCreatureTargetForResolve } from '@/features/mechanics/domain/encounter'
import type { CombatActionDefinition } from '@/features/mechanics/domain/encounter/resolution/combat-action.types'
import {
  buildInitialCasterOptionsForAction,
  formatCasterOptionSummary,
} from '@/features/mechanics/domain/spells/caster-options'
import {
  isAreaGridAction,
  resolveAttachedEmanationAnchorModeFromSelection,
  type AoeStep,
} from '../../../helpers/area-grid-action'
import { AoePlacementPanel } from './drawer-modes/AoePlacementPanel'
import { CasterOptionsDrawerPanel } from './drawer-modes/CasterOptionsDrawerPanel'
import {
  getPlacementCtaLabel,
  getSingleCellPlacementRequirement,
} from '@/features/mechanics/domain/encounter/resolution/action/action-requirement-model'
import { SingleCellPlacementPanel } from './drawer-modes/SingleCellPlacementPanel'

import {
  deriveBucketChrome,
  deriveBucketState,
  getUserFacingEffectLabel,
  type CombatStateSection,
  type EnrichedPresentableEffect,
} from '../../../domain'
import type { ActionSemanticCategory } from '../../../domain/actions/action-presentation.types'
import { deriveActionPresentation } from '../../../domain/actions/action-presentation'
import { ActionRow } from '../action-row/ActionRow'
import { deriveActionUnavailableHint } from './helpers/derive-action-unavailable-hint'
import type { CombatantInstance } from '@/features/mechanics/domain/encounter'
import type { CombatantOption } from '../../setup/modals/SelectEncounterCombatantModal'
import { AttachedEmanationSetupPanel } from './AttachedEmanationSetupPanel'

/**
 * Drawer sub-views. `aoePlacement` is parent-driven via `aoeStep`. `singleCellPlacement` uses local subview + map mode.
 */
export type CombatantActionDrawerView = 'main' | 'aoePlacement' | 'casterOptions' | 'singleCellPlacement'

export type CombatantActionDrawerProps = {
  open: boolean
  onClose: () => void
  title: string
  actions: CombatActionDefinition[]
  bonusActions: CombatActionDefinition[]
  availableActionIds?: Set<string>
  /** Actions that are valid against the currently selected target. */
  validActionIdsForTarget?: Set<string>
  /** Authoritative reason string for each action that failed target validation. */
  invalidActionReasons?: Map<string, string>
  selectedActionId?: string
  onSelectAction?: (actionId: string) => void
  selectedCasterOptions?: Record<string, string>
  onCasterOptionsChange?: (values: Record<string, string>) => void
  /** Selected map cell when the action requires single-cell placement. */
  selectedSingleCellPlacementCellId?: string | null
  onSelectedSingleCellPlacementCellIdChange?: (cellId: string | null) => void
  /** Short label for main-view summary, e.g. `C7`. */
  placementCellSummaryLabel?: string | null
  singleCellPlacementError?: string | null
  onDismissSingleCellPlacementError?: () => void
  onEnterSingleCellPlacementMode?: () => void
  onExitSingleCellPlacementMode?: () => void
  combatEffects: Record<CombatStateSection, EnrichedPresentableEffect[]>
  targetPreview?: ReactNode
  targetLabel?: string | null
  /** First unsatisfied resolution gate for the selected action (CTA when disabled). */
  primaryResolutionMissingMessage?: string | null
  canResolveAction?: boolean
  onResolveAction?: () => void
  onEndTurn?: () => void
  aoeStep?: AoeStep
  aoePlacementError?: string | null
  onDismissAoeError?: () => void
  aoeAffectedNames?: string[]
  aoeAffectedTotal?: number
  aoeAffectedOverflow?: number
  onCancelAoe?: () => void
  onUndoAoeSelection?: () => void
  /** When the selected spell has {@link CombatActionDefinition.attachedEmanation}. */
  attachedEmanationSetup?: {
    activeCombatantId: string
    allCombatants: readonly CombatantInstance[]
    combatantOptions: CombatantOption[]
    unaffectedCombatantIds: string[]
    onUnaffectedChange: (ids: string[]) => void
    suppressSameSideHostile: boolean
    partyCombatantIds: string[]
  } | null
}

/**
 * Closes the combatant action drawer when `activeCombatantId` changes (turn advance / end).
 * Use from the active encounter route with the same `onClose` that clears action selection and AoE state.
 */
export function useCloseCombatantActionDrawerOnActiveCombatantChange(
  activeCombatantId: string | null | undefined,
  onClose: () => void,
) {
  const prevIdRef = useRef<string | null | undefined>(undefined)
  useLayoutEffect(() => {
    if (prevIdRef.current !== undefined && prevIdRef.current !== activeCombatantId) {
      onClose()
    }
    prevIdRef.current = activeCombatantId ?? null
  }, [activeCombatantId, onClose])
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

function ActionItemWithHint({
  action,
  isAvailable,
  isSelected,
  hint,
  onSelectAction,
}: {
  action: CombatActionDefinition
  isAvailable: boolean
  isSelected: boolean
  hint: string | null
  onSelectAction?: (actionId: string) => void
}) {
  return (
    <Box>
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
      {hint && (
        <Typography variant="caption" color="text.secondary" sx={{ pl: 1, pt: 0.25, display: 'block' }}>
          {hint}
        </Typography>
      )}
    </Box>
  )
}

function GroupedActionList({
  actions,
  availableActionIds,
  validActionIdsForTarget,
  invalidActionReasons,
  selectedActionId,
  onSelectAction,
}: {
  actions: CombatActionDefinition[]
  availableActionIds?: Set<string>
  validActionIdsForTarget?: Set<string>
  invalidActionReasons?: Map<string, string>
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
                <ActionItemWithHint
                  key={`rec-${action.id}`}
                  action={action}
                  isAvailable={isActionAvailable(action)}
                  isSelected={action.id === selectedActionId}
                  hint={deriveActionUnavailableHint(action, availableActionIds, invalidActionReasons)}
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
              <ActionItemWithHint
                key={action.id}
                action={action}
                isAvailable={isActionAvailable(action)}
                isSelected={action.id === selectedActionId}
                hint={deriveActionUnavailableHint(action, availableActionIds, invalidActionReasons)}
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

/** Must match caster-option message from `getPrimaryResolutionMissing` / `getActionResolutionReadiness`. */
const PRIMARY_MISSING_CASTER_OPTIONS_MSG = 'Choose spell options'

// ---------------------------------------------------------------------------
// CTA label helper
// ---------------------------------------------------------------------------

function deriveCtaLabel(
  targetLabel: string | null | undefined,
  selectedActionLabel: string | undefined,
  selectedAction: CombatActionDefinition | undefined,
  canResolveAction: boolean | undefined,
  primaryResolutionMissingMessage: string | null | undefined,
  effectiveView: CombatantActionDrawerView,
  selectedCasterOptions?: Record<string, string>,
): string {
  if (effectiveView === 'singleCellPlacement') {
    return selectedActionLabel ? `Resolve ${selectedActionLabel}` : 'Resolve'
  }
  if (effectiveView === 'aoePlacement') return `Cast ${selectedActionLabel ?? 'spell'}`
  if (!selectedActionLabel) {
    if (!targetLabel) return 'Choose an action or target'
    return 'Choose an Action'
  }
  const needsTarget = actionRequiresCreatureTargetForResolve(selectedAction, selectedCasterOptions)
  if (needsTarget && !targetLabel) return 'Select a Target'
  if (canResolveAction) return `Resolve ${selectedActionLabel}`
  if (primaryResolutionMissingMessage) {
    if (
      !needsTarget &&
      (primaryResolutionMissingMessage === 'Select a target' ||
        primaryResolutionMissingMessage === 'Invalid target')
    ) {
      return `Resolve ${selectedActionLabel ?? 'action'}`
    }
    return primaryResolutionMissingMessage
  }
  return `Resolve ${selectedActionLabel}`
}

export function CombatantActionDrawer({
  open,
  onClose,
  title,
  actions,
  bonusActions,
  availableActionIds,
  validActionIdsForTarget,
  invalidActionReasons,
  selectedActionId,
  onSelectAction,
  selectedCasterOptions = {},
  onCasterOptionsChange,
  selectedSingleCellPlacementCellId,
  onSelectedSingleCellPlacementCellIdChange: _onSelectedSingleCellPlacementCellIdChange,
  placementCellSummaryLabel,
  singleCellPlacementError,
  onDismissSingleCellPlacementError,
  onEnterSingleCellPlacementMode,
  onExitSingleCellPlacementMode,
  combatEffects,
  targetPreview,
  targetLabel,
  primaryResolutionMissingMessage,
  canResolveAction,
  onResolveAction,
  onEndTurn: _onEndTurn,
  aoeStep = 'none',
  aoePlacementError,
  onDismissAoeError,
  aoeAffectedNames = [],
  aoeAffectedTotal = 0,
  aoeAffectedOverflow = 0,
  onCancelAoe,
  onUndoAoeSelection,
  attachedEmanationSetup = null,
}: CombatantActionDrawerProps) {
  /** `aoePlacement` overrides when parent is in AoE flow; otherwise `main` or `casterOptions`. */
  const [localSubView, setLocalSubView] = useState<'main' | 'casterOptions' | 'singleCellPlacement'>('main')
  const [fallbackCasterOptions, setFallbackCasterOptions] = useState<Record<string, string>>({})
  const isCasterOptionsControlled = onCasterOptionsChange != null

  useLayoutEffect(() => {
    if (!open) setLocalSubView('main')
  }, [open])

  useLayoutEffect(() => {
    setLocalSubView('main')
  }, [selectedActionId])

  useLayoutEffect(() => {
    if (aoeStep !== 'none') setLocalSubView('main')
  }, [aoeStep])

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

  // Uncontrolled: reset local draft when spell selection changes (no parent `useEncounterState`).
  /* eslint-disable react-hooks/set-state-in-effect -- intentional sync from selected action metadata */
  useEffect(() => {
    if (isCasterOptionsControlled) return
    if (!selectedActionId) {
      setFallbackCasterOptions({})
      return
    }
    setFallbackCasterOptions(buildInitialCasterOptionsForAction(selectedActionDefinition ?? null))
  }, [isCasterOptionsControlled, selectedActionId, selectedActionDefinition])
  /* eslint-enable react-hooks/set-state-in-effect */

  const resolvedCasterOptions = isCasterOptionsControlled ? selectedCasterOptions : fallbackCasterOptions

  const emitCasterOptions = useCallback(
    (next: Record<string, string>) => {
      if (onCasterOptionsChange) onCasterOptionsChange(next)
      else setFallbackCasterOptions(next)
    },
    [onCasterOptionsChange],
  )

  const showSpellOptionsSection = Boolean(
    casterFields?.length && selectedActionId && selectedActionDefinition,
  )

  const aoeAction =
    selectedActionDefinition && isAreaGridAction(selectedActionDefinition, resolvedCasterOptions)
      ? selectedActionDefinition
      : null

  const singleCellPlacementRequirement = useMemo(
    () =>
      selectedActionDefinition ? getSingleCellPlacementRequirement(selectedActionDefinition) : undefined,
    [selectedActionDefinition],
  )

  const effectiveView: CombatantActionDrawerView = useMemo(() => {
    /** All-enemies area + place / place-or-object (resolved to place) use the AoE placement panel. */
    const ae = selectedActionDefinition?.attachedEmanation
    const useAoePlacementForAttachedEmanation =
      Boolean(aoeAction) &&
      (!ae || ae.anchorMode === 'place' || ae.anchorMode === 'place-or-object')
    if (aoeStep !== 'none' && aoeAction?.areaTemplate && useAoePlacementForAttachedEmanation) {
      return 'aoePlacement'
    }
    if (localSubView === 'singleCellPlacement') return 'singleCellPlacement'
    return localSubView === 'casterOptions' ? 'casterOptions' : 'main'
  }, [
    aoeStep,
    aoeAction,
    selectedActionDefinition?.attachedEmanation,
    localSubView,
  ])

  const isMain = effectiveView === 'main'

  const bothBucketsSpent = actionsSection.title.includes('spent') && bonusSection.title.includes('spent')
  const ctaLabel = deriveCtaLabel(
    targetLabel,
    selectedActionDefinition?.label,
    selectedActionDefinition,
    canResolveAction,
    primaryResolutionMissingMessage,
    effectiveView,
    resolvedCasterOptions,
  )

  /** Footer reused the same copy as spell options but stayed disabled; open the options subview instead of resolve. */
  const shouldFooterOpenSpellOptions =
    effectiveView === 'main' &&
    !canResolveAction &&
    primaryResolutionMissingMessage === PRIMARY_MISSING_CASTER_OPTIONS_MSG &&
    Boolean(selectedActionDefinition?.casterOptions?.length)

  /** Same pattern for placement: primary missing message is placement/invalid-cell — open placement subview instead of a dead disabled CTA. */
  const shouldFooterOpenPlacement = useMemo(
    () =>
      effectiveView === 'main' &&
      !canResolveAction &&
      singleCellPlacementRequirement != null &&
      (primaryResolutionMissingMessage === getPlacementCtaLabel(singleCellPlacementRequirement) ||
        primaryResolutionMissingMessage === 'Invalid placement'),
    [
      effectiveView,
      canResolveAction,
      singleCellPlacementRequirement,
      primaryResolutionMissingMessage,
    ],
  )

  const footerPrimaryDisabled =
    shouldFooterOpenSpellOptions || shouldFooterOpenPlacement ? false : !canResolveAction

  const handleFooterPrimaryClick = useCallback(() => {
    if (shouldFooterOpenSpellOptions) {
      setLocalSubView('casterOptions')
      return
    }
    if (shouldFooterOpenPlacement) {
      setLocalSubView('singleCellPlacement')
      onEnterSingleCellPlacementMode?.()
      return
    }
    onResolveAction?.()
  }, [shouldFooterOpenSpellOptions, shouldFooterOpenPlacement, onEnterSingleCellPlacementMode, onResolveAction])

  const drawerFooterPrimaryLabel =
    shouldFooterOpenSpellOptions && effectiveView === 'main' ? 'Choose Spell Options' : ctaLabel

  const handleCasterOptionsDone = useCallback(() => {
    if (singleCellPlacementRequirement && !selectedSingleCellPlacementCellId?.trim()) {
      setLocalSubView('singleCellPlacement')
      onEnterSingleCellPlacementMode?.()
      return
    }
    setLocalSubView('main')
  }, [singleCellPlacementRequirement, selectedSingleCellPlacementCellId, onEnterSingleCellPlacementMode])

  const handleResolveFromSingleCellPlacement = useCallback(() => {
    onResolveAction?.()
    onExitSingleCellPlacementMode?.()
  }, [onResolveAction, onExitSingleCellPlacementMode])

  const casterOptionSummaryLine = useMemo(() => {
    if (!casterFields?.length) return ''
    const raw = formatCasterOptionSummary(casterFields, resolvedCasterOptions).trim()
    if (!raw) return ''
    return raw.replace(/^\s*\(/, '').replace(/\)\s*$/, '').trim()
  }, [casterFields, resolvedCasterOptions])

  const handleDrawerClose = useCallback(() => {
    onExitSingleCellPlacementMode?.()
    onClose()
  }, [onClose, onExitSingleCellPlacementMode])

  return (
    <AppDrawer open={open} onClose={handleDrawerClose} anchor="right" title={title} width={420} nonModal>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ flex: 1, overflow: 'auto', px: 2, py: 2 }}>
          <Stack spacing={2}>
            {effectiveView === 'aoePlacement' && aoeAction?.areaTemplate && aoeStep !== 'none' && (
              <>
                {attachedEmanationSetup &&
                  selectedActionDefinition?.attachedEmanation?.selectUnaffectedAtCast &&
                  resolveAttachedEmanationAnchorModeFromSelection(
                    selectedActionDefinition,
                    resolvedCasterOptions,
                  ) === 'place' &&
                  (selectedActionDefinition.attachedEmanation.anchorMode === 'place' ||
                    selectedActionDefinition.attachedEmanation.anchorMode === 'place-or-object') && (
                    <AttachedEmanationSetupPanel
                      actionLabel={selectedActionDefinition.label}
                      activeCombatantId={attachedEmanationSetup.activeCombatantId}
                      allCombatants={attachedEmanationSetup.allCombatants}
                      combatantOptions={attachedEmanationSetup.combatantOptions}
                      unaffectedCombatantIds={attachedEmanationSetup.unaffectedCombatantIds}
                      onUnaffectedChange={attachedEmanationSetup.onUnaffectedChange}
                      suppressSameSideHostile={attachedEmanationSetup.suppressSameSideHostile}
                      partyCombatantIds={attachedEmanationSetup.partyCombatantIds}
                    />
                  )}
                <AoePlacementPanel
                  action={aoeAction}
                  aoeStep={aoeStep}
                  aoePlacementError={aoePlacementError}
                  onDismissAoeError={onDismissAoeError}
                  aoeAffectedNames={aoeAffectedNames}
                  aoeAffectedTotal={aoeAffectedTotal}
                  aoeAffectedOverflow={aoeAffectedOverflow}
                  onCancelAoe={onCancelAoe}
                  onUndoAoeSelection={onUndoAoeSelection}
                />
              </>
            )}

            {effectiveView === 'casterOptions' && showSpellOptionsSection && (
                <CasterOptionsDrawerPanel
                  formKey={selectedActionId!}
                  actionLabel={selectedActionDefinition!.label}
                  fields={casterFields!}
                  value={resolvedCasterOptions}
                  onChange={emitCasterOptions}
                  onBack={() => setLocalSubView('main')}
                />
              )}

            
            {effectiveView === 'singleCellPlacement' && singleCellPlacementRequirement && selectedActionDefinition && (
              <SingleCellPlacementPanel
                actionLabel={selectedActionDefinition.label}
                requirement={singleCellPlacementRequirement}
                placementError={singleCellPlacementError}
                onDismissPlacementError={onDismissSingleCellPlacementError}
                onBack={() => {
                  setLocalSubView('main')
                  onExitSingleCellPlacementMode?.()
                }}
              />
            )}

            {isMain && (
              <>
                {selectedActionDefinition?.attachedEmanation && attachedEmanationSetup && (
                  <AttachedEmanationSetupPanel
                    actionLabel={selectedActionDefinition.label}
                    activeCombatantId={attachedEmanationSetup.activeCombatantId}
                    allCombatants={attachedEmanationSetup.allCombatants}
                    combatantOptions={attachedEmanationSetup.combatantOptions}
                    unaffectedCombatantIds={attachedEmanationSetup.unaffectedCombatantIds}
                    onUnaffectedChange={attachedEmanationSetup.onUnaffectedChange}
                    suppressSameSideHostile={attachedEmanationSetup.suppressSameSideHostile}
                    partyCombatantIds={attachedEmanationSetup.partyCombatantIds}
                  />
                )}
                <Box>
                  <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.6rem', letterSpacing: '0.08em' }}>
                    Target
                  </Typography>
                  {targetPreview ? (
                    <Box sx={{ mt: 0.5 }}>{targetPreview}</Box>
                  ) : selectedActionDefinition &&
                    !actionRequiresCreatureTargetForResolve(selectedActionDefinition) ? (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      No creature target required for this action
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Select a target on the map or sidebar
                    </Typography>
                  )}
                </Box>

                {targetLabel && !selectedActionId && (
                  <Typography variant="body2" color="text.secondary">
                    Choose an action below
                  </Typography>
                )}
                {!targetLabel &&
                  selectedActionId &&
                  selectedActionDefinition &&
                  actionRequiresCreatureTargetForResolve(selectedActionDefinition) && (
                    <Typography variant="body2" color="text.secondary">
                      Select a target on the map or sidebar
                    </Typography>
                  )}
                {bothBucketsSpent && (
                  <Typography variant="body2" color="warning.main" sx={{ fontWeight: 500 }}>
                    All actions spent this turn

                    <Button variant="contained" color="primary" fullWidth onClick={_onEndTurn}>
                      End Turn
                    </Button>
                  </Typography>
                )}

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
                        invalidActionReasons={invalidActionReasons}
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
                        invalidActionReasons={invalidActionReasons}
                        selectedActionId={selectedActionId}
                        onSelectAction={onSelectAction}
                      />
                    </CollapsibleSection>

                    {showSpellOptionsSection && (
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
                            Spell options
                          </Typography>
                          {casterOptionSummaryLine ? (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {casterOptionSummaryLine}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              None selected
                            </Typography>
                          )}
                          <Button variant="outlined" fullWidth onClick={() => setLocalSubView('casterOptions')}>
                            Choose Spell Options
                          </Button>
                        </Box>
                      )}
                    {singleCellPlacementRequirement && selectedActionDefinition && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
                          Map placement
                        </Typography>
                        {placementCellSummaryLabel ? (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Placement: {placementCellSummaryLabel}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            None selected
                          </Typography>
                        )}
                        <Button
                          variant="outlined"
                          fullWidth
                          onClick={() => {
                            setLocalSubView('singleCellPlacement')
                            onEnterSingleCellPlacementMode?.()
                          }}
                        >
                          {getPlacementCtaLabel(singleCellPlacementRequirement)}
                        </Button>
                      </Box>
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
                                        label={getUserFacingEffectLabel(effect)}
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
              </>
            )}
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
          {effectiveView === 'casterOptions' ? (
            <Button variant="contained" color="primary" fullWidth onClick={handleCasterOptionsDone}>
              Confirm Option
            </Button>
          ) : effectiveView === 'singleCellPlacement' ? (
            <Button
              variant="contained"
              color="primary"
              fullWidth
              disabled={!canResolveAction}
              onClick={handleResolveFromSingleCellPlacement}
            >
              {ctaLabel}
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              fullWidth
              disabled={footerPrimaryDisabled}
              onClick={handleFooterPrimaryClick}
            >
              {drawerFooterPrimaryLabel}
            </Button>
          )}
          {/* Phase-one: End Turn temporarily removed from drawer to reduce footer competition.
              Reintroduce when header / End Turn flow is redesigned.
          <Button variant="outlined" fullWidth onClick={_onEndTurn}>
            End Turn
          </Button>
          */}
        </Box>
      </Box>
    </AppDrawer>
  )
}
