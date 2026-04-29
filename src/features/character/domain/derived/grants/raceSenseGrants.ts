import type { Race } from '@/features/content/races/domain/types'
import { collectRaceCreatureSenses } from '@/features/content/races/domain/grants/collectRaceCreatureSenses'
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

/**
 * Map race grants + selected definition-option grants into {@link CreatureSenses}.
 */
export function buildCreatureSensesFromResolvedRace(
  race: Race | undefined,
  raceChoices?: Readonly<Record<string, string>> | undefined,
): CreatureSenses {
  const special = collectRaceCreatureSenses(race, raceChoices)
  if (!special.length) return { special: [] }
  return { special: [...special] }
}
