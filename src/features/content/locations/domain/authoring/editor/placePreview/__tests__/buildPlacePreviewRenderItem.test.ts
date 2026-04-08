// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { buildPlacePreviewRenderItem } from '../buildPlacePreviewRenderItem';

describe('buildPlacePreviewRenderItem', () => {
  it('returns null when linked-content family has no persisted payload at host scale', () => {
    expect(
      buildPlacePreviewRenderItem(
        { category: 'linked-content', kind: 'city', variantId: 'default' },
        '0,0',
        'floor',
      ),
    ).toBeNull();
  });

  it('returns a synthetic item for linked-content marker family at hover cell', () => {
    const item = buildPlacePreviewRenderItem(
      { category: 'linked-content', kind: 'building', variantId: 'residential' },
      '1,2',
      'city',
    );
    expect(item).not.toBeNull();
    expect(item!.kind).toBe('marker');
    expect(item!.authoredPlaceKindId).toBe('building');
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
