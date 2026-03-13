import { describe, expect, it } from 'vitest'
import { getSystemClass } from './systemCatalog.classes'
import { getSystemMonster } from './systemCatalog.monsters'
import { DEFAULT_SYSTEM_RULESET_ID } from './systemIds'
import type { SubclassFeature } from '@/features/content/classes/domain/types'
import type { MonsterActionRule, MonsterSpecialAction } from '@/features/content/monsters/domain/types'

function getSubclassFeature(
  classId: string,
  subclassId: string,
  featureId: string,
): SubclassFeature | undefined {
  const cls = getSystemClass(DEFAULT_SYSTEM_RULESET_ID, classId)
  const subclass = cls?.definitions?.options.find((option) => option.id === subclassId)
  return subclass?.features?.find((feature) => feature.id === featureId)
}

function hasNestedFeatures(
  feature: SubclassFeature | undefined,
): feature is SubclassFeature & { features: SubclassFeature[] } {
  return Array.isArray((feature as { features?: unknown } | undefined)?.features)
}

function isSpecialActionWithRules(
  action: unknown,
): action is MonsterSpecialAction & { rules: MonsterActionRule[] } {
  return (
    action != null &&
    typeof action === 'object' &&
    'kind' in action &&
    action.kind === 'special' &&
    Array.isArray((action as { rules?: unknown }).rules)
  )
}

describe('system catalog normalization', () => {
  it('uses canonical trigger ids for class features', () => {
    const feature = getSubclassFeature(
      'fighter',
      'fighter.martial_archetype.battle_master',
      'fighter.martial_archetype.battle_master.combat_superiority',
    )

    const nestedTrigger = (hasNestedFeatures(feature) ? feature.features[1] : undefined) as
      | { kind: 'trigger'; trigger: string }
      | undefined

    expect(nestedTrigger?.kind).toBe('trigger')
    expect(nestedTrigger?.trigger).toBe('weapon_hit')
  })

  it('uses structured duration objects for active class buffs', () => {
    const feature = getSubclassFeature(
      'paladin',
      'paladin.subclass.sacred_oath.oath_of_devotion',
      'paladin.subclass.sacred_oath.oath_of_devotion.sacred_weapon',
    ) as { duration?: unknown } | undefined

    expect(feature?.duration).toEqual({
      kind: 'fixed',
      value: 1,
      unit: 'minute',
    })
  })

  it('uses canonical state conditions for unarmored formulas', () => {
    const feature = getSubclassFeature(
      'sorcerer',
      'sorcerer.sorcerer_origin.draconic_bloodline',
      'sorcerer.sorcerer_origin.draconic_bloodline.draconic_ancestry',
    ) as { condition?: unknown } | undefined

    expect(feature?.condition).toEqual({
      kind: 'state',
      target: 'self',
      property: 'equipment.armorEquipped',
      equals: null,
    })
  })

  it('uses shared turn-boundary durations for monster save riders', () => {
    const mummy = getSystemMonster(DEFAULT_SYSTEM_RULESET_ID, 'mummy')
    const glare = mummy?.mechanics.actions?.find(
      (action) => action.kind === 'special' && action.name === 'Dreadful Glare',
    )

    const durationRule = isSpecialActionWithRules(glare)
      ? glare.rules.find((rule: MonsterActionRule) => rule.kind === 'duration')
      : undefined

    expect(durationRule).toMatchObject({
      kind: 'duration',
      trigger: 'failed_save',
      duration: {
        kind: 'until_turn_boundary',
        subject: 'source',
        turn: 'next',
        boundary: 'end',
      },
    })
  })

  it('uses shared turn-boundary durations for monster suppression windows', () => {
    const troll = getSystemMonster(DEFAULT_SYSTEM_RULESET_ID, 'troll')
    const regeneration = troll?.mechanics.traits?.find((trait) => trait.name === 'Regeneration')

    expect(regeneration?.suppression?.duration).toEqual({
      kind: 'until_turn_boundary',
      subject: 'self',
      turn: 'next',
      boundary: 'end',
    })
  })
})
