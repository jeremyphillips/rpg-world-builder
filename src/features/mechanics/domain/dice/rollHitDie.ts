/** Roll a hit die and return HP gained (minimum 1). */
export function rollHitDie(hitDie: number): number {
  const rolled = Math.floor(Math.random() * hitDie) + 1
  return Math.max(1, rolled)
}