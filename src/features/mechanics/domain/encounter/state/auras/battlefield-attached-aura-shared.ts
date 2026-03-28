import type { Spell } from '@/features/content/spells/domain/types/spell.types'
import { getCellForCombatant, gridDistanceFt } from '@/features/encounter/space'
import type { Effect } from '@/features/mechanics/domain/effects/effects.types'
import type { CombatActionDefinition } from '../../resolution/combat-action.types'
import { resolveBattlefieldEffectOriginCellId } from '../battlefield/battlefield-effect-anchor'
import type { BattlefieldEffectInstance, EncounterState } from '../types'

/** Product of speed `multiply` modifiers from an effect list (attached aura spatial speed). */
export function getSpeedMultiplyProductFromEffects(effects: Effect[]): number {
  let product = 1
  for (const e of effects) {
    if (
      e.kind === 'modifier' &&
      e.target === 'speed' &&
      e.mode === 'multiply' &&
      typeof e.value === 'number'
    ) {
      product *= e.value
    }
  }
  return product
}

export function injectSpellSaveDcDeep(effects: Effect[], dc: number): Effect[] {
  return effects.map((effect) => {
    if (effect.kind === 'save') {
      const withDc =
        typeof effect.save.dc === 'number'
          ? effect
          : ({ ...effect, save: { ...effect.save, dc } } as Effect)
      const e = withDc as Extract<Effect, { kind: 'save' }>
      return {
        ...e,
        onFail: injectSpellSaveDcDeep(e.onFail, dc),
        onSuccess: e.onSuccess ? injectSpellSaveDcDeep(e.onSuccess, dc) : undefined,
      } as Effect
    }
    return effect
  })
}

export function buildSyntheticSpellAction(spell: Spell, auraId: string, suffix: string): CombatActionDefinition {
  const conc =
    spell.duration?.kind === 'timed' &&
    'concentration' in spell.duration &&
    spell.duration.concentration === true
  return {
    id: `battlefield-${suffix}-${spell.id}-${auraId}`,
    label: spell.name,
    kind: 'spell',
    cost: {},
    resolutionMode: 'effects',
    displayMeta: {
      source: 'spell',
      spellId: spell.id,
      level: spell.level,
      concentration: Boolean(conc),
      range: 'Self',
    },
  }
}

/** Minimal action for `applyActionEffects` when resolving intervals from non-spell attached sources. */
export function buildSyntheticMonsterAuraIntervalAction(label: string, auraId: string, suffix: string): CombatActionDefinition {
  return {
    id: `battlefield-${suffix}-${auraId}`,
    label,
    kind: 'monster-action',
    cost: {},
    resolutionMode: 'effects',
    displayMeta: {
      source: 'natural',
      attackType: 'special',
      description: label,
    },
  }
}

/**
 * Strict sphere check for overlap transitions: false if placements are missing (no “assume inside”).
 */
export function combatantInsideAttachedSphereAura(
  state: EncounterState,
  aura: BattlefieldEffectInstance,
  targetCombatantId: string,
): boolean {
  const space = state.space
  const placements = state.placements
  if (!space || !placements || aura.area.kind !== 'sphere') return false
  const originCellId = resolveBattlefieldEffectOriginCellId(space, placements, aura.anchor)
  const targetCell = getCellForCombatant(placements, targetCombatantId)
  if (!originCellId || !targetCell) return false
  const dist = gridDistanceFt(space, originCellId, targetCell)
  if (dist === undefined) return false
  return dist <= aura.area.size
}

/**
 * Whether `combatantId` is within `rangeFt` (Chebyshev sphere) of the aura’s resolved origin.
 * Matches legacy “missing grid means permissive” behavior for missing target placement.
 */
export function isCombatantWithinFtOfAuraOrigin(
  state: EncounterState,
  aura: BattlefieldEffectInstance,
  combatantId: string,
  rangeFt: number,
): boolean {
  const space = state.space
  const placements = state.placements
  if (!space || !placements) return true
  const originCellId = resolveBattlefieldEffectOriginCellId(space, placements, aura.anchor)
  const targetCell = getCellForCombatant(placements, combatantId)
  if (!originCellId || !targetCell) return true
  const dist = gridDistanceFt(space, originCellId, targetCell)
  if (dist === undefined) return true
  return dist <= rangeFt
}
