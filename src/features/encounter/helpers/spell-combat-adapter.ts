import type { Spell, SpellDuration, SpellRange } from '@/features/content/spells/domain/types/spell.types'
import type { EffectDuration } from '@/features/mechanics/domain/effects/timing.types'
import type { Effect } from '@/features/mechanics/domain/effects/effects.types'
import type { CombatActionDefinition } from '@/features/mechanics/domain/encounter'
import { classifySpellResolutionMode } from './spell-resolution-classifier'

/** Resource key for persisting spell use. Export for onSpellSlotSpent handlers. */
export const SPELL_USED_PREFIX = 'spell_used_'

export function formatSpellRange(range: SpellRange): string {
  switch (range.kind) {
    case 'self': return 'Self'
    case 'touch': return 'Touch'
    case 'sight': return 'Sight'
    case 'unlimited': return 'Unlimited'
    case 'special': return range.description
    case 'distance': return `${range.value.value}${range.value.unit}`
  }
}

function isConcentrationSpell(duration: SpellDuration | undefined): boolean {
  if (!duration || duration.kind === 'instantaneous') return false
  return 'concentration' in duration && duration.concentration === true
}

const SECONDS_PER_TURN = 6

const TIME_UNIT_TO_SECONDS: Record<string, number> = {
  minute: 60,
  hour: 3600,
  day: 86400,
}

function spellDurationToTurns(duration: SpellDuration | undefined): number | undefined {
  if (!duration || duration.kind !== 'timed') return undefined
  const unitSeconds = TIME_UNIT_TO_SECONDS[duration.unit]
  if (!unitSeconds) return undefined
  return Math.round((duration.value * unitSeconds) / SECONDS_PER_TURN)
}

/**
 * Compute usage for a spell action. One use per day per spell.
 * Cantrips (level 0): no usage limit — one use per turn via action cost.
 *
 * KNOWN EDGE CASES:
 * - Cantrips: No usage (unlimited per turn).
 * - Warlock pact: Short-rest recharge not yet modeled.
 */
function resolveSpellUsage(
  spellId: string,
  spellLevel: number,
  resources?: Record<string, number>,
): CombatActionDefinition['usage'] {
  if (spellLevel <= 0) return undefined
  const key = `${SPELL_USED_PREFIX}${spellId}`
  const used = resources?.[key] === 1
  return { uses: { max: 1, remaining: used ? 0 : 1, period: 'day' } }
}

export function buildSpellDisplayMeta(spell: Spell): CombatActionDefinition['displayMeta'] {
  const concentration = isConcentrationSpell(spell.duration)
  return {
    source: 'spell' as const,
    spellId: spell.id,
    level: spell.level,
    concentration,
    concentrationDurationTurns: concentration ? spellDurationToTurns(spell.duration) : undefined,
    range: spell.range ? formatSpellRange(spell.range) : '',
    summary: spell.description?.summary || undefined,
  }
}

export function buildSpellLogText(spell: Spell): string {
  const effectText = (spell.effects ?? [])
    .map((effect) => effect.text?.trim())
    .filter((text): text is string => Boolean(text))
    .join(' ')

  return effectText || spell.description.summary?.trim() || `${spell.name} effect resolution not implemented yet.`
}

function buildSpellActionCost(spell: Spell): { action?: boolean; bonusAction?: boolean; reaction?: boolean } {
  const unit = spell.castingTime?.normal?.unit
  if (unit === 'bonus-action') return { bonusAction: true }
  if (unit === 'reaction') return { reaction: true }
  return { action: true }
}

function getSpellCreatureTypeFilter(spell: Spell): string[] | undefined {
  const targeting = spell.effects?.find((e) => e.kind === 'targeting')
  if (targeting?.kind === 'targeting' && targeting.creatureTypeFilter?.length) {
    return [...targeting.creatureTypeFilter]
  }
  return undefined
}

