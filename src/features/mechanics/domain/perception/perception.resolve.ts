import { getCellForCombatant } from '@/features/encounter/space'
import type { EncounterState } from '@/features/mechanics/domain/encounter/state/types/encounter-state.types'

import { resolveWorldEnvironmentFromEncounterState } from '../environment/environment.resolve'
import type { EncounterWorldCellEnvironment } from '../environment/environment.types'
import type {
  EncounterViewerBattlefieldPerception,
  EncounterViewerPerceptionCapabilities,
  EncounterViewerPerceptionCell,
  ResolveViewerBattlefieldPerceptionParams,
  ResolveViewerPerceptionForCellParams,
} from './perception.types'

/**
 * Whether magical darkness is ignored for sight (Devil’s Sight, truesight, explicit bypass).
 * Darkvision alone does **not** bypass magical darkness.
 */
export function effectiveMagicalDarknessBypass(
  capabilities: EncounterViewerPerceptionCapabilities | undefined,
): boolean {
  if (!capabilities) return false
  if (capabilities.magicalDarknessBypass) return true
  if (capabilities.devilsSightActive) return true
  if (capabilities.truesightActive) return true
  return false
}

/**
 * Per-cell perception for a viewer from resolved world state at viewer and target cells.
 *
 * Rules (baseline, no special senses): DM view is unrestricted. Otherwise:
 * - Viewer in magical darkness (no bypass): cannot perceive other cells’ contents; only own cell is partially
 *   perceivable (occupants scaffold true; objects false; suppress template boundary).
 * - Viewer outside, target in magical darkness: can perceive the cell as a dark region, not occupants/objects.
 * - Heavy obscuration or non-magical darkness lighting: occupants/objects masked (non-magical darkness).
 * - Magical darkness on target takes precedence over heavy obscuration for masking.
 */
export function resolveViewerPerceptionForCell(
  params: ResolveViewerPerceptionForCellParams,
): EncounterViewerPerceptionCell {
  const { viewerWorld, targetWorld, viewerCellId, targetCellId, capabilities, viewerRole } = params
  const sameCell = viewerCellId === targetCellId
  const bypass = effectiveMagicalDarknessBypass(capabilities)

  if (viewerRole === 'dm') {
    return dmOmniscientCell(targetWorld)
  }

  const targetMd = targetWorld.magicalDarkness && !bypass
  const viewerInMd = viewerWorld.magicalDarkness && !bypass

  const maskedByMagicalDarkness = targetMd
  const maskedByDarkness =
    !maskedByMagicalDarkness &&
    (targetWorld.visibilityObscured === 'heavy' || targetWorld.lightingLevel === 'darkness')

  if (viewerInMd && !sameCell) {
    return {
      canPerceiveCell: false,
      canPerceiveOccupants: false,
      canPerceiveObjects: false,
      maskedByDarkness: false,
      maskedByMagicalDarkness: false,
      suppressTemplateBoundary: true,
      worldLightingLevel: targetWorld.lightingLevel,
      worldVisibilityObscured: targetWorld.visibilityObscured,
      appliedZoneIds: targetWorld.appliedZoneIds,
    }
  }

  if (viewerInMd && sameCell) {
    return {
      canPerceiveCell: true,
      canPerceiveOccupants: true,
      canPerceiveObjects: false,
      maskedByDarkness: false,
      maskedByMagicalDarkness: false,
      suppressTemplateBoundary: true,
      worldLightingLevel: targetWorld.lightingLevel,
      worldVisibilityObscured: targetWorld.visibilityObscured,
      appliedZoneIds: targetWorld.appliedZoneIds,
    }
  }

  if (targetMd) {
    return {
      canPerceiveCell: true,
      canPerceiveOccupants: false,
      canPerceiveObjects: false,
      maskedByDarkness: false,
      maskedByMagicalDarkness: true,
      suppressTemplateBoundary: false,
      worldLightingLevel: targetWorld.lightingLevel,
      worldVisibilityObscured: targetWorld.visibilityObscured,
      appliedZoneIds: targetWorld.appliedZoneIds,
    }
  }

  if (maskedByDarkness) {
    return {
      canPerceiveCell: true,
      canPerceiveOccupants: false,
      canPerceiveObjects: false,
      maskedByDarkness: true,
      maskedByMagicalDarkness: false,
      suppressTemplateBoundary: false,
      worldLightingLevel: targetWorld.lightingLevel,
      worldVisibilityObscured: targetWorld.visibilityObscured,
      appliedZoneIds: targetWorld.appliedZoneIds,
    }
  }

  return {
    canPerceiveCell: true,
    canPerceiveOccupants: true,
    canPerceiveObjects: true,
    maskedByDarkness: false,
    maskedByMagicalDarkness: false,
    suppressTemplateBoundary: false,
    worldLightingLevel: targetWorld.lightingLevel,
    worldVisibilityObscured: targetWorld.visibilityObscured,
    appliedZoneIds: targetWorld.appliedZoneIds,
  }
}

