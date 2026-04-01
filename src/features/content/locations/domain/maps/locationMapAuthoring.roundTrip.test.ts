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
          regionId: 'reg-a',
        },
      ],
      pathEntries: [{ id: 'p1', kind: 'road' as const, cellIds: ['1,1', '2,1'] }],
      edgeEntries: [{ edgeId: 'between:1,1|1,2', kind: 'wall' as const }],
      regionEntries: [{ id: 'reg-a', colorKey: 'regionRed' as const, label: 'R' }],
    });

    expect(loaded.regionEntries).toEqual([
      { id: 'reg-a', colorKey: 'regionRed', name: 'R' },
    ]);

    const draft = {
      ...cellEntriesToDraft(loaded.cellEntries),
      pathEntries: loaded.pathEntries,
      edgeEntries: loaded.edgeEntries,
      regionEntries: loaded.regionEntries,
    };

    const persistedShaped = normalizeLocationMapAuthoringFields({
      cellEntries: cellDraftToCellEntries(
        draft.linkedLocationByCellId,
        draft.objectsByCellId,
        draft.cellFillByCellId,
        draft.regionIdByCellId,
      ),
      pathEntries: draft.pathEntries,
      edgeEntries: draft.edgeEntries,
      regionEntries: draft.regionEntries,
    });

    expect(persistedShaped.cellEntries).toEqual(loaded.cellEntries);
    expect(persistedShaped.pathEntries).toEqual(loaded.pathEntries);
    expect(persistedShaped.edgeEntries).toEqual(loaded.edgeEntries);
    expect(persistedShaped.regionEntries).toEqual(loaded.regionEntries);

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

  it('retains region entries with no cell references through save-shaped normalization', () => {
    const loaded = normalizeLocationMapAuthoringFields({
      cellEntries: [],
      pathEntries: [],
      edgeEntries: [],
      regionEntries: [
        {
          id: 'orphan',
          colorKey: 'regionBlue' as const,
          name: 'Empty region',
          description: 'No cells yet',
        },
      ],
    });

    const draft = {
      ...cellEntriesToDraft(loaded.cellEntries),
      pathEntries: loaded.pathEntries,
      edgeEntries: loaded.edgeEntries,
      regionEntries: loaded.regionEntries,
    };

    const persistedShaped = normalizeLocationMapAuthoringFields({
      cellEntries: cellDraftToCellEntries(
        draft.linkedLocationByCellId,
        draft.objectsByCellId,
        draft.cellFillByCellId,
        draft.regionIdByCellId,
      ),
      pathEntries: draft.pathEntries,
      edgeEntries: draft.edgeEntries,
      regionEntries: draft.regionEntries,
    });

    expect(persistedShaped.regionEntries).toEqual(loaded.regionEntries);
  });
});
