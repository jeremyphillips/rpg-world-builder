import type { CharacterQueryContext } from '../characterQueryContext.types'

/** Equipment buckets aligned with campaign content list keys (`weapons`, `armor`, etc.). */
export type EquipmentCategory = 'weapons' | 'armor' | 'gear' | 'magicItems'

const inventoryKey: Record<EquipmentCategory, keyof CharacterQueryContext['inventory']> = {
  weapons: 'weaponIds',
  armor: 'armorIds',
  gear: 'gearIds',
  magicItems: 'magicItemIds',
}

export function ownsItem(
  ctx: CharacterQueryContext,
  contentType: EquipmentCategory,
  id: string,
): boolean {
  return ctx.inventory[inventoryKey[contentType]].has(id)
}

export function ownsAnyItem(
  ctx: CharacterQueryContext,
  contentType: EquipmentCategory,
  ids: string[],
): boolean {
  const set = ctx.inventory[inventoryKey[contentType]]
  return ids.some((id) => set.has(id))
}

export function getOwnedIdsForContentType(
  ctx: CharacterQueryContext,
  contentType: EquipmentCategory,
): ReadonlySet<string> {
  return ctx.inventory[inventoryKey[contentType]]
}
