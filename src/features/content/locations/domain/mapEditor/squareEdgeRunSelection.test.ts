// @vitest-environment node
/**
 * Square-grid edge-run selection uses the same boundary / running-index collinearity
 * as stroke authoring (`edgeAuthoring`). Select-mode hit order in `LocationGridAuthoringSection`
 * remains object → path → edge → cell so path picks are not swallowed by boundary geometry.
 */
import { describe, expect, it } from 'vitest';

import { makeUndirectedSquareEdgeKey } from '@/shared/domain/grid/gridEdgeIds';

import { deriveSquareEdgeRunSelection } from './squareEdgeRunSelection';

const wall = (edgeId: string) => ({ edgeId, kind: 'wall' as const });
const door = (edgeId: string) => ({ edgeId, kind: 'door' as const });

describe('deriveSquareEdgeRunSelection', () => {
  it('returns a horizontal straight wall run along one row boundary', () => {
    const e0 = makeUndirectedSquareEdgeKey('0,0', '0,1');
    const e1 = makeUndirectedSquareEdgeKey('1,0', '1,1');
    const e2 = makeUndirectedSquareEdgeKey('2,0', '2,1');
    const edges = [e0, e1, e2].map(wall);
    const r = deriveSquareEdgeRunSelection(e1, edges);
    expect(r).not.toBeNull();
    expect(r!.axis).toBe('horizontal');
    expect(r!.kind).toBe('wall');
    expect(r!.edgeIds).toEqual([e0, e1, e2]);
    expect(r!.anchorEdgeId).toBe(e1);
  });

  it('returns a vertical straight wall run along one column boundary', () => {
    const e0 = makeUndirectedSquareEdgeKey('0,0', '1,0');
    const e1 = makeUndirectedSquareEdgeKey('0,1', '1,1');
    const e2 = makeUndirectedSquareEdgeKey('0,2', '1,2');
    const edges = [e0, e1, e2].map(wall);
    const r = deriveSquareEdgeRunSelection(e1, edges);
    expect(r).not.toBeNull();
    expect(r!.axis).toBe('vertical');
    expect(r!.edgeIds).toEqual([e0, e1, e2]);
  });

  it('from a middle segment returns the full contiguous run', () => {
    const e0 = makeUndirectedSquareEdgeKey('0,0', '0,1');
    const e1 = makeUndirectedSquareEdgeKey('1,0', '1,1');
    const e2 = makeUndirectedSquareEdgeKey('2,0', '2,1');
    const edges = [e0, e1, e2].map(wall);
    const r = deriveSquareEdgeRunSelection(e1, edges);
    expect(r!.edgeIds).toEqual([e0, e1, e2]);
  });

  it('does not merge an L: horizontal run stays separate from perpendicular wall', () => {
    const h0 = makeUndirectedSquareEdgeKey('0,0', '0,1');
    const h1 = makeUndirectedSquareEdgeKey('1,0', '1,1');
    const v0 = makeUndirectedSquareEdgeKey('0,0', '1,0');
    const edges = [wall(h0), wall(h1), wall(v0)];
    const rh = deriveSquareEdgeRunSelection(h0, edges);
    expect(rh!.edgeIds).toEqual([h0, h1]);
    const rv = deriveSquareEdgeRunSelection(v0, edges);
    expect(rv!.edgeIds).toEqual([v0]);
  });

  it('breaks the run when kind differs', () => {
    const e0 = makeUndirectedSquareEdgeKey('0,0', '0,1');
    const e1 = makeUndirectedSquareEdgeKey('1,0', '1,1');
    const edges = [wall(e0), door(e1)];
    const r = deriveSquareEdgeRunSelection(e0, edges);
    expect(r!.edgeIds).toEqual([e0]);
  });

  it('breaks the run when a middle segment is missing', () => {
    const e0 = makeUndirectedSquareEdgeKey('0,0', '0,1');
    const e2 = makeUndirectedSquareEdgeKey('2,0', '2,1');
    const edges = [wall(e0), wall(e2)];
    const r = deriveSquareEdgeRunSelection(e0, edges);
    expect(r!.edgeIds).toEqual([e0]);
    const r2 = deriveSquareEdgeRunSelection(e2, edges);
    expect(r2!.edgeIds).toEqual([e2]);
  });

  it('returns stable edgeIds ordering across repeated calls', () => {
    const e0 = makeUndirectedSquareEdgeKey('0,0', '0,1');
    const e1 = makeUndirectedSquareEdgeKey('1,0', '1,1');
    const edges = [e0, e1].map(wall);
    const a = JSON.stringify(deriveSquareEdgeRunSelection(e1, edges)!.edgeIds);
    const b = JSON.stringify(deriveSquareEdgeRunSelection(e1, edges)!.edgeIds);
    expect(a).toBe(b);
  });

  it('returns null when anchor edge id is not in edge entries', () => {
    const e0 = makeUndirectedSquareEdgeKey('0,0', '0,1');
    expect(deriveSquareEdgeRunSelection('between:9,9|9,10', [wall(e0)])).toBeNull();
  });

  it('single-segment run is still one edge-run payload', () => {
    const e0 = makeUndirectedSquareEdgeKey('0,0', '0,1');
    const edges = [wall(e0)];
    const r = deriveSquareEdgeRunSelection(e0, edges);
    expect(r!.edgeIds).toEqual([e0]);
  });
});
