import type { AttachedBattlefieldEffectSource } from './attached-battlefield-source'
import { attachedBattlefieldSourceEquals } from './attached-battlefield-source'
import type { AttachedAuraInstance, EncounterState } from './types'

export function addAttachedAuraInstance(
  state: EncounterState,
  instance: AttachedAuraInstance,
): EncounterState {
  const prev = state.attachedAuraInstances ?? []
  return {
    ...state,
    attachedAuraInstances: [...prev.filter((a) => a.id !== instance.id), instance],
  }
}

export function removeAttachedAurasForSource(
  state: EncounterState,
  sourceCombatantId: string,
  source: AttachedBattlefieldEffectSource,
): EncounterState {
  const prev = state.attachedAuraInstances ?? []
  const next = prev.filter(
    (a) =>
      !(a.sourceCombatantId === sourceCombatantId && attachedBattlefieldSourceEquals(a.source, source)),
  )
  if (next.length === prev.length) return state
  return { ...state, attachedAuraInstances: next }
}

export function removeAttachedAurasForSpell(
  state: EncounterState,
  sourceCombatantId: string,
  spellId: string,
): EncounterState {
  return removeAttachedAurasForSource(state, sourceCombatantId, { kind: 'spell', spellId })
}
