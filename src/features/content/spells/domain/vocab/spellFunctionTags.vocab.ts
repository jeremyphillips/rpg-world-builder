/**
 * Fantasy-purpose / non-tactical tags — communication, exploration flavor, illusions, etc.
 */
export const SPELL_FUNCTION_TAG_OPTIONS = [
  { id: 'communication', name: 'Communication' },
  { id: 'creation', name: 'Creation' },
  { id: 'exploration', name: 'Exploration' },
  { id: 'teleportation', name: 'Teleportation' },
  { id: 'foreknowledge', name: 'Foreknowledge' },
  { id: 'deception', name: 'Deception' },
  { id: 'social', name: 'Social' },
  { id: 'environment', name: 'Environment' },
  { id: 'utility', name: 'Utility' },
  { id: 'shape-changing', name: 'Shape changing' },
] as const;

export type SpellFunctionTag = (typeof SPELL_FUNCTION_TAG_OPTIONS)[number]['id'];
