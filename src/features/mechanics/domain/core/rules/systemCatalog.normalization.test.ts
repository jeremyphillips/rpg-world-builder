import { describe, expect, it } from 'vitest'
import { getSystemClass } from './systemCatalog.classes'
import { getSystemMonster } from './systemCatalog.monsters'
import { DEFAULT_SYSTEM_RULESET_ID } from './systemIds'
import type { SubclassFeature } from '@/features/content/classes/domain/types'

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

  it('uses canonical activation wrappers for active class buffs', () => {
    const feature = getSubclassFeature(
      'paladin',
      'paladin.subclass.sacred_oath.oath_of_devotion',
      'paladin.subclass.sacred_oath.oath_of_devotion.sacred_weapon',
    ) as { kind?: unknown; activation?: unknown; cost?: unknown; effects?: unknown[] } | undefined

    expect(feature).toMatchObject({
      kind: 'activation',
      activation: 'action',
      cost: { resource: 'channel_divinity', amount: 1 },
    })

    expect(feature?.effects).toEqual([
      {
        kind: 'modifier',
        target: 'attack_roll',
        mode: 'add',
        value: { ability: 'charisma' },
        duration: {
          kind: 'fixed',
          value: 1,
          unit: 'minute',
        },
      },
    ])
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

  it('uses canonical save effects for class riders', () => {
    const feature = getSubclassFeature(
      'fighter',
      'fighter.martial_archetype.battle_master',
      'fighter.martial_archetype.battle_master.combat_superiority',
    )

    const nestedTrigger = hasNestedFeatures(feature) ? feature.features[1] : undefined
    const nestedSave = (nestedTrigger as { effects?: unknown[] } | undefined)?.effects?.[1] as
      | { kind?: unknown; save?: unknown; onFail?: unknown[] }
      | undefined

    expect(nestedSave).toEqual({
      kind: 'save',
      save: { ability: 'strength' },
      onFail: [{ kind: 'condition', conditionId: 'prone' }],
    })
  })

  it('uses shared turn-boundary durations for monster save riders', () => {
    const mummy = getSystemMonster(DEFAULT_SYSTEM_RULESET_ID, 'mummy')
    const glare = mummy?.mechanics.actions?.find(
      (action) => action.kind === 'special' && action.name === 'Dreadful Glare',
    ) as
      | { onFail?: unknown[]; effects?: unknown[]; onSuccess?: unknown[] }
      | undefined

    expect(glare?.onFail).toEqual([
      {
        kind: 'condition',
        conditionId: 'frightened',
        duration: {
          kind: 'until_turn_boundary',
          subject: 'source',
          turn: 'next',
          boundary: 'end',
        },
      },
    ])

    expect(glare?.effects).toEqual([
      {
        kind: 'targeting',
        target: 'one-creature',
        targetType: 'creature',
        rangeFeet: 60,
        requiresSight: true,
      },
    ])

    expect(glare?.onSuccess).toEqual([
      {
        kind: 'immunity',
        scope: 'source-action',
        duration: {
          kind: 'fixed',
          value: 24,
          unit: 'hour',
        },
        notes: "Target is immune to this mummy's Dreadful Glare.",
      },
    ])

    expect(glare?.onFail?.[0]).toMatchObject({
      duration: {
        kind: 'until_turn_boundary',
        subject: 'source',
        turn: 'next',
        boundary: 'end',
      },
    })
  })

  it('uses canonical monster save outcomes and condition ids', () => {
    const wolf = getSystemMonster(DEFAULT_SYSTEM_RULESET_ID, 'wolf')
    const bite = wolf?.mechanics.actions?.find(
      (action) => action.kind === 'natural' && action.name === 'Bite',
    )

    const rider = (bite as { onHitEffects?: unknown[] } | undefined)?.onHitEffects?.[0]

    expect(rider).toEqual({
      kind: 'save',
      save: { ability: 'str', dc: 11 },
      onFail: [{ kind: 'condition', conditionId: 'prone' }],
    })
  })

  it('uses canonical shared effect kinds for monster traits', () => {
    const kobold = getSystemMonster(DEFAULT_SYSTEM_RULESET_ID, 'kobold-warrior')
    const packTactics = kobold?.mechanics.traits?.find((trait) => trait.name === 'Pack Tactics')

    expect(packTactics?.effects).toEqual([
      {
        kind: 'roll_modifier',
        appliesTo: 'attack-rolls',
        modifier: 'advantage',
      },
    ])
  })

  it('uses shared turn-boundary durations for monster suppression windows', () => {
    const troll = getSystemMonster(DEFAULT_SYSTEM_RULESET_ID, 'troll')
    const regeneration = troll?.mechanics.traits?.find((trait) => trait.name === 'Regeneration')

    expect(regeneration?.effects).toEqual([
      { kind: 'hit_points', mode: 'heal', value: 15 },
    ])

    expect(regeneration?.suppression?.duration).toEqual({
      kind: 'until_turn_boundary',
      subject: 'self',
      turn: 'next',
      boundary: 'end',
    })
  })

  it('uses canonical effect kinds for monster trait meta rules', () => {
    const hydra = getSystemMonster(DEFAULT_SYSTEM_RULESET_ID, 'hydra')
    const holdBreath = hydra?.mechanics.traits?.find((trait) => trait.name === 'Hold Breath')
    const multipleHeads = hydra?.mechanics.traits?.find((trait) => trait.name === 'Multiple Heads')
    const reactiveHeads = hydra?.mechanics.traits?.find((trait) => trait.name === 'Reactive Heads')

    expect(holdBreath?.effects).toEqual([
      {
        kind: 'hold_breath',
        duration: {
          kind: 'fixed',
          value: 1,
          unit: 'hour',
        },
      },
    ])

    expect(multipleHeads?.effects).toEqual([
      {
        kind: 'tracked_part',
        part: 'head',
        initialCount: 5,
        loss: {
          trigger: 'damage_taken_in_single_turn',
          minDamage: 25,
          count: 1,
        },
        deathWhenCountReaches: 0,
        regrowth: {
          trigger: 'turn_end',
          requiresLivingPart: true,
          countPerPartLostSinceLastTurn: 2,
          suppressedByDamageTypes: ['fire'],
          healHitPoints: 20,
        },
      },
    ])

    expect(reactiveHeads?.effects).toEqual([
      {
        kind: 'extra_reaction',
        appliesTo: 'opportunity-attacks-only',
        count: {
          kind: 'per-part-beyond',
          part: 'head',
          baseline: 1,
        },
      },
    ])
  })
})
