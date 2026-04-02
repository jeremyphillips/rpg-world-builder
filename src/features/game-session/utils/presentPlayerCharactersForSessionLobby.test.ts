import { describe, expect, it } from 'vitest'
import type { CharacterRosterSummary } from '@/features/character/read-model'
import type { GameSession } from '../domain/game-session.types'
import {
  getPresentPlayerCharacterIdsForSessionLobby,
  isPlayerCharacterForSessionLobby,
} from './presentPlayerCharactersForSessionLobby'

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

function roster(
  id: string,
  ownerUserId: string,
  type: 'pc' | 'npc' | undefined,
): CharacterRosterSummary {
  return {
    id,
    name: 'Hero',
    type,
    imageUrl: null,
    race: { id: 'r', name: 'Human' },
    classes: [{ classId: 'x', className: 'Fighter', level: 1 }],
    campaign: { id: 'c1', name: 'Camp' },
    status: 'approved',
    ownerUserId,
    ownerName: 'player',
  }
}

describe('isPlayerCharacterForSessionLobby', () => {
  it('treats npc rows as non-player', () => {
    expect(isPlayerCharacterForSessionLobby(roster('a', 'u1', 'npc'))).toBe(false)
  })
  it('treats pc and undefined type as player', () => {
    expect(isPlayerCharacterForSessionLobby(roster('a', 'u1', 'pc'))).toBe(true)
    expect(isPlayerCharacterForSessionLobby(roster('a', 'u1', undefined))).toBe(true)
  })
})

describe('getPresentPlayerCharacterIdsForSessionLobby', () => {
  it('counts only expected PCs whose owners are present', () => {
    const chars = [roster('p1', 'u1', 'pc'), roster('n1', 'dm', 'npc'), roster('p2', 'u2', 'pc')]
    const present = new Set(['u1'])
    expect(getPresentPlayerCharacterIdsForSessionLobby(session, chars, present)).toEqual(['p1'])
  })

  it('does not count NPC row even if owner is present', () => {
    const chars = [roster('n1', 'dm', 'npc')]
    const present = new Set(['dm'])
    expect(getPresentPlayerCharacterIdsForSessionLobby(session, chars, present)).toEqual([])
  })
})
