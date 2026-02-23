import { useMemo } from 'react'
import type { Character } from '@/shared/types/character.core'
import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider'
import { weapons as weaponCatalog } from '@/data/equipment/weapons'
import { resolveEquipmentEdition } from '@/features/equipment/domain'
import type { WeaponEditionDatum } from '@/data/equipment/weapons.types'
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

function getWeaponEditionData(weaponId: string, editionId: string): WeaponEditionDatum | undefined {
  const resolved = resolveEquipmentEdition(editionId)
  const weapon = weaponCatalog.find(w => w.id === weaponId)
  return weapon?.editionData?.find(d => d.edition === resolved)
}

export function getCharacterAttacks(
  character: Character,
  context: EvaluationContext,
  effects: Effect[],
  wieldedWeaponIds: string[]
): AttackEntry[] {
  if (wieldedWeaponIds.length === 0) return []

  const editionId = character.edition

  return wieldedWeaponIds.map((id, idx) => {
    const hand: AttackHand = idx === 0 ? 'main' : 'off'
    const weapon = weaponCatalog.find(w => w.id === id)
    const edData = getWeaponEditionData(id, editionId)

    const weaponInput = {
      type: edData?.type,
      properties: edData?.properties,
      damage: edData?.damage,
      damageType: weapon?.damageType,
      edition: editionId,
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
  const { editionId: activeEditionId } = useActiveCampaign()
  const edition = activeEditionId ?? character.edition ?? '5e'

  return useMemo(() => {
    const context = buildCharacterContext(character)
    const intrinsicEffects = collectIntrinsicEffects(character)
    const candidateEffects = getEquipmentEffects(character.equipment, edition)

    const loadout = resolveLoadout(character.combat)
    const resolved = resolveEquipmentLoadoutDetailed(character.combat, character.equipment)

    const activeEquipmentEffects = selectActiveEquipmentEffects(candidateEffects, resolved)
    const enchantmentEffects = getEnchantmentCandidateEffects({ edition, resolved })

    const ownedMagicItemIds = character.equipment?.magicItems ?? []
    const magicCandidates = getMagicItemCandidateEffects(ownedMagicItemIds, edition)
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

    const loadoutOptions = getLoadoutPickerOptions(character, intrinsicEffects)
    const activeOption = loadoutOptions.find(
      (o) =>
        o.loadout.armorId === resolved.armor.baseId &&
        o.loadout.shieldId === resolved.shield.baseId
    ) ?? loadoutOptions[0] ?? null

    const ownedWeaponIds = character.equipment?.weapons ?? []
    const wieldedWeaponIds = resolveWieldedWeaponIds(resolved, ownedWeaponIds)
    const attacks = getCharacterAttacks(character, context, allEffects, wieldedWeaponIds)
    const weaponOptions = getWeaponPickerOptions(character)

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
  }, [character, edition])
}
