import { describe, expect, it } from 'vitest'
import type { Spell } from '@/features/content/spells/domain/types/spell.types'
import { getSystemSpells } from '@/features/mechanics/domain/rulesets/system/spells'
import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/rulesets/ids/systemIds'
import {
  buildSpellAuditRow,
  spellHasExplicitSaveDc,
  spellHasTopLevelDamageAndSave,
  spellMissingDeliveryMethodAttackCandidate,
  summarizeSpellAudit,
} from './spell-resolution-audit'

/**
 * Lightweight catalog audit — run with: `pnpm vitest run spell-catalog-audit`
 * Stranded counts are reporting metrics only (not CI gates).
 */
describe('system spell catalog audit', () => {
  it('summarizes stranded and ambiguous-delivery metrics for the default ruleset', () => {
    const spells = getSystemSpells(DEFAULT_SYSTEM_RULESET_ID)
    const summary = summarizeSpellAudit(spells)

    expect(summary.total).toBeGreaterThan(0)
    expect(summary.stranded).toBeGreaterThanOrEqual(0)
    expect(summary.strandedFullSupport).toBeGreaterThanOrEqual(0)
    expect(summary.strandedWithChosenCreatures).toBeGreaterThanOrEqual(0)
    expect(summary.ambiguousDelivery).toBeGreaterThanOrEqual(0)
    expect(summary.explicitSaveDc).toBeGreaterThanOrEqual(0)
    expect(summary.topLevelDamageWithSave).toBeGreaterThanOrEqual(0)
    expect(summary.missingDeliveryMethodAttackCandidate).toBeGreaterThanOrEqual(0)

    // eslint-disable-next-line no-console -- intentional audit output
    console.log('[spell-catalog-audit]', summary)
  })

  it('every catalog spell produces a valid audit row', () => {
    const spells = getSystemSpells(DEFAULT_SYSTEM_RULESET_ID)
    for (const spell of spells) {
      const row = buildSpellAuditRow(spell)
      expect(row.id).toBe(spell.id)
      expect(['none', 'partial', 'full']).toContain(row.mechanicalSupportLevel)
      expect(['attack-roll', 'effects', 'log-only']).toContain(row.adapterMode)
      expect(row.stranded).toBe(row.mechanicalSupportLevel !== 'none' && row.adapterMode === 'log-only')
      expect(row.explicitSaveDc).toBe(spellHasExplicitSaveDc(spell))
      expect(row.topLevelDamageWithSave).toBe(spellHasTopLevelDamageAndSave(spell))
      expect(row.missingDeliveryMethodAttackCandidate).toBe(spellMissingDeliveryMethodAttackCandidate(spell))
    }
  })
})

describe('spell authoring audit helpers', () => {
  function spellWithEffects(effects: Spell['effects']): Spell {
    return {
      id: 'audit-helper',
      name: 'Audit Helper',
      school: 'evocation',
      level: 0,
      classes: ['wizard'],
      castingTime: { normal: { value: 1, unit: 'action' } },
      range: { kind: 'distance', value: { value: 30, unit: 'ft' } },
      duration: { kind: 'instantaneous' },
      components: { verbal: true },
      description: { full: '', summary: '' },
      effects,
    } as Spell
  }

  it('spellHasExplicitSaveDc detects nested save DC', () => {
    const withDc = spellWithEffects([
      {
        kind: 'save',
        save: { ability: 'dex', dc: 15 },
        onFail: [
          {
            kind: 'save',
            save: { ability: 'wis', dc: 12 },
            onFail: [],
          },
        ],
      },
    ])
    expect(spellHasExplicitSaveDc(withDc)).toBe(true)

    const noDc = spellWithEffects([
      { kind: 'save', save: { ability: 'dex' }, onFail: [{ kind: 'damage', damage: '1d6', damageType: 'fire' }] },
    ])
    expect(spellHasExplicitSaveDc(noDc)).toBe(false)
  })

  it('spellHasTopLevelDamageAndSave only considers root effects', () => {
    expect(
      spellHasTopLevelDamageAndSave(
        spellWithEffects([
          { kind: 'damage', damage: '1d8', damageType: 'fire' },
          { kind: 'save', save: { ability: 'dex' }, onFail: [] },
        ]),
      ),
    ).toBe(true)

    expect(
      spellHasTopLevelDamageAndSave(
        spellWithEffects([
          {
            kind: 'save',
            save: { ability: 'dex' },
            onFail: [{ kind: 'damage', damage: '1d8', damageType: 'fire' }],
          },
        ]),
      ),
    ).toBe(false)
  })

  it('spellMissingDeliveryMethodAttackCandidate flags touch damage without save or deliveryMethod', () => {
    const touch = spellWithEffects([
      { kind: 'damage', damage: '1d10', damageType: 'fire' },
    ])
    touch.range = { kind: 'touch' }
    expect(spellMissingDeliveryMethodAttackCandidate(touch)).toBe(true)

    const ranged = spellWithEffects([
      { kind: 'damage', damage: '1d10', damageType: 'fire' },
    ])
    expect(spellMissingDeliveryMethodAttackCandidate(ranged)).toBe(false)
  })
})
