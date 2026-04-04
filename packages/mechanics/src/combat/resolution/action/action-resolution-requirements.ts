import {
  isAreaGridAction,
  resolveAttachedEmanationAnchorModeFromSelection,
} from './area-grid-action'
import { getCellForCombatant, getEncounterGridObjects } from '@/features/mechanics/domain/combat/space/space.helpers'
import type { CombatActionDefinition } from '../combat-action.types'
import type { EncounterState } from '../../state/types'
import type { CombatantInstance } from '../../state'
import { isValidActionTarget } from './action-targeting'
import { getHideActionUnavailableReason } from '../../state/stealth/stealth-rules'
import {
  getActionRequirements,
  getPlacementCtaLabel,
  getSingleCellPlacementRequirement,
  isSingleCellPlacementSatisfied,
} from './action-requirement-model'

export { resolveAttachedEmanationAnchorModeFromSelection } from './area-grid-action'

/** Phase-1 resolution gates derived from action metadata only (no map execution). */
export type ActionResolutionRequirementKind =
  | 'creature-target'
  | 'area-selection'
  | 'single-cell-placement'
  | 'caster-option'
  | 'object-anchor'
  | 'hide-eligibility'
  | 'none'

export type ActionResolutionMissing = {
  kind: ActionResolutionRequirementKind
  message: string
}

export type ActionResolutionReadiness = {
  canResolve: boolean
  missingRequirements: ActionResolutionMissing[]
}

/**
 * Same predicate as {@link isAreaGridAction} in encounter helpers.
 * Pass **`selectedCasterOptions`** when the action has **`place-or-object`** emanation anchoring.
 */
export function isAreaGridCombatAction(
  action: CombatActionDefinition | undefined | null,
  selectedCasterOptions?: Record<string, string>,
): boolean {
  return isAreaGridAction(action, selectedCasterOptions)
}

/** True when the action needs a grid object id (`EncounterSpace.gridObjects`) for resolve. */
export function actionRequiresObjectAnchorForResolve(
  action: CombatActionDefinition | undefined | null,
  selectedCasterOptions?: Record<string, string>,
): boolean {
  if (action?.attachedEmanation?.anchorMode === 'object') return true
  if (action?.attachedEmanation?.anchorMode === 'place-or-object') {
    return resolveAttachedEmanationAnchorModeFromSelection(action, selectedCasterOptions) === 'object'
  }
  return false
}

/**
 * True when resolve flow needs a selected combatant id from the target picker
 * (map/sidebar), matching `getActionTargets` / grid creature targeting.
 * Includes attached emanations with `anchorMode === 'creature'` (anchor follows selected target).
 */
export function actionRequiresCreatureTargetForResolve(
  action: CombatActionDefinition | undefined | null,
  selectedCasterOptions?: Record<string, string>,
): boolean {
  if (!action) return false
  if (action.attachedEmanation?.anchorMode === 'creature') return true
  if (action.attachedEmanation?.anchorMode === 'place-or-object') return false
  if (isAreaGridCombatAction(action, selectedCasterOptions)) return false
  if (action.attachedEmanation?.anchorMode === 'object') return false
  const kind = action.targeting?.kind
  if (kind === 'none' || kind === 'self' || kind === 'all-enemies') return false
  return (
    kind === 'single-target' ||
    kind === 'single-creature' ||
    kind === 'dead-creature' ||
    kind === 'entered-during-move'
  )
}

/**
 * Describes what must be satisfied before the encounter UI should enable Resolve.
 * Does not execute resolution — metadata only.
 */
