// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  getAllowedCellFillFamiliesForScale,
  getAllowedEdgeKindsForScale,
  getAllowedPathKindsForScale,
  getAllowedPlacedObjectKindsForScale,
  getLocationScaleMapContentPolicy,
  LOCATION_SCALE_MAP_CONTENT_POLICY,
} from '../locationScaleMapContent.policy';

describe('locationScaleMapContent.policy', () => {
  it('maps world / city / floor as specified; other scales are empty', () => {
    expect(LOCATION_SCALE_MAP_CONTENT_POLICY.world).toEqual({
      cellFillFamilies: ['mountains', 'plains', 'forest', 'swamp', 'desert', 'water'],
      pathKinds: ['road', 'river'],
      edgeKinds: [],
      /** Derived from registry `allowedScales` — only `city` is offered at world scale today. */
      objectKinds: ['city'],
    });
    expect(LOCATION_SCALE_MAP_CONTENT_POLICY.city).toEqual({
      cellFillFamilies: [],
      pathKinds: ['road'],
      edgeKinds: [],
      objectKinds: ['city', 'building', 'site', 'tree'],
    });
    expect(LOCATION_SCALE_MAP_CONTENT_POLICY.floor).toEqual({
      cellFillFamilies: ['floor'],
      pathKinds: [],
      edgeKinds: ['wall'],
      objectKinds: ['table', 'stairs', 'treasure', 'door', 'window'],
    });
    expect(LOCATION_SCALE_MAP_CONTENT_POLICY.region).toEqual({
      cellFillFamilies: [],
      pathKinds: [],
      edgeKinds: [],
      objectKinds: [],
    });
  });

  it('helpers delegate to the policy map', () => {
    expect(getLocationScaleMapContentPolicy('world')).toBe(LOCATION_SCALE_MAP_CONTENT_POLICY.world);
    expect(getAllowedCellFillFamiliesForScale('floor')).toEqual(['floor']);
    expect(getAllowedPathKindsForScale('city')).toEqual(['road']);
    expect(getAllowedEdgeKindsForScale('floor')).toEqual(['wall']);
    expect(getAllowedPlacedObjectKindsForScale('city')).toEqual(['city', 'building', 'site', 'tree']);
  });
});
