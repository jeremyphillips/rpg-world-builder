import { describe, expect, it } from 'vitest'

import { mergeCharacterQueryContexts } from '../mergeCharacterQueryContexts'
import { createEmptyCharacterQueryContext, buildCharacterQueryContext } from '../buildCharacterQueryContext'

describe('mergeCharacterQueryContexts', () => {
  it('returns empty context for no inputs', () => {
    const m = mergeCharacterQueryContexts([])
    expect(m.progression.totalLevel).toBe(0)
    expect(m.inventory.weaponIds.size).toBe(0)
  })

  it('returns the same reference for a single context', () => {
    const a = createEmptyCharacterQueryContext()
    expect(mergeCharacterQueryContexts([a])).toBe(a)
  })

  it('unions inventory and spells, sums wealth, max total level, max per-class level', () => {
    const a = createEmptyCharacterQueryContext()
    a.inventory.weaponIds = new Set(['w1'])
    a.inventory.allEquipmentIds = new Set(['w1'])
    a.progression.totalLevel = 3
    a.progression.classIds = new Set(['fighter'])
    a.progression.classLevelsById = new Map([['fighter', 3]])
    a.spells.knownSpellIds = new Set(['s1'])
    a.economy.totalWealthCp = 100
    a.combat.equippedMainHandWeaponId = 'w1'

    const b = createEmptyCharacterQueryContext()
    b.inventory.weaponIds = new Set(['w2'])
    b.inventory.allEquipmentIds = new Set(['w2'])
    b.progression.totalLevel = 5
    b.progression.classIds = new Set(['wizard'])
    b.progression.classLevelsById = new Map([['wizard', 5]])
    b.spells.knownSpellIds = new Set(['s2'])
    b.economy.totalWealthCp = 50
    b.combat.equippedMainHandWeaponId = 'w2'

    const m = mergeCharacterQueryContexts([a, b])
    expect(m.progression.totalLevel).toBe(5)
    expect(m.progression.classIds.has('fighter')).toBe(true)
    expect(m.progression.classIds.has('wizard')).toBe(true)
    expect(m.inventory.weaponIds.has('w1')).toBe(true)
    expect(m.inventory.weaponIds.has('w2')).toBe(true)
    expect(m.spells.knownSpellIds.has('s1')).toBe(true)
    expect(m.spells.knownSpellIds.has('s2')).toBe(true)
    expect(m.economy.totalWealthCp).toBe(150)
    expect(m.combat.equippedMainHandWeaponId).toBeNull()
  })

  it('merges class levels with max per class id', () => {
    const a = createEmptyCharacterQueryContext()
    a.progression.classLevelsById = new Map([['fighter', 2]])
    const b = createEmptyCharacterQueryContext()
    b.progression.classLevelsById = new Map([['fighter', 5]])
    const m = mergeCharacterQueryContexts([a, b])
    expect(m.progression.classLevelsById.get('fighter')).toBe(5)
  })

  it('preserves combat slots only for single-character merge path', () => {
    const dtoLike = buildCharacterQueryContext({
      name: 'x',
      type: 'pc',
      classes: [{ classId: 'f', level: 1 }],
      xp: 0,
      totalLevel: 1,
      combat: {
        loadout: { mainHandWeaponId: 'axe' },
      },
    })
    expect(mergeCharacterQueryContexts([dtoLike]).combat.equippedMainHandWeaponId).toBe('axe')
  })
})
