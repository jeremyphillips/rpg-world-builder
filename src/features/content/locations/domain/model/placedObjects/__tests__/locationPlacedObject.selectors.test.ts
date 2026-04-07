// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { AUTHORED_PLACED_OBJECT_DEFINITIONS } from '../locationPlacedObject.registry';
import { recordKeys } from '../locationPlacedObject.recordUtils';
import { LOCATION_PLACED_OBJECT_KIND_RUNTIME_DEFAULTS } from '../locationPlacedObject.runtime';
import {
  getDefaultVariantIdForFamily,
  getPlacedObjectPaletteCategoryId,
  getPlacedObjectVariantPickerRowsForFamily,
  getVariantCountForFamily,
  LOCATION_PLACED_OBJECT_KIND_IDS,
  LOCATION_PLACED_OBJECT_KIND_META,
  normalizeVariantIdForFamily,
  resolvePlacedObjectVariant,
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

  it('getPlacedObjectPaletteCategoryId returns family registry category', () => {
    expect(getPlacedObjectPaletteCategoryId('table')).toBe('furniture');
    expect(getPlacedObjectPaletteCategoryId('city')).toBe('structure');
    expect(getPlacedObjectPaletteCategoryId('stairs')).toBe('structure');
    expect(getPlacedObjectPaletteCategoryId('treasure')).toBe('treasure');
  });

  it('every family defaultVariantId is a key of variants', () => {
    for (const k of LOCATION_PLACED_OBJECT_KIND_IDS) {
      const d = AUTHORED_PLACED_OBJECT_DEFINITIONS[k];
      const variants = d.variants as Record<string, unknown>;
      expect(variants[d.defaultVariantId]).toBeDefined();
    }
  });

  it('concrete variant families: defaultVariantId + presentation metadata (no variants.default)', () => {
    const defs = AUTHORED_PLACED_OBJECT_DEFINITIONS;

    expect(defs.table.defaultVariantId).toBe('rect_wood');
    expect('default' in defs.table.variants).toBe(false);
    expect(defs.table.variants.rect_wood.presentation?.shape).toBe('rectangle');
    expect(defs.table.variants.circle_wood.presentation?.shape).toBe('circle');

    expect(defs.stairs.defaultVariantId).toBe('straight');
    expect('default' in defs.stairs.variants).toBe(false);
    expect(defs.stairs.variants.spiral.presentation?.form).toBe('spiral');

    expect(defs.treasure.defaultVariantId).toBe('chest');
    expect('default' in defs.treasure.variants).toBe(false);
    expect(defs.treasure.variants.hoard.presentation?.form).toBe('pile');

    expect(defs.tree.defaultVariantId).toBe('deciduous');
    expect('default' in defs.tree.variants).toBe(false);
    expect(defs.tree.variants.pine.presentation?.type).toBe('conifer');

    expect(defs.building.defaultVariantId).toBe('residential');
    expect('default' in defs.building.variants).toBe(false);
    expect(defs.building.variants.civic.presentation?.kind).toBe('civic');
  });

  it('getDefaultVariantIdForFamily and getVariantCountForFamily read registry', () => {
    expect(getDefaultVariantIdForFamily('table')).toBe('rect_wood');
    expect(getVariantCountForFamily('table')).toBe(2);
    expect(getVariantCountForFamily('city')).toBe(1);
    expect(getVariantCountForFamily('stairs')).toBe(2);
    expect(getVariantCountForFamily('treasure')).toBe(2);
    expect(getVariantCountForFamily('tree')).toBe(2);
    expect(getVariantCountForFamily('building')).toBe(2);
  });

  it('normalizeVariantIdForFamily falls back to defaultVariantId (invalid legacy id)', () => {
    expect(normalizeVariantIdForFamily('table', null)).toBe('rect_wood');
    expect(normalizeVariantIdForFamily('table', 'default')).toBe('rect_wood');
    expect(normalizeVariantIdForFamily('stairs', 'default')).toBe('straight');
    expect(normalizeVariantIdForFamily('treasure', 'default')).toBe('chest');
    expect(normalizeVariantIdForFamily('tree', 'default')).toBe('deciduous');
    expect(normalizeVariantIdForFamily('building', 'default')).toBe('residential');
  });

  it('normalizeVariantIdForFamily does not trim variant ids (whitespace-prefixed key is invalid)', () => {
    expect(normalizeVariantIdForFamily('table', ' rect_wood')).toBe('rect_wood');
  });

  it('resolvePlacedObjectVariant returns resolved id and variant row; falls back like normalize', () => {
    const ok = resolvePlacedObjectVariant('table', 'circle_wood');
    expect(ok.resolvedVariantId).toBe('circle_wood');
    expect(ok.variant.label).toBe('Round Table (wood)');

    const fallback = resolvePlacedObjectVariant('table', 'bogus');
    expect(fallback.resolvedVariantId).toBe('rect_wood');
    expect(fallback.variant.label).toBe('Table');
  });

  it('variant picker rows surface presentation for consumers', () => {
    const tableRows = getPlacedObjectVariantPickerRowsForFamily('table');
    expect(tableRows.find((r) => r.variantId === 'circle_wood')?.presentation?.shape).toBe('circle');
    expect(tableRows.find((r) => r.variantId === 'rect_wood')?.presentation?.shape).toBe('rectangle');

    const stairRows = getPlacedObjectVariantPickerRowsForFamily('stairs');
    expect(stairRows.find((r) => r.variantId === 'straight')?.presentation?.form).toBe('straight');
  });

  it('city and site still use the legacy `default` variant key (single-variant linked rows)', () => {
    expect(AUTHORED_PLACED_OBJECT_DEFINITIONS.city.defaultVariantId).toBe('default');
    expect(AUTHORED_PLACED_OBJECT_DEFINITIONS.city.variants.default).toBeDefined();
    expect(AUTHORED_PLACED_OBJECT_DEFINITIONS.site.defaultVariantId).toBe('default');
    expect(AUTHORED_PLACED_OBJECT_DEFINITIONS.site.variants.default).toBeDefined();
  });
});
