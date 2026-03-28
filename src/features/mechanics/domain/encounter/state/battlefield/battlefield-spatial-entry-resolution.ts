import type { Spell } from '@/features/content/spells/domain/types/spell.types'
import type { Effect } from '@/features/mechanics/domain/effects/effects.types'
import type { Monster } from '@/features/content/monsters/domain/types'
import { applyActionEffects } from '../../resolution/action/action-effects'
import type { EncounterState } from '../types'
import { isDefeatedCombatant } from '../combatants/combatant-participation'
import {
  buildSyntheticMonsterAuraIntervalAction,
  buildSyntheticSpellAction,
  combatantInsideAttachedSphereAura,
  injectSpellSaveDcDeep,
} from '../auras/battlefield-attached-aura-shared'
import {
  getEffectsForAttachedBattlefieldSource,
  getLabelForAttachedBattlefieldSource,
} from '../auras/battlefield-attached-source-effects'

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

  const spaceAfter = stateAfter.space
  const placementsAfter = stateAfter.placements
  if (!spaceAfter || !placementsAfter) return stateAfter

  const rng = options.rng ?? Math.random
  let nextState = stateAfter

  const combatantIds = Object.keys(nextState.combatantsById).sort()
  const resolveOpts = {
    spellLookup: options.spellLookup,
    monstersById: options.monstersById,
  }

  for (const aura of auras) {
    if (aura.area.kind !== 'sphere') continue

    const saveDc = aura.saveDc
    if (saveDc == null) continue

    const rootEffects = getEffectsForAttachedBattlefieldSource(aura.source, resolveOpts)
    if (rootEffects.length === 0) continue

    const caster = nextState.combatantsById[aura.casterCombatantId]
    if (!caster || isDefeatedCombatant(caster)) continue

    const intervals = rootEffects.filter(
      (e): e is Extract<Effect, { kind: 'interval' }> =>
        e.kind === 'interval' &&
        e.spatialTriggers?.includes('enter') === true &&
        e.every.unit === 'turn' &&
        e.every.value === 1,
    )
    if (intervals.length === 0) continue

    const auraLabel = getLabelForAttachedBattlefieldSource(aura.source, resolveOpts)
    const syntheticAction =
      aura.source.kind === 'spell'
        ? (() => {
            const spell = options.spellLookup(aura.source.spellId)
            return spell ? buildSyntheticSpellAction(spell, aura.id, 'spatial-entry') : null
          })()
        : buildSyntheticMonsterAuraIntervalAction(auraLabel, aura.id, 'spatial-entry')

    if (!syntheticAction) continue

    for (const combatantId of combatantIds) {
      if (aura.anchor.kind === 'creature' && combatantId === aura.anchor.combatantId) continue

      const target = nextState.combatantsById[combatantId]
      if (!target || isDefeatedCombatant(target)) continue

      if (aura.unaffectedCombatantIds.includes(combatantId)) continue

      if (options.suppressSameSideHostile && caster.side === target.side) continue

      const beforeInside = combatantInsideAttachedSphereAura(stateBefore, aura, combatantId)

      const afterInside = combatantInsideAttachedSphereAura(stateAfter, aura, combatantId)

      if (beforeInside || !afterInside) continue

      for (const interval of intervals) {
        const payload = injectSpellSaveDcDeep(interval.effects, saveDc)
        const result = applyActionEffects(nextState, caster, target, syntheticAction, payload, {
          rng,
          sourceLabel: `${auraLabel} (aura — entering)`,
          monstersById: options.monstersById,
        })
        nextState = result.state
      }
    }
  }

  return nextState
}