function buildSpellTargeting(spell: Spell): { kind: 'single-target' | 'all-enemies' | 'self' | 'single-creature' | 'dead-creature'; creatureTypeFilter?: string[] } {
  if (spell.range?.kind === 'self') return { kind: 'self' }
  const effects = spell.effects ?? []
  const hasDeadCreatureTargeting = effects.some(
    (e) => e.kind === 'targeting' && e.target === 'one-dead-creature',
  )
  if (hasDeadCreatureTargeting) return { kind: 'dead-creature' }
  const hasHealing = effects.some((e) => e.kind === 'hit-points' && e.mode === 'heal')
  if (hasHealing) return { kind: 'single-creature' }
  const targeting = effects.find((e) => e.kind === 'targeting')
  const creatureTypeFilter = getSpellCreatureTypeFilter(spell)
  if (targeting?.kind === 'targeting' && targeting.area) return { kind: 'all-enemies', creatureTypeFilter }
  if (targeting?.kind === 'targeting' && targeting.target === 'creatures-in-area') return { kind: 'all-enemies', creatureTypeFilter }
  return { kind: 'single-target', creatureTypeFilter }
}

/**
 * Multi-instance auto-hit damage (e.g. Magic Missile): one damage roll per instance, same target until multi-select exists.
 * Requires a lone mechanical root effect (the `damage` with `instances`); no top-level `save` / buff riders.
 */
function spellShouldUseEffectsSequence(spell: Spell, casterLevel: number): boolean {
  if (resolveInstanceCount(spell, casterLevel) <= 1) return false
  const root = spell.effects ?? []
  if (root.some((e) => e.kind === 'save')) return false
  const mechanicalRoot = root.filter((e) => e.kind !== 'targeting' && e.kind !== 'note')
  if (mechanicalRoot.length !== 1) return false
  const only = mechanicalRoot[0]
  return only?.kind === 'damage' && Boolean(only.instances)
}

function injectSpellSaveDc(effects: Effect[], spellSaveDc: number): Effect[] {
  return effects.map((effect) => {
    if (effect.kind !== 'save') return effect
    if (typeof effect.save.dc === 'number') return effect
    return { ...effect, save: { ...effect.save, dc: spellSaveDc } }
  })
}

function findSpellDamageEffect(spell: Spell): Extract<Effect, { kind: 'damage' }> | undefined {
  return (spell.effects ?? []).find((e): e is Extract<Effect, { kind: 'damage' }> => e.kind === 'damage')
}

function resolveInstanceCount(spell: Spell, casterLevel: number): number {
  const damageEffect = findSpellDamageEffect(spell)
  if (!damageEffect?.instances) return 1

  let count = damageEffect.instances.count
  const thresholds = damageEffect.levelScaling?.thresholds
  if (thresholds) {
    for (const t of thresholds) {
      if (casterLevel >= t.level && t.instances != null) {
        count = t.instances
      }
    }
  }
  return count
}

function spellDurationToEffectDuration(spellDuration: SpellDuration): EffectDuration | undefined {
  if (spellDuration.kind === 'until-turn-boundary') {
    return {
      kind: 'until-turn-boundary',
      subject: spellDuration.subject,
      turn: spellDuration.turn,
      boundary: spellDuration.boundary,
    }
  }
  if (spellDuration.kind === 'timed') {
    const turns = spellDurationToTurns(spellDuration)
    if (turns != null && turns > 0) {
      return { kind: 'fixed', value: turns, unit: 'turn' }
    }
  }
  return undefined
}

function enrichSpellEffectsForCombat(
  spell: Spell,
  effects: Effect[],
  spellSaveDc: number,
  spellcastingAbilityModifier?: number,
): Effect[] {
  let out = injectSpellSaveDc(effects, spellSaveDc)
  if (typeof spellcastingAbilityModifier === 'number') {
    out = injectHealingAbilityModifier(out, spellcastingAbilityModifier)
  }
  out = injectSpellEffectDuration(out, spell.duration)
  return out
}

