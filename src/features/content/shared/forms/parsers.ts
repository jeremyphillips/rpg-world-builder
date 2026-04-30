/**
 * Shared form-value parsers/formatters.
 *
 * These helpers were previously re-declared in `classForm.registry.ts`,
 * `monsterForm.registry.ts`, `spellForm.registry.ts`, and `weaponForm.registry.ts`.
 * Centralizing them keeps parser semantics aligned across slices and gives us
 * a single point of change as we migrate `kind: 'json'` fields to structured groups.
 */

/** Trim a string-ish value; returns '' for non-string or nullish input. */
export const trim = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

/** Trimmed string when non-empty, otherwise null. Useful for nullable text fields. */
export const trimOrNull = (v: unknown): string | null => {
  const t = trim(v);
  return t ? t : null;
};

/** Coerce any value to a string for form display; nullish becomes ''. */
export const strOrEmpty = (v: unknown): string => (v != null ? String(v) : '');

/** Parse a numberText form value into a finite number, or undefined when blank/invalid. */
export const numOrUndefined = (v: unknown): number | undefined => {
  if (v === '' || v == null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

/** Format a numeric value as a string for numberText fields ('' when missing/invalid). */
export const numToStr = (v: unknown): string =>
  v != null && Number.isFinite(Number(v)) ? String(v) : '';

/** Always return a string[] from a form value (defaults to []). */
export const arrOrEmpty = (v: unknown): string[] =>
  Array.isArray(v) ? (v as string[]) : [];

/**
 * Parse a JSON object literal from a `kind: 'json'` textarea.
 * Returns the parsed object when valid; otherwise undefined.
 *
 * Accepts already-parsed objects unchanged (legacy callers occasionally pass through).
 */
export const parseJsonObject = (v: unknown): unknown => {
  if (v == null || v === '') return undefined;
  if (typeof v !== 'string') {
    return typeof v === 'object' && v !== null ? v : undefined;
  }
  try {
    const parsed = JSON.parse(v) as unknown;
    return typeof parsed === 'object' && parsed !== null ? parsed : undefined;
  } catch {
    return undefined;
  }
};

/**
 * Format a value for display in a `kind: 'json'` textarea.
 * Defaults to `'{}'` for missing/invalid input so the textarea always shows a valid JSON object.
 */
export const formatJsonObject = (v: unknown): string => {
  if (v == null) return '{}';
  if (typeof v === 'object') {
    try {
      return JSON.stringify(v, null, 2);
    } catch {
      return '{}';
    }
  }
  return '{}';
};

/**
 * Permissive JSON parse. Differs from {@link parseJsonObject} by accepting any JSON value
 * (arrays, primitives) — used by the monster registry where some fields are arrays.
 */
export const parseJson = (v: unknown): unknown => {
  if (v == null || v === '') return undefined;
  if (typeof v !== 'string') {
    return typeof v === 'object' && v !== null ? v : undefined;
  }
  try {
    return JSON.parse(v);
  } catch {
    return undefined;
  }
};

/**
 * Permissive JSON formatter. Returns '' for nullish input (vs. `'{}'` from {@link formatJsonObject}).
 * Used by monster fields that may be arrays or absent entirely.
 */
export const formatJson = (v: unknown): string => {
  if (v == null) return '';
  if (typeof v === 'object') {
    try {
      return JSON.stringify(v, null, 2);
    } catch {
      return '';
    }
  }
  return '';
};
