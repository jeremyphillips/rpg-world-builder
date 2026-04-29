import type { DieFace } from '@/shared/domain/dice';
import {
  buildXdY,
  parseXdY,
  toCount,
  toCountOrZero,
  toDieFace,
  type ParseXdYOptions,
} from '@/shared/domain/dice';

/**
 * Standard `patchBinding` for domain-scalar UI fields (see `FieldSpec.patchBinding`).
 */
export type XdYScalarPatchBinding = {
  domainPath: string;
  parse: (domainValue: unknown) => unknown;
  serialize: (uiValue: unknown, currentDomainValue: unknown) => unknown;
};

const asDomainString = (v: unknown): string | undefined =>
  v != null && v !== undefined ? String(v) : undefined;

/**
 * Count subfield: show dice count; serialize updates count and keeps die from current domain string.
 */
export function createRequiredXdYCountBinding(opts: {
  domainPath: string;
  parseOptions?: ParseXdYOptions;
  countFallback: number;
  dieFallback: DieFace;
}): XdYScalarPatchBinding {
  const { domainPath, parseOptions, countFallback, dieFallback } = opts;
  return {
    domainPath,
    parse: (v) => String(parseXdY(asDomainString(v), parseOptions).count),
    serialize: (uiVal, current) => {
      const currentStr = asDomainString(current);
      return buildXdY({
        count: toCount(uiVal, countFallback),
        die: toDieFace(parseXdY(currentStr, parseOptions).die, dieFallback),
      });
    },
  };
}

/**
 * Die subfield: show die face; serialize updates die and keeps count from current domain string.
 */
export function createRequiredXdYDieBinding(opts: {
  domainPath: string;
  parseOptions?: ParseXdYOptions;
  dieFallback: DieFace;
}): XdYScalarPatchBinding {
  const { domainPath, parseOptions, dieFallback } = opts;
  return {
    domainPath,
    parse: (v) => String(parseXdY(asDomainString(v), parseOptions).die),
    serialize: (uiVal, current) => {
      const currentStr = asDomainString(current);
      return buildXdY({
        count: parseXdY(currentStr, parseOptions).count,
        die: toDieFace(uiVal, dieFallback),
      });
    },
  };
}

/**
 * Optional XdY (e.g. versatile): count 0 serializes the whole path to `undefined`.
 * Count serialize keeps `die` from `parseXdY(current)` (legacy weapon behavior).
 */
export function createOptionalXdYCountBinding(opts: {
  domainPath: string;
  parseOptions: ParseXdYOptions;
  countZeroFallback: number;
}): XdYScalarPatchBinding {
  const { domainPath, parseOptions, countZeroFallback } = opts;
  return {
    domainPath,
    parse: (v) => String(parseXdY(asDomainString(v), parseOptions).count),
    serialize: (uiVal, current) => {
      const vCount = toCountOrZero(uiVal, countZeroFallback);
      if (vCount === 0) return undefined;
      const currentStr = asDomainString(current);
      const parsed = parseXdY(currentStr, parseOptions);
      return buildXdY({ count: vCount, die: parsed.die });
    },
  };
}

/**
 * Optional die: must not “resurrect” when count is 0 (serialize returns `undefined`).
 */
export function createOptionalXdYDieBinding(opts: {
  domainPath: string;
  parseOptions: ParseXdYOptions;
  countZeroFallback: number;
  dieFallback: DieFace;
}): XdYScalarPatchBinding {
  const { domainPath, parseOptions, countZeroFallback, dieFallback } = opts;
  return {
    domainPath,
    parse: (v) => String(parseXdY(asDomainString(v), parseOptions).die),
    serialize: (uiVal, current) => {
      const currentStr = asDomainString(current);
      const parsed = parseXdY(currentStr, parseOptions);
      const vCount = toCountOrZero(parsed.count, countZeroFallback);
      if (vCount === 0) return undefined;
      return buildXdY({
        count: vCount,
        die: toDieFace(uiVal, dieFallback),
      });
    },
  };
}
