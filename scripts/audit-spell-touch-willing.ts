/**
 * Audit touch-range spells whose root `targeting` is `one-creature` without
 * `requiresWilling`, while `deriveSpellHostility` is still `unknown`.
 *
 * Those spells map to hostile `single-target` in encounter by default (same-side
 * targeting suppressed). Review each: add `requiresWilling: true` on `targeting`
 * when RAW requires a willing creature, or set `resolution.hostileIntent` for
 * intentional hostile touch (e.g. Inflict Wounds is already excluded via save/damage).
 *
 * Spells in `AUDIT_ALLOWLIST` are treated as reviewed (exit 0). Remove an id
 * after fixing data so regressions surface.
 *
 * Usage:
 *   npx tsx scripts/audit-spell-touch-willing.ts
 *
 * Exit code 1 when any non-allowlisted findings exist (for CI), 0 when clean.
 */

/** Reviewed: not an error for this heuristic (see comments). */
const AUDIT_ALLOWLIST = new Set<string>([
  // Authored as one-creature; RAW targets an object. Revisit if object targeting is added.
  'light',
  // RAW: "You touch a creature" — not willing-only; ally buff may need resolution.hostileIntent instead.
  'longstrider',
  // RAW: "creature you touch" — not explicitly willing.
  'tongues',
])
import { getSystemSpells } from '../src/features/mechanics/domain/rulesets/system/spells/index.ts'
import { DEFAULT_SYSTEM_RULESET_ID } from '../src/features/mechanics/domain/rulesets/ids/systemIds.ts'
import { deriveSpellHostility } from '../src/features/encounter/helpers/spells'
import type { Spell } from '../src/features/content/spells/domain/types/spell.types.ts'

function findSuspiciousTouchSpells(spells: readonly Spell[]): Spell[] {
  const out: Spell[] = []
  for (const spell of spells) {
    if (spell.range?.kind !== 'touch') continue
    const root = spell.effects ?? []
    const targeting = root.find((e) => e.kind === 'targeting')
    if (targeting?.kind !== 'targeting') continue
    if (targeting.target !== 'one-creature') continue
    if (targeting.requiresWilling) continue
    if (deriveSpellHostility(spell) !== 'unknown') continue
    out.push(spell)
  }
  return out.sort((a, b) => a.name.localeCompare(b.name))
}

const spells = getSystemSpells(DEFAULT_SYSTEM_RULESET_ID)
const suspicious = findSuspiciousTouchSpells(spells)
const flagged = suspicious.filter((s) => !AUDIT_ALLOWLIST.has(s.id))
const allowlisted = suspicious.filter((s) => AUDIT_ALLOWLIST.has(s.id))

// eslint-disable-next-line no-console -- CLI output
console.log(
  `Audited ${spells.length} spells. Touch + one-creature + no requiresWilling + deriveSpellHostility unknown: ${suspicious.length} (${flagged.length} not allowlisted)\n`,
)

if (allowlisted.length > 0) {
  // eslint-disable-next-line no-console -- CLI output
  console.log('Allowlisted (see AUDIT_ALLOWLIST in script):')
  for (const s of allowlisted) {
    // eslint-disable-next-line no-console -- CLI output
    console.log(`- ${s.id} (${s.name}) — level ${s.level}`)
  }
  // eslint-disable-next-line no-console -- CLI output
  console.log('')
}

if (flagged.length === 0) {
  // eslint-disable-next-line no-console -- CLI output
  console.log('No new findings.')
  process.exit(0)
}

for (const s of flagged) {
  // eslint-disable-next-line no-console -- CLI output
  console.log(`- ${s.id} (${s.name}) — level ${s.level}`)
}
// eslint-disable-next-line no-console -- CLI output
console.log(
  '\nReview: add `requiresWilling` on `targeting` for willing touch buffs, or `resolution.hostileIntent` for hostile touch.',
)
process.exit(1)
