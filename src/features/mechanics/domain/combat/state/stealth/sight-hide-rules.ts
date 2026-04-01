import { getCellForCombatant } from '@/features/mechanics/domain/combat/space'
import { resolveWorldEnvironmentFromEncounterState } from '@/features/mechanics/domain/environment/environment.resolve'
import type { EncounterWorldCellEnvironment } from '@/features/mechanics/domain/environment/environment.types'

import { getCombatantHideEligibilityExtensionOptions } from './combatant-hide-eligibility'
import {
  resolveTerrainCoverGradeForHideFromObserver,
  terrainCoverGradeSupportsHideAttempt,
} from '@/features/mechanics/domain/combat/state/environment/observer-hide-terrain-cover'
import { canPerceiveTargetOccupantForCombat } from '@/features/mechanics/domain/combat/state/visibility/combatant-pair-visibility'
import type { CombatantHideEligibilityExtension } from '@/features/mechanics/domain/combat/state/types/combatant.types'
import type { EncounterState } from '@/features/mechanics/domain/combat/state/types'
import type { EncounterViewerPerceptionCapabilities } from '@/features/mechanics/domain/perception/perception.types'

/**
 * Whether the observer can **visually perceive the subject’s occupant** for rules that care about sight
 * (sight-based checks, stealth vs observer, narrative gating). Same implementation as attack/targeting/OA:
 * {@link canPerceiveTargetOccupantForCombat}.
 *
 * **Missing tactical data:** follows that helper’s permissive occupant fallback after condition/LOS gates.
 */
export function canVisuallyPerceiveSubjectForRules(
  state: EncounterState,
  observerId: string,
  subjectId: string,
  options?: { capabilities?: EncounterViewerPerceptionCapabilities },
): boolean {
  return canPerceiveTargetOccupantForCombat(state, observerId, subjectId, options)
}

export type SightBasedCheckDenialReason = 'cannot-perceive-subject'

/**
 * Sight-dependent ability/skill checks: if the observer cannot perceive the subject occupant, the check
 * cannot proceed on sight alone (engine: **blocked** with a kebab-case reason).
 *
 * Callers that need “automatic fail” vs “blocked before roll” can map `cannot-perceive-subject` accordingly.
 */
export function getSightBasedCheckLegalityDenialReason(
  state: EncounterState,
  observerId: string,
  subjectId: string,
  options?: { capabilities?: EncounterViewerPerceptionCapabilities },
): SightBasedCheckDenialReason | null {
  if (!canVisuallyPerceiveSubjectForRules(state, observerId, subjectId, options)) {
    return 'cannot-perceive-subject'
  }
  return null
}

/**
 * **Baseline** hide concealment (no {@link CombatantHideEligibilityExtension} flags): what counts for
 * everyone without dim-light or magical-concealment exceptions.
 *
 * Includes: heavy obscurement; **non-magical** light obscurement; darkness lighting; {@link EncounterWorldCellEnvironment.magicalDarkness}.
 *
 * **Excluded** (require feature flags on the hider — see {@link cellWorldSupportsHideAttemptWorldBasis}):
 * - **Dim light only** (`lightingLevel === 'dim'`) — needs **`allowDimLightHide`**.
 * - **Magical light obscurement** (`visibilityObscured === 'light'` with merged **`world.magical`**) — needs
 *   **`allowMagicalConcealmentHide`**. Natural light obscurement uses the same `visibilityObscured` field but
 *   **`magical` is false** after zone merge.
 *
 * Uses merged {@link EncounterWorldCellEnvironment} — not render/UI state.
 */
export function cellWorldSupportsHideConcealment(world: EncounterWorldCellEnvironment): boolean {
  if (world.visibilityObscured === 'heavy') return true
  if (world.visibilityObscured === 'light' && !world.magical) return true
  if (world.lightingLevel === 'darkness') return true
  if (world.magicalDarkness) return true
  return false
}

/**
 * **Baseline (this pass):** half cover does **not** count toward hide by itself; **three-quarters** or
 * **full** (total) cover on the merged world cell does. Cell-local grade from `terrainCover`, not
 * observer-relative line-of-sight cover.
 *
 * @see cellWorldSupportsHideAttemptWorldBasis — combines concealment + cover + optional feature flags.
 */
export function cellTerrainCoverSupportsHideBaseline(world: EncounterWorldCellEnvironment): boolean {
  const g = world.terrainCover
  return g === 'three-quarters' || g === 'full'
}

