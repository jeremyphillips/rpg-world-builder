import type { Race } from '@/features/content/races/domain/types';
import type { CreatureSense } from '@/features/content/shared/domain/vocab/creatureSenses.types';

/**
 * Merge base race senses with senses from the selected {@link RaceDefinitionOption}(s).
 * Keys of `raceChoices` are {@link import('../types/race-definitions.types').RaceDefinitionGroup} `id` values; values are option `id`s.
 */
export function collectRaceCreatureSenses(
  race: Race | undefined,
  raceChoices: Readonly<Record<string, string>> | undefined,
): CreatureSense[] {
  if (!race) return [];
  const rows: CreatureSense[] = [];
  const base = race.grants?.senses;
  if (base?.length) rows.push(...base);

  const groups = race.definitionGroups;
  if (!groups?.length || !raceChoices) return rows;

  for (const g of groups) {
    const optId = raceChoices[g.id];
    if (!optId) continue;
    const opt = g.options.find((o) => o.id === optId);
    const senses = opt?.grants?.senses;
    if (senses?.length) rows.push(...senses);
  }
  return rows;
}
