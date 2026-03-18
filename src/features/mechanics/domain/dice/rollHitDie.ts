import { rollDie } from '@/features/mechanics/domain/resolution/engines/dice.engine'

/** Roll a hit die and return HP gained (minimum 1). */
export function rollHitDie(hitDie: number, rng: () => number = Math.random): number {
  return Math.max(1, rollDie(hitDie, rng))
}
