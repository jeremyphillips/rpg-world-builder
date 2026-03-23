import { calculateMonsterArmorClass } from '@/features/content/monsters/domain/mechanics/calculateMonsterArmorClass'
import type { Monster } from '@/features/content/monsters/domain/types'
import { getAbilityModifier } from '@/features/mechanics/domain/abilities/getAbilityModifier'
import { getAbilityScoreValue } from '@/features/mechanics/domain/character/abilities/abilityScoreMap'

import type { PreviewStat } from '../domain'
import { formatSigned } from './combatant-builders'
import { getPreviewStatTooltip } from './combatant-card-tooltips'

type ArmorCatalog = Parameters<typeof calculateMonsterArmorClass>[1]

export function buildMonsterModalStats(monster: Monster, armorById: ArmorCatalog): PreviewStat[] {
  const armorClass = calculateMonsterArmorClass(monster, armorById).value
  const averageHitPoints =
    Math.floor(monster.mechanics.hitPoints.count * ((monster.mechanics.hitPoints.die + 1) / 2)) +
    (monster.mechanics.hitPoints.modifier ?? 0)
  const initiativeModifier = getAbilityModifier(
    getAbilityScoreValue(monster.mechanics.abilities, 'dex'),
  )
  const ground = monster.mechanics.movement?.ground
  const stats: PreviewStat[] = [
    { label: 'AC', value: String(armorClass), tooltip: getPreviewStatTooltip('AC') },
    { label: 'HP', value: String(averageHitPoints), tooltip: getPreviewStatTooltip('HP') },
    { label: 'Init', value: formatSigned(initiativeModifier), tooltip: getPreviewStatTooltip('Init') },
  ]
  if (ground != null) {
    stats.push({
      label: 'Move',
      value: `${ground} ft`,
      tooltip: getPreviewStatTooltip('Move'),
    })
  }
  return stats
}
