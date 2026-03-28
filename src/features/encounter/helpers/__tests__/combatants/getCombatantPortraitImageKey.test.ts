import { describe, expect, it } from 'vitest'

import { getCombatantPortraitImageKey } from '../../combatants'

describe('getCombatantPortraitImageKey', () => {
  it('returns character imageKey when present', () => {
    expect(getCombatantPortraitImageKey({ character: { imageKey: 'a.jpg' } })).toBe('a.jpg')
  })

  it('returns monster imageKey when no character', () => {
    expect(getCombatantPortraitImageKey({ monster: { imageKey: 'b.png' } })).toBe('b.png')
  })

  it('prefers character over monster', () => {
    expect(
      getCombatantPortraitImageKey({
        character: { imageKey: 'c.webp' },
        monster: { imageKey: 'd.png' },
      }),
    ).toBe('c.webp')
  })

  it('returns null when empty', () => {
    expect(getCombatantPortraitImageKey({})).toBeNull()
  })
})
