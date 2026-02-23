/**
 * @deprecated Use getArmorConfigOptions from character/domain/engine instead.
 * Kept for one sprint as safety net during AC migration.
 */
import type { Character } from '@/shared/types'
import { equipment as equipmentData } from '@/data'
import type { ArmorItem, ArmorEditionDatum } from '@/data/equipment/armor.types'

export type ArmorConfiguration = {
  id: string
  armorId?: string
  armorName?: string
  shieldId?: string
  shieldName?: string
  totalAC: number
  breakdown: string
  label: string
}

type ResolvedArmor = {
  item: ArmorItem
  ed: ArmorEditionDatum
}

function getDexContribution(category: string, dexMod: number): number {
  if (category === 'heavy') return 0
  if (category === 'medium') return Math.min(dexMod, 2)
  return dexMod
}

function buildConfigId(armorId?: string, shieldId?: string): string {
  return `${armorId ?? 'unarmored'}|${shieldId ?? 'no-shield'}`
}

function computeConfig(
  armor: ResolvedArmor | null,
  shield: ResolvedArmor | null,
  dexMod: number,
): ArmorConfiguration {
  const baseUnarmored = 10
  const armorAC = armor ? (armor.ed.baseAC ?? 0) : baseUnarmored
  const category = armor?.ed.category ?? ''
  const dexApplied = getDexContribution(category, dexMod)
  const shieldBonus = shield?.ed.acBonus ?? 0
  const totalAC = armorAC + dexApplied + shieldBonus

  const parts: string[] = []
  parts.push(
    armor
      ? `${armorAC} (${armor.item.name})`
      : `${baseUnarmored} (Unarmored)`,
  )
  if (category !== 'heavy') {
    parts.push(`${dexApplied >= 0 ? '+' : ''}${dexApplied} DEX`)
  }
  if (shieldBonus > 0 && shield) {
    parts.push(`+${shieldBonus} (${shield.item.name})`)
  }

  const labelParts: string[] = []
  labelParts.push(armor?.item.name ?? 'Unarmored')
  if (shield) labelParts.push(shield.item.name)

  return {
    id: buildConfigId(armor?.item.id, shield?.item.id),
    armorId: armor?.item.id,
    armorName: armor?.item.name,
    shieldId: shield?.item.id,
    shieldName: shield?.item.name,
    totalAC,
    breakdown: parts.join(' '),
    label: labelParts.join(' + '),
  }
}

/**
 * Generate every valid armor + shield combination from the character's owned equipment.
 * Always includes unarmored. Sorted highest AC → lowest.
 */
export function getArmorConfigurations(
  character: Character,
  edition: string,
): ArmorConfiguration[] {
  // if (edition !== '5e') return []

  const dexScore = character.abilityScores?.dexterity ?? 10
  const dexMod = Math.floor((dexScore - 10) / 2)
  const ownedIds = character.equipment?.armor ?? []

  const armors: ResolvedArmor[] = []
  const shields: ResolvedArmor[] = []

  for (const id of ownedIds) {
    const item = equipmentData.armor.find(a => a.id === id)
    const ed = item?.editionData?.find(e => e.edition === '5e') as ArmorEditionDatum | undefined
    if (!item || !ed) continue

    if (ed.category === 'shields') {
      shields.push({ item, ed })
    } else {
      armors.push({ item, ed })
    }
  }

  const configs: ArmorConfiguration[] = []

  // Each armor alone + each armor with each shield
  for (const armor of armors) {
    configs.push(computeConfig(armor, null, dexMod))
    for (const shield of shields) {
      configs.push(computeConfig(armor, shield, dexMod))
    }
  }

  // Unarmored alone + unarmored with each shield
  configs.push(computeConfig(null, null, dexMod))
  for (const shield of shields) {
    configs.push(computeConfig(null, shield, dexMod))
  }

  configs.sort((a, b) => b.totalAC - a.totalAC)
  return configs
}

/**
 * Resolve the active armor configuration.
 * Falls back to the highest-AC config when selectedId is null or no longer valid.
 */
export function getActiveArmorConfig(
  configs: ArmorConfiguration[],
  selectedId: string | null | undefined,
): ArmorConfiguration | null {
  if (configs.length === 0) return null
  if (selectedId) {
    const match = configs.find(c => c.id === selectedId)
    if (match) return match
  }
  return configs[0]
}
