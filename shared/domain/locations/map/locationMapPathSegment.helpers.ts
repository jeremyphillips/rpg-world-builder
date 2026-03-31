/**
 * Normalize path segment endpoints so startCellId <= endCellId lexicographically.
 */
export function normalizePathSegmentEndpoints(
  a: string,
  b: string,
): { startCellId: string; endCellId: string } {
  const ta = a.trim();
  const tb = b.trim();
  return ta <= tb ? { startCellId: ta, endCellId: tb } : { startCellId: tb, endCellId: ta };
}