function dmOmniscientCell(targetWorld: EncounterWorldCellEnvironment): EncounterViewerPerceptionCell {
  return {
    canPerceiveCell: true,
    canPerceiveOccupants: true,
    canPerceiveObjects: true,
    maskedByDarkness: false,
    maskedByMagicalDarkness: false,
    suppressTemplateBoundary: false,
    worldLightingLevel: targetWorld.lightingLevel,
    worldVisibilityObscured: targetWorld.visibilityObscured,
    appliedZoneIds: targetWorld.appliedZoneIds,
  }
}

/**
 * Battlefield-wide flags for veils and boundary rendering. Derived from the viewer’s cell world state only.
 */
export function resolveViewerBattlefieldPerception(
  params: ResolveViewerBattlefieldPerceptionParams,
): EncounterViewerBattlefieldPerception {
  const { viewerWorld, viewerCellId, capabilities, viewerRole } = params
  const bypass = effectiveMagicalDarknessBypass(capabilities)

  if (viewerRole === 'dm') {
    return {
      viewerCellId: viewerCellId ?? null,
      viewerInsideMagicalDarkness: false,
      viewerInsideHeavyObscurement: false,
      useBattlefieldBlindVeil: false,
      suppressDarknessBoundaryFromInside: false,
    }
  }

  if (!viewerCellId) {
    return {
      viewerCellId: null,
      viewerInsideMagicalDarkness: false,
      viewerInsideHeavyObscurement: false,
      useBattlefieldBlindVeil: false,
      suppressDarknessBoundaryFromInside: false,
    }
  }

  const inMd = viewerWorld.magicalDarkness && !bypass
  const heavy = viewerWorld.visibilityObscured === 'heavy' && !inMd

  return {
    viewerCellId,
    viewerInsideMagicalDarkness: inMd,
    viewerInsideHeavyObscurement: heavy,
    useBattlefieldBlindVeil: inMd,
    suppressDarknessBoundaryFromInside: inMd,
  }
}

/**
 * Convenience: resolve world at viewer + target cells, then per-cell perception.
 */
export function resolveViewerPerceptionForCellFromState(
  state: EncounterState,
  viewerCombatantId: string,
  targetCellId: string,
  options?: {
    capabilities?: EncounterViewerPerceptionCapabilities
    viewerRole?: 'dm' | 'pc'
  },
): EncounterViewerPerceptionCell | undefined {
  if (!state.space || !state.placements) return undefined
  const viewerCellId = getCellForCombatant(state.placements, viewerCombatantId)
  if (!viewerCellId) return undefined

  const viewerWorld = resolveWorldEnvironmentFromEncounterState(state, viewerCellId)
  const targetWorld = resolveWorldEnvironmentFromEncounterState(state, targetCellId)
  if (!viewerWorld || !targetWorld) return undefined

  return resolveViewerPerceptionForCell({
    viewerWorld,
    targetWorld,
    viewerCellId,
    targetCellId,
    capabilities: options?.capabilities,
    viewerRole: options?.viewerRole,
  })
}

export function resolveViewerBattlefieldPerceptionFromState(
  state: EncounterState,
  viewerCombatantId: string,
  options?: {
    capabilities?: EncounterViewerPerceptionCapabilities
    viewerRole?: 'dm' | 'pc'
  },
): EncounterViewerBattlefieldPerception | undefined {
  if (!state.space || !state.placements) return undefined
  const viewerCellId = getCellForCombatant(state.placements, viewerCombatantId)
  const viewerWorld = viewerCellId
    ? resolveWorldEnvironmentFromEncounterState(state, viewerCellId)
    : undefined
  if (!viewerWorld) return undefined

  return resolveViewerBattlefieldPerception({
    viewerWorld,
    viewerCellId,
    capabilities: options?.capabilities,
    viewerRole: options?.viewerRole,
  })
}

/** For tests or tooling: when you already have world env at viewer cell. */
export function resolveViewerBattlefieldPerceptionFromWorld(
  viewerWorld: EncounterWorldCellEnvironment,
  viewerCellId: string | undefined,
  options?: {
    capabilities?: EncounterViewerPerceptionCapabilities
    viewerRole?: 'dm' | 'pc'
  },
): EncounterViewerBattlefieldPerception {
  return resolveViewerBattlefieldPerception({
    viewerWorld,
    viewerCellId,
    capabilities: options?.capabilities,
    viewerRole: options?.viewerRole,
  })
}
