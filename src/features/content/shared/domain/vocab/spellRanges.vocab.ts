/**
 * Canonical spell range kind ids and PHB-style reference text for spells, rules UI, and authoring.
 * Authored spell shape (`SpellRange` in spell types) stays a discriminated union; this module owns stable
 * `kind` ids and display metadata only.
 *
 * **Data stability:** `id` values appear in authored spell data. Do not rename without a migration strategy.
 */

export const SPELL_RANGE_DEFINITIONS = [
  {
    id: 'self',
    name: 'Self',
    rulesText: 'The spell targets only the caster or originates from the caster.',
  },
  {
    id: 'touch',
    name: 'Touch',
    rulesText: 'The caster must touch the target to affect it.',
  },
  {
    id: 'distance',
    name: 'Distance',
    rulesText: 'The spell has a specified range measured by distance.',
  },
  {
    id: 'sight',
    name: 'Sight',
    rulesText: 'The spell can target a point or creature within the caster’s line of sight.',
  },
  {
    id: 'unlimited',
    name: 'Unlimited',
    rulesText: 'The spell is not limited by ordinary distance.',
  },
  {
    id: 'special',
    name: 'Special',
    rulesText: 'The spell uses a special targeting or range rule described in its text.',
  },
] as const;

export type SpellRangeKind = (typeof SPELL_RANGE_DEFINITIONS)[number]['id'];

/** Full row shape for a canonical range kind (matches `SPELL_RANGE_DEFINITIONS` entries). */
export type SpellRangeDefinition = (typeof SPELL_RANGE_DEFINITIONS)[number];

export const SPELL_RANGE_KINDS: readonly SpellRangeKind[] = SPELL_RANGE_DEFINITIONS.map((r) => r.id);

const SPELL_RANGE_DEFINITION_BY_ID: ReadonlyMap<SpellRangeKind, SpellRangeDefinition> = new Map(
  SPELL_RANGE_DEFINITIONS.map((r) => [r.id, r]),
);

/** Lookup by id; undefined if unknown. */
export function getSpellRangeById(rangeId: SpellRangeKind): SpellRangeDefinition | undefined {
  return SPELL_RANGE_DEFINITION_BY_ID.get(rangeId);
}

/** Rules reference line for tooltips and help; undefined if unknown. */
export function getSpellRangeRulesText(rangeId: SpellRangeKind): string | undefined {
  return SPELL_RANGE_DEFINITION_BY_ID.get(rangeId)?.rulesText;
}

/** Resolve rules text when `key` matches a `SpellRangeKind`. */
export function getSpellRangeRulesTextForKey(key: string): string | undefined {
  if ((SPELL_RANGE_KINDS as readonly string[]).includes(key)) {
    return getSpellRangeRulesText(key as SpellRangeKind);
  }
  return undefined;
}

/** Display name for a range kind (from definitions), or the raw kind if unknown. */
export function getSpellRangeKindName(kind: SpellRangeKind): string {
  return SPELL_RANGE_DEFINITION_BY_ID.get(kind)?.name ?? kind;
}

export { SPELL_RANGE_DEFINITION_BY_ID };
