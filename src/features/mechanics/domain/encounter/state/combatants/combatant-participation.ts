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
 *
 * **CombatantTurnStatus** — derived view of battlefield presence, action capability, and
 * auto-skip hints; see {@link getCombatantTurnStatus}. Condition flags come from
 * merged condition + engine-state rules (`getActiveConsequences`); defeat/death from HP + `diedAtRound`;
 * corpse replacement via `remainsConsumed` on {@link CombatantInstance}.
 */

import {
  canTakeActions as conditionsAllowActions,
  canTakeReactions as conditionsAllowReactions,
  getBattlefieldPresenceSkipReason,
  getSpeedConsequences,
  hasBattlefieldAbsenceConsequence,
} from '../conditions/condition-rules'
import type { CombatantInstance, CombatantTurnStatus } from '../types/combatant.types'

export type { CombatantTurnStatus } from '../types/combatant.types'

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
 * Excludes `dust` and `disintegrated` (destroyed / no intact corpse), and consumed remains.
 */
export function canTargetAsDeadCreature(c: CombatantInstance): boolean {
  if (c.remainsConsumed) return false
  if (c.stats.currentHitPoints !== 0) return false
  const r = c.remains
  if (r === 'dust' || r === 'disintegrated') return false
  return true
}

/**
 * Dead combatant with an explicit remains kind that has not been consumed (e.g. Animate Dead input).
 */
export function hasConsumableRemains(c: CombatantInstance): boolean {
  return isDeadCombatant(c) && !!c.remains && !c.remainsConsumed
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
 * **`remainsConsumed`:** no on-grid body token for this combatant.
 */
export function hasRemainsOnGrid(c: CombatantInstance): boolean {
  if (c.remainsConsumed) return false
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

/**
 * On the battlefield for presence purposes: not banished / off-grid, and still represented
 * (living, explicit remains, or implicit dead-creature target at 0 HP).
 */
export function hasBattlefieldPresence(c: CombatantInstance): boolean {
  if (hasBattlefieldAbsenceConsequence(c)) {
    return false
  }
  return (
    isActiveCombatant(c) || hasRemainsOnGrid(c) || canTargetAsDeadCreature(c)
  )
}

/**
 * Living combatants can take actions unless condition consequences disallow (e.g. incapacitated).
 * Defeated combatants cannot.
 */
export function canCombatantTakeActions(c: CombatantInstance): boolean {
  return isActiveCombatant(c) && conditionsAllowActions(c)
}

/** Matches `createCombatantTurnResources` — bonus action availability tracks action availability in v1. */
export function canCombatantTakeBonusActions(c: CombatantInstance): boolean {
  return canCombatantTakeActions(c)
}

export function canCombatantTakeReactions(c: CombatantInstance): boolean {
  return isActiveCombatant(c) && conditionsAllowReactions(c)
}

function resolveAutoSkipReason(c: CombatantInstance): CombatantTurnStatus['skipReason'] {
  const battlefield = getBattlefieldPresenceSkipReason(c)
  if (battlefield === 'banished') return 'banished'
  if (battlefield === 'off-grid') return 'off-grid'
  if (c.remainsConsumed && isDefeatedCombatant(c)) return 'remains-consumed'
  if (isDefeatedCombatant(c)) return 'defeated'
  return 'cannot-act'
}

/**
 * Skip the turn when defeated, absent from the battlefield (banished / off-grid), or
 * conditions block meaningful actions (e.g. stunned) while still “alive” for initiative.
 */
export function shouldAutoSkipCombatantTurn(c: CombatantInstance): boolean {
  if (isDefeatedCombatant(c)) return true
  if (hasBattlefieldAbsenceConsequence(c)) return true
  if (isActiveCombatant(c) && !conditionsAllowActions(c)) return true
  return false
}

export function getCombatantTurnStatus(c: CombatantInstance): CombatantTurnStatus {
  const isDefeated = isDefeatedCombatant(c)
  const isDead = isDeadCombatant(c)
  const banishedTargeting = hasBattlefieldAbsenceConsequence(c, 'banished')

  const hasPresence = hasBattlefieldPresence(c)
  const occupiesGrid = hasPresence
  const canBeTargetedOnGrid = banishedTargeting
    ? false
    : isActiveCombatant(c)
      ? true
      : canTargetAsDeadCreature(c)

  const canTakeActions = canCombatantTakeActions(c)
  const canTakeBonusActions = canCombatantTakeBonusActions(c)
  const canTakeReactions = canCombatantTakeReactions(c)
  const canMove =
    isActiveCombatant(c) && !getSpeedConsequences(c).speedBecomesZero

  const shouldAutoSkipTurn = shouldAutoSkipCombatantTurn(c)
  const skipReason = shouldAutoSkipTurn ? resolveAutoSkipReason(c) : undefined

  return {
    isDefeated,
    isDead,
    hasBattlefieldPresence: hasPresence,
    occupiesGrid,
    canBeTargetedOnGrid,
    canTakeActions,
    canTakeBonusActions,
    canTakeReactions,
    canMove,
    shouldAutoSkipTurn,
    skipReason,
    remainsInInitiative: isActiveCombatant(c),
  }
}
