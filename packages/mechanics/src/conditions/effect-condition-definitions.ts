/**
 * Re-exports shared effect-condition catalog + mechanics-only immunity extensions.
 * User-facing condition metadata lives in `@/features/content/shared/domain/vocab/effectConditions.vocab`.
 */
import type { EffectConditionId } from '@/features/content/shared/domain/vocab/effectConditions.vocab'
import { getEffectConditionDisplayName } from '@/features/content/shared/domain/vocab/effectConditions.vocab'

export type {
  EffectConditionDefinition,
  EffectConditionId,
  EffectConditionPresentationPriority,
  EffectConditionPresentationSection,
  EffectConditionPresentationTone,
} from '@/features/content/shared/domain/vocab/effectConditions.vocab'
export {
  EFFECT_CONDITION_DEFINITIONS,
  EFFECT_CONDITION_IDS,
  getEffectConditionById,
  getEffectConditionDisplayName,
  getEffectConditionRulesText,
  getEffectConditionRulesTextForKey,
} from '@/features/content/shared/domain/vocab/effectConditions.vocab'

/**
 * Condition ids that appear in immunity grants / stat blocks but are not `EffectConditionId`
 * payloads on effects (e.g. exhaustion is tracked separately from the 14 standard conditions).
 */
export const CONDITION_IMMUNITY_ONLY_DEFINITIONS = [
  { id: 'exhaustion', name: 'Exhaustion' },
] as const

export type ConditionImmunityOnlyId =
  (typeof CONDITION_IMMUNITY_ONLY_DEFINITIONS)[number]['id']

export type ConditionImmunityId = EffectConditionId | ConditionImmunityOnlyId

export const CONDITION_IMMUNITY_ONLY_IDS: readonly ConditionImmunityOnlyId[] =
  CONDITION_IMMUNITY_ONLY_DEFINITIONS.map((r) => r.id)

/**
 * Display label for any {@link ConditionImmunityId} (standard conditions + immunity-only ids like exhaustion).
 */
export function getConditionImmunityDisplayName(id: string): string | undefined {
  const fromEffects = getEffectConditionDisplayName(id)
  if (fromEffects) return fromEffects
  return CONDITION_IMMUNITY_ONLY_DEFINITIONS.find((r) => r.id === id)?.name
}

/**
 * Damage-type ids that imply a matching condition immunity. When a monster
 * lists `'poison'` in its immunities array, the partition automatically
 * infers `'poisoned'` as a condition immunity — authors no longer need both.
 */
export const DAMAGE_IMPLIES_CONDITION: Readonly<Record<string, ConditionImmunityId>> = {
  poison: 'poisoned',
}
