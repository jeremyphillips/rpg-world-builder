import { describe, expect, it } from 'vitest'

import type { CombatActionDefinition } from '@/features/mechanics/domain/encounter/resolution/combat-action.types'

import {
  actionRequiresCreatureTargetForResolve,
  getActionResolutionReadiness,
  getActionResolutionRequirements,
} from '../resolution/action/action-resolution-requirements'

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
})
