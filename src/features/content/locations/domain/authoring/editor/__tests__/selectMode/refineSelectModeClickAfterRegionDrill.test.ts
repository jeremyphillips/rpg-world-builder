// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { refineSelectModeClickAfterRegionDrill } from '../../selectMode';

describe('refineSelectModeClickAfterRegionDrill', () => {
  const regionR1 = { type: 'region' as const, regionId: 'r1' };
  const cell00 = { type: 'cell' as const, cellId: '0,0' };

  it('first effective selection: region stays region when previous is not the same region', () => {
    expect(
      refineSelectModeClickAfterRegionDrill(regionR1, { type: 'none' }, '0,0'),
    ).toEqual(regionR1);
    expect(
      refineSelectModeClickAfterRegionDrill(regionR1, { type: 'cell', cellId: '9,9' }, '0,0'),
    ).toEqual(regionR1);
    expect(
      refineSelectModeClickAfterRegionDrill(regionR1, { type: 'region', regionId: 'r2' }, '0,0'),
    ).toEqual(regionR1);
  });

  it('second click same region: drills to clicked cell', () => {
    expect(refineSelectModeClickAfterRegionDrill(regionR1, regionR1, '0,0')).toEqual(cell00);
  });

  it('another cell in same region: drills to that cell', () => {
    expect(refineSelectModeClickAfterRegionDrill(regionR1, regionR1, '1,1')).toEqual({
      type: 'cell',
      cellId: '1,1',
    });
  });

  it('does not change object/path/edge/cell resolutions', () => {
    const obj = { type: 'object' as const, cellId: '0,0', objectId: 'o1' };
    expect(refineSelectModeClickAfterRegionDrill(obj, regionR1, '0,0')).toEqual(obj);
    const path = { type: 'path' as const, pathId: 'p1' };
    expect(refineSelectModeClickAfterRegionDrill(path, regionR1, '0,0')).toEqual(path);
    const edgeRun = {
      type: 'edge-run' as const,
      kind: 'wall' as const,
      edgeIds: ['e1'],
      axis: 'horizontal' as const,
      anchorEdgeId: 'e1',
    };
    expect(refineSelectModeClickAfterRegionDrill(edgeRun, regionR1, '0,0')).toEqual(edgeRun);
    expect(refineSelectModeClickAfterRegionDrill(cell00, regionR1, '0,0')).toEqual(cell00);
  });
});
