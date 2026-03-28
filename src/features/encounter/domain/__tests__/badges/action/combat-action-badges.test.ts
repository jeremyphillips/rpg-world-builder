import { describe, expect, it } from 'vitest'

import type { CombatActionDefinition } from '@/features/mechanics/domain/encounter/resolution/combat-action.types'
import type { ActionBadgeDescriptor } from '../../../badges/action/combat-action-badges.types'
import { deriveCombatActionBadges } from '../../../badges/action/combat-action-badges'

function minimalAction(overrides: Partial<CombatActionDefinition> = {}): CombatActionDefinition {
  return {
    id: 'test-action',
    label: 'Test Action',
    kind: 'weapon-attack',
    cost: { action: true },
    resolutionMode: 'log-only',
    ...overrides,
  }
}

function badgeKinds(badges: ActionBadgeDescriptor[]): string[] {
  return badges.map((b) => b.kind)
}

function findBadge(badges: ActionBadgeDescriptor[], kind: string): ActionBadgeDescriptor | undefined {
  return badges.find((b) => b.kind === kind)
}

describe('deriveCombatActionBadges', () => {
  describe('weapon-attack actions', () => {
    it('derives to-hit, damage, and range badges from attack profile + weapon displayMeta', () => {
      const badges = deriveCombatActionBadges(
        minimalAction({
          kind: 'weapon-attack',
          resolutionMode: 'attack-roll',
          attackProfile: { attackBonus: 5, damage: '1d8+3', damageType: 'slashing' },
          displayMeta: { source: 'weapon', range: '60/120ft' },
        }),
      )
      expect(badgeKinds(badges)).toEqual(['to-hit', 'damage', 'range'])
      expect(findBadge(badges, 'to-hit')!.label).toBe('+5 to hit')
      expect(findBadge(badges, 'damage')!.label).toBe('1d8+3 slashing')
      expect(findBadge(badges, 'range')!.label).toBe('60/120ft')
    })

    it('handles negative attack bonus', () => {
      const badges = deriveCombatActionBadges(
        minimalAction({
          attackProfile: { attackBonus: -1, damage: '1d4', damageType: 'bludgeoning' },
        }),
      )
      expect(findBadge(badges, 'to-hit')!.label).toBe('-1 to hit')
    })

    it('shows damage without type when damageType is absent', () => {
      const badges = deriveCombatActionBadges(
        minimalAction({
          attackProfile: { attackBonus: 3, damage: '2d6' },
        }),
      )
      expect(findBadge(badges, 'damage')!.label).toBe('2d6')
    })

    it('omits range badge when weapon displayMeta has no range', () => {
      const badges = deriveCombatActionBadges(
        minimalAction({
          attackProfile: { attackBonus: 4 },
          displayMeta: { source: 'weapon' },
        }),
      )
      expect(badgeKinds(badges)).not.toContain('range')
    })
  })

  describe('monster-action (natural) actions', () => {
    it('derives to-hit, damage, and range from natural displayMeta', () => {
      const badges = deriveCombatActionBadges(
        minimalAction({
          kind: 'monster-action',
          resolutionMode: 'attack-roll',
          attackProfile: { attackBonus: 7, damage: '2d6+4', damageType: 'piercing' },
          displayMeta: { source: 'natural', attackType: 'melee', reach: 10 },
        }),
      )
      expect(badgeKinds(badges)).toEqual(['to-hit', 'damage', 'range'])
      expect(findBadge(badges, 'to-hit')!.label).toBe('+7 to hit')
      expect(findBadge(badges, 'damage')!.label).toBe('2d6+4 piercing')
      expect(findBadge(badges, 'range')!.label).toBe('10ft')
    })

    it('formats to-hit consistently with weapon actions (not "To hit: +X")', () => {
      const badges = deriveCombatActionBadges(
        minimalAction({
          kind: 'monster-action',
          attackProfile: { attackBonus: 4 },
          displayMeta: { source: 'natural', attackType: 'melee', reach: 5 },
        }),
      )
      expect(findBadge(badges, 'to-hit')!.label).toBe('+4 to hit')
    })

    it('includes sequence badges for multiattack actions', () => {
      const badges = deriveCombatActionBadges(
        minimalAction({
          kind: 'monster-action',
          resolutionMode: 'log-only',
          sequence: [
            { actionLabel: 'Claw', count: 2 },
            { actionLabel: 'Bite', count: 1 },
          ],
        }),
      )
      const seqBadges = badges.filter((b) => b.kind === 'sequence')
      expect(seqBadges).toHaveLength(2)
      expect(seqBadges[0].label).toBe('Claw x2')
      expect(seqBadges[1].label).toBe('Bite x1')
    })

    it('includes recharge badge with neutral tone when ready', () => {
      const badges = deriveCombatActionBadges(
        minimalAction({
          kind: 'monster-action',
          usage: { recharge: { min: 5, max: 6, ready: true } },
        }),
      )
      const rch = findBadge(badges, 'recharge')!
      expect(rch.label).toBe('Rch 5\u20136')
      expect(rch.tone).toBe('neutral')
    })

    it('shows warning tone on recharge badge when not ready', () => {
      const badges = deriveCombatActionBadges(
        minimalAction({
          kind: 'monster-action',
          usage: { recharge: { min: 5, max: 6, ready: false } },
        }),
      )
      expect(findBadge(badges, 'recharge')!.tone).toBe('warning')
    })
  })

  describe('spell actions', () => {
    it('derives to-hit, damage, range, and concentration for attack spells', () => {
      const badges = deriveCombatActionBadges(
        minimalAction({
          kind: 'spell',
          resolutionMode: 'attack-roll',
          attackProfile: { attackBonus: 8, damage: '4d6', damageType: 'fire' },
          displayMeta: {
            source: 'spell',
            spellId: 'fireball',
            level: 3,
            concentration: false,
            range: '150ft',
          },
        }),
      )
      expect(badgeKinds(badges)).toEqual(['to-hit', 'damage', 'range'])
      expect(findBadge(badges, 'range')!.label).toBe('150ft')
      expect(findBadge(badges, 'concentration')).toBeUndefined()
    })

    it('includes concentration badge when spell requires concentration', () => {
      const badges = deriveCombatActionBadges(
        minimalAction({
          kind: 'spell',
          resolutionMode: 'effects',
          displayMeta: {
            source: 'spell',
            spellId: 'hex',
            level: 1,
            concentration: true,
            range: '90ft',
          },
        }),
      )
      expect(badgeKinds(badges)).toContain('concentration')
      expect(findBadge(badges, 'concentration')!.label).toBe('conc.')
    })

    it('derives save-dc for saving-throw spells', () => {
      const badges = deriveCombatActionBadges(
        minimalAction({
          kind: 'spell',
          resolutionMode: 'saving-throw',
          saveProfile: { ability: 'dex', dc: 15 },
          damage: '8d6',
          damageType: 'fire',
          displayMeta: {
            source: 'spell',
            spellId: 'fireball-actual',
            level: 3,
            concentration: false,
            range: '150ft',
          },
        }),
      )
      expect(badgeKinds(badges)).toContain('save-dc')
      expect(findBadge(badges, 'save-dc')!.label).toBe('DEX DC 15')
      expect(findBadge(badges, 'damage')!.label).toBe('8d6 fire')
    })

    it('includes uses badge for leveled spells', () => {
      const badges = deriveCombatActionBadges(
        minimalAction({
          kind: 'spell',
          resolutionMode: 'effects',
          usage: { uses: { max: 1, remaining: 1, period: 'day' } },
          displayMeta: {
            source: 'spell',
            spellId: 'shield',
            level: 1,
            concentration: false,
            range: 'Self',
          },
        }),
      )
      const uses = findBadge(badges, 'uses')!
      expect(uses.label).toBe('1/1')
      expect(uses.tone).toBe('neutral')
    })

    it('shows warning tone on uses badge when exhausted', () => {
      const badges = deriveCombatActionBadges(
        minimalAction({
          kind: 'spell',
          resolutionMode: 'effects',
          usage: { uses: { max: 1, remaining: 0, period: 'day' } },
          displayMeta: {
            source: 'spell',
            spellId: 'shield',
            level: 1,
            concentration: false,
            range: 'Self',
          },
        }),
      )
      expect(findBadge(badges, 'uses')!.tone).toBe('warning')
    })

    it('includes sequence badges for multi-beam spells', () => {
      const badges = deriveCombatActionBadges(
        minimalAction({
          kind: 'spell',
          resolutionMode: 'attack-roll',
          attackProfile: { attackBonus: 7, damage: '1d10', damageType: 'force' },
          sequence: [{ actionLabel: 'Eldritch Blast Beam', count: 3 }],
          displayMeta: {
            source: 'spell',
            spellId: 'eldritch-blast',
            level: 0,
            concentration: false,
            range: '120ft',
          },
        }),
      )
      const seq = findBadge(badges, 'sequence')!
      expect(seq.label).toBe('Eldritch Blast Beam x3')
    })
  })

  describe('generic / combat-effect actions', () => {
    it('handles action with only save profile and top-level damage', () => {
      const badges = deriveCombatActionBadges(
        minimalAction({
          kind: 'combat-effect',
          resolutionMode: 'saving-throw',
          saveProfile: { ability: 'con', dc: 12 },
          damage: '3d8',
          damageType: 'poison',
        }),
      )
      expect(badgeKinds(badges)).toEqual(['save-dc', 'damage'])
      expect(findBadge(badges, 'save-dc')!.label).toBe('CON DC 12')
      expect(findBadge(badges, 'damage')!.label).toBe('3d8 poison')
    })

    it('returns empty array when action has no displayable badge data', () => {
      const badges = deriveCombatActionBadges(
        minimalAction({
          kind: 'combat-effect',
          resolutionMode: 'effects',
        }),
      )
      expect(badges).toEqual([])
    })

    it('handles missing displayMeta gracefully', () => {
      const badges = deriveCombatActionBadges(
        minimalAction({
          attackProfile: { attackBonus: 3, damage: '1d6' },
        }),
      )
      expect(badgeKinds(badges)).toEqual(['to-hit', 'damage'])
    })

    it('falls back to targeting.rangeFt when displayMeta has no range', () => {
      const badges = deriveCombatActionBadges(
        minimalAction({
          kind: 'combat-effect',
          resolutionMode: 'effects',
          targeting: { kind: 'single-target', rangeFt: 30 },
        }),
      )
      expect(findBadge(badges, 'range')!.label).toBe('30ft')
    })
  })

  describe('ordering', () => {
    it('returns badges sorted by priority (lower = first)', () => {
      const badges = deriveCombatActionBadges(
        minimalAction({
          kind: 'spell',
          resolutionMode: 'attack-roll',
          attackProfile: { attackBonus: 5, damage: '3d6', damageType: 'fire' },
          saveProfile: { ability: 'dex', dc: 14 },
          usage: { uses: { max: 1, remaining: 1, period: 'day' } },
          displayMeta: {
            source: 'spell',
            spellId: 'test',
            level: 3,
            concentration: true,
            range: '60ft',
          },
        }),
      )
      const priorities = badges.map((b) => b.priority)
      expect(priorities).toEqual([...priorities].sort((a, b) => a - b))
    })
  })

  describe('damage-type standalone fallback', () => {
    it('shows standalone damage-type when only type is known (no damage value)', () => {
      const badges = deriveCombatActionBadges(
        minimalAction({
          kind: 'monster-action',
          resolutionMode: 'log-only',
          damageType: 'fire',
        }),
      )
      expect(findBadge(badges, 'damage')!.label).toBe('fire')
    })
  })
})
