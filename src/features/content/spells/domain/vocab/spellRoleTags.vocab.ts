/**
 * Tactical / play-facing spell roles — use when the spell has a clear play-pattern identity.
 */
export const SPELL_ROLE_TAG_OPTIONS = [
  { id: 'damage', name: 'Damage' },
  { id: 'buff', name: 'Buff' },
  { id: 'debuff', name: 'Debuff' },
  { id: 'control', name: 'Control' },
  { id: 'healing', name: 'Healing' },
  { id: 'movement', name: 'Movement' },
  { id: 'warding', name: 'Warding' },
  { id: 'summoning', name: 'Summoning' },
  { id: 'detection', name: 'Detection' },
  { id: 'banishment', name: 'Banishment' },
] as const;

export type SpellRoleTag = (typeof SPELL_ROLE_TAG_OPTIONS)[number]['id'];
