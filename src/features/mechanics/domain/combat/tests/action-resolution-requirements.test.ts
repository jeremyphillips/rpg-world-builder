import { describe, expect, it } from 'vitest'

import type { CombatActionDefinition } from '@/features/mechanics/domain/combat/resolution/combat-action.types'

import { createSquareGridSpace } from '@/features/mechanics/domain/combat/space/creation/createSquareGridSpace'
import { createEncounterState } from '../state'
import { asEncounterState } from '@/features/mechanics/domain/combat/tests/encounter-test-state'
import {
  actionRequiresCreatureTargetForResolve,
  getActionResolutionReadiness,
  getActionResolutionRequirements,
} from '../resolution/action/action-resolution-requirements'
import { testEnemy, testPc } from './encounter-visibility-test-fixtures'

function baseAction(overrides: Partial<CombatActionDefinition> = {}): CombatActionDefinition {
  return {
    id: 'x',
    label: 'X',
    kind: 'spell',
    cost: { action: true },
    resolutionMode: 'effects',
    ...overrides,
  } as CombatActionDefinition
}

const emptyCtx = {
  selectedActionTargetId: '',
  aoeStep: 'none' as const,
  aoeOriginCellId: null,
  selectedCasterOptions: {},
  selectedObjectAnchorId: null as string | null,
  encounterState: undefined,
  activeCombatant: undefined,
}

describe('action-resolution-requirements', () => {
  it('single-target requires creature target', () => {
    const a = baseAction({ targeting: { kind: 'single-target', rangeFt: 5 } })
    expect(actionRequiresCreatureTargetForResolve(a)).toBe(true)
    expect(getActionResolutionRequirements(a)).toEqual(['creature-target'])
  })

  it('targeting none with spawn does not require creature target', () => {
    const a = baseAction({
      targeting: { kind: 'none' },
      casterOptions: [{ kind: 'enum', id: 'form', label: 'Form', options: [{ value: 'a', label: 'A' }] }],
      effects: [{ kind: 'spawn', count: 1 }],
    })
    expect(actionRequiresCreatureTargetForResolve(a)).toBe(false)
    expect(getActionResolutionRequirements(a)).toEqual(['caster-option', 'single-cell-placement'])
  })

  it('spawn readiness: missing caster then placement', () => {
    const a = baseAction({
      targeting: { kind: 'none' },
      casterOptions: [{ kind: 'enum', id: 'form', label: 'Form', options: [{ value: 'a', label: 'A' }] }],
      effects: [{ kind: 'spawn', count: 1 }],
    })
    const r1 = getActionResolutionReadiness(a, emptyCtx)
    expect(r1.canResolve).toBe(false)
    expect(r1.missingRequirements[0]?.kind).toBe('caster-option')

    const r2 = getActionResolutionReadiness(a, {
      ...emptyCtx,
      selectedCasterOptions: { form: 'a' },
    })
    expect(r2.canResolve).toBe(false)
    expect(r2.missingRequirements[0]?.kind).toBe('single-cell-placement')
  })

  it('area grid action requires area-selection only in requirements list', () => {
    const a = baseAction({
      targeting: { kind: 'all-enemies', rangeFt: 150 },
      areaTemplate: { kind: 'sphere', radiusFt: 20 },
    })
    expect(getActionResolutionRequirements(a)).toEqual(['area-selection'])
  })

  it('hide action: readiness false when getHideActionUnavailableReason applies (open ground)', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const w = testPc('wiz', 'Wizard', 20)
    const o = testEnemy('orc', 'Orc', 20)
    const base = createEncounterState([w, o], { rng: () => 0.5, space })
    const encounterState = {
      ...base,
      placements: [
        { combatantId: 'wiz', cellId: 'c-0-0' },
        { combatantId: 'orc', cellId: 'c-1-0' },
      ],
    }
    const activeCombatant = encounterState.combatantsById.orc!
    const hideAction = baseAction({
      id: 'hide',
      kind: 'combat-effect',
      resolutionMode: 'hide',
      targeting: { kind: 'self' },
    })
    const r = getActionResolutionReadiness(hideAction, {
      ...emptyCtx,
      encounterState,
      activeCombatant,
    })
    expect(r.canResolve).toBe(false)
    expect(r.missingRequirements.some((m) => m.kind === 'hide-eligibility')).toBe(true)
  })

  it('hide action: readiness true when concealment allows hide attempt', () => {
    const space = createSquareGridSpace({ id: 'm', name: 'M', columns: 8, rows: 8 })
    const w = testPc('wiz', 'Wizard', 20)
    const o = testEnemy('orc', 'Orc', 20)
    const base = createEncounterState([w, o], { rng: () => 0.5, space })
    const encounterState = {
      ...base,
      placements: [
        { combatantId: 'wiz', cellId: 'c-0-0' },
        { combatantId: 'orc', cellId: 'c-2-2' },
      ],
      environmentZones: [
        {
          id: 'z-heavy',
          kind: 'patch',
          sourceKind: 'manual',
          area: { kind: 'grid-cell-ids', cellIds: ['c-2-2'] },
          overrides: { visibilityObscured: 'heavy' },
        },
      ],
    }
    const activeCombatant = encounterState.combatantsById.orc!
    const hideAction = baseAction({
      id: 'hide',
      kind: 'combat-effect',
      resolutionMode: 'hide',
      targeting: { kind: 'self' },
    })
    const r = getActionResolutionReadiness(hideAction, {
      ...emptyCtx,
      encounterState: asEncounterState(encounterState),
      activeCombatant,
    })
    expect(r.missingRequirements.filter((m) => m.kind === 'hide-eligibility')).toHaveLength(0)
    expect(r.canResolve).toBe(true)
  })
})
