import type { AbilityScores } from '@/shared/types/character.core'
import type { EvaluationContext } from '../conditions/evaluation-context.types'
import type { Effect } from '../effects/effects.types'
import { getAbilityModifier } from '../core/ability.utils'
import { getProficiencyBonus } from '../core/progression/proficiency'
import { resolveStatDetailed, type BreakdownToken } from './stat-resolver'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AttackHand = 'main' | 'off'

export type AttackOptions = {
  hand?: AttackHand
}

export type WeaponAttackInput = {
  type?: 'melee' | 'ranged'
  properties?: string[]
  damage?: { default?: string; versatile?: string; sm?: string; l?: string }
  damageType?: string
  edition?: string
}

export type AttackBonusResult = {
  bonus: number
  abilityUsed: keyof AbilityScores
  abilityMod: number
  proficiencyBonus: number
  breakdown: BreakdownToken[]
}

export type DamageResult = {
  dice: string
  modifier: number
  total: string
  damageType: string
  breakdown: BreakdownToken[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Determine which ability score drives the attack/damage roll.
 */
function pickAttackAbility(
  context: EvaluationContext,
  weapon: WeaponAttackInput
): keyof AbilityScores {
  const isFinesse = weapon.properties?.includes('finesse') ?? false
  const isRanged = weapon.type === 'ranged'

  if (isFinesse) {
    const str = getAbilityModifier(context.self, 'strength')
    const dex = getAbilityModifier(context.self, 'dexterity')
    return dex >= str ? 'dexterity' : 'strength'
  }

  return isRanged ? 'dexterity' : 'strength'
}

/**
 * Select the appropriate damage dice string from weapon data.
 *
 * - 1e/2e: prefer sm (Small/Medium) field
 * - 5e/3e/4e: prefer default field
 */
function selectDamageDice(
  damage: WeaponAttackInput['damage'],
  edition?: string
): string {
  if (!damage) return '—'
  if (edition === '1e' || edition === '2e') return damage.sm ?? damage.default ?? '—'
  return damage.default ?? '—'
}

// ---------------------------------------------------------------------------
// Attack bonus resolution
// ---------------------------------------------------------------------------

/**
 * Resolve a weapon's attack bonus through the mechanics engine.
 *
 * Builds a formula effect (ability + proficiency) for the weapon, then
 * passes it through resolveStat so that any modifier effects targeting
 * 'attack_roll' are applied.
 *
 * TODO: Use options.hand to apply hand-specific modifiers:
 *  - Fighting styles (e.g. Two-Weapon Fighting adds ability mod to off-hand)
 *  - Feats (e.g. Dual Wielder)
 *  - Edition-specific off-hand attack penalties (1e/2e)
 */
export function resolveWeaponAttackBonus(
  context: EvaluationContext,
  weapon: WeaponAttackInput,
  effects: Effect[],
  options: AttackOptions = {}
): AttackBonusResult {
  const _hand = options.hand ?? 'main'
  const abilityUsed = pickAttackAbility(context, weapon)
  const abilityMod = getAbilityModifier(context.self, abilityUsed)
  const proficiencyBonus = getProficiencyBonus(context.self.level)

  const weaponFormula: Effect = {
    kind: 'formula',
    target: 'attack_roll',
    formula: { ability: abilityUsed, proficiency: true },
    source: 'weapon',
  } as Effect

  const result = resolveStatDetailed('attack_roll', context, [weaponFormula, ...effects])

  return {
    bonus: result.value,
    abilityUsed,
    abilityMod,
    proficiencyBonus,
    breakdown: result.breakdown,
  }
}

// ---------------------------------------------------------------------------
// Damage resolution
// ---------------------------------------------------------------------------

/**
 * Resolve a weapon's damage through the mechanics engine.
 *
 * Selects the correct damage dice for the edition, adds the ability modifier,
 * and applies any modifier effects targeting 'damage'.
 *
 * TODO: Use options.hand to apply hand-specific damage rules:
 *  - 5e off-hand: no ability mod to damage (PHB p. 195)
 *  - Two-Weapon Fighting style: adds ability mod back to off-hand damage
 *  - Feats (e.g. Dual Wielder: non-light weapons in off hand)
 *  - Edition-specific off-hand damage penalties
 */
export function resolveWeaponDamage(
  context: EvaluationContext,
  weapon: WeaponAttackInput,
  effects: Effect[],
  options: AttackOptions = {}
): DamageResult {
  const hand = options.hand ?? 'main'
  const abilityUsed = pickAttackAbility(context, weapon)

  // Off-hand attacks don't add ability mod to damage (5e default).
  // TODO: Check for Two-Weapon Fighting style to override this.
  const includeAbilityInDamage = hand === 'main'

  const damageFormula: Effect = {
    kind: 'formula',
    target: 'damage',
    formula: includeAbilityInDamage ? { ability: abilityUsed } : {},
    source: 'weapon',
  } as Effect

  const result = resolveStatDetailed('damage', context, [damageFormula, ...effects])

  const dice = selectDamageDice(weapon.damage, weapon.edition)
  const damageType = weapon.damageType ?? ''

  const totalParts = [dice]
  if (result.value > 0) totalParts.push(`+ ${result.value}`)
  else if (result.value < 0) totalParts.push(`- ${Math.abs(result.value)}`)

  const breakdown: BreakdownToken[] = [
    { label: dice, value: dice, type: 'dice' },
    ...result.breakdown,
  ]

  if (damageType) {
    breakdown.push({ label: damageType, value: damageType, type: 'damage_type' })
  }

  return {
    dice,
    modifier: result.value,
    total: totalParts.join(' '),
    damageType,
    breakdown,
  }
}
