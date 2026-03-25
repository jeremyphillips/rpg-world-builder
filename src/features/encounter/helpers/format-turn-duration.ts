const SECONDS_PER_TURN = 6

export type TurnDurationInput =
  | { remainingTurns: number; totalTurns: number }
  | { remainingTurns: number }

/**
 * Shared formatter for turn-based durations. Accepts either a
 * concentration-style pair (remaining + total) or a marker-style
 * remaining-only value.
 *
 * @returns `"6s/60s"` when total is known, `"18s left"` otherwise.
 */
export function formatTurnDuration(input: TurnDurationInput): string {
  if ('totalTurns' in input && input.totalTurns != null) {
    const elapsed = (input.totalTurns - input.remainingTurns) * SECONDS_PER_TURN
    const total = input.totalTurns * SECONDS_PER_TURN
    return `${elapsed}s/${total}s`
  }
  const remaining = input.remainingTurns * SECONDS_PER_TURN
  return `${remaining}s left`
}
