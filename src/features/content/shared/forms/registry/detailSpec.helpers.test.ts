import { describe, expect, it } from 'vitest';

import { isEmptyDetailValue } from './detailSpec.helpers';

describe('isEmptyDetailValue', () => {
  it('treats null, undefined, and empty string as empty', () => {
    expect(isEmptyDetailValue(null)).toBe(true);
    expect(isEmptyDetailValue(undefined)).toBe(true);
    expect(isEmptyDetailValue('')).toBe(true);
  });

  it('treats empty array and empty object as empty', () => {
    expect(isEmptyDetailValue([])).toBe(true);
    expect(isEmptyDetailValue({})).toBe(true);
  });

  it('treats non-empty values as not empty', () => {
    expect(isEmptyDetailValue(0)).toBe(false);
    expect(isEmptyDetailValue([1])).toBe(false);
    expect(isEmptyDetailValue({ a: 1 })).toBe(false);
  });
});
