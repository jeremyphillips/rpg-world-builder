import type { AppDataGridFilter } from '@/ui/patterns';
import type { RaceListRow } from './raceList.types';

/**
 * Returns custom filters for the race list.
 * Races use only shared campaign content filters; no custom filters.
 */
export function buildRaceCustomFilters(): AppDataGridFilter<RaceListRow>[] {
  return [];
}