function injectSpellEffectDuration(effects: Effect[], spellDuration: SpellDuration): Effect[] {
  const effectDuration = spellDurationToEffectDuration(spellDuration)
  if (!effectDuration) return effects

  return effects.map((effect) => {
    if (effect.duration) return effect
    return { ...effect, duration: effectDuration } as Effect
  })
}

function injectHealingAbilityModifier(effects: Effect[], abilityModifier: number): Effect[] {
  return effects.map((effect) => {
    if (effect.kind !== 'hit-points' || !effect.abilityModifier) return effect
    const base = String(effect.value)
    const sign = abilityModifier >= 0 ? '+' : '-'
    const enrichedValue = `${base}${sign}${Math.abs(abilityModifier)}`
    return { ...effect, value: enrichedValue, abilityModifier: undefined } as Effect
  })
}

function buildSpellAttackAction(
  spell: Spell,
  runtimeId: string,
  spellAttackBonus: number,
  casterLevel: number,
  usage: CombatActionDefinition['usage'],
): CombatActionDefinition[] {
  const damageEffect = findSpellDamageEffect(spell)
  const instanceCount = resolveInstanceCount(spell, casterLevel)
  const damage = damageEffect ? String(damageEffect.damage) : undefined
  const damageType = damageEffect?.damageType as string | undefined

  const onHitEffects = (spell.effects ?? []).filter(
    (e) => e.kind !== 'targeting' && e.kind !== 'damage' && e.kind !== 'note',
  )

  const displayMeta = buildSpellDisplayMeta(spell)

  if (instanceCount <= 1) {
    return [{
      id: `${runtimeId}-spell-${spell.id}`,
      label: spell.name,
      kind: 'spell',
      cost: buildSpellActionCost(spell),
      resolutionMode: 'attack-roll',
      attackProfile: {
        attackBonus: spellAttackBonus,
        damage,
        damageType,
      },
      targeting: { kind: 'single-target' },
      onHitEffects: onHitEffects.length > 0 ? onHitEffects : undefined,
      logText: buildSpellLogText(spell),
      displayMeta,
      usage,
    }]
  }

  const beamLabel = `${spell.name} Beam`
  const beamId = `${runtimeId}-spell-${spell.id}-beam`

  const beamAction: CombatActionDefinition = {
    id: beamId,
    label: beamLabel,
    kind: 'spell',
    cost: {},
    resolutionMode: 'attack-roll',
    attackProfile: {
      attackBonus: spellAttackBonus,
      damage,
      damageType,
    },
    targeting: { kind: 'single-target' },
    onHitEffects: onHitEffects.length > 0 ? onHitEffects : undefined,
    displayMeta,
  }

  const parentAction: CombatActionDefinition = {
    id: `${runtimeId}-spell-${spell.id}`,
    label: spell.name,
    kind: 'spell',
    cost: buildSpellActionCost(spell),
    resolutionMode: 'attack-roll',
    attackProfile: {
      attackBonus: spellAttackBonus,
      damage,
      damageType,
    },
    targeting: { kind: 'single-target' },
    sequence: [{ actionLabel: beamLabel, count: instanceCount }],
    logText: buildSpellLogText(spell),
    displayMeta,
    usage,
  }

  return [parentAction, beamAction]
}

function buildSpellEffectsAction(
  spell: Spell,
  runtimeId: string,
  spellSaveDc: number,
  usage: CombatActionDefinition['usage'],
  spellcastingAbilityModifier?: number,
): CombatActionDefinition {
  const enrichedEffects = enrichSpellEffectsForCombat(
    spell,
    spell.effects ?? [],
    spellSaveDc,
    spellcastingAbilityModifier,
  )
  const resolvableEffects = enrichedEffects.filter((e) => e.kind !== 'targeting')

  const hpCfg = spell.resolution?.hpThreshold
  const aboveThresholdEffects = hpCfg?.aboveMaxHpEffects?.length
    ? enrichSpellEffectsForCombat(spell, hpCfg.aboveMaxHpEffects, spellSaveDc, spellcastingAbilityModifier).filter(
        (e) => e.kind !== 'targeting',
      )
    : undefined

  return {
    id: `${runtimeId}-spell-${spell.id}`,
    label: spell.name,
    kind: 'spell',
    cost: buildSpellActionCost(spell),
    resolutionMode: 'effects',
    effects: resolvableEffects,
    hpThreshold: hpCfg ? { maxHp: hpCfg.maxHp } : undefined,
    aboveThresholdEffects: aboveThresholdEffects && aboveThresholdEffects.length > 0 ? aboveThresholdEffects : undefined,
    targeting: buildSpellTargeting(spell),
    logText: buildSpellLogText(spell),
    displayMeta: buildSpellDisplayMeta(spell),
    usage,
  }
}

