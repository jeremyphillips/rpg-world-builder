import { describe, expect, it } from 'vitest'

import {
  rowSelectionModelToSelectedRowIds,
  selectedRowIdsToRowSelectionModel,
} from '../core/appDataGridRowSelection'

describe('selectedRowIdsToRowSelectionModel / rowSelectionModelToSelectedRowIds', () => {
  it('round-trips include model', () => {
    const ids = ['a', 'b']
    const model = selectedRowIdsToRowSelectionModel(ids)
    expect(model.type).toBe('include')
    expect(rowSelectionModelToSelectedRowIds(model, ['a', 'b', 'c'])).toEqual(['a', 'b'])
  })

  it('exclude model: returns visible ids not in excluded set', () => {
    const model = { type: 'exclude' as const, ids: new Set(['b']) }
    expect(rowSelectionModelToSelectedRowIds(model, ['a', 'b', 'c'])).toEqual(['a', 'c'])
  })
})
