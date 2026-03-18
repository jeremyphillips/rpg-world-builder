import type { Equipment, EquipmentLoadout, EquipmentItemInstance } from '@/features/character/domain/types'

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
