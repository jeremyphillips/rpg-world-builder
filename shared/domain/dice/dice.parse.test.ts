import { describe, expect, it } from 'vitest';
import { buildXdY, parseXdY, toCount, toCountOrZero, toDieFace } from './dice.parse';

describe('buildXdY', () => {
  it('builds a canonical XdY string', () => {
    expect(buildXdY({ count: 1, die: 8 })).toBe('1d8');
    expect(buildXdY({ count: 2, die: 6 })).toBe('2d6');
  });
});

describe('parseXdY', () => {
  it('treats empty, whitespace-only, and non-string as empty', () => {
    expect(parseXdY(undefined)).toEqual({ count: 1, die: 6 });
    expect(parseXdY('')).toEqual({ count: 1, die: 6 });
    expect(parseXdY('   ')).toEqual({ count: 1, die: 6 });
  });

  it('rejects non-XdY strings and returns defaults (strict: no modifiers)', () => {
    expect(parseXdY('1d8+1')).toEqual({ count: 1, die: 6 });
    expect(parseXdY('2d6+3')).toEqual({ count: 1, die: 6 });
    expect(parseXdY('d8')).toEqual({ count: 1, die: 6 });
    expect(parseXdY('not dice')).toEqual({ count: 1, die: 6 });
    expect(parseXdY('1d7')).toEqual({ count: 1, die: 6 });
  });

  it('accepts only ^\\d+d\\d+$ (case-insensitive)', () => {
    expect(parseXdY('1d8')).toEqual({ count: 1, die: 8 });
    expect(parseXdY('2D6')).toEqual({ count: 2, die: 6 });
  });

  it('applies custom defaults when empty/invalid', () => {
    expect(parseXdY('bad', { defaultCount: 2, defaultDie: 8 })).toEqual({
      count: 2,
      die: 8,
    });
  });

  it('defaultCount: 0 allows zero-count dice when the string is empty', () => {
    expect(
      parseXdY(undefined, { defaultCount: 0, defaultDie: 8 }),
    ).toEqual({ count: 0, die: 8 });
    const empty = parseXdY('   ', { defaultCount: 0, defaultDie: 8 });
    expect(empty).toEqual({ count: 0, die: 8 });
  });

  it('defaultCount: 0 parses 0d8 from a valid string', () => {
    expect(parseXdY('0d8', { defaultCount: 0, defaultDie: 6 })).toEqual({
      count: 0,
      die: 8,
    });
  });

  it('clamps count to min 1 when defaultCount is not 0 and string is XdY', () => {
    expect(parseXdY('0d6')).toEqual({ count: 1, die: 6 });
  });

  it('uses default die when the matched die is not a valid polyhedral', () => {
    expect(parseXdY('1d7', { defaultCount: 1, defaultDie: 8 })).toEqual({
      count: 1,
      die: 8,
    });
    expect(parseXdY('2d3')).toEqual({ count: 2, die: 6 });
  });
});

describe('toDieFace', () => {
  it('validates against DIE_FACES and uses fallback for invalid', () => {
    expect(toDieFace(8, 4)).toBe(8);
    expect(toDieFace('8', 4)).toBe(8);
    expect(toDieFace(7, 6)).toBe(6);
    expect(toDieFace('7', 6)).toBe(6);
    expect(toDieFace(undefined, 10)).toBe(10);
  });
});

describe('toCount', () => {
  it('clamps to at least 1 and uses fallback for invalid', () => {
    expect(toCount(2, 1)).toBe(2);
    expect(toCount(0, 1)).toBe(1);
    expect(toCount(-1, 1)).toBe(1);
    expect(toCount('3', 1)).toBe(3);
    expect(toCount(undefined, 2)).toBe(2);
  });
});

describe('toCountOrZero', () => {
  it('clamps to >= 0 and uses fallback for invalid', () => {
    expect(toCountOrZero(0, 0)).toBe(0);
    expect(toCountOrZero(2, 0)).toBe(2);
    expect(toCountOrZero(-1, 0)).toBe(0);
    expect(toCountOrZero(undefined, 1)).toBe(1);
  });
});
