import type { Monster } from '@/features/content/monsters/domain/types'
import {
  calculateCreatureArmorClass,
  type CreatureArmorCatalogEntry,
  type CreatureArmorClassResult,
  type CreatureArmorInput,
} from '@/features/mechanics/domain/equipment/armorClass'

type ArmorCatalog = Record<string, CreatureArmorCatalogEntry>
type MonsterArmorSource = Pick<Monster, 'mechanics'>

function getMonsterDexterityScore(monster: MonsterArmorSource): number {
  const abilities = monster.mechanics.abilities as
    | { dexterity?: number; dex?: number }
    | undefined

  return abilities?.dexterity ?? abilities?.dex ?? 10
}

function resolveMonsterArmorReference(
  monster: MonsterArmorSource,
  armorRef: string,
  armorById: ArmorCatalog,
): CreatureArmorInput | null {
  const wrappedArmor = monster.mechanics.equipment?.armor?.[armorRef]
  const catalogArmorId = wrappedArmor?.armorId ?? armorRef
  const catalogArmor = armorById[catalogArmorId]

  if (!catalogArmor) {
    return null
  }

  return {
    ...catalogArmor,
    acModifier: wrappedArmor?.acModifier,
    refId: armorRef,
  }
}

export function calculateMonsterArmorClass(
  monster: MonsterArmorSource,
  armorById: ArmorCatalog,
): CreatureArmorClassResult {
  const armorClass = monster.mechanics.armorClass

  if (armorClass.kind === 'fixed') {
    return {
      value: armorClass.value,
      breakdown: {
        parts: [{ kind: 'override', label: 'Fixed', value: armorClass.value }],
      },
    }
  }

  const dexterityScore = getMonsterDexterityScore(monster)
  const dexApplies = armorClass.dexApplies ?? true
  const maxDexBonus = armorClass.maxDexBonus

  if (armorClass.kind === 'equipment') {
    const armors = (armorClass.armorRefs ?? [])
      .map((armorRef) => resolveMonsterArmorReference(monster, armorRef, armorById))
      .filter((armor): armor is CreatureArmorInput => armor != null)

    return calculateCreatureArmorClass({
      dexterityScore,
      defaultBaseAC: 10,
      baseLabel: 'Base',
      dexApplies,
      maxDexBonus,
      overrideAC: armorClass.override,
      armors,
    })
  }

  return calculateCreatureArmorClass({
    dexterityScore,
    defaultBaseAC: armorClass.base ?? 10,
    baseLabel: 'Natural Armor',
    dexApplies,
    maxDexBonus,
    overrideAC: armorClass.override,
  })
}
