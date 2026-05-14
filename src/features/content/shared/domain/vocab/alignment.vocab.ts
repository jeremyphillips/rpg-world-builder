import type { AlignmentOptionSetId, Ruleset } from '@/shared/types/ruleset';

export const ALIGNMENT_LIST_NINE_POINT = [
  { id: 'lg', name: 'Lawful Good', description: '' },
  { id: 'ng', name: 'Neutral Good', description: '' },
  { id: 'cg', name: 'Chaotic Good', description: '' },
  { id: 'ln', name: 'Lawful Neutral', description: '' },
  { id: 'n', name: 'Neutral', description: '' },
  { id: 'cn', name: 'Chaotic Neutral', description: '' },
  { id: 'le', name: 'Lawful Evil', description: '' },
  { id: 'ne', name: 'Neutral Evil', description: '' },
  { id: 'ce', name: 'Chaotic Evil', description: '' },
] as const;

export const ALIGNMENT_LIST_FIVE_POINT = [
  { id: 'lg', name: 'Lawful Good', description: '' },
  { id: 'good', name: 'Good', description: '' },
  { id: 'unaligned', name: 'Unaligned', description: '' },
  { id: 'evil', name: 'Evil', description: '' },
  { id: 'ce', name: 'Chaotic Evil', description: '' },
] as const;

export const ALIGNMENT_LIST_THREE_POINT = [
  { id: 'law', name: 'Lawful', description: '' },
  { id: 'neutral', name: 'Neutral', description: '' },
  { id: 'chaos', name: 'Chaotic', description: '' },
] as const;

const ALIGNMENT_VOCAB_ROWS = [
  ...ALIGNMENT_LIST_NINE_POINT,
  ...ALIGNMENT_LIST_FIVE_POINT,
  ...ALIGNMENT_LIST_THREE_POINT,
] as const;

const ALIGNMENT_BY_ID: ReadonlyMap<string, string> = new Map(
  ALIGNMENT_VOCAB_ROWS.map((r) => [r.id, r.name] as const),
);

/** All known alignment ids (nine-, five-, and three-point lists; duplicates collapsed). */
export const ALIGNMENT_IDS: readonly string[] = [...ALIGNMENT_BY_ID.keys()];

/** User-facing label for a vocabulary alignment id; `undefined` if `id` is not in the alignment lists. */
export function getAlignmentDisplayName(id: string): string | undefined {
  if (!(ALIGNMENT_IDS as readonly string[]).includes(id)) return undefined;
  return ALIGNMENT_BY_ID.get(id);
}

/** Ordered alignment ids for each option set (see ruleset `mechanics.character.alignment.optionSetId`). */
const ALIGNMENT_IDS_BY_OPTION_SET: Record<AlignmentOptionSetId, readonly string[]> = {
  nine_point: ALIGNMENT_LIST_NINE_POINT.map((a) => a.id),
  five_point: ALIGNMENT_LIST_FIVE_POINT.map((a) => a.id),
  three_point: ALIGNMENT_LIST_THREE_POINT.map((a) => a.id),
};

const DEFAULT_ALIGNMENT_OPTION_SET: AlignmentOptionSetId = 'nine_point';

function isAlignmentOptionSetId(s: string | undefined): s is AlignmentOptionSetId {
  return s === 'nine_point' || s === 'five_point' || s === 'three_point';
}

/**
 * Resolves the alignment option set from a resolved (or static system) ruleset.
 * Defaults to `nine_point` to match the system catalog default in `system/catalog` ruleset definitions.
 */
export function resolveAlignmentOptionSetIdFromRuleset(
  ruleset: Pick<Ruleset, 'mechanics'> | null | undefined,
): AlignmentOptionSetId {
  const raw = ruleset?.mechanics?.character?.alignment?.optionSetId;
  if (isAlignmentOptionSetId(raw)) {
    return raw;
  }
  return DEFAULT_ALIGNMENT_OPTION_SET;
}

/**
 * `value` / `label` rows for a given alignment option set (catalog-driven).
 */
export function getAlignmentFormSelectOptionsForOptionSetId(
  optionSetId: AlignmentOptionSetId | string | undefined,
): ReadonlyArray<{ value: string; label: string }> {
  const setId: AlignmentOptionSetId = isAlignmentOptionSetId(optionSetId)
    ? optionSetId
    : DEFAULT_ALIGNMENT_OPTION_SET;
  return ALIGNMENT_IDS_BY_OPTION_SET[setId].map((id) => ({
    value: id,
    label: getAlignmentDisplayName(id) ?? id,
  }));
}

/**
 * Form alignment dropdown options from the campaign / resolved ruleset
 * (`mechanics.character.alignment` in the system catalog, possibly patched per campaign).
 */
export function getAlignmentFormSelectOptionsForRuleset(
  ruleset: Pick<Ruleset, 'mechanics'> | null | undefined,
): ReadonlyArray<{ value: string; label: string }> {
  return getAlignmentFormSelectOptionsForOptionSetId(
    resolveAlignmentOptionSetIdFromRuleset(ruleset),
  );
}

/**
 * @deprecated Prefer {@link getAlignmentFormSelectOptionsForRuleset} or
 *   {@link getAlignmentFormSelectOptionsForOptionSetId}. This matches the system default `nine_point` set
 *   (not the union of all vocabulary ids).
 */
export function getAlignmentFormSelectOptions(): ReadonlyArray<{
  value: string;
  label: string;
}> {
  return getAlignmentFormSelectOptionsForOptionSetId(DEFAULT_ALIGNMENT_OPTION_SET);
}
