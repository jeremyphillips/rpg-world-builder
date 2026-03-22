import { describe, expect, it } from 'vitest'

import { EXTRAPLANAR_CREATURE_TYPES } from '@/features/mechanics/domain/rulesets/system/monsters/extraplanar-creature-types'
import { isImmuneToConditionIncludingScopedGrants } from './condition-immunity-resolution'
import type { CombatantInstance } from './types/combatant.types'

function base(id: string, creatureType?: string): CombatantInstance {
  return {
    instanceId: id,
    side: 'party',
    source: { kind: 'pc', sourceId: id, label: id },
    stats: {
      armorClass: 14,
      maxHitPoints: 20,
      currentHitPoints: 20,
      initiativeModifier: 0,
      dexterityScore: 10,
    },
    attacks: [],
    activeEffects: [],
    runtimeEffects: [],
    turnHooks: [],
    conditions: [],
    states: [],
    ...(creatureType !== undefined ? { creatureType } : {}),
  }
}

describe('isImmuneToConditionIncludingScopedGrants', () => {
  it('blocks charmed from extraplanar source when PfEG-style grant is active', () => {
    const protectedTarget = {
      ...base('ally'),
      activeEffects: [
        {
          kind: 'grant' as const,
          grantType: 'condition-immunity' as const,
          value: 'charmed' as const,
          condition: EXTRAPLANAR_CREATURE_TYPES,
        },
      ],
    }
    const fiend = base('fiend-attacker', 'fiend')
    const humanoid = base('human-attacker', 'humanoid')

    expect(isImmuneToConditionIncludingScopedGrants(protectedTarget, 'charmed', fiend)).toBe(true)
    expect(isImmuneToConditionIncludingScopedGrants(protectedTarget, 'charmed', humanoid)).toBe(false)
  })

  it('still honors flat conditionImmunities without applying source', () => {
    const undead = { ...base('ghoul'), conditionImmunities: ['poisoned' as const] }
    expect(isImmuneToConditionIncludingScopedGrants(undead, 'poisoned', undefined)).toBe(true)
  })
})
