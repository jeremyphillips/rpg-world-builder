import type { CombatLogEvent } from '@/features/mechanics/domain/combat'
import type { EncounterState } from '@/features/mechanics/domain/combat/state/types'
import { getCombatantDisplayLabel } from '@/features/mechanics/domain/combat/state'
import { isDefeatedCombatant } from '@/features/mechanics/domain/combat/state/combatants/combatant-participation'
import type { ActionResolvedOutcomeMeta } from '@/features/encounter/toast/encounter-toast-types'
import type { AppAlertTone } from '@/ui/primitives'

const MAX_EFFECT_LINES = 14

/** Remove parenthetical runtime ids such as `(monster-1)` from log copy. */
function stripRuntimeIds(summary: string): string {
  return summary.replace(/\s*\([^)]*-[^)]+\)/g, '').replace(/\s+/g, ' ').trim()
}

function isMechanicsLine(line: string): boolean {
  const t = line.toLowerCase()
  return (
    t.includes('attack roll') ||
    t.includes('saving throw') ||
    t.includes('critical damage') ||
    (t.includes('damage:') && /\d+d\d/.test(line)) ||
    /\bd20\b/.test(line) ||
    t.includes('vs ac') ||
    t.includes('vs dc') ||
    t.includes('auto-fail')
  )
}

function splitNarrativeAndMechanics(lines: string[]): { narrative: string; mechanics: string } {
  const narrative: string[] = []
  const mechanics: string[] = []
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (isMechanicsLine(trimmed)) mechanics.push(trimmed)
    else narrative.push(trimmed)
  }
  return {
    narrative: narrative.join('\n\n'),
    mechanics: mechanics.join('\n'),
  }
}

function parseDeclaredAction(summary: string): { actor: string; action: string; target?: string } | null {
  const m = summary.match(/^(.+?) uses (.+?)(?: against (.+?))?\.$/)
  if (!m) return null
  return { actor: stripRuntimeIds(m[1]), action: m[2].trim(), target: m[3] ? stripRuntimeIds(m[3]) : undefined }
}

