import { describe, expect, it } from 'vitest'

import { EXTRAPLANAR_CREATURE_TYPES } from '@/features/mechanics/domain/rulesets/system/monsters/extraplanar-creature-types'
import type { CombatantInstance, RollModifierMarker } from '../../state/types'
import { resolveRollModifier } from './action-resolver'

function baseCombatant(id: string, label: string, creatureType?: string): CombatantInstance {
  return {
    instanceId: id,
    side: id === 'def' ? 'party' : 'enemies',
    source: { kind: 'monster', sourceId: id, label },
    ...(creatureType !== undefined ? { creatureType } : {}),
    stats: {
      armorClass: 15,
      maxHitPoints: 20,
      currentHitPoints: 20,
      initiativeModifier: 0,
      dexterityScore: 10,
      abilityScores: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
      speeds: { ground: 30 },
    },
    attacks: [],
    activeEffects: [],
    runtimeEffects: [],
    turnHooks: [],
    conditions: [],
    states: [],
  }
}

const pfeMarker: RollModifierMarker = {
  id: 'roll-mod-pfe',
  label: 'disadvantage on incoming-attacks',
  appliesTo: 'incoming-attacks',
  modifier: 'disadvantage',
  condition: EXTRAPLANAR_CREATURE_TYPES,
}

describe('resolveRollModifier', () => {
  it('applies PFE-style disadvantage when extraplanar attacker attacks warded defender', () => {
    const attacker = baseCombatant('atk', 'Imp', 'fiend')
    const defender: CombatantInstance = {
      ...baseCombatant('def', 'Fighter'),
      rollModifiers: [pfeMarker],
    }

    const { rollMod } = resolveRollModifier(attacker, defender, 'melee')
    expect(rollMod).toBe('disadvantage')
  })

  it('does not apply PFE disadvantage when attacker is not an extraplanar type', () => {
    const attacker = baseCombatant('atk', 'Bandit', 'humanoid')
    const defender: CombatantInstance = {
      ...baseCombatant('def', 'Fighter'),
      rollModifiers: [pfeMarker],
    }

    const { rollMod } = resolveRollModifier(attacker, defender, 'melee')
    expect(rollMod).toBe('normal')
  })

  it('matches attack-rolls token with hyphen normalization', () => {
    const attacker: CombatantInstance = {
      ...baseCombatant('atk', 'Hero'),
      rollModifiers: [
        {
          id: 'm1',
          label: 'test',
          appliesTo: 'attack-rolls',
          modifier: 'advantage',
        },
      ],
    }
    const defender = baseCombatant('def', 'Orc')

    const { rollMod } = resolveRollModifier(attacker, defender, 'melee')
    expect(rollMod).toBe('advantage')
  })
})
