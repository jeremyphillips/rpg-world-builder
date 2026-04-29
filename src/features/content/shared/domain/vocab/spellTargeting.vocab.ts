/**
 * Canonical spell / effect-group targeting axes: **selection** (how many / spatial mode) and
 * **targetType** (what may be targeted). Used by mechanics `TargetingEffect` and spell `effectGroups`.
 */

export const TARGET_SELECTION_DEFINITIONS = [
  { id: 'one', name: 'One', rulesText: 'Targets one eligible target.' },
  {
    id: 'chosen',
    name: 'Chosen',
    rulesText: 'Targets eligible targets of your choice.',
  },
  {
    id: 'in-area',
    name: 'In Area',
    rulesText: 'Targets eligible targets within the affected area.',
  },
  {
    id: 'entered-during-move',
    name: 'Entered During Move',
    rulesText:
      'Targets eligible targets that enter the relevant area or space during movement.',
  },
] as const;

export type TargetSelectionKind = (typeof TARGET_SELECTION_DEFINITIONS)[number]['id'];

export const TARGET_ELIGIBILITY_DEFINITIONS = [
  { id: 'creature', name: 'Creature', rulesText: 'Targets creatures.' },
  {
    id: 'dead-creature',
    name: 'Dead Creature',
    rulesText: 'Targets dead creatures.',
  },
  { id: 'object', name: 'Object', rulesText: 'Targets objects.' },
] as const;

export type TargetEligibilityKind = (typeof TARGET_ELIGIBILITY_DEFINITIONS)[number]['id'];

export type TargetSelectionDefinition = (typeof TARGET_SELECTION_DEFINITIONS)[number];
export type TargetEligibilityDefinition = (typeof TARGET_ELIGIBILITY_DEFINITIONS)[number];

export const TARGET_SELECTION_KINDS: readonly TargetSelectionKind[] =
  TARGET_SELECTION_DEFINITIONS.map((r) => r.id);

export const TARGET_ELIGIBILITY_KINDS: readonly TargetEligibilityKind[] =
  TARGET_ELIGIBILITY_DEFINITIONS.map((r) => r.id);

const TARGET_SELECTION_BY_ID: ReadonlyMap<TargetSelectionKind, TargetSelectionDefinition> =
  new Map(TARGET_SELECTION_DEFINITIONS.map((r) => [r.id, r]));

const TARGET_ELIGIBILITY_BY_ID: ReadonlyMap<TargetEligibilityKind, TargetEligibilityDefinition> =
  new Map(TARGET_ELIGIBILITY_DEFINITIONS.map((r) => [r.id, r]));

export function getTargetSelectionById(
  id: TargetSelectionKind,
): TargetSelectionDefinition | undefined {
  return TARGET_SELECTION_BY_ID.get(id);
}

export function getTargetEligibilityById(
  id: TargetEligibilityKind,
): TargetEligibilityDefinition | undefined {
  return TARGET_ELIGIBILITY_BY_ID.get(id);
}

export function getTargetSelectionRulesText(id: TargetSelectionKind): string | undefined {
  return TARGET_SELECTION_BY_ID.get(id)?.rulesText;
}

export function getTargetEligibilityRulesText(id: TargetEligibilityKind): string | undefined {
  return TARGET_ELIGIBILITY_BY_ID.get(id)?.rulesText;
}

export type SpellTargetingAxes = {
  selection: TargetSelectionKind;
  targetType: TargetEligibilityKind;
};

/**
 * Short label for spell detail / lists (e.g. "One creature", "Creatures in area").
 * Uses vocab names; does not parse legacy flat ids.
 */
export function formatSpellEffectTargetingLabel(t: SpellTargetingAxes): string {
  const sel = getTargetSelectionById(t.selection)?.name ?? t.selection;
  const elig = getTargetEligibilityById(t.targetType)?.name ?? t.targetType;

  if (t.selection === 'one') {
    return `${sel} ${elig.toLowerCase()}`;
  }
  if (t.selection === 'chosen') {
    const noun =
      t.targetType === 'creature'
        ? 'creatures'
        : t.targetType === 'dead-creature'
          ? 'dead creatures'
          : 'objects';
    return `${sel} ${noun}`;
  }
  if (t.selection === 'in-area') {
    if (t.targetType === 'creature') return 'Creatures in area';
    if (t.targetType === 'dead-creature') return 'Dead creatures in area';
    return 'Objects in area';
  }
  if (t.selection === 'entered-during-move') {
    if (t.targetType === 'creature') return 'Creatures entered during move';
    if (t.targetType === 'dead-creature') return 'Dead creatures entered during move';
    return 'Objects entered during move';
  }
  return `${sel} (${elig})`;
}
