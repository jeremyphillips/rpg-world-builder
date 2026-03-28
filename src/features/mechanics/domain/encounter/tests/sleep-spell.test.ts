import { describe, expect, it, vi } from 'vitest'

import {
  addConditionToCombatant,
  applyDamageToCombatant,
  createEncounterState,
} from '../state'
import { executeTurnHooks } from '../state/effects/turn-hooks'
import type { CombatantInstance } from '../state'

function baseEnemy(id: string, label: string, hp: number): CombatantInstance {
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
      abilityScores: { wisdom: 10 },
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

describe('Sleep — repeat save and wake on damage', () => {
  it('repeat save fail: removes incapacitated, adds unconscious (sleep-tagged), removes hook', () => {
    const wizard = baseEnemy('wiz', 'Wizard', 20)
    wizard.side = 'party'
    wizard.source = { kind: 'pc', sourceId: 'wiz', label: 'Wizard' }
    const goblin = baseEnemy('gob', 'Goblin', 10)
    const state = createEncounterState([wizard, goblin], { rng: () => 0.5 })

    const withIncap = addConditionToCombatant(state, 'gob', 'incapacitated', {
      sourceLabel: 'Sleep',
      sourceInstanceId: 'wiz',
    })
    const hookId = 'repeat-save-incap-sleep-gob'
    const withHook: typeof withIncap = {
      ...withIncap,
      combatantsById: {
        ...withIncap.combatantsById,
        gob: {
          ...withIncap.combatantsById.gob!,
          turnHooks: [
            {
              id: hookId,
              label: 'Sleep: repeat save (incapacitated)',
              boundary: 'end',
              effects: [],
              repeatSave: {
                ability: 'wis',
                dc: 20,
                removeCondition: 'incapacitated',
                singleAttempt: true,
                onFail: {
                  addCondition: 'unconscious',
                  markerClassification: ['sleep'],
                },
                casterInstanceId: 'wiz',
              },
            },
          ],
        },
      },
    }

    const random = vi.spyOn(Math, 'random').mockReturnValue(0)
    let after: typeof withHook
    try {
      after = executeTurnHooks(withHook, 'gob', 'end')
    } finally {
      random.mockRestore()
    }

    const g = after.combatantsById.gob!
    expect(g.conditions.some((c) => c.label === 'incapacitated')).toBe(false)
    expect(g.conditions.some((c) => c.label === 'unconscious' && c.classification?.includes('sleep'))).toBe(
      true,
    )
    expect(g.turnHooks.some((h) => h.id === hookId)).toBe(false)
  })

  it('repeat save: exhaustion immunity auto-succeeds and clears incapacitated', () => {
    const wizard = baseEnemy('wiz', 'Wizard', 20)
    wizard.side = 'party'
    wizard.source = { kind: 'pc', sourceId: 'wiz', label: 'Wizard' }
    const goblin = baseEnemy('gob', 'Goblin', 10)
    goblin.conditionImmunities = ['exhaustion']
    const state = createEncounterState([wizard, goblin], { rng: () => 0.5 })

    const withIncap = addConditionToCombatant(state, 'gob', 'incapacitated', {
      sourceLabel: 'Sleep',
      sourceInstanceId: 'wiz',
    })
    const hookId = 'repeat-save-incap-sleep-gob'
    const withHook: typeof withIncap = {
      ...withIncap,
      combatantsById: {
        ...withIncap.combatantsById,
        gob: {
          ...withIncap.combatantsById.gob!,
          turnHooks: [
            {
              id: hookId,
              label: 'Sleep: repeat save (incapacitated)',
              boundary: 'end',
              effects: [],
              repeatSave: {
                ability: 'wis',
                dc: 20,
                removeCondition: 'incapacitated',
                singleAttempt: true,
                onFail: {
                  addCondition: 'unconscious',
                  markerClassification: ['sleep'],
                },
                autoSuccessIfImmuneTo: 'exhaustion',
                casterInstanceId: 'wiz',
              },
            },
          ],
        },
      },
    }

    const after = executeTurnHooks(withHook, 'gob', 'end')
    const g = after.combatantsById.gob!
    expect(g.conditions.some((c) => c.label === 'incapacitated')).toBe(false)
    expect(g.conditions.some((c) => c.label === 'unconscious')).toBe(false)
    expect(g.turnHooks.some((h) => h.id === hookId)).toBe(false)
  })

  it('damage removes sleep-tagged unconscious', () => {
    const goblin = baseEnemy('gob', 'Goblin', 10)
    const state = createEncounterState([goblin], { rng: () => 0.5 })
    const withUnconscious = addConditionToCombatant(state, 'gob', 'unconscious', {
      sourceLabel: 'Sleep',
      classification: ['sleep'],
    })
    const damaged = applyDamageToCombatant(withUnconscious, 'gob', 1, { actorId: 'wiz' })
    expect(damaged.combatantsById.gob!.conditions.some((c) => c.label === 'unconscious')).toBe(false)
    expect(
      damaged.log.some(
        (e) => e.type === 'condition-removed' && e.summary?.includes('Sleep ends on damage'),
      ),
    ).toBe(true)
  })
})
