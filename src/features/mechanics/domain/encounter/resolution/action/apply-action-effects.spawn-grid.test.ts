import { describe, expect, it } from 'vitest'

import type { Monster } from '@/features/content/monsters/domain/types'
import { createSquareGridSpace } from '@/features/encounter/space'
import { getOccupant } from '@/features/encounter/space/space.helpers'
import { selectGridViewModel } from '@/features/encounter/space/selectors/space.selectors'
import { applyActionEffects } from './action-effects'
import type { CombatActionDefinition } from '../combat-action.types'
import type { EncounterState } from '../../state/types'
import { createCombatant } from '../../tests/action-resolution.test-helpers'

const zombieMonster = {
  id: 'zombie',
  name: 'Zombie',
  mechanics: {
    hitPoints: { count: 3, die: 8 },
    armorClass: 8,
    movement: { walk: 20 },
  },
  lore: { xpValue: 50, challengeRating: 0.25 },
} as unknown as Monster

describe('applyActionEffects — spawn grid replacement (remains → new occupant)', () => {
  it('transfers corpse cell to spawned combatant; grid VM shows spawn not corpse', () => {
    const spawnAction: CombatActionDefinition = {
      id: 'animate-dead-test',
      label: 'Animate Dead',
      kind: 'spell',
      cost: { action: true },
      resolutionMode: 'effects',
      effects: [
        {
          kind: 'spawn',
          count: 1,
          mapMonsterIdFromTargetRemains: { corpse: 'zombie', bones: 'skeleton' },
        },
      ],
      targeting: { kind: 'dead-creature' },
    }

    const wizard = createCombatant({
      instanceId: 'wiz',
      label: 'Wizard',
      side: 'party',
      initiativeModifier: 2,
      dexterityScore: 14,
      armorClass: 12,
      actions: [spawnAction],
    })
    const corpse = createCombatant({
      instanceId: 'fallen',
      label: 'Fallen Orc',
      side: 'enemies',
      initiativeModifier: 1,
      dexterityScore: 12,
      armorClass: 13,
      creatureType: 'humanoid',
      currentHitPoints: 0,
      remains: 'corpse',
    })

    const space = createSquareGridSpace({ id: 'arena', name: 'Arena', columns: 4, rows: 4 })
    const base: EncounterState = {
      combatantsById: { [wizard.instanceId]: wizard, [corpse.instanceId]: corpse },
      partyCombatantIds: [wizard.instanceId],
      enemyCombatantIds: [corpse.instanceId],
      initiative: [],
      initiativeOrder: [wizard.instanceId],
      activeCombatantId: wizard.instanceId,
      turnIndex: 0,
      roundNumber: 1,
      started: true,
      log: [],
      space,
      placements: [
        { combatantId: 'wiz', cellId: 'c-0-0' },
        { combatantId: 'fallen', cellId: 'c-2-2' },
      ],
    }

    const { state } = applyActionEffects(
      base,
      wizard,
      corpse,
      spawnAction,
      spawnAction.effects,
      {
        rng: () => 0.5,
        sourceLabel: 'Animate Dead',
        monstersById: { zombie: zombieMonster },
        buildSummonAllyCombatant: ({ monster, runtimeId }) =>
          createCombatant({
            instanceId: runtimeId,
            label: monster.name,
            side: 'party',
            initiativeModifier: 0,
            dexterityScore: 6,
            armorClass: 8,
          }),
      },
    )

    const spawnedId = Object.keys(state.combatantsById).find((id) => id.includes('spawn-zombie'))
    expect(spawnedId).toBeDefined()

    expect(state.combatantsById['fallen']?.remainsConsumed).toEqual({
      atRound: 1,
      spawnInstanceId: spawnedId,
    })

    expect(state.initiativeOrder.includes('fallen')).toBe(false)
    expect(state.initiativeOrder).toContain(spawnedId!)

    expect(state.placements!.some((p) => p.combatantId === 'fallen')).toBe(false)
    expect(getOccupant(state.placements!, 'c-2-2')).toBe(spawnedId)

    const grid = selectGridViewModel(state, {})
    const cell = grid!.cells.find((c) => c.cellId === 'c-2-2')
    expect(cell!.occupantId).toBe(spawnedId)
    expect(cell!.occupantId).not.toBe('fallen')
  })

  it('applies grid replacement when inheritGridCellFromTarget is set without remains mapping', () => {
    const action: CombatActionDefinition = {
      id: 'replace-test',
      label: 'Replace',
      kind: 'spell',
      cost: { action: true },
      resolutionMode: 'effects',
      effects: [
        {
          kind: 'spawn',
          count: 1,
          monsterId: 'zombie',
          inheritGridCellFromTarget: true,
        },
      ],
      targeting: { kind: 'single-creature' },
    }

    const caster = createCombatant({
      instanceId: 'c',
      label: 'Caster',
      side: 'party',
      initiativeModifier: 1,
      dexterityScore: 10,
      armorClass: 12,
      actions: [action],
    })
    const target = createCombatant({
      instanceId: 't',
      label: 'Target',
      side: 'enemies',
      initiativeModifier: 0,
      dexterityScore: 10,
      armorClass: 10,
      currentHitPoints: 1,
    })

    const space = createSquareGridSpace({ id: 'g', name: 'g', columns: 3, rows: 3 })
    const state: EncounterState = {
      combatantsById: { c: caster, t: target },
      partyCombatantIds: ['c'],
      enemyCombatantIds: ['t'],
      initiative: [],
      initiativeOrder: ['c', 't'],
      activeCombatantId: 'c',
      turnIndex: 0,
      roundNumber: 1,
      started: true,
      log: [],
      space,
      placements: [
        { combatantId: 'c', cellId: 'c-0-0' },
        { combatantId: 't', cellId: 'c-1-1' },
      ],
    }

    const { state: next } = applyActionEffects(state, caster, target, action, action.effects, {
      rng: () => 0.5,
      sourceLabel: 'Replace',
      monstersById: { zombie: zombieMonster },
      buildSummonAllyCombatant: ({ monster, runtimeId }) =>
        createCombatant({
          instanceId: runtimeId,
          label: monster.name,
          side: 'party',
          initiativeModifier: 0,
          dexterityScore: 10,
          armorClass: 8,
        }),
    })

    const spawnedId = Object.keys(next.combatantsById).find((id) => id.includes('spawn-zombie'))
    expect(spawnedId).toBeDefined()
    expect(getOccupant(next.placements!, 'c-1-1')).toBe(spawnedId)
    expect(next.placements!.some((p) => p.combatantId === 't')).toBe(false)
  })

  it('places single-cell spawn on options.singleCellPlacementCellId when not inherit-from-target', () => {
    const action: CombatActionDefinition = {
      id: 'conjure-test',
      label: 'Conjure',
      kind: 'spell',
      cost: { action: true },
      resolutionMode: 'effects',
      effects: [
        {
          kind: 'spawn',
          count: 1,
          monsterId: 'zombie',
        },
      ],
      targeting: { kind: 'none' },
    }

    const wizard = createCombatant({
      instanceId: 'wiz',
      label: 'Wizard',
      side: 'party',
      initiativeModifier: 2,
      dexterityScore: 14,
      armorClass: 12,
      actions: [action],
    })

    const space = createSquareGridSpace({ id: 'arena', name: 'Arena', columns: 4, rows: 4 })
    const base: EncounterState = {
      combatantsById: { [wizard.instanceId]: wizard },
      partyCombatantIds: [wizard.instanceId],
      enemyCombatantIds: [],
      initiative: [],
      initiativeOrder: [wizard.instanceId],
      activeCombatantId: wizard.instanceId,
      turnIndex: 0,
      roundNumber: 1,
      started: true,
      log: [],
      space,
      placements: [{ combatantId: 'wiz', cellId: 'c-0-0' }],
    }

    const { state } = applyActionEffects(base, wizard, wizard, action, action.effects, {
      rng: () => 0.5,
      sourceLabel: 'Conjure',
      monstersById: { zombie: zombieMonster },
      buildSummonAllyCombatant: ({ monster, runtimeId }) =>
        createCombatant({
          instanceId: runtimeId,
          label: monster.name,
          side: 'party',
          initiativeModifier: 0,
          dexterityScore: 6,
          armorClass: 8,
        }),
      singleCellPlacementCellId: 'c-2-0',
    })

    const spawnedId = Object.keys(state.combatantsById).find((id) => id.includes('spawn-zombie'))
    expect(spawnedId).toBeDefined()
    expect(getOccupant(state.placements!, 'c-2-0')).toBe(spawnedId)
  })
})
