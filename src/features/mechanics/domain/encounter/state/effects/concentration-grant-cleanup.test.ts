import { describe, expect, it } from 'vitest'

import type { Effect } from '@/features/mechanics/domain/effects/effects.types'
import { dropConcentration } from './concentration-mutations'
import type { CombatantInstance } from '../types/combatant.types'
import type { EncounterState } from '../types/encounter-state.types'

function minimalCombatant(overrides: Partial<CombatantInstance>): CombatantInstance {
  return {
    instanceId: 'pc-1',
    side: 'party',
    source: { kind: 'pc', sourceId: 'pc-1', label: 'Cleric' },
    stats: {
      armorClass: 18,
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
    ...overrides,
  }
}

describe('dropConcentration removes linked condition-immunity grants', () => {
  it('strips activeEffects whose concentrationLinkId is in linkedMarkerIds (ally target)', () => {
    const grantEffect: Effect = {
      kind: 'grant',
      grantType: 'condition-immunity',
      value: 'charmed',
      concentrationLinkId: 'grant-ci-spell-protection-from-evil-ally-charmed',
    }

    const caster = minimalCombatant({
      instanceId: 'caster',
      concentration: {
        spellId: 'protection-from-evil',
        spellLabel: 'Protection from Evil and Good',
        linkedMarkerIds: ['roll-mod-spell-protection-from-evil-ally', 'grant-ci-spell-protection-from-evil-ally-charmed'],
      },
    })

    const ally = minimalCombatant({
      instanceId: 'ally',
      activeEffects: [grantEffect],
    })

    const state: EncounterState = {
      combatantsById: { caster, ally },
      partyCombatantIds: ['caster', 'ally'],
      enemyCombatantIds: [],
      initiative: [],
      initiativeOrder: ['caster'],
      activeCombatantId: 'caster',
      turnIndex: 0,
      roundNumber: 1,
      started: true,
      log: [],
    }

    const next = dropConcentration(state, 'caster')
    expect(next.combatantsById.ally!.activeEffects).toHaveLength(0)
    expect(next.combatantsById.caster!.concentration).toBeUndefined()
  })
})
