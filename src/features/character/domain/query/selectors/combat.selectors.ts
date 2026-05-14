import type { CharacterQueryContext } from '../characterQueryContext.types'

export function isEquipped(ctx: CharacterQueryContext, itemId: string): boolean {
  const { combat } = ctx
  return (
    combat.equippedArmorId === itemId ||
    combat.equippedShieldId === itemId ||
    combat.equippedMainHandWeaponId === itemId ||
    combat.equippedOffHandWeaponId === itemId
  )
}

export function getEquippedWeaponIds(ctx: CharacterQueryContext): string[] {
  const { combat } = ctx
  const ids: string[] = []
  if (combat.equippedMainHandWeaponId) ids.push(combat.equippedMainHandWeaponId)
  if (
    combat.equippedOffHandWeaponId &&
    combat.equippedOffHandWeaponId !== combat.equippedMainHandWeaponId
  ) {
    ids.push(combat.equippedOffHandWeaponId)
  }
  return ids
}
