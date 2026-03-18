import { describe, expect, it } from 'vitest'

import type { Monster } from '@/features/content/monsters/domain/types'
import type { Weapon } from '@/features/content/equipment/weapons/domain/types/weapon.types'
import type { Spell } from '@/features/content/spells/domain/types/spell.types'
import type { Ruleset } from '@/shared/types/ruleset'
import { CHARACTER_PROFICIENCY_BONUS_TABLE } from '@/features/mechanics/domain/progression'
import { buildMonsterAttackEntries, buildMonsterExecutableActions, buildSpellCombatActions, getCharacterSpellcastingStats } from './encounter-helpers'
import type { CharacterDetailDto } from '@/features/character/read-model'

const TEST_RULESET = {
  mechanics: {
    progression: {
      proficiencyBonusTable: CHARACTER_PROFICIENCY_BONUS_TABLE,
    },
  },
} as unknown as Ruleset

const TEST_MONSTER = {
  id: 'test-monster',
  name: 'Test Monster',
  mechanics: {
    hitPoints: { count: 2, die: 8 },
    armorClass: { kind: 'fixed', value: 12 },
    movement: { ground: 30 },
    proficiencyBonus: 2,
    actions: [
      {
        kind: 'natural',
        name: 'Rend',
        attackType: 'claw',
        attackBonus: 4,
        damage: '1d6',
        damageBonus: 2,
        damageType: 'piercing',
      },
      {
        kind: 'special',
        name: 'Acid Spit',
        description: 'The monster spits acid.',
        attackBonus: 5,
        damage: '2d4',
        damageBonus: 3,
        damageType: 'acid',
      },
    ],
    bonusActions: [],
  },
  lore: {},
} as unknown as Monster

const LONGBOW = {
  id: 'longbow',
  name: 'Longbow',
  mode: 'ranged',
  properties: [],
  damage: { default: '1d8' },
  damageType: 'piercing',
} as unknown as Weapon

const MONSTER_WEAPON_TEST = {
  id: 'weapon-test-monster',
  name: 'Weapon Test Monster',
  mechanics: {
    hitPoints: { count: 2, die: 8 },
    armorClass: { kind: 'fixed', value: 12 },
    movement: { ground: 30 },
    abilities: { str: 8, dex: 14, con: 10, int: 10, wis: 10, cha: 10 },
    proficiencyBonus: 2,
    proficiencies: {
      weapons: {
        longbow: { proficiencyLevel: 1 },
      },
    },
    equipment: {
      weapons: {
        'bone-bow': {
          weaponId: 'longbow',
          aliasName: 'Bone Bow',
          damageOverride: '1d10',
        },
        'war-bow': {
          weaponId: 'longbow',
          aliasName: 'War Bow',
          attackBonus: 7,
        },
      },
    },
    actions: [
      { kind: 'weapon', weaponRef: 'bone-bow' },
      { kind: 'weapon', weaponRef: 'war-bow' },
    ],
    bonusActions: [],
  },
  lore: {},
} as unknown as Monster

