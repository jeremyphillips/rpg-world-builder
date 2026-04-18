import type { Race } from '@/features/content/races/domain/types'
import type { CreatureSenses } from '@/features/content/shared/domain/vocab/creatureSenses.types'
import { getSystemRace } from '@/features/mechanics/domain/rulesets/system/races'
import type { SystemRulesetId } from '@/features/mechanics/domain/rulesets/types/ruleset.types'

export type ResolveRaceForCharacterOpts = {
  rulesetId: SystemRulesetId
  /** Campaign-merged catalog (preferred); falls back to system races only. */
  racesById?: Readonly<Record<string, Race>>
}

/**
 * Resolve the race document for a character's persisted race id.
 */
export function resolveRaceForCharacter(
  raceId: string | null | undefined,
  opts: ResolveRaceForCharacterOpts,
): Race | undefined {
  if (!raceId) return undefined
  const fromCatalog = opts.racesById?.[raceId]
  if (fromCatalog) return fromCatalog
  return getSystemRace(opts.rulesetId, raceId)
}

/** Map `race.grants.senses` into normalized {@link CreatureSenses} for engine/UI. */
export function buildCreatureSensesFromResolvedRace(race: Race | undefined): CreatureSenses {
  const senses = race?.grants?.senses
  if (!senses?.length) return { special: [] }
  return { special: [...senses] }
}
