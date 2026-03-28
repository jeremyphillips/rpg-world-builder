import type { Spell } from '@/features/content/spells/domain/types/spell.types'
import type { Effect } from '@/features/mechanics/domain/effects/effects.types'
import { walkNestedEffects } from './spell-resolution-audit'

export type SpellHostilityDerivation = 'hostile' | 'non-hostile' | 'unknown'

/**
 * Authoritative overrides for `state` effects that are not hostile applications
 * (wards, area setup, etc.). Unknown ids fall through to damage/save/default.
 */
export const SPELL_STATE_HOSTILITY: Readonly<Record<string, 'hostile' | 'non-hostile'>> = {
  hallowed: 'non-hostile',
}

/**
 * Derives whether a spell is a hostile application for encounter rules (charm, same-side targeting).
 * Use `unknown` to fall back to legacy `CombatActionTargetingProfile` + `isHostileAction` kind logic.
 */
export function deriveSpellHostility(spell: Spell): SpellHostilityDerivation {
  const resolution = spell.resolution
  if (resolution?.hostileIntent === true) return 'hostile'
  if (resolution?.hostileIntent === false) return 'non-hostile'

  const root = spell.effects ?? []
  const targeting = root.find((e) => e.kind === 'targeting')
  if (targeting?.kind === 'targeting' && targeting.requiresWilling) return 'non-hostile'

  if (root.some((e) => e.kind === 'hit-points' && e.mode === 'heal')) {
    return 'non-hostile'
  }

  let hasDamage = false
  let hasSave = false
  /** True when a `state` effect maps to non-hostile in `SPELL_STATE_HOSTILITY` (closure-safe for TS). */
  let stateRegistryNonHostile = false

  walkNestedEffects(root, (e: Effect) => {
    if (e.kind === 'damage') hasDamage = true
    if (e.kind === 'save') hasSave = true
    if (e.kind === 'state' && e.stateId) {
      const mapped = SPELL_STATE_HOSTILITY[e.stateId]
      if (mapped === 'non-hostile') stateRegistryNonHostile = true
    }
  })

  if (hasDamage) return 'hostile'
  if (hasSave) return 'hostile'
  if (stateRegistryNonHostile) return 'non-hostile'

  return 'unknown'
}

export function spellHostilityToHostileApplication(
  derivation: SpellHostilityDerivation,
): boolean | undefined {
  if (derivation === 'unknown') return undefined
  return derivation === 'hostile'
}
