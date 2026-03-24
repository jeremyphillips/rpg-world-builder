export type TurnOptionBucketState = 'empty' | 'spent' | 'available'

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
  reactionState?: TurnOptionBucketState
}): {
  isFullySpent: boolean
  hasAnyPrimaryOptionRemaining: boolean
} {
  const hasMovement =
    input.movementRemaining != null && input.movementRemaining > 0

  const hasReaction =
    input.reactionState !== undefined && input.reactionState === 'available'

  const hasAnyPrimaryOptionRemaining =
    input.actionState === 'available' ||
    input.bonusActionState === 'available' ||
    hasReaction ||
    hasMovement

  return {
    hasAnyPrimaryOptionRemaining,
    isFullySpent: !hasAnyPrimaryOptionRemaining,
  }
}
