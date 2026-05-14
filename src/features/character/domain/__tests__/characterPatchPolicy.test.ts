import { describe, expect, it } from 'vitest'

import { narrowCharacterPatchForOwner } from '@/features/character/domain/characterPatchPolicy'

describe('narrowCharacterPatchForOwner', () => {
  it('passes proficiencies, xp, equipment, alignment, and wealth for owners', () => {
    const proficiencies = {
      skills: { religion: 'proficient' as const, intimidation: 'proficient' as const },
    }
    const out = narrowCharacterPatchForOwner(
      {
        proficiencies,
        xp: 1200,
        equipment: { armor: ['leather-armor'], weapons: [], gear: [] },
        alignment: 'lg',
        wealth: { gp: 10, sp: 0, cp: 0 },
      },
      false,
    )
    expect(out.proficiencies).toEqual(proficiencies)
    expect(out.xp).toBe(1200)
    expect(out.equipment).toEqual({ armor: ['leather-armor'], weapons: [], gear: [] })
    expect(out.alignment).toBe('lg')
    expect(out.wealth).toEqual({ gp: 10, sp: 0, cp: 0 })
  })

  it('does not pass totalLevel while level-up is not pending', () => {
    const out = narrowCharacterPatchForOwner({ totalLevel: 5, xp: 100 }, false)
    expect(out.totalLevel).toBeUndefined()
    expect(out.xp).toBe(100)
  })

  it('passes level-up fields when pending', () => {
    const out = narrowCharacterPatchForOwner(
      {
        totalLevel: 5,
        classes: [{ classId: 'fighter', level: 5 }],
        hitPoints: { total: 42 },
        subclassId: 'champion',
        xp: 50,
      },
      true,
    )
    expect(out.totalLevel).toBe(5)
    expect(out.classes).toEqual([{ classId: 'fighter', level: 5 }])
    expect(out.hitPoints).toEqual({ total: 42 })
    expect(out.subclassId).toBe('champion')
    expect(out.xp).toBe(50)
  })
})
