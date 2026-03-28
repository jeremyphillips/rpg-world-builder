import {
  combatantHasSpatialSpeedReduction,
  type CombatantInstance,
  type RuntimeEffectInstance,
  type RuntimeMarker,
  type RuntimeTurnHook,
  type SpatialBattlefieldPresentationOptions,
  type StatModifierMarker,
} from '@/features/mechanics/domain/encounter'
import type {
  CombatStatePresentation,
  CombatStateSection,
  EnrichedPresentableEffect,
  PresentableCombatEffect,
  PresentableTurnHook,
} from './presentable-effects.types'
import { defenseBadgesToPresentableCombatEffects } from '../badges/defense/encounter-defense-badges'
import {
  getPriorityOrder,
  getSectionOrder,
  resolveEffectPresentation,
} from './combat-state-ui-map'
import { formatTurnDuration } from '../../helpers/presentation'

const DEFENSE_BADGE_PRESENTATION_BASE: CombatStatePresentation = {
  label: '',
  tone: 'info',
  priority: 'normal',
  defaultSection: 'ongoing-effects',
  userFacing: true,
}

function isDefenseBadgeKey(key: string): boolean {
  return key.startsWith('defense-condition-') || key.startsWith('defense-damage-')
}

function formatDurationString(duration: { remainingTurns: number; tickOn: string }): string {
  return `${duration.remainingTurns} turn${duration.remainingTurns === 1 ? '' : 's'} ${duration.tickOn}`
}

function normalizeKey(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, '_')
}

/** Semantic key for presentation lookup: prefer stable `marker.id` over raw `label`. */
function semanticKeyFromRuntimeMarker(marker: RuntimeMarker): string {
  const raw = marker.id?.trim() ? marker.id : marker.label
  return normalizeKey(raw)
}

function markerToPresentable(
  marker: RuntimeMarker,
  kind: 'condition' | 'effect' | 'suppression',
  prefix: string,
): PresentableCombatEffect {
  const key = semanticKeyFromRuntimeMarker(marker)
  return {
    id: `${prefix}-${marker.id}`,
    kind,
    key,
    label: marker.label,
    duration: marker.duration ? formatDurationString(marker.duration) : undefined,
  }
}

function runtimeEffectToPresentable(
  effect: RuntimeEffectInstance,
  _combatantId: string,
): PresentableCombatEffect {
  const key = normalizeKey(effect.effectKind || effect.label)
  return {
    id: effect.id,
    kind: 'effect',
    key,
    label: effect.label,
    duration: formatDurationString(effect.duration),
  }
}

function turnHookToPresentable(hook: RuntimeTurnHook, _combatantId: string): PresentableTurnHook {
  const key = hook.id ? normalizeKey(hook.id) : normalizeKey(`${hook.boundary}-${hook.label}`)
  const requirements = hook.requirements?.map((r) => {
    if (r.kind === 'self-state') return `Requires: ${r.state}`
    if (r.kind === 'damage-taken-this-turn') {
      const parts = ['Requires:']
      if (r.min) parts.push(`${r.min}+`)
      if (r.damageType) parts.push(r.damageType)
      parts.push('damage this turn')
      return parts.join(' ')
    }
    if (r.kind === 'hit-points-equals') return `Requires: HP = ${r.value}`
    return 'Requires: (unknown)'
  })
  return {
    id: hook.id,
    kind: 'trigger',
    key,
    label: hook.label,
    boundary: hook.boundary,
    requirements,
    suppressed: false,
  }
}

function statModifierToPresentable(
  modifier: StatModifierMarker,
  _combatantId: string,
): PresentableCombatEffect {
  const key = normalizeKey(modifier.label || modifier.target)
  return {
    id: modifier.id,
    kind: 'modifier',
    key,
    label: modifier.label,
    duration: modifier.duration ? formatDurationString(modifier.duration) : undefined,
  }
}

/**
 * Collects all engine state from a combatant into a flat PresentableCombatEffect array.
 * Includes derived state (e.g. bloodied) and normalizes conditions, states, effects,
 * turn hooks, suppressed hooks, and stat modifiers.
 *
 * When `spatial` is passed, adds derived presentation for attached-aura spatial speed reduction
 * (e.g. Spirit Guardians) from **current** grid overlap — not a static condition on the combatant.
 */
