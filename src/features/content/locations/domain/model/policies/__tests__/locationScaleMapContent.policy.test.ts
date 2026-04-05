// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  getAllowedCellFillKindsForScale,
  getAllowedEdgeKindsForScale,
  getAllowedPathKindsForScale,
  getAllowedPlacedObjectKindsForScale,
  getLocationScaleMapContentPolicy,
  LOCATION_SCALE_MAP_CONTENT_POLICY,
} from '../locationScaleMapContent.policy';

describe('locationScaleMapContent.policy', () => {
  it('maps world / city / floor as specified; other scales are empty', () => {
    expect(LOCATION_SCALE_MAP_CONTENT_POLICY.world).toEqual({
      cellFillKinds: [
        'mountains',
        'plains',
        'forest_light',
        'forest_heavy',
        'swamp',
        'desert',
        'water',
      ],
      pathKinds: ['road', 'river'],
      edgeKinds: [],
      objectKinds: ['city'],
    });
    expect(LOCATION_SCALE_MAP_CONTENT_POLICY.city).toEqual({
      cellFillKinds: [],
      pathKinds: ['road'],
      edgeKinds: [],
      objectKinds: ['building', 'site', 'tree'],
    });
    expect(LOCATION_SCALE_MAP_CONTENT_POLICY.floor).toEqual({
      cellFillKinds: ['stone_floor'],
      pathKinds: [],
      edgeKinds: ['wall', 'window', 'door'],
      objectKinds: ['table', 'stairs', 'treasure'],
    });
    expect(LOCATION_SCALE_MAP_CONTENT_POLICY.region).toEqual({
      cellFillKinds: [],
      pathKinds: [],
      edgeKinds: [],
      objectKinds: [],
    });
  });

  it('helpers delegate to the policy map', () => {
    expect(getLocationScaleMapContentPolicy('world')).toBe(LOCATION_SCALE_MAP_CONTENT_POLICY.world);
    expect(getAllowedCellFillKindsForScale('floor')).toEqual(['stone_floor']);
    expect(getAllowedPathKindsForScale('city')).toEqual(['road']);
    expect(getAllowedEdgeKindsForScale('floor')).toEqual(['wall', 'window', 'door']);
    expect(getAllowedPlacedObjectKindsForScale('city')).toEqual(['building', 'site', 'tree']);
  });
});
