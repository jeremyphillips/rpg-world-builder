// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { AUTHORED_PLACED_OBJECT_DEFINITIONS } from '../locationPlacedObject.registry';
import { recordKeys } from '../locationPlacedObject.recordUtils';
import { LOCATION_PLACED_OBJECT_KIND_RUNTIME_DEFAULTS } from '../locationPlacedObject.runtime';
import {
  LOCATION_PLACED_OBJECT_KIND_IDS,
  LOCATION_PLACED_OBJECT_KIND_META,
} from '../locationPlacedObject.selectors';

describe('locationPlacedObject.selectors (registry-derived)', () => {
  it('LOCATION_PLACED_OBJECT_KIND_IDS matches registry keys (no drift)', () => {
    const fromRegistry = recordKeys(AUTHORED_PLACED_OBJECT_DEFINITIONS).sort();
    const derived = [...LOCATION_PLACED_OBJECT_KIND_IDS].sort();
    expect(derived).toEqual(fromRegistry);
  });

  it('LOCATION_PLACED_OBJECT_KIND_META covers every registry key', () => {
    expect(Object.keys(LOCATION_PLACED_OBJECT_KIND_META).sort()).toEqual(
      recordKeys(AUTHORED_PLACED_OBJECT_DEFINITIONS).sort(),
    );
  });

  it('LOCATION_PLACED_OBJECT_KIND_RUNTIME_DEFAULTS matches registry keys', () => {
    expect(Object.keys(LOCATION_PLACED_OBJECT_KIND_RUNTIME_DEFAULTS).sort()).toEqual(
      recordKeys(AUTHORED_PLACED_OBJECT_DEFINITIONS).sort(),
    );
  });
});
