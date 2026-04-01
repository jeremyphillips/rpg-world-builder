/**
 * Combat-owned startup seam: confirmed setup payload → initial {@link EncounterState}.
 * Distinct from {@link applyCombatIntent}, which applies commands to an existing encounter.
 * A future server could accept the same payload shape to create an authoritative session.
 */

import type { BattlefieldSpellContext } from '../state/battlefield/battlefield-spatial-movement-modifiers'
import { createEncounterState } from '../state/runtime'
import type { CombatStartupInput, CombatStartupResult } from './combat-startup.types'

export function startEncounterFromSetup(input: CombatStartupInput): CombatStartupResult {
  if (input.combatants.length === 0) {
    return {
      ok: false,
      error: {
        code: 'no-combatants',
        message: 'Cannot start encounter without at least one combatant.',
      },
    }
  }

  const bs = input.battlefieldSpell
  const spellCatalog = bs?.spellsById
  const battlefieldSpell: BattlefieldSpellContext | undefined =
    bs != null
      ? {
          spellLookup: spellCatalog != null ? (id) => spellCatalog[id] : () => undefined,
          monstersById: bs.monstersById,
          suppressSameSideHostile: bs.suppressSameSideHostile,
        }
      : undefined

  const state = createEncounterState(input.combatants, {
    space: input.space,
    placementOptions: input.placementOptions,
    environmentBaseline: input.environmentBaseline,
    environmentZones: input.environmentZones,
    rng: input.rng,
    battlefieldSpell,
    monstersById: bs?.monstersById,
    monsterRuntimeContext: input.monsterRuntimeContext,
  })

  return { ok: true, state }
}
