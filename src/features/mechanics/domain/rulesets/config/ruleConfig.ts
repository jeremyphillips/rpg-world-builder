// ---------------------------------------------------------------------------
// Generic rule-config types + resolver
//
// Provides a uniform way to define campaign rules with per-class/race
// overrides and a single `resolveRule` entry point that always returns
// a complete `T`.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Resolve modes
// ---------------------------------------------------------------------------

export type ResolveMode = 'use_default' | 'override' | 'merge';

// ---------------------------------------------------------------------------
// Merge policy
// ---------------------------------------------------------------------------

export type ArrayMergeMode = 'replace' | 'concat' | 'union';

export type MergePolicy = {
  arrays?: ArrayMergeMode;
};

// ---------------------------------------------------------------------------
// Override map
// ---------------------------------------------------------------------------

export type RuleOverrideMap<O> = {
  byClass?: Record<string, O>;
  byRace?: Record<string, O>;
};

// ---------------------------------------------------------------------------
// Rule config (the shape stored on rulesets)
// ---------------------------------------------------------------------------

export type RuleConfig<T, O = Partial<T>> = {
  mode?: ResolveMode;
  default: T;
  overrides?: RuleOverrideMap<O>;
  mergePolicy?: MergePolicy;
};

// ---------------------------------------------------------------------------
// Resolve context (passed by callers)
// ---------------------------------------------------------------------------

export type RuleResolveContext = {
  classId?: string;
  raceId?: string;
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function isPrimitive(v: unknown): v is string | number | boolean {
  const t = typeof v;
  return t === 'string' || t === 'number' || t === 'boolean';
}

function mergeArrays(base: unknown[], override: unknown[], mode: ArrayMergeMode): unknown[] {
  switch (mode) {
    case 'replace':
      return [...override];
    case 'concat':
      return [...base, ...override];
    case 'union': {
      if (base.every(isPrimitive) && override.every(isPrimitive)) {
        const set = new Set(base as (string | number | boolean)[]);
        for (const v of override as (string | number | boolean)[]) set.add(v);
        return Array.from(set);
      }
      return [...base, ...override];
    }
  }
}

function shallowMergeWithPolicy<T extends Record<string, unknown>>(
  base: T,
  patch: Record<string, unknown>,
  policy: MergePolicy | undefined,
): T {
  const result = { ...base };
  const arrayMode = policy?.arrays ?? 'replace';

  for (const key of Object.keys(patch)) {
    const bVal = (base as Record<string, unknown>)[key];
    const pVal = patch[key];

    if (Array.isArray(bVal) && Array.isArray(pVal)) {
      (result as Record<string, unknown>)[key] = mergeArrays(bVal, pVal, arrayMode);
    } else if (pVal !== undefined) {
      (result as Record<string, unknown>)[key] = pVal;
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Resolver
// ---------------------------------------------------------------------------

/**
 * Resolve a `RuleConfig<T>` into a complete `T`.
 *
 * **Precedence** (highest wins):
 *   byClass > byRace > default
 *
 * **Modes:**
 * - `use_default` (default when mode is undefined): return a copy of `default`.
 * - `override`: apply at most ONE patch (first match by precedence) on top of
 *   `default` so the output is always complete.
 * - `merge`: apply ALL matching patches in order (byRace first, then byClass
 *   on top) using the configured `mergePolicy`.
 */
export function resolveRule<T extends Record<string, unknown>, O = Partial<T>>(
  config: RuleConfig<T, O>,
  ctx: RuleResolveContext = {},
): T {
  const mode = config.mode ?? 'use_default';
  const base = { ...config.default };

  if (mode === 'use_default') return base;

  const overrides = config.overrides;
  if (!overrides) return base;

  if (mode === 'override') {
    const patch =
      (ctx.classId ? overrides.byClass?.[ctx.classId] : undefined) ??
      (ctx.raceId ? overrides.byRace?.[ctx.raceId] : undefined);

    if (!patch) return base;
    return { ...base, ...(patch as Record<string, unknown>) } as T;
  }

  // mode === 'merge'
  // Apply in ascending precedence: byRace, then byClass (last write wins for scalars)
  let result = base;
  const policy = config.mergePolicy;

  if (ctx.raceId && overrides.byRace?.[ctx.raceId]) {
    result = shallowMergeWithPolicy(result, overrides.byRace[ctx.raceId] as Record<string, unknown>, policy);
  }

  if (ctx.classId && overrides.byClass?.[ctx.classId]) {
    result = shallowMergeWithPolicy(result, overrides.byClass[ctx.classId] as Record<string, unknown>, policy);
  }

  return result;
}
