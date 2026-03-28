import type { EncounterSpace } from '@/features/encounter/space'
import { gridDistanceFt } from '@/features/encounter/space'
import type { EncounterState } from '@/features/mechanics/domain/encounter/state/types/encounter-state.types'

import type {
  EncounterAtmosphereTag,
  EncounterEnvironmentAreaLink,
  EncounterEnvironmentBaseline,
  EncounterEnvironmentZone,
  EncounterWorldCellEnvironment,
  WorldObscurationPresentationCause,
} from './environment.types'

export const DEFAULT_ENCOUNTER_ENVIRONMENT_BASELINE: EncounterEnvironmentBaseline = {
  setting: 'outdoors',
  lightingLevel: 'bright',
  terrainMovement: 'normal',
  visibilityObscured: 'none',
  terrainCover: 'none',
  atmosphereTags: [],
}

/**
 * Deterministic merge order: priority ascending, then id ascending.
 * Later zones in this order win for scalar field overrides.
 */
export function sortZonesForMerge(zones: EncounterEnvironmentZone[]): EncounterEnvironmentZone[] {
  return [...zones].sort((a, b) => {
    const pa = a.priority ?? 0
    const pb = b.priority ?? 0
    if (pa !== pb) return pa - pb
    return a.id.localeCompare(b.id)
  })
}

/**
 * Whether `cellId` lies inside the zone geometry. Requires `space` for foot-based and radius shapes.
 */
export function cellIdInEnvironmentArea(
  space: EncounterSpace | undefined,
  area: EncounterEnvironmentAreaLink,
  cellId: string,
): boolean {
  switch (area.kind) {
    case 'grid-cell-ids':
      return area.cellIds.includes(cellId)
    case 'sphere-ft': {
      if (!space) return false
      const dist = gridDistanceFt(space, area.originCellId, cellId)
      if (dist === undefined) return false
      return dist <= area.radiusFt
    }
    case 'unattached':
      return false
  }
}

/**
 * @deprecated Use {@link cellIdInEnvironmentArea} with `EncounterSpace` for full coverage (including `sphere-ft`).
 */
export function cellIdInEnvironmentAreaLink(area: EncounterEnvironmentAreaLink, cellId: string): boolean {
  switch (area.kind) {
    case 'grid-cell-ids':
      return area.cellIds.includes(cellId)
    case 'sphere-ft':
      return false
    case 'unattached':
      return false
  }
}

function mergeAtmosphereForZones(
  baseline: EncounterAtmosphereTag[],
  applicableSorted: EncounterEnvironmentZone[],
): EncounterAtmosphereTag[] {
  let tags = [...baseline]
  for (const z of applicableSorted) {
    const o = z.overrides
    if (o.atmosphereTagsReplace !== undefined) {
      tags = [...o.atmosphereTagsReplace]
    }
    if (o.atmosphereTagsRemove?.length) {
      const remove = new Set(o.atmosphereTagsRemove)
      tags = tags.filter((t) => !remove.has(t))
    }
    if (o.atmosphereTagsAdd?.length) {
      tags = [...new Set([...tags, ...o.atmosphereTagsAdd])]
    }
  }
  return tags
}

function mergeMagicalFlags(applicableSorted: EncounterEnvironmentZone[]): {
  magicalDarkness: boolean
  blocksDarkvision: boolean
  magical: boolean
} {
  let magicalDarkness = false
  let blocksDarkvision = false
  let magical = false
  for (const z of applicableSorted) {
    const m = z.magical
    if (!m) continue
    if (m.magicalDarkness) magicalDarkness = true
    if (m.blocksDarkvision) blocksDarkvision = true
    if (m.magical) magical = true
  }
  return { magicalDarkness, blocksDarkvision, magical }
}

/**
 * Baseline first, then each applicable zone in merge order — presentation-only causes for visibility resolution.
 */
export function collectObscurationPresentationCauses(
  baseline: EncounterEnvironmentBaseline,
  applicableSorted: EncounterEnvironmentZone[],
): WorldObscurationPresentationCause[] {
  const causes: WorldObscurationPresentationCause[] = []
  if (baseline.lightingLevel === 'darkness') {
    causes.push('darkness')
  }
  if (baseline.visibilityObscured !== 'none') {
    causes.push('environment')
  }
  for (const z of applicableSorted) {
    if (z.visibilityObscurationCause) {
      causes.push(z.visibilityObscurationCause)
      continue
    }
    if (z.magical?.magicalDarkness) {
      causes.push('magical-darkness')
      continue
    }
    if (z.overrides.lightingLevel === 'darkness') {
      causes.push('darkness')
      continue
    }
    if (z.overrides.visibilityObscured !== undefined && z.overrides.visibilityObscured !== 'none') {
      causes.push('environment')
    }
  }
  return causes
}

/**
 * Resolve **world** environment at a cell: baseline + applicable zones (sorted), with deterministic precedence.
 */
