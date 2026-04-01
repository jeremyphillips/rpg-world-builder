import type { EncounterState } from '@/features/mechanics/domain/combat/state/types'

/**
 * Spreads and partial overrides often widen `environmentZones[].kind` to `string`.
 * Use this when passing test fixtures into APIs typed as {@link EncounterState}.
 */
export function asEncounterState(state: unknown): EncounterState {
  return state as EncounterState
}
