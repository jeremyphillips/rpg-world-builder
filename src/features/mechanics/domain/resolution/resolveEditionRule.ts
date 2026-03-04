import type { Monster } from '@/data/monsters'
import type { EditionRule } from '@/features/mechanics/domain/edition'
import { convertEditionRule } from '@/features/mechanics/domain/adapters/monsters'

/**
 * Attempt to find or convert an edition rule for the given target edition.
 * Returns `{ rule, converted, sourceEdition }`.
 */
export function resolveEditionRule(
  monster: Monster,
  targetEdition: string
): { rule: EditionRule; converted: boolean; sourceEdition?: string } | null {
  // 1. Native match
  const native = monster.editionRules.find((r) => r.edition === targetEdition)
  if (native) return { rule: native, converted: false }

  // 2. Try converting from any available edition
  for (const sourceRule of monster.editionRules) {
    const converted = convertEditionRule(monster, sourceRule, targetEdition)
    if (converted) {
      return { rule: converted, converted: true, sourceEdition: sourceRule.edition }
    }
  }

  return null
}