/** Merged hider cell: difficult / greater-difficult movement — not baseline without a feature flag. */
export function cellWorldSupportsDifficultTerrainHideBasis(world: EncounterWorldCellEnvironment): boolean {
  return world.terrainMovement === 'difficult' || world.terrainMovement === 'greater-difficult'
}

/** Merged hider cell: `high-wind` in `atmosphereTags` — not baseline without a feature flag. */
export function cellWorldSupportsHighWindHideBasis(world: EncounterWorldCellEnvironment): boolean {
  return world.atmosphereTags.includes('high-wind')
}

/** Same document shape as {@link CombatantHideEligibilityExtension} on `CombatantStealthRuntime`. */
export type HideEligibilityExtensionOptions = CombatantHideEligibilityExtension

export type HideEligibilityFeatureFlags = NonNullable<CombatantHideEligibilityExtension['featureFlags']>

/**
 * Single rules-layer gate: does merged **world** state at the hider’s cell support attempting Hide
 * (concealment **or** baseline-sufficient cover **or** explicit extension flags)?
 *
 * Does **not** replace occupant perception — {@link getHideAttemptEligibilityDenialReason} still pairs
 * this with `canPerceiveTargetOccupantForCombat`.
 */
export function cellWorldSupportsHideAttemptWorldBasis(
  world: EncounterWorldCellEnvironment,
  hideEligibility?: HideEligibilityExtensionOptions,
): boolean {
  const flags = hideEligibility?.featureFlags
  if (cellWorldSupportsHideConcealment(world)) return true
  if (cellTerrainCoverSupportsHideBaseline(world)) return true
  if (flags?.allowHalfCoverForHide === true && world.terrainCover === 'half') {
    return true
  }
  if (flags?.allowDimLightHide === true && world.lightingLevel === 'dim') {
    return true
  }
  if (
    flags?.allowMagicalConcealmentHide === true &&
    world.magical &&
    world.visibilityObscured === 'light'
  ) {
    return true
  }
  if (flags?.allowDifficultTerrainHide === true && cellWorldSupportsDifficultTerrainHideBasis(world)) {
    return true
  }
  if (flags?.allowHighWindHide === true && cellWorldSupportsHighWindHideBasis(world)) {
    return true
  }
  return false
}

/**
 * Hide **world basis** for a specific observer/hider pair when a tactical grid exists: concealment
 * and dim/magical flags use the **hider’s merged cell**; **terrain cover** uses
 * {@link resolveTerrainCoverGradeForHideFromObserver} (max `terrainCover` along the supercover segment
 * from observer → hider, excluding the observer endpoint). When `space` / placements are missing,
 * callers should use {@link cellWorldSupportsHideAttemptWorldBasis} on the hider cell only (fallback).
 */
export function pairSupportsHideWorldBasisFromObserver(
  state: EncounterState,
  observerId: string,
  hiderId: string,
  hideEligibility?: HideEligibilityExtensionOptions,
): boolean {
  if (!state.space || !state.placements) return false
  const hiderCell = getCellForCombatant(state.placements, hiderId)
  if (!hiderCell) return false
  const world = resolveWorldEnvironmentFromEncounterState(state, hiderCell)
  if (!world) return false
  const flags = hideEligibility?.featureFlags

  if (cellWorldSupportsHideConcealment(world)) return true
  if (flags?.allowDimLightHide === true && world.lightingLevel === 'dim') return true
  if (
    flags?.allowMagicalConcealmentHide === true &&
    world.magical &&
    world.visibilityObscured === 'light'
  ) {
    return true
  }
  if (flags?.allowDifficultTerrainHide === true && cellWorldSupportsDifficultTerrainHideBasis(world)) {
    return true
  }
  if (flags?.allowHighWindHide === true && cellWorldSupportsHighWindHideBasis(world)) {
    return true
  }

  const observerGrade = resolveTerrainCoverGradeForHideFromObserver(state, observerId, hiderId)
  const effectiveGrade = observerGrade !== undefined ? observerGrade : world.terrainCover
  return terrainCoverGradeSupportsHideAttempt(effectiveGrade, hideEligibility)
}

