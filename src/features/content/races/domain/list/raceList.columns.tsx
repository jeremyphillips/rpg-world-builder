import type { AppDataGridColumn } from '@/ui/patterns';
import type { RaceListRow } from './raceList.types';

/**
 * Returns custom columns for the race list.
 * Races use only shared campaign content columns; no custom columns.
 */
export function buildRaceCustomColumns(): AppDataGridColumn<RaceListRow>[] {
  return [];
}
