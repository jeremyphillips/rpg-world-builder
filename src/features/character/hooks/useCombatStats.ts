import { useMemo } from 'react'
import type { Character } from '@/shared/types/character.core'
import { useCampaignRules } from '@/app/providers/CampaignRulesProvider'
import { buildCharacterContext } from '../domain/engine/buildCharacterContext'
import { collectIntrinsicEffects } from '../domain/engine/collectCharacterEffects'
import { getLoadoutPickerOptions } from '../domain/engine/getLoadoutPickerOptions'
import { getWeaponPickerOptions } from '../domain/engine/getWeaponPickerOptions'
import { resolveStat, resolveStatDetailed, type BreakdownToken } from '@/features/mechanics/domain/resolution/stat-resolver'
import {
  resolveWeaponAttackBonus,
  resolveWeaponDamage,
  type AttackHand,
} from '@/features/mechanics/domain/resolution/attack-resolver'
import type { EvaluationContext } from '@/features/mechanics/domain/conditions/evaluation-context.types'
import type { Effect } from '@/features/mechanics/domain/effects/effects.types'
import {
  getEquipmentEffects,
  selectActiveEquipmentEffects,
  resolveLoadout,
  resolveEquipmentLoadoutDetailed,
  resolveWieldedWeaponIds,
} from '@/features/mechanics/domain/effects/sources/equipment-to-effects'
import {
  getMagicItemCandidateEffects,
  selectActiveMagicItemEffects,
} from '@/features/mechanics/domain/effects/sources/magic-items-to-effects'
import { getEnchantmentCandidateEffects } from '@/features/mechanics/domain/effects/sources/enchantments-to-effects'

// ---------------------------------------------------------------------------
// Attack types
// ---------------------------------------------------------------------------

export interface AttackEntry {
  weaponId: string
  name: string
  hand: AttackHand
  attackBonus: number
  attackBreakdown: BreakdownToken[]
  damage: string
  damageType: string
  damageBreakdown: BreakdownToken[]
}

// ---------------------------------------------------------------------------
// Attack helpers (catalog lookup — math is in attack-resolver)
// ---------------------------------------------------------------------------

export function getCharacterAttacks(
  _character: Character,
  context: EvaluationContext,
  effects: Effect[],
  wieldedWeaponIds: string[],
  weaponsById: Record<string, { id: string; name: string; type?: string; properties?: string[]; damage?: { default?: string }; damageType?: string }>,
): AttackEntry[] {
  if (wieldedWeaponIds.length === 0) return []

  return wieldedWeaponIds.map((id, idx) => {
    const hand: AttackHand = idx === 0 ? 'main' : 'off'
    const weapon = weaponsById[id]

    const weaponInput = {
      type: weapon?.type as 'melee' | 'ranged' | undefined,
      properties: weapon?.properties,
      damage: weapon?.damage,
      damageType: weapon?.damageType,
    }

    const atk = resolveWeaponAttackBonus(context, weaponInput, effects, { hand })
    const dmg = resolveWeaponDamage(context, weaponInput, effects, { hand })

    return {
      weaponId: id,
      name: weapon?.name ?? id,
      hand,
      attackBonus: atk.bonus,
      attackBreakdown: atk.breakdown,
      damage: dmg.total,
      damageType: dmg.damageType,
      damageBreakdown: dmg.breakdown,
    }
  })
}

// ---------------------------------------------------------------------------
// Hook return type
// ---------------------------------------------------------------------------

export type UseCombatStatsReturn = ReturnType<typeof useCombatStats>

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useCombatStats(character: Character) {
  const { catalog } = useCampaignRules()

  return useMemo(() => {
    const context = buildCharacterContext(character)
    const intrinsicEffects = collectIntrinsicEffects(character)
    const candidateEffects = getEquipmentEffects(character.equipment, catalog.armorById)

    const loadout = resolveLoadout(character.combat)
    const resolved = resolveEquipmentLoadoutDetailed(character.combat, character.equipment)

    const activeEquipmentEffects = selectActiveEquipmentEffects(candidateEffects, resolved)
    const enchantmentEffects = getEnchantmentCandidateEffects({ resolved })

    const ownedMagicItemIds = character.equipment?.magicItems ?? []
    const magicCandidates = getMagicItemCandidateEffects(ownedMagicItemIds)
    const activeMagicEffects = selectActiveMagicItemEffects(magicCandidates, {
      equippedIds: ownedMagicItemIds,
      attunedIds: ownedMagicItemIds,
    })

    const allEffects = [
      ...intrinsicEffects,
      ...activeEquipmentEffects,
      ...enchantmentEffects,
      ...activeMagicEffects,
    ]

    const acResult = resolveStatDetailed('armor_class', context, allEffects)
    const maxHp = resolveStat('hp_max', context, allEffects)
    const initiative = resolveStat('initiative', context, allEffects)

    const loadoutOptions = getLoadoutPickerOptions(character, intrinsicEffects, catalog.armorById)
    const activeOption = loadoutOptions.find(
      (o) =>
        o.loadout.armorId === resolved.armor.baseId &&
        o.loadout.shieldId === resolved.shield.baseId
    ) ?? loadoutOptions[0] ?? null

    const ownedWeaponIds = character.equipment?.weapons ?? []
    const wieldedWeaponIds = resolveWieldedWeaponIds(resolved, ownedWeaponIds)
    const attacks = getCharacterAttacks(character, context, allEffects, wieldedWeaponIds, catalog.weaponsById as any)
    const weaponOptions = getWeaponPickerOptions(character, catalog.weaponsById as any)

    return {
      armorClass: acResult.value,
      maxHp,
      initiative,
      calculatedArmorClass: {
        value: acResult.value,
        breakdown: acResult.breakdown,
      },
      loadoutOptions,
      activeLoadout: loadout,
      activeOption,
      attacks,
      weaponOptions,
      wieldedWeaponIds,
    }
  }, [character, catalog])
}
