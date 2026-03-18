import type { ArmorCategory, DexContribution } from '@/features/content/equipment/armor/domain/types'
import type { FormulaDefinition } from '@/features/mechanics/domain/resolution/engines/formula.engine'
import { getAbilityModifier } from '@/features/mechanics/domain/abilities/getAbilityModifier'

export type CreatureArmorCatalogEntry = {
  id: string
  name: string
  category: ArmorCategory
  baseAC?: number
  acBonus?: number
  dex?: DexContribution
}

export type CreatureArmorInput = CreatureArmorCatalogEntry & {
  acModifier?: number
  refId?: string
}

export type CreatureArmorClassBreakdownPart =
  | {
      kind: 'base'
      label: string
      value: number
      sourceId?: string
      refId?: string
    }
  | {
      kind: 'dex'
      label: 'DEX'
      value: number
      uncappedValue: number
      maxBonus?: number
    }
  | {
      kind: 'modifier'
      label: string
      value: number
      sourceId?: string
      refId?: string
    }
  | {
      kind: 'override'
      label: string
      value: number
    }

export type CreatureArmorClassBreakdown = {
  parts: CreatureArmorClassBreakdownPart[]
  bodyArmor?: CreatureArmorInput
  shieldArmor?: CreatureArmorInput
}

export type CreatureArmorClassResult = {
  value: number
  breakdown: CreatureArmorClassBreakdown
}

export type CalculateCreatureArmorClassInput = {
  dexterityScore?: number
  defaultBaseAC?: number
  baseLabel?: string
  dexApplies?: boolean
  maxDexBonus?: number | null
  overrideAC?: number
  armors?: CreatureArmorInput[]
}

function getFallbackDexMode(category: ArmorCategory): DexContribution {
  if (category === 'heavy' || category === 'shields') {
    return { mode: 'none' }
  }

  if (category === 'medium') {
    return { mode: 'capped', maxBonus: 2 }
  }

  return { mode: 'full' }
}

function getArmorDexRule(armor: CreatureArmorCatalogEntry): DexContribution {
  return armor.dex ?? getFallbackDexMode(armor.category)
}

function getEffectiveDexCap(
  armor: CreatureArmorCatalogEntry | undefined,
  dexApplies: boolean,
  maxDexBonus: number | null | undefined,
): number | undefined {
  if (!dexApplies) return 0

  const armorDex = armor ? getArmorDexRule(armor) : { mode: 'full' as const }
  if (armorDex.mode === 'none') return 0

  const armorCap = armorDex.mode === 'capped' ? armorDex.maxBonus : undefined

  if (armorCap == null) {
    return maxDexBonus ?? undefined
  }

  if (maxDexBonus == null) {
    return armorCap
  }

  return Math.min(armorCap, maxDexBonus)
}

function getDexContributionValue(
  dexterityScore: number | undefined,
  armor: CreatureArmorCatalogEntry | undefined,
  dexApplies: boolean,
  maxDexBonus: number | null | undefined,
) {
  const uncappedValue = getAbilityModifier(dexterityScore ?? 10)
  const effectiveCap = getEffectiveDexCap(armor, dexApplies, maxDexBonus)

  if (effectiveCap === 0) {
    return {
      appliedValue: 0,
      uncappedValue,
      maxBonus: 0,
    }
  }

  if (effectiveCap == null) {
    return {
      appliedValue: uncappedValue,
      uncappedValue,
      maxBonus: undefined,
    }
  }

  return {
    appliedValue: Math.min(uncappedValue, effectiveCap),
    uncappedValue,
    maxBonus: effectiveCap,
  }
}

function getAdjustedBaseArmorClass(armor: CreatureArmorInput): number {
  return (armor.baseAC ?? 10) + (armor.acModifier ?? 0)
}

export function getCreatureArmorBonusValue(armor: CreatureArmorInput): number {
  return (armor.acBonus ?? 0) + (armor.acModifier ?? 0)
}

