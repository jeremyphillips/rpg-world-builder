/**
 * Canonical trigger ids and PHB-style reference text for effect triggers, conditions, and rules UI.
 * Mechanics keeps alias inputs (`TriggerInput`) and normalization in `packages/mechanics`; this module
 * owns stable ids + display metadata only.
 *
 * **Data stability:** `id` values are used in authored effects and conditions. Do not rename without
 * a migration strategy; prefer adding new triggers.
 */

export const TRIGGER_DEFINITIONS = [
  {
    id: 'attack',
    name: 'Attack',
    rulesText: 'Triggers when an attack is made.',
  },
  {
    id: 'weapon-hit',
    name: 'Weapon Hit',
    rulesText: 'Triggers when a weapon attack hits a target.',
  },
  {
    id: 'hit',
    name: 'Hit',
    rulesText: 'Triggers when an attack hits a target.',
  },
  {
    id: 'damage-dealt',
    name: 'Damage Dealt',
    rulesText: 'Triggers when damage is dealt to a creature or object.',
  },
  {
    id: 'damage-taken',
    name: 'Damage Taken',
    rulesText: 'Triggers when the creature or object takes damage.',
  },
  {
    id: 'turn-start',
    name: 'Turn Start',
    rulesText: 'Triggers at the start of the turn.',
  },
  {
    id: 'turn-end',
    name: 'Turn End',
    rulesText: 'Triggers at the end of the turn.',
  },
  {
    id: 'spell-cast',
    name: 'Spell Cast',
    rulesText: 'Triggers when a spell is cast.',
  },
] as const;

export type TriggerId = (typeof TRIGGER_DEFINITIONS)[number]['id'];

/** Full row shape for a canonical trigger (matches `TRIGGER_DEFINITIONS` entries). */
export type TriggerDefinition = (typeof TRIGGER_DEFINITIONS)[number];

export const TRIGGER_IDS: readonly TriggerId[] = TRIGGER_DEFINITIONS.map((r) => r.id);

const TRIGGER_DEFINITION_BY_ID: ReadonlyMap<TriggerId, TriggerDefinition> = new Map(
  TRIGGER_DEFINITIONS.map((r) => [r.id, r]),
);

/** Lookup by id; undefined if unknown. */
export function getTriggerById(triggerId: TriggerId): TriggerDefinition | undefined {
  return TRIGGER_DEFINITION_BY_ID.get(triggerId);
}

/** Rules reference line for tooltips and help; undefined if unknown. */
export function getTriggerRulesText(triggerId: TriggerId): string | undefined {
  return TRIGGER_DEFINITION_BY_ID.get(triggerId)?.rulesText;
}

/** Resolve rules text when `key` matches a `TriggerId` (e.g. dynamic keys from effects). */
export function getTriggerRulesTextForKey(key: string): string | undefined {
  if ((TRIGGER_IDS as readonly string[]).includes(key)) {
    return getTriggerRulesText(key as TriggerId);
  }
  return undefined;
}

export { TRIGGER_DEFINITION_BY_ID };
