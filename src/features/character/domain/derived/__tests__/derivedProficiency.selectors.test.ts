import { describe, expect, it } from 'vitest'

import { buildCharacterQueryContext } from '@/features/character/domain/query/buildCharacterQueryContext'
import type { Character } from '@/features/character/domain/types'

import { buildCharacterDerivedContext } from '../buildCharacterDerivedContext'
import { hasEffectiveWeaponProficiency } from '../selectors/proficiency.selectors'

describe('derived proficiency selectors', () => {
  it('returns false when weapon category is not granted', () => {
    const character: Character = {
      name: 'W',
      type: 'pc',
      classes: [{ classId: 'wizard', level: 1 }],
      xp: 0,
      totalLevel: 1,
    }
    const query = buildCharacterQueryContext(character)
    const derived = buildCharacterDerivedContext({ character, query })

    expect(hasEffectiveWeaponProficiency(derived, { id: 'longsword', category: 'martial' })).toBe(false)
  })
})
