import { describe, expect, it } from 'vitest'

import { createSquareGridSpace } from '@/features/encounter/space'

import type { CombatActionDefinition } from '../combat-action.types'
import {
  effectiveSpawnPlacement,
  getActionRequirements,
  getActionSteps,
  validateSingleCellPlacement,
} from './action-requirement-model'

describe('action-requirement-model', () => {
  it('Giant Insect–style action yields caster-option then single-cell steps', () => {
    const action = {
      id: 'x',
      label: 'Giant Insect',
      kind: 'spell',
      cost: { action: true },
      resolutionMode: 'effects',
      targeting: { kind: 'none', rangeFt: 60 },
      casterOptions: [{ kind: 'enum', id: 'form', label: 'Form', options: [{ value: 'a', label: 'A' }] }],
      effects: [
        {
          kind: 'spawn',
          count: 1,
          placement: {
            kind: 'single-cell',
            rangeFromCaster: { value: 60, unit: 'ft' },
            requiresLineOfSight: true,
            mustBeUnoccupied: true,
          },
        },
      ],
    } as CombatActionDefinition

    const reqs = getActionRequirements(action)
    expect(reqs.some((r) => r.kind === 'caster-option')).toBe(true)
    expect(reqs.some((r) => r.kind === 'single-cell-placement')).toBe(true)

    const steps = getActionSteps(reqs)
    expect(steps.map((s) => s.kind)).toEqual(['casterOptions', 'singleCellPlacement'])
  })

  it('effectiveSpawnPlacement infers inherit-from-target from mapMonsterIdFromTargetRemains', () => {
    const ep = effectiveSpawnPlacement({
      kind: 'spawn',
      count: 1,
      mapMonsterIdFromTargetRemains: { corpse: 'zombie', bones: 'skeleton' },
    })
    expect(ep).toEqual({ kind: 'inherit-from-target' })
  })

  it('validateSingleCellPlacement flags out-of-range', () => {
    const space = createSquareGridSpace({ id: 'g', name: 'G', columns: 5, rows: 5, cellFeet: 5 })
    const placements: { cellId: string; combatantId: string }[] = []
    const req = {
      kind: 'single-cell-placement' as const,
      rangeFt: 5,
      lineOfSightRequired: false,
      mustBeUnoccupied: true,
    }
    const r = validateSingleCellPlacement(space, placements, 'c-0-0', 'c-4-4', req)
    expect(r.isValid).toBe(false)
    expect(r.reasons).toContain('out-of-range')
  })
})
