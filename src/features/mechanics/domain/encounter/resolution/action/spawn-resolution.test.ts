import { describe, expect, it } from 'vitest'

import type { Monster } from '@/features/content/monsters/domain/types'
import type { SpawnEffect } from '../../../effects/effects.types'

import type { CombatantInstance } from '../../state/types/combatant.types'

import { describeResolvedSpawn, resolveSpawnMonsterIds } from './spawn-resolution'

function m(
  id: string,
  name: string,
  type: NonNullable<Monster['type']>,
  cr: Monster['lore']['challengeRating'],
): Monster {
  return {
    id,
    name,
    type,
    mechanics: {} as Monster['mechanics'],
    lore: { challengeRating: cr, xpValue: 0 },
  } as Monster
}

describe('describeResolvedSpawn', () => {
  it('resolves monsterId with catalog names', () => {
    const effect: SpawnEffect = {
      kind: 'spawn',
      monsterId: 'zombie',
      count: 1,
    }
    const monstersById = { zombie: m('zombie', 'Zombie', 'undead', 0.25) }
    const s = describeResolvedSpawn(effect, monstersById, () => 0.5)
    expect(s).toContain('Zombie (zombie)')
    expect(s).toContain('(ally combatant not yet added automatically)')
  })

  it('resolves monsterIds list', () => {
    const effect: SpawnEffect = {
      kind: 'spawn',
      monsterIds: ['skeleton', 'zombie'],
      count: 2,
    }
    const monstersById = {
      skeleton: m('skeleton', 'Skeleton', 'undead', 0.25),
      zombie: m('zombie', 'Zombie', 'undead', 0.25),
    }
    const s = describeResolvedSpawn(effect, monstersById, () => 0.5)
    expect(s).toContain('Skeleton (skeleton)')
    expect(s).toContain('Zombie (zombie)')
  })

  it('picks randomly from pool with seeded rng', () => {
    const effect: SpawnEffect = {
      kind: 'spawn',
      count: 2,
      pool: { creatureType: 'elemental', maxChallengeRating: 0.5 },
    }
    const monstersById = {
      a: m('a', 'Fire A', 'elemental', 0.25),
      b: m('b', 'Fire B', 'elemental', 0.5),
      big: m('big', 'Too Big', 'elemental', 2),
    }
    const s = describeResolvedSpawn(effect, monstersById, () => 0)
    expect(s).toContain('Fire A (a)')
    expect(s).not.toContain('Too Big')
  })

  it('reports empty pool when no monsters match CR', () => {
    const effect: SpawnEffect = {
      kind: 'spawn',
      count: 1,
      pool: { creatureType: 'fey', maxChallengeRating: 0 },
    }
    const monstersById = {
      pixie: m('pixie', 'Pixie', 'fey', 0.25),
    }
    const s = describeResolvedSpawn(effect, monstersById, () => 0.5)
    expect(s).toContain('no fey in catalog at CR ≤ 0')
  })

  it('returns empty ids when target remains were consumed', () => {
    const effect: SpawnEffect = {
      kind: 'spawn',
      count: 1,
      mapMonsterIdFromTargetRemains: { corpse: 'zombie', bones: 'skeleton' },
    }
    const monstersById = {
      zombie: m('zombie', 'Zombie', 'undead', 0.25),
    }
    const consumed = {
      remains: 'corpse',
      remainsConsumed: { atRound: 2 },
    } as CombatantInstance
    expect(resolveSpawnMonsterIds(effect, monstersById, () => 0.5, undefined, consumed)).toEqual([])
  })

  it('maps monster id from target remains (corpse vs bones)', () => {
    const effect: SpawnEffect = {
      kind: 'spawn',
      count: 1,
      mapMonsterIdFromTargetRemains: { corpse: 'zombie', bones: 'skeleton' },
    }
    const monstersById = {
      zombie: m('zombie', 'Zombie', 'undead', 0.25),
    }
    const bonesTarget = { remains: 'bones' } as CombatantInstance
    const ids = resolveSpawnMonsterIds(effect, monstersById, () => 0.5, undefined, bonesTarget)
    expect(ids).toEqual(['skeleton'])
  })

  it('maps monster id from caster enum', () => {
    const effect: SpawnEffect = {
      kind: 'spawn',
      count: 1,
      mapMonsterIdFromCasterOption: {
        fieldId: 'animate-dead-form',
        valueToMonsterId: { skeleton: 'skeleton', zombie: 'zombie' },
      },
    }
    const monstersById = {
      skeleton: m('skeleton', 'Skeleton', 'undead', 0.25),
    }
    const ids = resolveSpawnMonsterIds(effect, monstersById, () => 0.5, {
      'animate-dead-form': 'skeleton',
    })
    expect(ids).toEqual(['skeleton'])
  })

  it('resolves pool + count from caster option', () => {
    const effect: SpawnEffect = {
      kind: 'spawn',
      count: 1,
      poolFromCasterOption: {
        fieldId: 'conjure-minor-elementals-option',
        mapping: {
          'cr-half-four': { count: 2, maxChallengeRating: 0.5, creatureType: 'elemental' },
        },
      },
    }
    const monstersById = {
      a: m('a', 'E1', 'elemental', 0.25),
      b: m('b', 'E2', 'elemental', 0.5),
    }
    const ids = resolveSpawnMonsterIds(effect, monstersById, () => 0, {
      'conjure-minor-elementals-option': 'cr-half-four',
    })
    expect(ids).toHaveLength(2)
    expect(ids.every((id) => id === 'a' || id === 'b')).toBe(true)
  })

  it('falls back to legacy creature token', () => {
    const effect: SpawnEffect = {
      kind: 'spawn',
      creature: 'familiar',
      count: 1,
      location: 'self-space',
      actsWhen: 'immediately-after-source-turn',
    }
    const s = describeResolvedSpawn(effect, undefined, () => 0.5)
    expect(s).toContain('Spawn 1× familiar')
  })
})
