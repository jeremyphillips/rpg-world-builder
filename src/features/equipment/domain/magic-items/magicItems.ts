import { equipment as equipment } from '@/data/equipment'
import type { MagicItem, MagicItemRarity } from '@/data/equipment'
import type { MagicItemBudget, MagicItemBudgetTier } from '@/data/ruleSets'

// ─── Rarity ordering (weakest → strongest) ──────────────────────────────────
const RARITY_ORDER: MagicItemRarity[] = [
  'common',
  'uncommon',
  'rare',
  'very-rare',
  'legendary',
  'artifact'
]

const rarityIndex = (r: MagicItemRarity): number => RARITY_ORDER.indexOf(r)

/**
 * Look up the magic item budget tier for a character level.
 *
 * Accepts the `magicItemBudget` object from a Ruleset's progression rules.
 * Returns `null` when no budget is configured or no tier matches.
 */
export const getMagicItemBudget = (
  budget: MagicItemBudget | undefined,
  level: number,
): MagicItemBudgetTier | null => {
  if (!budget?.tiers) return null

  const tier = budget.tiers.find(
    t => level >= t.levelRange[0] && level <= t.levelRange[1],
  )
  if (!tier) return null

  return {
    ...tier,
    maxAttunement: tier.maxAttunement ?? budget.maxAttunement,
  }
}

/**
 * Return the set of rarities available at a given level.
 */
export const getMagicItemRaritiesForLevel = (
  budget: MagicItemBudget | undefined,
  level: number,
): MagicItemRarity[] => {
  const tier = getMagicItemBudget(budget, level)
  if (!tier?.maxRarity) return [...RARITY_ORDER]

  const maxIdx = rarityIndex(tier.maxRarity)
  return RARITY_ORDER.filter((_, i) => i <= maxIdx)
}

/**
 * Return magic items available for a character at a given level,
 * filtered by the rarity ceiling from the budget.
 */
export const getAvailableMagicItems = (
  budget: MagicItemBudget | undefined,
  level: number,
): MagicItem[] => {
  const tier = getMagicItemBudget(budget, level)

  return equipment.magicItems.filter((item: MagicItem) => {
    if (tier?.maxRarity && item.rarity) {
      if (rarityIndex(item.rarity) > rarityIndex(tier.maxRarity)) {
        return false
      }
    }

    if (tier?.maxItemValueGp != null && item.cost) {
      const costGp = parseCostToGp(item.cost)
      if (costGp > tier.maxItemValueGp) return false
    }

    return true
  })
}

// ─── Internal helpers ────────────────────────────────────────────────────────

function parseCostToGp(cost: string): number {
  if (!cost || cost === '—') return 0
  const cleaned = cost.replace(/,/g, '').replace(/\s*gp$/i, '').trim()
  const num = Number(cleaned)
  return Number.isNaN(num) ? 0 : num
}
