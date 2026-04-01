import { describe, expect, it } from 'vitest'

import { createSquareGridSpace } from '@/features/mechanics/domain/combat/space/creation/createSquareGridSpace'
import type { GridObstacle } from '@/features/mechanics/domain/combat/space/space.types'
import { removeAttachedAurasForSpell } from '@/features/mechanics/domain/combat/state/auras/attached-aura-mutations'
import {
  moveGridObstacleInEncounterState,
  reconcileBattlefieldEffectAnchors,
} from '@/features/mechanics/domain/combat/state/auras/battlefield-effect-anchor-reconciliation'
import { resolveWorldEnvironmentFromEncounterState } from '@/features/mechanics/domain/environment/environment.resolve'
import {
  environmentZoneIdForAttachedAuraInstance,
  reconcileEnvironmentZonesFromAttachedAuras,
} from '@/features/mechanics/domain/environment/environment-zones-battlefield-sync'
import type { EncounterState } from '@/features/mechanics/domain/combat/state/types/encounter-state.types'

function treeObstacle(id: string, cellId: string): GridObstacle {
  return {
    id,
    kind: 'tree',
    cellId,
    blocksLineOfSight: true,
    blocksMovement: true,
  }
}

function baseState(overrides: Partial<EncounterState> = {}): EncounterState {
  const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
  return {
    combatantsById: {},
    partyCombatantIds: [],
    enemyCombatantIds: [],
    initiative: [],
    initiativeOrder: [],
    activeCombatantId: null,
    turnIndex: 0,
    roundNumber: 1,
    started: true,
    log: [],
    space,
    placements: [],
    ...overrides,
  }
}