describe('combat simulation monster action helpers', () => {
  it('preserves authored damage bonuses for natural and special display entries', () => {
    const attacks = buildMonsterAttackEntries(TEST_MONSTER, {})

    expect(attacks).toEqual([
      expect.objectContaining({
        name: 'Rend',
        attackBonus: 4,
        damage: '1d6 + 2',
        damageType: 'piercing',
      }),
      expect.objectContaining({
        name: 'Acid Spit',
        attackBonus: 5,
        damage: '2d4 + 3',
        damageType: 'acid',
      }),
    ])
  })

  it('uses authored attack and damage bonuses for natural and special executable actions', () => {
    const actions = buildMonsterExecutableActions(TEST_MONSTER, {})

    expect(actions).toEqual([
      expect.objectContaining({
        label: 'Rend',
        resolutionMode: 'attack-roll',
        attackProfile: expect.objectContaining({
          attackBonus: 4,
          damage: '1d6 + 2',
          damageType: 'piercing',
        }),
      }),
      expect.objectContaining({
        label: 'Acid Spit',
        resolutionMode: 'attack-roll',
        attackProfile: expect.objectContaining({
          attackBonus: 5,
          damage: '2d4 + 3',
          damageType: 'acid',
        }),
      }),
    ])
  })

  it('uses shared resolver math for weapon actions, including monster proficiencies and active modifiers', () => {
    const attacks = buildMonsterAttackEntries(
      MONSTER_WEAPON_TEST,
      { longbow: LONGBOW },
      [
        { kind: 'modifier', target: 'attack_roll', mode: 'add', value: 1 },
        { kind: 'modifier', target: 'damage', mode: 'add', value: 2 },
      ],
    )

    expect(attacks[0]).toEqual(
      expect.objectContaining({
        name: 'Bone Bow',
        attackBonus: 5,
        damage: '1d10 + 4',
        damageType: 'piercing',
      }),
    )

    const actions = buildMonsterExecutableActions(
      MONSTER_WEAPON_TEST,
      { longbow: LONGBOW },
      [
        { kind: 'modifier', target: 'attack_roll', mode: 'add', value: 1 },
        { kind: 'modifier', target: 'damage', mode: 'add', value: 2 },
      ],
    )

    expect(actions[0]).toEqual(
      expect.objectContaining({
        label: 'Bone Bow',
        resolutionMode: 'attack-roll',
        attackProfile: expect.objectContaining({
          attackBonus: 5,
          damage: '1d10 + 4',
          damageType: 'piercing',
        }),
      }),
    )
  })

  it('prefers explicit authored weapon attack bonuses over shared resolved totals', () => {
    const actions = buildMonsterExecutableActions(
      MONSTER_WEAPON_TEST,
      { longbow: LONGBOW },
      [
        { kind: 'modifier', target: 'attack_roll', mode: 'add', value: 1 },
      ],
    )

    expect(actions[1]).toEqual(
      expect.objectContaining({
        label: 'War Bow',
        attackProfile: expect.objectContaining({
          attackBonus: 7,
          damage: '1d8 + 2',
          damageType: 'piercing',
        }),
      }),
    )
  })

  it('seeds recharge and limited-use metadata for executable monster special actions', () => {
    const monster = {
      id: 'usage-test-monster',
      name: 'Usage Test Monster',
      mechanics: {
        hitPoints: { count: 2, die: 8 },
        armorClass: { kind: 'fixed', value: 12 },
        movement: { ground: 30 },
        actions: [
          {
            kind: 'special',
            name: 'Fire Breath',
            description: 'Each creature in a cone must make a saving throw.',
            save: { ability: 'dex', dc: 13 },
            damage: '4d6',
            damageType: 'fire',
            target: 'creatures-in-area',
            recharge: { min: 5, max: 6 },
            uses: { count: 1, period: 'day' },
          },
        ],
        bonusActions: [],
      },
      lore: {},
    } as unknown as Monster

    const actions = buildMonsterExecutableActions(monster, {})

    expect(actions[0]).toEqual(
      expect.objectContaining({
        label: 'Fire Breath',
        usage: {
          recharge: {
            min: 5,
            max: 6,
            ready: true,
          },
          uses: {
            max: 1,
            remaining: 1,
            period: 'day',
          },
        },
      }),
    )
  })

  it('preserves movement-targeting metadata for containment-style monster actions', () => {
    const monster = {
      id: 'cube-test-monster',
      name: 'Gelatinous Cube',
      mechanics: {
        hitPoints: { count: 2, die: 8 },
        armorClass: { kind: 'fixed', value: 12 },
        movement: { ground: 15 },
        actions: [
          {
            kind: 'special',
            name: 'Engulf',
            description: 'The cube moves through creature spaces and engulfs them.',
            target: 'creatures-entered-during-move',
            movement: {
              upToSpeed: true,
              noOpportunityAttacks: true,
              canEnterCreatureSpaces: true,
              targetSizeMax: 'large',
            },
            save: { ability: 'dex', dc: 12 },
            onFail: [{ kind: 'state', stateId: 'engulfed' }],
          },
        ],
        bonusActions: [],
      },
      lore: {},
    } as unknown as Monster

    const actions = buildMonsterExecutableActions(monster, {})

    expect(actions[0]).toEqual(
      expect.objectContaining({
        label: 'Engulf',
        targeting: { kind: 'entered-during-move' },
        movement: {
          upToSpeed: true,
          noOpportunityAttacks: true,
          canEnterCreatureSpaces: true,
          targetSizeMax: 'large',
        },
      }),
    )
  })
})

