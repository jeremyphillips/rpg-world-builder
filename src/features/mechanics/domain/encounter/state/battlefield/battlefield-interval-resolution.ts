import type { Spell } from '@/features/content/spells/domain/types/spell.types'
import type { Effect } from '@/features/mechanics/domain/effects/effects.types'
import type { TurnBoundary } from '@/features/mechanics/domain/effects/timing.types'
import type { Monster } from '@/features/content/monsters/domain/types'
import { applyActionEffects } from '../../resolution/action/action-effects'
import type { EncounterState } from '../types'
import { isDefeatedCombatant } from '../combatants/combatant-participation'
import { appendEncounterNote } from '../effects/logging'
import {
  buildSyntheticMonsterAuraIntervalAction,
  buildSyntheticSpellAction,
  injectSpellSaveDcDeep,
  isCombatantWithinFtOfAuraOrigin,
} from '../auras/battlefield-attached-aura-shared'
import {
  getEffectsForAttachedBattlefieldSource,
  getLabelForAttachedBattlefieldSource,
} from '../auras/battlefield-attached-source-effects'

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

  const resolveOpts = {
    spellLookup: options.spellLookup,
    monstersById: options.monstersById,
  }

  for (const aura of auras) {
    if (aura.area.kind !== 'sphere') continue

    const saveDc = aura.saveDc

    const rootEffects = getEffectsForAttachedBattlefieldSource(aura.source, resolveOpts)
    if (rootEffects.length === 0) {
      const label = getLabelForAttachedBattlefieldSource(aura.source, resolveOpts)
      nextState = appendEncounterNote(
        nextState,
        `Attached aura (${label}): no authored effects; skipped interval resolution.`,
        { targetIds: [actingCombatantId] },
      )
      continue
    }

    const caster = nextState.combatantsById[aura.casterCombatantId]
    if (!caster || isDefeatedCombatant(caster)) continue

    if (aura.anchor.kind === 'creature' && actingCombatantId === aura.anchor.combatantId) continue

    if (aura.unaffectedCombatantIds.includes(actingCombatantId)) continue

    if (options.suppressSameSideHostile && caster.side === acting.side) continue

    const inRange = isCombatantWithinFtOfAuraOrigin(nextState, aura, actingCombatantId, aura.area.size)
    if (!inRange) continue

    const intervals = rootEffects.filter(
      (e): e is Extract<Effect, { kind: 'interval' }> =>
        e.kind === 'interval' && e.every.unit === 'turn' && e.every.value === 1,
    )
    if (intervals.length === 0) continue

    const auraLabel = getLabelForAttachedBattlefieldSource(aura.source, resolveOpts)
    const syntheticAction =
      aura.source.kind === 'spell'
        ? (() => {
            const spell = options.spellLookup(aura.source.spellId)
            return spell ? buildSyntheticSpellAction(spell, aura.id, 'interval') : null
          })()
        : buildSyntheticMonsterAuraIntervalAction(auraLabel, aura.id, 'interval')

    if (!syntheticAction) continue

    for (const interval of intervals) {
      const payload =
        typeof saveDc === 'number' ? injectSpellSaveDcDeep(interval.effects, saveDc) : interval.effects
      const result = applyActionEffects(nextState, caster, acting, syntheticAction, payload, {
        rng,
        sourceLabel: `${auraLabel} (aura)`,
        monstersById: options.monstersById,
      })
      nextState = result.state
    }
  }

  return nextState
}
