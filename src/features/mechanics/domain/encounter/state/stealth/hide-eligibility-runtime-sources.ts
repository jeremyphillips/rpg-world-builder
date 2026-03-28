import type { Effect } from '../../effects/effects.types'
import type {
  CombatantHideEligibilityFeatureFlagsRuntime,
  RuntimeMarker,
} from '../types/combatant.types'

/**
 * Marker **`id`** or **`classification`** entry that OR-merges **`allowHalfCoverForHide`** with snapshot
 * and `hide-eligibility-grant` effects. Prefer stable ids over free-form labels.
 */
export const RUNTIME_MARKER_HIDE_ELIGIBILITY_ALLOW_HALF_COVER_ID = 'hide-eligibility:allow-half-cover'

/** OR-merges **`allowDimLightHide`** (dim-only lighting basis). */
export const RUNTIME_MARKER_HIDE_ELIGIBILITY_ALLOW_DIM_LIGHT_ID = 'hide-eligibility:allow-dim-light'

/** OR-merges **`allowMagicalConcealmentHide`** (magical light obscurement basis). */
export const RUNTIME_MARKER_HIDE_ELIGIBILITY_ALLOW_MAGICAL_CONCEALMENT_ID =
  'hide-eligibility:allow-magical-concealment'

/** OR-merges **`allowDifficultTerrainHide`** (difficult / greater-difficult movement on hider cell). */
export const RUNTIME_MARKER_HIDE_ELIGIBILITY_ALLOW_DIFFICULT_TERRAIN_ID =
  'hide-eligibility:allow-difficult-terrain'

/** OR-merges **`allowHighWindHide`** (`high-wind` atmosphere on hider cell). */
export const RUNTIME_MARKER_HIDE_ELIGIBILITY_ALLOW_HIGH_WIND_ID = 'hide-eligibility:allow-high-wind'

/**
 * Boolean hide-eligibility flags combine with **union (OR)** semantics across:
 * - `stats.skillRuntime.hideEligibilityFeatureFlags` (authored / builder snapshot)
 * - `activeEffects` (including nested payloads — auras, state `ongoingEffects`, etc.)
 * - `conditions` and `states` runtime markers (see `RUNTIME_MARKER_*` constants)
 *
 * If any source sets a flag to **true**, the merged result has that flag true.
 */
export function mergeHideEligibilityFeatureFlagsOr(
  ...parts: (CombatantHideEligibilityFeatureFlagsRuntime | undefined | null)[]
): CombatantHideEligibilityFeatureFlagsRuntime | undefined {
  const merged: CombatantHideEligibilityFeatureFlagsRuntime = {}
  for (const p of parts) {
    if (!p) continue
    if (p.allowHalfCoverForHide === true) merged.allowHalfCoverForHide = true
    if (p.allowDimLightHide === true) merged.allowDimLightHide = true
    if (p.allowMagicalConcealmentHide === true) merged.allowMagicalConcealmentHide = true
    if (p.allowDifficultTerrainHide === true) merged.allowDifficultTerrainHide = true
    if (p.allowHighWindHide === true) merged.allowHighWindHide = true
  }
  if (!hasAnyHideEligibilityFeatureFlags(merged)) return undefined
  return merged
}

export function hasAnyHideEligibilityFeatureFlags(
  flags: CombatantHideEligibilityFeatureFlagsRuntime | undefined,
): boolean {
  if (flags == null) return false
  return (
    flags.allowHalfCoverForHide === true ||
    flags.allowDimLightHide === true ||
    flags.allowMagicalConcealmentHide === true ||
    flags.allowDifficultTerrainHide === true ||
    flags.allowHighWindHide === true
  )
}

