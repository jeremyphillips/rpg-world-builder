import type { Equipment, EquipmentItemInstance } from '@/features/character/domain/types'

let counter = 0
function nextInstanceId(): string {
  return `inst_${Date.now()}_${++counter}`
}

function ensureInstances(
  baseIds: string[],
  existing: EquipmentItemInstance[],
): EquipmentItemInstance[] {
  const covered = new Set(existing.map(i => i.baseId))
  const missing = baseIds.filter(id => !covered.has(id))
  if (missing.length === 0) return existing

  return [
    ...existing,
    ...missing.map(baseId => ({ instanceId: nextInstanceId(), baseId })),
  ]
}

/**
 * Ensure `weaponInstances` and `armorInstances` exist and cover every
 * base ID in the legacy `weapons[]` / `armor[]` arrays.
 *
 * Existing instances are preserved; new ones are only added for base IDs
 * that don't yet have a corresponding instance.
 */
export function normalizeEquipmentInstances(equipment: Equipment): Equipment {
  const weaponInstances = ensureInstances(
    equipment.weapons ?? [],
    equipment.weaponInstances ?? [],
  )
  const armorInstances = ensureInstances(
    equipment.armor ?? [],
    equipment.armorInstances ?? [],
  )

  if (
    weaponInstances === equipment.weaponInstances &&
    armorInstances === equipment.armorInstances
  ) {
    return equipment
  }

  return { ...equipment, weaponInstances, armorInstances }
}
