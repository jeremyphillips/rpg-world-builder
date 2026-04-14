import { RITUAL_CASTING_TIME_BONUS_MINUTES } from './rules.constants';

export function resolveRitualCastingTimeInMinutes(normalMinutes: number): number {
  return normalMinutes + RITUAL_CASTING_TIME_BONUS_MINUTES;
}
