/**
 * Helpers for discrete numeric range filters (toolbar sliders aligned to catalog values).
 */

export type NumericRange = { min: number; max: number };

export function deriveSortedUniqueNumericSteps<T>(
  rows: T[],
  read: (row: T) => number | null | undefined,
): number[] {
  const seen = new Set<number>();
  for (const row of rows) {
    const v = read(row);
    if (v != null && !Number.isNaN(v)) {
      seen.add(v);
    }
  }
  return Array.from(seen).sort((a, b) => a - b);
}

/** Ensures min <= max and both lie within the closed range of `steps`. */
export function clampMinMaxToSteps(value: NumericRange, steps: readonly number[]): NumericRange {
  if (steps.length === 0) {
    return orderMinMax(value);
  }
  const minBound = steps[0]!;
  const maxBound = steps[steps.length - 1]!;
  const ordered = orderMinMax(value);
  return {
    min: Math.min(maxBound, Math.max(minBound, ordered.min)),
    max: Math.min(maxBound, Math.max(minBound, ordered.max)),
  };
}

function orderMinMax(value: NumericRange): NumericRange {
  if (value.min <= value.max) return value;
  return { min: value.max, max: value.min };
}

/**
 * Maps numeric min/max to inclusive index pair on `steps` (steps must be sorted ascending).
 */
export function valuesToIndexRange(
  steps: readonly number[],
  minNum: number,
  maxNum: number,
): [number, number] {
  if (steps.length === 0) return [0, 0];
  const findIdx = (n: number) => {
    const exact = steps.findIndex((s) => s === n);
    if (exact >= 0) return exact;
    let best = 0;
    let bestDist = Infinity;
    for (let j = 0; j < steps.length; j++) {
      const d = Math.abs(steps[j]! - n);
      if (d < bestDist) {
        bestDist = d;
        best = j;
      }
    }
    return best;
  };
  let iMin = findIdx(minNum);
  let iMax = findIdx(maxNum);
  if (iMin > iMax) {
    const t = iMin;
    iMin = iMax;
    iMax = t;
  }
  return [iMin, iMax];
}

/**
 * Maps inclusive index pair to numeric min/max from `steps`.
 */
export function indexRangeToValues(
  steps: readonly number[],
  iMin: number,
  iMax: number,
): NumericRange {
  if (steps.length === 0) return { min: 0, max: 0 };
  const a = Math.max(0, Math.min(steps.length - 1, Math.round(iMin)));
  const b = Math.max(0, Math.min(steps.length - 1, Math.round(iMax)));
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  return { min: steps[lo]!, max: steps[hi]! };
}
