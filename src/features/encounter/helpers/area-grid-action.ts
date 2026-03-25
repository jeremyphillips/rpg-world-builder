import type { CombatActionDefinition } from '@/features/mechanics/domain/encounter'

export type AoeStep = 'none' | 'placing' | 'confirm'

export function isAreaGridAction(action: CombatActionDefinition | undefined | null): boolean {
  return Boolean(action?.targeting?.kind === 'all-enemies' && action.areaTemplate)
}

export function isSelfCenteredAreaAction(action: CombatActionDefinition | undefined | null): boolean {
  return Boolean(isAreaGridAction(action) && action?.areaPlacement === 'self')
}
