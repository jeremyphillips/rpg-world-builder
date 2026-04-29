import { describe, expect, it } from 'vitest';
import {
  createOptionalXdYCountBinding,
  createOptionalXdYDieBinding,
  createRequiredXdYCountBinding,
  createRequiredXdYDieBinding,
} from './dicePatchBindings';

describe('dicePatchBindings', () => {
  const reqCount = createRequiredXdYCountBinding({
    domainPath: 'damage.default',
    countFallback: 1,
    dieFallback: 6,
  });
  const reqDie = createRequiredXdYDieBinding({
    domainPath: 'damage.default',
    dieFallback: 6,
  });

  it('required count: serialize keeps die from current', () => {
    expect(reqCount.serialize('2', '1d8')).toBe('2d8');
    expect(reqCount.parse('1d8')).toBe('1');
  });

  it('required die: serialize keeps count from current', () => {
    expect(reqDie.serialize('10', '2d8')).toBe('2d10');
    expect(reqDie.parse('2d6')).toBe('6');
  });

  const opt = { defaultCount: 0, defaultDie: 8 as const };
  const optCount = createOptionalXdYCountBinding({
    domainPath: 'damage.versatile',
    parseOptions: opt,
    countZeroFallback: 0,
  });
  const optDie = createOptionalXdYDieBinding({
    domainPath: 'damage.versatile',
    parseOptions: opt,
    countZeroFallback: 0,
    dieFallback: 8,
  });

  it('optional count: zero serializes to undefined', () => {
    expect(optCount.serialize('0', '1d10')).toBeUndefined();
  });

  it('optional die: does not resurrect when count is 0', () => {
    expect(optDie.serialize('12', undefined)).toBeUndefined();
    expect(optDie.serialize('10', '0d8')).toBeUndefined();
  });

  it('optional count: uses parsed die from current (not toDieFace)', () => {
    expect(optCount.serialize('1', '1d10')).toBe('1d10');
  });
});
