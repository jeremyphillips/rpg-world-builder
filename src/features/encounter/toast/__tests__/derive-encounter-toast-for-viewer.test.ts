import { describe, expect, it } from 'vitest'

import type { CombatLogEvent } from '@/features/mechanics/domain/combat'

import { deriveEncounterToastForViewer } from '../derive-encounter-toast-for-viewer'

function hitEvent(actorId: string, targetId: string): CombatLogEvent {
  return {
    id: 'e1',
    timestamp: 't',
    type: 'attack-hit',
    actorId,
    targetIds: [targetId],
    round: 1,
    turn: 1,
    summary: 'Hero hits Goblin with Longsword.',
    details: 'Attack roll: 10 + 3 = 13 vs AC 12.',
  }
}

describe('deriveEncounterToastForViewer', () => {
  it('session actor controller uses success tone on clean hit', () => {
    const p = deriveEncounterToastForViewer(
      [hitEvent('a1', 't1')],
      undefined,
      {
        viewerMode: 'session',
        controlledCombatantIds: ['a1'],
        tonePerspective: 'self',
      },
    )
    expect(p).not.toBeNull()
    expect(p!.tone).toBe('success')
    expect(p!.dedupeKey).toMatch(/^r1-t1-/)
  })

  it('session target controller uses warning tone when hit', () => {
    const p = deriveEncounterToastForViewer(
      [hitEvent('a1', 't1')],
      undefined,
      {
        viewerMode: 'session',
        controlledCombatantIds: ['t1'],
        tonePerspective: 'self',
      },
    )
    expect(p).not.toBeNull()
    expect(p!.tone).toBe('warning')
  })

  it('suppresses uninvolved observer', () => {
    const p = deriveEncounterToastForViewer(
      [hitEvent('a1', 't1')],
      undefined,
      {
        viewerMode: 'session',
        controlledCombatantIds: ['other'],
        tonePerspective: 'observer',
      },
    )
    expect(p).toBeNull()
  })

  it('simulator always uses actor_controller tone path', () => {
    const p = deriveEncounterToastForViewer(
      [hitEvent('a1', 't1')],
      undefined,
      {
        viewerMode: 'simulator',
        controlledCombatantIds: [],
        tonePerspective: 'dm',
      },
    )
    expect(p).not.toBeNull()
    expect(p!.tone).toBe('success')
  })
})
