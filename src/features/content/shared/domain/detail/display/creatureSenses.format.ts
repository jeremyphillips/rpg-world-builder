import type { CreatureSense, CreatureSenses } from '../../vocab/creatureSenses.types'
import { normalizeCreatureSenses } from '../../vocab/creatureSenses.selectors'
import { getCreatureSenseTypeDisplayName } from '../../vocab/creatureSenses.vocab'

/** Title-case fallback when `type` is not in {@link getCreatureSenseTypeDisplayName} (avoids importing monster-only utils). */
function creatureSenseTypeLabelFallback(id: string): string {
  return id
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

function senseTypeLabel(type: CreatureSense['type']): string {
  return getCreatureSenseTypeDisplayName(type) ?? creatureSenseTypeLabelFallback(type)
}

/**
 * One sense line: label from shared vocab, optional range in ft., optional notes (same rules as legacy monster display).
 */
export function formatCreatureSenseEntry(sense: CreatureSense): string {
  const label = senseTypeLabel(sense.type)
  if (sense.range != null) {
    return `${label} ${sense.range} ft.${sense.notes ? ` ${sense.notes}` : ''}`
  }
  if (sense.notes) {
    return `${label} (${sense.notes})`
  }
  return label
}

/**
 * Multiple special senses only (no passive Perception). Empty/undefined → em dash.
 */
export function formatCreatureSenseList(senses: readonly CreatureSense[] | undefined): string {
  if (!senses?.length) return '—'
  return senses.map(formatCreatureSenseEntry).join('\n')
}

/**
 * Full block: normalized special senses, then passive Perception when present. Empty/undefined → em dash.
 * Accepts authoring shapes (e.g. optional `special`) — same inputs as {@link normalizeCreatureSenses}.
 */
export function formatCreatureSensesLine(senses: Partial<CreatureSenses> | null | undefined): string {
  if (!senses) return '—'

  const normalized = normalizeCreatureSenses(senses)
  const parts = normalized.special.map(formatCreatureSenseEntry)

  if (normalized.passivePerception != null) {
    parts.push(`passive Perception ${normalized.passivePerception}`)
  }

  return parts.length > 0 ? parts.join('\n') : '—'
}
