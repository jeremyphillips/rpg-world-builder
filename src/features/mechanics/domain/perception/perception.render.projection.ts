/**
 * Render-facing projection from viewer perception → grid/UI inputs.
 *
 * - **Combat rules** — `perception.resolve.ts` (`EncounterViewerPerceptionCell`, blind veil, etc.).
 * - **Cell tint / `perceptionBaseFillKind`** — **only** via {@link resolvePresentationVisibilityFill} from
 *   `visibility.presentation.ts` (merged world → contributors → resolved → fill). No spell ids; no direct
 *   `maskedByDarkness` → fill mapping here.
 *
 * **Immersed obscuration vs overlays:** {@link EncounterBattlefieldRenderState.suppressAoeTemplateOverlay}
 * mirrors `EncounterViewerBattlefieldPerception.suppressDarknessBoundaryFromInside` for PCs. When true,
 * {@link buildGridPerceptionSlice} consumers (e.g. `selectGridViewModel`) should strip **world-space**
 * footprint overlays (`persistentAttachedAura`, `aoeInTemplate`) so the viewer inside fog/MD does not see a
 * crisp tactical ring around the same volume. **Does not** disable per-cell visibility fills — those stay on
 * the canonical pipeline. DM role forces this flag off (omniscient tactical art).
 */

import { getCellForCombatant, gridDistanceFt } from '@/features/mechanics/domain/combat/space'
import type { EncounterState } from '@/features/mechanics/domain/combat/state/types/encounter-state.types'

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
import type { EncounterWorldCellEnvironment } from '../environment/environment.types'
import { resolvePresentationVisibilityFill } from './visibility.presentation'
import type { VisibilityFillKind } from './visibility.types'

/** Who can see token(s) in a cell from the current viewer’s perspective. */
export type OccupantTokenVisibility = 'all' | 'none' | 'self-only'

/**
 * Per-cell presentation derived from perception — not world state, not domain perception types.
 * Consumed by the grid to drive fills, token visibility, and obstacle glyphs.
 */
export type EncounterGridCellRenderState = {
  occupantTokenVisibility: OccupantTokenVisibility
  showObstacleGlyph: boolean
  /**
   * When set, may replace tactical base fills (see `mergePerceptionIntoCellVisualState` in `features/combat/components/grid/cellVisualState.ts`;
   * immersed PCs may also replace `aoe-cast-range` / `placement-cast-range` band fills). Presentation-only.
   */
  perceptionBaseFillKind: VisibilityFillKind | null
  /** Echo of domain flag — AoE/darkness template edge may be hidden when true. */
  suppressTemplateBoundary: boolean
}

/**
 * Battlefield-level presentation for veils and global **footprint overlay** suppression (PC only for the
 * latter — DM sees all tactical overlays).
 */
export type EncounterBattlefieldRenderState = {
  useBlindVeil: boolean
  suppressDarknessBoundaryFromInside: boolean
  /**
   * PC: when true, viewer is immersed in MD or heavy obscurement — **strip world-space footprint overlays**
   * in the grid selector (`aoeInTemplate`, `persistentAttachedAura`), not per-cell visibility fills.
   * Named for the AoE placement channel; also gates synced emanation footprint tint.
   * DM: always false (omniscient).
   */
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

/**
 * One viewer’s projected perception for the grid. `suppressAoeTemplateOverlay` duplicates
 * `battlefieldRender.suppressAoeTemplateOverlay` for call sites that only need the immersion / overlay rule.
 */
export type GridPerceptionSlice = {
  viewerCellId: string
  viewerCombatantId: string
  battlefieldRender: EncounterBattlefieldRenderState
  /** Same as `battlefieldRender.suppressAoeTemplateOverlay` — see {@link EncounterBattlefieldRenderState}. */
  suppressAoeTemplateOverlay: boolean
}

/** Maps domain battlefield perception to grid render flags. DM branch keeps all overlay-suppression off. */
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
  /** Merged world at the target cell — drives source-aware visibility presentation. */
  targetWorld: EncounterWorldCellEnvironment
  /**
   * Merged world at the viewer’s cell. Forwarded to {@link resolvePresentationVisibilityFill} so hidden cells
   * can use immersed obscuration **presentation** fills; it does **not** drive target-cell visibility (that is
   * `targetWorld` + `perception`). See `viewerMergedWorldForImmersedHiddenPresentation` on
   * {@link mapResolvedVisibilityToFillKind}.
   */
  viewerWorld: EncounterWorldCellEnvironment
  battlefield: EncounterBattlefieldRenderState
  viewerRole: 'dm' | 'pc'
  isViewerCell: boolean
}): EncounterGridCellRenderState {
  const { perception, targetWorld, viewerWorld, battlefield, viewerRole, isViewerCell } = params

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

  const perceptionBaseFillKind = resolvePresentationVisibilityFill(perception, targetWorld, viewerWorld)

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
  /** Own cell: still show the viewer’s token when domain masks occupants (fog, MD cell, etc.). */
  if (!perception.canPerceiveOccupants) {
    return isViewerCell ? 'self-only' : 'none'
  }
  if (blindVeil && isViewerCell) return 'self-only'
  if (blindVeil) return 'none'
  return 'all'
}

/**
 * Builds viewer-relative perception slice for the grid selector (one battlefield projection + per-cell in selector).
 * Returns null when `input` is missing, placements/space are missing, or the viewer combatant has no cell.
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

  const distanceViewerToTargetFt =
    state.space && slice.viewerCellId
      ? gridDistanceFt(state.space, slice.viewerCellId, targetCellId)
      : undefined

  const perception = resolveViewerPerceptionForCell({
    viewerWorld,
    targetWorld,
    viewerCellId: slice.viewerCellId,
    targetCellId,
    capabilities: mergeGridPerceptionInputCapabilities(input),
    viewerRole: input.viewerRole,
    distanceViewerToTargetFt,
  })

  return projectGridCellRenderState({
    perception,
    targetWorld,
    viewerWorld,
    battlefield: slice.battlefieldRender,
    viewerRole: input.viewerRole,
    isViewerCell: targetCellId === slice.viewerCellId,
  })
}
