import type { CombatActionDefinition } from '../combat-action.types'
import type { SpawnEffect, SpawnPlacement } from '@/features/mechanics/domain/effects/effects.types'
import type { CombatantPosition, EncounterSpace } from '@/features/encounter/space'
import { getCellById, getCellForCombatant, getOccupant, gridDistanceFt } from '@/features/encounter/space'
import { hasLineOfSight } from '@/features/encounter/space/sight/space.sight'
import { isAreaGridAction } from '@/features/encounter/helpers/actions'
import { areaTemplateRadiusFt } from './action-targeting'

// ---------------------------------------------------------------------------
// Declarative requirements (inputs before resolve)
// ---------------------------------------------------------------------------

export type SingleCellPlacementPurpose =
  | 'spawn'
  | 'teleport'
  | 'effect-origin'
  | 'object-placement'
  | 'reposition'

export type ActionRequirement =
  | { kind: 'caster-option' }
  | {
      kind: 'creature-target'
      rangeFt?: number
      lineOfSightRequired?: boolean
    }
  | {
      kind: 'single-cell-placement'
      rangeFt: number
      lineOfSightRequired: boolean
      mustBeUnoccupied: boolean
      purpose?: SingleCellPlacementPurpose
      ctaLabel?: string
    }
  | {
      kind: 'area-placement'
      radiusFt?: number
      lineOfSightRequired?: boolean
    }

// ---------------------------------------------------------------------------
// UI steps (drawer views — not 1:1 with requirements; LoS is not a step)
// ---------------------------------------------------------------------------

export type ActionStepKind = 'creatureTarget' | 'casterOptions' | 'singleCellPlacement' | 'aoePlacement'

export type ActionStepDefinition = {
  kind: ActionStepKind
  label: string
}

const STEP_LABELS: Record<ActionStepKind, string> = {
  creatureTarget: 'Target',
  casterOptions: 'Spell options',
  singleCellPlacement: 'Placement',
  aoePlacement: 'Area',
}

const STEP_ORDER: ActionStepKind[] = ['creatureTarget', 'casterOptions', 'singleCellPlacement', 'aoePlacement']

// ---------------------------------------------------------------------------
// Placement validation
// ---------------------------------------------------------------------------

export type PlacementValidationReason =
  | 'out-of-range'
  | 'no-line-of-sight'
  | 'occupied'
  | 'invalid-terrain'

export type PlacementValidationResult = {
  isValid: boolean
  reasons: PlacementValidationReason[]
}

const PURPOSE_DEFAULT_CTA: Record<SingleCellPlacementPurpose, string> = {
  spawn: 'Choose Placement',
  teleport: 'Choose Destination',
  'effect-origin': 'Choose Origin',
  'object-placement': 'Choose Placement',
  reposition: 'Choose Placement',
}

/** Primary button label for entering single-cell placement (drawer CTA). */
export function getPlacementCtaLabel(req: SingleCellPlacementRequirement): string {
  if (req.ctaLabel?.trim()) return req.ctaLabel.trim()
  if (req.purpose) return PURPOSE_DEFAULT_CTA[req.purpose]
  return 'Choose Placement'
}

function isAreaGridCombatAction(action: CombatActionDefinition | undefined | null): boolean {
  return isAreaGridAction(action)
}

