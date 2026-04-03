/**
 * Small typed helpers for deriving records from the authored placed-object registry
 * without repeating keys or widening to `string`.
 */

import { recordKeys as recordKeysImpl } from '@/shared/domain/locations/map/locationMapRecordUtils';

export { recordKeys } from '@/shared/domain/locations/map/locationMapRecordUtils';

/** Build `{ [K in keyof T]: V }` from each entry of `obj` — no manual key list. */
export function mapValuesStrict<T extends Record<PropertyKey, unknown>, V>(
  obj: T,
  fn: (value: T[keyof T], key: keyof T) => V,
): { [K in keyof T]: V } {
  const keys = recordKeysImpl(obj);
  const out = {} as { [K in keyof T]: V };
  for (const k of keys) {
    out[k] = fn(obj[k], k);
  }
  return out;
}
