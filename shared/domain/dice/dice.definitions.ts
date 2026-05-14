/**
 * Canonical polyhedral hit/damage die faces used across app + mechanics (no rolling logic here).
 */
export const DIE_FACE_DEFINITIONS = [
  { id: 4, name: 'd4', label: 'd4' },
  { id: 6, name: 'd6', label: 'd6' },
  { id: 8, name: 'd8', label: 'd8' },
  { id: 10, name: 'd10', label: 'd10' },
  { id: 12, name: 'd12', label: 'd12' },
  { id: 20, name: 'd20', label: 'd20' },
] as const;

export type DieFaceDefinition = (typeof DIE_FACE_DEFINITIONS)[number];

/** Numeric die size (faces). */
export type DieFace = DieFaceDefinition['id'];

export const DIE_FACES = DIE_FACE_DEFINITIONS.map((d) => d.id) as readonly DieFace[];
