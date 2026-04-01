// @vitest-environment node
import { describe, expect, it } from 'vitest';

import {
  getGroupedDrawPaletteForScale,
  getPlacePaletteItemsForScale,
} from '../../palette';

describe('map editor mode palette routing', () => {
  it('Place palette is only discrete objects (linked vs map-object categories)', () => {
    const world = getPlacePaletteItemsForScale('world');
    expect(world.every((i) => i.category === 'linked-content' || i.category === 'map-object')).toBe(true);
    expect(world.some((i) => i.category === 'linked-content')).toBe(true);
  });

  it('Draw palette for world includes paths, not edges', () => {
    const d = getGroupedDrawPaletteForScale('world');
    expect(d.some((i) => i.category === 'path')).toBe(true);
    expect(d.every((i) => i.category === 'path')).toBe(true);
  });

  it('Draw palette for floor includes edges', () => {
    const d = getGroupedDrawPaletteForScale('floor');
    expect(d.some((i) => i.category === 'edge')).toBe(true);
  });
});
