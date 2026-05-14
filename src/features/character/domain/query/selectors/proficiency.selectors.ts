import type { CharacterQueryContext } from '../characterQueryContext.types'

export function isProficientInSkill(ctx: CharacterQueryContext, skillId: string): boolean {
  return ctx.proficiencies.skillIds.has(skillId)
}
