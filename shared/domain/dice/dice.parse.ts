import type { DieFace } from './dice.definitions';
import { DIE_FACES } from './dice.definitions';

export type ParsedXdY = { count: number; die: DieFace };

/**
 * Parses value to DieFace. Validates against DIE_FACES; returns fallback if invalid.
 */
export function toDieFace(value: unknown, fallback: DieFace): DieFace {
  const n = typeof value === 'number' ? value : parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(n)) return fallback;
  return DIE_FACES.includes(n as DieFace) ? (n as DieFace) : fallback;
}

/**
 * Parses value to count. Clamps to >= 1; returns fallback if invalid.
 */
export function toCount(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, n);
}

/**
 * Parses value to count, allowing 0 (for optional versatile).
 */
export function toCountOrZero(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, n);
}

export type ParseXdYOptions = {
  defaultCount?: number;
  defaultDie?: DieFace;
};

/**
 * Parses XdY strings (e.g. "2d6") into { count, die }.
 * Accepts only ^\d+d\d+$ (case-insensitive). No modifiers.
 */
export function parseXdY(s: string | undefined, opts?: ParseXdYOptions): ParsedXdY {
  const defaultCount = opts?.defaultCount ?? 1;
  const defaultDie = opts?.defaultDie ?? 6;
  const minCount = defaultCount === 0 ? 0 : 1;

  if (!s || typeof s !== 'string' || !s.trim()) {
    return { count: defaultCount, die: defaultDie };
  }
  const m = s.trim().match(/^(\d+)d(\d+)$/i);
  if (!m) {
    return { count: defaultCount, die: defaultDie };
  }
  const count = Math.max(minCount, parseInt(m[1], 10) || defaultCount);
  const dieNum = parseInt(m[2], 10);
  const die: DieFace = DIE_FACES.includes(dieNum as DieFace)
    ? (dieNum as DieFace)
    : defaultDie;
  return { count, die };
}

/**
 * Builds an XdY string from parsed parts.
 */
export function buildXdY(parts: ParsedXdY): string {
  return `${parts.count}d${parts.die}`;
}