/**
 * Resolves which hide-extension flags apply for a combatant. Precedence:
 *
 * - **`hide-attempt`:** call-site `options.hideEligibility` (tests/DM override) → persisted
 *   `stealth.hideEligibility` → **combatant-derived** {@link getCombatantHideEligibilityExtensionOptions}
 *   (snapshot + temporary effects/markers).
 * - **`stealth-sustain`:** persisted `stealth.hideEligibility` → call-site → **combatant-derived** (snapshot +
 *   temporary effects/markers — so reconciliation matches entry when flags live on the combatant).
 */
export function resolveHideEligibilityForCombatant(
  state: EncounterState,
  combatantId: string,
  options: { hideEligibility?: HideEligibilityExtensionOptions } | undefined,
  mode: 'hide-attempt' | 'stealth-sustain',
): HideEligibilityExtensionOptions | undefined {
  const combatant = state.combatantsById[combatantId]
  const derived = combatant != null ? getCombatantHideEligibilityExtensionOptions(combatant) : undefined
  const persisted = combatant?.stealth?.hideEligibility
  const callSite = options?.hideEligibility
  if (mode === 'stealth-sustain') return persisted ?? callSite ?? derived
  return callSite ?? persisted ?? derived
}

export type HideAttemptEligibilityDenialReason =
  | 'self'
  | 'missing-hider-placement'
  | 'observer-sees-without-concealment'

export type GetHideAttemptEligibilityDenialReasonOptions = {
  capabilities?: EncounterViewerPerceptionCapabilities
  hideEligibility?: HideEligibilityExtensionOptions
  /**
   * Which eligibility snapshot {@link resolveHideEligibilityForCombatant} merges. Default **`hide-attempt`**.
   * Use **`stealth-sustain`** when re-checking hide basis during stealth reconciliation.
   */
  hideEligibilityResolveMode?: 'hide-attempt' | 'stealth-sustain'
}

/**
 * Narrow Hide **attempt** eligibility (not a full Stealth contest): whether `hiderId` may attempt to hide
 * from `observerId` using the same **occupant** perception seam plus **world** support for hide
 * (concealment and/or sufficient terrain cover — see {@link cellWorldSupportsHideAttemptWorldBasis}).
 *
 * - If the observer **can** perceive the hider’s **occupant** (`canPerceiveTargetOccupantForCombat`) **and**
 *   the hider’s cell has **no** concealment or sufficient cover (bright, clear, no / insufficient cover),
 *   hiding in plain sight is denied.
 * - If the observer **cannot** perceive the occupant (heavy obscurement, magical darkness, invisibility, etc.),
 *   the attempt is allowed from a sight perspective.
 * - If the observer **can** perceive the occupant **but** hide basis still passes (concealment / flags /
 *   **observer-relative** terrain cover along the supercover segment when a grid exists), a Hide attempt
 *   is allowed. **Resolution** vs passive Perception is handled in `stealth-rules.ts` /
 *   `resolveHideWithPassivePerception` after the Stealth total is rolled (not here).
 *
 * **Missing tactical grid / hider placement:** permissive — returns `null` (allow attempt) so behavior
 * matches the pair-visibility fallback when geometry is absent.
 */
export function getHideAttemptEligibilityDenialReason(
  state: EncounterState,
  hiderId: string,
  observerId: string,
  options?: GetHideAttemptEligibilityDenialReasonOptions,
): HideAttemptEligibilityDenialReason | null {
  if (hiderId === observerId) return 'self'

  if (!state.space || !state.placements) {
    return null
  }

  const hiderCell = getCellForCombatant(state.placements, hiderId)
  if (!hiderCell) {
    return 'missing-hider-placement'
  }

  const world = resolveWorldEnvironmentFromEncounterState(state, hiderCell)
  const eligibilityMode = options?.hideEligibilityResolveMode ?? 'hide-attempt'
  const effectiveHideEligibility = resolveHideEligibilityForCombatant(state, hiderId, options, eligibilityMode)
  const hasWorldHideBasis =
    world != null &&
    (!state.space || !state.placements
      ? cellWorldSupportsHideAttemptWorldBasis(world, effectiveHideEligibility)
      : pairSupportsHideWorldBasisFromObserver(state, observerId, hiderId, effectiveHideEligibility))

  const observerSeesOccupant = canPerceiveTargetOccupantForCombat(state, observerId, hiderId, options)

  if (observerSeesOccupant && !hasWorldHideBasis) {
    return 'observer-sees-without-concealment'
  }

  return null
}
