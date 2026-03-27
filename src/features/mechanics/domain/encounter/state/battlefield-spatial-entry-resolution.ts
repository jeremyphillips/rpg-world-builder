import type { Spell } from '@/features/content/spells/domain/types/spell.types'
import type { Effect } from '@/features/mechanics/domain/effects/effects.types'
import type { Monster } from '@/features/content/monsters/domain/types'
import { applyActionEffects } from '../resolution/action/action-effects'
import type { EncounterState } from './types'
import { isDefeatedCombatant } from './combatant-participation'
import {
  buildSyntheticSpellAction,
  combatantInsideAttachedSphereAura,
  injectSpellSaveDcDeep,
} from './battlefield-attached-aura-shared'

/**
 * Options for resolving movement-entry spatial effects on attached auras (see {@link resolveAttachedAuraSpatialEntryAfterMovement}).
 */
export type BattlefieldSpatialEntryResolutionOptions = {
  spellLookup: (spellId: string) => Spell | undefined
  suppressSameSideHostile?: boolean
  monstersById?: Record<string, Monster>
  rng?: () => number
}

/**
 * After a movement, compares `stateBefore` vs `stateAfter` placements and runs **enter** payloads
 * for attached sphere auras when a combatant **newly** becomes inside the sphere (outside → inside).
 *
 * Covers:
 * - A creature moving into the aura
 * - The aura owner moving so the sphere sweeps onto others (reconciliation over all combatants)
 *
 * Uses `interval` effects that include `spatialTriggers: ['enter']` (same nested save/damage as turn cadence).
 */
export function resolveAttachedAuraSpatialEntryAfterMovement(
  stateBefore: EncounterState,
  stateAfter: EncounterState,
  options: BattlefieldSpatialEntryResolutionOptions,
): EncounterState {
  const auras = stateAfter.attachedAuraInstances ?? []
  if (auras.length === 0) return stateAfter

  const spaceBefore = stateBefore.space
  const placementsBefore = stateBefore.placements
  const spaceAfter = stateAfter.space
  const placementsAfter = stateAfter.placements
  if (!spaceAfter || !placementsAfter) return stateAfter

  const rng = options.rng ?? Math.random
  let nextState = stateAfter

  const combatantIds = Object.keys(nextState.combatantsById).sort()

  for (const aura of auras) {
    if (aura.attachedTo !== 'self' || aura.area.kind !== 'sphere') continue

    const spellSaveDc = aura.spellSaveDc
    if (spellSaveDc == null) continue

    const spell = options.spellLookup(aura.spellId)
    if (!spell) continue

    const source = nextState.combatantsById[aura.sourceCombatantId]
    if (!source || isDefeatedCombatant(source)) continue

    const intervals = (spell.effects ?? []).filter(
      (e): e is Extract<Effect, { kind: 'interval' }> =>
        e.kind === 'interval' &&
        e.spatialTriggers?.includes('enter') === true &&
        e.every.unit === 'turn' &&
        e.every.value === 1,
    )
    if (intervals.length === 0) continue

    const syntheticAction = buildSyntheticSpellAction(spell, aura.id, 'spatial-entry')

    for (const combatantId of combatantIds) {
      if (combatantId === aura.sourceCombatantId) continue

      const target = nextState.combatantsById[combatantId]
      if (!target || isDefeatedCombatant(target)) continue

      if (aura.unaffectedCombatantIds.includes(combatantId)) continue

      if (options.suppressSameSideHostile && source.side === target.side) continue

      const beforeInside =
        spaceBefore && placementsBefore
          ? combatantInsideAttachedSphereAura(spaceBefore, placementsBefore, aura, combatantId)
          : false

      const afterInside = combatantInsideAttachedSphereAura(spaceAfter, placementsAfter, aura, combatantId)

      if (beforeInside || !afterInside) continue

      for (const interval of intervals) {
        const payload = injectSpellSaveDcDeep(interval.effects, spellSaveDc)
        const result = applyActionEffects(nextState, source, target, syntheticAction, payload, {
          rng,
          sourceLabel: `${spell.name} (aura — entering)`,
          monstersById: options.monstersById,
        })
        nextState = result.state
      }
    }
  }

  return nextState
}
