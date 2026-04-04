import { describe, expect, it } from 'vitest'

import { createSquareGridSpace } from '@/features/mechanics/domain/combat/space/creation/createSquareGridSpace'
import { buildGridObjectFromAuthoredPlacedObject } from '@/features/mechanics/domain/combat/space/gridObject/gridObject.fromAuthored'
import { placeCombatant } from '@/features/mechanics/domain/combat/space/selectors/space.selectors'

import { resolveCombatAction } from '@/features/mechanics/domain/combat/resolution'
import {
  reconcileBattlefieldEffectAnchors,
  moveGridObjectInEncounterState,
} from '@/features/mechanics/domain/combat/state/auras/battlefield-effect-anchor-reconciliation'
import { resolveBattlefieldEffectOriginCellId } from '@/features/mechanics/domain/combat/state/battlefield/battlefield-effect-anchor'
import { createEncounterState } from '@/features/mechanics/domain/combat/state/runtime'
import type { BattlefieldEffectInstance } from '@/features/mechanics/domain/combat/state/types'

import { createCombatant } from '@/features/mechanics/domain/combat/tests/action-resolution.test-helpers'
import type { Spell } from '@/features/content/spells/domain/types/spell.types'

function authoredGridObject(id: string, cellId: string) {
  return buildGridObjectFromAuthoredPlacedObject({
    id,
    cellId,
    authoredPlaceKindId: 'tree',
  })
}

describe('reconcileBattlefieldEffectAnchors', () => {
  it('refreshes object anchor snapshot when the obstacle moves', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 10, rows: 10 })
    const withObs = { ...space, gridObjects: [authoredGridObject('obs-1', 'c-2-2')] }

    const base = createEncounterState(
      [
        createCombatant({
          instanceId: 'wiz',
          label: 'Wizard',
          side: 'party',
          initiativeModifier: 0,
          dexterityScore: 10,
          armorClass: 10,
        }),
      ],
      { space: withObs, rng: () => 0.5 },
    )

    const aura: BattlefieldEffectInstance = {
      id: 'attached-emanation-test-wiz',
      casterCombatantId: 'wiz',
      source: { kind: 'spell', spellId: 'test-spell' },
      anchor: { kind: 'object', objectId: 'obs-1', snapshotCellId: 'c-2-2' },
      area: { kind: 'sphere', size: 15 },
      unaffectedCombatantIds: [],
    }

    const state: typeof base = { ...base, attachedAuraInstances: [aura] }

    const next = moveGridObjectInEncounterState(state, 'obs-1', 'c-5-5')
    const a = next.attachedAuraInstances?.[0]
    expect(a?.anchor.kind).toBe('object')
    if (a?.anchor.kind !== 'object') return
    expect(a.anchor.snapshotCellId).toBe('c-5-5')
    expect(resolveBattlefieldEffectOriginCellId(next.space, next.placements, a.anchor)).toBe('c-5-5')
  })

  it('removes object-anchored spell aura and drops concentration when the obstacle is gone', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const withObs = { ...space, gridObjects: [authoredGridObject('obs-x', 'c-1-1')] }

    const wiz = createCombatant({
      instanceId: 'wiz',
      label: 'Wizard',
      side: 'party',
      initiativeModifier: 0,
      dexterityScore: 10,
      armorClass: 10,
    })

    const base = createEncounterState([wiz], { space: withObs, rng: () => 0.5 })

    const aura: BattlefieldEffectInstance = {
      id: 'attached-emanation-darkness-wiz',
      casterCombatantId: 'wiz',
      source: { kind: 'spell', spellId: 'darkness' },
      anchor: { kind: 'object', objectId: 'obs-x', snapshotCellId: 'c-1-1' },
      area: { kind: 'sphere', size: 15 },
      unaffectedCombatantIds: [],
    }

    const state: typeof base = {
      ...base,
      attachedAuraInstances: [aura],
      combatantsById: {
        ...base.combatantsById,
        wiz: {
          ...base.combatantsById.wiz!,
          concentration: {
            spellId: 'darkness',
            spellLabel: 'Darkness',
            linkedMarkerIds: [],
            remainingTurns: 100,
            totalTurns: 100,
          },
        },
      },
    }

    const noObstacle = { ...state, space: { ...state.space!, gridObjects: [] } }
    const next = reconcileBattlefieldEffectAnchors(noObstacle)

    expect(next.attachedAuraInstances?.length ?? 0).toBe(0)
    expect(next.combatantsById.wiz?.concentration).toBeUndefined()
  })

  it('keeps place-anchored effects when an unrelated combatant moves', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const base = createEncounterState(
      [
        createCombatant({
          instanceId: 'wiz',
          label: 'Wizard',
          side: 'party',
          initiativeModifier: 0,
          dexterityScore: 10,
          armorClass: 10,
        }),
        createCombatant({
          instanceId: 'gob',
          label: 'Goblin',
          side: 'enemies',
          initiativeModifier: 0,
          dexterityScore: 14,
          armorClass: 12,
        }),
      ],
      { space, rng: () => 0.5 },
    )

    const aura: BattlefieldEffectInstance = {
      id: 'attached-emanation-place-wiz',
      casterCombatantId: 'wiz',
      source: { kind: 'spell', spellId: 'darkness' },
      anchor: { kind: 'place', cellId: 'c-3-3' },
      area: { kind: 'sphere', size: 15 },
      unaffectedCombatantIds: [],
    }

    const state: typeof base = { ...base, attachedAuraInstances: [aura] }
    const moved = placeCombatant(state, 'gob', 'c-6-6')

    expect(moved.attachedAuraInstances).toHaveLength(1)
    expect(moved.attachedAuraInstances![0]!.anchor).toEqual({ kind: 'place', cellId: 'c-3-3' })
  })

  it('updates creature-anchored origin after the anchored combatant moves', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const base = createEncounterState(
      [
        createCombatant({
          instanceId: 'wiz',
          label: 'Wizard',
          side: 'party',
          initiativeModifier: 0,
          dexterityScore: 10,
          armorClass: 10,
        }),
        createCombatant({
          instanceId: 'ally',
          label: 'Ally',
          side: 'party',
          initiativeModifier: 0,
          dexterityScore: 10,
          armorClass: 10,
        }),
      ],
      { space, rng: () => 0.5 },
    )

    const aura: BattlefieldEffectInstance = {
      id: 'attached-emanation-creature-wiz',
      casterCombatantId: 'wiz',
      source: { kind: 'spell', spellId: 'test' },
      anchor: { kind: 'creature', combatantId: 'ally' },
      area: { kind: 'sphere', size: 10 },
      unaffectedCombatantIds: [],
    }

    const state: typeof base = { ...base, attachedAuraInstances: [aura] }
    const moved = placeCombatant(state, 'ally', 'c-4-4')
    const origin = resolveBattlefieldEffectOriginCellId(moved.space, moved.placements, {
      kind: 'creature',
      combatantId: 'ally',
    })
    expect(origin).toBe('c-4-4')
  })
})

