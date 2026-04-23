import type { Monster } from '@/features/content/monsters/domain/types'
import { CREATURE_SIZE_DEFINITIONS } from '@/features/content/creatures/domain/values/creatureSize'
import { CREATURE_TYPE_DEFINITIONS } from '@/features/content/creatures/domain/values/creatureTaxonomy'

function monsterSubtypeLabel(subtype: NonNullable<Monster['subtype']>): string {
  return subtype.charAt(0).toUpperCase() + subtype.slice(1).replace(/-/g, ' ')
}

export function formatMonsterIdentityLine(monster: Monster): string {
  const cr = monster.lore?.challengeRating ?? '—'
  const sizeRow = CREATURE_SIZE_DEFINITIONS.find((s) => s.id === monster.sizeCategory)
  const sizeLabel = sizeRow?.name ?? (monster.sizeCategory ?? '—')
  const typeRow = CREATURE_TYPE_DEFINITIONS.find((t) => t.id === monster.type)
  const typeLabel = typeRow?.name ?? (monster.type ?? '—')
  const sub = monster.subtype ? ` (${monsterSubtypeLabel(monster.subtype)})` : ''
  return `CR ${cr} · ${sizeLabel} · ${typeLabel}${sub}`
}