function getBodyArmorValue(
  armor: CreatureArmorInput,
  dexterityScore: number | undefined,
  dexApplies: boolean,
  maxDexBonus: number | null | undefined,
): number {
  const dex = getDexContributionValue(dexterityScore, armor, dexApplies, maxDexBonus)
  return getAdjustedBaseArmorClass(armor) + dex.appliedValue
}

export function selectCreatureArmorPieces(
  armors: CreatureArmorInput[] | undefined,
  dexterityScore: number | undefined,
  dexApplies = true,
  maxDexBonus?: number | null,
): Pick<CreatureArmorClassBreakdown, 'bodyArmor' | 'shieldArmor'> {
  const entries = armors ?? []
  let bodyArmor: CreatureArmorInput | undefined
  let shieldArmor: CreatureArmorInput | undefined

  for (const armor of entries) {
    if (armor.category === 'shields') {
      if (!shieldArmor || getCreatureArmorBonusValue(armor) > getCreatureArmorBonusValue(shieldArmor)) {
        shieldArmor = armor
      }
      continue
    }

    if (!bodyArmor || getBodyArmorValue(armor, dexterityScore, dexApplies, maxDexBonus) > getBodyArmorValue(bodyArmor, dexterityScore, dexApplies, maxDexBonus)) {
      bodyArmor = armor
    }
  }

  return { bodyArmor, shieldArmor }
}

export function getCreatureArmorFormulaDefinition(
  armor: CreatureArmorInput,
  options?: {
    dexApplies?: boolean
    maxDexBonus?: number | null
  },
): FormulaDefinition {
  const dexApplies = options?.dexApplies ?? true
  const maxDexBonus = options?.maxDexBonus
  const maxAbilityContribution = getEffectiveDexCap(armor, dexApplies, maxDexBonus)

  const formula: FormulaDefinition = {
    base: getAdjustedBaseArmorClass(armor),
  }

  if (maxAbilityContribution === 0) {
    return formula
  }

  formula.ability = 'dexterity'

  if (maxAbilityContribution != null) {
    formula.maxAbilityContribution = maxAbilityContribution
  }

  return formula
}

export function calculateCreatureArmorClass(
  input: CalculateCreatureArmorClassInput,
): CreatureArmorClassResult {
  const {
    dexterityScore,
    defaultBaseAC = 10,
    baseLabel = 'Base',
    dexApplies = true,
    maxDexBonus,
    overrideAC,
    armors,
  } = input

  if (overrideAC != null) {
    return {
      value: overrideAC,
      breakdown: {
        parts: [{ kind: 'override', label: 'Override', value: overrideAC }],
      },
    }
  }

  const { bodyArmor, shieldArmor } = selectCreatureArmorPieces(
    armors,
    dexterityScore,
    dexApplies,
    maxDexBonus,
  )

  const parts: CreatureArmorClassBreakdownPart[] = []
  const baseValue = bodyArmor ? getAdjustedBaseArmorClass(bodyArmor) : defaultBaseAC
  parts.push({
    kind: 'base',
    label: bodyArmor?.name ?? baseLabel,
    value: baseValue,
    sourceId: bodyArmor?.id,
    refId: bodyArmor?.refId,
  })

  const dex = getDexContributionValue(
    dexterityScore,
    bodyArmor,
    bodyArmor ? dexApplies : dexApplies,
    maxDexBonus,
  )
  if (dex.appliedValue !== 0 || dex.uncappedValue !== 0 || dex.maxBonus != null) {
    parts.push({
      kind: 'dex',
      label: 'DEX',
      value: dex.appliedValue,
      uncappedValue: dex.uncappedValue,
      maxBonus: dex.maxBonus,
    })
  }

  const shieldBonus = shieldArmor ? getCreatureArmorBonusValue(shieldArmor) : 0
  if (shieldArmor && shieldBonus !== 0) {
    parts.push({
      kind: 'modifier',
      label: shieldArmor.name,
      value: shieldBonus,
      sourceId: shieldArmor.id,
      refId: shieldArmor.refId,
    })
  }

  return {
    value: baseValue + dex.appliedValue + shieldBonus,
    breakdown: {
      parts,
      bodyArmor,
      shieldArmor,
    },
  }
}
