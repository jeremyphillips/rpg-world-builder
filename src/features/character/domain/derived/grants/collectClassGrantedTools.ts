import type { CharacterClassInfo } from '@/features/character/domain/types'

import { resolveClassDef, type ResolveClassDefOptions } from './resolveClassDef'

/**
 * Fixed tool proficiency ids from class definitions, level-gated (multiclass-safe).
 * Prefer passing merged `classesById` so campaign/homebrew class defs participate; otherwise falls back to system catalog via {@link resolveClassDef}.
 */
export function collectClassGrantedToolIds(
  classes: readonly CharacterClassInfo[] | undefined,
  options: ResolveClassDefOptions = {},
): ReadonlySet<string> {
  const set = new Set<string>()
  for (const entry of classes ?? []) {
    if (!entry.classId) continue
    const def = resolveClassDef(entry.classId, options)
    const tools = def?.proficiencies?.tools
    if (!tools || tools.type !== 'fixed' || !tools.items?.length) continue
    if (entry.level < tools.level) continue
    for (const id of tools.items) set.add(id)
  }
  return set
}
