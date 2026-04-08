// @vitest-environment node
import { describe, expect, it } from 'vitest';

import {
  resolvePlacedObjectCellVisualFromPlacedKind,
  resolvePlacedObjectCellVisualFromRenderItem,
} from '../resolvePlacedObjectCellVisual';

describe('resolvePlacedObjectCellVisualFromPlacedKind', () => {
  it('resolves treasure to registry label and map raster URL', () => {
    const v = resolvePlacedObjectCellVisualFromPlacedKind('treasure');
    expect(v.label).toBe('Treasure Chest');
    expect(v.tooltip).toBe('Treasure Chest');
    expect(v.mapImageUrl).toMatch(/\.png/);
    expect(v.showMapRaster).toBe(true);
    expect(v.fallbackLetter).toBe('T');
  });
});

describe('resolvePlacedObjectCellVisualFromRenderItem', () => {
  it('uses authored place kind when present', () => {
    const v = resolvePlacedObjectCellVisualFromRenderItem({
      id: '1',
      authorCellId: '0,0',
      combatCellId: 'c-0-0',
      kind: 'marker',
      authoredPlaceKindId: 'treasure',
    });
    expect(v.mapImageUrl).toMatch(/\.png/);
    expect(v.showMapRaster).toBe(true);
    expect(v.label).toBe('Treasure Chest');
  });

  it('falls back to persisted map kind when no authored place id', () => {
    const v = resolvePlacedObjectCellVisualFromRenderItem({
      id: '1',
      authorCellId: '0,0',
      combatCellId: 'c-0-0',
      kind: 'treasure',
    });
    expect(v.mapImageUrl).toMatch(/\.png/);
    expect(v.showMapRaster).toBe(true);
    expect(v.label).toBe('Treasure');
  });

  it('applies registry footprint layout when context is provided (table pilot)', () => {
    const v = resolvePlacedObjectCellVisualFromRenderItem(
      {
        id: '1',
        authorCellId: '0,0',
        combatCellId: 'c-0-0',
        kind: 'table',
        authoredPlaceKindId: 'table',
        variantId: 'rect_wood',
      },
      { feetPerCell: 5, cellPx: 50 },
    );
    expect(v.layoutWidthPx).toBeCloseTo(50);
    expect(v.layoutHeightPx).toBeCloseTo(30);
  });
});
