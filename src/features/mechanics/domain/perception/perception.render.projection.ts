/**
 * Render-facing projection from viewer perception → grid/UI inputs.
 * Rules live in `perception.resolve.ts`; this module only maps to presentation flags.
 */

import { getCellForCombatant } from '@/features/encounter/space'
import type { EncounterState } from '@/features/mechanics/domain/encounter/state/types/encounter-state.types'

import { resolveWorldEnvironmentFromEncounterState } from '../environment/environment.resolve'
import {
  resolveViewerBattlefieldPerception,
  resolveViewerPerceptionForCell,
} from './perception.resolve'
import type {
  EncounterViewerBattlefieldPerception,
  EncounterViewerPerceptionCapabilities,
  EncounterViewerPerceptionCell,
} from './perception.types'

/** Who can see token(s) in a cell from the current viewer’s perspective. */
export type OccupantTokenVisibility = 'all' | 'none' | 'self-only'

/**
 * Presentation-only cell tints — mirrored into `CellBaseFillKind` in the grid layer (not rules).
 */
export type PerceptionPresentationFillKind =
  | 'visibility-dim'
  | 'visibility-darkness'
  | 'visibility-magical-darkness'
  | 'visibility-hidden'

/**
 * Per-cell presentation derived from perception — not world state, not domain perception types.
 * Consumed by the grid to drive fills, token visibility, and obstacle glyphs.
 */
export type EncounterGridCellRenderState = {
  occupantTokenVisibility: OccupantTokenVisibility
  showObstacleGlyph: boolean
  /**
   * When set, may replace tactical `paper` / `persistent-attached-aura` base fills (see `mergePerceptionIntoCellVisualState`).
   * Presentation-only; does not change encounter state.
   */
  perceptionBaseFillKind: PerceptionPresentationFillKind | null
  /** Echo of domain flag — AoE/darkness template edge may be hidden when true. */
  suppressTemplateBoundary: boolean
}

/**
 * Battlefield-level presentation for veils and global template suppression.
 */
export type EncounterBattlefieldRenderState = {
  useBlindVeil: boolean
  suppressDarknessBoundaryFromInside: boolean
  /** Hide AoE / emanation template fill when viewer cannot see the boundary from inside MD. */
  suppressAoeTemplateOverlay: boolean
  /** 0–1 opacity for full-grid blind veil (presentation). */
  blindVeilOpacity: number
}

/**
 * Debug-only flags at the grid perception input boundary (simulator / POV tooling).
 * Merged into {@link EncounterViewerPerceptionCapabilities} as `magicalDarknessBypass` — not a full senses layer.
 */
export type GridPerceptionDebugOverrides = {
  forceMagicalDarknessBypass?: boolean
  /** Same net effect as `forceMagicalDarknessBypass` for sight through magical darkness (scaffold). */
  ignoreMagicalDarkness?: boolean
}

export type GridPerceptionInput = {
  viewerCombatantId: string
  viewerRole: 'dm' | 'pc'
  capabilities?: EncounterViewerPerceptionCapabilities
  debugOverrides?: GridPerceptionDebugOverrides
}

/** Merges optional debug overrides into capabilities for resolveViewer* calls. Exported for tests. */
export function mergeGridPerceptionInputCapabilities(
  input: GridPerceptionInput,
): EncounterViewerPerceptionCapabilities | undefined {
  const base = input.capabilities
  const d = input.debugOverrides
  if (!d?.forceMagicalDarknessBypass && !d?.ignoreMagicalDarkness) return base
  return { ...base, magicalDarknessBypass: true }
}

export type GridPerceptionSlice = {
  viewerCellId: string
  viewerCombatantId: string
  battlefieldRender: EncounterBattlefieldRenderState
  suppressAoeTemplateOverlay: boolean
}

export function projectBattlefieldRenderState(
  bp: EncounterViewerBattlefieldPerception,
  viewerRole: 'dm' | 'pc',
): EncounterBattlefieldRenderState {
  if (viewerRole === 'dm') {
    return {
      useBlindVeil: false,
      suppressDarknessBoundaryFromInside: false,
      suppressAoeTemplateOverlay: false,
      blindVeilOpacity: 0,
    }
  }
  return {
    useBlindVeil: bp.useBattlefieldBlindVeil,
    suppressDarknessBoundaryFromInside: bp.suppressDarknessBoundaryFromInside,
    suppressAoeTemplateOverlay: bp.suppressDarknessBoundaryFromInside,
    blindVeilOpacity: bp.useBattlefieldBlindVeil ? 0.82 : 0,
  }
}

