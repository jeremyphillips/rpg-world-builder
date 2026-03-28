import { describe, expect, it } from 'vitest'

import type { SkillProficiency } from '@/features/content/skillProficiencies/domain/types'
import { deriveActionPresentation } from '@/features/encounter/domain/actions/action-presentation'
import { getSystemSkillProficiency } from '@/features/mechanics/domain/rulesets/system/skillProficiencies'
import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/rulesets/ids/systemIds'

import { buildCombatActionForSkillAffordance, buildSkillAffordanceCombatActions } from './skill-affordance-combat-actions'

describe('buildSkillAffordanceCombatActions', () => {
  const stealthSkill = getSystemSkillProficiency(DEFAULT_SYSTEM_RULESET_ID, 'stealth')!

  it('maps Stealth combatUi hide to a Hide combat action compatible with resolution', () => {
    const hide = buildCombatActionForSkillAffordance('hide')
    expect(hide).toMatchObject({
      id: 'hide',
      label: 'Hide',
      kind: 'combat-effect',
      resolutionMode: 'hide',
      targeting: { kind: 'self' },
      cost: { action: true },
    })
  })

  it('derives utility category and feature source tag for skill-based Hide', () => {
    const hide = buildCombatActionForSkillAffordance('hide')!
    const vm = deriveActionPresentation(hide)
    expect(vm.category).toBe('utility')
    expect(vm.sourceTag).toBe('feature')
  })

  it('includes Hide only when the character is proficient in Stealth', () => {
    const byId: Record<string, SkillProficiency> = { stealth: stealthSkill }
    expect(buildSkillAffordanceCombatActions({ proficientSkillIds: ['stealth'], skillProficienciesById: byId }).map((a) => a.id)).toEqual(['hide'])
    expect(buildSkillAffordanceCombatActions({ proficientSkillIds: ['athletics'], skillProficienciesById: byId })).toEqual([])
    expect(buildSkillAffordanceCombatActions({ proficientSkillIds: [], skillProficienciesById: byId })).toEqual([])
  })

  it('dedupes by action id when multiple skills mapped to the same affordance (future-proof)', () => {
    const byId: Record<string, SkillProficiency> = { stealth: stealthSkill }
    expect(
      buildSkillAffordanceCombatActions({
        proficientSkillIds: ['stealth', 'stealth'],
        skillProficienciesById: byId,
      }).map((a) => a.id),
    ).toEqual(['hide'])
  })
})
