/**
 * Opt-in stealth bookkeeping traces for diagnosing runtime Hide / `hiddenFromObserverIds` / reconcile.
 *
 * Enable in the browser console: `globalThis.__ENCOUNTER_STEALTH_TRACE__ = true`
 * Disable: `delete globalThis.__ENCOUNTER_STEALTH_TRACE__` or set to `false`.
 *
 * Does not change mechanics; logging only.
 */
import type { EncounterState } from '../types'

export function isStealthRuntimeTraceEnabled(): boolean {
  if (typeof globalThis === 'undefined') return false
  return (globalThis as { __ENCOUNTER_STEALTH_TRACE__?: boolean }).__ENCOUNTER_STEALTH_TRACE__ === true
}

/** Sorted copy of each combatant’s `hiddenFromObserverIds` (empty combatants omitted). */
export function stealthHiddenSnapshot(state: EncounterState): Record<string, string[]> {
  const out: Record<string, string[]> = {}
  for (const c of Object.values(state.combatantsById)) {
    const ids = c.stealth?.hiddenFromObserverIds
    if (ids?.length) out[c.instanceId] = [...ids].sort()
  }
  return out
}

export function stealthTraceLog(phase: string, payload: Record<string, unknown>): void {
  if (!isStealthRuntimeTraceEnabled()) return
  console.log(`[encounter-stealth-trace] ${phase}`, payload)
}
