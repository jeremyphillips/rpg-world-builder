import { getCellForCombatant } from '@/features/encounter/space'
import { traceLineOfSightCells } from '@/features/encounter/space/sight/space.sight'

import { resolveWorldEnvironmentFromEncounterState } from '@/features/mechanics/domain/environment/environment.resolve'
import type { TerrainCoverGrade } from '@/features/mechanics/domain/environment/environment.types'
import type { EncounterState } from '../types'
import type { CombatantHideEligibilityExtension } from '../types/combatant.types'

const GRADE_RANK: Record<TerrainCoverGrade, number> = {
  none: 0,
  half: 1,
  'three-quarters': 2,
  full: 3,
}

export function maxTerrainCoverGrade(a: TerrainCoverGrade, b: TerrainCoverGrade): TerrainCoverGrade {
  return GRADE_RANK[a] >= GRADE_RANK[b] ? a : b
}

/**
 * Whether a merged terrain cover grade satisfies hide’s cover rules (baseline three-quarters+,
 * or half with feat/runtime flag).
 */
export function terrainCoverGradeSupportsHideAttempt(
  grade: TerrainCoverGrade,
  hideEligibility?: { featureFlags?: CombatantHideEligibilityExtension['featureFlags'] },
): boolean {
  if (grade === 'three-quarters' || grade === 'full') return true
  if (grade === 'half' && hideEligibility?.featureFlags?.allowHalfCoverForHide === true) return true
  return false
}

/**
 * **Observer-relative** effective terrain cover for hide: max merged `terrainCover` along the
 * supercover segment from the observer’s cell to the hider’s cell, **excluding** the observer’s
 * endpoint (the hider’s cell is always included — index ≥ 1 in the trace).
 *
 * Reuses the same grid line as {@link hasLineOfSight} / `traceLineOfSightCells` — not a parallel
 * stealth-only raycaster.
 *
 * **Fallback:** when tactical data is missing (`space` / placements / cells), returns **`undefined`**
 * so callers use **cell-local** `terrainCover` on the hider’s cell only (legacy behavior).
 */
export function resolveTerrainCoverGradeForHideFromObserver(
  state: EncounterState,
  observerId: string,
  hiderId: string,
): TerrainCoverGrade | undefined {
  if (!state.space || !state.placements) return undefined
  const observerCell = getCellForCombatant(state.placements, observerId)
  const hiderCell = getCellForCombatant(state.placements, hiderId)
  if (!observerCell || !hiderCell) return undefined

  const path = traceLineOfSightCells(state.space, observerCell, hiderCell)
  if (path.length === 0) return undefined

  if (path.length === 1) {
    const w = resolveWorldEnvironmentFromEncounterState(state, path[0])
    return w?.terrainCover ?? 'none'
  }

  let max: TerrainCoverGrade = 'none'
  for (let i = 1; i < path.length; i++) {
    const w = resolveWorldEnvironmentFromEncounterState(state, path[i])
    if (w) max = maxTerrainCoverGrade(max, w.terrainCover)
  }
  return max
}
