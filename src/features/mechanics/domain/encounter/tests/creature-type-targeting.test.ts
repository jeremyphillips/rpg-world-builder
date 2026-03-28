import { describe, expect, it } from 'vitest'

import { buildSpellCombatActions } from '@/features/encounter/helpers/spells'
import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/rulesets/ids/systemIds'
import { getSystemSpell } from '@/features/mechanics/domain/rulesets/system/spells'
import type { CombatActionDefinition } from '@/features/mechanics/domain/encounter/resolution/combat-action.types'
import { createEncounterState } from '../state'
import { getActionTargetCandidates } from '../resolution/action/action-targeting'
import type { CombatantInstance } from '../state'

function combatant(
  id: string,
  side: 'party' | 'enemies',
  label: string,
  creatureType: string | undefined,
  actions: CombatActionDefinition[],
): CombatantInstance {
  return {
    instanceId: id,
    side,
    source: { kind: side === 'party' ? 'pc' : 'monster', sourceId: id, label },
    creatureType,
    stats: {
      armorClass: 12,
      maxHitPoints: 20,
      currentHitPoints: 20,
      initiativeModifier: 0,
      dexterityScore: 10,
    },
    attacks: [],
    actions,
    activeEffects: [],
    runtimeEffects: [],
    turnHooks: [],
    conditions: [],
    states: [],
  }
}

describe('creatureTypeFilter — engine wiring', () => {
  it('system Charm Person spell yields humanoid filter on built combat action', () => {
    const spell = getSystemSpell(DEFAULT_SYSTEM_RULESET_ID, 'charm-person')
    expect(spell).toBeDefined()
    const actions = buildSpellCombatActions({
      runtimeId: 'pc-1',
      spellIds: ['charm-person'],
      spellsById: { 'charm-person': spell! },
      spellSaveDc: 13,
      spellAttackBonus: 5,
      casterLevel: 1,
    })
    expect(actions[0]?.targeting?.creatureTypeFilter).toEqual(['humanoid'])
  })

  it('getActionTargetCandidates excludes non-matching creature types for hostile single-target', () => {
    const spell = getSystemSpell(DEFAULT_SYSTEM_RULESET_ID, 'charm-person')!
    const charm = buildSpellCombatActions({
      runtimeId: 'pc-1',
      spellIds: ['charm-person'],
      spellsById: { 'charm-person': spell },
      spellSaveDc: 13,
      spellAttackBonus: 5,
      casterLevel: 1,
    })[0]!

    const wizard = combatant('w', 'party', 'Wizard', 'humanoid', [charm])
    const goblin = combatant('g', 'enemies', 'Goblin', 'humanoid', [])
    const wolf = combatant('wolf', 'enemies', 'Wolf', 'beast', [])

    const state = createEncounterState([wizard, goblin, wolf], { rng: () => 0.5 })
    const candidates = getActionTargetCandidates(state, wizard, charm)

    expect(candidates.map((c) => c.instanceId)).toContain('g')
    expect(candidates.map((c) => c.instanceId)).not.toContain('wolf')
  })
})
