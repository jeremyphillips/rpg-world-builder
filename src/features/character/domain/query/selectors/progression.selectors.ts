import type { CharacterQueryContext } from '../characterQueryContext.types'

export function hasClass(ctx: CharacterQueryContext, classId: string): boolean {
  return ctx.progression.classIds.has(classId)
}

export function classLevel(ctx: CharacterQueryContext, classId: string): number {
  return ctx.progression.classLevelsById.get(classId) ?? 0
}

export function meetsLevelRequirement(ctx: CharacterQueryContext, minLevel: number): boolean {
  return ctx.progression.totalLevel >= minLevel
}
