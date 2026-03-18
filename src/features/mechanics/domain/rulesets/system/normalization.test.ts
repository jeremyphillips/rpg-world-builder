import { describe, expect, it } from 'vitest'
import { getSystemClass } from './classes'
import { getSystemMonster, getSystemMonsters } from './monsters'
import { DEFAULT_SYSTEM_RULESET_ID } from '../ids/systemIds'
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

function visitUnknown(
  value: unknown,
  visitor: (node: unknown) => void,
): void {
  visitor(value)

  if (Array.isArray(value)) {
    for (const entry of value) visitUnknown(entry, visitor)
    return
  }

  if (value && typeof value === 'object') {
    for (const entry of Object.values(value)) {
      visitUnknown(entry, visitor)
    }
  }
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
    expect(nestedTrigger?.trigger).toBe('weapon-hit')
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
          kind: 'until-turn-boundary',
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
        kind: 'until-turn-boundary',
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
        kind: 'roll-modifier',
        appliesTo: 'attack-rolls',
        modifier: 'advantage',
      },
    ])
  })

  it('migrates monster triggered bonus actions into canonical trigger effects', () => {
    const gnoll = getSystemMonster(DEFAULT_SYSTEM_RULESET_ID, 'gnoll-warrior')
    const rampage = gnoll?.mechanics.bonusActions?.find(
      (action) => action.kind === 'special' && action.name === 'Rampage',
    ) as
      | {
          trigger?: unknown
          movement?: unknown
          sequence?: unknown
          effects?: unknown[]
        }
      | undefined

    expect(rampage?.trigger).toBeUndefined()
    expect(rampage?.movement).toBeUndefined()
    expect(rampage?.sequence).toBeUndefined()
    expect(rampage?.effects).toEqual([
      {
        kind: 'trigger',
        trigger: 'damage-dealt',
        condition: {
          kind: 'state',
          target: 'target',
          property: 'combat.bloodied',
          equals: true,
        },
        effects: [
          {
            kind: 'move',
            upToSpeedFraction: 0.5,
          },
          {
            kind: 'action',
            action: 'Rend',
          },
        ],
      },
    ])
  })

  it('uses shared turn-boundary durations for monster suppression windows', () => {
    const troll = getSystemMonster(DEFAULT_SYSTEM_RULESET_ID, 'troll')
    const regeneration = troll?.mechanics.traits?.find((trait) => trait.name === 'Regeneration')

    expect(regeneration?.effects).toEqual([
      { kind: 'hit-points', mode: 'heal', value: 15 },
    ])

    expect(regeneration?.suppression?.duration).toEqual({
      kind: 'until-turn-boundary',
      subject: 'self',
      turn: 'next',
      boundary: 'end',
    })
  })

  it('migrates zombie save traits into canonical effect arrays', () => {
    const zombie = getSystemMonster(DEFAULT_SYSTEM_RULESET_ID, 'zombie')
    const undeadFortitude = zombie?.mechanics.traits?.find(
      (trait) => trait.name === 'Undead Fortitude',
    ) as { save?: unknown; effects?: unknown[] } | undefined

    expect(undeadFortitude?.save).toBeUndefined()
    expect(undeadFortitude?.effects).toEqual([
      {
        kind: 'custom',
        id: 'monster.save_exception',
        params: {
          damageTypes: ['radiant'],
          criticalHit: true,
        },
      },
      {
        kind: 'save',
        save: {
          ability: 'con',
          dc: { kind: '5-plus-damage-taken' },
        },
        onFail: [],
        onSuccess: [{ kind: 'note', text: 'Drops to 1 Hit Point instead.' }],
      },
    ])
  })

  it('migrates gelatinous cube trait rules into canonical effect arrays', () => {
    const cube = getSystemMonster(DEFAULT_SYSTEM_RULESET_ID, 'gelatinous-cube')
    const oozeCube = cube?.mechanics.traits?.find((trait) => trait.name === 'Ooze Cube') as
      | {
          containment?: unknown
          visibility?: unknown
          modifiesAction?: unknown
          checks?: unknown
          effects?: unknown[]
        }
      | undefined
    const transparent = cube?.mechanics.traits?.find((trait) => trait.name === 'Transparent') as
      | { visibility?: unknown; effects?: unknown[] }
      | undefined

    expect(oozeCube?.containment).toBeUndefined()
    expect(oozeCube?.visibility).toBeUndefined()
    expect(oozeCube?.modifiesAction).toBeUndefined()
    expect(oozeCube?.checks).toBeUndefined()
    expect(oozeCube?.effects).toEqual([
      {
        kind: 'containment',
        fillsEntireSpace: true,
        canContainCreatures: true,
        creatureCover: 'total-cover',
        capacity: {
          large: 1,
          mediumOrSmall: 4,
        },
      },
      {
        kind: 'visibility-rule',
        transparent: true,
      },
      {
        kind: 'custom',
        id: 'monster.action_modifier',
        params: {
          actionName: 'Engulf',
          trigger: {
            kind: 'enters_space',
          },
          saveModifier: 'disadvantage',
        },
      },
      {
        kind: 'check',
        name: 'Pull From Cube',
        actor: 'nearby-creature',
        distanceFeet: 5,
        actionRequired: true,
        target: 'creature-inside',
        check: {
          ability: 'str',
          skill: 'athletics',
          dc: 12,
        },
        onSuccess: [{ kind: 'damage', damage: '3d6', damageType: 'acid' }],
      },
      {
        kind: 'check',
        name: 'Pull Object From Cube',
        actor: 'nearby-creature',
        distanceFeet: 5,
        actionRequired: true,
        target: 'object-inside',
        check: {
          ability: 'str',
          skill: 'athletics',
          dc: 12,
        },
        onSuccess: [{ kind: 'damage', damage: '3d6', damageType: 'acid' }],
      },
    ])

    expect(transparent?.visibility).toBeUndefined()
    expect(transparent?.effects).toEqual([
      {
        kind: 'visibility-rule',
        transparent: true,
        noticeCheck: {
          ability: 'wis',
          skill: 'perception',
          dc: 15,
          unlessWitnessedMoveOrAction: true,
        },
      },
    ])
  })

  it('migrates troll limb rules into tracked part and custom effects', () => {
    const troll = getSystemMonster(DEFAULT_SYSTEM_RULESET_ID, 'troll')
    const loathsomeLimbs = troll?.mechanics.traits?.find((trait) => trait.name === 'Loathsome Limbs')

    expect(loathsomeLimbs?.effects).toEqual([
      {
        kind: 'tracked-part',
        part: 'limb',
        change: {
          mode: 'sever',
          count: 1,
        },
      },
      {
        kind: 'spawn',
        creature: 'Troll Limb',
        count: 1,
        location: 'self-space',
        actsWhen: 'immediately-after-source-turn',
      },
      {
        kind: 'custom',
        id: 'monster.resource_from_tracked_parts',
        params: {
          resource: 'exhaustion',
          mode: 'set',
          value: 'per-missing-limb',
          part: 'limb',
        },
      },
    ])
  })

  it('uses canonical effect kinds for monster trait meta rules', () => {
    const hydra = getSystemMonster(DEFAULT_SYSTEM_RULESET_ID, 'hydra')
    const holdBreath = hydra?.mechanics.traits?.find((trait) => trait.name === 'Hold Breath')
    const multipleHeads = hydra?.mechanics.traits?.find((trait) => trait.name === 'Multiple Heads')
    const reactiveHeads = hydra?.mechanics.traits?.find((trait) => trait.name === 'Reactive Heads')

    expect(holdBreath?.effects).toEqual([
      {
        kind: 'hold-breath',
        duration: {
          kind: 'fixed',
          value: 1,
          unit: 'hour',
        },
      },
    ])

    expect(multipleHeads?.effects).toEqual([
      {
        kind: 'tracked-part',
        part: 'head',
        initialCount: 5,
        loss: {
          trigger: 'damage-taken-in-single-turn',
          minDamage: 25,
          count: 1,
        },
        deathWhenCountReaches: 0,
        regrowth: {
          trigger: 'turn-end',
          requiresLivingPart: true,
          countPerPartLostSinceLastTurn: 2,
          suppressedByDamageTypes: ['fire'],
          healHitPoints: 20,
        },
      },
    ])

    expect(reactiveHeads?.effects).toEqual([
      {
        kind: 'extra-reaction',
        appliesTo: 'opportunity-attacks-only',
        count: {
          kind: 'per-part-beyond',
          part: 'head',
          baseline: 1,
        },
      },
    ])
  })

  it('forbids reintroducing legacy monster effect wrapper shapes', () => {
    const monsters = getSystemMonsters(DEFAULT_SYSTEM_RULESET_ID)

    for (const monster of monsters) {
      for (const trait of monster.mechanics.traits ?? []) {
        expect(trait).not.toHaveProperty('save')
        expect(trait).not.toHaveProperty('modifiesAction')
        expect(trait).not.toHaveProperty('checks')
        expect(trait).not.toHaveProperty('containment')
        expect(trait).not.toHaveProperty('visibility')
      }

      for (const action of [
        ...(monster.mechanics.actions ?? []),
        ...(monster.mechanics.bonusActions ?? []),
      ]) {
        if (action.kind === 'special') {
          expect(action).not.toHaveProperty('trigger')
        }
      }

      visitUnknown(monster.mechanics, (node) => {
        if (!node || typeof node !== 'object') return

        const candidate = node as Record<string, unknown>

        expect(candidate.kind).not.toBe('limb')

        if (candidate.kind === 'resource') {
          expect(candidate.value).not.toBe('per-missing-limb')
        }
      })
    }
  })
})