export function resolveWorldEnvironmentForCell(
  baseline: EncounterEnvironmentBaseline,
  zones: EncounterEnvironmentZone[],
  space: EncounterSpace,
  cellId: string,
): EncounterWorldCellEnvironment {
  const applicable = zones.filter((z) => cellIdInEnvironmentArea(space, z.area, cellId))
  const applicableSorted = sortZonesForMerge(applicable)

  let setting = baseline.setting
  let lightingLevel = baseline.lightingLevel
  let terrainMovement = baseline.terrainMovement
  let visibilityObscured = baseline.visibilityObscured
  let terrainCover = baseline.terrainCover ?? 'none'
  const appliedZoneIds: string[] = []

  for (const z of applicableSorted) {
    appliedZoneIds.push(z.id)
    const o = z.overrides
    if (o.setting !== undefined) setting = o.setting
    if (o.lightingLevel !== undefined) lightingLevel = o.lightingLevel
    if (o.terrainMovement !== undefined) terrainMovement = o.terrainMovement
    if (o.visibilityObscured !== undefined) visibilityObscured = o.visibilityObscured
    if (o.terrainCover !== undefined) terrainCover = o.terrainCover
  }

  const atmosphereTags = mergeAtmosphereForZones(baseline.atmosphereTags, applicableSorted)
  const { magicalDarkness, blocksDarkvision, magical } = mergeMagicalFlags(applicableSorted)
  const obscurationPresentationCauses = collectObscurationPresentationCauses(baseline, applicableSorted)

  return {
    setting,
    lightingLevel,
    terrainMovement,
    visibilityObscured,
    atmosphereTags,
    magicalDarkness,
    blocksDarkvision,
    magical,
    terrainCover,
    appliedZoneIds,
    obscurationPresentationCauses,
  }
}

export function buildResolvedWorldEnvironmentCellMap(
  baseline: EncounterEnvironmentBaseline,
  zones: EncounterEnvironmentZone[],
  space: EncounterSpace,
): Record<string, EncounterWorldCellEnvironment> {
  const out: Record<string, EncounterWorldCellEnvironment> = {}
  for (const cell of space.cells) {
    out[cell.id] = resolveWorldEnvironmentForCell(baseline, zones, space, cell.id)
  }
  return out
}

/**
 * Uses encounter baseline + zones + grid. Returns undefined when the encounter has no space.
 */
export function resolveWorldEnvironmentFromEncounterState(
  state: EncounterState,
  cellId: string,
): EncounterWorldCellEnvironment | undefined {
  if (!state.space) return undefined
  const baseline = state.environmentBaseline ?? DEFAULT_ENCOUNTER_ENVIRONMENT_BASELINE
  const zones = state.environmentZones ?? []
  return resolveWorldEnvironmentForCell(baseline, zones, state.space, cellId)
}

/**
 * @deprecated Prefer {@link resolveWorldEnvironmentForCell} with explicit `EncounterSpace`.
 * When `space` is omitted, only `grid-cell-ids` areas can match (no `sphere-ft` / radius).
 */
export function resolveCellEnvironment(
  baseline: EncounterEnvironmentBaseline,
  zones: EncounterEnvironmentZone[],
  cellId: string,
  space?: EncounterSpace,
): EncounterWorldCellEnvironment {
  if (space) {
    return resolveWorldEnvironmentForCell(baseline, zones, space, cellId)
  }
  const applicable = zones.filter((z) => cellIdInEnvironmentAreaLink(z.area, cellId))
  const applicableSorted = sortZonesForMerge(applicable)

  let setting = baseline.setting
  let lightingLevel = baseline.lightingLevel
  let terrainMovement = baseline.terrainMovement
  let visibilityObscured = baseline.visibilityObscured
  let terrainCover = baseline.terrainCover ?? 'none'
  const appliedZoneIds: string[] = []

  for (const z of applicableSorted) {
    appliedZoneIds.push(z.id)
    const o = z.overrides
    if (o.setting !== undefined) setting = o.setting
    if (o.lightingLevel !== undefined) lightingLevel = o.lightingLevel
    if (o.terrainMovement !== undefined) terrainMovement = o.terrainMovement
    if (o.visibilityObscured !== undefined) visibilityObscured = o.visibilityObscured
    if (o.terrainCover !== undefined) terrainCover = o.terrainCover
  }

  const atmosphereTags = mergeAtmosphereForZones(baseline.atmosphereTags, applicableSorted)
  const { magicalDarkness, blocksDarkvision, magical } = mergeMagicalFlags(applicableSorted)
  const obscurationPresentationCauses = collectObscurationPresentationCauses(baseline, applicableSorted)

  return {
    setting,
    lightingLevel,
    terrainMovement,
    visibilityObscured,
    atmosphereTags,
    magicalDarkness,
    blocksDarkvision,
    magical,
    terrainCover,
    appliedZoneIds,
    obscurationPresentationCauses,
  }
}
