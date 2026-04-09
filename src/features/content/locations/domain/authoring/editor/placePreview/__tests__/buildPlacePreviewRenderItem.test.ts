// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { buildPlacePreviewRenderItem } from '../buildPlacePreviewRenderItem';

describe('buildPlacePreviewRenderItem', () => {
  it('returns null when not map-object', () => {
    expect(
      buildPlacePreviewRenderItem(
        { category: 'linked-content', kind: 'tree', variantId: 'default' },
        '0,0',
        'floor',
      ),
    ).toBeNull();
  });

  it('returns a synthetic item for cell map-object at hover cell', () => {
    const item = buildPlacePreviewRenderItem(
      { category: 'map-object', kind: 'table', variantId: 'rect_wood' },
      '1,2',
      'floor',
    );
    expect(item).not.toBeNull();
    expect(item!.id).toBe('__place_preview__');
    expect(item!.authorCellId).toBe('1,2');
    expect(item!.combatCellId).toBe('c-1-2');
    expect(item!.kind).toBe('table');
    expect(item!.authoredPlaceKindId).toBe('table');
  });
});
