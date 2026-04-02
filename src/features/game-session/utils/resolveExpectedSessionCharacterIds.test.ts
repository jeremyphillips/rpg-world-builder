import { describe, expect, it } from 'vitest'
import { resolveExpectedSessionCharacterIds } from './resolveExpectedSessionCharacterIds'
import type { CharacterRosterSummary } from '@/features/character/read-model'
import type { GameSession } from '../domain/game-session.types'

const session: GameSession = {
  id: 'gs1',
  campaignId: 'c1',
  status: 'lobby',
  dmUserId: 'dm',
  title: 'S',
  scheduledFor: null,
  location: {},
  opponentRefKeys: [],
  participants: [],
}

function roster(id: string, ownerUserId: string): CharacterRosterSummary {
  return {
    id,
    name: 'Hero',
    imageUrl: null,
    race: { id: 'r', name: 'Human' },
    classes: [{ classId: 'x', className: 'Fighter', level: 1 }],
    campaign: { id: 'c1', name: 'Camp' },
    status: 'approved',
    ownerUserId,
    ownerName: 'player',
  }
}

describe('resolveExpectedSessionCharacterIds', () => {
  it('returns all campaign character ids for now (temporary seam)', () => {
    const chars = [roster('a', 'u1'), roster('b', 'u2')]
    expect(resolveExpectedSessionCharacterIds(session, chars)).toEqual(['a', 'b'])
  })
})
