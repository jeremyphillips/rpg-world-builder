import { describe, expect, it } from 'vitest'

import { buildResolveActionIntentFromActiveSelection } from './build-resolve-action-intent'

describe('buildResolveActionIntentFromActiveSelection', () => {
  it('maps hook fields to ResolveActionIntent', () => {
    const intent = buildResolveActionIntentFromActiveSelection({
      activeCombatantId: 'a1',
      selectedActionId: 'fireball',
      selectedActionTargetId: '',
      selectedCasterOptions: { slot: '3' },
      aoeOriginCellId: 'c-2-2',
      selectedSingleCellPlacementCellId: null,
      unaffectedCombatantIds: ['x'],
      selectedObjectAnchorId: '  obs1  ',
      selectedDoorCellIdA: null,
      selectedDoorCellIdB: null,
    })
    expect(intent).toEqual({
      kind: 'resolve-action',
      actorId: 'a1',
      actionId: 'fireball',
      casterOptions: { slot: '3' },
      aoeOriginCellId: 'c-2-2',
      unaffectedCombatantIds: ['x'],
      objectId: 'obs1',
    })
    expect(intent.targetId).toBeUndefined()
    expect(intent.singleCellPlacementCellId).toBeUndefined()
  })
})
