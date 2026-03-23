import { describe, expect, it } from 'vitest'

import { EXTRAPLANAR_CREATURE_TYPES } from '@/features/mechanics/domain/rulesets/system/monsters/extraplanar-creature-types'
import { applyActionEffects } from './action-effects'
import type { CombatActionDefinition } from '../combat-action.types'
import type { EncounterState } from '../../state/types'
import { deriveRuntimeEffects } from '../../state/shared'
import { collectPresentableEffects } from '@/features/encounter/domain'

function minimalEncounter(actor: EncounterState['combatantsById'][string], target: EncounterState['combatantsById'][string]): EncounterState {
  return {
    combatantsById: { [actor.instanceId]: actor, [target.instanceId]: target },
    partyCombatantIds: actor.side === 'party' ? [actor.instanceId] : [target.instanceId],
    enemyCombatantIds: actor.side === 'enemies' ? [actor.instanceId] : [target.instanceId],
    initiative: [],
    initiativeOrder: [actor.instanceId, target.instanceId],
    activeCombatantId: actor.instanceId,
    turnIndex: 0,
    roundNumber: 1,
    started: true,
    log: [],
  }
}

describe('applyActionEffects — condition-immunity grant', () => {
  it('appends grant to target activeEffects with spell turn duration', () => {
    const actor = {
      instanceId: 'caster',
      side: 'party' as const,
      source: { kind: 'pc' as const, sourceId: 'c1', label: 'Cleric' },
      stats: {
        armorClass: 18,
        maxHitPoints: 20,
        currentHitPoints: 20,
        initiativeModifier: 1,
        dexterityScore: 10,
      },
      attacks: [],
      activeEffects: [],
      runtimeEffects: [],
      turnHooks: [],
      conditions: [],
      states: [],
    }
    const target = {
      instanceId: 'ally',
      side: 'party' as const,
      source: { kind: 'pc' as const, sourceId: 'c2', label: 'Fighter' },
      stats: {
        armorClass: 16,
        maxHitPoints: 30,
        currentHitPoints: 30,
        initiativeModifier: 0,
        dexterityScore: 12,
      },
      attacks: [],
      activeEffects: [],
      runtimeEffects: [],
      turnHooks: [],
      conditions: [],
      states: [],
    }

    const action: CombatActionDefinition = {
      id: 'spell-protection-from-evil',
      label: 'Protection from Evil and Good',
      kind: 'spell',
      cost: { action: true },
      resolutionMode: 'effects',
      displayMeta: {
        source: 'spell',
        spellId: 'protection-from-evil',
        level: 1,
        concentration: true,
        concentrationDurationTurns: 100,
        range: 'Touch',
      },
      effects: [
        {
          kind: 'grant',
          grantType: 'condition-immunity',
          value: 'charmed',
          condition: EXTRAPLANAR_CREATURE_TYPES,
          text: 'Also immune to possession from these creature types.',
        },
      ],
    }

    const state = minimalEncounter(actor, target)
    const result = applyActionEffects(
      state,
      actor,
      target,
      action,
      action.effects,
      { rng: () => 0.5, sourceLabel: action.label },
    )

    expect(result.createdMarkerIds).toContain('grant-ci-spell-protection-from-evil-ally-charmed')

    const updated = result.state.combatantsById.ally!
    expect(updated.activeEffects).toHaveLength(1)
    const g = updated.activeEffects[0]!
    if (g.kind !== 'grant') {
      throw new Error('expected grant effect')
    }
    expect(g.grantType).toBe('condition-immunity')
    if (g.grantType === 'condition-immunity') {
      expect(g.value).toBe('charmed')
      expect(g.duration).toEqual({ kind: 'fixed', value: 100, unit: 'turn' })
      expect(g.concentrationLinkId).toBe('grant-ci-spell-protection-from-evil-ally-charmed')
    }

    expect(deriveRuntimeEffects(updated)).toHaveLength(0)

    const presentable = collectPresentableEffects(updated)
    expect(presentable.some((e) => e.key === 'defense-condition-charmed')).toBe(true)
  })
})