function appendDefeatSuffixToTitle(
  title: string,
  events: CombatLogEvent[],
  encounterState: EncounterState | undefined,
): string {
  if (!encounterState) return title

  const roster = Object.values(encounterState.combatantsById)
  const names: string[] = []
  const seen = new Set<string>()
  for (const e of events) {
    if (e.type !== 'damage-applied') continue
    for (const tid of e.targetIds ?? []) {
      const c = encounterState.combatantsById[tid]
      if (!c || !isDefeatedCombatant(c)) continue
      if (seen.has(tid)) continue
      seen.add(tid)
      names.push(getCombatantDisplayLabel(c, roster))
    }
  }
  if (names.length === 0) return title
  const suffix =
    names.length === 1
      ? `${names[0]} is defeated.`
      : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]} are defeated.`
  return `${title} — ${suffix}`
}

export function computeActionResolvedDedupeKey(events: CombatLogEvent[]): string {
  if (events.length === 0) return 'empty'
  const first = events[0]
  const round = first.round
  const turn = first.turn
  const ids = [...new Set(events.map((e) => e.id))].sort()
  return `r${round}-t${turn}-${ids.join(':')}`
}

function computeOutcomeMeta(events: CombatLogEvent[]): ActionResolvedOutcomeMeta {
  const hits = events.filter((e) => e.type === 'attack-hit')
  const misses = events.filter((e) => e.type === 'attack-missed')
  return {
    hitCount: hits.length,
    missCount: misses.length,
    hasNat1Miss: misses.some((m) => /natural 1/i.test(m.summary)),
  }
}

/**
 * Viewer-agnostic action resolution: title, body lines, outcome metadata, dedupe key.
 * **No tone** — policy applies viewer-specific tone.
 */
export function buildActionResolvedNeutralContent(
  events: CombatLogEvent[],
  encounterState?: EncounterState,
): {
  title: string
  narrative: string
  mechanics: string
  outcome: ActionResolvedOutcomeMeta
  dedupeKey: string
} | null {
  if (events.length === 0) return null

  const hits = events.filter((e) => e.type === 'attack-hit')
  const misses = events.filter((e) => e.type === 'attack-missed')
  const declared = events.find((e) => e.type === 'action-declared')

  const effectLines = events
    .filter((e) =>
      e.type === 'condition-applied' ||
      e.type === 'condition-removed' ||
      e.type === 'state-applied' ||
      e.type === 'state-removed',
    )
    .map((e) => {
      const base = stripRuntimeIds(e.summary)
      const d = e.details?.trim()
      return d ? `${base} ${d}` : base
    })
    .slice(0, MAX_EFFECT_LINES)

  const flatLines: string[] = []
  let strikeIndex = 0

  let i = 0
  while (i < events.length) {
    const e = events[i]
    if (e.type === 'attack-hit' || e.type === 'attack-missed') {
      strikeIndex += 1
      const label = e.type === 'attack-hit' ? 'Hit' : 'Miss'
      flatLines.push(`${label} ${strikeIndex} — ${stripRuntimeIds(e.summary)}`)
      if (e.details?.trim()) flatLines.push(e.details.trim())
      i += 1
      while (i < events.length) {
        const ev = events[i]
        if (ev.type === 'attack-hit' || ev.type === 'attack-missed') break
        if (ev.type === 'action-declared') {
          i += 1
          continue
        }
        if (ev.type === 'damage-applied') {
          let line = stripRuntimeIds(ev.summary)
          if (ev.details?.trim()) line = `${line} ${ev.details.trim()}`
          flatLines.push(line)
          i += 1
          continue
        }
        if (ev.type === 'action-resolved') {
          if (ev.details?.trim()) flatLines.push(ev.details.trim())
          else if (ev.summary && !/resolves with no damage dealt/i.test(ev.summary)) {
            flatLines.push(stripRuntimeIds(ev.summary))
          }
          i += 1
          continue
        }
        if (
          ev.type === 'condition-applied' ||
          ev.type === 'state-applied' ||
          ev.type === 'condition-removed' ||
          ev.type === 'state-removed'
        ) {
          i += 1
          continue
        }
        if (ev.type === 'spell-logged') {
          flatLines.push(stripRuntimeIds(ev.summary))
          if (ev.details?.trim()) flatLines.push(ev.details.trim())
          i += 1
          continue
        }
        i += 1
      }
      flatLines.push('')
    } else {
      i += 1
    }
  }

  const saveOrSpellLines: string[] = []
  if (hits.length === 0 && misses.length === 0) {
    for (const e of events) {
      if (e.type === 'action-resolved' || e.type === 'spell-logged') {
        saveOrSpellLines.push(stripRuntimeIds(e.summary))
        if (e.details?.trim()) saveOrSpellLines.push(e.details.trim())
      }
    }
    for (const e of events) {
      if (e.type === 'note' && e.summary.includes('ignores')) {
        saveOrSpellLines.push(stripRuntimeIds(e.summary))
        if (e.details?.trim()) saveOrSpellLines.push(e.details.trim())
      }
    }
    for (const e of events) {
      if (e.type === 'damage-applied') {
        let line = stripRuntimeIds(e.summary)
        if (e.details?.trim()) line = `${line} ${e.details.trim()}`
        saveOrSpellLines.push(line)
      }
    }
    for (const e of events) {
      if (
        e.type === 'note' &&
        (e.summary.includes('save') ||
          e.summary.includes('(aura)') ||
          e.summary.toLowerCase().includes('entering'))
      ) {
        saveOrSpellLines.push(stripRuntimeIds(e.summary))
        if (e.details?.trim()) saveOrSpellLines.push(e.details.trim())
      }
    }
  }

  let title: string
  if (hits.length + misses.length > 1 && declared) {
    const parsed = parseDeclaredAction(declared.summary)
    if (parsed) {
      title = parsed.target
        ? `${parsed.actor} — ${parsed.action} vs ${parsed.target}: ${hits.length} hit(s), ${misses.length} miss(es)`
        : `${parsed.actor} — ${parsed.action}: ${hits.length} hit(s), ${misses.length} miss(es)`
    } else {
      title = stripRuntimeIds(declared.summary)
    }
  } else if (hits.length + misses.length > 1) {
    title = `${hits.length} hit(s), ${misses.length} miss(es)`
  } else if (hits.length === 1 && misses.length === 0) {
    title = stripRuntimeIds(hits[0].summary)
  } else if (misses.length === 1 && hits.length === 0) {
    title = stripRuntimeIds(misses[0].summary)
  } else if (hits.length + misses.length === 0) {
    const fallback = saveOrSpellLines[0] ?? events.map((e) => e.summary).find(Boolean) ?? 'Action resolved.'
    title = stripRuntimeIds(fallback)
  } else {
    const first = hits[0] ?? misses[0]
    title = stripRuntimeIds(first.summary)
  }

  title = appendDefeatSuffixToTitle(title, events, encounterState)

  const coreLines = [...(hits.length + misses.length > 0 ? flatLines : saveOrSpellLines)]
  if (effectLines.length > 0) {
    coreLines.push('Effects:', ...effectLines.map((l) => `• ${l}`))
  }

  const { narrative, mechanics } = splitNarrativeAndMechanics(coreLines.filter((l) => l.trim().length > 0))

  const outcome = computeOutcomeMeta(events)
  const dedupeKey = computeActionResolvedDedupeKey(events)

  if (!narrative.trim() && !mechanics.trim() && effectLines.length === 0) {
    return { title, narrative: '', mechanics: '', outcome, dedupeKey }
  }

  return { title, narrative, mechanics, outcome, dedupeKey }
}

/** Legacy actor-only tone (pre–viewer-aware); for tests and backward-compat wrappers. */
export function deriveLegacyActorOnlyTone(outcome: ActionResolvedOutcomeMeta): AppAlertTone {
  const { hitCount: hits, missCount: misses, hasNat1Miss } = outcome
  if (hits > 0 && misses === 0) return 'success'
  if (hits === 0 && misses > 0) return hasNat1Miss ? 'danger' : 'warning'
  if (hits > 0 && misses > 0) return 'warning'
  return 'info'
}

/**
 * @deprecated Prefer `buildActionResolvedNeutralContent` + viewer-aware policy.
 * Legacy: actor-only tone (simulator / single-operator behavior).
 */
export function buildEncounterActionToastPayload(
  events: CombatLogEvent[],
  encounterState?: EncounterState,
): { title: string; tone: AppAlertTone; narrative: string; mechanics: string } | null {
  const neutral = buildActionResolvedNeutralContent(events, encounterState)
  if (!neutral) return null
  return {
    title: neutral.title,
    narrative: neutral.narrative,
    mechanics: neutral.mechanics,
    tone: deriveLegacyActorOnlyTone(neutral.outcome),
  }
}
