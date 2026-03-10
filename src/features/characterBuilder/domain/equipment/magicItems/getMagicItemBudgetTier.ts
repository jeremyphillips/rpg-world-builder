import type { MagicItemBudget, MagicItemBudgetTier } from '@/shared/types/ruleset'

/**
 * Look up the magic item budget tier for a character level.
 *
 * Accepts the `magicItemBudget` object from a Ruleset's progression rules.
 * Returns `null` when no budget is configured or no tier matches.
 */
export const getMagicItemBudgetTier = (
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
