import { describe, expect, it } from 'vitest'

import { EXTRAPLANAR_CREATURE_TYPES } from '@/features/mechanics/domain/rulesets/system/monsters/extraplanar-creature-types'
import type { CombatantInstance } from '@/features/mechanics/domain/encounter'
import {
  deriveEncounterDefenseBadges,
  describeConditionScopeForDefenseTooltip,
  formatDamageDefenseLabel,
} from './encounter-defense-badges'
import { collectPresentableEffects, enrichPresentableEffects } from '../../effects/presentable-effects'

function minimalCombatant(overrides: Partial<CombatantInstance> = {}): CombatantInstance {
  return {
    instanceId: 'test-1',
    side: 'party',
    source: { kind: 'pc', sourceId: 'c1', label: 'Test' },
    stats: {
      armorClass: 14,
      maxHitPoints: 20,
      currentHitPoints: 20,
      initiativeModifier: 2,
    },
    attacks: [],
    activeEffects: [],
    runtimeEffects: [],
    turnHooks: [],
    conditions: [],
    states: [],
    ...overrides,
  }
}

describe('deriveEncounterDefenseBadges', () => {
  it('lists intrinsic condition immunities as unconditional', () => {
    const c = minimalCombatant({
      conditionImmunities: ['poisoned', 'exhaustion'],
    })
    const { condition, damage } = deriveEncounterDefenseBadges(c)
    expect(condition.map((b) => b.condition).sort()).toEqual(['exhaustion', 'poisoned'])
    expect(condition.every((b) => b.conditional === false)).toBe(true)
    expect(damage).toEqual([])
  })

  it('lists damage markers with marker ids', () => {
    const c = minimalCombatant({
      damageResistanceMarkers: [
        {
          id: 'm1',
          damageType: 'fire',
          level: 'immunity',
          sourceId: 'monster-innate',
          label: 'immunity to fire',
        },
        {
          id: 'm2',
          damageType: 'cold',
          level: 'resistance',
          sourceId: 'monster-innate',
          label: 'resistance to cold',
        },
      ],
    })
    const { damage } = deriveEncounterDefenseBadges(c)
    expect(damage.map((d) => d.markerId).sort()).toEqual(['m1', 'm2'])
    expect(damage[0].conditional).toBe(false)
    expect(damage.find((d) => d.markerId === 'm1')?.label).toBe('Immune: Fire')
    expect(damage.find((d) => d.markerId === 'm2')?.label).toBe('Resistance: Cold')
  })

  it('derives damage badge labels from level and damageType, ignoring stale marker.label', () => {
    const c = minimalCombatant({
      damageResistanceMarkers: [
        {
          id: 'stale',
          damageType: 'necrotic',
          level: 'immunity',
          sourceId: 'monster-innate',
          label: 'immunity to necrotic',
        },
        {
          id: 'vuln',
          damageType: 'fire',
          level: 'vulnerability',
          sourceId: 'monster-innate',
          label: 'vulnerability to fire',
        },
      ],
    })
    const { damage } = deriveEncounterDefenseBadges(c)
    expect(damage.map((d) => d.label)).toEqual(['Immune: Necrotic', 'Vulnerability: Fire'])
  })

  it('parses activeEffects condition-immunity grants as conditional', () => {
    const c = minimalCombatant({
      activeEffects: [
        {
          kind: 'grant',
          grantType: 'condition-immunity',
          value: 'charmed',
          condition: EXTRAPLANAR_CREATURE_TYPES,
          text: 'Also immune to possession from these creature types.',
        },
      ],
    })
    const { condition } = deriveEncounterDefenseBadges(c)
    expect(condition).toHaveLength(1)
    expect(condition[0].condition).toBe('charmed')
    expect(condition[0].conditional).toBe(true)
    expect(condition[0].scopeLabel).toMatch(/Only when the source is:/)
  })
})

describe('formatDamageDefenseLabel', () => {
  it('uses the shared vocabulary for damage defense levels', () => {
    expect(formatDamageDefenseLabel('immunity', 'cold')).toBe('Immune: Cold')
    expect(formatDamageDefenseLabel('resistance', 'slashing')).toBe('Resistance: Slashing')
    expect(formatDamageDefenseLabel('vulnerability', 'acid')).toBe('Vulnerability: Acid')
  })
})

describe('describeConditionScopeForDefenseTooltip', () => {
  it('describes extraplanar creature-type condition', () => {
    const t = describeConditionScopeForDefenseTooltip(EXTRAPLANAR_CREATURE_TYPES)
    expect(t).toMatch(/Aberration|Celestial|Fiend/i)
  })
})

describe('collectPresentableEffects + defenses', () => {
  it('includes defense rows and enriches to ongoing-effects', () => {
    const c = minimalCombatant({
      conditionImmunities: ['poisoned'],
      damageResistanceMarkers: [
        {
          id: 'dm-1',
          damageType: 'fire',
          level: 'immunity',
          sourceId: 'monster-innate',
          label: 'immunity to fire',
        },
      ],
    })
    const raw = collectPresentableEffects(c)
    expect(raw.some((e) => e.key === 'defense-condition-poisoned')).toBe(true)
    expect(raw.some((e) => e.key.includes('fire') && e.key.startsWith('defense-damage-'))).toBe(true)

    const enriched = enrichPresentableEffects(raw)
    const defenseRows = enriched.filter((e) => e.key.startsWith('defense-'))
    expect(defenseRows.length).toBe(2)
    expect(defenseRows.every((e) => e.presentation.defaultSection === 'ongoing-effects')).toBe(true)
    expect(defenseRows.every((e) => e.presentation.tone === 'info')).toBe(true)
    const fireRow = defenseRows.find((e) => e.key.includes('fire'))
    expect(fireRow?.label).toBe('Immune: Fire')
  })
})
