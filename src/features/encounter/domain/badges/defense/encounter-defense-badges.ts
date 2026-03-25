import type { Condition } from '@/features/mechanics/domain/conditions/condition.types'
import {
  CONDITION_IMMUNITY_ONLY_DEFINITIONS,
  EFFECT_CONDITION_DEFINITIONS,
  type ConditionImmunityId,
} from '@/features/mechanics/domain/conditions/effect-condition-definitions'
import type { Effect } from '@/features/mechanics/domain/effects/effects.types'
import type { CombatantInstance } from '@/features/mechanics/domain/encounter'
import { MONSTER_TYPE_OPTIONS } from '@/features/content/monsters/domain/vocab/monster.vocab'
import { ENERGY_DAMAGE_TYPES } from '@/features/mechanics/domain/damage/energyDamageTypes'
import { WEAPON_DAMAGE_TYPE_OPTIONS } from '@/features/content/equipment/weapons/domain/vocab/weapons.vocab'
import type { PreviewChip } from '../../view/encounter-view.types'
import type { PresentableCombatEffect } from '../../effects/presentable-effects.types'
import type {
  EncounterConditionImmunityBadge,
  EncounterDamageDefenseBadge,
  EncounterDefenseBadges,
} from './encounter-defense-badges.types'

export type DefensePreviewChipOptions = {
  /** Skip innate stat-block defenses (sourceId 'monster-innate', no duration). */
  excludeGranted?: boolean
  /** Skip damage-vulnerability badges. */
  excludeVulnerabilities?: boolean
}

const DAMAGE_TYPE_DISPLAY_NAME = new Map<string, string>([
  ...ENERGY_DAMAGE_TYPES.map((r) => [r.id, r.name] as const),
  ...WEAPON_DAMAGE_TYPE_OPTIONS.filter((r) => r.value !== 'none').map(
    (r) => [r.value, r.label] as const,
  ),
])

function damageTypeDisplayName(damageType: string): string {
  return DAMAGE_TYPE_DISPLAY_NAME.get(damageType) ?? damageType
}

/**
 * Single formatter for damage-type defense badge copy (immunity / resistance / vulnerability).
 * Call sites must not hand-roll equivalent strings — use this so preview chips and presentable lists stay aligned.
 */
export function formatDamageDefenseLabel(level: string, damageType: string): string {
  const name = damageTypeDisplayName(damageType)
  switch (level) {
    case 'immunity':
      return `Immune: ${name}`
    case 'vulnerability':
      return `Vulnerability: ${name}`
    case 'resistance':
      return `Resistance: ${name}`
    default:
      return `${level}: ${name}`
  }
}

const EFFECT_NAME_BY_ID = new Map(
  EFFECT_CONDITION_DEFINITIONS.map((r) => [r.id, r.name] as const),
)

function conditionImmunityDisplayName(id: ConditionImmunityId): string {
  const fromEffect = EFFECT_NAME_BY_ID.get(id as (typeof EFFECT_CONDITION_DEFINITIONS)[number]['id'])
  if (fromEffect) return fromEffect
  const only = CONDITION_IMMUNITY_ONLY_DEFINITIONS.find((r) => r.id === id)
  if (only) return only.name
  return id
}

function monsterTypeLabel(id: string): string {
  return MONSTER_TYPE_OPTIONS.find((m) => m.id === id)?.name ?? id
}

/** Human-readable scope for defense tooltips (Phase 1: presentation only). */
export function describeConditionScopeForDefenseTooltip(condition: Condition | undefined): string | undefined {
  if (!condition) return undefined
  if (condition.kind === 'creature-type') {
    const names = condition.creatureTypes.map((t) => monsterTypeLabel(t))
    return `Only when the source is: ${names.join(', ')}`
  }
  if (condition.kind === 'and') {
    const parts = condition.conditions
      .map((c) => describeConditionScopeForDefenseTooltip(c))
      .filter((s): s is string => Boolean(s?.trim()))
    return parts.length > 0 ? parts.join('; ') : undefined
  }
  if (condition.kind === 'or') {
    const parts = condition.conditions
      .map((c) => describeConditionScopeForDefenseTooltip(c))
      .filter((s): s is string => Boolean(s?.trim()))
    return parts.length > 0 ? parts.join(' or ') : undefined
  }
  return undefined
}

function isConditionImmunityGrant(
  e: Effect,
): e is Effect & { kind: 'grant'; grantType: 'condition-immunity'; value: ConditionImmunityId } {
  return e.kind === 'grant' && e.grantType === 'condition-immunity'
}

function intrinsicConditionBadges(combatant: CombatantInstance): EncounterConditionImmunityBadge[] {
  const ids = combatant.conditionImmunities ?? []
  return ids.map((condition) => ({
    kind: 'condition-immunity',
    condition,
    label: `Immune: ${conditionImmunityDisplayName(condition)}`,
    conditional: false,
  }))
}

function activeGrantConditionBadges(combatant: CombatantInstance): EncounterConditionImmunityBadge[] {
  const out: EncounterConditionImmunityBadge[] = []
  for (const effect of combatant.activeEffects) {
    if (!isConditionImmunityGrant(effect)) continue
    const scopeLabel = describeConditionScopeForDefenseTooltip(effect.condition)
    const sourceLabel = effect.text?.trim() || effect.source
    out.push({
      kind: 'condition-immunity',
      condition: effect.value,
      label: `Immune: ${conditionImmunityDisplayName(effect.value)}`,
      scopeLabel,
      sourceLabel,
      conditional: true,
    })
  }
  return out
}

