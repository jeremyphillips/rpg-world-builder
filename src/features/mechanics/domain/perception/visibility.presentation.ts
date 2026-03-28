import type { EncounterViewerPerceptionCell } from './perception.types'
import type { EncounterWorldCellEnvironment, WorldObscurationPresentationCause } from '../environment/environment.types'
import { buildVisibilityContributors } from './visibility.contributors'
import { resolveCellVisibility } from './visibility.resolved'
import type { ResolvedCellVisibility, VisibilityFillKind } from './visibility.types'

/**
 * When world merge did not record causes (e.g. hand-built test worlds), infer from stable combat perception
 * so presentation stays aligned with {@link resolveViewerPerceptionForCell}.
 */
export function worldWithPresentationCauses(
  world: EncounterWorldCellEnvironment,
  perception: EncounterViewerPerceptionCell,
): EncounterWorldCellEnvironment {
  if (world.obscurationPresentationCauses.length > 0) return world
  const causes: WorldObscurationPresentationCause[] = []
  if (perception.maskedByMagicalDarkness) {
    causes.push('magical-darkness')
  } else if (perception.maskedByDarkness) {
    if (world.lightingLevel === 'darkness') causes.push('darkness')
    if (world.visibilityObscured === 'heavy') causes.push('environment')
    if (causes.length === 0) causes.push('darkness')
  }
  return { ...world, obscurationPresentationCauses: causes }
}

/**
 * Single mapping from semantic visibility to grid tint ids. Presentation only.
 */
export function mapResolvedVisibilityToFillKind(resolved: ResolvedCellVisibility): VisibilityFillKind | null {
  if (resolved.hidden) return 'hidden'

  const { primaryCause, obscured } = resolved

  if (primaryCause === 'magical-darkness') return 'magical-darkness'
  if (primaryCause === 'darkness') return 'darkness'
  if (primaryCause === 'fog' || primaryCause === 'smoke' || primaryCause === 'dust') return 'fog'
  if (primaryCause === 'environment') {
    if (obscured === 'heavy') return 'darkness'
    if (obscured === 'light') return 'dim'
    return null
  }

  if (primaryCause === undefined) {
    if (obscured === 'light') return 'dim'
    if (obscured === 'heavy') return 'darkness'
    return null
  }

  return null
}

/**
 * Perception + merged target world → presentation fill (grid). Uses contributor pipeline + {@link mapResolvedVisibilityToFillKind}.
 */
export function resolvePresentationVisibilityFill(
  perception: EncounterViewerPerceptionCell,
  targetWorld: EncounterWorldCellEnvironment,
): VisibilityFillKind | null {
  const world = worldWithPresentationCauses(targetWorld, perception)
  const contributors = buildVisibilityContributors({ targetWorld: world, perception })
  const resolved = resolveCellVisibility({ world, contributors })
  return mapResolvedVisibilityToFillKind(resolved)
}