function actionRequiresCreatureTargetForResolveLocal(action: CombatActionDefinition | undefined | null): boolean {
  if (!action) return false
  if (action.attachedEmanation?.anchorMode === 'creature') return true
  if (action.attachedEmanation?.anchorMode === 'place-or-object') return false
  if (isAreaGridCombatAction(action)) return false
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
 * Resolved placement when `SpawnEffect.placement` is omitted (legacy spell data).
 */
export function effectiveSpawnPlacement(effect: SpawnEffect): SpawnPlacement {
  if (effect.placement) return effect.placement
  if (effect.mapMonsterIdFromTargetRemains) return { kind: 'inherit-from-target' }
  if (effect.location === 'self-space') return { kind: 'self-space' }
  if (effect.location === 'self-cell') return { kind: 'self-cell' }
  return {
    kind: 'single-cell',
    requiresLineOfSight: true,
    mustBeUnoccupied: true,
  }
}

function rangeFtFromAction(action: CombatActionDefinition): number {
  return action.targeting?.rangeFt ?? 60
}

/**
 * Declarative requirements for a combat action (spell-derived or monster action).
 */
export function getActionRequirements(action: CombatActionDefinition): ActionRequirement[] {
  if (isAreaGridCombatAction(action)) {
    const reqs: ActionRequirement[] = [
      {
        kind: 'area-placement',
        radiusFt: action.areaTemplate ? areaTemplateRadiusFt(action.areaTemplate) : undefined,
        lineOfSightRequired: action.targeting?.requiresSight ?? false,
      },
    ]
    if (action.casterOptions?.length) reqs.push({ kind: 'caster-option' })
    return reqs
  }

  const reqs: ActionRequirement[] = []

  if (actionRequiresCreatureTargetForResolveLocal(action)) {
    reqs.push({
      kind: 'creature-target',
      rangeFt: action.targeting?.rangeFt,
      lineOfSightRequired: action.targeting?.requiresSight ?? false,
    })
  }

  if (action.casterOptions?.length) {
    reqs.push({ kind: 'caster-option' })
  }

  const spawnEffects = (action.effects ?? []).filter((e): e is SpawnEffect => e.kind === 'spawn')
  const defaultRange = rangeFtFromAction(action)
  for (const se of spawnEffects) {
    const ep = effectiveSpawnPlacement(se)
    if (ep.kind === 'single-cell') {
      const rangeFt =
        ep.rangeFromCaster?.unit === 'ft' ? ep.rangeFromCaster.value : defaultRange
      reqs.push({
        kind: 'single-cell-placement',
        rangeFt,
        lineOfSightRequired: ep.requiresLineOfSight ?? true,
        mustBeUnoccupied: ep.mustBeUnoccupied ?? true,
        purpose: 'spawn',
      })
      break
    }
  }

  return reqs
}

/**
 * Deterministic ordered UI steps implied by requirements.
 */
export function getActionSteps(requirements: ActionRequirement[]): ActionStepDefinition[] {
  const kinds = new Set<ActionStepKind>()
  for (const r of requirements) {
    if (r.kind === 'creature-target') kinds.add('creatureTarget')
    else if (r.kind === 'caster-option') kinds.add('casterOptions')
    else if (r.kind === 'single-cell-placement') kinds.add('singleCellPlacement')
    else if (r.kind === 'area-placement') kinds.add('aoePlacement')
  }
  return STEP_ORDER.filter((k) => kinds.has(k)).map((kind) => ({
    kind,
    label: STEP_LABELS[kind],
  }))
}

export type SingleCellPlacementRequirement = Extract<ActionRequirement, { kind: 'single-cell-placement' }>

/**
 * Validates a chosen grid cell for single-cell placement (range, walkable cell, LoS, occupancy).
 */
export function validateSingleCellPlacement(
  space: EncounterSpace,
  placements: CombatantPosition[],
  casterCellId: string,
  targetCellId: string,
  req: SingleCellPlacementRequirement,
): PlacementValidationResult {
  const reasons: PlacementValidationReason[] = []

  const targetCell = getCellById(space, targetCellId)
  if (!targetCell || targetCell.kind === 'wall' || targetCell.kind === 'blocking') {
    reasons.push('invalid-terrain')
  }

  const d = gridDistanceFt(space, casterCellId, targetCellId)
  if (d === undefined || d > req.rangeFt) {
    reasons.push('out-of-range')
  }

  if (req.lineOfSightRequired && !hasLineOfSight(space, casterCellId, targetCellId)) {
    reasons.push('no-line-of-sight')
  }

  if (req.mustBeUnoccupied) {
    const occ = getOccupant(placements, targetCellId)
    if (occ !== undefined) reasons.push('occupied')
  }

  return {
    isValid: reasons.length === 0,
    reasons,
  }
}

/** Exported for readiness: check single-cell requirement using encounter context. */
export function getSingleCellPlacementRequirement(
  action: CombatActionDefinition,
): SingleCellPlacementRequirement | undefined {
  return getActionRequirements(action).find((r): r is SingleCellPlacementRequirement => r.kind === 'single-cell-placement')
}

export function isSingleCellPlacementSatisfied(
  action: CombatActionDefinition,
  ctx: {
    /** Selected grid cell id for single-cell placement readiness. */
    selectedSingleCellPlacementCellId?: string | null
    /** @deprecated use selectedSingleCellPlacementCellId */
    selectedSummonCellId?: string | null
    encounterState: { space?: EncounterSpace | null; placements?: CombatantPosition[] | null } | null | undefined
    activeCombatantId?: string | null
  },
): boolean {
  const req = getSingleCellPlacementRequirement(action)
  if (!req) return true

  const raw =
    ctx.selectedSingleCellPlacementCellId?.trim() || ctx.selectedSummonCellId?.trim()
  if (!raw) return false

  const state = ctx.encounterState
  const space = state?.space
  const placements = state?.placements
  const actorId = ctx.activeCombatantId
  if (!space || !placements || !actorId) {
    return false
  }

  const casterCell = getCellForCombatant(placements, actorId)
  if (!casterCell) return false

  const v = validateSingleCellPlacement(space, placements, casterCell, raw, req)
  return v.isValid
}