/**
 * Merge intrinsic and active grant rows for the same condition id — prefer scoped/active so tooltips stay honest.
 */
function mergeConditionImmunityBadges(
  intrinsic: EncounterConditionImmunityBadge[],
  active: EncounterConditionImmunityBadge[],
): EncounterConditionImmunityBadge[] {
  const byCondition = new Map<ConditionImmunityId, EncounterConditionImmunityBadge>()
  for (const b of intrinsic) {
    byCondition.set(b.condition, b)
  }
  for (const b of active) {
    const existing = byCondition.get(b.condition)
    if (!existing || b.conditional) {
      byCondition.set(b.condition, b)
    }
  }
  return [...byCondition.values()]
}

function damageDefenseBadges(combatant: CombatantInstance): EncounterDamageDefenseBadge[] {
  const markers = combatant.damageResistanceMarkers ?? []
  return markers.map((m) => {
    const conditional = Boolean(m.duration) || m.sourceId !== 'monster-innate'
    const kind =
      m.level === 'immunity'
        ? 'damage-immunity'
        : m.level === 'vulnerability'
          ? 'damage-vulnerability'
          : 'damage-resistance'
    // Damage badge labels are derived from semantic fields (level, damageType) rather than trusted from
    // DamageResistanceMarker.label, which may contain legacy or non-UI phrasing.
    const label = formatDamageDefenseLabel(m.level, m.damageType)
    return {
      kind,
      markerId: m.id,
      damageType: m.damageType,
      label,
      sourceLabel: m.sourceId !== 'monster-innate' ? m.sourceId : undefined,
      conditional,
    }
  })
}

/**
 * Derives separate condition-immunity and damage-defense badge view models for encounter UI.
 * Does not participate in rules resolution — see Phase 3 plan for scoped enforcement.
 */
export function deriveEncounterDefenseBadges(combatant: CombatantInstance): EncounterDefenseBadges {
  const intrinsic = intrinsicConditionBadges(combatant)
  const active = activeGrantConditionBadges(combatant)
  return {
    condition: mergeConditionImmunityBadges(intrinsic, active),
    damage: damageDefenseBadges(combatant),
  }
}

function defenseSummaryForPresentable(badge: EncounterConditionImmunityBadge): string | undefined {
  const parts: string[] = []
  if (badge.scopeLabel) parts.push(badge.scopeLabel)
  if (badge.sourceLabel) parts.push(badge.sourceLabel)
  if (badge.conditional) {
    parts.push('Presentation only: scoped immunity is not enforced by encounter resolution yet (Phase 3).')
  }
  return parts.length > 0 ? parts.join(' — ') : undefined
}

/** Maps defense badges to rows consumed by collectPresentableEffects. */
export function defenseBadgesToPresentableCombatEffects(
  combatant: CombatantInstance,
): PresentableCombatEffect[] {
  const { instanceId } = combatant
  const { condition, damage } = deriveEncounterDefenseBadges(combatant)
  const effects: PresentableCombatEffect[] = []

  for (const b of condition) {
    const key = `defense-condition-${b.condition}`
    effects.push({
      id: `${instanceId}-${key}`,
      kind: 'effect',
      key,
      label: b.label,
      summary: defenseSummaryForPresentable(b),
    })
  }

  for (const d of damage) {
    const key = `defense-damage-${d.kind}-${d.damageType}-${d.markerId}`
    effects.push({
      id: `${instanceId}-${d.markerId}`,
      kind: 'effect',
      key,
      label: d.label,
      summary: d.conditional
        ? 'Presentation only: duration/source may affect resolution separately.'
        : undefined,
    })
  }

  return effects
}

const PREVIEW_TOOLTIP_PHASE1 =
  'Presentation only: scoped immunity rules are not enforced in encounter resolution yet (Phase 3).'

/**
 * Preview chips for defense rows. Uses `deriveEncounterDefenseBadges` only — damage rows reuse
 * `EncounterDamageDefenseBadge.label` (already formatted); do not call `formatDamageDefenseLabel` here.
 */
export function buildEncounterDefensePreviewChips(
  combatant: CombatantInstance,
  options?: DefensePreviewChipOptions,
): PreviewChip[] {
  const { excludeGranted = false, excludeVulnerabilities = false } = options ?? {}
  const { condition, damage } = deriveEncounterDefenseBadges(combatant)
  const chips: PreviewChip[] = []

  for (const b of condition) {
    if (excludeGranted && !b.conditional) continue
    const tooltipParts = [b.scopeLabel, b.sourceLabel, b.conditional ? PREVIEW_TOOLTIP_PHASE1 : undefined].filter(
      Boolean,
    ) as string[]
    chips.push({
      id: `defense-condition-${b.condition}-${b.conditional ? 'scoped' : 'intrinsic'}`,
      label: b.label,
      tone: 'info',
      tooltip: tooltipParts.length > 0 ? tooltipParts.join(' — ') : undefined,
    })
  }

  for (const d of damage) {
    if (excludeVulnerabilities && d.kind === 'damage-vulnerability') continue
    if (excludeGranted && !d.conditional) continue
    chips.push({
      id: `defense-${d.markerId}`,
      label: d.label,
      tone: 'neutral',
      tooltip: d.conditional ? 'Temporary or sourced defense (see combat log / resolution).' : undefined,
    })
  }

  return chips
}
