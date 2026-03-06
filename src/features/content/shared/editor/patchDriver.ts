/**
 * Patch driver — manages a patch object draft over a base object.
 * Supports dot-path access (a.b.c, a[0].b, a.0.b) and deep merge semantics.
 */

export type PatchDriverOptions = {
  /** Remove from patch when value equals base resolved value. Default true. */
  removeIfMatchesBase?: boolean;
  /** Treat setValue(path, undefined) as unset. Default true. */
  undefinedRemoves?: boolean;
  /** Called when patch changes. */
  onChange?: (patch: Record<string, unknown>) => void;
};

/**
 * Parses a dot-path into segments. Supports a.b.c, a[0].b, a.0.b.
 */
function parsePath(path: string): string[] {
  if (!path || typeof path !== 'string') return [];
  return path
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .filter(Boolean);
}

/**
 * Gets a value at path from obj. Returns undefined if path doesn't exist.
 */
function getAtPath(obj: Record<string, unknown>, path: string): unknown {
  const segments = parsePath(path);
  let current: unknown = obj;
  for (const seg of segments) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[seg];
  }
  return current;
}

/**
 * Deep merge: base + patch. Arrays are replaced, not merged.
 */
function deepMerge(
  base: Record<string, unknown>,
  patch: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...base };
  for (const key of Object.keys(patch)) {
    const patchVal = patch[key];
    const baseVal = base[key];
    if (
      patchVal != null &&
      typeof patchVal === 'object' &&
      !Array.isArray(patchVal) &&
      baseVal != null &&
      typeof baseVal === 'object' &&
      !Array.isArray(baseVal)
    ) {
      result[key] = deepMerge(
        baseVal as Record<string, unknown>,
        patchVal as Record<string, unknown>
      );
    } else {
      result[key] = patchVal;
    }
  }
  return result;
}

/**
 * Sets a value at path in obj. Mutates obj.
 */
function setAtPath(
  obj: Record<string, unknown>,
  path: string,
  value: unknown
): void {
  const segments = parsePath(path);
  if (segments.length === 0) return;
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i];
    const nextSeg = segments[i + 1];
    const nextKey = segments[i + 1];
    let next = current[seg];
    if (next == null || typeof next !== 'object') {
      next = /^\d+$/.test(nextSeg) ? [] : {};
      current[seg] = next;
    }
    current = next as Record<string, unknown>;
  }
  const last = segments[segments.length - 1];
  current[last] = value;
}

/**
 * Removes a value at path from obj. Mutates obj.
 */
function unsetAtPath(obj: Record<string, unknown>, path: string): void {
  const segments = parsePath(path);
  if (segments.length === 0) return;
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i];
    const next = current[seg];
    if (next == null || typeof next !== 'object') return;
    current = next as Record<string, unknown>;
  }
  const last = segments[segments.length - 1];
  delete current[last];
}

/**
 * Recursively removes keys that are undefined or empty objects.
 */
function pruneEmpty(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    if (v != null && typeof v === 'object' && !Array.isArray(v)) {
      const pruned = pruneEmpty(v as Record<string, unknown>);
      if (Object.keys(pruned).length > 0) {
        result[k] = pruned;
      }
    } else {
      result[k] = v;
    }
  }
  return result;
}

export type PatchDriver = {
  getValue(path: string): unknown;
  setValue(path: string, value: unknown): void;
  unsetValue(path: string): void;
  getPatch(): Record<string, unknown>;
  setPatch(next: Record<string, unknown>): void;
  getResolved(): Record<string, unknown>;
  isDirty(): boolean;
};

export type CreatePatchDriverParams = {
  base: Record<string, unknown>;
  initialPatch: Record<string, unknown>;
  initialPatchRef?: { current: Record<string, unknown> };
} & PatchDriverOptions;

/**
 * Creates a patch driver for managing a patch draft over a base object.
 * Supports dot-path access (a.b.c, a[0].b, a.0.b).
 */
export function createPatchDriver(
  params: CreatePatchDriverParams
): PatchDriver {
  const {
    base,
    initialPatch,
    removeIfMatchesBase = true,
    undefinedRemoves = true,
    onChange,
  } = params;

  let patch: Record<string, unknown> = { ...initialPatch };

  const getResolved = (): Record<string, unknown> =>
    deepMerge(base, patch);

  const getValue = (path: string): unknown => {
    const resolved = getResolved();
    return getAtPath(resolved, path);
  };

  const valuesEqual = (a: unknown, b: unknown): boolean => {
    if (a === b) return true;
    if (a == null || b == null) return false;
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      return false;
    }
  };

  const setValue = (path: string, value: unknown): void => {
    if (undefinedRemoves && value === undefined) {
      unsetValue(path);
      return;
    }

    const baseVal = getAtPath(base, path);
    if (removeIfMatchesBase && valuesEqual(value, baseVal)) {
      unsetValue(path);
      return;
    }

    setAtPath(patch, path, value);
    const pruned = pruneEmpty(patch);
    patch = pruned;
    onChange?.(pruned);
  };

  const unsetValue = (path: string): void => {
    unsetAtPath(patch, path);
    patch = pruneEmpty(patch);
    onChange?.(patch);
  };

  const setPatch = (next: Record<string, unknown>): void => {
    patch = { ...next };
    onChange?.(patch);
  };

  const isDirty = (): boolean => {
    const a = JSON.stringify(initialPatch);
    const b = JSON.stringify(patch);
    return a !== b;
  };

  return {
    getValue,
    setValue,
    unsetValue,
    getPatch: () => ({ ...patch }),
    setPatch,
    getResolved,
    isDirty,
  };
}
