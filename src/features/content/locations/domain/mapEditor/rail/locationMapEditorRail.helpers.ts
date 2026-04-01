/**
 * When paint domain is Region, the Map rail should show tool context (picker, new region, edit in Selection).
 */
export function shouldSwitchRailToMapForPaintDomain(domain: 'surface' | 'region'): boolean {
  return domain === 'region';
}
