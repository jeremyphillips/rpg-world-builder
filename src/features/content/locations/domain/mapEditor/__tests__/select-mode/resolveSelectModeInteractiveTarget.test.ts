// @vitest-environment node
import { describe, expect, it } from 'vitest';

import type { EdgeSegmentGeometry, PathPolylineGeometry } from '@/shared/domain/locations/map/locationMapGeometry.types';

import { resolveSelectModeInteractiveTarget } from '../../select-mode';

describe('resolveSelectModeInteractiveTarget', () => {
  const emptyDraft = {
    objectsByCellId: {} as Record<string, { id: string }[] | undefined>,
    linkedLocationByCellId: {} as Record<string, string | undefined>,
    regionIdByCellId: {} as Record<string, string | undefined>,
    edgeEntries: [] as { kind: 'wall'; edgeId: string }[],
  };

  it('interior: object wins over region on same cell', () => {
    const r = resolveSelectModeInteractiveTarget({
      targetElement: null,
      gx: 0,
      gy: 0,
      anchorCellId: '1,1',
      objectsByCellId: { '1,1': [{ id: 'o1' }] },
      linkedLocationByCellId: emptyDraft.linkedLocationByCellId,
      regionIdByCellId: { '1,1': 'reg-a' },
      pathPolys: [],
      edgeGeoms: null,
      edgeEntries: emptyDraft.edgeEntries,
      isHex: true,
    });
    expect(r).toEqual({ type: 'object', cellId: '1,1', objectId: 'o1' });
  });

  it('interior: region wins over bare cell when no object', () => {
    const r = resolveSelectModeInteractiveTarget({
      targetElement: null,
      gx: 0,
      gy: 0,
      anchorCellId: '0,0',
      objectsByCellId: {},
      linkedLocationByCellId: {},
      regionIdByCellId: { '0,0': 'r1' },
      pathPolys: [],
      edgeGeoms: null,
      edgeEntries: [],
      isHex: true,
    });
    expect(r).toEqual({ type: 'region', regionId: 'r1' });
  });

  it('interior: plain cell when no region', () => {
    const r = resolveSelectModeInteractiveTarget({
      targetElement: null,
      gx: 0,
      gy: 0,
      anchorCellId: '2,2',
      objectsByCellId: {},
      linkedLocationByCellId: {},
      regionIdByCellId: {},
      pathPolys: [],
      edgeGeoms: null,
      edgeEntries: [],
      isHex: true,
    });
    expect(r).toEqual({ type: 'cell', cellId: '2,2' });
  });

  it('edge wins over path when both are near the pointer (square)', () => {
    const paths: PathPolylineGeometry[] = [
      {
        id: 'p-a',
        kind: 'road',
        points: [
          { x: 50, y: 3 },
          { x: 50, y: 100 },
        ],
      },
    ];
    const edges: EdgeSegmentGeometry[] = [
      {
        edgeId: 'between:0,0|1,0',
        kind: 'wall',
        segment: { x1: 0, y1: 0, x2: 100, y2: 0 },
      },
    ];
    const edgeEntries = [{ kind: 'wall' as const, edgeId: 'between:0,0|1,0' }];
    const r = resolveSelectModeInteractiveTarget({
      targetElement: null,
      gx: 50,
      gy: 3,
      anchorCellId: '0,0',
      objectsByCellId: {},
      linkedLocationByCellId: {},
      regionIdByCellId: {},
      pathPolys: paths,
      edgeGeoms: edges,
      edgeEntries,
      isHex: false,
    });
    expect(r.type).toBe('edge-run');
  });

  it('path wins over region when no edge hit', () => {
    const paths: PathPolylineGeometry[] = [
      {
        id: 'p-only',
        kind: 'road',
        points: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
        ],
      },
    ];
    const r = resolveSelectModeInteractiveTarget({
      targetElement: null,
      gx: 40,
      gy: 4,
      anchorCellId: '0,0',
      objectsByCellId: {},
      linkedLocationByCellId: {},
      regionIdByCellId: { '0,0': 'r1' },
      pathPolys: paths,
      edgeGeoms: null,
      edgeEntries: [],
      isHex: true,
    });
    expect(r).toEqual({ type: 'path', pathId: 'p-only' });
  });
});
