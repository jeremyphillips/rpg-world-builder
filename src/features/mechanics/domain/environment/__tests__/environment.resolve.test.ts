import { describe, expect, it } from 'vitest'

import { createSquareGridSpace } from '@/features/encounter/space'

import {
  buildResolvedWorldEnvironmentCellMap,
  DEFAULT_ENCOUNTER_ENVIRONMENT_BASELINE,
  resolveCellEnvironment,
  resolveWorldEnvironmentForCell,
  sortZonesForMerge,
} from '../environment.resolve'
import type { EncounterEnvironmentBaseline, EncounterEnvironmentZone } from '../environment.types'

function zone(
  partial: Omit<EncounterEnvironmentZone, 'kind' | 'sourceKind'> & {
    kind?: EncounterEnvironmentZone['kind']
    sourceKind?: EncounterEnvironmentZone['sourceKind']
  },
): EncounterEnvironmentZone {
  const { kind, sourceKind, ...rest } = partial
  return {
    kind: kind ?? 'patch',
    sourceKind: sourceKind ?? 'manual',
    ...rest,
  }
}

describe('sortZonesForMerge', () => {
  it('orders by priority asc then id asc', () => {
    const z = [
      zone({ id: 'b', priority: 1, area: { kind: 'grid-cell-ids', cellIds: [] }, overrides: {} }),
      zone({ id: 'a', priority: 2, area: { kind: 'grid-cell-ids', cellIds: [] }, overrides: {} }),
      zone({ id: 'c', priority: 1, area: { kind: 'grid-cell-ids', cellIds: [] }, overrides: {} }),
    ]
    expect(sortZonesForMerge(z).map((x) => x.id)).toEqual(['b', 'c', 'a'])
  })
})

