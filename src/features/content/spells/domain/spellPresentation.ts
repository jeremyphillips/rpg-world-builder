/**
 * Shared spell UI identity: field keys and labels used by form, list filters, and detail.
 */
export const SPELL_CORE_UI = {
  school: { key: 'school' as const, label: 'School' as const },
  level: { key: 'level' as const, label: 'Level' as const },
  classes: {
    key: 'classes' as const,
    label: 'Classes' as const,
    listFilterLabel: 'Class' as const,
  },
} as const;

/** Cantrip vs numeric level — list filter options and detail row. */
export function formatSpellLevelShort(level: number): string {
  return level === 0 ? 'Cantrip' : String(level);
}
