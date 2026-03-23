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
import type { CombatantAttackRange } from '@/features/mechanics/domain/encounter/state/types/combatant.types'

// ---------------------------------------------------------------------------
// Attack types
// ---------------------------------------------------------------------------

export type NormalizedWeaponInput = {
  id: string
  name: string
  type?: string
  properties?: string[]
  damage?: { default?: string }
  damageType?: string
  mode?: 'melee' | 'ranged'
  normalRangeFt?: number
  longRangeFt?: number
}

export interface AttackEntry {
  weaponId: string
  name: string
  hand: AttackHand
  attackBonus: number
  attackBreakdown: BreakdownToken[]
  damage: string
  damageType: WeaponDamageType
  damageBreakdown: BreakdownToken[]
  range?: CombatantAttackRange
}

// ---------------------------------------------------------------------------
// Attack helpers (catalog lookup — math is in attack-resolver)
// ---------------------------------------------------------------------------

function deriveAttackRange(weapon: NormalizedWeaponInput | undefined): CombatantAttackRange | undefined {
  if (!weapon) return undefined
  const mode = weapon.mode ?? weapon.type as 'melee' | 'ranged' | undefined
  if (mode === 'ranged' && weapon.normalRangeFt != null) {
    return { kind: 'ranged', normalFt: weapon.normalRangeFt, longFt: weapon.longRangeFt }
  }
  return { kind: 'melee', rangeFt: 5 }
}

/**
 * Catalog-to-attack normalization: maps raw weapon catalog entries into the
 * minimal shape that `getCharacterAttacks` needs. This is the single mapping
 * site -- if the catalog schema changes, only this function updates.
 */
export function normalizeWeaponsForAttacks(
  weaponsById: Record<string, { id: string; name: string; mode?: string; type?: string; properties?: string[]; damage?: { default?: any }; damageType?: string; range?: { normal?: number; long?: number } }>,
): Record<string, NormalizedWeaponInput> {
  const out: Record<string, NormalizedWeaponInput> = {}
  for (const [id, w] of Object.entries(weaponsById)) {
    out[id] = {
      id: w.id,
      name: w.name,
      type: w.type ?? w.mode,
      properties: w.properties,
      damage: w.damage ? { default: String(w.damage.default) } : undefined,
      damageType: w.damageType,
      mode: (w.mode ?? w.type) as 'melee' | 'ranged' | undefined,
      normalRangeFt: w.range?.normal,
      longRangeFt: w.range?.long,
    }
  }
  return out
}

export function getCharacterAttacks(
  _character: Character,
  context: EvaluationContext,
  effects: Effect[],
  wieldedWeaponIds: string[],
  weaponsById: Record<string, NormalizedWeaponInput>,
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
      range: deriveAttackRange(weapon),
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
    const normalizedWeapons = normalizeWeaponsForAttacks(catalog.weaponsById as Record<string, any>)
    const attacks = getCharacterAttacks(character, context, allEffects, wieldedWeaponIds, normalizedWeapons)
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
