/**
 * Transparent-bounding-box trim for RGBA buffers (e.g. pngjs `data`).
 * Used by the location-objects manifest generator; trim results are persisted in the manifest for Phase 2+.
 */
export type LocationObjectsTrimRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function trimTransparentRgba(
  data: Buffer,
  width: number,
  height: number,
  alphaThreshold = 8,
): LocationObjectsTrimRect {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const a = data[(width * y + x) * 4 + 3] ?? 0;
      if (a > alphaThreshold) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}
