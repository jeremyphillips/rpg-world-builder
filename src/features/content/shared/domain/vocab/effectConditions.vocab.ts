/**
 * User-facing canonical definitions for PHB-style status conditions (effects, saves, immunity).
 * Mechanics `CONDITION_RULES` holds runtime consequences only; this module owns display metadata.
 *
 * **Data migration:** `id` values are stable in saved games and authored JSON. Do not rename ids
 * without a migration strategy; prefer appending new conditions.
 */

export type EffectConditionPresentationTone = 'danger' | 'warning' | 'info' | 'success' | 'neutral'
export type EffectConditionPresentationPriority =
  | 'critical'
  | 'high'
  | 'normal'
  | 'low'
  | 'hidden'
export type EffectConditionPresentationSection =
  | 'critical-now'
  | 'ongoing-effects'
  | 'restrictions'
  | 'turn-triggers'
  | 'system-details'

export const EFFECT_CONDITION_DEFINITIONS = [
  {
    id: 'blinded',
    name: 'Blinded',
    tone: 'warning',
    priority: 'high',
    defaultSection: 'critical-now',
    userFacing: true,
    rulesText:
      "A blinded creature can't see and automatically fails ability checks that require sight. Attack rolls against the creature have advantage, and the creature's attack rolls have disadvantage.",
  },
  {
    id: 'charmed',
    name: 'Charmed',
    tone: 'warning',
    priority: 'high',
    defaultSection: 'critical-now',
    userFacing: true,
    rulesText:
      "A charmed creature can't attack the charmer or target the charmer with harmful abilities. The charmer has advantage on social checks against the creature.",
  },
  {
    id: 'deafened',
    name: 'Deafened',
    tone: 'warning',
    priority: 'normal',
    defaultSection: 'restrictions',
    userFacing: true,
    rulesText:
      "A deafened creature can't hear and automatically fails ability checks that require hearing.",
  },
  {
    id: 'frightened',
    name: 'Frightened',
    tone: 'warning',
    priority: 'high',
    defaultSection: 'critical-now',
    userFacing: true,
    rulesText:
      'A frightened creature has disadvantage on ability checks and attack rolls while the source of fear is in line of sight. The creature cannot willingly move closer to that source.',
  },
  {
    id: 'grappled',
    name: 'Grappled',
    tone: 'warning',
    priority: 'high',
    defaultSection: 'critical-now',
    userFacing: true,
    rulesText:
      "A grappled creature's speed becomes 0, and it can't benefit from any bonus to speed. The condition ends if the grappler is incapacitated or if an effect removes the grappled creature from the grappler's reach.",
  },
  {
    id: 'incapacitated',
    name: 'Incapacitated',
    tone: 'danger',
    priority: 'critical',
    defaultSection: 'critical-now',
    userFacing: true,
    rulesText:
      "An incapacitated creature can't take actions or reactions.",
  },
  {
    id: 'invisible',
    name: 'Invisible',
    tone: 'info',
    priority: 'high',
    defaultSection: 'critical-now',
    userFacing: true,
    rulesText:
      "An invisible creature is impossible to see without special senses; attack rolls against it have disadvantage, and its attack rolls have advantage. It is still revealed by noise, tracks, etc.",
  },
  {
    id: 'paralyzed',
    name: 'Paralyzed',
    tone: 'danger',
    priority: 'critical',
    defaultSection: 'critical-now',
    userFacing: true,
    rulesText:
      "A paralyzed creature is incapacitated and can't move or speak. It automatically fails Strength and Dexterity saving throws. Attack rolls against it have advantage; melee hits from 5 feet are critical hits.",
  },
  {
    id: 'petrified',
    name: 'Petrified',
    tone: 'danger',
    priority: 'critical',
    defaultSection: 'critical-now',
    userFacing: true,
    rulesText:
      'A petrified creature is transformed to stone, weighs 10× as much, and is incapacitated. It has resistance to all damage and immunity to poison and disease. Attack rolls against it have advantage.',
  },
  {
    id: 'poisoned',
    name: 'Poisoned',
    tone: 'danger',
    priority: 'high',
    defaultSection: 'critical-now',
    userFacing: true,
    rulesText:
      'A poisoned creature has disadvantage on attack rolls and ability checks.',
  },
  {
    id: 'prone',
    name: 'Prone',
    tone: 'warning',
    priority: 'high',
    defaultSection: 'critical-now',
    userFacing: true,
    rulesText:
      'A prone creature can only crawl unless it stands, ending the condition. Melee attacks against it have advantage; ranged attacks have disadvantage. Its own attacks have disadvantage unless it stands.',
  },
  {
    id: 'restrained',
    name: 'Restrained',
    tone: 'warning',
    priority: 'high',
    defaultSection: 'critical-now',
    userFacing: true,
    rulesText:
      "A restrained creature's speed is 0; attack rolls against it have advantage, and it has disadvantage on Dexterity saving throws.",
  },
  {
    id: 'stunned',
    name: 'Stunned',
    tone: 'danger',
    priority: 'critical',
    defaultSection: 'critical-now',
    userFacing: true,
    rulesText:
      "A stunned creature is incapacitated, can't move, and can speak only falteringly. It automatically fails Strength and Dexterity saving throws; attack rolls against it have advantage.",
  },
  {
    id: 'unconscious',
    name: 'Unconscious',
    tone: 'danger',
    priority: 'critical',
    defaultSection: 'critical-now',
    userFacing: true,
    rulesText:
      "An unconscious creature is incapacitated, can't move or speak, and is unaware of its surroundings. It drops what it's holding and falls prone. Attack rolls against it have advantage; hits from 5 feet are critical hits.",
  },
] as const satisfies ReadonlyArray<{
  readonly id: string
  readonly name: string
  readonly tone: EffectConditionPresentationTone
  readonly priority: EffectConditionPresentationPriority
  readonly defaultSection: EffectConditionPresentationSection
  readonly userFacing?: boolean
  readonly rulesText?: string
}>

export type EffectConditionId = (typeof EFFECT_CONDITION_DEFINITIONS)[number]['id']

/** Full row shape for a core effect condition (matches `EFFECT_CONDITION_DEFINITIONS` entries). */
export type EffectConditionDefinition = (typeof EFFECT_CONDITION_DEFINITIONS)[number]

export const EFFECT_CONDITION_IDS: readonly EffectConditionId[] =
  EFFECT_CONDITION_DEFINITIONS.map((r) => r.id)

const EFFECT_CONDITION_BY_ID: ReadonlyMap<EffectConditionId, (typeof EFFECT_CONDITION_DEFINITIONS)[number]> =
  new Map(EFFECT_CONDITION_DEFINITIONS.map((r) => [r.id, r]))

/** Lookup by id; undefined if unknown. */
export function getEffectConditionById(
  id: EffectConditionId,
): (typeof EFFECT_CONDITION_DEFINITIONS)[number] | undefined {
  return EFFECT_CONDITION_BY_ID.get(id)
}

/** SRD-style rules blurb for tooltips; undefined if id is unknown. */
export function getEffectConditionRulesText(id: EffectConditionId): string | undefined {
  return EFFECT_CONDITION_BY_ID.get(id)?.rulesText
}

/** Resolve rules text when `key` matches an `EffectConditionId` (e.g. presentable effect keys). */
export function getEffectConditionRulesTextForKey(key: string): string | undefined {
  if ((EFFECT_CONDITION_IDS as readonly string[]).includes(key)) {
    return getEffectConditionRulesText(key as EffectConditionId)
  }
  return undefined
}