/** Depth-first walk: roots plus nested effects that can carry mechanical payloads on the stack. */
function visitEffectsForFlattening(effect: Effect, out: Effect[]): void {
  out.push(effect)
  switch (effect.kind) {
    case 'trigger':
      effect.effects.forEach((e) => visitEffectsForFlattening(e, out))
      break
    case 'save':
      effect.onFail.forEach((e) => visitEffectsForFlattening(e, out))
      effect.onSuccess?.forEach((e) => visitEffectsForFlattening(e, out))
      break
    case 'check':
      effect.onSuccess?.forEach((e) => visitEffectsForFlattening(e, out))
      effect.onFail?.forEach((e) => visitEffectsForFlattening(e, out))
      break
    case 'activation':
      effect.effects.forEach((e) => visitEffectsForFlattening(e, out))
      break
    case 'state':
      effect.ongoingEffects?.forEach((e) => visitEffectsForFlattening(e, out))
      break
    case 'aura':
      effect.effects.forEach((e) => visitEffectsForFlattening(e, out))
      break
    case 'interval':
      effect.effects.forEach((e) => visitEffectsForFlattening(e, out))
      break
    default:
      break
  }
}

export function flattenActiveEffectsTree(rootEffects: Effect[]): Effect[] {
  const out: Effect[] = []
  rootEffects.forEach((e) => visitEffectsForFlattening(e, out))
  return out
}

export function extractHideEligibilityFeatureFlagsFromEffects(
  flatEffects: Effect[],
): CombatantHideEligibilityFeatureFlagsRuntime {
  const merged: CombatantHideEligibilityFeatureFlagsRuntime = {}
  for (const e of flatEffects) {
    if (e.kind !== 'hide-eligibility-grant') continue
    const f = e.featureFlags
    if (f.allowHalfCoverForHide === true) merged.allowHalfCoverForHide = true
    if (f.allowDimLightHide === true) merged.allowDimLightHide = true
    if (f.allowMagicalConcealmentHide === true) merged.allowMagicalConcealmentHide = true
    if (f.allowDifficultTerrainHide === true) merged.allowDifficultTerrainHide = true
    if (f.allowHighWindHide === true) merged.allowHighWindHide = true
  }
  return merged
}

function markerGrantsFlag(
  m: RuntimeMarker,
  id: string,
): boolean {
  return m.id === id || m.classification?.includes(id) === true
}

export function extractHideEligibilityFeatureFlagsFromRuntimeMarkers(
  markers: RuntimeMarker[],
): CombatantHideEligibilityFeatureFlagsRuntime {
  const merged: CombatantHideEligibilityFeatureFlagsRuntime = {}
  const half = RUNTIME_MARKER_HIDE_ELIGIBILITY_ALLOW_HALF_COVER_ID
  const dim = RUNTIME_MARKER_HIDE_ELIGIBILITY_ALLOW_DIM_LIGHT_ID
  const mag = RUNTIME_MARKER_HIDE_ELIGIBILITY_ALLOW_MAGICAL_CONCEALMENT_ID
  const diff = RUNTIME_MARKER_HIDE_ELIGIBILITY_ALLOW_DIFFICULT_TERRAIN_ID
  const wind = RUNTIME_MARKER_HIDE_ELIGIBILITY_ALLOW_HIGH_WIND_ID
  for (const m of markers) {
    if (markerGrantsFlag(m, half)) merged.allowHalfCoverForHide = true
    if (markerGrantsFlag(m, dim)) merged.allowDimLightHide = true
    if (markerGrantsFlag(m, mag)) merged.allowMagicalConcealmentHide = true
    if (markerGrantsFlag(m, diff)) merged.allowDifficultTerrainHide = true
    if (markerGrantsFlag(m, wind)) merged.allowHighWindHide = true
  }
  return merged
}

export function resolveTemporaryHideEligibilityFeatureFlagsFromCombatantRuntime(args: {
  activeEffects: Effect[]
  conditions: RuntimeMarker[]
  states: RuntimeMarker[]
}): CombatantHideEligibilityFeatureFlagsRuntime | undefined {
  const flat = flattenActiveEffectsTree(args.activeEffects)
  const fromEffects = extractHideEligibilityFeatureFlagsFromEffects(flat)
  const fromConditions = extractHideEligibilityFeatureFlagsFromRuntimeMarkers(args.conditions)
  const fromStates = extractHideEligibilityFeatureFlagsFromRuntimeMarkers(args.states)
  return mergeHideEligibilityFeatureFlagsOr(fromEffects, fromConditions, fromStates)
}
