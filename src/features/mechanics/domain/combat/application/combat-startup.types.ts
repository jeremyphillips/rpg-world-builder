import type { EncounterEnvironmentBaseline, EncounterEnvironmentZone } from '@/features/mechanics/domain/environment'
import type { Monster } from '@/features/content/monsters/domain/types'
import type { Spell } from '@/features/content/spells/domain/types/spell.types'
import type { MonsterRuntimeContext } from '../runtime/monster-runtime.types'
import type { EncounterSpace, InitialPlacementOptions } from '../space'
import type { CombatantInstance, EncounterState } from '../state/types'

/**
 * Confirmed inputs for combat initialization (Phase 4F startup seam).
 * Serializable plain data — no React, router, or UI shell objects.
 */
export type CombatStartupInput = {
  combatants: CombatantInstance[]
  space?: EncounterSpace
  placementOptions?: InitialPlacementOptions
  environmentBaseline?: EncounterEnvironmentBaseline
  environmentZones?: EncounterEnvironmentZone[]
  /** Initiative and start-of-encounter rolls; defaults inside the engine when omitted. */
  rng?: () => number
  /**
   * Spell catalog and monster catalog for battlefield/aura behavior during startup.
   * The application seam builds `BattlefieldSpellContext.spellLookup` from `spellsById`.
   */
  battlefieldSpell?: {
    spellsById?: Record<string, Spell>
    monstersById?: Record<string, Monster>
    suppressSameSideHostile?: boolean
  }
  monsterRuntimeContext?: MonsterRuntimeContext
}

export type CombatStartupError = {
  code: 'no-combatants'
  message: string
}

export type CombatStartupSuccess = {
  ok: true
  state: EncounterState
}

export type CombatStartupFailure = {
  ok: false
  error: CombatStartupError
}

export type CombatStartupResult = CombatStartupSuccess | CombatStartupFailure
