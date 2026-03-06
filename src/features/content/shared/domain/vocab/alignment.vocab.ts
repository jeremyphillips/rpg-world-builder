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
