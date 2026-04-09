import { describe, expect, it } from 'vitest';

import type { LocationVerticalStairConnection } from '../../building/locationBuildingStairConnection.types';
import {
  buildingMetaFromLegacyProfile,
  normalizeBuildingFieldsFromPersistedDoc,
  parseBuildingWritePayload,
} from '../../building/locationBuilding.normalize';

const sampleConn: LocationVerticalStairConnection = {
  id: 's1',
  kind: 'stairs',
  buildingLocationId: 'b',
  endpointA: { floorLocationId: 'f1', cellId: '0,0', objectId: 'o1' },
  endpointB: { floorLocationId: 'f2', cellId: '1,1', objectId: 'o2' },
};

describe('normalizeBuildingFieldsFromPersistedDoc', () => {
  it('reads legacy buildingProfile into meta + structure', () => {
    const n = normalizeBuildingFieldsFromPersistedDoc({
      buildingProfile: {
        primaryType: 'business',
        stairConnections: [sampleConn],
      },
    });
    expect(n.buildingMeta?.primaryType).toBe('business');
    expect(n.buildingStructure?.verticalConnections).toHaveLength(1);
  });

  it('prefers buildingStructure.verticalConnections over legacy when set', () => {
    const n = normalizeBuildingFieldsFromPersistedDoc({
      buildingStructure: { verticalConnections: [] },
      buildingProfile: {
        stairConnections: [sampleConn],
      },
    });
    expect(n.buildingStructure?.verticalConnections).toEqual([]);
  });
});

describe('parseBuildingWritePayload', () => {
  it('passes through buildingMeta and buildingStructure', () => {
    const p = parseBuildingWritePayload({
      buildingMeta: { primaryType: 'civic' },
      buildingStructure: { verticalConnections: [sampleConn] },
    });
    expect(p.buildingMeta?.primaryType).toBe('civic');
    expect(p.buildingStructure?.verticalConnections).toHaveLength(1);
  });
});

describe('buildingMetaFromLegacyProfile', () => {
  it('strips stairConnections', () => {
    expect(
      buildingMetaFromLegacyProfile({
        primaryType: 'temple',
        stairConnections: [],
      }),
    ).toEqual({ primaryType: 'temple' });
  });
});