describe('resolveWorldEnvironmentForCell', () => {
  const tinySpace = createSquareGridSpace({
    id: 's',
    name: 't',
    columns: 5,
    rows: 5,
    cellFeet: 5,
  })

  it('returns baseline fields when no zones apply', () => {
    const r = resolveWorldEnvironmentForCell(DEFAULT_ENCOUNTER_ENVIRONMENT_BASELINE, [], tinySpace, 'c-0-0')
    expect(r.setting).toBe(DEFAULT_ENCOUNTER_ENVIRONMENT_BASELINE.setting)
    expect(r.lightingLevel).toBe(DEFAULT_ENCOUNTER_ENVIRONMENT_BASELINE.lightingLevel)
    expect(r.magicalDarkness).toBe(false)
    expect(r.blocksDarkvision).toBe(false)
    expect(r.magical).toBe(false)
    expect(r.terrainCover).toBe('none')
    expect(r.appliedZoneIds).toEqual([])
  })

  it('merges terrainCover like other scalars (last applicable zone wins)', () => {
    const baseline: EncounterEnvironmentBaseline = {
      ...DEFAULT_ENCOUNTER_ENVIRONMENT_BASELINE,
      terrainCover: 'none',
    }
    const zones: EncounterEnvironmentZone[] = [
      zone({
        id: 'a',
        priority: 0,
        area: { kind: 'grid-cell-ids', cellIds: ['c-0-0'] },
        overrides: { terrainCover: 'half' },
      }),
      zone({
        id: 'b',
        priority: 1,
        area: { kind: 'grid-cell-ids', cellIds: ['c-0-0'] },
        overrides: { terrainCover: 'three-quarters' },
      }),
    ]
    const r = resolveWorldEnvironmentForCell(baseline, zones, tinySpace, 'c-0-0')
    expect(r.terrainCover).toBe('three-quarters')
    expect(r.appliedZoneIds).toEqual(['a', 'b'])
  })

  it('applies scalar overrides: higher priority wins', () => {
    const baseline: EncounterEnvironmentBaseline = {
      ...DEFAULT_ENCOUNTER_ENVIRONMENT_BASELINE,
      lightingLevel: 'bright',
      visibilityObscured: 'none',
    }
    const zones: EncounterEnvironmentZone[] = [
      zone({
        id: 'low',
        priority: 0,
        area: { kind: 'grid-cell-ids', cellIds: ['c-0-0'] },
        overrides: { visibilityObscured: 'heavy', lightingLevel: 'dim' },
      }),
      zone({
        id: 'high',
        priority: 5,
        area: { kind: 'grid-cell-ids', cellIds: ['c-0-0'] },
        overrides: { lightingLevel: 'darkness' },
      }),
    ]
    const r = resolveWorldEnvironmentForCell(baseline, zones, tinySpace, 'c-0-0')
    expect(r.visibilityObscured).toBe('heavy')
    expect(r.lightingLevel).toBe('darkness')
    expect(r.appliedZoneIds).toEqual(['low', 'high'])
  })

  it('tie-breaks equal priority by id (last writer wins: z2 after z1)', () => {
    const baseline = DEFAULT_ENCOUNTER_ENVIRONMENT_BASELINE
    const zones: EncounterEnvironmentZone[] = [
      zone({
        id: 'z2',
        priority: 0,
        area: { kind: 'grid-cell-ids', cellIds: ['c-1-1'] },
        overrides: { lightingLevel: 'dim' },
      }),
      zone({
        id: 'z1',
        priority: 0,
        area: { kind: 'grid-cell-ids', cellIds: ['c-1-1'] },
        overrides: { lightingLevel: 'darkness' },
      }),
    ]
    const r = resolveWorldEnvironmentForCell(baseline, zones, tinySpace, 'c-1-1')
    expect(r.lightingLevel).toBe('dim')
    expect(r.appliedZoneIds).toEqual(['z1', 'z2'])
  })

  it('merges atmosphere tags per zone order', () => {
    const baseline: EncounterEnvironmentBaseline = {
      ...DEFAULT_ENCOUNTER_ENVIRONMENT_BASELINE,
      atmosphereTags: ['high-wind'],
    }
    const zones: EncounterEnvironmentZone[] = [
      zone({
        id: 'a',
        area: { kind: 'grid-cell-ids', cellIds: ['c-0-0'] },
        overrides: { atmosphereTagsReplace: ['underwater'] },
      }),
      zone({
        id: 'b',
        area: { kind: 'grid-cell-ids', cellIds: ['c-0-0'] },
        overrides: { atmosphereTagsAdd: ['extreme-cold'] },
      }),
    ]
    const r = resolveWorldEnvironmentForCell(baseline, zones, tinySpace, 'c-0-0')
    expect(new Set(r.atmosphereTags)).toEqual(new Set(['underwater', 'extreme-cold']))
  })

  it('ORs magical flags across applicable zones', () => {
    const baseline = DEFAULT_ENCOUNTER_ENVIRONMENT_BASELINE
    const zones: EncounterEnvironmentZone[] = [
      zone({
        id: 'm1',
        area: { kind: 'grid-cell-ids', cellIds: ['c-0-0'] },
        overrides: {},
        magical: { magicalDarkness: true },
      }),
      zone({
        id: 'm2',
        area: { kind: 'grid-cell-ids', cellIds: ['c-0-0'] },
        overrides: {},
        magical: { blocksDarkvision: true, magical: true },
      }),
    ]
    const r = resolveWorldEnvironmentForCell(baseline, zones, tinySpace, 'c-0-0')
    expect(r.magicalDarkness).toBe(true)
    expect(r.blocksDarkvision).toBe(true)
    expect(r.magical).toBe(true)
  })

  it('includes cells within sphere-ft using Chebyshev feet', () => {
    const baseline = DEFAULT_ENCOUNTER_ENVIRONMENT_BASELINE
    const zones: EncounterEnvironmentZone[] = [
      zone({
        id: 'dark',
        area: { kind: 'sphere-ft', originCellId: 'c-2-2', radiusFt: 5 },
        overrides: { lightingLevel: 'darkness' },
      }),
    ]
    expect(resolveWorldEnvironmentForCell(baseline, zones, tinySpace, 'c-2-2').lightingLevel).toBe('darkness')
    expect(resolveWorldEnvironmentForCell(baseline, zones, tinySpace, 'c-0-0').lightingLevel).toBe(
      baseline.lightingLevel,
    )
  })

  it('buildResolvedWorldEnvironmentCellMap covers every cell', () => {
    const map = buildResolvedWorldEnvironmentCellMap(DEFAULT_ENCOUNTER_ENVIRONMENT_BASELINE, [], tinySpace)
    expect(Object.keys(map).length).toBe(tinySpace.cells.length)
    expect(map['c-0-0']!.setting).toBe(DEFAULT_ENCOUNTER_ENVIRONMENT_BASELINE.setting)
  })
})

describe('resolveCellEnvironment (legacy, no space)', () => {
  it('matches grid-cell-ids only', () => {
    const r = resolveCellEnvironment(DEFAULT_ENCOUNTER_ENVIRONMENT_BASELINE, [], 'c1')
    expect(r.appliedZoneIds).toEqual([])
  })
})
