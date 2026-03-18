import { useMemo } from 'react'
import type { Character } from '@/features/character/domain/types'
import { useCampaignRules } from '@/app/providers/CampaignRulesProvider'
import { collectIntrinsicEffects } from '../domain/engine/collectCharacterEffects'
import { getLoadoutPickerOptions } from '../domain/engine/getLoadoutPickerOptions'
import { getWeaponPickerOptions } from '../domain/engine/getWeaponPickerOptions'
import {
  resolveStat,
  resolveStatDetailed,
  buildCharacterResolutionInput,
  type BreakdownToken,
  resolveWeaponAttackBonus,
  resolveWeaponDamage,
  type AttackHand,
} from '@/features/mechanics/domain/resolution'
import { resolveProficiencyBonusAtLevel } from '@/features/mechanics/domain/progression'
import type { EvaluationContext } from '@/features/mechanics/domain/conditions/evaluation-context.types'
import type { Effect } from '@/features/mechanics/domain/effects/effects.types'
import {
  resolveLoadout,
  resolveEquipmentLoadoutDetailed,
  resolveWieldedWeaponIds,
} from '@/features/mechanics/domain/equipment/loadout'
import {
  getMagicItemCandidateEffects,
  selectActiveMagicItemEffects,
} from '@/features/mechanics/domain/effects/sources/magic-items-to-effects'
import { getEnchantmentCandidateEffects } from '@/features/mechanics/domain/effects/sources/enchantments-to-effects'
import type { WeaponDamageType } from '@/features/content/equipment/weapons/domain/vocab'

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
  damageType: WeaponDamageType
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

    const atk = resolveWeaponAttackBonus(context, weaponInput, effects, {
      hand,
      proficiencyLevel: 1,
    })
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
  const { catalog, ruleset } = useCampaignRules()

  return useMemo(() => {
    const base = buildCharacterResolutionInput(character, { armorById: catalog.armorById })
    const context: EvaluationContext = {
      ...base.context,
      self: {
        ...base.context.self,
        proficiencyBonus: resolveProficiencyBonusAtLevel({
          level: base.context.self.level,
          ruleset,
        }),
      },
    }

    const resolved = resolveEquipmentLoadoutDetailed(character.combat, character.equipment)
    const enchantmentEffects = getEnchantmentCandidateEffects({ resolved })

    const ownedMagicItemIds = character.equipment?.magicItems ?? []
    const magicCandidates = getMagicItemCandidateEffects(ownedMagicItemIds)
    const activeMagicEffects = selectActiveMagicItemEffects(magicCandidates, {
      equippedIds: ownedMagicItemIds,
      attunedIds: ownedMagicItemIds,
    })

    const allEffects = [
      ...base.effects,
      ...enchantmentEffects,
      ...activeMagicEffects,
    ]

    const intrinsicEffects = collectIntrinsicEffects(character)
    const loadout = resolveLoadout(character.combat)

    const acResult = resolveStatDetailed('armor_class', context, allEffects)
    const maxHp = resolveStat('hit_points_max', context, allEffects)
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
      activeEffects: allEffects,
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
  }, [character, catalog, ruleset])
}
