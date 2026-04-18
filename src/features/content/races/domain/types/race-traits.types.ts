import type { Effect } from '@/features/mechanics/domain/effects/effects.types'
import type { EffectUses } from '@/features/mechanics/domain/effects/timing.types'

/**
 * Authored racial trait grant (CMS). Mirrors {@link MonsterTrait} / subclass feature patterns;
 * stays in the race domain—no shared race vocab in content/shared.
 */
export interface RaceTraitGrant {
  id: string
  name: string
  description: string
  effects?: Effect[]
  uses?: EffectUses
  notes?: string
}
