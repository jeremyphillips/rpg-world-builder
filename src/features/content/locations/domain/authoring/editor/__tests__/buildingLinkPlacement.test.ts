import { describe, expect, it } from 'vitest';

import type { Location } from '@/features/content/locations/domain/model/location';

import { collectBuildingLocationIdsLinkedElsewhere } from '../buildingLinkPlacement';

const building = (id: string): Location =>
  ({
    id,
    name: id,
    scale: 'building',
    source: 'campaign',
  }) as Location;

describe('collectBuildingLocationIdsLinkedElsewhere', () => {
  it('marks building as taken when linked on another map cell', () => {
    const byId = new Map<string, Location>([['b1', building('b1')]]);
    const maps = [
      {
        id: 'map-a',
        cellEntries: [{ cellId: '0,0', linkedLocationId: 'b1' }],
      },
      {
        id: 'map-b',
        cellEntries: [{ cellId: '1,1', linkedLocationId: undefined }],
      },
    ];
    const taken = collectBuildingLocationIdsLinkedElsewhere(maps, byId, 'map-b', '1,1');
    expect(taken.has('b1')).toBe(true);
  });

  it('does not mark the current cell link as taken', () => {
    const byId = new Map<string, Location>([['b1', building('b1')]]);
    const maps = [
      {
        id: 'map-a',
        cellEntries: [{ cellId: '0,0', linkedLocationId: 'b1' }],
      },
    ];
    const taken = collectBuildingLocationIdsLinkedElsewhere(maps, byId, 'map-a', '0,0');
    expect(taken.has('b1')).toBe(false);
  });

  it('ignores non-building linked ids', () => {
    const byId = new Map<string, Location>([
      ['r1', { id: 'r1', name: 'Room', scale: 'room', source: 'campaign' } as Location],
    ]);
    const maps = [
      {
        id: 'map-a',
        cellEntries: [{ cellId: '0,0', linkedLocationId: 'r1' }],
      },
    ];
    const taken = collectBuildingLocationIdsLinkedElsewhere(maps, byId, 'map-b', '1,1');
    expect(taken.size).toBe(0);
  });
});
