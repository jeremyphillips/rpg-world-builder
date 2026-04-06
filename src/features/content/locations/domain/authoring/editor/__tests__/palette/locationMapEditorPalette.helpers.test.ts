// @vitest-environment node
import { describe, expect, it } from 'vitest';

import {
  getPaintPaletteItemsForScale,
  getPlacePaletteItemsForScale,
} from '../../palette';

describe('locationMapEditorPalette.helpers', () => {
  it('getPaintPaletteItemsForScale maps policy + cell-fill meta', () => {
    const items = getPaintPaletteItemsForScale('world');
    expect(items.map((i) => i.fillKind)).toEqual([
      'mountains',
      'plains',
      'forest_light',
      'forest_heavy',
      'swamp',
      'desert',
      'water',
    ]);
    expect(items[0].label).toBe('Mountains');
    expect(items[0].swatchColorKey).toBe('cellFillMountains');
  });

  it('getPlacePaletteItemsForScale maps policy + linked-content vs map-object', () => {
    const items = getPlacePaletteItemsForScale('world');
    expect(items.map((i) => i.kind)).toEqual(['building', 'city', 'tree']);
    const city = items.find((i) => i.kind === 'city');
    expect(city?.label).toBe('City');
    expect(city?.category).toBe('linked-content');
    expect(city?.familyId).toBe('city');
    expect(city?.variantId).toBe('default');
    expect(city?.defaultVariantId).toBe('default');
    expect(city?.variantCount).toBe(1);
    expect(city?.paletteCategory).toBe('structure');
    if (city?.category === 'linked-content') {
      expect(city.linkedScale).toBe('city');
    }
    const building = items.find((i) => i.kind === 'building');
    expect(building?.category).toBe('map-object');
    if (building?.category === 'map-object') {
      expect(building.defaultVariantId).toBe('residential');
      expect(building.variantCount).toBe(2);
    }
  });

  it('floor map-object families expose variantCount from registry (table has multiple variants)', () => {
    const floor = getPlacePaletteItemsForScale('floor');
    const table = floor.find((i) => i.kind === 'table');
    expect(table?.category).toBe('map-object');
    if (table?.category === 'map-object') {
      expect(table.variantCount).toBe(2);
      expect(table.defaultVariantId).toBe('rect_wood');
    }
  });
});
