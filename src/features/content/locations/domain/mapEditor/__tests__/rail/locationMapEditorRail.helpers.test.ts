import { describe, expect, it } from 'vitest';

import { shouldSwitchRailToMapForPaintDomain } from '../../rail';

describe('locationMapEditorRail.helpers', () => {
  it('shouldSwitchRailToMapForPaintDomain is true only for region paint', () => {
    expect(shouldSwitchRailToMapForPaintDomain('region')).toBe(true);
    expect(shouldSwitchRailToMapForPaintDomain('surface')).toBe(false);
  });
});
