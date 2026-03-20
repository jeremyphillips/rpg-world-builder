import { describe, expect, it, vi } from 'vitest'

import { addConditionToCombatant, createEncounterState, updateEncounterCombatant } from '../state'
import { executeTurnHooks } from '../state/turn-hooks'
import type { CombatantInstance, RuntimeTurnHook } from '../state'

function enemy(id: string, label: string, hp: number): CombatantInstance {
  return {
    instanceId: id,
    side: 'enemies',
    source: { kind: 'monster', sourceId: id, label },
    stats: {
      armorClass: 12,
      maxHitPoints: hp,
      currentHitPoints: hp,
      initiativeModifier: 0,
      dexterityScore: 10,
      abilityScores: { constitution: 10 },
    },
    attacks: [],
    actions: [],
    activeEffects: [],
    runtimeEffects: [],
    turnHooks: [],
    conditions: [],
    states: [],
  }
}

describe('repeat save outcomeTrack (Contagion-style)', () => {
  it('increments progress on success until threshold, then removes condition and hook', () => {
    const goblin = enemy('gob', 'Goblin', 40)
    const state = createEncounterState([goblin], { rng: () => 0.5 })
    const withPoison = addConditionToCombatant(state, 'gob', 'poisoned', { sourceLabel: 'Contagion' })
    const hookId = 'repeat-poison'
    const hook: RuntimeTurnHook = {
      id: hookId,
      label: 'Contagion: repeat save (poisoned)',
      boundary: 'end',
      effects: [],
      repeatSave: {
        ability: 'con',
        dc: 20,
        removeCondition: 'poisoned',
        outcomeTrack: {
          successCountToEnd: 3,
          failCountToLock: 3,
          failLockStateId: 'contagion-prolonged',
        },
        casterInstanceId: 'cleric-1',
      },
    }
    const withHook = updateEncounterCombatant(withPoison, 'gob', (c) => ({
      ...c,
      turnHooks: [...c.turnHooks, hook],
    }))

    const r1 = vi.spyOn(Math, 'random').mockReturnValue(0.99)
    try {
      const after1 = executeTurnHooks(withHook, 'gob', 'end')
      const h1 = after1.combatantsById.gob!.turnHooks.find((h) => h.id === hookId)
      expect(h1?.repeatSaveProgress).toEqual({ successes: 1, fails: 0 })
      expect(after1.combatantsById.gob!.conditions.some((c) => c.label === 'poisoned')).toBe(true)

      const after2 = executeTurnHooks(after1, 'gob', 'end')
      expect(after2.combatantsById.gob!.turnHooks.find((h) => h.id === hookId)?.repeatSaveProgress).toEqual({
        successes: 2,
        fails: 0,
      })

      const after3 = executeTurnHooks(after2, 'gob', 'end')
      expect(after3.combatantsById.gob!.turnHooks.some((h) => h.id === hookId)).toBe(false)
      expect(after3.combatantsById.gob!.conditions.some((c) => c.label === 'poisoned')).toBe(false)
    } finally {
      r1.mockRestore()
    }
  })

  it('locks after failed saves: adds state, removes hook, keeps poisoned', () => {
    const goblin = enemy('gob', 'Goblin', 40)
    const state = createEncounterState([goblin], { rng: () => 0.5 })
    const withPoison = addConditionToCombatant(state, 'gob', 'poisoned', { sourceLabel: 'Contagion' })
    const hookId = 'repeat-poison'
    const hook2: RuntimeTurnHook = {
      id: hookId,
      label: 'Contagion: repeat save (poisoned)',
      boundary: 'end',
      effects: [],
      repeatSave: {
        ability: 'con',
        dc: 20,
        removeCondition: 'poisoned',
        outcomeTrack: {
          successCountToEnd: 3,
          failCountToLock: 3,
          failLockStateId: 'contagion-prolonged',
        },
        casterInstanceId: 'cleric-1',
      },
    }
    const withHook = updateEncounterCombatant(withPoison, 'gob', (c) => ({
      ...c,
      turnHooks: [...c.turnHooks, hook2],
    }))

    const r = vi.spyOn(Math, 'random').mockReturnValue(0)
    try {
      let s = withHook
      s = executeTurnHooks(s, 'gob', 'end')
      s = executeTurnHooks(s, 'gob', 'end')
      const afterLock = executeTurnHooks(s, 'gob', 'end')
      expect(afterLock.combatantsById.gob!.turnHooks.some((h) => h.id === hookId)).toBe(false)
      expect(afterLock.combatantsById.gob!.conditions.some((c) => c.label === 'poisoned')).toBe(true)
      expect(afterLock.combatantsById.gob!.states.some((m) => m.label === 'contagion-prolonged')).toBe(true)
    } finally {
      r.mockRestore()
    }
  })
})
