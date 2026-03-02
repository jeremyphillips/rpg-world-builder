import type { Effect } from '../effects.types'
import type { Equipment, EquipmentLoadout, EquipmentItemInstance } from '@/shared/types/character.core'
import { getSystemArmor } from '@/features/mechanics/domain/core/rules/systemCatalog.armor'
import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/core/rules/systemIds'

// ---------------------------------------------------------------------------
// Resolved loadout (instance-aware)
// ---------------------------------------------------------------------------

export type ResolvedSlot = {
  baseId?: string
  instanceId?: string
  enhancementTemplateId?: string
}

export type ResolvedEquipmentLoadout = {
  armor: ResolvedSlot
  shield: ResolvedSlot
  mainHand: ResolvedSlot
  offHand: ResolvedSlot
}

function findInstance(
  instances: EquipmentItemInstance[] | undefined,
  instanceId: string | undefined,
): EquipmentItemInstance | undefined {
  if (!instanceId || !instances) return undefined
  return instances.find(i => i.instanceId === instanceId)
}

function resolveSlot(
  instanceId: string | undefined,
  instances: EquipmentItemInstance[] | undefined,
  legacyBaseId: string | undefined,
  legacyEnhancementId: string | undefined,
): ResolvedSlot {
  const inst = findInstance(instances, instanceId)
  if (inst) {
    return {
      baseId: inst.baseId,
      instanceId: inst.instanceId,
      enhancementTemplateId: inst.enhancementTemplateId,
    }
  }

  // Legacy path: loadout stores only a base ID (no instanceId).
  // Match an instance by baseId so enchantments on instances are surfaced.
  if (legacyBaseId && instances) {
    const byBase = instances.find(i => i.baseId === legacyBaseId)
    if (byBase) {
      return {
        baseId: byBase.baseId,
        instanceId: byBase.instanceId,
        enhancementTemplateId: byBase.enhancementTemplateId ?? legacyEnhancementId,
      }
    }
  }

  return {
    baseId: legacyBaseId,
    enhancementTemplateId: legacyEnhancementId,
  }
}

/**
 * Resolve the full equipment loadout into a normalized, instance-aware shape.
 *
 * Resolution order per slot:
 * 1. If loadout has a `<slot>InstanceId`, look up the instance for baseId + enhancementTemplateId
 * 2. Else fall back to legacy flat fields (`<slot>Id`, `<slot>EnhancementId`)
 */
export function resolveEquipmentLoadoutDetailed(
  combat: { loadout?: EquipmentLoadout; selectedArmorConfigId?: string | null } | undefined,
  equipment: Equipment | undefined,
): ResolvedEquipmentLoadout {
  const loadout = resolveLoadout(combat)

  return {
    armor: resolveSlot(
      loadout.armorInstanceId,
      equipment?.armorInstances,
      loadout.armorId,
      loadout.armorEnhancementId,
    ),
    shield: resolveSlot(
      loadout.shieldInstanceId,
      equipment?.armorInstances,
      loadout.shieldId,
      loadout.shieldEnhancementId,
    ),
    mainHand: resolveSlot(
      loadout.mainHandWeaponInstanceId,
      equipment?.weaponInstances,
      loadout.mainHandWeaponId,
      loadout.weaponEnhancementId,
    ),
    offHand: resolveSlot(
      loadout.offHandWeaponInstanceId,
      equipment?.weaponInstances,
      loadout.offHandWeaponId,
      undefined,
    ),
  }
}

function findCoreArmor(
  armorId: string,
  armorById?: Record<string, { id: string; category: string; baseAC?: number; acBonus?: number }>,
) {
  if (armorById) {
    return armorById[armorId] ?? null
  }
  const systemArmor = getSystemArmor(DEFAULT_SYSTEM_RULESET_ID)
  return systemArmor.find((a) => a.id === armorId) ?? null
}

function buildArmorFormulaEffect(
  baseAC: number,
  category: string,
  source: string
): Effect {
  if (category === 'heavy') {
    return {
      kind: 'formula',
      target: 'armor_class',
      formula: { base: baseAC },
      source,
    } as Effect
  }

  if (category === 'medium') {
    return {
      kind: 'formula',
      target: 'armor_class',
      formula: { base: baseAC, ability: 'dexterity', maxAbilityContribution: 2 },
      source,
    } as Effect
  }

  return {
    kind: 'formula',
    target: 'armor_class',
    formula: { base: baseAC, ability: 'dexterity' },
    source,
  } as Effect
}