export function getActionResolutionRequirements(action: CombatActionDefinition): ActionResolutionRequirementKind[] {
  if (action.attachedEmanation?.anchorMode === 'place-or-object') {
    return ['caster-option', 'area-selection', 'object-anchor']
  }
  if (action.attachedEmanation?.anchorMode === 'object') {
    const out: ActionResolutionRequirementKind[] = ['object-anchor']
    if (action.casterOptions?.length) out.push('caster-option')
    return out
  }
  if (isAreaGridCombatAction(action)) {
    const out: ActionResolutionRequirementKind[] = ['area-selection']
    if (action.casterOptions?.length) out.push('caster-option')
    return out
  }
  const declarative = getActionRequirements(action)
  const out: ActionResolutionRequirementKind[] = []
  for (const r of declarative) {
    if (r.kind === 'creature-target') out.push('creature-target')
    else if (r.kind === 'caster-option') out.push('caster-option')
    else if (r.kind === 'single-cell-placement') out.push('single-cell-placement')
  }
  if (out.length === 0) {
    return ['none']
  }
  return out
}

export type AoeStep = 'none' | 'placing' | 'confirm'

export type ActionResolutionReadinessContext = {
  selectedActionTargetId: string
  aoeStep: AoeStep
  aoeOriginCellId: string | null
  selectedCasterOptions: Record<string, string>
  /** Grid cell when the action requires single-cell map placement. */
  selectedSingleCellPlacementCellId?: string | null
  /** Grid object id from {@link EncounterSpace.gridObjects} when attached emanation `anchorMode === 'object'`. */
  selectedObjectAnchorId?: string | null
  encounterState: EncounterState | null | undefined
  activeCombatant: CombatantInstance | null | undefined
}

function casterOptionsSatisfied(
  action: CombatActionDefinition,
  selectedCasterOptions: Record<string, string>,
): boolean {
  const fields = action.casterOptions
  if (!fields?.length) return true
  return fields.every((f) => {
    const v = selectedCasterOptions[f.id]
    return v != null && String(v).trim() !== ''
  })
}

function creatureTargetSatisfied(
  action: CombatActionDefinition,
  ctx: ActionResolutionReadinessContext,
): boolean {
  if (!actionRequiresCreatureTargetForResolve(action, ctx.selectedCasterOptions)) return true
  if (!ctx.selectedActionTargetId) return false
  const { encounterState, activeCombatant } = ctx
  if (!encounterState || !activeCombatant) return false
  const target = encounterState.combatantsById[ctx.selectedActionTargetId]
  if (!target) return false
  return isValidActionTarget(encounterState, target, activeCombatant, action)
}

function areaSelectionSatisfied(
  action: CombatActionDefinition,
  ctx: ActionResolutionReadinessContext,
): boolean {
  if (!isAreaGridCombatAction(action, ctx.selectedCasterOptions)) return true
  if (action.attachedEmanation && action.areaPlacement === 'self') {
    const placements = ctx.encounterState?.placements
    const activeId = ctx.activeCombatant?.instanceId
    if (!placements || !activeId) return false
    return Boolean(getCellForCombatant(placements, activeId))
  }
  return ctx.aoeStep === 'confirm' && Boolean(ctx.aoeOriginCellId) && Boolean(action.areaTemplate)
}

/**
 * Evaluates drawer/runtime selection against {@link getActionResolutionRequirements}.
 */
