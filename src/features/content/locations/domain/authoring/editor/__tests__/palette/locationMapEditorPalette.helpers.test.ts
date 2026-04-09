// @vitest-environment node
import { describe, expect, it } from 'vitest';

import {
  getPaintPaletteItemsForScale,
  getPaintPaletteSectionsForScale,
  PAINT_PALETTE_SECTION_LABELS,
} from '../../palette';
import { getPlacePaletteItemsForScale } from '../../palette';

describe('locationMapEditorPalette.helpers', () => {
  it('getPaintPaletteItemsForScale maps policy + cell-fill registry variants', () => {
    const items = getPaintPaletteItemsForScale('world');
    expect(items.length).toBe(8);
    const keys = new Set(items.map((i) => `${i.familyId}:${i.variantId}`));
    expect(keys.has('mountains:rocky')).toBe(true);
    expect(keys.has('forest:temperate_open')).toBe(true);
    expect(keys.has('water:deep')).toBe(true);
    const mountains = items.find((i) => i.familyId === 'mountains');
    expect(mountains?.label).toBe('Mountains');
    expect(mountains?.swatchColorKey).toBe('cellFillMountains');
  });

  it('getPaintPaletteSectionsForScale groups by category and family', () => {
    const world = getPaintPaletteSectionsForScale('world');
    expect(world.map((s) => s.sectionId)).toEqual(['terrain']);
    expect(world[0].label).toBe(PAINT_PALETTE_SECTION_LABELS.terrain);
    const terrainFamilies = world[0].families.map((f) => f.familyId);
    expect(terrainFamilies).toContain('forest');
    const forest = world[0].families.find((f) => f.familyId === 'forest');
    expect(forest?.variants.length).toBe(2);
    expect(forest?.defaultVariantId).toBe('temperate_open');

    const floor = getPaintPaletteSectionsForScale('floor');
    expect(floor.map((s) => s.sectionId)).toEqual(['surface']);
    expect(floor[0].families.map((f) => f.familyId)).toEqual(['floor']);
    expect(floor[0].families[0].variants).toHaveLength(2);
  });

  it('getPlacePaletteItemsForScale maps policy + linked-content vs map-object', () => {
    const items = getPlacePaletteItemsForScale('world');
    /** World scale: only linked `city` (building/tree are city+ site-scale in registry). */
    expect(items.map((i) => i.kind)).toEqual(['city']);
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
    expect(city?.previewImageUrl).toMatch(/\.png/);
  });

  it('floor map-object families expose variantCount from registry (table has multiple variants)', () => {
    const floor = getPlacePaletteItemsForScale('floor');
    const table = floor.find((i) => i.kind === 'table');
    expect(table?.category).toBe('map-object');
    if (table?.category === 'map-object') {
      expect(table.variantCount).toBe(3);
      expect(table.defaultVariantId).toBe('rect_wood');
    }
  });
});
