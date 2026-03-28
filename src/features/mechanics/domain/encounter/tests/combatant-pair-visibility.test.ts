import { describe, expect, it } from 'vitest'

import { resolveViewerPerceptionForCellFromState } from '@/features/mechanics/domain/encounter/environment/perception.resolve'
import { resolveRollModifier } from '@/features/mechanics/domain/encounter/resolution/action/action-resolver'
import {
  addConditionToCombatant,
  ATTACK_ROLL_READS_STEALTH_HIDDEN_STATE,
  canPerceiveTargetOccupantForCombat,
  createEncounterState,
  resolveCombatantPairVisibilityForAttackRoll,
} from '@/features/mechanics/domain/encounter/state'

import {
  encounterAttackerOutsideDefenderHeavilyObscured,
  testEnemy,
  testPc,
} from './encounter-visibility-test-fixtures'

describe('combatant pair visibility (occupant)', () => {
  it('uses permissive occupant visibility when space/placements are missing (after condition gates)', () => {
    const w = testPc('w', 'Wizard', 20)
    const g = testEnemy('g', 'Goblin', 10)
    const noGrid = createEncounterState([w, g], { rng: () => 0.5 })
    expect(noGrid.space).toBeUndefined()
    expect(canPerceiveTargetOccupantForCombat(noGrid, 'w', 'g')).toBe(true)
  })

  it('still blocks invisible target when no grid (does not use permissive before invisible check)', () => {
    const w = testPc('w', 'Wizard', 20)
    const g = testEnemy('g', 'Goblin', 10)
    const state = addConditionToCombatant(createEncounterState([w, g], { rng: () => 0.5 }), 'g', 'invisible')
    expect(state.space).toBeUndefined()
    expect(canPerceiveTargetOccupantForCombat(state, 'w', 'g')).toBe(false)
  })

  it('heavy obscurement on defender: perceives cell but not occupant; unseen-target disadvantage on attack roll', () => {
    const state = encounterAttackerOutsideDefenderHeavilyObscured()
    const cell = resolveViewerPerceptionForCellFromState(state, 'wiz', 'c-2-2', { viewerRole: 'pc' })
    expect(cell?.canPerceiveCell).toBe(true)
    expect(cell?.canPerceiveOccupants).toBe(false)

    expect(canPerceiveTargetOccupantForCombat(state, 'wiz', 'orc')).toBe(false)
    expect(canPerceiveTargetOccupantForCombat(state, 'orc', 'wiz')).toBe(true)

    const pair = resolveCombatantPairVisibilityForAttackRoll(state, 'wiz', 'orc')
    expect(pair.attackerCanSeeDefenderOccupant).toBe(false)
    expect(pair.defenderCanSeeAttackerOccupant).toBe(true)

    const { rollMod, pairVisibility } = resolveRollModifier(
      state.combatantsById.wiz!,
      state.combatantsById.orc!,
      'melee',
      state,
    )
    expect(rollMod).toBe('disadvantage')
    expect(pairVisibility?.attackerCanSeeDefenderOccupant).toBe(false)
    expect(pairVisibility?.defenderCanSeeAttackerOccupant).toBe(true)
  })

  it('attack roll pair visibility ignores stealth hidden state (no double-stacked modifiers)', () => {
    expect(ATTACK_ROLL_READS_STEALTH_HIDDEN_STATE).toBe(false)
    const state = encounterAttackerOutsideDefenderHeavilyObscured()
    const wiz = state.combatantsById.wiz!
    const orc = state.combatantsById.orc!
    const orcWithStealth: typeof orc = {
      ...orc,
      stealth: { hiddenFromObserverIds: ['wiz'] },
    }
    const withStealth: typeof state = {
      ...state,
      combatantsById: { ...state.combatantsById, orc: orcWithStealth },
    }
    const basePair = resolveCombatantPairVisibilityForAttackRoll(state, 'wiz', 'orc')
    const withHiddenPair = resolveCombatantPairVisibilityForAttackRoll(withStealth, 'wiz', 'orc')
    expect(withHiddenPair).toEqual(basePair)
  })
})
