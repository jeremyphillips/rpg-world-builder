/**
 * Utilities for the `source` convention on effects.
 *
 * Source strings follow the pattern `category:id` (e.g. `armor:plate`,
 * `magic_item:ring-of-protection`). Some sources are category-only labels
 * with no id part (e.g. `magic`, `magic_armor`).
 *
 * These helpers centralize creation, matching, and display so consumers
 * never parse source strings ad hoc.
 */

export function effectSource(category: string, id: string): string {
  return `${category}:${id}`
}

export function matchesSourceCategory(source: string | undefined, category: string): boolean {
  if (!source) return false
  return source === category || source.startsWith(`${category}:`)
}

export function getSourceId(source: string | undefined): string | undefined {
  if (!source) return undefined
  const idx = source.indexOf(':')
  return idx >= 0 ? source.slice(idx + 1) : undefined
}

export function getSourceLabel(source: string | undefined): string {
  if (!source) return 'Bonus'
  const parts = source.split(':')
  const id = parts[parts.length - 1]
  return id.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}