function buildSpellEffectsSequenceActions(
  spell: Spell,
  runtimeId: string,
  usage: CombatActionDefinition['usage'],
  casterLevel: number,
): CombatActionDefinition[] {
  const instanceCount = resolveInstanceCount(spell, casterLevel)
  const damageEffect = findSpellDamageEffect(spell)!
  const { instances: _omit, ...damageWithoutInstances } = damageEffect
  let childEffects: Effect[] = [damageWithoutInstances as Effect]
  childEffects = injectSpellEffectDuration(childEffects, spell.duration)

  const creatureTypeFilter = getSpellCreatureTypeFilter(spell)
  const hitLabel = `${spell.name} hit`
  const displayMeta = buildSpellDisplayMeta(spell)

  const childAction: CombatActionDefinition = {
    id: `${runtimeId}-spell-${spell.id}-hit`,
    label: hitLabel,
    kind: 'spell',
    cost: {},
    resolutionMode: 'effects',
    effects: childEffects,
    targeting: { kind: 'single-target', creatureTypeFilter },
    displayMeta,
  }

  const parentAction: CombatActionDefinition = {
    id: `${runtimeId}-spell-${spell.id}`,
    label: spell.name,
    kind: 'spell',
    cost: buildSpellActionCost(spell),
    resolutionMode: 'effects',
    sequence: [{ actionLabel: hitLabel, count: instanceCount }],
    targeting: { kind: 'single-target', creatureTypeFilter },
    logText: buildSpellLogText(spell),
    displayMeta,
    usage,
  }

  return [parentAction, childAction]
}

export function buildSpellCombatActions(args: {
  runtimeId: string
  spellIds?: string[]
  spellsById: Record<string, Spell>
  spellSaveDc: number
  spellAttackBonus: number
  spellcastingAbilityModifier?: number
  casterLevel: number
  /** Persisted resources e.g. { spell_used_fireball: 1 }. When absent, remaining = 1. */
  resources?: Record<string, number>
}): CombatActionDefinition[] {
  const {
    runtimeId,
    spellIds = [],
    spellsById,
    spellSaveDc,
    spellAttackBonus,
    spellcastingAbilityModifier,
    casterLevel,
    resources,
  } = args

  return spellIds.flatMap((spellId) => {
    const spell = spellsById[spellId]
    if (!spell) return []

    const usage = resolveSpellUsage(spell.id, spell.level, resources)
    const effectiveUsage = spell.level > 0 ? usage : undefined

    const mode = classifySpellResolutionMode(spell)

    if (mode === 'attack-roll') {
      return buildSpellAttackAction(spell, runtimeId, spellAttackBonus, casterLevel, effectiveUsage)
    }

    if (mode === 'effects') {
      if (spellShouldUseEffectsSequence(spell, casterLevel)) {
        return buildSpellEffectsSequenceActions(spell, runtimeId, effectiveUsage, casterLevel)
      }
      return [buildSpellEffectsAction(spell, runtimeId, spellSaveDc, effectiveUsage, spellcastingAbilityModifier)]
    }

    return [{
      id: `${runtimeId}-spell-${spell.id}`,
      label: spell.name,
      kind: 'spell',
      cost: buildSpellActionCost(spell),
      resolutionMode: 'log-only',
      logText: buildSpellLogText(spell),
      displayMeta: buildSpellDisplayMeta(spell),
      usage: effectiveUsage,
    }]
  })
}
