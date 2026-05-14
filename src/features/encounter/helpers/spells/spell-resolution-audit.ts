import type { Spell } from '@/features/content/spells/domain/types/spell.types'
import { flattenSpellEffects } from '@/features/content/spells/domain/spellEffectGroups'
import type { Effect } from '@/features/mechanics/domain/effects/effects.types'
import { classifySpellResolutionMode, isFullyActionableEffectKind } from './spell-resolution-classifier'

export type MechanicalSupportLevel = 'none' | 'partial' | 'full'

const SUPPORT_ONLY_KINDS = new Set<string>(['note'])

export function collectEffectKinds(spell: Spell): string[] {
  const effects = flattenSpellEffects(spell)
  const kinds = new Set<string>()
  for (const e of effects) {
    kinds.add(e.kind)
  }
  return [...kinds].sort()
}

export function computeMechanicalSupportLevel(spell: Spell): MechanicalSupportLevel {
  const effects = flattenSpellEffects(spell)
  if (effects.length === 0) return 'none'
  const kinds = collectEffectKinds(spell)
  const onlySupport = kinds.every((k) => SUPPORT_ONLY_KINDS.has(k))
  if (onlySupport) return 'none'
  const hasFull = effects.some((e) => isFullyActionableEffectKind(e.kind))
  if (hasFull) return 'full'
  return 'partial'
}

export type SpellTargetingAuditFlags = {
  hasInstances: boolean
  hasChosenCreatures: boolean
  hasCreaturesInArea: boolean
  hasAreaOnTargeting: boolean
  hasMultipleTargets: boolean
  requiresTargetSelection: boolean
  rangeFeet?: number
}

/** Exported for spell hostility derivation and other effect-tree consumers. */
export function walkNestedEffects(effects: Effect[] | undefined, visit: (e: Effect) => void): void {
  if (!effects) return
  for (const e of effects) {
    visit(e)
    if (e.kind === 'save') {
      walkNestedEffects(e.onFail, visit)
      walkNestedEffects(e.onSuccess, visit)
    }
    if (e.kind === 'interval') walkNestedEffects(e.effects, visit)
    if (e.kind === 'state' && e.ongoingEffects) walkNestedEffects(e.ongoingEffects, visit)
    if (e.kind === 'aura') walkNestedEffects(e.effects, visit)
  }
}

export function computeSpellTargetingAuditFlags(spell: Spell): SpellTargetingAuditFlags {
  const root = flattenSpellEffects(spell)
  let hasInstances = false
  let hasChosenCreatures = false
  let hasCreaturesInArea = false
  let hasAreaOnTargeting = false
  let maxCount = 1
  let canRepeatTarget = false
  let rangeFeet: number | undefined

  walkNestedEffects(root, (e) => {
    if (e.kind === 'damage' && e.instances) hasInstances = true
  })

  for (const g of spell.effectGroups ?? []) {
    const t = g.targeting
    if (!t) continue
    if (t.selection === 'chosen') hasChosenCreatures = true
    if (t.selection === 'in-area') hasCreaturesInArea = true
    if (t.area) hasAreaOnTargeting = true
    if (typeof t.count === 'number') maxCount = Math.max(maxCount, t.count)
    if (t.canSelectSameTargetMultipleTimes) canRepeatTarget = true
    if (typeof t.rangeFeet === 'number') rangeFeet = t.rangeFeet
  }

  const hasMultipleTargets =
    maxCount > 1 || canRepeatTarget || hasCreaturesInArea || hasChosenCreatures || hasAreaOnTargeting

  const hasExplicitCreatureTargeting =
    spell.effectGroups?.some(
      (g) =>
        g.targeting &&
        (g.targeting.selection === 'one' ||
          g.targeting.selection === 'chosen' ||
          g.targeting.selection === 'in-area' ||
          g.targeting.targetType === 'dead-creature')
    ) ?? false

  const requiresTargetSelection =
    spell.range?.kind !== 'self' &&
    (hasChosenCreatures ||
      hasCreaturesInArea ||
      hasAreaOnTargeting ||
      hasExplicitCreatureTargeting ||
      root.some((e) => e.kind === 'damage'))

  return {
    hasInstances,
    hasChosenCreatures,
    hasCreaturesInArea,
    hasAreaOnTargeting,
    hasMultipleTargets,
    requiresTargetSelection,
    rangeFeet,
  }
}

/**
 * Top-level damage without save, spell attack, or authored resolution meta — worth reviewing for auto-hit vs authoring mistakes.
 */
