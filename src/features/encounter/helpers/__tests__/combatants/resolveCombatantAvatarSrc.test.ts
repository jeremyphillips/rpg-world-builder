import { describe, expect, it } from 'vitest'

import type { Monster } from '@/features/content/monsters/domain/types'
import type { CombatantInstance } from '@/features/mechanics/domain/encounter'

import {
  resolveCombatantAvatarSrc,
  type CombatantAvatarResolutionContext,
} from './resolveCombatantAvatarSrc'

function minimalCombatant(
  source: CombatantInstance['source'],
): CombatantInstance {
  return {
    instanceId: 'i1',
    source,
    side: 'enemies',
    stats: {
      armorClass: 10,
      maxHitPoints: 10,
      currentHitPoints: 10,
      initiativeModifier: 0,
    },
    actions: [],
  } as unknown as CombatantInstance
}

const emptyCtx: CombatantAvatarResolutionContext = {
  monstersById: {},
  characterPortraitById: {},
}

describe('resolveCombatantAvatarSrc', () => {
  it('resolves monster from catalog imageKey', () => {
    const m = { id: 'goblin', imageKey: '/assets/system/monsters/goblin.png' } as Monster
    const combatant = minimalCombatant({
      kind: 'monster',
      sourceId: 'goblin',
      label: 'Goblin',
    })
    expect(
      resolveCombatantAvatarSrc(combatant, { monstersById: { goblin: m }, characterPortraitById: {} }),
    ).toBe('/assets/system/monsters/goblin.png')
  })

  it('resolves pc from characterPortraitById', () => {
    const combatant = minimalCombatant({
      kind: 'pc',
      sourceId: 'char-1',
      label: 'Hero',
    })
    expect(
      resolveCombatantAvatarSrc(combatant, {
        monstersById: {},
        characterPortraitById: { 'char-1': { imageKey: 'abc.jpg' } },
      }),
    ).toBe('/uploads/abc.jpg')
  })

  it('prefers portraitImageKey on combatant instance when set', () => {
    const combatant = minimalCombatant({
      kind: 'monster',
      sourceId: 'goblin',
      label: 'Goblin',
    })
    ;(combatant as { portraitImageKey?: string | null }).portraitImageKey = '/assets/x.png'
    expect(
      resolveCombatantAvatarSrc(combatant, {
        monstersById: {},
        characterPortraitById: {},
      }),
    ).toBe('/assets/x.png')
  })

  it('prefers portraitOverride when it resolves', () => {
    const combatant = minimalCombatant({
      kind: 'pc',
      sourceId: 'char-1',
      label: 'Hero',
    })
    expect(
      resolveCombatantAvatarSrc(
        combatant,
        {
          monstersById: {},
          characterPortraitById: { 'char-1': { imageKey: 'old.jpg' } },
        },
        { imageKey: 'new.jpg' },
      ),
    ).toBe('/uploads/new.jpg')
  })

  it('falls back to roster when override does not resolve', () => {
    const combatant = minimalCombatant({
      kind: 'pc',
      sourceId: 'char-1',
      label: 'Hero',
    })
    expect(
      resolveCombatantAvatarSrc(
        combatant,
        {
          monstersById: {},
          characterPortraitById: { 'char-1': { imageKey: 'roster.jpg' } },
        },
        { imageKey: null, imageUrl: null },
      ),
    ).toBe('/uploads/roster.jpg')
  })

  it('returns undefined when nothing matches', () => {
    const combatant = minimalCombatant({
      kind: 'monster',
      sourceId: 'missing',
      label: 'X',
    })
    expect(resolveCombatantAvatarSrc(combatant, emptyCtx)).toBeUndefined()
  })
})
