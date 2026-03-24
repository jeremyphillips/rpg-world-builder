import { describe, expect, it } from 'vitest'

import type { CombatActionDefinition } from '@/features/mechanics/domain/encounter/resolution/combat-action.types'
import { deriveActionPresentation } from './action-presentation'

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

describe('deriveActionPresentation', () => {
  describe('displayName', () => {
    it('uses action label for weapon attacks', () => {
      const vm = deriveActionPresentation(minimalAction({ label: 'Longsword' }))
      expect(vm.displayName).toBe('Longsword')
    })

    it('appends spell level for spell actions', () => {
      const vm = deriveActionPresentation(
        minimalAction({
          kind: 'spell',
          label: 'Fireball',
          displayMeta: { source: 'spell', spellId: 'fireball', level: 3, concentration: false, range: '150ft' },
        }),
      )
      expect(vm.displayName).toBe('Fireball \u00B7 Lvl 3')
    })

    it('uses plain label for spells without displayMeta', () => {
      const vm = deriveActionPresentation(minimalAction({ kind: 'spell', label: 'Unknown Spell' }))
      expect(vm.displayName).toBe('Unknown Spell')
    })
  })

  describe('secondLine', () => {
    it('returns spell summary when present', () => {
      const vm = deriveActionPresentation(
        minimalAction({
          kind: 'spell',
          displayMeta: { source: 'spell', spellId: 's1', level: 1, concentration: false, range: '60ft', summary: 'A bolt of fire.' },
        }),
      )
      expect(vm.secondLine).toBe('A bolt of fire.')
    })

    it('returns natural action description when present', () => {
      const vm = deriveActionPresentation(
        minimalAction({
          kind: 'monster-action',
          displayMeta: { source: 'natural', attackType: 'special', description: 'The dragon breathes fire.' },
        }),
      )
      expect(vm.secondLine).toBe('The dragon breathes fire.')
    })

    it('returns undefined for weapon attacks', () => {
      const vm = deriveActionPresentation(
        minimalAction({ displayMeta: { source: 'weapon', range: '60ft' } }),
      )
      expect(vm.secondLine).toBeUndefined()
    })

    it('returns undefined when no displayMeta', () => {
      const vm = deriveActionPresentation(minimalAction())
      expect(vm.secondLine).toBeUndefined()
    })
  })

  describe('category', () => {
    it('categorizes weapon-attack as attack', () => {
      const vm = deriveActionPresentation(
        minimalAction({
          kind: 'weapon-attack',
          resolutionMode: 'attack-roll',
          attackProfile: { attackBonus: 5 },
        }),
      )
      expect(vm.category).toBe('attack')
    })

    it('categorizes monster-action with attack profile as attack', () => {
      const vm = deriveActionPresentation(
        minimalAction({
          kind: 'monster-action',
          resolutionMode: 'attack-roll',
          attackProfile: { attackBonus: 7, damage: '2d6+4', damageType: 'piercing' },
        }),
      )
      expect(vm.category).toBe('attack')
    })

    it('categorizes log-only monster-action without attack/damage as utility', () => {
      const vm = deriveActionPresentation(
        minimalAction({
          kind: 'monster-action',
          resolutionMode: 'log-only',
        }),
      )
      expect(vm.category).toBe('utility')
    })

    it('categorizes offensive spell with attackProfile as attack', () => {
      const vm = deriveActionPresentation(
        minimalAction({
          kind: 'spell',
          resolutionMode: 'attack-roll',
          attackProfile: { attackBonus: 8, damage: '4d6', damageType: 'fire' },
          displayMeta: { source: 'spell', spellId: 'fireball', level: 3, concentration: false, range: '150ft' },
        }),
      )
      expect(vm.category).toBe('attack')
    })

    it('categorizes spell with saveProfile as attack', () => {
      const vm = deriveActionPresentation(
        minimalAction({
          kind: 'spell',
          resolutionMode: 'saving-throw',
          saveProfile: { ability: 'dexterity', dc: 15 },
          displayMeta: { source: 'spell', spellId: 'sacred-flame', level: 0, concentration: false, range: '60ft' },
        }),
      )
      expect(vm.category).toBe('attack')
    })

    it('categorizes spell with hostileApplication as attack', () => {
      const vm = deriveActionPresentation(
        minimalAction({
          kind: 'spell',
          resolutionMode: 'effects',
          hostileApplication: true,
          displayMeta: { source: 'spell', spellId: 'hold-person', level: 2, concentration: true, range: '60ft' },
        }),
      )
      expect(vm.category).toBe('attack')
    })

    it('categorizes non-offensive spell without buff effects as utility', () => {
      const vm = deriveActionPresentation(
        minimalAction({
          kind: 'spell',
          resolutionMode: 'log-only',
          displayMeta: { source: 'spell', spellId: 'mage-hand', level: 0, concentration: false, range: '30ft' },
        }),
      )
      expect(vm.category).toBe('utility')
    })

    it('categorizes healing spell as heal', () => {
      const vm = deriveActionPresentation(
        minimalAction({
          kind: 'spell',
          resolutionMode: 'effects',
          effects: [{ kind: 'hit-points', mode: 'heal', value: '2d8+3' } as any],
          displayMeta: { source: 'spell', spellId: 'cure-wounds', level: 1, concentration: false, range: 'Touch' },
        }),
      )
      expect(vm.category).toBe('heal')
    })

    it('categorizes non-hostile buff spell as buff', () => {
      const vm = deriveActionPresentation(
        minimalAction({
          kind: 'spell',
          resolutionMode: 'effects',
          effects: [{ kind: 'modifier', target: 'ac', value: 5 } as any],
          displayMeta: { source: 'spell', spellId: 'shield-of-faith', level: 1, concentration: true, range: '60ft' },
        }),
      )
      expect(vm.category).toBe('buff')
    })

    it('categorizes combat-effect as utility', () => {
      const vm = deriveActionPresentation(
        minimalAction({ kind: 'combat-effect', resolutionMode: 'effects' }),
      )
      expect(vm.category).toBe('utility')
    })

    it('categorizes multiattack (monster-action with sequence) as attack', () => {
      const vm = deriveActionPresentation(
        minimalAction({
          kind: 'monster-action',
          resolutionMode: 'log-only',
          sequence: [{ actionLabel: 'Rend', count: 3 }],
          displayMeta: { source: 'natural', attackType: 'special', description: 'The dragon makes three Rend attacks.' },
        }),
      )
      expect(vm.category).toBe('attack')
    })

    it('categorizes multiattack with multiple sequence steps as attack', () => {
      const vm = deriveActionPresentation(
        minimalAction({
          kind: 'monster-action',
          resolutionMode: 'log-only',
          sequence: [
            { actionLabel: 'Claw', count: 2 },
            { actionLabel: 'Infernal Sting', count: 1 },
          ],
          displayMeta: { source: 'natural', attackType: 'special' },
        }),
      )
      expect(vm.category).toBe('attack')
    })
  })

  describe('sourceTag', () => {
    it('returns weapon for weapon displayMeta', () => {
      const vm = deriveActionPresentation(
        minimalAction({ displayMeta: { source: 'weapon', range: '5ft' } }),
      )
      expect(vm.sourceTag).toBe('weapon')
    })

    it('returns spell for spell displayMeta', () => {
      const vm = deriveActionPresentation(
        minimalAction({
          kind: 'spell',
          displayMeta: { source: 'spell', spellId: 'fireball', level: 3, concentration: false, range: '150ft' },
        }),
      )
      expect(vm.sourceTag).toBe('spell')
    })

    it('returns natural for natural displayMeta', () => {
      const vm = deriveActionPresentation(
        minimalAction({
          kind: 'monster-action',
          displayMeta: { source: 'natural', attackType: 'bite', reach: 5 },
        }),
      )
      expect(vm.sourceTag).toBe('natural')
    })

    it('returns feature for combat-effect kind', () => {
      const vm = deriveActionPresentation(
        minimalAction({ kind: 'combat-effect', resolutionMode: 'effects' }),
      )
      expect(vm.sourceTag).toBe('feature')
    })

    it('falls back to feature when no displayMeta', () => {
      const vm = deriveActionPresentation(minimalAction())
      expect(vm.sourceTag).toBe('feature')
    })
  })

  describe('footerLink', () => {
    it('provides spellId-based footer link for spell actions', () => {
      const vm = deriveActionPresentation(
        minimalAction({
          kind: 'spell',
          displayMeta: { source: 'spell', spellId: 'fireball', level: 3, concentration: false, range: '150ft' },
        }),
      )
      expect(vm.footerLink).toEqual({ spellId: 'fireball', label: 'View details' })
    })

    it('returns undefined footer link for non-spell actions', () => {
      const vm = deriveActionPresentation(minimalAction({ kind: 'weapon-attack' }))
      expect(vm.footerLink).toBeUndefined()
    })

    it('returns undefined footer link for spell without displayMeta', () => {
      const vm = deriveActionPresentation(minimalAction({ kind: 'spell' }))
      expect(vm.footerLink).toBeUndefined()
    })
  })

  describe('badges', () => {
    it('delegates to deriveCombatActionBadges and includes results', () => {
      const vm = deriveActionPresentation(
        minimalAction({
          attackProfile: { attackBonus: 5, damage: '1d8+3', damageType: 'slashing' },
        }),
      )
      expect(vm.badges.length).toBeGreaterThan(0)
      expect(vm.badges.map((b) => b.kind)).toContain('to-hit')
      expect(vm.badges.map((b) => b.kind)).toContain('damage')
    })
  })

  describe('actionId', () => {
    it('passes through action id', () => {
      const vm = deriveActionPresentation(minimalAction({ id: 'my-action-123' }))
      expect(vm.actionId).toBe('my-action-123')
    })
  })
})
