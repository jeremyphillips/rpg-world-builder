import type { Monster } from '@/features/content/monsters/domain/types'
import type { MonsterAction, MonsterSpecialAction } from '@/features/content/monsters/domain/types/monster-actions.types'
import type { CombatActionCost } from '@/features/mechanics/domain/encounter/resolution/combat-action.types'

/** Matches {@link buildMonsterActionDefinition} id generation for stable lookup. */
export function buildMonsterActionRuntimeId(
  monster: Monster,
  action: MonsterAction,
  index: number,
  cost: CombatActionCost,
): string {
  const slot = cost.bonusAction ? 'bonus' : 'action'
  if (action.kind === 'weapon') {
    return `${monster.id}-action-${action.weaponRef}-${index}-${slot}`
  }
  if (action.kind === 'natural') {
    return `${monster.id}-natural-${index}-${slot}`
  }
  return `${monster.id}-special-${index}-${slot}`
}

export function findMonsterSpecialActionByRuntimeActionId(
  monster: Monster,
  actionId: string,
): { action: MonsterSpecialAction; index: number; cost: CombatActionCost } | undefined {
  for (let index = 0; index < (monster.mechanics.actions ?? []).length; index++) {
    const a = monster.mechanics.actions![index]
    if (a.kind !== 'special') continue
    if (buildMonsterActionRuntimeId(monster, a, index, { action: true }) === actionId) {
      return { action: a, index, cost: { action: true } }
    }
  }
  for (let index = 0; index < (monster.mechanics.bonusActions ?? []).length; index++) {
    const a = monster.mechanics.bonusActions![index]
    if (a.kind !== 'special') continue
    if (buildMonsterActionRuntimeId(monster, a, index, { bonusAction: true }) === actionId) {
      return { action: a, index, cost: { bonusAction: true } }
    }
  }
  return undefined
}