/**
 * Pure translation layer: equipment bag → flat Effect[].
 *
 * Produces effects for ALL owned items:
 *  - FormulaEffect per armor (base AC + ability + dex cap)
 *  - ModifierEffect per shield (+AC bonus)
 *  - Magic item effects (TODO)
 *
 * Each effect is tagged with `source` using the convention:
 *  - 'armor:<itemId>'
 *  - 'shield:<itemId>'
 *  - 'magic_item:<itemId>'
 */
export function getEquipmentEffects(
  equipment: Equipment | undefined,
  armorById?: Record<string, { id: string; category: string; baseAC?: number; acBonus?: number }>,
): Effect[] {
  const ownedArmorIds = equipment?.armor ?? []
  const effects: Effect[] = []

  for (const id of ownedArmorIds) {
    const item = findCoreArmor(id, armorById)
    if (!item) continue

    if (item.category === 'shields') {
      const bonus = item.acBonus ?? 0
      if (bonus > 0) {
        effects.push({
          kind: 'modifier',
          target: 'armor_class',
          mode: 'add',
          value: bonus,
          source: `shield:${id}`,
        })
      }
    } else {
      const baseAC = item.baseAC ?? 10
      const category = item.category ?? 'light'
      effects.push(buildArmorFormulaEffect(baseAC, category, `armor:${id}`))
    }
  }

  return effects
}

/**
 * Filter candidate equipment effects down to only the active loadout.
 *
 * Accepts either a flat `EquipmentLoadout` or a `ResolvedEquipmentLoadout`.
 */
export function selectActiveEquipmentEffects(
  candidateEffects: Effect[],
  loadout: EquipmentLoadout | ResolvedEquipmentLoadout | undefined
): Effect[] {
  let armorBaseId: string | undefined
  let shieldBaseId: string | undefined

  if (loadout && 'armor' in loadout) {
    armorBaseId = (loadout as ResolvedEquipmentLoadout).armor.baseId
    shieldBaseId = (loadout as ResolvedEquipmentLoadout).shield.baseId
  } else {
    armorBaseId = (loadout as EquipmentLoadout | undefined)?.armorId
    shieldBaseId = (loadout as EquipmentLoadout | undefined)?.shieldId
  }

  const activeArmorSource = armorBaseId ? `armor:${armorBaseId}` : null
  const activeShieldSource = shieldBaseId ? `shield:${shieldBaseId}` : null

  return candidateEffects.filter((e) => {
    const source = 'source' in e ? (e as { source?: string }).source : undefined
    if (!source) return true
    if (source.startsWith('armor:')) return source === activeArmorSource
    if (source.startsWith('shield:')) return source === activeShieldSource
    return true
  })
}

/**
 * Resolve a loadout from the character, with legacy fallback.
 * Reads combat.loadout first, falls back to parsing selectedArmorConfigId.
 */
export function resolveLoadout(
  combat: { loadout?: EquipmentLoadout; selectedArmorConfigId?: string | null } | undefined
): EquipmentLoadout {
  if (combat?.loadout) return combat.loadout

  const selectedId = combat?.selectedArmorConfigId
  if (!selectedId) return {}

  const [armorPart, shieldPart] = selectedId.split('|')
  return {
    armorId: armorPart && armorPart !== 'unarmored' ? armorPart : undefined,
    shieldId: shieldPart && shieldPart !== 'no-shield' ? shieldPart : undefined,
  }
}

/**
 * Resolve the actively wielded weapon IDs.
 *
 * Accepts either a flat `EquipmentLoadout` or a `ResolvedEquipmentLoadout`.
 * Falls back to the first owned weapon as main hand when nothing is selected.
 */
export function resolveWieldedWeaponIds(
  loadout: EquipmentLoadout | ResolvedEquipmentLoadout,
  ownedWeaponIds: string[]
): string[] {
  let mainHandId: string | undefined
  let offHandId: string | undefined

  if ('mainHand' in loadout) {
    mainHandId = (loadout as ResolvedEquipmentLoadout).mainHand.baseId
    offHandId = (loadout as ResolvedEquipmentLoadout).offHand.baseId
  } else {
    mainHandId = (loadout as EquipmentLoadout).mainHandWeaponId
    offHandId = (loadout as EquipmentLoadout).offHandWeaponId
  }

  const mainHand = mainHandId ?? ownedWeaponIds[0]
  const offHand = offHandId

  const ids: string[] = []
  if (mainHand) ids.push(mainHand)
  if (offHand && offHand !== mainHand) ids.push(offHand)
  return ids
}