export function computeAmbiguousDelivery(spell: Spell): boolean {
  const mode = classifySpellResolutionMode(spell)
  if (mode === 'attack-roll') return false
  const effects = flattenSpellEffects(spell)
  const hasTopLevelDamage = effects.some((e) => e.kind === 'damage')
  if (!hasTopLevelDamage) return false
  if (effects.some((e) => e.kind === 'save')) return false
  if (spell.resolution?.hpThreshold) return false
  if (spell.resolution && Object.keys(spell.resolution).length > 0) return false
  return true
}

/** True if any `save` effect (including nested under saves) authors a numeric DC. Prefer leaving DC unset for caster-derived spell DCs per effects.md. */
export function spellHasExplicitSaveDc(spell: Spell): boolean {
  let found = false
  walkNestedEffects(flattenSpellEffects(spell), (e) => {
    if (e.kind === 'save' && typeof e.save.dc === 'number') found = true
  })
  return found
}

/**
 * Top-level `damage` alongside a top-level `save` on the same spell — often damage should live only under `save.onFail` / `onSuccess`.
 */
export function spellHasTopLevelDamageAndSave(spell: Spell): boolean {
  const root = flattenSpellEffects(spell)
  return root.some((e) => e.kind === 'damage') && root.some((e) => e.kind === 'save')
}

/** Heuristic: spell attack delivery likely but `deliveryMethod` missing (review list only). */
export function spellMissingDeliveryMethodAttackCandidate(spell: Spell): boolean {
  if (spell.deliveryMethod) return false
  const root = flattenSpellEffects(spell)
  if (!root.some((e) => e.kind === 'damage')) return false
  if (root.some((e) => e.kind === 'save')) return false
  const r = spell.range
  if (r?.kind === 'touch' || r?.kind === 'self') return true
  return false
}

export type SpellAuditRow = {
  id: string
  level: number
  deliveryMethod?: string
  effectKinds: string
  mechanicalSupportLevel: MechanicalSupportLevel
  adapterMode: ReturnType<typeof classifySpellResolutionMode>
  stranded: boolean
  ambiguousDelivery: boolean
  explicitSaveDc: boolean
  topLevelDamageWithSave: boolean
  missingDeliveryMethodAttackCandidate: boolean
  targeting: SpellTargetingAuditFlags
}

export function buildSpellAuditRow(spell: Spell): SpellAuditRow {
  const mechanicalSupportLevel = computeMechanicalSupportLevel(spell)
  const adapterMode = classifySpellResolutionMode(spell)
  const stranded = mechanicalSupportLevel !== 'none' && adapterMode === 'log-only'

  return {
    id: spell.id,
    level: spell.level,
    deliveryMethod: spell.deliveryMethod,
    effectKinds: collectEffectKinds(spell).join(','),
    mechanicalSupportLevel,
    adapterMode,
    stranded,
    ambiguousDelivery: computeAmbiguousDelivery(spell),
    explicitSaveDc: spellHasExplicitSaveDc(spell),
    topLevelDamageWithSave: spellHasTopLevelDamageAndSave(spell),
    missingDeliveryMethodAttackCandidate: spellMissingDeliveryMethodAttackCandidate(spell),
    targeting: computeSpellTargetingAuditFlags(spell),
  }
}

export type SpellAuditSummary = {
  total: number
  stranded: number
  strandedFullSupport: number
  strandedWithChosenCreatures: number
  ambiguousDelivery: number
  explicitSaveDc: number
  topLevelDamageWithSave: number
  missingDeliveryMethodAttackCandidate: number
}

export function summarizeSpellAudit(spells: readonly Spell[]): SpellAuditSummary {
  let stranded = 0
  let strandedFullSupport = 0
  let strandedWithChosenCreatures = 0
  let ambiguousDelivery = 0
  let explicitSaveDc = 0
  let topLevelDamageWithSave = 0
  let missingDeliveryMethodAttackCandidate = 0

  for (const spell of spells) {
    const row = buildSpellAuditRow(spell)
    if (row.stranded) {
      stranded += 1
      if (row.mechanicalSupportLevel === 'full') strandedFullSupport += 1
      if (row.targeting.hasChosenCreatures) strandedWithChosenCreatures += 1
    }
    if (row.ambiguousDelivery) ambiguousDelivery += 1
    if (row.explicitSaveDc) explicitSaveDc += 1
    if (row.topLevelDamageWithSave) topLevelDamageWithSave += 1
    if (row.missingDeliveryMethodAttackCandidate) missingDeliveryMethodAttackCandidate += 1
  }

  return {
    total: spells.length,
    stranded,
    strandedFullSupport,
    strandedWithChosenCreatures,
    ambiguousDelivery,
    explicitSaveDc,
    topLevelDamageWithSave,
    missingDeliveryMethodAttackCandidate,
  }
}
