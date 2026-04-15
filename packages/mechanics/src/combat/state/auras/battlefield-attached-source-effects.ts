import { flattenSpellEffects } from '@/features/content/spells/domain/spellEffectGroups'
import type { Spell } from '@/features/content/spells/domain/types/spell.types'
import type { Monster } from '@/features/content/monsters/domain/types'
import type { Effect } from '@/features/mechanics/domain/effects/effects.types'
import type { AttachedBattlefieldEffectSource } from './attached-battlefield-source'
import { findMonsterSpecialActionByRuntimeActionId } from '@/features/mechanics/domain/combat/runtime/monster-action-runtime-ids'

export type BattlefieldAttachedSourceResolutionOptions = {
  spellLookup: (spellId: string) => Spell | undefined
  monstersById?: Record<string, Monster>
}

/** Loads authored spell effects (flattened groups) or monster action/trait effects for an attached aura. */
export function getEffectsForAttachedBattlefieldSource(
  source: AttachedBattlefieldEffectSource,
  opts: BattlefieldAttachedSourceResolutionOptions,
): Effect[] {
  switch (source.kind) {
    case 'spell': {
      if (typeof opts.spellLookup !== 'function') return []
      const spell = opts.spellLookup(source.spellId)
      return spell ? flattenSpellEffects(spell) : []
    }
    case 'monster-action': {
      const monster = opts.monstersById?.[source.monsterId]
      if (!monster) return []
      const found = findMonsterSpecialActionByRuntimeActionId(monster, source.actionId)
      return found?.action.effects ?? []
    }
    case 'monster-trait': {
      const monster = opts.monstersById?.[source.monsterId]
      const trait = monster?.mechanics.traits?.[source.traitIndex]
      return trait?.effects ?? []
    }
  }
}

export function getLabelForAttachedBattlefieldSource(
  source: AttachedBattlefieldEffectSource,
  opts: BattlefieldAttachedSourceResolutionOptions,
): string {
  switch (source.kind) {
    case 'spell':
      return typeof opts.spellLookup === 'function'
        ? opts.spellLookup(source.spellId)?.name ?? source.spellId
        : source.spellId
    case 'monster-action': {
      const monster = opts.monstersById?.[source.monsterId]
      const found = monster ? findMonsterSpecialActionByRuntimeActionId(monster, source.actionId) : undefined
      return found?.action.name ?? source.actionId
    }
    case 'monster-trait': {
      const monster = opts.monstersById?.[source.monsterId]
      const trait = monster?.mechanics.traits?.[source.traitIndex]
      return trait?.name ?? `trait-${source.traitIndex}`
    }
  }
}