describe('reconcileEnvironmentZonesFromAttachedAuras', () => {
  it('creates a magical darkness zone from a profiled attached aura', () => {
    const instanceId = 'attached-emanation-darkness-wiz'
    const state = reconcileEnvironmentZonesFromAttachedAuras(
      baseState({
        placements: [{ combatantId: 'wiz', cellId: 'c-2-2' }],
        attachedAuraInstances: [
          {
            id: instanceId,
            casterCombatantId: 'wiz',
            source: { kind: 'spell', spellId: 'darkness' },
            anchor: { kind: 'creature', combatantId: 'wiz' },
            area: { kind: 'sphere', size: 15 },
            unaffectedCombatantIds: [],
            environmentZoneProfile: 'magical-darkness',
          },
        ],
      }),
    )
    const zid = environmentZoneIdForAttachedAuraInstance(instanceId)
    expect(state.environmentZones?.some((z) => z.id === zid)).toBe(true)
    const cell = resolveWorldEnvironmentFromEncounterState(state, 'c-2-2')
    expect(cell).toBeDefined()
    expect(cell!.magicalDarkness).toBe(true)
  })

  it('creates a fog zone: heavy obscured, no lighting forced to darkness, not magical darkness', () => {
    const instanceId = 'attached-emanation-fog-wiz'
    const state = reconcileEnvironmentZonesFromAttachedAuras(
      baseState({
        placements: [{ combatantId: 'wiz', cellId: 'c-2-2' }],
        attachedAuraInstances: [
          {
            id: instanceId,
            casterCombatantId: 'wiz',
            source: { kind: 'spell', spellId: 'fog-cloud' },
            anchor: { kind: 'creature', combatantId: 'wiz' },
            area: { kind: 'sphere', size: 20 },
            unaffectedCombatantIds: [],
            environmentZoneProfile: 'fog',
          },
        ],
      }),
    )
    const zid = environmentZoneIdForAttachedAuraInstance(instanceId)
    const zone = state.environmentZones?.find((z) => z.id === zid)
    expect(zone).toBeDefined()
    expect(zone?.overrides.visibilityObscured).toBe('heavy')
    expect(zone?.overrides.lightingLevel).toBeUndefined()
    expect(zone?.magical?.magicalDarkness).toBeFalsy()
    const cell = resolveWorldEnvironmentFromEncounterState(state, 'c-2-2')
    expect(cell).toBeDefined()
    expect(cell!.magicalDarkness).toBe(false)
    expect(cell!.visibilityObscured).toBe('heavy')
    expect(cell!.lightingLevel).toBe('bright')
    expect(cell!.obscurationPresentationCauses).toContain('fog')
  })

  it('Stinking Cloud reuses the fog profile: same heavy-obscured zone shape as Fog Cloud (spell id only)', () => {
    const instanceId = 'attached-emanation-stinking-wiz'
    const state = reconcileEnvironmentZonesFromAttachedAuras(
      baseState({
        placements: [{ combatantId: 'wiz', cellId: 'c-3-3' }],
        attachedAuraInstances: [
          {
            id: instanceId,
            casterCombatantId: 'wiz',
            source: { kind: 'spell', spellId: 'stinking-cloud' },
            anchor: { kind: 'creature', combatantId: 'wiz' },
            area: { kind: 'sphere', size: 20 },
            unaffectedCombatantIds: [],
            environmentZoneProfile: 'fog',
          },
        ],
      }),
    )
    const zid = environmentZoneIdForAttachedAuraInstance(instanceId)
    expect(state.environmentZones?.some((z) => z.id === zid)).toBe(true)
    const cell = resolveWorldEnvironmentFromEncounterState(state, 'c-3-3')
    expect(cell).toBeDefined()
    expect(cell!.magicalDarkness).toBe(false)
    expect(cell!.visibilityObscured).toBe('heavy')
    expect(cell!.lightingLevel).toBe('bright')
    expect(cell!.obscurationPresentationCauses).toContain('fog')
  })

  it('removes managed zones when the aura row is gone', () => {
    const instanceId = 'attached-emanation-darkness-wiz'
    const withZone = reconcileEnvironmentZonesFromAttachedAuras(
      baseState({
        placements: [{ combatantId: 'wiz', cellId: 'c-2-2' }],
        attachedAuraInstances: [
          {
            id: instanceId,
            casterCombatantId: 'wiz',
            source: { kind: 'spell', spellId: 'darkness' },
            anchor: { kind: 'creature', combatantId: 'wiz' },
            area: { kind: 'sphere', size: 15 },
            unaffectedCombatantIds: [],
            environmentZoneProfile: 'magical-darkness',
          },
        ],
      }),
    )
    const cleared = reconcileEnvironmentZonesFromAttachedAuras(
      baseState({
        placements: [{ combatantId: 'wiz', cellId: 'c-2-2' }],
        environmentZones: withZone.environmentZones,
      }),
    )
    expect((cleared.environmentZones ?? []).filter((z) => z.sourceKind === 'attached-aura')).toHaveLength(0)
  })

  it('preserves non–attached-aura zones', () => {
    const manual = {
      id: 'manual-fog',
      kind: 'patch' as const,
      sourceKind: 'manual' as const,
      area: { kind: 'unattached' as const },
      overrides: { visibilityObscured: 'light' as const },
    }
    const next = reconcileEnvironmentZonesFromAttachedAuras(
      baseState({
        environmentZones: [manual],
      }),
    )
    expect(next.environmentZones?.some((z) => z.id === 'manual-fog')).toBe(true)
  })

  it('updates sphere origin when anchor moves (reconcileBattlefieldEffectAnchors)', () => {
    const instanceId = 'attached-emanation-darkness-wiz'
    const s0 = reconcileBattlefieldEffectAnchors(
      baseState({
        placements: [{ combatantId: 'wiz', cellId: 'c-0-0' }],
        attachedAuraInstances: [
          {
            id: instanceId,
            casterCombatantId: 'wiz',
            source: { kind: 'spell', spellId: 'darkness' },
            anchor: { kind: 'creature', combatantId: 'wiz' },
            area: { kind: 'sphere', size: 15 },
            unaffectedCombatantIds: [],
            environmentZoneProfile: 'magical-darkness',
          },
        ],
      }),
    )
    const zid = environmentZoneIdForAttachedAuraInstance(instanceId)
    const z0 = s0.environmentZones?.find((z) => z.id === zid)
    expect(z0?.area).toEqual({ kind: 'sphere-ft', originCellId: 'c-0-0', radiusFt: 15 })

    const s1 = reconcileBattlefieldEffectAnchors({
      ...s0,
      placements: [{ combatantId: 'wiz', cellId: 'c-4-4' }],
    })
    const z1 = s1.environmentZones?.find((z) => z.id === zid)
    expect(z1?.area).toEqual({ kind: 'sphere-ft', originCellId: 'c-4-4', radiusFt: 15 })
  })

  it('dedupes by stable id on repeated reconciliation', () => {
    const instanceId = 'attached-emanation-darkness-wiz'
    const inner = baseState({
      placements: [{ combatantId: 'wiz', cellId: 'c-1-1' }],
      attachedAuraInstances: [
        {
          id: instanceId,
          casterCombatantId: 'wiz',
          source: { kind: 'spell', spellId: 'darkness' },
          anchor: { kind: 'creature', combatantId: 'wiz' },
          area: { kind: 'sphere', size: 15 },
          unaffectedCombatantIds: [],
          environmentZoneProfile: 'magical-darkness',
        },
      ],
    })
    const a = reconcileEnvironmentZonesFromAttachedAuras(inner)
    const b = reconcileEnvironmentZonesFromAttachedAuras(a)
    expect(a.environmentZones?.filter((z) => z.sourceKind === 'attached-aura').length).toBe(1)
    expect(b.environmentZones?.filter((z) => z.sourceKind === 'attached-aura').length).toBe(1)
  })

  it('removeAttachedAurasForSpell drops linked zone', () => {
    const instanceId = 'attached-emanation-darkness-wiz'
    const s0 = reconcileBattlefieldEffectAnchors(
      baseState({
        placements: [{ combatantId: 'wiz', cellId: 'c-0-0' }],
        attachedAuraInstances: [
          {
            id: instanceId,
            casterCombatantId: 'wiz',
            source: { kind: 'spell', spellId: 'darkness' },
            anchor: { kind: 'creature', combatantId: 'wiz' },
            area: { kind: 'sphere', size: 15 },
            unaffectedCombatantIds: [],
            environmentZoneProfile: 'magical-darkness',
          },
        ],
      }),
    )
    const s1 = removeAttachedAurasForSpell(s0, 'wiz', 'darkness')
    expect(s1.attachedAuraInstances?.length ?? 0).toBe(0)
    expect((s1.environmentZones ?? []).filter((z) => z.sourceKind === 'attached-aura')).toHaveLength(0)
  })

  it('cleans stranded attached-aura zones when aura list is empty', () => {
    const instanceId = 'attached-emanation-darkness-wiz'
    const withAura = reconcileEnvironmentZonesFromAttachedAuras(
      baseState({
        placements: [{ combatantId: 'wiz', cellId: 'c-0-0' }],
        attachedAuraInstances: [
          {
            id: instanceId,
            casterCombatantId: 'wiz',
            source: { kind: 'spell', spellId: 'darkness' },
            anchor: { kind: 'creature', combatantId: 'wiz' },
            area: { kind: 'sphere', size: 15 },
            unaffectedCombatantIds: [],
            environmentZoneProfile: 'magical-darkness',
          },
        ],
      }),
    )
    const stranded: EncounterState = {
      ...withAura,
      attachedAuraInstances: undefined,
    }
    const cleaned = reconcileEnvironmentZonesFromAttachedAuras(stranded)
    expect((cleaned.environmentZones ?? []).filter((z) => z.sourceKind === 'attached-aura')).toHaveLength(0)
  })
})

