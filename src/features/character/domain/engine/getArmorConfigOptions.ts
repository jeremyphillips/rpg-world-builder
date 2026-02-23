/** @deprecated Use getLoadoutPickerOptions instead */

import type { Character } from '@/shared/types'
import type { Effect } from '@/features/mechanics/domain/effects/effects.types'
import type { FormulaEffect } from '@/features/mechanics/domain/resolution/formula.engine'
import { resolveStat } from '@/features/mechanics/domain/resolution/stat-resolver'
import type { EvaluationContext } from '@/features/mechanics/domain/conditions/evaluation-context.types'
import { buildCharacterContext } from './buildCharacterContext'
import {
  mapEquipmentToPossibleEffects,
  type ArmorEffectEntry,
  type ShieldEffectEntry,
} from './mapEquipmentToPossibleEffects'

export type ArmorConfigOption = {
  id: string
  armorId?: string
  armorName?: string
  shieldId?: string
  shieldName?: string
  effects: Effect[]
  totalAC: number
  breakdown: string
  label: string
}

function buildConfigId(armorId?: string, shieldId?: string): string {
  return `${armorId ?? 'unarmored'}|${shieldId ?? 'no-shield'}`
}

function buildUnarmoredFormulaEffect(): FormulaEffect {
  return {
    kind: 'formula',
    target: 'armor_class',
    formula: { base: 10, ability: 'dexterity' },
  }
}

function buildOption(
  context: EvaluationContext,
  intrinsicEffects: Effect[],
  armor: ArmorEffectEntry | null,
  shield: ShieldEffectEntry | null,
  magicItemEffects: Effect[]
): ArmorConfigOption {
  const equipEffects: Effect[] = [
    armor ? (armor.effect as Effect) : (buildUnarmoredFormulaEffect() as Effect),
    ...(shield ? [shield.effect] : []),
    ...magicItemEffects,
  ]

  const allEffects = [...intrinsicEffects, ...equipEffects]
  const totalAC = resolveStat('armor_class', context, allEffects)

  const parts: string[] = []
  if (armor) {
    parts.push(`${armor.effect.formula.base ?? 0} (${armor.name})`)
  } else {
    parts.push('10 (Unarmored)')
  }
  if (shield) {
    parts.push(`+${shield.acBonus} (${shield.name})`)
  }

  const labelParts: string[] = []
  labelParts.push(armor?.name ?? 'Unarmored')
  if (shield) labelParts.push(shield.name)

  return {
    id: buildConfigId(armor?.armorId, shield?.shieldId),
    armorId: armor?.armorId,
    armorName: armor?.name,
    shieldId: shield?.shieldId,
    shieldName: shield?.name,
    effects: equipEffects,
    totalAC,
    breakdown: parts.join(' '),
    label: labelParts.join(' + '),
  }
}

/**
 * Enumerate all valid armor + shield combos.
 * Each option contains its own effects array and resolved AC.
 * Sorted highest AC first.
 */
export function getArmorConfigOptions(
  character: Character,
  intrinsicEffects: Effect[] = []
): ArmorConfigOption[] {
  const edition = character.edition ?? '5e'
  // if (edition !== '5e') return []

  const context = buildCharacterContext(character)
  const { armorEffects, shieldEffects, magicItemEffects } =
    mapEquipmentToPossibleEffects(character.equipment, edition)

  const options: ArmorConfigOption[] = []

  const armorChoices: (ArmorEffectEntry | null)[] = [
    ...armorEffects,
    null,
  ]

  const shieldChoices: (ShieldEffectEntry | null)[] = [
    null,
    ...shieldEffects,
  ]

  for (const armor of armorChoices) {
    for (const shield of shieldChoices) {
      options.push(
        buildOption(context, intrinsicEffects, armor, shield, magicItemEffects)
      )
    }
  }

  options.sort((a, b) => b.totalAC - a.totalAC)
  return options
}

/**
 * Pick the active armor config option.
 * Falls back to highest AC when selectedId is null or invalid.
 */
export function pickActiveOption(
  options: ArmorConfigOption[],
  selectedId: string | null | undefined
): ArmorConfigOption | null {
  if (options.length === 0) return null
  if (selectedId) {
    const match = options.find(o => o.id === selectedId)
    if (match) return match
  }
  return options[0]
}
