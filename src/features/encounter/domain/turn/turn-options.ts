import type { CombatActionDefinition } from '@/features/mechanics/domain/encounter/resolution/combat-action.types'

export type TurnOptionBucketState = 'empty' | 'spent' | 'available'

/**
 * Same buckets as the action drawer: standard actions vs bonus actions.
 * (An entry with both action + bonus cost is counted only in the bonus bucket.)
 */
export function partitionCombatantActionBuckets(
  actions: readonly CombatActionDefinition[] | undefined,
): { actionDefs: CombatActionDefinition[]; bonusDefs: CombatActionDefinition[] } {
  const list = actions ?? []
  return {
    actionDefs: list.filter((a) => Boolean(a.cost.action && !a.cost.bonusAction)),
    bonusDefs: list.filter((a) => Boolean(a.cost.bonusAction)),
  }
}

/**
 * Header / compact UI: bucket state from authored defs + whether the **turn resource slot**
 * for that cost type is still unused. If there are no defs in the bucket, the slot is meaningless
 * (matches {@link deriveBucketChrome} “none” for empty buckets).
 */
export function deriveTurnResourceBucketState(
  defs: readonly { id: string }[],
  slotStillAvailable: boolean,
): TurnOptionBucketState {
  if (defs.length === 0) return 'empty'
  return slotStillAvailable ? 'available' : 'spent'
}

export type TurnResourceBucketHeaderBadge = { label: string; tone: 'success' | 'default' }

/** Compact ●/○/— chip for encounter header; aligns with drawer bucket semantics. */
export function turnResourceBucketHeaderBadge(
  bucketState: TurnOptionBucketState,
  kind: 'action' | 'bonus',
): TurnResourceBucketHeaderBadge {
  const prefix = kind === 'action' ? 'Action' : 'Bonus'
  if (bucketState === 'empty') return { label: `${prefix} —`, tone: 'default' }
  if (bucketState === 'spent') return { label: `${prefix} ○`, tone: 'default' }
  return { label: `${prefix} ●`, tone: 'success' }
}

export function deriveBucketState(
  defs: readonly { id: string }[],
  availableIds?: readonly string[],
): TurnOptionBucketState {
  if (defs.length === 0) return 'empty'
  if (availableIds == null) return 'available'

  const set = new Set(availableIds)
  for (const d of defs) {
    if (set.has(d.id)) return 'available'
  }
  return 'spent'
}

export function deriveBucketChrome(
  baseLabel: string,
  state: TurnOptionBucketState,
): {
  title: string
  defaultOpen: boolean
} {
  if (state === 'empty') return { title: `${baseLabel} — none`, defaultOpen: false }
  if (state === 'spent') return { title: `${baseLabel} — spent`, defaultOpen: false }
  return { title: baseLabel, defaultOpen: true }
}

/**
 * High-level “anything left on this turn?” for UI hints (e.g. End Turn affordances).
 *
 * - `hasAnyPrimaryOptionRemaining` is true if any **action**, **bonus action**, or **reaction**
 *   bucket is still `available`, or `movementRemaining` is a positive number.
 * - `movementRemaining` / `reactionState` omitted means “not tracked here” — do not treat as blocking.
 * - `empty` buckets (no defs in that category) do not count as a remaining option; they also do not
 *   block exhaustion when everything else is spent.
 * - `isFullySpent` is the negation of `hasAnyPrimaryOptionRemaining` under those rules.
 */
export function deriveTurnExhaustion(input: {
  actionState: TurnOptionBucketState
  bonusActionState: TurnOptionBucketState
  movementRemaining?: number | null
}): {
  isFullySpent: boolean
  hasAnyPrimaryOptionRemaining: boolean
} {
  const hasMovement =
    input.movementRemaining != null && input.movementRemaining > 0


  const hasAnyPrimaryOptionRemaining =
    input.actionState === 'available' ||
    input.bonusActionState === 'available' ||
    hasMovement

  return {
    hasAnyPrimaryOptionRemaining,
    isFullySpent: !hasAnyPrimaryOptionRemaining,
  }
}
