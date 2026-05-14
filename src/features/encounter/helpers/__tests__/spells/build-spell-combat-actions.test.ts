import { describe, expect, it } from 'vitest'

import type { Spell } from '@/features/content/spells/domain/types/spell.types'
import { isHostileAction } from '@/features/mechanics/domain/combat'
import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/rulesets/ids/systemIds'
import { getSystemSpell } from '@/features/mechanics/domain/rulesets/system/spells'
import { buildSpellCombatActions, deriveSpellHostility } from '../../spells'

describe('buildSpellCombatActions', () => {
  const baseArgs = {
    runtimeId: 'pc-1',
    spellSaveDc: 13,
    spellAttackBonus: 5,
    casterLevel: 1,
  }

  function makeSpell(partial: Partial<Spell> & Pick<Spell, 'id' | 'name'>): Spell {
    const { effectGroups, ...rest } = partial
    return {
      school: 'evocation',
      level: 0,
      classes: ['wizard'],
      castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
      range: { kind: 'distance', value: { value: 120, unit: 'ft' } },
      duration: { kind: 'instantaneous' },
      components: { verbal: true, somatic: true },
      description: { full: '', summary: '' },
      ...rest,
      effectGroups: effectGroups ?? [],
    } as Spell
  }

  it('classifies save-based spells as effects resolution mode', () => {
    const spell = makeSpell({
      id: 'sacred-flame',
      name: 'Sacred Flame',
      effectGroups: [
        {
          targeting: { selection: 'one', targetType: 'creature' },
          effects: [
            {
              kind: 'save',
              save: { ability: 'dex' },
              onFail: [{ kind: 'damage', damage: '1d8', damageType: 'radiant' }],
            },
          ],
        },
      ],
    })

    const actions = buildSpellCombatActions({
      ...baseArgs,
      spellIds: ['sacred-flame'],
      spellsById: { 'sacred-flame': spell },
    })

    expect(actions).toHaveLength(1)
    expect(actions[0]!.resolutionMode).toBe('effects')
    expect(actions[0]!.effects).toBeDefined()
    expect(actions[0]!.effects!.some((e) => e.kind === 'save')).toBe(true)
  })

  it('classifies spawn spells as effects with targeting none', () => {
    const spell = makeSpell({
      id: 'find-familiar',
      name: 'Find Familiar',
      range: { kind: 'self' },
      effectGroups: [
        {
          effects: [
            {
              kind: 'spawn',
              creature: 'familiar',
              count: 1,
              location: 'self-space',
              actsWhen: 'immediately-after-source-turn',
            },
            { kind: 'note', text: 'Familiar is CR 0 Beast form.', category: 'under-modeled' },
          ],
        },
      ],
    })

    const actions = buildSpellCombatActions({
      ...baseArgs,
      spellIds: ['find-familiar'],
      spellsById: { 'find-familiar': spell },
    })

    expect(actions).toHaveLength(1)
    expect(actions[0]!.resolutionMode).toBe('effects')
    expect(actions[0]!.targeting?.kind).toBe('none')
    expect(actions[0]!.effects?.some((e) => e.kind === 'spawn')).toBe(true)
  })

  it('copies resolution.casterOptions onto spell combat actions (e.g. Giant Insect)', () => {
    const spell = makeSpell({
      id: 'giant-insect',
      name: 'Giant Insect',
      level: 4,
      range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
      duration: { kind: 'timed', value: 10, unit: 'minute', concentration: true },
      resolution: {
        casterOptions: [
          {
            kind: 'enum',
            id: 'giant-insect-form',
            label: 'Form',
            options: [
              { value: 'centipede', label: 'Giant centipede' },
              { value: 'spider', label: 'Giant spider' },
              { value: 'wasp', label: 'Giant wasp' },
            ],
          },
        ],
      },
      effectGroups: [
        {
          effects: [
            {
              kind: 'spawn',
              count: 1,
              mapMonsterIdFromCasterOption: {
                fieldId: 'giant-insect-form',
                valueToMonsterId: {
                  centipede: 'giant-centipede',
                  spider: 'giant-spider',
                  wasp: 'giant-wasp',
                },
              },
              initiativeMode: 'share-caster',
            },
            { kind: 'note', text: 'Stat block', category: 'flavor' as const },
          ],
        },
      ],
    })

    const actions = buildSpellCombatActions({
      ...baseArgs,
      spellIds: ['giant-insect'],
      spellsById: { 'giant-insect': spell },
    })

    expect(actions).toHaveLength(1)
    expect(actions[0]!.casterOptions?.length).toBe(1)
    expect(actions[0]!.casterOptions?.[0]?.id).toBe('giant-insect-form')
    expect(actions[0]!.targeting?.kind).toBe('none')
  })

  it('system catalog Giant Insect resolves to targeting none (spawn, not single-target)', () => {
    const spell = getSystemSpell(DEFAULT_SYSTEM_RULESET_ID, 'giant-insect')
    expect(spell).toBeDefined()
    const actions = buildSpellCombatActions({
      ...baseArgs,
      spellIds: ['giant-insect'],
      spellsById: { 'giant-insect': spell! },
    })
    expect(actions[0]!.targeting?.kind).toBe('none')
    expect(actions[0]!.effects?.some((e) => e.kind === 'spawn')).toBe(true)
  })

  it('injects spell save DC into save effects that lack a DC', () => {
    const spell = makeSpell({
      id: 'charm-person',
      name: 'Charm Person',
      effectGroups: [
        {
          targeting: { selection: 'one', targetType: 'creature' },
          effects: [
            {
              kind: 'save',
              save: { ability: 'wis' },
              onFail: [{ kind: 'condition', conditionId: 'charmed' }],
            },
          ],
        },
      ],
    })

    const actions = buildSpellCombatActions({
      ...baseArgs,
      spellIds: ['charm-person'],
      spellsById: { 'charm-person': spell },
    })

    const saveEffect = actions[0]!.effects!.find((e) => e.kind === 'save')
    expect(saveEffect).toBeDefined()
    if (saveEffect?.kind === 'save') {
      expect(saveEffect.save.dc).toBe(13)
    }
  })

  it('classifies attack spells with deliveryMethod as attack-roll', () => {
    const spell = makeSpell({
      id: 'fire-bolt',
      name: 'Fire Bolt',
      deliveryMethod: 'ranged-spell-attack',
      effectGroups: [
        {
          targeting: { selection: 'one', targetType: 'creature' },
          effects: [{ kind: 'damage', damage: '1d10', damageType: 'fire' }],
        },
      ],
    })

    const actions = buildSpellCombatActions({
      ...baseArgs,
      spellIds: ['fire-bolt'],
      spellsById: { 'fire-bolt': spell },
    })

    expect(actions).toHaveLength(1)
    expect(actions[0]!.resolutionMode).toBe('attack-roll')
    expect(actions[0]!.attackProfile?.attackBonus).toBe(5)
    expect(actions[0]!.attackProfile?.damage).toBe('1d10')
    expect(actions[0]!.attackProfile?.damageType).toBe('fire')
  })

  it('generates sequence for multi-instance attack spells', () => {
    const spell = makeSpell({
      id: 'scorching-ray',
      name: 'Scorching Ray',
      level: 2,
      deliveryMethod: 'ranged-spell-attack',
      effectGroups: [
        {
          targeting: { selection: 'chosen', targetType: 'creature' },
          effects: [
            {
              kind: 'damage',
              damage: '2d6',
              damageType: 'fire',
              instances: { count: 3, canSplitTargets: true, canStackOnSingleTarget: true },
            },
          ],
        },
      ],
    })

    const actions = buildSpellCombatActions({
      ...baseArgs,
      spellIds: ['scorching-ray'],
      spellsById: { 'scorching-ray': spell },
    })

    expect(actions).toHaveLength(2)
    const parent = actions[0]!
    const beam = actions[1]!
    expect(parent.sequence).toEqual([{ actionLabel: 'Scorching Ray Beam', count: 3 }])
    expect(beam.resolutionMode).toBe('attack-roll')
    expect(beam.attackProfile?.damage).toBe('2d6')
  })

  it('scales cantrip instance count with caster level for eldritch blast', () => {
    const spell = makeSpell({
      id: 'eldritch-blast',
      name: 'Eldritch Blast',
      deliveryMethod: 'ranged-spell-attack',
      effectGroups: [
        {
          targeting: { selection: 'chosen', targetType: 'creature' },
          effects: [
            {
              kind: 'damage',
              damage: '1d10',
              damageType: 'force',
              instances: { count: 1, canSplitTargets: true, canStackOnSingleTarget: true },
              levelScaling: {
                thresholds: [
                  { level: 5, instances: 2 },
                  { level: 11, instances: 3 },
                  { level: 17, instances: 4 },
                ],
              },
            },
          ],
        },
      ],
    })

    const level1 = buildSpellCombatActions({
      ...baseArgs,
      casterLevel: 1,
      spellIds: ['eldritch-blast'],
      spellsById: { 'eldritch-blast': spell },
    })
    expect(level1).toHaveLength(1)
    expect(level1[0]!.sequence).toBeUndefined()

    const level5 = buildSpellCombatActions({
      ...baseArgs,
      casterLevel: 5,
      spellIds: ['eldritch-blast'],
      spellsById: { 'eldritch-blast': spell },
    })
    expect(level5).toHaveLength(2)
    expect(level5[0]!.sequence).toEqual([{ actionLabel: 'Eldritch Blast Beam', count: 2 }])
  })

  it('classifies stub spells as log-only', () => {
    const spell = makeSpell({
      id: 'mage-hand',
      name: 'Mage Hand',
      effectGroups: [{ effects: [{ kind: 'note', text: '' }] }],
    })

    const actions = buildSpellCombatActions({
      ...baseArgs,
      spellIds: ['mage-hand'],
      spellsById: { 'mage-hand': spell },
    })

    expect(actions).toHaveLength(1)
    expect(actions[0]!.resolutionMode).toBe('log-only')
  })

  it('classifies targeting-only spells as log-only', () => {
    const spell = makeSpell({
      id: 'target-only',
      name: 'Target Only',
      effectGroups: [{ targeting: { selection: 'one', targetType: 'creature' }, effects: [] }],
    })

    const actions = buildSpellCombatActions({
      ...baseArgs,
      spellIds: ['target-only'],
      spellsById: { 'target-only': spell },
    })

    expect(actions[0]!.resolutionMode).toBe('log-only')
  })

  it('classifies damage-only spells (no save, no deliveryMethod) as effects', () => {
    const spell = makeSpell({
      id: 'magic-missile-test',
      name: 'Magic Missile Test',
      level: 1,
      effectGroups: [
        {
          targeting: { selection: 'one', targetType: 'creature' },
          effects: [{ kind: 'damage', damage: '1d4+1', damageType: 'force' }],
        },
      ],
    })

    const actions = buildSpellCombatActions({
      ...baseArgs,
      spellIds: ['magic-missile-test'],
      spellsById: { 'magic-missile-test': spell },
    })

    expect(actions[0]!.resolutionMode).toBe('effects')
    expect(actions[0]!.effects?.some((e) => e.kind === 'damage')).toBe(true)
  })

  it('classifies roll-modifier-only spells as effects', () => {
    const spell = makeSpell({
      id: 'pfe-g-test',
      name: 'Protection Test',
      level: 1,
      range: { kind: 'touch' },
      effectGroups: [
        {
          targeting: { selection: 'one', targetType: 'creature' },
          effects: [
            {
              kind: 'roll-modifier',
              appliesTo: 'attack-rolls',
              modifier: 'disadvantage',
            },
          ],
        },
      ],
    })

    const actions = buildSpellCombatActions({
      ...baseArgs,
      spellIds: ['pfe-g-test'],
      spellsById: { 'pfe-g-test': spell },
    })

    expect(actions[0]!.resolutionMode).toBe('effects')
    expect(actions[0]!.effects?.some((e) => e.kind === 'roll-modifier')).toBe(true)
  })

  it('classifies condition-only spells as effects', () => {
    const spell = makeSpell({
      id: 'condition-only',
      name: 'Condition Only',
      effectGroups: [
        {
          targeting: { selection: 'one', targetType: 'creature' },
          effects: [{ kind: 'condition', conditionId: 'prone' }],
        },
      ],
    })

    const actions = buildSpellCombatActions({
      ...baseArgs,
      spellIds: ['condition-only'],
      spellsById: { 'condition-only': spell },
    })

    expect(actions[0]!.resolutionMode).toBe('effects')
    expect(actions[0]!.effects?.some((e) => e.kind === 'condition')).toBe(true)
  })

  it('classifies state-only spells as effects', () => {
    const spell = makeSpell({
      id: 'state-only',
      name: 'State Only',
      effectGroups: [{ effects: [{ kind: 'state', stateId: 'banished' }] }],
    })

    const actions = buildSpellCombatActions({
      ...baseArgs,
      spellIds: ['state-only'],
      spellsById: { 'state-only': spell },
    })

    expect(actions[0]!.resolutionMode).toBe('effects')
    expect(actions[0]!.effects?.some((e) => e.kind === 'state')).toBe(true)
  })

  it('splits multi-instance auto-hit spells into parent sequence + child effects hits', () => {
    const spell = makeSpell({
      id: 'magic-missile',
      name: 'Magic Missile',
      level: 1,
      effectGroups: [
        {
          targeting: {
            selection: 'chosen',
            targetType: 'creature',
            count: 3,
            canSelectSameTargetMultipleTimes: true,
          },
          effects: [
            {
              kind: 'damage',
              damage: '1d4+1',
              damageType: 'force',
              instances: {
                count: 3,
                simultaneous: true,
                canSplitTargets: true,
                canStackOnSingleTarget: true,
              },
            },
          ],
        },
      ],
    })

    const actions = buildSpellCombatActions({
      ...baseArgs,
      spellIds: ['magic-missile'],
      spellsById: { 'magic-missile': spell },
    })

    expect(actions).toHaveLength(2)
    const parent = actions[0]!
    const hit = actions[1]!
    expect(parent.sequence).toEqual([{ actionLabel: 'Magic Missile hit', count: 3 }])
    expect(parent.resolutionMode).toBe('effects')
    expect(hit.resolutionMode).toBe('effects')
    expect(hit.label).toBe('Magic Missile hit')
    const dmg = hit.effects?.find((e) => e.kind === 'damage')
    expect(dmg?.kind).toBe('damage')
    if (dmg?.kind === 'damage') {
      expect(dmg.instances).toBeUndefined()
    }
  })

  it('maps spell resolution hpThreshold onto combat action fields', () => {
    const spell = makeSpell({
      id: 'pwk',
      name: 'Power Word Kill',
      level: 9,
      effectGroups: [
        {
          targeting: { selection: 'one', targetType: 'creature' },
          effects: [{ kind: 'damage', damage: '100', damageType: 'psychic' }],
        },
      ],
      resolution: {
        hpThreshold: {
          maxHp: 100,
          aboveMaxHpEffects: [{ kind: 'damage', damage: '12d12', damageType: 'psychic' }],
        },
      },
    })

    const actions = buildSpellCombatActions({
      ...baseArgs,
      spellIds: ['pwk'],
      spellsById: { pwk: spell },
    })

    expect(actions).toHaveLength(1)
    expect(actions[0]!.hpThreshold).toEqual({ maxHp: 100 })
    expect(actions[0]!.aboveThresholdEffects?.some((e) => e.kind === 'damage')).toBe(true)
    expect(actions[0]!.effects?.some((e) => e.kind === 'damage')).toBe(true)
  })

  it('injects timed spell duration as fixed combat turns on effects without their own duration', () => {
    const spell = makeSpell({
      id: 'timed-buff',
      name: 'Timed Buff',
      range: { kind: 'self' },
      duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true },
      effectGroups: [{ effects: [{ kind: 'modifier', target: 'armor_class', mode: 'add', value: 1 }] }],
    })

    const actions = buildSpellCombatActions({
      ...baseArgs,
      spellIds: ['timed-buff'],
      spellsById: { 'timed-buff': spell },
    })

    const mod = actions[0]!.effects?.find((e) => e.kind === 'modifier')
    expect(mod?.duration).toEqual({ kind: 'fixed', value: 10, unit: 'turn' })
  })

  it('maps bonus-action casting time to bonus action cost', () => {
    const spell = makeSpell({
      id: 'healing-word',
      name: 'Healing Word',
      level: 1,
      castingTime: { normal: { value: 1, unit: 'bonus-action' }, canBeCastAsRitual: false },
      effectGroups: [{ effects: [{ kind: 'note', text: 'Heals 2d4 + modifier.' }] }],
    })

    const actions = buildSpellCombatActions({
      ...baseArgs,
      spellIds: ['healing-word'],
      spellsById: { 'healing-word': spell },
    })

    expect(actions[0]!.cost).toEqual({ bonusAction: true })
  })

  it('maps targeting effect creature-type condition to creatureTypeFilter for combat', () => {
    const spell = makeSpell({
      id: 'hold-person-style',
      name: 'Hold Person Style',
      level: 2,
      effectGroups: [
        {
          targeting: {
            selection: 'one',
            targetType: 'creature',
            requiresSight: true,
            condition: { kind: 'creature-type', target: 'target', creatureTypes: ['humanoid'] },
          },
          effects: [
            {
              kind: 'save',
              save: { ability: 'wis' },
              onFail: [{ kind: 'condition', conditionId: 'paralyzed' }],
            },
          ],
        },
      ],
    })

    const actions = buildSpellCombatActions({
      ...baseArgs,
      spellIds: ['hold-person-style'],
      spellsById: { 'hold-person-style': spell },
    })

    expect(actions[0]!.targeting?.creatureTypeFilter).toEqual(['humanoid'])
  })

  it('maps direct creatureTypeFilter on targeting to combat action (Charm Person style)', () => {
    const spell = makeSpell({
      id: 'charm-person',
      name: 'Charm Person',
      level: 1,
      effectGroups: [
        {
          targeting: {
            selection: 'one',
            targetType: 'creature',
            creatureTypeFilter: ['humanoid'],
          },
          effects: [
            {
              kind: 'save',
              save: { ability: 'wis' },
              onFail: [{ kind: 'condition', conditionId: 'charmed' }],
            },
          ],
        },
      ],
    })

    const actions = buildSpellCombatActions({
      ...baseArgs,
      spellIds: ['charm-person'],
      spellsById: { 'charm-person': spell },
    })

    expect(actions[0]!.targeting?.creatureTypeFilter).toEqual(['humanoid'])
  })

  it('maps area targeting to all-enemies', () => {
    const spell = makeSpell({
      id: 'fireball',
      name: 'Fireball',
      level: 3,
      effectGroups: [
        {
          targeting: { selection: 'in-area', targetType: 'creature', area: { kind: 'sphere', size: 20 } },
          effects: [
            {
              kind: 'save',
              save: { ability: 'dex' },
              onFail: [{ kind: 'damage', damage: '8d6', damageType: 'fire' }],
              onSuccess: [{ kind: 'damage', damage: '4d6', damageType: 'fire' }],
            },
          ],
        },
      ],
    })

    const actions = buildSpellCombatActions({
      ...baseArgs,
      spellIds: ['fireball'],
      spellsById: { 'fireball': spell },
    })

    expect(actions[0]!.targeting).toEqual({ kind: 'all-enemies', rangeFt: 120 })
    expect(actions[0]!.areaTemplate).toEqual({ kind: 'sphere', radiusFt: 20 })
    expect(actions[0]!.areaPlacement).toBe('remote')
  })

  it('maps self-range area targeting to all-enemies with reach from area.size', () => {
    const spell = makeSpell({
      id: 'thunderwave',
      name: 'Thunderwave',
      level: 1,
      range: { kind: 'self' },
      effectGroups: [
        {
          targeting: { selection: 'in-area', targetType: 'creature', area: { kind: 'cube', size: 15 } },
          effects: [
            {
              kind: 'save',
              save: { ability: 'con' },
              onFail: [{ kind: 'damage', damage: '2d8', damageType: 'thunder' }],
              onSuccess: [{ kind: 'damage', damage: '1d8', damageType: 'thunder' }],
            },
          ],
        },
      ],
    })

    const actions = buildSpellCombatActions({
      ...baseArgs,
      spellIds: ['thunderwave'],
      spellsById: { thunderwave: spell },
    })

    expect(actions[0]!.targeting).toEqual({ kind: 'all-enemies', rangeFt: 15 })
    expect(actions[0]!.areaTemplate).toEqual({ kind: 'cube', edgeFt: 15 })
    expect(actions[0]!.areaPlacement).toBe('self')
  })

  it('strips targeting effects from resolved effects list', () => {
    const spell = makeSpell({
      id: 'sacred-flame',
      name: 'Sacred Flame',
      effectGroups: [
        {
          targeting: { selection: 'one', targetType: 'creature' },
          effects: [
            {
              kind: 'save',
              save: { ability: 'dex' },
              onFail: [{ kind: 'damage', damage: '1d8', damageType: 'radiant' }],
            },
          ],
        },
      ],
    })

    const actions = buildSpellCombatActions({
      ...baseArgs,
      spellIds: ['sacred-flame'],
      spellsById: { 'sacred-flame': spell },
    })

    expect(actions[0]!.effects!.every((e) => e.kind !== 'targeting')).toBe(true)
  })

  it('classifies self-range spells with modifier effects as effects resolution mode', () => {
    const spell = makeSpell({
      id: 'shield',
      name: 'Shield',
      range: { kind: 'self' },
      castingTime: { normal: { value: 1, unit: 'reaction' }, canBeCastAsRitual: false },
      duration: { kind: 'until-turn-boundary', subject: 'self', turn: 'next', boundary: 'start' },
      effectGroups: [
        {
          effects: [
            { kind: 'modifier', target: 'armor_class', mode: 'add', value: 5 },
            {
              kind: 'immunity',
              scope: 'spell',
              spellIds: ['magic-missile'],
              duration: {
                kind: 'until-turn-boundary',
                subject: 'self',
                turn: 'next',
                boundary: 'start',
              },
            },
          ],
        },
      ],
    })

    const actions = buildSpellCombatActions({
      ...baseArgs,
      spellIds: ['shield'],
      spellsById: { shield: spell },
    })

    expect(actions).toHaveLength(1)
    expect(actions[0]!.resolutionMode).toBe('effects')
    expect(actions[0]!.targeting).toEqual({ kind: 'self' })
    expect(actions[0]!.cost).toEqual({ reaction: true })
  })

  it('injects spell-level duration into effects that lack their own duration', () => {
    const spell = makeSpell({
      id: 'shield',
      name: 'Shield',
      range: { kind: 'self' },
      duration: { kind: 'until-turn-boundary', subject: 'self', turn: 'next', boundary: 'start' },
      effectGroups: [
        {
          effects: [
            { kind: 'modifier', target: 'armor_class', mode: 'add', value: 5 },
            {
              kind: 'immunity',
              scope: 'spell',
              spellIds: ['magic-missile'],
              duration: {
                kind: 'until-turn-boundary',
                subject: 'self',
                turn: 'next',
                boundary: 'start',
              },
            },
          ],
        },
      ],
    })

    const actions = buildSpellCombatActions({
      ...baseArgs,
      spellIds: ['shield'],
      spellsById: { shield: spell },
    })

    const modifierEffect = actions[0]!.effects!.find((e) => e.kind === 'modifier')
    expect(modifierEffect?.duration).toEqual({
      kind: 'until-turn-boundary',
      subject: 'self',
      turn: 'next',
      boundary: 'start',
    })

    const immunityEffect = actions[0]!.effects!.find((e) => e.kind === 'immunity')
    expect(immunityEffect?.duration).toEqual({
      kind: 'until-turn-boundary',
      subject: 'self',
      turn: 'next',
      boundary: 'start',
    })
  })

  it('requiresWilling on targeting enables ally touch and non-hostile derivation', () => {
    const mageArmor = makeSpell({
      id: 'mage-armor',
      name: 'Mage Armor',
      range: { kind: 'touch' },
      effectGroups: [
        {
          targeting: { selection: 'one', targetType: 'creature', requiresWilling: true },
          effects: [{ kind: 'modifier', target: 'armor_class', mode: 'set', value: 13 }],
        },
      ],
      description: {
        full: "You touch a willing creature who isn't wearing armor. Until the spell ends, the target's base AC becomes 13 plus its Dexterity modifier.",
        summary: 'Touch unarmored willing creature: AC 13 + Dex for 8 hours.',
      },
    })

    expect(deriveSpellHostility(mageArmor)).toBe('non-hostile')

    const actions = buildSpellCombatActions({
      ...baseArgs,
      spellIds: ['mage-armor'],
      spellsById: { 'mage-armor': mageArmor },
    })
    expect(actions[0]!.targeting).toEqual({
      kind: 'single-target',
      requiresWilling: true,
      rangeFt: 5,
    })
    expect(isHostileAction(actions[0]!)).toBe(false)
  })

  it('deriveSpellHostility: damage and save imply hostile; heal and hallowed state imply non-hostile', () => {
    const fireball = makeSpell({
      id: 'fireball',
      name: 'Fireball',
      effectGroups: [{ effects: [{ kind: 'damage', damage: '8d6', damageType: 'fire' }] }],
    })
    expect(deriveSpellHostility(fireball)).toBe('hostile')

    const cure = makeSpell({
      id: 'cure',
      name: 'Cure',
      effectGroups: [{ effects: [{ kind: 'hit-points', mode: 'heal', value: '1d8' }] }],
    })
    expect(deriveSpellHostility(cure)).toBe('non-hostile')

    const hallow = makeSpell({
      id: 'hallow',
      name: 'Hallow',
      effectGroups: [{ effects: [{ kind: 'state', stateId: 'hallowed', notes: 'ward' }] }],
    })
    expect(deriveSpellHostility(hallow)).toBe('non-hostile')

    const willing = makeSpell({
      id: 'inv',
      name: 'Invisibility',
      effectGroups: [
        {
          targeting: { selection: 'one', targetType: 'creature', requiresWilling: true },
          effects: [{ kind: 'condition', conditionId: 'invisible' }],
        },
      ],
    })
    expect(deriveSpellHostility(willing)).toBe('non-hostile')
  })

  it('sets hostileApplication on spell actions for isHostileAction', () => {
    const spell = makeSpell({
      id: 'sacred-flame',
      name: 'Sacred Flame',
      effectGroups: [
        {
          targeting: { selection: 'one', targetType: 'creature' },
          effects: [
            {
              kind: 'save',
              save: { ability: 'dex' },
              onFail: [{ kind: 'damage', damage: '1d8', damageType: 'radiant' }],
            },
          ],
        },
      ],
    })

    const actions = buildSpellCombatActions({
      ...baseArgs,
      spellIds: ['sacred-flame'],
      spellsById: { 'sacred-flame': spell },
    })

    expect(actions[0]!.hostileApplication).toBe(true)
    expect(isHostileAction(actions[0]!)).toBe(true)
  })
})
