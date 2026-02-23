/**
 * Maps edition-specific class IDs to canonical catalog IDs, and defines 2e class groups.
 *
 * Pure data — no imports from feature code.
 */

export const CLASS_ALIASES: Record<string, string> = {
  'fighting-man': 'fighter',
  'magic-user':   'wizard',
  'magicUser':    'wizard',
  'mage':         'wizard',
}

/**
 * Resolve an edition-specific class ID to its canonical catalog ID.
 * Returns the original ID if no alias exists.
 */
export function resolveClassId(id: string): string {
  return CLASS_ALIASES[id] ?? id
}

export const CLASS_GROUPS_2E: Record<string, string[]> = {
  warrior: ['fighter', 'paladin', 'ranger'],
  priest:  ['cleric', 'druid'],
  wizard:  ['wizard'],
  rogue:   ['thief', 'bard'],
}

export function getClassGroup2e(classId: string): string | undefined {
  for (const [group, members] of Object.entries(CLASS_GROUPS_2E)) {
    if (members.includes(classId)) return group
  }
  return undefined
}
