import type { Monster } from '@/features/content/monsters/domain/types'
import {
  MONSTER_SIZE_CATEGORY_OPTIONS,
  MONSTER_TYPE_OPTIONS,
} from '@/features/content/monsters/domain/vocab/monster.vocab'

function monsterSubtypeLabel(subtype: NonNullable<Monster['subtype']>): string {
  return subtype.charAt(0).toUpperCase() + subtype.slice(1).replace(/-/g, ' ')
}

export function formatMonsterIdentityLine(monster: Monster): string {
  const cr = monster.lore?.challengeRating ?? '—'
  const sizeRow = MONSTER_SIZE_CATEGORY_OPTIONS.find((s) => s.id === monster.sizeCategory)
  const sizeLabel = sizeRow?.name ?? (monster.sizeCategory ?? '—')
  const typeRow = MONSTER_TYPE_OPTIONS.find((t) => t.id === monster.type)
  const typeLabel = typeRow?.name ?? (monster.type ?? '—')
  const sub = monster.subtype ? ` (${monsterSubtypeLabel(monster.subtype)})` : ''
  return `CR ${cr} · ${sizeLabel} · ${typeLabel}${sub}`
}
