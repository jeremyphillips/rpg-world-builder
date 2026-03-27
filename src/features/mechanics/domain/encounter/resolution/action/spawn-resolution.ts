import type { Monster } from '@/features/content/monsters/domain/types'
import type { CombatantInstance } from '../../state/types/combatant.types'
import type { SpawnEffect } from '../../../effects/effects.types'

const NOT_YET = '(ally combatant not yet added automatically)'

function pickRandomFromPool(
  monstersById: Record<string, Monster>,
  creatureType: Monster['type'],
  maxChallengeRating: number,
  count: number,
  rng: () => number,
): string[] {
  const candidates = Object.values(monstersById).filter(
    (m) => m.type === creatureType && m.lore.challengeRating <= maxChallengeRating,
  )
  if (candidates.length === 0) return []
  const picks: string[] = []
  for (let i = 0; i < count; i++) {
    picks.push(candidates[Math.floor(rng() * candidates.length)]!.id)
  }
  return picks
}

/**
 * Resolves which catalog monster ids this spawn creates (empty for legacy `creature` only).
 */
export function resolveSpawnMonsterIds(
  effect: SpawnEffect,
  monstersById: Record<string, Monster> | undefined,
  rng: () => number,
  casterOptions?: Record<string, string>,
  spawnTarget?: CombatantInstance,
): string[] {
  if (effect.mapMonsterIdFromTargetRemains && spawnTarget) {
    if (spawnTarget.remainsConsumed) return []
    const r = spawnTarget.remains ?? 'corpse'
    if (r === 'dust' || r === 'disintegrated') return []
    const mid = r === 'bones' ? effect.mapMonsterIdFromTargetRemains.bones : effect.mapMonsterIdFromTargetRemains.corpse
    return Array.from({ length: effect.count }, () => mid)
  }
  if (effect.mapMonsterIdFromTargetRemains && !spawnTarget) {
    return []
  }

  if (effect.mapMonsterIdFromCasterOption && casterOptions) {
    const raw = casterOptions[effect.mapMonsterIdFromCasterOption.fieldId]
    const mid = raw ? effect.mapMonsterIdFromCasterOption.valueToMonsterId[raw] : undefined
    if (mid) return Array.from({ length: effect.count }, () => mid)
    return []
  }
  if (effect.mapMonsterIdFromCasterOption && !casterOptions) {
    return []
  }

  if (effect.poolFromCasterOption && casterOptions) {
    const raw = casterOptions[effect.poolFromCasterOption.fieldId]
    const spec = raw ? effect.poolFromCasterOption.mapping[raw] : undefined
    if (!spec || !monstersById) return []
    return pickRandomFromPool(
      monstersById,
      spec.creatureType,
      spec.maxChallengeRating,
      spec.count,
      rng,
    )
  }
  if (effect.poolFromCasterOption && !casterOptions) {
    return []
  }

  if (!monstersById) return []
  if (effect.monsterIds?.length) return [...effect.monsterIds]
  if (effect.monsterId) return Array.from({ length: effect.count }, () => effect.monsterId!)
  if (effect.pool) {
    return pickRandomFromPool(
      monstersById,
      effect.pool.creatureType,
      effect.pool.maxChallengeRating,
      effect.count,
      rng,
    )
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
  casterOptions?: Record<string, string>,
  spawnTarget?: CombatantInstance,
): string {
  const resolvedIds = resolveSpawnMonsterIds(effect, monstersById, rng, casterOptions, spawnTarget)
  if (resolvedIds.length > 0) {
    const labels = resolvedIds.map((id) => labelForMonsterId(id, monstersById))
    return `Spawn: ${labels.join(', ')}. ${NOT_YET}`
  }

  if (effect.mapMonsterIdFromTargetRemains) {
    if (!spawnTarget) {
      return `Spawn: dead creature target required for remains (corpse vs bones). ${NOT_YET}`
    }
    if (spawnTarget.remainsConsumed) {
      return `Spawn: remains already consumed. ${NOT_YET}`
    }
    const r = spawnTarget.remains ?? 'corpse'
    if (r === 'dust' || r === 'disintegrated') {
      return `Spawn: no remains to animate (dust or disintegrated). ${NOT_YET}`
    }
  }

  if (effect.mapMonsterIdFromCasterOption) {
    const fieldId = effect.mapMonsterIdFromCasterOption.fieldId
    if (!casterOptions?.[fieldId]) {
      return `Spawn: choose ${fieldId} in caster options. ${NOT_YET}`
    }
    const raw = casterOptions[fieldId]
    const mid = effect.mapMonsterIdFromCasterOption.valueToMonsterId[raw!]
    if (!mid) {
      return `Spawn: invalid option for ${fieldId}. ${NOT_YET}`
    }
  }

  if (effect.poolFromCasterOption) {
    const fieldId = effect.poolFromCasterOption.fieldId
    if (!casterOptions?.[fieldId]) {
      return `Spawn: choose ${fieldId} in caster options. ${NOT_YET}`
    }
    const raw = casterOptions[fieldId]
    const spec = raw ? effect.poolFromCasterOption.mapping[raw] : undefined
    if (!spec) {
      return `Spawn: invalid option for ${fieldId}. ${NOT_YET}`
    }
    if (!monstersById) {
      return `Spawn: catalog unavailable for ${spec.creatureType} pool (CR ≤ ${spec.maxChallengeRating}). ${NOT_YET}`
    }
    const candidates = Object.values(monstersById).filter(
      (m) => m.type === spec.creatureType && m.lore.challengeRating <= spec.maxChallengeRating,
    )
    if (candidates.length === 0) {
      return `Spawn: no ${spec.creatureType} in catalog at CR ≤ ${spec.maxChallengeRating}. ${NOT_YET}`
    }
  }

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
