import { describe, expect, it } from 'vitest'

import { getCombatantPreviewCardOpacity, getTurnOrderRowOpacity } from '../presentation-participation'

describe('getCombatantPreviewCardOpacity', () => {
  it('dims further when unseen from active viewer', () => {
    const base = getCombatantPreviewCardOpacity({
      isDefeated: false,
      hasBattlefieldPresence: true,
    })
    const unseen = getCombatantPreviewCardOpacity({
      isDefeated: false,
      hasBattlefieldPresence: true,
      nonVisibleViewerPresentation: true,
    })
    expect(unseen).toBeLessThan(base)
    expect(unseen).toBeGreaterThan(0)
  })
})

describe('getTurnOrderRowOpacity', () => {
  it('dims further when unseen from viewer', () => {
    const base = getTurnOrderRowOpacity({
      status: 'upcoming',
      isBattlefieldAbsent: false,
    })
    const unseen = getTurnOrderRowOpacity({
      status: 'upcoming',
      isBattlefieldAbsent: false,
      nonVisibleViewerPresentation: true,
    })
    expect(unseen).toBeLessThan(base)
  })
})
