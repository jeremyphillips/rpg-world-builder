import { describe, expect, it } from 'vitest';
import { trimTransparentRgba } from '../locationObjectsAssetManifest.trim';

describe('trimTransparentRgba', () => {
  it('returns full bounds of non-transparent 2x2', () => {
    const w = 4;
    const h = 4;
    const data = Buffer.alloc(w * h * 4);
    for (let y = 1; y <= 2; y++) {
      for (let x = 1; x <= 2; x++) {
        const i = (w * y + x) * 4;
        data[i + 3] = 255;
      }
    }
    expect(trimTransparentRgba(data, w, h)).toEqual({ x: 1, y: 1, width: 2, height: 2 });
  });

  it('returns empty rect when fully transparent', () => {
    const w = 4;
    const h = 4;
    const data = Buffer.alloc(w * h * 4);
    expect(trimTransparentRgba(data, w, h)).toEqual({ x: 0, y: 0, width: 0, height: 0 });
  });
});
