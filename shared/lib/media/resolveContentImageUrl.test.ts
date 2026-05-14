import { describe, expect, it } from 'vitest'

import { resolveContentImageUrl } from './resolveContentImageUrl'

describe('resolveContentImageUrl', () => {
  it('returns category fallback when key is empty', () => {
    expect(resolveContentImageUrl('monster', undefined)).toBe('/assets/system/fallbacks/monster.png')
    expect(resolveContentImageUrl('monster', '')).toBe('/assets/system/fallbacks/monster.png')
    expect(resolveContentImageUrl('spell', null)).toBe('/assets/system/fallbacks/spell.png')
  })

  it('returns /assets/... keys unchanged', () => {
    expect(resolveContentImageUrl('gear', '/assets/system/monsters/goblin.png')).toBe(
      '/assets/system/monsters/goblin.png',
    )
  })

  it('prefixes bare storage keys with /uploads/', () => {
    expect(resolveContentImageUrl('armor', 'campaign/foo.png')).toBe('/uploads/campaign/foo.png')
  })
})
