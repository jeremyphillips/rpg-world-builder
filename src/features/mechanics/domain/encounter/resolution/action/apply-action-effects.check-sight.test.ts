import { describe, expect, it } from 'vitest'

import { EXTRAPLANAR_CREATURE_TYPES } from '@/features/mechanics/domain/rulesets/system/monsters/extraplanar-creature-types'
import { applyActionEffects } from './action-effects'
import type { CombatActionDefinition } from '../combat-action.types'
import { addConditionToCombatant, createEncounterState } from '../../state'
import { createSquareGridSpace } from '@/features/encounter/space/createSquareGridSpace'
import {
  encounterAttackerOutsideDefenderHeavilyObscured,
  encounterAttackerOutsideDefenderMagicalDarknessCell,
  testEnemy,
  testPc,
} from '../../tests/encounter-visibility-test-fixtures'

function baseCheckAction(requiresSight: boolean | undefined): CombatActionDefinition {
  return {
    id: 'test-check',
    label: 'Test Check',
    kind: 'spell',
    cost: { action: true },
    resolutionMode: 'effects',
    displayMeta: {
      source: 'spell',
      spellId: 'test',
      level: 0,
      range: '30 feet',
    },
    effects: [
      {
        kind: 'check',
        actor: 'nearby-creature',
        distanceFeet: 5,
        actionRequired: true,
        target: 'creature-inside',
        ...(requiresSight !== undefined ? { requiresSight } : {}),
        check: {
          ability: 'wis',
          skill: 'perception',
          dc: 15,
        },
      },
    ],
  }
}

describe('applyActionEffects — check requiresSight', () => {
  it('allows requiresSight when subject occupant is visually perceivable (grid)', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const w = testPc('w', 'Wizard', 20)
    const o = testEnemy('o', 'Orc', 20)
    const state = {
      ...createEncounterState([w, o], { rng: () => 0.5, space }),
      placements: [
        { combatantId: 'w', cellId: 'c-0-0' },
        { combatantId: 'o', cellId: 'c-1-0' },
      ],
    }
    const action = baseCheckAction(true)
    const result = applyActionEffects(state, w, o, action, action.effects, { rng: () => 0.5, sourceLabel: action.label })
    const last = result.state.log[result.state.log.length - 1]
    expect(last?.summary).toContain('Check DC 15')
    expect(last?.summary).not.toContain('blocked')
  })

  it('denies requiresSight when occupant not perceivable (heavy obscurement)', () => {
    const state = encounterAttackerOutsideDefenderHeavilyObscured()
    const w = state.combatantsById.wiz!
    const orc = state.combatantsById.orc!
    const action = baseCheckAction(true)
    const result = applyActionEffects(state, w, orc, action, action.effects, { rng: () => 0.5, sourceLabel: action.label })
    const last = result.state.log[result.state.log.length - 1]
    expect(last?.summary).toContain('blocked (cannot-perceive-subject)')
    expect(last?.details).toContain('cannot-perceive-subject')
  })

  it('denies requiresSight in magical darkness cell when occupant not perceivable', () => {
    const state = encounterAttackerOutsideDefenderMagicalDarknessCell()
    const w = state.combatantsById.wiz!
    const orc = state.combatantsById.orc!
    const action = baseCheckAction(true)
    const result = applyActionEffects(state, w, orc, action, action.effects, { rng: () => 0.5, sourceLabel: action.label })
    const last = result.state.log[result.state.log.length - 1]
    expect(last?.summary).toContain('blocked (cannot-perceive-subject)')
  })

  it('denies requiresSight when actor is blinded', () => {
    const w = testPc('wiz', 'Wizard', 20)
    const o = testEnemy('orc', 'Orc', 20)
    const blind = addConditionToCombatant(createEncounterState([w, o], { rng: () => 0.5 }), 'wiz', 'blinded')
    const wBlind = blind.combatantsById.wiz!
    const orc = blind.combatantsById.orc!
    const action = baseCheckAction(true)
    const result = applyActionEffects(blind, wBlind, orc, action, action.effects, { rng: () => 0.5, sourceLabel: action.label })
    const last = result.state.log[result.state.log.length - 1]
    expect(last?.summary).toContain('blocked (cannot-perceive-subject)')
  })

  it('non-sight checks without requiresSight still log DC (unaffected by obscurement)', () => {
    const state = encounterAttackerOutsideDefenderHeavilyObscured()
    const w = state.combatantsById.wiz!
    const orc = state.combatantsById.orc!
    const action = baseCheckAction(undefined)
    const result = applyActionEffects(state, w, orc, action, action.effects, { rng: () => 0.5, sourceLabel: action.label })
    const last = result.state.log[result.state.log.length - 1]
    expect(last?.summary).toContain('Check DC 15')
    expect(last?.summary).not.toContain('blocked')
  })

  it('matches shared seam permissive fallback when no tactical grid', () => {
    const w = testPc('w', 'Wizard', 20)
    const o = testEnemy('o', 'Orc', 20)
    const noGrid = createEncounterState([w, o], { rng: () => 0.5 })
    const action = baseCheckAction(true)
    const result = applyActionEffects(noGrid, w, o, action, action.effects, { rng: () => 0.5, sourceLabel: action.label })
    const last = result.state.log[result.state.log.length - 1]
    expect(last?.summary).toContain('Check DC 15')
    expect(last?.summary).not.toContain('blocked')
  })

  it('non-check effects are unchanged (control)', () => {
    const state = encounterAttackerOutsideDefenderHeavilyObscured()
    const w = state.combatantsById.wiz!
    const orc = state.combatantsById.orc!
    const action: CombatActionDefinition = {
      id: 'grant',
      label: 'Grant',
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
    const result = applyActionEffects(state, w, orc, action, action.effects, { rng: () => 0.5, sourceLabel: action.label })
    expect(result.state.combatantsById.orc?.activeEffects).toHaveLength(1)
  })
})
