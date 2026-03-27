import type { Spell } from '@/features/content/spells/domain/types/spell.types'
import type { EncounterSpace, CombatantPosition } from '@/features/encounter/space'
import { getCellForCombatant, gridDistanceFt } from '@/features/encounter/space'
import type { Effect } from '@/features/mechanics/domain/effects/effects.types'
import type { CombatActionDefinition } from '../resolution/combat-action.types'
import type { AttachedAuraInstance } from './types'

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
  space: EncounterSpace,
  placements: CombatantPosition[],
  aura: AttachedAuraInstance,
  targetCombatantId: string,
): boolean {
  if (aura.area.kind !== 'sphere') return false
  const sourceCell = getCellForCombatant(placements, aura.sourceCombatantId)
  const targetCell = getCellForCombatant(placements, targetCombatantId)
  if (!sourceCell || !targetCell) return false
  const dist = gridDistanceFt(space, sourceCell, targetCell)
  if (dist === undefined) return false
  return dist <= aura.area.size
}
