import type { CombatantInstance } from '../types'

export function getCombatantBaseMovement(combatant: CombatantInstance): number {
  const speeds = Object.values(combatant.stats.speeds ?? {}).filter(
    (speed): speed is number => typeof speed === 'number' && speed > 0,
  )
  return speeds.length > 0 ? Math.max(...speeds) : 0
}
