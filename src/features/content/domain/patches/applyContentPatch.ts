// ---------------------------------------------------------------------------
// SYSTEM PATCHING
// ---------------------------------------------------------------------------
// Campaigns may store patches for system content entries.
// Resolution order:
// 1) Campaign-owned entry (full override)
// 2) System entry + campaign patch (merged via applyContentPatch)
// 3) Raw system entry
//
// UI for editing patches will be added in a follow-up.

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Deep-merge `patch` into `base`.
 *
 * Rules:
 * - Plain objects are recursively merged.
 * - Arrays are replaced wholesale (no element-level merge).
 * - Undefined patch keys are treated as no-op (base value kept).
 * - If patch contains `__delete__: true` the base is returned as-is;
 *   the caller is responsible for setting the `patched` metadata flag.
 */
function deepMerge<T extends Record<string, unknown>>(
  base: T,
  patch: Record<string, unknown>,
): T {
  const result = { ...base };

  for (const key of Object.keys(patch)) {
    if (key === '__delete__') continue;

    const patchVal = patch[key];
    if (patchVal === undefined) continue;

    const baseVal = (base as Record<string, unknown>)[key];

    if (isPlainObject(patchVal) && isPlainObject(baseVal)) {
      (result as Record<string, unknown>)[key] = deepMerge(
        baseVal as Record<string, unknown>,
        patchVal,
      );
    } else {
      (result as Record<string, unknown>)[key] = patchVal;
    }
  }

  return result;
}

/**
 * Apply an optional content patch to a system entry.
 *
 * Returns the original entry unchanged when no patch is supplied.
 */
export function applyContentPatch<T>(
  entry: T,
  patch?: Partial<T> | null,
): T {
  if (!patch) return entry;
  return deepMerge(
    entry as unknown as Record<string, unknown>,
    patch as Record<string, unknown>,
  ) as unknown as T;
}
