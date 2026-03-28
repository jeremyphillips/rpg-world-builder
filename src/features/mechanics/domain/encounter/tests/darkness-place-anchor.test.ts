import { describe, expect, it } from 'vitest'

import type { Spell } from '@/features/content/spells/domain/types/spell.types'
import { createSquareGridSpace } from '@/features/encounter/space/createSquareGridSpace'
import { buildSpellCombatActions } from '@/features/encounter/helpers/spell-combat-adapter'
import { classifySpellResolutionMode } from '@/features/encounter/helpers/spell-resolution-classifier'
import { SPELLS_LEVEL_2_A_F } from '@/features/mechanics/domain/rulesets/system/spells/data/level2-a-f'
import { resolveCombatAction } from '../resolution'
import { createEncounterState } from '../state'
import { resolveBattlefieldEffectOriginCellId } from '../state/battlefield-effect-anchor'
import {
  getActionResolutionRequirements,
  isAreaGridCombatAction,
} from '../resolution/action/action-resolution-requirements'

import { createCombatant } from './action-resolution.test-helpers'

describe('Darkness — place-anchored emanation (shared anchor pipeline)', () => {
  const darkness = SPELLS_LEVEL_2_A_F.find((s) => s.id === 'darkness') as Spell

  const baseAdapterArgs = {
    runtimeId: 'wiz',
    spellSaveDc: 14,
    spellAttackBonus: 5,
    casterLevel: 5,
  }

  it('classifies authored Darkness as effects mode (emanation drives adapter, not log-only)', () => {
    expect(classifySpellResolutionMode(darkness)).toBe('effects')
  })

  it('buildSpellCombatActions maps place-or-object emanation + remote AoE template', () => {
    const [action] = buildSpellCombatActions({
      ...baseAdapterArgs,
      spellIds: ['darkness'],
      spellsById: { darkness },
    })

    expect(action?.resolutionMode).toBe('effects')
    expect(action?.attachedEmanation).toEqual({
      source: { kind: 'spell', spellId: 'darkness' },
      radiusFt: 15,
      selectUnaffectedAtCast: false,
      anchorMode: 'place-or-object',
      anchorChoiceFieldId: 'darkness-anchor',
    })
    expect(action?.areaTemplate).toEqual({ kind: 'sphere', radiusFt: 15 })
    expect(action?.areaPlacement).toBe('remote')
    expect(action?.targeting).toEqual({ kind: 'self', rangeFt: 60 })
  })

  it('readiness metadata lists caster, area, and object-anchor gates for place-or-object', () => {
    const [action] = buildSpellCombatActions({
      ...baseAdapterArgs,
      spellIds: ['darkness'],
      spellsById: { darkness },
    })
    expect(action).toBeDefined()
    expect(isAreaGridCombatAction(action)).toBe(true)
    expect(isAreaGridCombatAction(action, { 'darkness-anchor': 'object' })).toBe(false)
    expect(getActionResolutionRequirements(action!)).toEqual([
      'caster-option',
      'area-selection',
      'object-anchor',
    ])
  })

  it('resolveCombatAction creates a place-anchored attached aura and resolves origin from anchor', () => {
    const [spellAction] = buildSpellCombatActions({
      ...baseAdapterArgs,
      spellIds: ['darkness'],
      spellsById: { darkness },
    })

    const space = createSquareGridSpace({ id: 'test-map', name: 'Test', columns: 8, rows: 8 })
    const originCellId = 'c-3-4'

    const state = createEncounterState(
      [
        createCombatant({
          instanceId: 'wiz',
          label: 'Wizard',
          side: 'party',
          initiativeModifier: 2,
          dexterityScore: 14,
          armorClass: 12,
          actions: spellAction ? [spellAction] : [],
        }),
      ],
      { space, rng: () => 0.5 },
    )

    const resolved = resolveCombatAction(
      state,
      {
        actorId: 'wiz',
        actionId: spellAction!.id,
        aoeOriginCellId: originCellId,
      },
      { rng: () => 0.5 },
    )

    const aura = resolved.attachedAuraInstances?.find((a) => a.source.kind === 'spell' && a.source.spellId === 'darkness')
    expect(aura).toBeDefined()
    expect(aura!.anchor).toEqual({ kind: 'place', cellId: originCellId })
    expect(aura!.area).toEqual({ kind: 'sphere', size: 15 })

    expect(
      resolveBattlefieldEffectOriginCellId(resolved.space, resolved.placements, aura!.anchor),
    ).toBe(originCellId)
  })
})
