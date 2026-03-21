import type { EffectConditionId } from '@/features/mechanics/domain/effects/effects.types'
import { ABILITIES } from '@/features/mechanics/domain/character/abilities/abilities'

/**
 * Caster-chosen parameters for spells/actions (ability for Hex, glyph effect for Symbol, etc.).
 * Authored on spell `resolution`; copied to `CombatActionDefinition` by the spell combat adapter.
 */
export type CasterOptionField =
  | { kind: 'ability'; id: string; label: string }
  | { kind: 'enum'; id: string; label: string; options: { value: string; label: string }[] }

export function buildDefaultCasterOptions(fields: CasterOptionField[] | undefined): Record<string, string> {
  if (!fields?.length) return {}
  const out: Record<string, string> = {}
  for (const f of fields) {
    if (f.kind === 'ability') {
      out[f.id] = 'str'
    } else if (f.kind === 'enum' && f.options[0]) {
      out[f.id] = f.options[0].value
    }
  }
  return out
}

/** Human-readable suffix for combat log lines, e.g. ` (Ability: Strength; Effect: Death)`. */
export function formatCasterOptionSummary(
  fields: CasterOptionField[] | undefined,
  values: Record<string, string> | undefined,
): string {
  if (!fields?.length || !values) return ''
  const parts: string[] = []
  for (const f of fields) {
    const v = values[f.id]
    if (v == null || v === '') continue
    if (f.kind === 'ability') {
      const name = ABILITIES.find((a) => a.id === v)?.name ?? v
      parts.push(`${f.label}: ${name}`)
    } else {
      const label = f.options.find((o) => o.value === v)?.label ?? v
      parts.push(`${f.label}: ${label}`)
    }
  }
  return parts.length > 0 ? ` (${parts.join('; ')})` : ''
}

/**
 * Maps Antipathy/Sympathy caster enum values (authored on the spell) to engine condition ids.
 * Spell data keeps `antipathy` / `sympathy`; use this when applying `frightened` / `charmed`.
 */
export const ANTIPATHY_SYMPATHY_MODE_TO_CONDITION = {
  antipathy: 'frightened',
  sympathy: 'charmed',
} as const satisfies Record<'antipathy' | 'sympathy', EffectConditionId>

export function getConditionFromAntipathySympathyMode(value: string): EffectConditionId | undefined {
  if (value === 'antipathy') return ANTIPATHY_SYMPATHY_MODE_TO_CONDITION.antipathy
  if (value === 'sympathy') return ANTIPATHY_SYMPATHY_MODE_TO_CONDITION.sympathy
  return undefined
}
