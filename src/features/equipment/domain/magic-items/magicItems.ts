import { getSystemMagicItems } from '@/features/mechanics/domain/core/rules/systemCatalog.magicItems'
import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/core/rules/systemIds'
import type { MagicItemRarity } from '@/features/content/shared/domain/types'
import type { MagicItemBudget, MagicItemBudgetTier } from '@/shared/types/ruleset'

// ─── Rarity ordering (weakest → strongest) ──────────────────────────────────
/** @deprecated retreive from MAGIC_ITEM_RARITY_OPTIONS */
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
    (t: MagicItemBudgetTier) => level >= t.levelRange[0] && level <= t.levelRange[1],
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

type MagicItemLike = { id: string; rarity?: MagicItemRarity; cost?: { coin: string; value: number } }

/**
 * Return magic items available for a character at a given level,
 * filtered by the rarity ceiling from the budget.
 */
export const getAvailableMagicItems = (
  budget: MagicItemBudget | undefined,
  level: number,
  magicItems: readonly MagicItemLike[] = getSystemMagicItems(DEFAULT_SYSTEM_RULESET_ID),
): MagicItemLike[] => {
  const tier = getMagicItemBudget(budget, level)

  return magicItems.filter((item) => {
    if (tier?.maxRarity && item.rarity) {
      if (rarityIndex(item.rarity) > rarityIndex(tier.maxRarity)) {
        return false
      }
    }

    if (tier?.maxItemValueGp != null && item.cost) {
      const costGp = costToGp(item.cost)
      if (costGp > tier.maxItemValueGp) return false
    }

    return true
  })
}

// ─── Internal helpers ────────────────────────────────────────────────────────

function costToGp(cost: { coin: string; value: number }): number {
  switch (cost.coin) {
    case 'gp': return cost.value
    case 'sp': return cost.value / 10
    case 'cp': return cost.value / 100
    default: return cost.value
  }
}
