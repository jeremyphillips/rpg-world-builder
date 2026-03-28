import type { AttachedBattlefieldEffectSource } from './attached-battlefield-source'
import { attachedBattlefieldSourceEquals } from './attached-battlefield-source'
import type { BattlefieldEffectInstance, EncounterState } from './types'

export function addAttachedAuraInstance(
  state: EncounterState,
  instance: BattlefieldEffectInstance,
): EncounterState {
  const prev = state.attachedAuraInstances ?? []
  return {
    ...state,
    attachedAuraInstances: [...prev.filter((a) => a.id !== instance.id), instance],
  }
}

export function removeAttachedAurasForSource(
  state: EncounterState,
  casterCombatantId: string,
  source: AttachedBattlefieldEffectSource,
): EncounterState {
  const prev = state.attachedAuraInstances ?? []
  const next = prev.filter(
    (a) =>
      !(a.casterCombatantId === casterCombatantId && attachedBattlefieldSourceEquals(a.source, source)),
  )
  if (next.length === prev.length) return state
  return { ...state, attachedAuraInstances: next }
}

export function removeAttachedAurasForSpell(
  state: EncounterState,
  casterCombatantId: string,
  spellId: string,
): EncounterState {
  return removeAttachedAurasForSource(state, casterCombatantId, { kind: 'spell', spellId })
}
