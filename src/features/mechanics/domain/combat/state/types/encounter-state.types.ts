import type { InitiativeRoll } from '../../resolution'
import type { CombatantInstance } from './combatant.types'
import type { CombatLogEvent } from './combat-log.types'
import type { EncounterSpace, CombatantPosition } from '@/features/mechanics/domain/combat/space'
import type {
  AttachedEnvironmentZoneProfile,
  EncounterEnvironmentBaseline,
  EncounterEnvironmentZone,
} from '@/features/mechanics/domain/environment/environment.types'
import type { AttachedBattlefieldEffectSource } from '../auras/attached-battlefield-source'
import type { BattlefieldEffectAnchor } from '../battlefield/battlefield-effect-anchor'

/** Persistent battlefield sphere effect (e.g. Spirit Guardians emanation). */
export type BattlefieldEffectInstance = {
  id: string
  /** Combatant who owns the effect row (concentration, synthetic action source for resolution). */
  casterCombatantId: string
  /** Authored identity (spell, monster action, trait). */
  source: AttachedBattlefieldEffectSource
  /** Where the sphere is anchored in space (may differ from the caster). */
  anchor: BattlefieldEffectAnchor
  area: { kind: 'sphere'; size: number }
  unaffectedCombatantIds: string[]
  /** Save DC at cast/use time for nested save payloads (intervals, spatial entry). */
  saveDc?: number
  /** When set, `reconcileEnvironmentZonesFromAttachedAuras` keeps a matching environment zone in sync. */
  environmentZoneProfile?: AttachedEnvironmentZoneProfile
}

/** @deprecated Use {@link BattlefieldEffectInstance}. */
export type AttachedAuraInstance = BattlefieldEffectInstance

export interface EncounterState {
  combatantsById: Record<string, CombatantInstance>
  partyCombatantIds: string[]
  enemyCombatantIds: string[]
  initiative: InitiativeRoll[]
  initiativeOrder: string[]
  activeCombatantId: string | null
  turnIndex: number
  roundNumber: number
  started: boolean
  log: CombatLogEvent[]
  space?: EncounterSpace
  placements?: CombatantPosition[]
  /** Persistent battlefield effects (e.g. emanation auras). */
  attachedAuraInstances?: BattlefieldEffectInstance[]
  /**
   * **Runtime** global encounter environment (initialized from setup when the encounter starts).
   * May change during play via `updateEncounterEnvironmentBaseline`. Layer with `environmentZones`
   * for per-cell resolution (`resolveWorldEnvironmentForCell` / `resolveWorldEnvironmentFromEncounterState`).
   */
  environmentBaseline?: EncounterEnvironmentBaseline
  /** Localized environment overrides (magical darkness patches, fog, etc.). */
  environmentZones?: EncounterEnvironmentZone[]
}
