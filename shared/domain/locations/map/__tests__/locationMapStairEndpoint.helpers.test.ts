// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { deriveLocationMapStairEndpointLinkStatus } from '../locationMapStairEndpoint.helpers';

describe('deriveLocationMapStairEndpointLinkStatus', () => {
  const current = 'floor-a';

  it('returns incomplete when no other floors exist', () => {
    expect(
      deriveLocationMapStairEndpointLinkStatus({
        stairEndpoint: { direction: 'both' },
        currentFloorLocationId: current,
        validTargetFloorIds: [],
      }),
    ).toBe('incomplete');
  });

  it('returns unlinked when other floors exist but no target', () => {
    expect(
      deriveLocationMapStairEndpointLinkStatus({
        stairEndpoint: { direction: 'up' },
        currentFloorLocationId: current,
        validTargetFloorIds: ['floor-b'],
      }),
    ).toBe('unlinked');
  });

  it('returns linked when target is a valid sibling floor', () => {
    expect(
      deriveLocationMapStairEndpointLinkStatus({
        stairEndpoint: { direction: 'down', targetLocationId: 'floor-b' },
        currentFloorLocationId: current,
        validTargetFloorIds: ['floor-b'],
      }),
    ).toBe('linked');
  });

  it('returns invalid when target equals current floor', () => {
    expect(
      deriveLocationMapStairEndpointLinkStatus({
        stairEndpoint: { direction: 'both', targetLocationId: current },
        currentFloorLocationId: current,
        validTargetFloorIds: ['floor-b'],
      }),
    ).toBe('invalid');
  });

  it('returns invalid when target is not in valid list', () => {
    expect(
      deriveLocationMapStairEndpointLinkStatus({
        stairEndpoint: { direction: 'both', targetLocationId: 'other' },
        currentFloorLocationId: current,
        validTargetFloorIds: ['floor-b'],
      }),
    ).toBe('invalid');
  });
});
