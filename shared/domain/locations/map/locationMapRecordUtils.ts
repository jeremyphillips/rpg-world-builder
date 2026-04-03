/** Keys of `obj` as an array, preserving `keyof T` (unlike `Object.keys` → `string[]`). */
export function recordKeys<T extends Record<PropertyKey, unknown>>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
}