export function collectPresentableEffects(
  combatant: CombatantInstance,
  spatial?: SpatialBattlefieldPresentationOptions,
): PresentableCombatEffect[] {
  const { instanceId } = combatant
  const effects: PresentableCombatEffect[] = []

  // Derived: concentrating
  if (combatant.concentration) {
    const { remainingTurns, totalTurns } = combatant.concentration
    const timeLabel =
      remainingTurns != null && totalTurns != null
        ? ` (${formatTurnDuration({ remainingTurns, totalTurns })})`
        : ''
    effects.push({
      id: `${instanceId}-concentrating`,
      kind: 'effect',
      key: 'concentrating',
      label: `Concentrating: ${combatant.concentration.spellLabel}${timeLabel}`,
    })
  }

  // Derived: bloodied
  const isBloodied =
    combatant.stats.currentHitPoints > 0 &&
    combatant.stats.currentHitPoints <= combatant.stats.maxHitPoints / 2
  if (isBloodied) {
    effects.push({
      id: `${instanceId}-bloodied`,
      kind: 'effect',
      key: 'bloodied',
      label: 'Bloodied',
    })
  }

  if (
    spatial &&
    combatantHasSpatialSpeedReduction(combatant, spatial.encounterState, spatial.battlefieldSpell)
  ) {
    effects.push({
      id: `${instanceId}-spatial-speed-halved`,
      kind: 'effect',
      key: 'speed-halved',
      label: 'Speed Halved',
    })
  }

  // Conditions
  combatant.conditions.forEach((marker) => {
    effects.push(markerToPresentable(marker, 'condition', instanceId))
  })

  // States
  combatant.states.forEach((marker) => {
    effects.push(markerToPresentable(marker, 'effect', instanceId))
  })

  // Runtime effects
  combatant.runtimeEffects.forEach((effect) => {
    effects.push(runtimeEffectToPresentable(effect, instanceId))
  })

  // Turn hooks
  combatant.turnHooks.forEach((hook) => {
    effects.push(turnHookToPresentable(hook, instanceId))
  })

  // Suppressed hooks
  ;(combatant.suppressedHooks ?? []).forEach((marker) => {
    effects.push(markerToPresentable(marker, 'suppression', instanceId))
  })

  // Stat modifiers
  ;(combatant.statModifiers ?? []).forEach((modifier) => {
    effects.push(statModifierToPresentable(modifier, instanceId))
  })

  effects.push(...defenseBadgesToPresentableCombatEffects(combatant))

  return effects
}

function isDerivedConcentratingComposite(effect: PresentableCombatEffect): boolean {
  return effect.key === 'concentrating' && effect.label.includes('Concentrating:')
}

function resolveUserFacingLabelAfterEnrich(
  effect: PresentableCombatEffect,
  presentation: CombatStatePresentation,
): string {
  if (isDefenseBadgeKey(effect.key)) {
    return effect.label
  }
  if (isDerivedConcentratingComposite(effect)) {
    return effect.label
  }
  return presentation.label
}

/**
 * User-facing badge text for an enriched effect. Prefer this over raw `PresentableCombatEffect.label`
 * before enrichment; after `enrichWithPresentation`, `effect.label` matches this value.
 */
export function getUserFacingEffectLabel(effect: EnrichedPresentableEffect): string {
  return effect.label
}

export function enrichWithPresentation(effect: PresentableCombatEffect): EnrichedPresentableEffect {
  if (isDefenseBadgeKey(effect.key)) {
    return {
      ...effect,
      presentation: {
        ...DEFENSE_BADGE_PRESENTATION_BASE,
        label: effect.label,
        rulesText: effect.summary,
      },
      presentationTier: 'defense',
      usedFallbackPresentation: false,
    }
  }

  const { presentation, presentationTier, usedFallbackPresentation } = resolveEffectPresentation(effect)
  const summary =
    presentation.summarize?.(effect) ?? (effect.summary ? effect.summary : undefined)
  const label = resolveUserFacingLabelAfterEnrich(effect, presentation)

  return {
    ...effect,
    label,
    summary: summary ?? effect.summary,
    presentation,
    presentationTier,
    usedFallbackPresentation,
  }
}

export function enrichPresentableEffects(effects: PresentableCombatEffect[]): EnrichedPresentableEffect[] {
  return effects.map((effect) => enrichWithPresentation(effect))
}

const SECTION_ORDER = getSectionOrder()
const PRIORITY_ORDER = getPriorityOrder()

export function sortByPriority(effects: EnrichedPresentableEffect[]): EnrichedPresentableEffect[] {
  return [...effects].sort((a, b) => {
    const sectionA = SECTION_ORDER.indexOf(a.presentation.defaultSection)
    const sectionB = SECTION_ORDER.indexOf(b.presentation.defaultSection)
    if (sectionA !== sectionB) return sectionA - sectionB
    const priorityA = PRIORITY_ORDER.indexOf(a.presentation.priority)
    const priorityB = PRIORITY_ORDER.indexOf(b.presentation.priority)
    return priorityA - priorityB
  })
}

export function groupBySection(
  effects: EnrichedPresentableEffect[],
): Record<CombatStateSection, EnrichedPresentableEffect[]> {
  const groups = SECTION_ORDER.reduce(
    (acc, section) => {
      acc[section] = []
      return acc
    },
    {} as Record<CombatStateSection, EnrichedPresentableEffect[]>,
  )
  for (const effect of effects) {
    groups[effect.presentation.defaultSection].push(effect)
  }
  return groups
}
