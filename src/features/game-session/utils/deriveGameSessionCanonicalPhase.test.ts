import { describe, expect, it } from 'vitest'

import { deriveGameSessionCanonicalPhase } from './deriveGameSessionCanonicalPhase'
import type { GameSession } from '../domain/game-session.types'

function session(overrides: Partial<GameSession>): GameSession {
  return {
    id: 'gs1',
    campaignId: 'c1',
    dmUserId: 'dm',
    status: 'lobby',
    title: 'T',
    scheduledFor: null,
    location: { locationId: null, buildingId: null, floorId: null, label: null },
    participants: [],
    opponentRefKeys: [],
    activeEncounterId: null,
    createdAt: '',
    updatedAt: '',
    ...overrides,
  }
}

describe('deriveGameSessionCanonicalPhase', () => {
  it('play when active and encounter linked', () => {
    expect(
      deriveGameSessionCanonicalPhase(
        session({ status: 'active', activeEncounterId: 'combat-1' }),
      ),
    ).toBe('play')
  })

  it('lobby when active but no encounter', () => {
    expect(deriveGameSessionCanonicalPhase(session({ status: 'active', activeEncounterId: null }))).toBe(
      'lobby',
    )
  })

  it('lobby when lobby status', () => {
    expect(deriveGameSessionCanonicalPhase(session({ status: 'lobby' }))).toBe('lobby')
  })
})
