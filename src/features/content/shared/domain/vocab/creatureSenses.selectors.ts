import type { CreatureSenseType, CreatureSenses } from './creatureSenses.types'

/**
 * Normalize authored senses (e.g. optional `special` from legacy blobs) into {@link CreatureSenses}.
 */
export function normalizeCreatureSenses(
  input: Partial<CreatureSenses> | null | undefined,
): CreatureSenses {
  const special = input?.special
  return {
    special: Array.isArray(special) ? [...special] : [],
    ...(input?.passivePerception != null ? { passivePerception: input.passivePerception } : {}),
  }
}

function maxNumericRangeForType(
  senses: CreatureSenses | undefined,
  type: CreatureSenseType,
): number | undefined {
  const list = senses?.special
  if (!list?.length) return undefined
  let max = 0
  for (const s of list) {
    if (s.type !== type) continue
    if (typeof s.range === 'number' && s.range > max) max = s.range
  }
  return max > 0 ? max : undefined
}

/**
 * Highest numeric range (ft) among senses of `type`. Multiple entries of the same type use the max range.
 * Does not infer unlimited range when entries lack `range`.
 */
export function getCreatureSenseRange(
  senses: CreatureSenses | undefined,
  type: CreatureSenseType,
): number | undefined {
  return maxNumericRangeForType(senses, type)
}

/** True if any sense of `type` is present (with or without numeric range). */
export function hasCreatureSense(senses: CreatureSenses | undefined, type: CreatureSenseType): boolean {
  return senses?.special?.some((s) => s.type === type) ?? false
}

/** Highest numeric darkvision range (ft), or undefined if none with a numeric range. */
export function getDarkvisionRange(senses: CreatureSenses | undefined): number | undefined {
  return getCreatureSenseRange(senses, 'darkvision')
}