describe('buildSpellCombatActions', () => {
  const baseArgs = {
    runtimeId: 'pc-1',
    spellSaveDc: 13,
    spellAttackBonus: 5,
    casterLevel: 1,
  }

  function makeSpell(partial: Partial<Spell> & Pick<Spell, 'id' | 'name' | 'effects'>): Spell {
    return {
      school: 'evocation',
      level: 0,
      classes: ['wizard'],
      castingTime: { normal: { value: 1, unit: 'action' } },
      range: { kind: 'distance', value: { value: 120, unit: 'ft' } },
      duration: { kind: 'instantaneous' },
      components: { verbal: true, somatic: true },
      description: { full: '', summary: '' },
      ...partial,
    } as Spell
  }

  it('classifies save-based spells as effects resolution mode', () => {
    const spell = makeSpell({
      id: 'sacred-flame',
      name: 'Sacred Flame',
      effects: [
        { kind: 'targeting', target: 'one-creature', targetType: 'creature' },
        {
          kind: 'save',
          save: { ability: 'dex' },
          onFail: [{ kind: 'damage', damage: '1d8', damageType: 'radiant' }],
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

  it('injects spell save DC into save effects that lack a DC', () => {
    const spell = makeSpell({
      id: 'charm-person',
      name: 'Charm Person',
      effects: [
        { kind: 'targeting', target: 'one-creature', targetType: 'creature' },
        {
          kind: 'save',
          save: { ability: 'wis' },
          onFail: [{ kind: 'condition', conditionId: 'charmed' }],
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
      effects: [
        { kind: 'targeting', target: 'one-creature', targetType: 'creature' },
        { kind: 'damage', damage: '1d10', damageType: 'fire' },
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
      effects: [
        { kind: 'targeting', target: 'chosen-creatures', targetType: 'creature' },
        { kind: 'damage', damage: '2d6', damageType: 'fire', instances: { count: 3, canSplitTargets: true, canStackOnSingleTarget: true } },
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
      effects: [
        { kind: 'targeting', target: 'chosen-creatures', targetType: 'creature' },
        {
          kind: 'damage',
          damage: '1d10',
          damageType: 'force',
          instances: { count: 1, canSplitTargets: true, canStackOnSingleTarget: true },
          levelScaling: { thresholds: [{ level: 5, instances: 2 }, { level: 11, instances: 3 }, { level: 17, instances: 4 }] },
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
      effects: [{ kind: 'note', text: '' }],
    })

    const actions = buildSpellCombatActions({
      ...baseArgs,
      spellIds: ['mage-hand'],
      spellsById: { 'mage-hand': spell },
    })

    expect(actions).toHaveLength(1)
    expect(actions[0]!.resolutionMode).toBe('log-only')
  })

  it('maps bonus-action casting time to bonus action cost', () => {
    const spell = makeSpell({
      id: 'healing-word',
      name: 'Healing Word',
      level: 1,
      castingTime: { normal: { value: 1, unit: 'bonus-action' } },
      effects: [{ kind: 'note', text: 'Heals 2d4 + modifier.' }],
    })

    const actions = buildSpellCombatActions({
      ...baseArgs,
      spellIds: ['healing-word'],
      spellsById: { 'healing-word': spell },
    })

    expect(actions[0]!.cost).toEqual({ bonusAction: true })
  })

  it('maps area targeting to all-enemies', () => {
    const spell = makeSpell({
      id: 'fireball',
      name: 'Fireball',
      level: 3,
      effects: [
        { kind: 'targeting', target: 'creatures-in-area', area: { kind: 'sphere', size: 20 } },
        { kind: 'save', save: { ability: 'dex' }, onFail: [{ kind: 'damage', damage: '8d6', damageType: 'fire' }], onSuccess: [{ kind: 'damage', damage: '4d6', damageType: 'fire' }] },
      ],
    })

    const actions = buildSpellCombatActions({
      ...baseArgs,
      spellIds: ['fireball'],
      spellsById: { 'fireball': spell },
    })

    expect(actions[0]!.targeting).toEqual({ kind: 'all-enemies' })
  })

  it('strips targeting effects from resolved effects list', () => {
    const spell = makeSpell({
      id: 'sacred-flame',
      name: 'Sacred Flame',
      effects: [
        { kind: 'targeting', target: 'one-creature', targetType: 'creature' },
        { kind: 'save', save: { ability: 'dex' }, onFail: [{ kind: 'damage', damage: '1d8', damageType: 'radiant' }] },
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
      castingTime: { normal: { value: 1, unit: 'reaction' } },
      duration: { kind: 'until-turn-boundary', subject: 'self', turn: 'next', boundary: 'start' },
      effects: [
        { kind: 'modifier', target: 'armor_class', mode: 'add', value: 5 },
        { kind: 'immunity', scope: 'spell', spellIds: ['magic-missile'], duration: { kind: 'until-turn-boundary', subject: 'self', turn: 'next', boundary: 'start' } },
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
      effects: [
        { kind: 'modifier', target: 'armor_class', mode: 'add', value: 5 },
        { kind: 'immunity', scope: 'spell', spellIds: ['magic-missile'], duration: { kind: 'until-turn-boundary', subject: 'self', turn: 'next', boundary: 'start' } },
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
})

describe('getCharacterSpellcastingStats', () => {
  it('computes spell save DC and attack bonus from primary class ability', () => {
    const character = {
      level: 5,
      classes: [{
        classId: 'wizard',
        level: 5,
        className: 'Wizard',
        progression: {
          hitDie: 6,
          spellcasting: 'full',
          spellProgression: { ability: 'intelligence', type: 'prepared' },
        },
      }],
      abilityScores: {
        strength: 8,
        dexterity: 14,
        constitution: 12,
        intelligence: 16,
        wisdom: 10,
        charisma: 10,
      },
    } as CharacterDetailDto

    const stats = getCharacterSpellcastingStats(character, TEST_RULESET)

    expect(stats.spellAttackBonus).toBe(6)
    expect(stats.spellSaveDc).toBe(14)
  })

  it('uses charisma for sorcerer', () => {
    const character = {
      level: 3,
      classes: [{
        classId: 'sorcerer',
        level: 3,
        className: 'Sorcerer',
        progression: {
          hitDie: 6,
          spellcasting: 'full',
          spellProgression: { ability: 'charisma', type: 'known' },
        },
      }],
      abilityScores: {
        strength: 8,
        dexterity: 14,
        constitution: 12,
        intelligence: 10,
        wisdom: 10,
        charisma: 18,
      },
    } as CharacterDetailDto

    const stats = getCharacterSpellcastingStats(character, TEST_RULESET)

    expect(stats.spellAttackBonus).toBe(6)
    expect(stats.spellSaveDc).toBe(14)
  })
})
