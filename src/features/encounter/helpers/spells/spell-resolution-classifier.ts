import type { Spell } from '@/features/content/spells/domain/types/spell.types'

/** Effect kinds that only carry UI/text or targeting shape — never alone justify `effects` resolution mode. */
const SUPPORT_ONLY_KINDS = new Set<string>(['note', 'targeting'])

/**
 * Effect kinds that `applyActionEffects` resolves with meaningful mechanical impact
 * (or registers turn hooks / markers), as opposed to log-only or unsupported kinds.
 */
const FULLY_ACTIONABLE_KINDS = new Set<string>([
  'damage',
  'save',
  'hit-points',
  'condition',
  'state',
  'roll-modifier',
  'modifier',
  'immunity',
  'interval',
  'remove-classification',
  'spawn',
])

/**
 * Maps a spell to how its combat action should be resolved.
 *
 * - `attack-roll` — spell container has `deliveryMethod` (primary delivery is a spell attack).
 * - `effects` — at least one fully actionable effect kind besides note/targeting alone (includes **`spawn`**; adapter uses `targeting: none`).
 * - `log-only` — empty effects, note/targeting only, or only kinds the adapter does not treat as mechanically actionable here (e.g. `grant`, `move`).
 */
export function classifySpellResolutionMode(spell: Spell): 'attack-roll' | 'effects' | 'log-only' {
  if (spell.deliveryMethod) return 'attack-roll'

  const effects = spell.effects ?? []
  if (effects.length === 0) return 'log-only'
  if (effects.every((e) => SUPPORT_ONLY_KINDS.has(e.kind))) return 'log-only'
  if (effects.some((e) => FULLY_ACTIONABLE_KINDS.has(e.kind))) return 'effects'
  /** `emanation` is structural (attached battlefield aura); the combat adapter resolves it, not log-only. */
  if (effects.some((e) => e.kind === 'emanation')) return 'effects'

  return 'log-only'
}

export function isFullyActionableEffectKind(kind: string): boolean {
  return FULLY_ACTIONABLE_KINDS.has(kind)
}
