import { describe, expect, it } from 'vitest';

import {
  edgeEntriesToSegmentGeometrySquare,
  normalizeLocationMapAuthoringFields,
  pathEntriesToPolylineGeometry,
} from '@/shared/domain/locations';

import { cellDraftToCellEntries, cellEntriesToDraft } from './cellAuthoringMappers';

/**
 * Seam: same mapping chain as load → grid draft → save/bootstrap payload
 * (`cellEntriesToDraft` / `cellDraftToCellEntries`, `normalizeLocationMapAuthoringFields` for path/edge).
 */
describe('location map authoring round-trip', () => {
  it('preserves cellEntries, pathEntries, and edgeEntries through draft ↔ persisted-authoring mapping', () => {
    const loaded = normalizeLocationMapAuthoringFields({
      cellEntries: [
        {
          cellId: '1,1',
          linkedLocationId: 'linked-loc',
          cellFillKind: 'water',
          objects: [{ id: 'obj-a', kind: 'landmark', label: 'Shrine' }],
        },
      ],
      pathEntries: [{ id: 'p1', kind: 'road' as const, cellIds: ['1,1', '2,1'] }],
      edgeEntries: [{ edgeId: 'between:1,1|1,2', kind: 'wall' as const }],
    });

    const draft = {
      ...cellEntriesToDraft(loaded.cellEntries),
      pathEntries: loaded.pathEntries,
      edgeEntries: loaded.edgeEntries,
    };

    const persistedShaped = normalizeLocationMapAuthoringFields({
      cellEntries: cellDraftToCellEntries(
        draft.linkedLocationByCellId,
        draft.objectsByCellId,
        draft.cellFillByCellId,
      ),
      pathEntries: draft.pathEntries,
      edgeEntries: draft.edgeEntries,
    });

    expect(persistedShaped.cellEntries).toEqual(loaded.cellEntries);
    expect(persistedShaped.pathEntries).toEqual(loaded.pathEntries);
    expect(persistedShaped.edgeEntries).toEqual(loaded.edgeEntries);

    const centers = new Map<string, { cx: number; cy: number }>([
      ['1,1', { cx: 0, cy: 0 }],
      ['2,1', { cx: 10, cy: 0 }],
    ]);
    const centerFn = (id: string) => centers.get(id) ?? null;
    expect(pathEntriesToPolylineGeometry(persistedShaped.pathEntries, centerFn)).toEqual(
      pathEntriesToPolylineGeometry(loaded.pathEntries, centerFn),
    );
    expect(edgeEntriesToSegmentGeometrySquare(persistedShaped.edgeEntries, 40)).toEqual(
      edgeEntriesToSegmentGeometrySquare(loaded.edgeEntries, 40),
    );
  });
});
