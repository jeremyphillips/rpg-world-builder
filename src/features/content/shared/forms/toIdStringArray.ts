/**
 * Normalizes API / stored values to `string[]` for option pickers: accepts arrays, or
 * legacy JSON array strings (e.g. from older JSON storage). Other string shapes become `[]`.
 */
export function toIdStringArray(v: unknown): string[] {
  if (v == null) return [];
  if (Array.isArray(v)) return v.map((x) => String(x));
  if (typeof v === 'string') {
    const t = v.trim();
    if (t === '' || t === '[]') return [];
    if (t.startsWith('[')) {
      try {
        const parsed = JSON.parse(t) as unknown;
        return Array.isArray(parsed) ? parsed.map((x) => String(x)) : [];
      } catch {
        return [];
      }
    }
  }
  return [];
}
