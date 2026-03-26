/**
 * Encounter participation vs death vs remains — domain semantics
 * ================================================================
 *
 * **Audit (implicit rules before this module):**
 * - `currentHitPoints <= 0` was used as “defeated” / out of initiative
 *   (`buildAliveInitiativeParticipants` in runtime.ts).
 * - `remains` + `diedAtRound` were set together when damage finalized 0 HP
 *   (including Undead Fortitude failure path); cleared on revival.
 * - `death-outcome` effects only run when `currentHitPoints <= 0`: they do not
 *   deal the killing blow; they refine **remains** (e.g. dust) after lethal hits.
 * - `dead-creature` targeting mixed HP === 0 with remains checks (dust/disintegrated
 *   excluded) without a single named predicate.
 *
 * **Layers (intended meanings):**
 * 1. **Encounter participation** — still in initiative / normal turn flow?
 *    Represented here by `isActiveCombatant` / `isDefeatedCombatant` (HP > 0 vs ≤ 0).
 * 2. **Death record** — rules/narrative “this creature’s death was recorded”?
 *    Represented by `diedAtRound` (and usually `remains`) when lethal 0 HP is applied.
 * 3. **Remains** — what is left for targeting (corpse, bones, dust, disintegrated).
 *
 * **Defeated without a death record (`HP ≤ 0` but `diedAtRound` unset):**
 * Current lethal resolution (`applyDamageToCombatant`) always writes a death record when
 * crossing from above 0 to 0 HP, so this combination is **not** a normal finalized kill
 * in production — it appears in **tests, synthetic state, or future mechanics** (e.g.
 * unconscious at 0 HP without a recorded death). Do not infer “dead” from HP alone; use
 * `isDeadCombatant` (record-based) vs `isDefeatedCombatant` (HP-based).
 *
 * **Recommended option for this codebase:** Option C–style — keep existing instance
 * fields (`remains`, `diedAtRound`, HP) and expose semantics only through these helpers
 * so call sites stop re-interpreting raw numbers. A dedicated `encounterStatus` field
 * would duplicate HP until we model unconscious-at-0 separately from dead.
 */

import type { CombatantInstance } from './types/combatant.types'

/**
 * “Alive” for encounter rules: **HP > 0**. Matches initiative re-roll eligibility in
 * `buildAliveInitiativeParticipants` (runtime.ts) — same predicate as filtering to living
 * combatants when a new round rolls initiative.
 */
export function isActiveCombatant(c: CombatantInstance): boolean {
  return c.stats.currentHitPoints > 0
}

/**
 * Defeated for encounter flow: no longer counts as “alive” for initiative re-rolls
 * and cannot be chosen for actions that require a living target (`single-creature`, etc.).
 * In this engine that is **HP ≤ 0** (HP is clamped at 0).
 */
export function isDefeatedCombatant(c: CombatantInstance): boolean {
  return c.stats.currentHitPoints <= 0
}

/**
 * **Dead (recorded)** — truth source is **`diedAtRound`**, not HP. A creature can be
 * defeated (`HP ≤ 0`) without a death record in synthetic tests; lethal gameplay
 * normally sets the record when damage reduces HP to 0. **Do not equate “dead” with
 * `HP ≤ 0` alone** — use `isDefeatedCombatant` for participation and `isDeadCombatant`
 * for “death was recorded this encounter.”
 */
export function isDeadCombatant(c: CombatantInstance): boolean {
  return c.diedAtRound != null
}

/**
 * Targeting for `CombatActionTargetingProfile.kind === 'dead-creature'`.
 * Requires exactly **0 HP** (engine never stores negative HP) and remains that still
 * represent a targetable body (`corpse` / `bones`, or **undefined** remains treated as implicit corpse for spells).
 * Excludes `dust` and `disintegrated` (destroyed / no intact corpse).
 */
export function canTargetAsDeadCreature(c: CombatantInstance): boolean {
  if (c.stats.currentHitPoints !== 0) return false
  const r = c.remains
  if (r === 'dust' || r === 'disintegrated') return false
  return true
}

/**
 * Something physical remains on the grid worth tracking (excludes total disintegration).
 * Useful for narrative/spawn hooks; targeting uses {@link canTargetAsDeadCreature}.
 *
 * **`remains === undefined`:** treated as **no explicit aftermath** → returns **false**.
 * Normal lethal damage sets `remains` when a death record is applied, so defeated
 * combatants usually have a concrete kind. `undefined` is typical for living
 * combatants and for synthetic/test state. We keep this predicate **strict** (requires
 * an explicit non-disintegrated `remains`) so UI/spawn hooks do not assume a body
 * exists without stored data; {@link canTargetAsDeadCreature} still treats `undefined`
 * at 0 HP as an implicit corpse for spell targeting, which is intentionally a separate rule.
 */
export function hasRemainsOnGrid(c: CombatantInstance): boolean {
  const r = c.remains
  if (r === undefined) return false
  return r !== 'disintegrated'
}

/**
 * Body intact enough for Raise Dead–style revival checks (not dust / disintegrated).
 * **`remains === undefined`** is treated as **intact** (not destroyed) so revival
 * resolution can run; pair with `isDefeatedCombatant` or `canTargetAsDeadCreature` for HP.
 */
export function hasIntactRemainsForRevival(c: CombatantInstance): boolean {
  const r = c.remains
  if (r === 'dust' || r === 'disintegrated') return false
  return true
}
