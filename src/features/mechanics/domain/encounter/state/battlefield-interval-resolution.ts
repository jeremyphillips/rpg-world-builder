import type { Spell } from '@/features/content/spells/domain/types/spell.types'
import type { Effect } from '@/features/mechanics/domain/effects/effects.types'
import type { TurnBoundary } from '@/features/mechanics/domain/effects/timing.types'
import type { Monster } from '@/features/content/monsters/domain/types'
import { isWithinRange } from '@/features/encounter/space'
import { applyActionEffects } from '../resolution/action/action-effects'
import type { EncounterState } from './types'
import { isDefeatedCombatant } from './combatant-participation'
import { appendEncounterNote } from './logging'
import { buildSyntheticSpellAction, injectSpellSaveDcDeep } from './battlefield-attached-aura-shared'

/**
 * Options for resolving turn-boundary interval effects from persistent attached battlefield state
 * (e.g. {@link EncounterState.attachedAuraInstances}).
 */
export type BattlefieldIntervalResolutionOptions = {
  /** Load spell definitions by id (interval payloads are read from authored `effects`). */
  spellLookup: (spellId: string) => Spell | undefined
  /** When true, skip interval harm between combatants on the same side (party vs enemies). */
  suppressSameSideHostile?: boolean
  monstersById?: Record<string, Monster>
  rng?: () => number
}

/**
 * At a turn boundary (currently **end** only), applies interval payloads from active attached auras
 * whose spell data includes `interval` effects with `every.unit === 'turn'`, when the acting combatant
 * is spatially inside the aura and not exempt.
 *
 * Not spell-specific: Spirit Guardians is the first consumer via authored `interval` + attached aura state.
 */
export function resolveIntervalEffectsForCombatantAtTurnBoundary(
  state: EncounterState,
  actingCombatantId: string | null,
  boundary: TurnBoundary,
  options: BattlefieldIntervalResolutionOptions,
): EncounterState {
  if (boundary !== 'end' || !actingCombatantId) return state

  const acting = state.combatantsById[actingCombatantId]
  if (!acting || isDefeatedCombatant(acting)) return state

  const auras = state.attachedAuraInstances ?? []
  if (auras.length === 0) return state

  const rng = options.rng ?? Math.random
  let nextState = state

  for (const aura of auras) {
    if (aura.attachedTo !== 'self' || aura.area.kind !== 'sphere') continue

    const spellSaveDc = aura.spellSaveDc
    if (spellSaveDc == null) {
      nextState = appendEncounterNote(
        nextState,
        `Attached aura (${aura.spellId}): missing spell save DC; skipped interval resolution.`,
        { targetIds: [actingCombatantId] },
      )
      continue
    }

    const spell = options.spellLookup(aura.spellId)
    if (!spell) {
      nextState = appendEncounterNote(
        nextState,
        `Attached aura: unknown spell "${aura.spellId}"; skipped interval resolution.`,
        { targetIds: [actingCombatantId] },
      )
      continue
    }

    const source = nextState.combatantsById[aura.sourceCombatantId]
    if (!source || isDefeatedCombatant(source)) continue

    if (actingCombatantId === aura.sourceCombatantId) continue

    if (aura.unaffectedCombatantIds.includes(actingCombatantId)) continue

    if (options.suppressSameSideHostile && source.side === acting.side) continue

    const space = nextState.space
    const placements = nextState.placements
    if (!space || !placements) continue

    const inRange = isWithinRange(space, placements, aura.sourceCombatantId, actingCombatantId, aura.area.size)
    if (!inRange) continue

    const intervals = (spell.effects ?? []).filter(
      (e): e is Extract<Effect, { kind: 'interval' }> =>
        e.kind === 'interval' && e.every.unit === 'turn' && e.every.value === 1,
    )
    if (intervals.length === 0) continue

    const syntheticAction = buildSyntheticSpellAction(spell, aura.id, 'interval')

    for (const interval of intervals) {
      const payload = injectSpellSaveDcDeep(interval.effects, spellSaveDc)
      const result = applyActionEffects(nextState, source, acting, syntheticAction, payload, {
        rng,
        sourceLabel: `${spell.name} (aura)`,
        monstersById: options.monstersById,
      })
      nextState = result.state
    }
  }

  return nextState
}
