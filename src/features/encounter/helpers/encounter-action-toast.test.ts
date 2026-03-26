import { describe, expect, it } from 'vitest'

import type { CombatLogEvent } from '@/features/mechanics/domain/encounter'
import type { CombatantInstance } from '@/features/mechanics/domain/encounter'
import type { EncounterState } from '@/features/mechanics/domain/encounter/state/types'

import { buildEncounterActionToastPayload } from './encounter-action-toast'

function minimalCombatant(overrides: Partial<CombatantInstance>): CombatantInstance {
  return {
    instanceId: 'v',
    side: 'enemies',
    source: { kind: 'monster', sourceId: 'm', label: 'Goblin' },
    stats: {
      armorClass: 10,
      maxHitPoints: 10,
      currentHitPoints: 0,
      initiativeModifier: 0,
    },
    attacks: [],
    activeEffects: [],
    runtimeEffects: [],
    turnHooks: [],
    conditions: [],
    states: [],
    ...overrides,
  }
}

function minimalState(c: CombatantInstance): EncounterState {
  return {
    combatantsById: { [c.instanceId]: c },
    partyCombatantIds: [],
    enemyCombatantIds: [c.instanceId],
    initiative: [],
    initiativeOrder: [],
    activeCombatantId: null,
    turnIndex: 0,
    roundNumber: 1,
    started: true,
    log: [],
  }
}

describe('buildEncounterActionToastPayload defeat suffix', () => {
  it('appends defeated phrase to title when damage-applied targets are defeated in post state', () => {
    const victim = minimalCombatant({})
    const events: CombatLogEvent[] = [
      {
        id: '1',
        timestamp: "t1",
        type: 'damage-applied',
        actorId: 'a',
        targetIds: [victim.instanceId],
        round: 1,
        turn: 1,
        summary: 'Goblin takes 10 damage.',
      },
    ]
    const payload = buildEncounterActionToastPayload(events, minimalState(victim))
    expect(payload).not.toBeNull()
    expect(payload!.title).toContain('—')
    expect(payload!.title).toContain('defeated')
  })

  it('does not append when encounter state is omitted', () => {
    const events: CombatLogEvent[] = [
      {
        id: '1',
        timestamp: "t1",
        type: 'damage-applied',
        actorId: 'a',
        targetIds: ['v'],
        round: 1,
        turn: 1,
        summary: 'x takes damage.',
      },
    ]
    const payload = buildEncounterActionToastPayload(events)
    expect(payload).not.toBeNull()
    expect(payload!.title).not.toContain('defeated.')
  })
})
