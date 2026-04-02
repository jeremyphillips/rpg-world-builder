import { describe, expect, it } from 'vitest'
import { formatRelativeToScheduled, getLobbyStatusBanner } from './lobbyStatusPresentation'
import type { GameSession } from '../domain/game-session.types'

const base: Omit<GameSession, 'status' | 'scheduledFor'> = {
  id: '1',
  campaignId: 'c',
  dmUserId: 'dm',
  title: 'Test',
  location: {},
  opponentRefKeys: [],
  participants: [],
}

describe('formatRelativeToScheduled', () => {
  it('uses fixed clock for deterministic output', () => {
    const now = new Date('2026-06-01T12:00:00.000Z').getTime()
    const future = '2026-06-01T14:30:00.000Z'
    const s = formatRelativeToScheduled(future, now)
    expect(s).toMatch(/in|minute|hour/i)
  })
})

describe('getLobbyStatusBanner', () => {
  it('keeps scheduled status messaging when planned time has passed (display only)', () => {
    const now = new Date('2026-06-15T18:00:00.000Z').getTime()
    const scheduledFor = '2026-06-15T12:00:00.000Z'
    const banner = getLobbyStatusBanner(
      { ...base, status: 'scheduled', scheduledFor },
      now,
    )
    expect(banner.title).toContain('scheduled')
    expect(banner.body).toMatch(/passed|stays scheduled/i)
  })

  it('does not treat time as opening the lobby — scheduled + future time stays “not open yet”', () => {
    const now = new Date('2026-06-15T12:00:00.000Z').getTime()
    const scheduledFor = '2026-06-16T12:00:00.000Z'
    const banner = getLobbyStatusBanner(
      { ...base, status: 'scheduled', scheduledFor },
      now,
    )
    expect(banner.title).toMatch(/not open yet/i)
    expect(banner.body).toMatch(/stays closed|Open now/i)
  })
})
