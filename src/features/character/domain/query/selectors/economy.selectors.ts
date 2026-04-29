import type { CharacterQueryContext } from '../characterQueryContext.types'

export function canAffordCostCp(ctx: CharacterQueryContext, costCp: number): boolean {
  return ctx.economy.totalWealthCp >= costCp
}
