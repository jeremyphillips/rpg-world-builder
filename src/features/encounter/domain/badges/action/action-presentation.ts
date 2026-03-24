import type { CombatActionDefinition } from '@/features/mechanics/domain/encounter/resolution/combat-action.types'
import type { ActionPresentationViewModel, ActionSemanticCategory, ActionSourceTag } from './action-presentation.types'
import { deriveCombatActionBadges } from './combat-action-badges'

function deriveDisplayName(action: CombatActionDefinition): string {
  if (action.displayMeta?.source === 'spell') {
    return `${action.label} \u00B7 Lvl ${action.displayMeta.level}`
  }
  return action.label
}

function deriveSecondLine(action: CombatActionDefinition): string | undefined {
  if (action.displayMeta?.source === 'spell' && action.displayMeta.summary) {
    return action.displayMeta.summary
  }
  if (action.displayMeta?.source === 'natural' && action.displayMeta.description) {
    return action.displayMeta.description
  }
  return undefined
}

function deriveCategory(action: CombatActionDefinition): ActionSemanticCategory {
  if (action.kind === 'spell') {
    if (action.effects?.some((e) => e.kind === 'hit-points' && 'mode' in e && e.mode === 'heal')) {
      return 'heal'
    }
    const isOffensive =
      action.attackProfile != null ||
      action.saveProfile != null ||
      action.hostileApplication === true
    if (isOffensive) return 'attack'
    if (action.effects?.some((e) => e.kind === 'modifier' || e.kind === 'grant' || e.kind === 'state')) {
      return 'buff'
    }
    return 'utility'
  }

  if (action.kind === 'weapon-attack' || action.kind === 'monster-action') {
    if (action.sequence && action.sequence.length > 0) return 'attack'
    if (action.resolutionMode === 'log-only' && !action.attackProfile && !action.damage) {
      return 'utility'
    }
    return 'attack'
  }

  return 'utility'
}

function deriveSourceTag(action: CombatActionDefinition): ActionSourceTag {
  if (action.displayMeta) {
    switch (action.displayMeta.source) {
      case 'weapon': return 'weapon'
      case 'spell': return 'spell'
      case 'natural': return 'natural'
    }
  }
  if (action.kind === 'combat-effect') return 'feature'
  return 'feature'
}

function deriveFooterLink(action: CombatActionDefinition): ActionPresentationViewModel['footerLink'] {
  if (action.displayMeta?.source !== 'spell') return undefined
  const { spellId } = action.displayMeta
  if (!spellId) return undefined
  return { spellId, label: 'View details' }
}

/**
 * Derives a complete presentation view model for a combat action.
 * Pure function — no React, no hooks, no encounter state.
 * Wraps {@link deriveCombatActionBadges} and adds name, secondLine, category, sourceTag, and footer link derivation.
 */
export function deriveActionPresentation(action: CombatActionDefinition): ActionPresentationViewModel {
  return {
    actionId: action.id,
    displayName: deriveDisplayName(action),
    secondLine: deriveSecondLine(action),
    badges: deriveCombatActionBadges(action),
    category: deriveCategory(action),
    sourceTag: deriveSourceTag(action),
    footerLink: deriveFooterLink(action),
  }
}
