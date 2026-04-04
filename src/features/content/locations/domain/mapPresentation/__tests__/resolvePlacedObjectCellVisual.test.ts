// @vitest-environment node
import { describe, expect, it } from 'vitest';

import {
  resolvePlacedObjectCellVisualFromPlacedKind,
  resolvePlacedObjectCellVisualFromRenderItem,
} from '../resolvePlacedObjectCellVisual';

describe('resolvePlacedObjectCellVisualFromPlacedKind', () => {
  it('resolves treasure to registry label and icon name', () => {
    const v = resolvePlacedObjectCellVisualFromPlacedKind('treasure');
    expect(v.label).toBe('Treasure');
    expect(v.tooltip).toBe('Treasure');
    expect(v.iconName).toBe('treasure');
    expect(v.showIcon).toBe(true);
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
    expect(v.iconName).toBe('treasure');
    expect(v.label).toBe('Treasure');
  });

  it('falls back to persisted map kind when no authored place id', () => {
    const v = resolvePlacedObjectCellVisualFromRenderItem({
      id: '1',
      authorCellId: '0,0',
      combatCellId: 'c-0-0',
      kind: 'treasure',
    });
    expect(v.iconName).toBe('treasure');
    expect(v.label).toBe('Treasure');
  });
});
