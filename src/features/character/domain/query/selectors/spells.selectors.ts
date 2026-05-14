import type { CharacterQueryContext } from '../characterQueryContext.types'

export function knowsSpell(ctx: CharacterQueryContext, spellId: string): boolean {
  return ctx.spells.knownSpellIds.has(spellId)
}
