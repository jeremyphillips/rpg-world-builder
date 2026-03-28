import type { Spell } from '@/features/content/spells/domain/types/spell.types'
import type { Monster } from '@/features/content/monsters/domain/types'
import type { Effect } from '@/features/mechanics/domain/effects/effects.types'
import type { AttachedBattlefieldEffectSource } from './attached-battlefield-source'
import { findMonsterSpecialActionByRuntimeActionId } from '@/features/encounter/helpers/monster-action-runtime-ids'

export type BattlefieldAttachedSourceResolutionOptions = {
  spellLookup: (spellId: string) => Spell | undefined
  monstersById?: Record<string, Monster>
}

/** Loads authored top-level `effects` for an attached aura (spell data or monster special action). */
export function getEffectsForAttachedBattlefieldSource(
  source: AttachedBattlefieldEffectSource,
  opts: BattlefieldAttachedSourceResolutionOptions,
): Effect[] {
  switch (source.kind) {
    case 'spell': {
      const spell = opts.spellLookup(source.spellId)
      return spell?.effects ?? []
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
      return opts.spellLookup(source.spellId)?.name ?? source.spellId
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
