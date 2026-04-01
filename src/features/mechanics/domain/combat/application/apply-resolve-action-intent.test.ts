import { describe, expect, it } from 'vitest'

import { createEncounterState } from '../state'
import { createCombatant } from '../tests/action-resolution.test-helpers'
import { applyResolveActionIntent } from './apply-resolve-action-intent'

describe('applyResolveActionIntent', () => {
  it('fails validation when actionId is not on the actor action list', () => {
    const state = createEncounterState(
      [
        createCombatant({
          instanceId: 'actor',
          label: 'Fighter',
          side: 'party',
          initiativeModifier: 5,
          dexterityScore: 16,
          armorClass: 16,
          actions: [
            {
              id: 'slash',
              label: 'Slash',
              kind: 'weapon-attack',
              cost: { action: true },
              resolutionMode: 'attack-roll',
              attackProfile: {
                attackBonus: 5,
                damage: '1d6 + 2',
                damageType: 'slashing',
              },
            },
          ],
        }),
        createCombatant({
          instanceId: 'target',
          label: 'Goblin',
          side: 'enemies',
          initiativeModifier: 1,
          dexterityScore: 12,
          armorClass: 13,
        }),
      ],
      { rng: () => 0.1 },
    )

    const result = applyResolveActionIntent(
      state,
      {
        kind: 'resolve-action',
        actorId: 'actor',
        targetId: 'target',
        actionId: 'not-a-real-action',
      },
      { resolveCombatActionOptions: { rng: () => 0.5 } },
    )

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('validation-failed')
      if (result.error.code === 'validation-failed') {
        expect(result.error.issues.some((i) => i.code === 'unknown-action')).toBe(true)
      }
    }
  })

  it('emits action-log-slice and log-appended when log grows', () => {
    const state = createEncounterState(
      [
        createCombatant({
          instanceId: 'actor',
          label: 'Fighter',
          side: 'party',
          initiativeModifier: 5,
          dexterityScore: 16,
          armorClass: 16,
          actions: [
            {
              id: 'slash',
              label: 'Slash',
              kind: 'weapon-attack',
              cost: { action: true },
              resolutionMode: 'attack-roll',
              attackProfile: {
                attackBonus: 5,
                damage: '1d6 + 2',
                damageType: 'slashing',
              },
            },
          ],
        }),
        createCombatant({
          instanceId: 'target',
          label: 'Goblin',
          side: 'enemies',
          initiativeModifier: 1,
          dexterityScore: 12,
          armorClass: 13,
        }),
      ],
      { rng: () => 0.1 },
    )

    const result = applyResolveActionIntent(
      state,
      {
        kind: 'resolve-action',
        actorId: 'actor',
        targetId: 'target',
        actionId: 'slash',
      },
      { resolveCombatActionOptions: { rng: () => 0.7 } },
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return
    const slice = result.events.find((e) => e.kind === 'action-log-slice')
    expect(slice?.kind).toBe('action-log-slice')
    if (slice?.kind === 'action-log-slice') {
      expect(slice.entryTypes.length).toBeGreaterThan(0)
    }
    expect(result.events.some((e) => e.kind === 'log-appended')).toBe(true)
  })
})
