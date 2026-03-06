import type { EffectDescriptor } from '@/features/content/shared/domain/types'
import type { Effect, GrantEffect, ModifierEffect } from '../effects.types'
import type { StatTarget } from '../../resolution/stat-resolver'
import { resolveCustomDescriptor } from './custom-registry'
import { ABILITY_KEYS } from '../../core/character'

const STAT_TARGETS: ReadonlySet<string> = new Set<StatTarget>([
  ...ABILITY_KEYS,
  'armor_class',
  'attack_roll',
  'damage',
  'hit_points',
  'hit_points_temporary',
  'hit_points_max',
  'hit_points_temporary_max',
  'spell_attack',
  'resistance',
  'speed',
  'initiative',
  'saving_throw',
  'spell_save_dc',
])

function mapStatStringToTarget(stat: string): StatTarget | null {
  return STAT_TARGETS.has(stat) ? (stat as StatTarget) : null
}

const BONUS_TARGET_MAP: Record<string, StatTarget> = {
  armor_class: 'armor_class',
  attack: 'attack_roll',
  damage: 'damage',
}

function resolveOne(
  d: EffectDescriptor,
  ctx: { source: string },
): Effect[] {
  switch (d.kind) {
    case 'bonus': {
      const target = BONUS_TARGET_MAP[d.target]
      if (!target) return []
      const effect: ModifierEffect = {
        kind: 'modifier',
        target,
        mode: 'add',
        value: d.value,
        source: ctx.source,
      }
      return [effect]
    }

    case 'stat_bonus': {
      const target = mapStatStringToTarget(d.stat)
      if (!target) return []
      const effect: ModifierEffect = {
        kind: 'modifier',
        target,
        mode: 'add',
        value: d.value,
        source: ctx.source,
      }
      return [effect]
    }

    case 'grant': {
      const effect: GrantEffect = {
        kind: 'grant',
        grantType: d.grantType as GrantEffect['grantType'],
        value: d.value,
        source: ctx.source,
      }
      return [effect]
    }

    case 'custom':
      return resolveCustomDescriptor(d, ctx)
  }
}

/**
 * Convert an array of data-layer `EffectDescriptor`s into runtime `Effect[]`.
 */
export function resolveEffectDescriptors(
  descriptors: EffectDescriptor[],
  ctx: { source: string; label?: string },
): Effect[] {
  const effects: Effect[] = []
  for (const d of descriptors) {
    effects.push(...resolveOne(d, ctx))
  }
  return effects
}
