/**
 * Presentation fields aligned with `CombatStatePresentation` in encounter (kept inline here so
 * mechanics/domain does not depend on encounter).
 */
type EffectConditionPresentationTone = 'danger' | 'warning' | 'info' | 'success' | 'neutral'
type EffectConditionPresentationPriority =
  | 'critical'
  | 'high'
  | 'normal'
  | 'low'
  | 'hidden'
type EffectConditionPresentationSection =
  | 'critical-now'
  | 'ongoing-effects'
  | 'restrictions'
  | 'turn-triggers'
  | 'system-details'

/**
 * PHB-style status conditions that effects can apply (`ConditionEffect`, saves, repeat saves, etc.).
 * Same authoring pattern as `elementalDamageTypes.ts` — table rows, then derived types.
 * Optional `rulesText` supports compendium-style copy without changing ids.
 *
 * **Data migration:** `id` values are stable identifiers in saved games and authored JSON (monsters,
 * spells, encounter state). Do not rename or reorder ids without a migration strategy; prefer
 * appending new conditions if you must preserve backward compatibility with existing saves.
 */
export const EFFECT_CONDITION_DEFINITIONS = [
  {
    id: 'blinded',
    name: 'Blinded',
    tone: 'warning' satisfies EffectConditionPresentationTone,
    priority: 'high' satisfies EffectConditionPresentationPriority,
    defaultSection: 'critical-now' satisfies EffectConditionPresentationSection,
    showInHeader: true,
    userFacing: true,
  },
  {
    id: 'charmed',
    name: 'Charmed',
    tone: 'warning' satisfies EffectConditionPresentationTone,
    priority: 'high' satisfies EffectConditionPresentationPriority,
    defaultSection: 'critical-now' satisfies EffectConditionPresentationSection,
    showInHeader: true,
    userFacing: true,
  },
  {
    id: 'deafened',
    name: 'Deafened',
    tone: 'warning' satisfies EffectConditionPresentationTone,
    priority: 'normal' satisfies EffectConditionPresentationPriority,
    defaultSection: 'restrictions' satisfies EffectConditionPresentationSection,
    userFacing: true,
  },
  {
    id: 'frightened',
    name: 'Frightened',
    tone: 'warning' satisfies EffectConditionPresentationTone,
    priority: 'high' satisfies EffectConditionPresentationPriority,
    defaultSection: 'critical-now' satisfies EffectConditionPresentationSection,
    showInHeader: true,
    userFacing: true,
  },
  {
    id: 'grappled',
    name: 'Grappled',
    tone: 'warning' satisfies EffectConditionPresentationTone,
    priority: 'high' satisfies EffectConditionPresentationPriority,
    defaultSection: 'critical-now' satisfies EffectConditionPresentationSection,
    showInHeader: true,
    userFacing: true,
  },
  {
    id: 'incapacitated',
    name: 'Incapacitated',
    tone: 'danger' satisfies EffectConditionPresentationTone,
    priority: 'critical' satisfies EffectConditionPresentationPriority,
    defaultSection: 'critical-now' satisfies EffectConditionPresentationSection,
    showInHeader: true,
    userFacing: true,
  },
  {
    id: 'invisible',
    name: 'Invisible',
    tone: 'info' satisfies EffectConditionPresentationTone,
    priority: 'high' satisfies EffectConditionPresentationPriority,
    defaultSection: 'critical-now' satisfies EffectConditionPresentationSection,
    showInHeader: true,
    userFacing: true,
  },
  {
    id: 'paralyzed',
    name: 'Paralyzed',
    tone: 'danger' satisfies EffectConditionPresentationTone,
    priority: 'critical' satisfies EffectConditionPresentationPriority,
    defaultSection: 'critical-now' satisfies EffectConditionPresentationSection,
    showInHeader: true,
    userFacing: true,
  },
  {
    id: 'petrified',
    name: 'Petrified',
    tone: 'danger' satisfies EffectConditionPresentationTone,
    priority: 'critical' satisfies EffectConditionPresentationPriority,
    defaultSection: 'critical-now' satisfies EffectConditionPresentationSection,
    showInHeader: true,
    userFacing: true,
  },
  {
    id: 'poisoned',
    name: 'Poisoned',
    tone: 'danger' satisfies EffectConditionPresentationTone,
    priority: 'high' satisfies EffectConditionPresentationPriority,
    defaultSection: 'critical-now' satisfies EffectConditionPresentationSection,
    showInHeader: true,
    userFacing: true,
  },
  {
    id: 'prone',
    name: 'Prone',
    tone: 'warning' satisfies EffectConditionPresentationTone,
    priority: 'high' satisfies EffectConditionPresentationPriority,
    defaultSection: 'critical-now' satisfies EffectConditionPresentationSection,
    showInHeader: true,
    userFacing: true,
  },
  {
    id: 'restrained',
    name: 'Restrained',
    tone: 'warning' satisfies EffectConditionPresentationTone,
    priority: 'high' satisfies EffectConditionPresentationPriority,
    defaultSection: 'critical-now' satisfies EffectConditionPresentationSection,
    showInHeader: true,
    userFacing: true,
  },
  {
    id: 'stunned',
    name: 'Stunned',
    tone: 'danger' satisfies EffectConditionPresentationTone,
    priority: 'critical' satisfies EffectConditionPresentationPriority,
    defaultSection: 'critical-now' satisfies EffectConditionPresentationSection,
    showInHeader: true,
    userFacing: true,
  },
  {
    id: 'unconscious',
    name: 'Unconscious',
    tone: 'danger' satisfies EffectConditionPresentationTone,
    priority: 'critical' satisfies EffectConditionPresentationPriority,
    defaultSection: 'critical-now' satisfies EffectConditionPresentationSection,
    showInHeader: true,
    userFacing: true,
  },
] as const satisfies ReadonlyArray<{
  readonly id: string
  readonly name: string
  readonly tone: EffectConditionPresentationTone
  readonly priority: EffectConditionPresentationPriority
  readonly defaultSection: EffectConditionPresentationSection
  readonly showInHeader?: boolean
  readonly userFacing?: boolean
  readonly rulesText?: string
}>

export type EffectConditionId = (typeof EFFECT_CONDITION_DEFINITIONS)[number]['id']

export const EFFECT_CONDITION_IDS: readonly EffectConditionId[] =
  EFFECT_CONDITION_DEFINITIONS.map((r) => r.id)

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
