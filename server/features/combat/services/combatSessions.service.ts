import {
  startEncounterFromSetup,
  type CombatStartupInput,
  type CombatStartupResult,
} from '@rpg-world-builder/mechanics'

export type CombatStartupBodyParseError = {
  code: 'invalid-body'
  message: string
}

/**
 * JSON request body matches {@link CombatStartupInput} except `rng` (non-serializable).
 * The engine applies defaults when `rng` is omitted.
 */
export function parseCombatStartupBody(
  body: unknown,
): { ok: true; input: CombatStartupInput } | { ok: false; error: CombatStartupBodyParseError } {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return {
      ok: false,
      error: {
        code: 'invalid-body',
        message: 'Request body must be a JSON object.',
      },
    }
  }
  const record = body as Record<string, unknown>
  if (!Array.isArray(record.combatants)) {
    return {
      ok: false,
      error: {
        code: 'invalid-body',
        message: 'Expected property "combatants" to be an array.',
      },
    }
  }
  return { ok: true, input: body as CombatStartupInput }
}

export function startCombatSession(input: CombatStartupInput): CombatStartupResult {
  return startEncounterFromSetup(input)
}
