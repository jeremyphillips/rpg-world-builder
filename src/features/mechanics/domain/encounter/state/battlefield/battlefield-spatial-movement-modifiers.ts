import type { Spell } from '@/features/content/spells/domain/types/spell.types'
import type { Monster } from '@/features/content/monsters/domain/types'
import type { EncounterState } from '../types'
import type { CombatantInstance } from '../types'
import {
  combatantInsideAttachedSphereAura,
  getSpeedMultiplyProductFromEffects,
} from '../auras/battlefield-attached-aura-shared'
import { getEffectsForAttachedBattlefieldSource } from '../auras/battlefield-attached-source-effects'
import { isDefeatedCombatant } from '../combatants/combatant-participation'
import { getCombatantBaseMovement } from './combatant-movement-helpers'
import { getSpeedConsequences } from '../conditions/condition-rules'

export type BattlefieldSpellContext = {
  spellLookup?: (spellId: string) => Spell | undefined
  monstersById?: Record<string, Monster>
  suppressSameSideHostile?: boolean
}

/**
 * Product of authored `modifier` effects on the spell that target speed with `mode: 'multiply'`
 * (e.g. Spirit Guardians 0.5 while in the emanation — applied spatially, not here per se).
 */
export function getSpeedMultiplyProductFromSpell(spell: Spell): number {
  return getSpeedMultiplyProductFromEffects(spell.effects ?? [])
}

/**
 * Combined movement speed multiplier from all attached sphere auras that currently overlap this combatant.
 * Returns 1 when no grid, no lookup, or no applicable aura overlap.
 */
export function getSpatialAttachedAuraSpeedMultiplier(
  state: EncounterState,
  combatantId: string,
  ctx?: BattlefieldSpellContext,
): number {
  const { space, placements } = state
  if (!space || !placements || !ctx) return 1
  if (!ctx.spellLookup && !ctx.monstersById) return 1

  const combatant = state.combatantsById[combatantId]
  if (!combatant || isDefeatedCombatant(combatant)) return 1

  let multiplier = 1
  const auras = state.attachedAuraInstances ?? []

  for (const aura of auras) {
    if (aura.area.kind !== 'sphere') continue

    if (aura.anchor.kind === 'creature' && combatantId === aura.anchor.combatantId) continue

    if (aura.unaffectedCombatantIds.includes(combatantId)) continue

    const caster = state.combatantsById[aura.casterCombatantId]
    if (!caster || isDefeatedCombatant(caster)) continue

    if (ctx.suppressSameSideHostile && caster.side === combatant.side) continue

    if (!combatantInsideAttachedSphereAura(state, aura, combatantId)) continue

    const rootEffects = getEffectsForAttachedBattlefieldSource(aura.source, {
      spellLookup: ctx.spellLookup ?? (() => undefined),
      monstersById: ctx.monstersById,
    })
    const m = getSpeedMultiplyProductFromEffects(rootEffects)
    if (m > 0 && m < 1) {
      multiplier *= m
    }
  }

  return multiplier
}

/**
 * Effective movement budget in feet for this combatant **right now** (base speed × spatial aura multipliers),
 * before spending movement this turn. Used for turn reset and post-move reconciliation.
 */
export function getEffectiveGroundMovementBudgetFt(
  combatant: CombatantInstance,
  state: EncounterState,
  ctx?: BattlefieldSpellContext,
): number {
  if (getSpeedConsequences(combatant).speedBecomesZero) return 0

  const base = getCombatantBaseMovement(combatant)
  if (base <= 0) return 0

  const mult = getSpatialAttachedAuraSpeedMultiplier(state, combatant.instanceId, ctx)
  return Math.max(0, Math.floor(base * mult))
}

/** Shared by movement math and UI: true when spatial aura multipliers reduce speed below base. */
export function combatantHasSpatialSpeedReduction(
  combatant: CombatantInstance,
  state: EncounterState,
  ctx?: BattlefieldSpellContext,
): boolean {
  if (!ctx || (!ctx.spellLookup && !ctx.monstersById)) return false
  if (getSpeedConsequences(combatant).speedBecomesZero) return false
  return getSpatialAttachedAuraSpeedMultiplier(state, combatant.instanceId, ctx) < 1
}

export type SpatialBattlefieldPresentationOptions = {
  encounterState: EncounterState
  battlefieldSpell: BattlefieldSpellContext
}
