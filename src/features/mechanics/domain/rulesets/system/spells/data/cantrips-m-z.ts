import type { SpellEntry } from '../types';
import { cantripDamageScaling, RESISTANCE_SPELL_DAMAGE_TYPE_OPTIONS } from '../shared';

/**
 * Cantrips M–Z — authoring status:
 * - **Structured damage/save:** Poison Spray, Ray of Frost, Shocking Grasp, Starry Wisp (attack); Vicious Mockery (save + damage); Sorcerous Burst (base 1d8 hit + under-modeled rider).
 * - **Targeting + caveats/notes:** Spare the Dying (`one-dead-creature` + stable/range under-modeled); Resistance (touch + caveats).
 * - **Note-first (utility / multi-mode):** Prestidigitation, Produce Flame, Shillelagh, Thaumaturgy, True Strike — not worth faking as full `effects` until weapon/light/submode engines exist.
 */
export const SPELLS_LEVEL_0_M_Z: readonly SpellEntry[] = [
{
    id: 'poison-spray',
    name: 'Poison Spray',
    school: 'necromancy',
    level: 0,
    classes: ['druid', 'sorcerer', 'warlock', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 30, unit: 'ft' } },
    duration: { kind: 'instantaneous' },
    components: { verbal: true, somatic: true },
    deliveryMethod: 'ranged-spell-attack',
    effects: [
      { kind: 'targeting', target: 'one-creature', targetType: 'creature' },
      {
        kind: 'damage',
        damage: '1d12',
        damageType: 'poison',
        levelScaling: cantripDamageScaling('d12'),
      },
    ],
    description: {
      full: "You spray toxic mist at a creature within range. Make a ranged spell attack against the target. On a hit, the target takes 1d12 Poison damage. Cantrip Upgrade. The damage increases by 1d12 when you reach levels 5 (2d12), 11 (3d12), and 17 (4d12).",
      summary: 'Ranged spell attack: 1d12 poison. Scales at 5/11/17.',
    },
  },
{
    id: 'prestidigitation',
    name: 'Prestidigitation',
    school: 'transmutation',
    level: 0,
    classes: ['bard', 'sorcerer', 'warlock', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 10, unit: 'ft' } },
    duration: { kind: 'timed', value: 1, unit: 'hour', upTo: true },
    components: { verbal: true, somatic: true },
    effects: [
      {
        kind: 'note',
        text: 'Sensory effect, fire play, clean/soil, chill/warm/flavor 1ft³, magic mark, minor creation (trinket/illusion). Up to 3 non-instantaneous effects active.',
      },
    ],
    description: {
      full: "You create a magical effect within range. Choose the effect from the options below. If you cast this spell multiple times, you can have up to three of its non-instantaneous effects active at a time. Sensory Effect: instantaneous harmless sensory effect. Fire Play: light or snuff candle, torch, small campfire. Clean or Soil: clean or soil object no larger than 1 cubic foot. Minor Sensation: chill, warm, or flavor up to 1 cubic foot of nonliving material for 1 hour. Magic Mark: color, mark, or symbol on object/surface for 1 hour. Minor Creation: nonmagical trinket or illusory image that fits in hand, lasts until end of next turn.",
      summary: 'Minor magical tricks: sensory effects, fire, clean/soil, chill/warm, marks, trinkets. Up to 3 effects.',
    },
  },
{
    id: 'produce-flame',
    name: 'Produce Flame',
    school: 'conjuration',
    level: 0,
    classes: ['druid'],
    castingTime: { normal: { value: 1, unit: 'bonus-action' } },
    range: { kind: 'self' },
    duration: { kind: 'timed', value: 10, unit: 'minute' },
    components: { verbal: true, somatic: true },
    effects: [
      {
        kind: 'note',
        text: 'Flame in hand: Bright 20ft, Dim 20ft. Magic action: ranged spell attack 1d8 fire at 60ft. Scales at 5/11/17.',
      },
    ],
    description: {
      full: "A flickering flame appears in your hand and remains there for the duration. While there, the flame emits no heat and ignites nothing, and it sheds Bright Light in a 20-foot radius and Dim Light for an additional 20 feet. The spell ends if you cast it again. Until the spell ends, you can take a Magic action to hurl fire at a creature or an object within 60 feet of you. Make a ranged spell attack. On a hit, the target takes 1d8 Fire damage. Cantrip Upgrade. The damage increases by 1d8 when you reach levels 5 (2d8), 11 (3d8), and 17 (4d8).",
      summary: 'Flame in hand for light; Magic action to hurl 1d8 fire. Scales at 5/11/17.',
    },
  },
{
    id: 'ray-of-frost',
    name: 'Ray of Frost',
    school: 'evocation',
    level: 0,
    classes: ['sorcerer', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
    duration: { kind: 'instantaneous' },
    components: { verbal: true, somatic: true },
    deliveryMethod: 'ranged-spell-attack',
    effects: [
      { kind: 'targeting', target: 'one-creature', targetType: 'creature' },
      {
        kind: 'damage',
        damage: '1d8',
        damageType: 'cold',
        levelScaling: cantripDamageScaling('d8'),
      },
      {
        kind: 'note',
        text: "On a hit, the target's Speed is reduced by 10 feet until the start of your next turn. Not tracked in encounter.",
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "A frigid beam of blue-white light streaks toward a creature within range. Make a ranged spell attack against the target. On a hit, it takes 1d8 Cold damage, and its Speed is reduced by 10 feet until the start of your next turn. Cantrip Upgrade. The damage increases by 1d8 when you reach levels 5 (2d8), 11 (3d8), and 17 (4d8).",
      summary: 'Ranged spell attack: 1d8 cold, -10ft Speed. Scales at 5/11/17.',
    },
  },
  {
    id: 'resistance',
    name: 'Resistance',
    school: 'abjuration',
    level: 0,
    classes: ['cleric', 'druid'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'touch' },
    duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true },
    resolution: {
      caveats: [
        'Damage-type choice, 1d4 reduction trigger, and once-per-turn limit are not enforced in encounter.',
      ],
      casterOptions: [
        {
          kind: 'enum',
          id: 'resistance-damage-type',
          label: 'Damage type',
          options: RESISTANCE_SPELL_DAMAGE_TYPE_OPTIONS,
        },
      ],
    },
    effects: [
      { kind: 'targeting', target: 'one-creature', targetType: 'creature', requiresWilling: true },
      {
        kind: 'note',
        text: 'Touch willing creature, choose damage type. When creature takes that damage type before spell ends, reduce damage by 1d4. Once per turn.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "You touch a willing creature and choose a damage type: Acid, Bludgeoning, Cold, Fire, Lightning, Necrotic, Piercing, Poison, Radiant, Slashing, or Thunder. When the creature takes damage of the chosen type before the spell ends, the creature reduces the total damage taken by 1d4. A creature can benefit from this spell only once per turn.",
      summary: 'Touch: reduce damage of chosen type by 1d4. Once per turn.',
    },
  },
{
    id: 'sacred-flame',
    name: 'Sacred Flame',
    school: 'evocation',
    level: 0,
    classes: ['cleric'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
    duration: { kind: 'instantaneous' },
    components: { verbal: true, somatic: true },
    effects: [
      { kind: 'targeting', target: 'one-creature', targetType: 'creature', requiresSight: true },
      {
        kind: 'save',
        save: { ability: 'dex' },
        onFail: [{
          kind: 'damage',
          damage: '1d8',
          damageType: 'radiant',
          levelScaling: cantripDamageScaling('d8'),
        }],
      },
      {
        kind: 'note',
        text: 'The target gains no benefit from Half Cover or Three-Quarters Cover for this save.',
      },
    ],
    description: {
      full: 'Flame-like radiance descends on a creature that you can see within range. The target must succeed on a Dexterity saving throw or take 1d8 Radiant damage. The target gains no benefit from Half Cover or Three-Quarters Cover for this save. Cantrip Upgrade. The damage increases by 1d8 when you reach levels 5 (2d8), 11 (3d8), and 17 (4d8).',
      summary: 'A creature you can see makes a Dexterity save or takes 1d8 radiant damage; ignores half and three-quarters cover.',
    },
  },
{
    id: 'shillelagh',
    name: 'Shillelagh',
    school: 'transmutation',
    level: 0,
    classes: ['druid'],
    castingTime: { normal: { value: 1, unit: 'bonus-action' } },
    range: { kind: 'self' },
    duration: { kind: 'timed', value: 1, unit: 'minute' },
    components: { verbal: true, somatic: true, material: { description: 'mistletoe' } },
    effects: [
      {
        kind: 'note',
        text: 'Club or Quarterstaff: use spellcasting ability for attack/damage, damage die d8. Force or normal damage type. Ends if you let go. Scales: d10 at 5, d12 at 11, 2d6 at 17.',
      },
    ],
    description: {
      full: "A Club or Quarterstaff you are holding is imbued with nature's power. For the duration, you can use your spellcasting ability instead of Strength for the attack and damage rolls of melee attacks using that weapon, and the weapon's damage die becomes a d8. If the attack deals damage, it can be Force damage or the weapon's normal damage type (your choice). The spell ends early if you cast it again or if you let go of the weapon. Cantrip Upgrade. The damage die changes when you reach levels 5 (d10), 11 (d12), and 17 (2d6).",
      summary: 'Club/Quarterstaff: spellcasting mod for attack/damage, d8 die. Scales at 5/11/17.',
    },
  },
{
    id: 'shocking-grasp',
    name: 'Shocking Grasp',
    school: 'evocation',
    level: 0,
    classes: ['sorcerer', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'touch' },
    duration: { kind: 'instantaneous' },
    components: { verbal: true, somatic: true },
    deliveryMethod: 'melee-spell-attack',
    effects: [
      { kind: 'targeting', target: 'one-creature', targetType: 'creature' },
      {
        kind: 'damage',
        damage: '1d8',
        damageType: 'lightning',
        levelScaling: cantripDamageScaling('d8'),
      },
      {
        kind: 'note',
        text: "On a hit, the target can't make Opportunity Attacks until the start of its next turn. Not tracked in encounter.",
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "Lightning springs from you to a creature that you try to touch. Make a melee spell attack against the target. On a hit, the target takes 1d8 Lightning damage, and it can't make Opportunity Attacks until the start of its next turn. Cantrip Upgrade. The damage increases by 1d8 when you reach levels 5 (2d8), 11 (3d8), and 17 (4d8).",
      summary: 'Melee spell attack: 1d8 lightning, target cannot make Opportunity Attacks. Scales at 5/11/17.',
    },
  },
{
    id: 'sorcerous-burst',
    name: 'Sorcerous Burst',
    school: 'evocation',
    level: 0,
    classes: ['sorcerer'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 120, unit: 'ft' } },
    duration: { kind: 'instantaneous' },
    components: { verbal: true, somatic: true },
    deliveryMethod: 'ranged-spell-attack',
    resolution: {
      caveats: [
        'Damage type is chosen at cast time; encounter uses a single type for logging.',
        'Exploding 8s and extra d8 dice cap are not resolved.',
      ],
    },
    effects: [
      { kind: 'targeting', target: 'one-creature', targetType: 'creature' },
      {
        kind: 'damage',
        damage: '1d8',
        damageType: 'fire',
        levelScaling: cantripDamageScaling('d8'),
      },
      {
        kind: 'note',
        text: 'Choose Acid, Cold, Fire, Lightning, Poison, Psychic, or Thunder when you cast. On any d8 damage roll of 8, roll another d8 (repeat), up to a maximum number of extra d8s equal to your spellcasting ability modifier.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "You cast sorcerous energy at one creature or object within range. Make a ranged spell attack against the target. On a hit, the target takes 1d8 damage of a type you choose: Acid, Cold, Fire, Lightning, Poison, Psychic, or Thunder. If you roll an 8 on a d8 for this spell, you can roll another d8, and add it to the damage. When you cast this spell, the maximum number of these d8s you can add to the spell's damage equals your spellcasting ability modifier. Cantrip Upgrade. The damage increases by 1d8 when you reach levels 5 (2d8), 11 (3d8), and 17 (4d8).",
      summary: 'Ranged spell attack: 1d8 (choose type). Exploding 8s add d8s up to spellcasting mod. Scales at 5/11/17.',
    },
  },
{
    id: 'spare-the-dying',
    name: 'Spare the Dying',
    school: 'necromancy',
    level: 0,
    classes: ['cleric', 'druid'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 15, unit: 'ft' } },
    duration: { kind: 'instantaneous' },
    components: { verbal: true, somatic: true },
    resolution: {
      caveats: [
        'Stable condition and cantrip range scaling are not applied in encounter.',
      ],
    },
    effects: [
      { kind: 'targeting', target: 'one-dead-creature', targetType: 'creature' },
      {
        kind: 'note',
        text: 'A non-dead creature that has 0 Hit Points becomes Stable. Cantrip Upgrade doubles range at levels 5 (30 ft), 11 (60 ft), and 17 (120 ft).',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "Choose a creature within range that has 0 Hit Points and isn't dead. The creature becomes Stable. Cantrip Upgrade. The range doubles when you reach levels 5 (30 feet), 11 (60 feet), and 17 (120 feet).",
      summary: 'Creature with 0 HP becomes Stable. Range scales at 5/11/17.',
    },
  },
{
    id: 'starry-wisp',
    name: 'Starry Wisp',
    school: 'evocation',
    level: 0,
    classes: ['bard', 'druid'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
    duration: { kind: 'instantaneous' },
    components: { verbal: true, somatic: true },
    deliveryMethod: 'ranged-spell-attack',
    effects: [
      { kind: 'targeting', target: 'one-creature', targetType: 'creature' },
      {
        kind: 'damage',
        damage: '1d8',
        damageType: 'radiant',
        levelScaling: cantripDamageScaling('d8'),
      },
      {
        kind: 'note',
        text: "Until the end of your next turn, the target emits Dim Light in a 10-foot radius and can't benefit from the Invisible condition. Not tracked in encounter.",
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "You launch a mote of light at one creature or object within range. Make a ranged spell attack against the target. On a hit, the target takes 1d8 Radiant damage, and until the end of your next turn, it emits Dim Light in a 10-foot radius and can't benefit from the Invisible condition. Cantrip Upgrade. The damage increases by 1d8 when you reach levels 5 (2d8), 11 (3d8), and 17 (4d8).",
      summary: 'Ranged spell attack: 1d8 radiant, Dim Light 10ft, no Invisible. Scales at 5/11/17.',
    },
  },
{
    id: 'thaumaturgy',
    name: 'Thaumaturgy',
    school: 'transmutation',
    level: 0,
    classes: ['cleric'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 30, unit: 'ft' } },
    duration: { kind: 'timed', value: 1, unit: 'minute', upTo: true },
    components: { verbal: true },
    effects: [
      {
        kind: 'note',
        text: 'Minor wonders: altered eyes, booming voice, fire play, invisible hand, phantom sound, tremors. Up to 3 effects active.',
      },
    ],
    description: {
      full: "You manifest a minor wonder within range. You create one of the effects below within range. If you cast this spell multiple times, you can have up to three of its 1-minute effects active at a time. Altered Eyes. You alter the appearance of your eyes for 1 minute. Booming Voice. Your voice booms up to three times as loud as normal for 1 minute. For the duration, you have Advantage on Charisma (Intimidation) checks. Fire Play. You cause flames to flicker, brighten, dim, or change color for 1 minute. Invisible Hand. You instantaneously cause an unlocked door or window to fly open or slam shut. Phantom Sound. You create an instantaneous sound that originates from a point of your choice within range, such as a rumble of thunder, the cry of a raven, or ominous whispers. Tremors. You cause harmless tremors in the ground for 1 minute.",
      summary: 'Minor wonders: altered eyes, booming voice, fire play, invisible hand, phantom sound, tremors.',
    },
  },
{
    id: 'true-strike',
    name: 'True Strike',
    school: 'divination',
    level: 0,
    classes: ['bard', 'sorcerer', 'warlock', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'self' },
    duration: { kind: 'instantaneous' },
    components: { somatic: true, material: { description: 'a weapon with which you have proficiency and that is worth 1+ CP' } },
    effects: [
      {
        kind: 'note',
        text: 'One weapon attack using spellcasting ability. Damage can be Radiant or weapon type. Extra Radiant at 5 (1d6), 11 (2d6), 17 (3d6).',
      },
    ],
    description: {
      full: "Guided by a flash of magical insight, you make one attack with the weapon used in the spell's casting. The attack uses your spellcasting ability for the attack and damage rolls instead of using Strength or Dexterity. If the attack deals damage, it can be Radiant damage or the weapon's normal damage type (your choice). Cantrip Upgrade. Whether you deal Radiant damage or the weapon's normal damage type, the attack deals extra Radiant damage when you reach levels 5 (1d6), 11 (2d6), and 17 (3d6).",
      summary: 'One weapon attack using spellcasting ability. Radiant or weapon damage. Extra Radiant at 5/11/17.',
    },
  },
{
    id: 'vicious-mockery',
    name: 'Vicious Mockery',
    school: 'enchantment',
    level: 0,
    classes: ['bard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
    duration: { kind: 'instantaneous' },
    components: { verbal: true },
    resolution: {
      caveats: [
        'Rules allow targeting by sight or hearing; encounter targeting uses sight only.',
        'Disadvantage applies only to the next attack roll before the end of the target’s next turn; not modeled as a single-roll marker.',
      ],
    },
    effects: [
      { kind: 'targeting', target: 'one-creature', targetType: 'creature', requiresSight: true },
      {
        kind: 'save',
        save: { ability: 'wis' },
        onFail: [
          {
            kind: 'damage',
            damage: '1d6',
            damageType: 'psychic',
            levelScaling: cantripDamageScaling('d6'),
          },
        ],
      },
      {
        kind: 'note',
        text: 'On a failed save, the target has Disadvantage on the next attack roll it makes before the end of its next turn.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "You unleash a string of insults laced with subtle enchantments at one creature you can see or hear within range. The target must succeed on a Wisdom saving throw or take 1d6 Psychic damage and have Disadvantage on the next attack roll it makes before the end of its next turn. Cantrip Upgrade. The damage increases by 1d6 when you reach levels 5 (2d6), 11 (3d6), and 17 (4d6).",
      summary: 'Wis save or 1d6 psychic and Disadvantage on next attack. Scales at 5/11/17.',
    },
  },
];
