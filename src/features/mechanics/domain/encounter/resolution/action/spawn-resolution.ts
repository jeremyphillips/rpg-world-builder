import type { Monster } from '@/features/content/monsters/domain/types'
import type { SpawnEffect } from '../../../effects/effects.types'

const NOT_YET = '(ally combatant not yet added automatically)'

/**
 * Resolves which catalog monster ids this spawn creates (empty for legacy `creature` only).
 */
export function resolveSpawnMonsterIds(
  effect: SpawnEffect,
  monstersById: Record<string, Monster> | undefined,
  rng: () => number,
): string[] {
  if (!monstersById) return []
  if (effect.monsterIds?.length) return [...effect.monsterIds]
  if (effect.monsterId) return Array.from({ length: effect.count }, () => effect.monsterId!)
  if (effect.pool) {
    const { creatureType, maxChallengeRating } = effect.pool
    const candidates = Object.values(monstersById).filter(
      (m) => m.type === creatureType && m.lore.challengeRating <= maxChallengeRating,
    )
    if (candidates.length === 0) return []
    const picks: string[] = []
    for (let i = 0; i < effect.count; i++) {
      picks.push(candidates[Math.floor(rng() * candidates.length)]!.id)
    }
    return picks
  }
  return []
}

function labelForMonsterId(id: string, monstersById: Record<string, Monster> | undefined): string {
  const m = monstersById?.[id]
  return m ? `${m.name} (${id})` : id
}

/**
 * Builds encounter log text for a `spawn` effect using catalog ids and/or random pool selection.
 */
export function describeResolvedSpawn(
  effect: SpawnEffect,
  monstersById: Record<string, Monster> | undefined,
  rng: () => number,
): string {
  if (effect.monsterIds?.length) {
    const labels = effect.monsterIds.map((id) => labelForMonsterId(id, monstersById))
    return `Spawn: ${labels.join(', ')}. ${NOT_YET}`
  }

  if (effect.monsterId) {
    const label = labelForMonsterId(effect.monsterId, monstersById)
    return effect.count > 1
      ? `Spawn: ${effect.count}× ${label}. ${NOT_YET}`
      : `Spawn: ${label}. ${NOT_YET}`
  }

  if (effect.pool) {
    if (!monstersById) {
      return `Spawn: catalog unavailable for ${effect.pool.creatureType} pool (CR ≤ ${effect.pool.maxChallengeRating}). ${NOT_YET}`
    }
    const { creatureType, maxChallengeRating } = effect.pool
    const candidates = Object.values(monstersById).filter(
      (m) => m.type === creatureType && m.lore.challengeRating <= maxChallengeRating,
    )
    if (candidates.length === 0) {
      return `Spawn: no ${creatureType} in catalog at CR ≤ ${maxChallengeRating}. ${NOT_YET}`
    }
    const picks: string[] = []
    for (let i = 0; i < effect.count; i++) {
      const pick = candidates[Math.floor(rng() * candidates.length)]!
      picks.push(`${pick.name} (${pick.id})`)
    }
    return `Spawn (${creatureType}, random CR ≤ ${maxChallengeRating}): ${picks.join(', ')}. ${NOT_YET}`
  }

  const legacy = effect.creature ?? 'creature'
  return `Spawn ${effect.count}× ${legacy}. ${NOT_YET}`
}