export function getActionResolutionReadiness(
  action: CombatActionDefinition | null | undefined,
  ctx: ActionResolutionReadinessContext,
): ActionResolutionReadiness {
  const missingRequirements: ActionResolutionMissing[] = []
  if (!action) {
    return { canResolve: false, missingRequirements: [] }
  }

  if (action.attachedEmanation?.anchorMode === 'place-or-object') {
    const missingRequirements: ActionResolutionMissing[] = []
    if (!casterOptionsSatisfied(action, ctx.selectedCasterOptions)) {
      missingRequirements.push({ kind: 'caster-option', message: 'Choose spell options' })
    }
    const mode = resolveAttachedEmanationAnchorModeFromSelection(action, ctx.selectedCasterOptions)
    if (mode === 'object') {
      const oid = ctx.selectedObjectAnchorId?.trim()
      const obstacleOk = Boolean(
        oid && getEncounterGridObjects(ctx.encounterState?.space).some((o) => o.id === oid),
      )
      if (!obstacleOk) {
        missingRequirements.push({
          kind: 'object-anchor',
          message: 'Select a battlefield object',
        })
      }
    } else {
      if (!areaSelectionSatisfied(action, ctx)) {
        missingRequirements.push({
          kind: 'area-selection',
          message:
            ctx.aoeStep === 'placing'
              ? 'Place the area on the grid'
              : 'Confirm area placement',
        })
      }
    }
    return {
      canResolve: missingRequirements.length === 0,
      missingRequirements,
    }
  }

  if (action.attachedEmanation?.anchorMode === 'object') {
    const missingRequirements: ActionResolutionMissing[] = []
    const oid = ctx.selectedObjectAnchorId?.trim()
    const obstacleOk = Boolean(
      oid && getEncounterGridObjects(ctx.encounterState?.space).some((o) => o.id === oid),
    )
    if (!obstacleOk) {
      missingRequirements.push({
        kind: 'object-anchor',
        message: 'Select a battlefield object',
      })
    }
    if (!casterOptionsSatisfied(action, ctx.selectedCasterOptions)) {
      missingRequirements.push({ kind: 'caster-option', message: 'Choose spell options' })
    }
    return {
      canResolve: missingRequirements.length === 0,
      missingRequirements,
    }
  }

  if (isAreaGridCombatAction(action, ctx.selectedCasterOptions)) {
    if (!areaSelectionSatisfied(action, ctx)) {
      missingRequirements.push({
        kind: 'area-selection',
        message:
          ctx.aoeStep === 'placing'
            ? 'Place the area on the grid'
            : 'Confirm area placement',
      })
    }
    if (!casterOptionsSatisfied(action, ctx.selectedCasterOptions)) {
      missingRequirements.push({ kind: 'caster-option', message: 'Choose spell options' })
    }
    return {
      canResolve: missingRequirements.length === 0,
      missingRequirements,
    }
  }

  const declarative = getActionRequirements(action)
  for (const r of declarative) {
    if (r.kind === 'creature-target') {
      if (!creatureTargetSatisfied(action, ctx)) {
        missingRequirements.push({
          kind: 'creature-target',
          message: !ctx.selectedActionTargetId ? 'Select a target' : 'Invalid target',
        })
      }
    } else if (r.kind === 'caster-option') {
      if (!casterOptionsSatisfied(action, ctx.selectedCasterOptions)) {
        missingRequirements.push({ kind: 'caster-option', message: 'Choose spell options' })
      }
    } else if (r.kind === 'single-cell-placement') {
      const cellRaw = ctx.selectedSingleCellPlacementCellId?.trim()
      if (
        !isSingleCellPlacementSatisfied(action, {
          selectedSingleCellPlacementCellId: ctx.selectedSingleCellPlacementCellId,
          encounterState: ctx.encounterState,
          activeCombatantId: ctx.activeCombatant?.instanceId ?? null,
        })
      ) {
        const req = getSingleCellPlacementRequirement(action)
        missingRequirements.push({
          kind: 'single-cell-placement',
          message: cellRaw ? 'Invalid placement' : req ? getPlacementCtaLabel(req) : 'Choose Placement',
        })
      }
    }
  }

  if (action.resolutionMode === 'hide' && ctx.encounterState && ctx.activeCombatant) {
    const hideReason = getHideActionUnavailableReason(ctx.encounterState, ctx.activeCombatant.instanceId)
    if (hideReason) {
      missingRequirements.push({ kind: 'hide-eligibility', message: hideReason })
    }
  }

  return {
    canResolve: missingRequirements.length === 0,
    missingRequirements,
  }
}

/** Primary missing gate for CTA/header copy (first failure in requirement order). */
export function getPrimaryResolutionMissing(
  action: CombatActionDefinition | null | undefined,
  ctx: ActionResolutionReadinessContext,
): ActionResolutionMissing | null {
  const { missingRequirements } = getActionResolutionReadiness(action, ctx)
  return missingRequirements[0] ?? null
}
