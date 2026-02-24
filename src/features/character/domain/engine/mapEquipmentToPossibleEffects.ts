/** @deprecated Use getEquipmentEffects + selectActiveEquipmentEffects instead */

import type { Effect } from '@/features/mechanics/domain/effects/effects.types'
import type { FormulaEffect } from '@/features/mechanics/domain/resolution/formula.engine'
import type { Equipment } from '@/shared/types/character.core'
import { equipmentCore } from '@/data/equipmentCore/equipmentCore'
import { getEquipmentEffects } from '@/features/mechanics/domain/effects/sources/equipment-to-effects'

export type ArmorEffectEntry = {
  armorId: string
  name: string
  category: string
  effect: FormulaEffect
}

export type ShieldEffectEntry = {
  shieldId: string
  name: string
  acBonus: number
  effect: Effect
}

/**
 * @deprecated Thin wrapper over getEquipmentEffects. Use getEquipmentEffects directly.
 */
export function mapEquipmentToPossibleEffects(
  equipment: Equipment | undefined,
): {
  armorEffects: ArmorEffectEntry[]
  shieldEffects: ShieldEffectEntry[]
  magicItemEffects: Effect[]
} {
  const allEffects = getEquipmentEffects(equipment)

  const armorEffects: ArmorEffectEntry[] = []
  const shieldEffects: ShieldEffectEntry[] = []
  const magicItemEffects: Effect[] = []

  for (const effect of allEffects) {
    const source = ('source' in effect ? effect.source : undefined) as string | undefined
    if (!source) {
      magicItemEffects.push(effect)
      continue
    }

    if (source.startsWith('armor:')) {
      const armorId = source.slice('armor:'.length)
      const item = equipmentCore.armor.find((a) => a.id === armorId)
      armorEffects.push({
        armorId,
        name: item?.name ?? armorId,
        category: item?.category ?? 'light',
        effect: effect as unknown as FormulaEffect,
      })
    } else if (source.startsWith('shield:')) {
      const shieldId = source.slice('shield:'.length)
      const item = equipmentCore.armor.find((a) => a.id === shieldId)
      const bonus = effect.kind === 'modifier' && typeof effect.value === 'number' ? effect.value : 0
      shieldEffects.push({
        shieldId,
        name: item?.name ?? shieldId,
        acBonus: bonus,
        effect,
      })
    } else {
      magicItemEffects.push(effect)
    }
  }

  return { armorEffects, shieldEffects, magicItemEffects }
}
