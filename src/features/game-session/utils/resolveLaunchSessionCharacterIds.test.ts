import { describe, expect, it } from 'vitest'
import { resolveLaunchSessionCharacterIds } from './resolveLaunchSessionCharacterIds'

describe('resolveLaunchSessionCharacterIds', () => {
  it('returns expected ids whose owners are present (intersection rule)', () => {
    expect(
      resolveLaunchSessionCharacterIds({
        expectedCharacterIds: ['a', 'b', 'c'],
        rosterCharacters: [
          { id: 'a', ownerUserId: 'u1' },
          { id: 'b', ownerUserId: 'u2' },
          { id: 'c', ownerUserId: 'u3' },
        ],
        presentUserIds: ['u1', 'u3'],
      }),
    ).toEqual(['a', 'c'])
  })

  it('preserves roster order', () => {
    expect(
      resolveLaunchSessionCharacterIds({
        expectedCharacterIds: ['b', 'a'],
        rosterCharacters: [
          { id: 'a', ownerUserId: 'u1' },
          { id: 'b', ownerUserId: 'u2' },
        ],
        presentUserIds: ['u1', 'u2'],
      }),
    ).toEqual(['a', 'b'])
  })

  it('returns empty when no overlap between expected and present owners', () => {
    expect(
      resolveLaunchSessionCharacterIds({
        expectedCharacterIds: ['a'],
        rosterCharacters: [{ id: 'a', ownerUserId: 'u1' }],
        presentUserIds: ['u9'],
      }),
    ).toEqual([])
  })

  it('ignores roster entries not in expected set', () => {
    expect(
      resolveLaunchSessionCharacterIds({
        expectedCharacterIds: ['a'],
        rosterCharacters: [
          { id: 'a', ownerUserId: 'u1' },
          { id: 'b', ownerUserId: 'u1' },
        ],
        presentUserIds: ['u1'],
      }),
    ).toEqual(['a'])
  })
})
