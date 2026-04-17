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
