import { describe, expect, it } from 'vitest';

import { mapSelectionEqual, selectedCellIdForMapSelection } from './locationEditorRail.types';

describe('mapSelectionEqual', () => {
  it('returns true for equivalent selections', () => {
    expect(
      mapSelectionEqual({ type: 'path', pathId: 'a' }, { type: 'path', pathId: 'a' }),
    ).toBe(true);
  });

  it('returns false when selections differ', () => {
    expect(
      mapSelectionEqual({ type: 'path', pathId: 'a' }, { type: 'path', pathId: 'b' }),
    ).toBe(false);
  });
});

describe('selectedCellIdForMapSelection', () => {
  it('returns cell id for cell and object selections', () => {
    expect(selectedCellIdForMapSelection({ type: 'cell', cellId: '1,2' })).toBe('1,2');
    expect(
      selectedCellIdForMapSelection({ type: 'object', cellId: '0,0', objectId: 'o1' }),
    ).toBe('0,0');
  });

  it('returns null when no cell should get selected-cell chrome', () => {
    expect(selectedCellIdForMapSelection({ type: 'none' })).toBeNull();
    expect(selectedCellIdForMapSelection({ type: 'region', regionId: 'r1' })).toBeNull();
    expect(selectedCellIdForMapSelection({ type: 'path', pathId: 'p1' })).toBeNull();
    expect(selectedCellIdForMapSelection({ type: 'edge', edgeId: 'e1' })).toBeNull();
    expect(
      selectedCellIdForMapSelection({
        type: 'edge-run',
        kind: 'wall',
        edgeIds: ['a-b'],
        axis: 'horizontal',
        anchorEdgeId: 'a-b',
      }),
    ).toBeNull();
  });
});
