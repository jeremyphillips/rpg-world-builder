import { describe, expect, it } from 'vitest';

import { MAP_AUTHORING_LAYER_Z } from './mapAuthoringLayerZ';

describe('MAP_AUTHORING_LAYER_Z', () => {
  it('orders terrain below square paths, grid above paths, hex paths above grid, objects above hex paths, region on top', () => {
    expect(MAP_AUTHORING_LAYER_Z.terrain).toBeLessThan(MAP_AUTHORING_LAYER_Z.squarePathsAndEdges);
    expect(MAP_AUTHORING_LAYER_Z.squarePathsAndEdges).toBeLessThan(MAP_AUTHORING_LAYER_Z.cellGrid);
    expect(MAP_AUTHORING_LAYER_Z.cellGrid).toBeLessThan(MAP_AUTHORING_LAYER_Z.hexPathsOverGrid);
    expect(MAP_AUTHORING_LAYER_Z.hexPathsOverGrid).toBeLessThan(MAP_AUTHORING_LAYER_Z.globalPlacedObjects);
    expect(MAP_AUTHORING_LAYER_Z.globalPlacedObjects).toBeLessThan(MAP_AUTHORING_LAYER_Z.hexRegionOutlines);
  });
});
