// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { getCellFillFamiliesForScale } from '@/shared/domain/locations/map/authoredCellFillDefinitions';
import {
  getAllowedCellFillFamiliesForScale,
  getAllowedEdgeKindsForScale,
  getAllowedPathKindsForScale,
  getAllowedPlacedObjectKindsForScale,
  getLocationScaleMapContentPolicy,
  LOCATION_SCALE_MAP_CONTENT_POLICY,
} from '../locationScaleMapContent.policy';

describe('locationScaleMapContent.policy', () => {
  it('maps world / city / floor with cell-fill capability flag; legacy zone scales disable paint', () => {
    expect(LOCATION_SCALE_MAP_CONTENT_POLICY.world).toEqual({
      supportsCellFillPainting: true,
      pathKinds: ['road', 'river'],
      edgeKinds: [],
      /** Derived from registry `allowedScales` — only `city` is offered at world scale today. */
      objectKinds: ['city'],
    });
    expect(LOCATION_SCALE_MAP_CONTENT_POLICY.city).toEqual({
      supportsCellFillPainting: true,
      pathKinds: ['road'],
      edgeKinds: [],
      /** `city` markers are world-scale only — no nested city placement on city maps. */
      objectKinds: ['building', 'site', 'tree'],
    });
    expect(LOCATION_SCALE_MAP_CONTENT_POLICY.floor).toEqual({
      supportsCellFillPainting: true,
      pathKinds: [],
      edgeKinds: ['wall'],
      objectKinds: ['table', 'stairs', 'treasure', 'door', 'window'],
    });
    expect(LOCATION_SCALE_MAP_CONTENT_POLICY.region).toEqual({
      supportsCellFillPainting: false,
      pathKinds: [],
      edgeKinds: [],
      objectKinds: [],
    });
  });

  it('helpers delegate to the policy map', () => {
    expect(getLocationScaleMapContentPolicy('world')).toBe(LOCATION_SCALE_MAP_CONTENT_POLICY.world);
    expect(getAllowedPathKindsForScale('city')).toEqual(['road']);
    expect(getAllowedEdgeKindsForScale('floor')).toEqual(['wall']);
    expect(getAllowedPlacedObjectKindsForScale('city')).toEqual(['building', 'site', 'tree']);
  });

  it('getAllowedCellFillFamiliesForScale derives from registry when supportsCellFillPainting; else empty', () => {
    expect(getAllowedCellFillFamiliesForScale('world')).toEqual(getCellFillFamiliesForScale('world'));
    expect(getAllowedCellFillFamiliesForScale('city')).toEqual(getCellFillFamiliesForScale('city'));
    expect(getAllowedCellFillFamiliesForScale('floor')).toEqual(getCellFillFamiliesForScale('floor'));
    expect(getAllowedCellFillFamiliesForScale('region')).toEqual([]);
    expect(getAllowedCellFillFamiliesForScale('building')).toEqual([]);
  });
});
