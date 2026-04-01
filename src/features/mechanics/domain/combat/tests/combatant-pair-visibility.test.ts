import { describe, expect, it } from 'vitest'

import { resolveViewerPerceptionForCellFromState } from '@/features/mechanics/domain/perception/perception.resolve'
import { resolveRollModifier } from '@/features/mechanics/domain/combat/resolution/action/action-resolver'
import {
  addConditionToCombatant,
  ATTACK_ROLL_READS_STEALTH_HIDDEN_STATE,
  canPerceiveTargetOccupantForCombat,
  createEncounterState,
  formatStealthRevealHumanReadable,
  resolveCombatantPairVisibilityForAttackRoll,
  type PerceiveTargetOccupantBreakdown,
} from '@/features/mechanics/domain/combat/state'

import {
  encounterAttackerOutsideDefenderHeavilyObscured,
  encounterBlindsightOrdinaryDarkness10ftFromOrc,
  encounterBlindsightOutOfRangeDarknessInDarkvisionRange,
  encounterBlindsightOutOfRangeHeavyObscuredInDarkvisionRange,
  encounterDarknessWizard10ftFromOrc,
  encounterDarknessWizardOutOfDarkvisionRange,
  encounterHeavyObscuredWithBlindsightViewer,
  encounterHeavyObscuredWithDarkvisionViewer,
  encounterMagicalDarknessWithBlindsightViewer,
  encounterMagicalDarknessWithDarkvisionViewer,
  testEnemy,
  testPc,
} from './encounter-visibility-test-fixtures'

function breakdown(p: Partial<PerceiveTargetOccupantBreakdown>): PerceiveTargetOccupantBreakdown {
  return {
    observerCellId: null,
    subjectCellId: null,
    missingCombatant: false,
    intrinsicCanSeeObserver: true,
    targetInvisible: false,
    observerHasSeeInvisibility: false,
    invisibleGateBlocks: false,
    noGridPermissive: false,
    lineOfSightClear: null,
    lineOfEffectClear: null,
    targetCellId: null,
    viewerPerceptionResolved: false,
    canPerceiveCell: null,
    canPerceiveOccupants: null,
    maskedByMagicalDarkness: null,
    maskedByDarkness: null,
    final: true,
    ...p,
  }
}

describe('formatStealthRevealHumanReadable', () => {
  it('uses LOS + occupant wording when grid perception resolves', () => {
    expect(
      formatStealthRevealHumanReadable('Animated Armor', 'Luther Slickfingers', breakdown({
        lineOfSightClear: true,
        lineOfEffectClear: true,
        viewerPerceptionResolved: true,
        targetCellId: 'c-1-1',
        canPerceiveCell: true,
        canPerceiveOccupants: true,
      })),
    ).toBe(
      'Animated Armor now has clear line of sight to Luther Slickfingers and can perceive the occupant.',
    )
  })

  it('uses non-LOS wording when tactical grid is absent (permissive path)', () => {
    expect(
      formatStealthRevealHumanReadable('Wizard', 'Goblin', breakdown({ noGridPermissive: true })),
    ).toBe('Wizard can now perceive Goblin as an occupant and no longer treats them as hidden.')
  })
})

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

  it('darkvision from senses: ordinary darkness mitigated within range (occupant perceivable)', () => {
    const state = encounterDarknessWizard10ftFromOrc()
    expect(canPerceiveTargetOccupantForCombat(state, 'wiz', 'orc')).toBe(true)
  })

  it('darkvision from senses: beyond range ordinary darkness still blocks', () => {
    const state = encounterDarknessWizardOutOfDarkvisionRange()
    expect(canPerceiveTargetOccupantForCombat(state, 'wiz', 'orc')).toBe(false)
  })

  it('darkvision does not mitigate heavy obscurement within range', () => {
    const state = encounterHeavyObscuredWithDarkvisionViewer()
    expect(canPerceiveTargetOccupantForCombat(state, 'wiz', 'orc')).toBe(false)
  })

  it('darkvision does not mitigate magical darkness within range', () => {
    const state = encounterMagicalDarknessWithDarkvisionViewer()
    expect(canPerceiveTargetOccupantForCombat(state, 'wiz', 'orc')).toBe(false)
  })

  it('blindsight from senses: ordinary darkness within range — occupant perceivable', () => {
    const state = encounterBlindsightOrdinaryDarkness10ftFromOrc()
    expect(canPerceiveTargetOccupantForCombat(state, 'wiz', 'orc')).toBe(true)
  })

  it('blindsight: heavy obscurement within range — occupant perceivable', () => {
    const state = encounterHeavyObscuredWithBlindsightViewer()
    expect(canPerceiveTargetOccupantForCombat(state, 'wiz', 'orc')).toBe(true)
  })

  it('blindsight: magical darkness within range — occupant perceivable', () => {
    const state = encounterMagicalDarknessWithBlindsightViewer()
    expect(canPerceiveTargetOccupantForCombat(state, 'wiz', 'orc')).toBe(true)
  })

  it('out of blindsight, in darkvision: ordinary darkness mitigated — occupant perceivable', () => {
    const state = encounterBlindsightOutOfRangeDarknessInDarkvisionRange()
    expect(canPerceiveTargetOccupantForCombat(state, 'wiz', 'orc')).toBe(true)
  })

  it('out of blindsight, in darkvision: heavy obscurement still blocks', () => {
    const state = encounterBlindsightOutOfRangeHeavyObscuredInDarkvisionRange()
    expect(canPerceiveTargetOccupantForCombat(state, 'wiz', 'orc')).toBe(false)
  })

  it('heavy obscurement on defender: outside cannot see in; inside fog cannot see out — attack roll adv/dis cancel', () => {
    const state = encounterAttackerOutsideDefenderHeavilyObscured()
    const cell = resolveViewerPerceptionForCellFromState(state, 'wiz', 'c-2-2', { viewerRole: 'pc' })
    expect(cell?.canPerceiveCell).toBe(true)
    expect(cell?.canPerceiveOccupants).toBe(false)

    expect(canPerceiveTargetOccupantForCombat(state, 'wiz', 'orc')).toBe(false)
    expect(canPerceiveTargetOccupantForCombat(state, 'orc', 'wiz')).toBe(false)

    const pair = resolveCombatantPairVisibilityForAttackRoll(state, 'wiz', 'orc')
    expect(pair.attackerCanSeeDefenderOccupant).toBe(false)
    expect(pair.defenderCanSeeAttackerOccupant).toBe(false)

    const { rollMod, pairVisibility } = resolveRollModifier(
      state.combatantsById.wiz!,
      state.combatantsById.orc!,
      'melee',
      state,
    )
    expect(rollMod).toBe('normal')
    expect(pairVisibility?.attackerCanSeeDefenderOccupant).toBe(false)
    expect(pairVisibility?.defenderCanSeeAttackerOccupant).toBe(false)
  })

  it('attack roll pair visibility ignores stealth hidden state (no double-stacked modifiers)', () => {
    expect(ATTACK_ROLL_READS_STEALTH_HIDDEN_STATE).toBe(false)
    const state = encounterAttackerOutsideDefenderHeavilyObscured()
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
