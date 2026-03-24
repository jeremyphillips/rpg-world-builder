import type { CombatActionDefinition } from '@/features/mechanics/domain/encounter/resolution/combat-action.types'
import type { ActionBadgeDescriptor } from './combat-action-badges.types'

const PRIORITY_CRITICAL = 10
const PRIORITY_CRITICAL_SECONDARY = 20
const PRIORITY_HIGH = 30
const PRIORITY_HIGH_SECONDARY = 40
const PRIORITY_NORMAL = 50
const PRIORITY_NORMAL_SECONDARY = 60
const PRIORITY_LOW = 70
const PRIORITY_LOW_SECONDARY = 80

function formatSigned(value: number): string {
  return value >= 0 ? `+${value}` : String(value)
}

function deriveRange(action: CombatActionDefinition): string | undefined {
  const meta = action.displayMeta
  if (meta?.source === 'spell') {
    return meta.range || undefined
  }
  if (meta?.source === 'weapon') {
    return meta.range
  }
  if (meta?.source === 'natural' && meta.reach != null) {
    return `${meta.reach}ft`
  }
  if (action.targeting?.rangeFt != null) {
    return `${action.targeting.rangeFt}ft`
  }
  return undefined
}

function deriveDamageLabel(action: CombatActionDefinition): string | undefined {
  const damage = action.attackProfile?.damage ?? action.damage
  const damageType = action.attackProfile?.damageType ?? action.damageType
  if (!damage && !damageType) return undefined
  if (damage && damageType) return `${damage} ${damageType}`
  return damage ?? damageType
}

/**
 * Derives an ordered list of badge descriptors from a combat action definition.
 * Pure function — no React, no hooks, no encounter state.
 */
export function deriveCombatActionBadges(action: CombatActionDefinition): ActionBadgeDescriptor[] {
  const badges: ActionBadgeDescriptor[] = []

  if (action.attackProfile) {
    badges.push({
      kind: 'to-hit',
      label: `${formatSigned(action.attackProfile.attackBonus)} to hit`,
      priority: PRIORITY_CRITICAL,
      tone: 'neutral',
    })
  }

  if (action.saveProfile) {
    badges.push({
      kind: 'save-dc',
      label: `${action.saveProfile.ability.toUpperCase()} DC ${action.saveProfile.dc}`,
      priority: PRIORITY_CRITICAL_SECONDARY,
      tone: 'neutral',
    })
  }

  const damageLabel = deriveDamageLabel(action)
  if (damageLabel) {
    badges.push({
      kind: 'damage',
      label: damageLabel,
      priority: PRIORITY_HIGH,
      tone: 'neutral',
    })
  }

  const rangeLabel = deriveRange(action)
  if (rangeLabel) {
    badges.push({
      kind: 'range',
      label: rangeLabel,
      priority: PRIORITY_HIGH_SECONDARY,
      tone: 'neutral',
    })
  }

  if (action.displayMeta?.source === 'spell' && action.displayMeta.concentration) {
    badges.push({
      kind: 'concentration',
      label: 'conc.',
      priority: PRIORITY_NORMAL,
      tone: 'neutral',
    })
  }

  if (action.sequence && action.sequence.length > 0) {
    for (const step of action.sequence) {
      badges.push({
        kind: 'sequence',
        label: `${step.actionLabel} x${step.count}`,
        priority: PRIORITY_NORMAL_SECONDARY,
        tone: 'neutral',
      })
    }
  }

  if (action.usage?.recharge) {
    const { min, max, ready } = action.usage.recharge
    badges.push({
      kind: 'recharge',
      label: `Rch ${min}\u2013${max}`,
      priority: PRIORITY_LOW,
      tone: ready ? 'neutral' : 'warning',
    })
  }

  if (action.usage?.uses) {
    const { remaining, max } = action.usage.uses
    badges.push({
      kind: 'uses',
      label: `${remaining}/${max}`,
      priority: PRIORITY_LOW_SECONDARY,
      tone: remaining === 0 ? 'warning' : 'neutral',
    })
  }

  badges.sort((a, b) => a.priority - b.priority)
  return badges
}
