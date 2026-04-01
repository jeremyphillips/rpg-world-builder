import { describe, expect, it } from 'vitest'

import { createSquareGridSpace } from '@/features/mechanics/domain/combat/space/creation/createSquareGridSpace'
import type { CombatActionDefinition } from '@/features/mechanics/domain/combat/resolution/combat-action.types'
import { DEFAULT_HIDE_COMBAT_ACTION } from '@/features/mechanics/domain/combat/resolution/combat-action.types'
import { createEncounterState } from '@/features/mechanics/domain/combat/state'

import { testEnemy, testPc } from '@/features/mechanics/domain/combat/tests/encounter-visibility-test-fixtures'
import { asEncounterState } from '@/features/mechanics/domain/combat/tests/encounter-test-state'

import { selectValidActionIdsForTarget } from '@/features/mechanics/domain/combat/selectors/interaction/encounter-resolve-selection'

describe('selectValidActionIdsForTarget', () => {
  it('marks Hide invalid with eligibility reason on open ground', () => {
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
    const availableActions: CombatActionDefinition[] = [{ ...DEFAULT_HIDE_COMBAT_ACTION, id: 'hide' }]
    const { validIds, invalidReasons } = selectValidActionIdsForTarget(
      asEncounterState(encounterState),
      activeCombatant,
      null,
      availableActions,
    )
    expect(validIds.has('hide')).toBe(false)
    expect(invalidReasons.get('hide')).toBe('Need concealment or cover from observers.')
  })

  it('keeps Hide valid when concealment allows hide attempt', () => {
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
    const availableActions: CombatActionDefinition[] = [{ ...DEFAULT_HIDE_COMBAT_ACTION, id: 'hide' }]
    const { validIds, invalidReasons } = selectValidActionIdsForTarget(
      asEncounterState(encounterState),
      activeCombatant,
      null,
      availableActions,
    )
    expect(validIds.has('hide')).toBe(true)
    expect(invalidReasons.has('hide')).toBe(false)
  })
})