describe('resolveBattlefieldEffectOriginCellId — object anchor', () => {
  it('prefers live obstacle cell over stale snapshot', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const withObs = { ...space, gridObjects: [authoredGridObject('o1', 'c-5-5')] }

    const origin = resolveBattlefieldEffectOriginCellId(
      withObs,
      [{ combatantId: 'w', cellId: 'c-0-0' }],
      { kind: 'object', objectId: 'o1', snapshotCellId: 'c-1-1' },
    )
    expect(origin).toBe('c-5-5')
  })
})

describe('object-anchored emanation via resolveCombatAction + obstacle move', () => {
  it('keeps spell action resolving with live origin after obstacle moves', async () => {
    const { buildSpellCombatActions } = await import('@/features/encounter/helpers/spells')
    const { SPELLS_LEVEL_2_A_F } = await import(
      '@/features/mechanics/domain/rulesets/system/spells/data/level2-a-f'
    )
    const darkness = SPELLS_LEVEL_2_A_F.find((s) => s.id === 'darkness')
    if (!darkness) throw new Error('darkness spell missing')

    const [spellAction] = buildSpellCombatActions({
      runtimeId: 'wiz',
      spellSaveDc: 14,
      spellAttackBonus: 5,
      casterLevel: 5,
      spellIds: ['darkness'],
      spellsById: { darkness: darkness as unknown as Spell },
    })

    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 10, rows: 10 })
    const anchored = authoredGridObject('obj-anchor-test', 'c-2-2')
    const withObs = { ...space, gridObjects: [anchored] }

    const state = createEncounterState(
      [
        createCombatant({
          instanceId: 'wiz',
          label: 'Wizard',
          side: 'party',
          initiativeModifier: 0,
          dexterityScore: 10,
          armorClass: 10,
          actions: [
            {
              ...spellAction!,
              attachedEmanation: {
                ...spellAction!.attachedEmanation!,
                anchorMode: 'object',
              },
            },
          ],
        }),
      ],
      { space: withObs, rng: () => 0.5 },
    )

    const resolved = resolveCombatAction(state, {
      actorId: 'wiz',
      actionId: spellAction!.id,
      objectId: 'obj-anchor-test',
    })

    const aura = resolved.attachedAuraInstances?.find((a) => a.source.kind === 'spell' && a.source.spellId === 'darkness')
    expect(aura?.anchor).toEqual({
      kind: 'object',
      objectId: 'obj-anchor-test',
      snapshotCellId: 'c-2-2',
    })

    const moved = moveGridObjectInEncounterState(resolved, 'obj-anchor-test', 'c-7-7')
    const aura2 = moved.attachedAuraInstances?.[0]
    expect(aura2?.anchor.kind).toBe('object')
    if (aura2?.anchor.kind !== 'object') return
    expect(aura2.anchor.snapshotCellId).toBe('c-7-7')
    expect(resolveBattlefieldEffectOriginCellId(moved.space, moved.placements, aura2.anchor)).toBe('c-7-7')
  })
})
