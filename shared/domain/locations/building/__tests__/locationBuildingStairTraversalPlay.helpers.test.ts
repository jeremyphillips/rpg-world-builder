import { describe, expect, it } from 'vitest';

import { resolveStairPlayTraversalFromCellObjects } from '../locationBuildingStairTraversalPlay.helpers';
import type { LocationVerticalStairConnection } from '../locationBuildingStairConnection.types';

describe('locationBuildingStairTraversalPlay.helpers', () => {
  describe('resolveStairPlayTraversalFromCellObjects', () => {
    const connections: LocationVerticalStairConnection[] = [
      {
        id: 'conn-1',
        kind: 'stairs',
        buildingLocationId: 'b1',
        endpointA: { floorLocationId: 'floor-a', cellId: '1,1', objectId: 's1' },
        endpointB: { floorLocationId: 'floor-b', cellId: '2,2', objectId: 's2' },
      },
    ];

    it('returns ok when stairs object is linked', () => {
      const r = resolveStairPlayTraversalFromCellObjects(connections, 'floor-a', '1,1', [
        { id: 's1', kind: 'stairs', stairEndpoint: { connectionId: 'conn-1' } },
      ]);
      expect(r.kind).toBe('ok');
      if (r.kind === 'ok') {
        expect(r.counterpart.floorLocationId).toBe('floor-b');
      }
    });

    it('returns no_stairs_object_on_cell when missing stairs', () => {
      const r = resolveStairPlayTraversalFromCellObjects(connections, 'floor-a', '1,1', [
        { id: 't1', kind: 'table' },
      ]);
      expect(r).toEqual({ kind: 'no_stairs_object_on_cell' });
    });
  });
});
