/**
 * Canonical action-economy activation ids (Action, Bonus Action, Reaction, Special) and PHB-style
 * reference text for rules UI, spell detail, and authoring. This is not a time-unit vocabulary;
 * duration and casting-time duration units live elsewhere.
 *
 * **Data stability:** `id` values appear in authored content and effect payloads. Do not rename ids
 * without a migration strategy.
 */

export const ACTION_ECONOMY_DEFINITIONS = [
  {
    id: 'action',
    name: 'Action',
    rulesText: 'Using this requires your Action.',
  },
  {
    id: 'bonus-action',
    name: 'Bonus Action',
    rulesText: 'Using this requires your Bonus Action.',
  },
  {
    id: 'reaction',
    name: 'Reaction',
    rulesText: 'Using this requires your Reaction, usually in response to a trigger.',
  },
  {
    id: 'special',
    name: 'Special',
    rulesText: 'This uses a special activation rule described in the effect or feature text.',
  },
] as const;

export type ActionEconomyKind = (typeof ACTION_ECONOMY_DEFINITIONS)[number]['id'];

/** Full row shape for a canonical action-economy kind (matches `ACTION_ECONOMY_DEFINITIONS` entries). */
export type ActionEconomyDefinition = {
  id: ActionEconomyKind;
  name: string;
  rulesText: string;
};

export const ACTION_ECONOMY_KINDS: readonly ActionEconomyKind[] =
  ACTION_ECONOMY_DEFINITIONS.map((r) => r.id);

const ACTION_ECONOMY_DEFINITION_BY_ID: ReadonlyMap<ActionEconomyKind, ActionEconomyDefinition> =
  new Map(ACTION_ECONOMY_DEFINITIONS.map((r) => [r.id, r]));

/** Lookup by id; undefined if unknown. */
export function getActionEconomyById(id: ActionEconomyKind): ActionEconomyDefinition | undefined {
  return ACTION_ECONOMY_DEFINITION_BY_ID.get(id);
}

/** Rules reference line for tooltips and help; undefined if unknown. */
export function getActionEconomyRulesText(id: ActionEconomyKind): string | undefined {
  return ACTION_ECONOMY_DEFINITION_BY_ID.get(id)?.rulesText;
}

/** Resolve rules text when `key` matches an `ActionEconomyKind`. */
export function getActionEconomyRulesTextForKey(key: string): string | undefined {
  if ((ACTION_ECONOMY_KINDS as readonly string[]).includes(key)) {
    return getActionEconomyRulesText(key as ActionEconomyKind);
  }
  return undefined;
}

/** Display name for an action-economy kind (from definitions), or the raw id if unknown. */
export function getActionEconomyName(id: ActionEconomyKind): string {
  return ACTION_ECONOMY_DEFINITION_BY_ID.get(id)?.name ?? id;
}

export { ACTION_ECONOMY_DEFINITION_BY_ID };
