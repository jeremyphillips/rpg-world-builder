import type { EquipmentProficiency } from '@/features/mechanics/domain/proficiencies/proficiency-adapters'

/** Stable union: first-seen order, no duplicates. */
export function mergeEquipmentProficiency(a: EquipmentProficiency, b: EquipmentProficiency): EquipmentProficiency {
  const categories: string[] = []
  const catSeen = new Set<string>()
  for (const c of [...a.categories, ...b.categories]) {
    if (catSeen.has(c)) continue
    catSeen.add(c)
    categories.push(c)
  }

  const items: string[] = []
  const itemSeen = new Set<string>()
  for (const id of [...a.items, ...b.items]) {
    if (itemSeen.has(id)) continue
    itemSeen.add(id)
    items.push(id)
  }

  return { categories, items }
}