export function projectGridCellRenderState(params: {
  perception: EncounterViewerPerceptionCell
  battlefield: EncounterBattlefieldRenderState
  viewerRole: 'dm' | 'pc'
  isViewerCell: boolean
}): EncounterGridCellRenderState {
  const { perception, battlefield, viewerRole, isViewerCell } = params

  if (viewerRole === 'dm') {
    return {
      occupantTokenVisibility: 'all',
      showObstacleGlyph: true,
      perceptionBaseFillKind: null,
      suppressTemplateBoundary: false,
    }
  }

  const occupantTokenVisibility = resolveOccupantTokenVisibility(
    perception,
    battlefield.useBlindVeil,
    isViewerCell,
  )

  const showObstacleGlyph =
    perception.canPerceiveObjects && !(battlefield.useBlindVeil && !isViewerCell)

  const perceptionBaseFillKind = resolvePerceptionPresentationFill(perception)

  return {
    occupantTokenVisibility,
    showObstacleGlyph,
    perceptionBaseFillKind,
    suppressTemplateBoundary: perception.suppressTemplateBoundary,
  }
}

function resolveOccupantTokenVisibility(
  perception: EncounterViewerPerceptionCell,
  blindVeil: boolean,
  isViewerCell: boolean,
): OccupantTokenVisibility {
  if (!perception.canPerceiveOccupants) return 'none'
  if (blindVeil && isViewerCell) return 'self-only'
  if (blindVeil) return 'none'
  return 'all'
}

/** Maps world + perception to presentation fills (grid maps these to `CellBaseFillKind`). */
export function resolvePerceptionPresentationFill(
  perception: EncounterViewerPerceptionCell,
): PerceptionPresentationFillKind | null {
  if (!perception.canPerceiveCell) return 'visibility-hidden'
  if (perception.maskedByMagicalDarkness) return 'visibility-magical-darkness'
  if (perception.maskedByDarkness) return 'visibility-darkness'
  if (perception.worldVisibilityObscured === 'light') return 'visibility-dim'
  return null
}

/**
 * Builds viewer-relative perception slice for the grid selector (one battlefield projection + per-cell in selector).
 */
export function buildGridPerceptionSlice(
  state: EncounterState,
  input: GridPerceptionInput | undefined,
): GridPerceptionSlice | null {
  if (!input || !state.space || !state.placements) return null
  const viewerCellId = getCellForCombatant(state.placements, input.viewerCombatantId)
  if (!viewerCellId) return null
  const viewerWorld = resolveWorldEnvironmentFromEncounterState(state, viewerCellId)
  if (!viewerWorld) return null

  const mergedCaps = mergeGridPerceptionInputCapabilities(input)

  const bp: EncounterViewerBattlefieldPerception = resolveViewerBattlefieldPerception({
    viewerWorld,
    viewerCellId,
    capabilities: mergedCaps,
    viewerRole: input.viewerRole,
  })
  const battlefieldRender = projectBattlefieldRenderState(bp, input.viewerRole)
  return {
    viewerCellId,
    viewerCombatantId: input.viewerCombatantId,
    battlefieldRender,
    suppressAoeTemplateOverlay: battlefieldRender.suppressAoeTemplateOverlay,
  }
}

export function buildCellPerceptionRenderState(
  state: EncounterState,
  slice: GridPerceptionSlice,
  targetCellId: string,
  input: GridPerceptionInput,
): EncounterGridCellRenderState | undefined {
  const viewerWorld = resolveWorldEnvironmentFromEncounterState(state, slice.viewerCellId)
  const targetWorld = resolveWorldEnvironmentFromEncounterState(state, targetCellId)
  if (!viewerWorld || !targetWorld) return undefined

  const perception = resolveViewerPerceptionForCell({
    viewerWorld,
    targetWorld,
    viewerCellId: slice.viewerCellId,
    targetCellId,
    capabilities: mergeGridPerceptionInputCapabilities(input),
    viewerRole: input.viewerRole,
  })

  return projectGridCellRenderState({
    perception,
    battlefield: slice.battlefieldRender,
    viewerRole: input.viewerRole,
    isViewerCell: targetCellId === slice.viewerCellId,
  })
}