describe('object-anchored zone follows obstacle move', () => {
  it('updates sphere-ft origin when obstacle cell changes', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 10, rows: 10 })
    const withObs = { ...space, obstacles: [treeObstacle('o1', 'c-2-2')] }
    const instanceId = 'attached-emanation-darkness-wiz'
    const s0 = reconcileBattlefieldEffectAnchors(
      baseState({
        space: withObs,
        placements: [{ combatantId: 'wiz', cellId: 'c-0-0' }],
        attachedAuraInstances: [
          {
            id: instanceId,
            casterCombatantId: 'wiz',
            source: { kind: 'spell', spellId: 'darkness' },
            anchor: { kind: 'object', objectId: 'o1', snapshotCellId: 'c-2-2' },
            area: { kind: 'sphere', size: 15 },
            unaffectedCombatantIds: [],
            environmentZoneProfile: 'magical-darkness',
          },
        ],
      }),
    )
    const zid = environmentZoneIdForAttachedAuraInstance(instanceId)
    expect(s0.environmentZones?.find((z) => z.id === zid)?.area).toEqual({
      kind: 'sphere-ft',
      originCellId: 'c-2-2',
      radiusFt: 15,
    })

    const moved = moveGridObstacleInEncounterState(s0, 'o1', 'c-8-8')
    expect(moved.environmentZones?.find((z) => z.id === zid)?.area).toEqual({
      kind: 'sphere-ft',
      originCellId: 'c-8-8',
      radiusFt: 15,
    })
  })
})

describe('overlapping darkness + baseline', () => {
  it('merges magical flags from zone + baseline in resolveWorldEnvironmentForCell', () => {
    const instanceId = 'attached-emanation-darkness-wiz'
    const state = reconcileEnvironmentZonesFromAttachedAuras(
      baseState({
        placements: [{ combatantId: 'wiz', cellId: 'c-2-2' }],
        attachedAuraInstances: [
          {
            id: instanceId,
            casterCombatantId: 'wiz',
            source: { kind: 'spell', spellId: 'darkness' },
            anchor: { kind: 'creature', combatantId: 'wiz' },
            area: { kind: 'sphere', size: 15 },
            unaffectedCombatantIds: [],
            environmentZoneProfile: 'magical-darkness',
          },
        ],
      }),
    )
    const inside = resolveWorldEnvironmentFromEncounterState(state, 'c-2-2')
    expect(inside).toBeDefined()
    expect(inside!.magicalDarkness).toBe(true)
    const outside = resolveWorldEnvironmentFromEncounterState(state, 'c-6-6')
    expect(outside).toBeDefined()
    expect(outside!.magicalDarkness).toBe(false)
  })
})
