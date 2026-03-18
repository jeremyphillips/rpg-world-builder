/**
 * System spell catalog — code-defined spell entries per system ruleset.
 *
 * These are the "factory defaults" for spells (SRD_CC_v5_2_1). Campaign-owned
 * custom spells would be stored in the DB and merged at runtime.
 *
 * Fully-authored spells include all SpellBase fields.
 * Stub entries use SpellEntry and are minimally typed until authoring reaches them.
 */
import type { Spell, SpellBase } from '@/features/content/spells/domain/types';
import type { DiceOrFlat, dY } from '@/features/mechanics/domain/dice';
import type { CreatureTypeCondition } from '@/features/mechanics/domain/conditions/condition.types';
import type { SystemRulesetId } from '../types/ruleset.types';
import { DEFAULT_SYSTEM_RULESET_ID } from '../ids/systemIds';

const EXTRAPLANAR_CREATURE_TYPES: CreatureTypeCondition = {
  kind: 'creature-type',
  target: 'source',
  creatureTypes: ['aberration', 'celestial', 'elemental', 'fey', 'fiend', 'undead'],
};

/** Standard cantrip damage upgrade thresholds (levels 5, 11, 17). */
function cantripDamageScaling(die: dY) {
  return {
    thresholds: [
      { level: 5, damage: `2${die}` as DiceOrFlat },
      { level: 11, damage: `3${die}` as DiceOrFlat },
      { level: 17, damage: `4${die}` as DiceOrFlat },
    ],
  };
}

type SpellEntry = Partial<SpellBase> & Pick<SpellBase, 'id' | 'name' | 'school' | 'level' | 'classes' | 'effects'>;

// ---------------------------------------------------------------------------
// Legacy ID → canonical kebab-case ID mapping (for migration scripts)
// ---------------------------------------------------------------------------

export const LEGACY_SPELL_ID_MAP: Record<string, string> = {
  fireBolt: 'fire-bolt',
  eldritchBlast: 'eldritch-blast',
  sacredFlame: 'sacred-flame',
  mageHand: 'mage-hand',
  magicMissile: 'magic-missile',
  cureWounds: 'cure-wounds',
  healingWord: 'healing-word',
  detectMagic: 'detect-magic',
  guidingBolt: 'guiding-bolt',
  charmPerson: 'charm-person',
  protectionFromEvil: 'protection-from-evil',
  featherFall: 'feather-fall',
  mistyStep: 'misty-step',
  spiritualWeapon: 'spiritual-weapon',
  holdPerson: 'hold-person',
  scorchingRay: 'scorching-ray',
  lesserRestoration: 'lesser-restoration',
  spiritGuardians: 'spirit-guardians',
  lightningBolt: 'lightning-bolt',
  dispelMagic: 'dispel-magic',
  removeCurse: 'remove-curse',
  dimensionDoor: 'dimension-door',
  iceStorm: 'ice-storm',
  wallOfForce: 'wall-of-force',
  greaterRestoration: 'greater-restoration',
  raiseDead: 'raise-dead',
  chainLightning: 'chain-lightning',
  powerWordStun: 'power-word-stun',
  powerWordKill: 'power-word-kill',
};

// ---------------------------------------------------------------------------
// 5e v1 system spells (SRD_CC_v5_2_1)
// ---------------------------------------------------------------------------

const SPELLS_RAW: readonly SpellEntry[] = [
  {
    id: 'fire-bolt',
    name: 'Fire Bolt',
    school: 'evocation',
    level: 0,
    classes: ['sorcerer', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 120, unit: 'ft' } },
    duration: { kind: 'instantaneous' },
    components: { verbal: true, somatic: true },
    deliveryMethod: 'ranged-spell-attack',
    effects: [
      { kind: 'targeting', target: 'one-creature', targetType: 'creature' },
      {
        kind: 'damage',
        damage: '1d10',
        damageType: 'fire',
        levelScaling: cantripDamageScaling('d10'),
      },
      {
        kind: 'note',
        text: "A flammable object hit by this spell starts burning if it isn't being worn or carried.",
      },
    ],
    description: {
      full: "You hurl a mote of fire at a creature or an object within range. Make a ranged spell attack against the target. On a hit, the target takes 1d10 Fire damage. A flammable object hit by this spell starts burning if it isn't being worn or carried. Cantrip Upgrade. The damage increases by 1d10 when you reach levels 5 (2d10), 11 (3d10), and 17 (4d10).",
      summary: 'Ranged spell attack dealing 1d10 fire damage; flammable objects start burning.',
    },
  },
  {
    id: 'eldritch-blast',
    name: 'Eldritch Blast',
    school: 'evocation',
    level: 0,
    classes: ['warlock'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 120, unit: 'ft' } },
    duration: { kind: 'instantaneous' },
    components: { verbal: true, somatic: true },
    deliveryMethod: 'ranged-spell-attack',
    effects: [
      {
        kind: 'targeting',
        target: 'chosen-creatures',
        targetType: 'creature',
        canSelectSameTargetMultipleTimes: true,
      },
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
      {
        kind: 'note',
        text: 'Each beam requires a separate ranged spell attack roll.',
      },
    ],
    description: {
      full: 'You hurl a beam of crackling energy. Make a ranged spell attack against one creature or object in range. On a hit, the target takes 1d10 Force damage. Cantrip Upgrade. The spell creates two beams at level 5, three beams at level 11, and four beams at level 17. You can direct the beams at the same target or at different ones. Make a separate attack roll for each beam.',
      summary: 'Ranged spell attack dealing 1d10 force damage per beam; beam count increases at levels 5, 11, and 17.',
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
    id: 'mage-hand',
    name: 'Mage Hand',
    school: 'conjuration',
    level: 0,
    classes: ['bard', 'sorcerer', 'warlock', 'wizard'],
    effects: [{ kind: 'note', text: '' }],
  },
  {
    id: 'prestidigitation',
    name: 'Prestidigitation',
    school: 'transmutation',
    level: 0,
    classes: ['bard', 'sorcerer', 'warlock', 'wizard'],
    effects: [{ kind: 'note', text: '' }],
  },
  {
    id: 'light',
    name: 'Light',
    school: 'evocation',
    level: 0,
    classes: ['bard', 'cleric', 'sorcerer', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'touch' },
    duration: { kind: 'timed', value: 1, unit: 'hour' },
    components: { verbal: true, material: { description: 'a firefly or phosphorescent moss' } },
    effects: [
      {
        kind: 'targeting',
        target: 'one-creature',
        targetType: 'creature',
      },
      {
        kind: 'note',
        text: 'You touch one object that is no larger than 10 feet in any dimension. The object sheds bright light in a 20-foot radius and dim light for an additional 20 feet.',
      },
    ],
    description: {
      full: 'You touch one object that is no larger than 10 feet in any dimension. Until the spell ends, the object sheds bright light in a 20-foot radius and dim light for an additional 20 feet. The light can be colored as you like. Completely covering the object with something opaque blocks the light. The spell ends if you cast it again or dismiss it as an action.',
      summary: 'An object you touch sheds bright light in a 20-foot radius for 1 hour.',
    },
  },
  {
    id: 'magic-missile',
    name: 'Magic Missile',
    school: 'evocation',
    level: 1,
    classes: ['sorcerer', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 120, unit: 'ft' } },
    duration: { kind: 'instantaneous' },
    components: { verbal: true, somatic: true },
    effects: [
      {
        kind: 'targeting',
        target: 'chosen-creatures',
        targetType: 'creature',
        rangeFeet: 120,
        requiresSight: true,
        count: 3,
        canSelectSameTargetMultipleTimes: true,
      },
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
      {
        kind: 'note',
        text: 'Each dart hits automatically and can be directed at one creature or split among several creatures you can see within range.',
      },
    ],
    scaling: [{ category: 'extra-damage', description: 'One additional dart per slot level above 1st.', mode: 'per-slot-level', startsAtSlotLevel: 1 }],
    description: {
      full: 'You create three glowing darts of magical force. Each dart strikes a creature of your choice that you can see within range. A dart deals 1d4 + 1 Force damage to its target. The darts all strike simultaneously, and you can direct them to hit one creature or several.',
      summary: 'Three automatic-hit darts deal 1d4 + 1 force damage each and can be split among visible creatures in range.',
    },
  },
  {
    id: 'shield',
    name: 'Shield',
    school: 'abjuration',
    level: 1,
    classes: ['sorcerer', 'wizard'],
    castingTime: {
      normal: {
        value: 1,
        unit: 'reaction',
        trigger: 'when you are hit by an attack or targeted by the magic missile spell',
      },
    },
    range: { kind: 'self' },
    duration: {
      kind: 'until-turn-boundary',
      subject: 'self',
      turn: 'next',
      boundary: 'start',
    },
    components: { verbal: true, somatic: true },
    effects: [
      {
        kind: 'modifier',
        target: 'armor_class',
        mode: 'add',
        value: 5,
        text: 'Including against the triggering attack.',
      },
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
        notes: 'You take no damage from Magic Missile.',
      },
    ],
    description: {
      full: 'An imperceptible barrier of magical force protects you. Until the start of your next turn, you have a +5 bonus to AC, including against the triggering attack, and you take no damage from Magic Missile.',
      summary: 'Reaction spell that grants +5 AC until the start of your next turn and negates Magic Missile damage.',
    },
  },
  {
    id: 'cure-wounds',
    name: 'Cure Wounds',
    school: 'abjuration',
    level: 1,
    classes: ['bard', 'cleric', 'druid', 'paladin', 'ranger'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'touch' },
    duration: { kind: 'instantaneous' },
    components: { verbal: true, somatic: true },
    effects: [
      { kind: 'targeting', target: 'one-creature', targetType: 'creature' },
      {
        kind: 'note',
        text: 'The target regains 2d8 + your spellcasting ability modifier Hit Points. Dice-based healing with ability modifier is under-modeled.',
      },
    ],
    scaling: [{
      category: 'extra-healing',
      description: 'The healing increases by 2d8 for each spell slot level above 1.',
      mode: 'per-slot-level',
      startsAtSlotLevel: 1,
      amount: '2d8',
    }],
    description: {
      full: 'A creature you touch regains a number of Hit Points equal to 2d8 plus your spellcasting ability modifier. Using a Higher-Level Spell Slot. The healing increases by 2d8 for each spell slot level above 1.',
      summary: 'Touch a creature to restore 2d8 + spellcasting modifier HP.',
    },
  },
  {
    id: 'healing-word',
    name: 'Healing Word',
    school: 'abjuration',
    level: 1,
    classes: ['bard', 'cleric', 'druid'],
    castingTime: { normal: { value: 1, unit: 'bonus-action' } },
    range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
    duration: { kind: 'instantaneous' },
    components: { verbal: true },
    effects: [
      { kind: 'targeting', target: 'one-creature', targetType: 'creature', requiresSight: true },
      {
        kind: 'note',
        text: 'The target regains 2d4 + your spellcasting ability modifier Hit Points. Dice-based healing with ability modifier is under-modeled.',
      },
    ],
    scaling: [{
      category: 'extra-healing',
      description: 'The healing increases by 2d4 for each spell slot level above 1.',
      mode: 'per-slot-level',
      startsAtSlotLevel: 1,
      amount: '2d4',
    }],
    description: {
      full: 'A creature of your choice that you can see within range regains Hit Points equal to 2d4 plus your spellcasting ability modifier. Using a Higher-Level Spell Slot. The healing increases by 2d4 for each spell slot level above 1.',
      summary: 'A creature you can see within 60 feet regains 2d4 + spellcasting modifier HP.',
    },
  },
  {
    id: 'thunderwave',
    name: 'Thunderwave',
    school: 'evocation',
    level: 1,
    classes: ['bard', 'druid', 'sorcerer', 'wizard'],
    effects: [{ kind: 'note', text: '' }],
  },
  {
    id: 'detect-magic',
    name: 'Detect Magic',
    school: 'divination',
    level: 1,
    classes: ['bard', 'cleric', 'druid', 'paladin', 'ranger', 'sorcerer', 'wizard'],
    effects: [{ kind: 'note', text: '' }],
    description: {
      full: '',
      summary: '',
    },
  },
  {
    id: 'guiding-bolt',
    name: 'Guiding Bolt',
    school: 'evocation',
    level: 1,
    classes: ['cleric'],
    effects: [{ kind: 'note', text: '' }],
  },
  {
    id: 'sleep',
    name: 'Sleep',
    school: 'enchantment',
    level: 1,
    classes: ['bard', 'sorcerer', 'wizard'],
    effects: [{ kind: 'note', text: '' }],
  },
  {
    id: 'charm-person',
    name: 'Charm Person',
    school: 'enchantment',
    level: 1,
    classes: ['bard', 'druid', 'sorcerer', 'warlock', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 30, unit: 'ft' } },
    duration: { kind: 'timed', value: 1, unit: 'hour' },
    components: { verbal: true, somatic: true },
    effects: [
      { kind: 'targeting', target: 'one-creature', targetType: 'creature' },
      {
        kind: 'save',
        save: { ability: 'wis' },
        onFail: [
          { kind: 'condition', conditionId: 'charmed' },
        ],
        text: 'The target has Advantage on this save if you or your allies are fighting it.',
      },
      {
        kind: 'note',
        text: 'The Charmed creature is Friendly to you. When the spell ends, the target knows it was Charmed by you. The spell ends early if you or your allies damage the target.',
      },
    ],
    scaling: [{
      category: 'extra-targets',
      description: 'You can target one additional creature for each spell slot level above 1.',
      mode: 'per-slot-level',
      startsAtSlotLevel: 1,
    }],
    description: {
      full: 'One Humanoid you can see within range makes a Wisdom saving throw. It does so with Advantage if you or your allies are fighting it. On a failed save, the target has the Charmed condition until the spell ends or until you or your allies damage it. The Charmed creature is Friendly to you. When the spell ends, the target knows it was Charmed by you. Using a Higher-Level Spell Slot. You can target one additional creature for each spell slot level above 1.',
      summary: 'A humanoid makes a Wisdom save or is Charmed for 1 hour; Friendly to you while Charmed.',
    },
  },
  {
    id: 'protection-from-evil',
    name: 'Protection from Evil and Good',
    school: 'abjuration',
    level: 1,
    classes: ['cleric', 'druid', 'paladin', 'warlock', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'touch' },
    duration: { kind: 'timed', value: 10, unit: 'minute', concentration: true },
    components: { verbal: true, somatic: true, material: { description: 'a flask of Holy Water', cost: { value: 25, unit: 'gp', atLeast: true }, consumed: true } },
    effects: [
      { kind: 'targeting', target: 'one-creature', targetType: 'creature' },
      {
        kind: 'roll-modifier',
        appliesTo: 'attack-rolls',
        modifier: 'disadvantage',
        condition: EXTRAPLANAR_CREATURE_TYPES,
      },
      {
        kind: 'grant',
        grantType: 'condition-immunity',
        value: 'charmed',
        condition: EXTRAPLANAR_CREATURE_TYPES,
        text: 'Also immune to possession from these creature types.',
      },
      {
        kind: 'grant',
        grantType: 'condition-immunity',
        value: 'frightened',
        condition: EXTRAPLANAR_CREATURE_TYPES,
      },
      {
        kind: 'note',
        text: 'If the target is already possessed, Charmed, or Frightened by such a creature, the target has Advantage on any new saving throw against the relevant effect.',
      },
    ],
    description: {
      full: 'Until the spell ends, one willing creature you touch is protected against creatures that are Aberrations, Celestials, Elementals, Fey, Fiends, or Undead. The protection grants several benefits. Creatures of those types have Disadvantage on attack rolls against the target. The target also can\'t be possessed by or gain the Charmed or Frightened conditions from them. If the target is already possessed, Charmed, or Frightened by such a creature, the target has Advantage on any new saving throw against the relevant effect.',
      summary: 'Touch a willing creature to protect it against Aberrations, Celestials, Elementals, Fey, Fiends, and Undead for up to 10 minutes.',
    },
  },
  {
    id: 'bless',
    name: 'Bless',
    school: 'enchantment',
    level: 1,
    classes: ['cleric', 'paladin'],
    effects: [{ kind: 'note', text: '' }],
    description: {
      full: '',
      summary: '',
    },
  },
  {
    id: 'feather-fall',
    name: 'Feather Fall',
    school: 'transmutation',
    level: 1,
    classes: ['bard', 'sorcerer', 'wizard'],
    effects: [{ kind: 'note', text: '' }],
    description: {
      full: '',
      summary: '',
    },
  },
  {
    id: 'identify',
    name: 'Identify',
    school: 'divination',
    level: 1,
    classes: ['bard', 'wizard'],
    effects: [{ kind: 'note', text: '' }],
    description: {
      full: '',
      summary: '',
    },
  },
  // ═══════════════════════════════════════════════════════════════
  // 2nd Level
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'misty-step',
    name: 'Misty Step',
    school: 'conjuration',
    level: 2,
    classes: ['sorcerer', 'warlock', 'wizard'],
    effects: [{ kind: 'note', text: '' }],
    description: {
      full: '',
      summary: '',
    },
  },
  {
    id: 'spiritual-weapon',
    name: 'Spiritual Weapon',
    school: 'evocation',
    level: 2,
    classes: ['cleric'],
    effects: [{ kind: 'note', text: '' }],
    description: {
      full: '',
      summary: '',
    },
  },
  {
    id: 'hold-person',
    name: 'Hold Person',
    school: 'enchantment',
    level: 2,
    classes: ['bard', 'cleric', 'druid', 'sorcerer', 'warlock', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
    duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true, material: { description: 'a straight piece of iron' } },
    effects: [
      {
        kind: 'targeting',
        target: 'one-creature',
        targetType: 'creature',
        requiresSight: true,
        condition: { kind: 'creature-type', target: 'target', creatureTypes: ['humanoid'] },
      },
      {
        kind: 'save',
        save: { ability: 'wis' },
        onFail: [{ kind: 'condition', conditionId: 'paralyzed' }],
      },
      {
        kind: 'note',
        text: 'At the end of each of its turns, the target repeats the save, ending the spell on itself on a success.',
      },
    ],
    scaling: [{
      category: 'extra-targets',
      description: 'You can target one additional Humanoid for each spell slot level above 2.',
      mode: 'per-slot-level',
      startsAtSlotLevel: 2,
    }],
    description: {
      full: 'Choose a Humanoid that you can see within range. The target must succeed on a Wisdom saving throw or have the Paralyzed condition for the duration. At the end of each of its turns, the target repeats the save, ending the spell on itself on a success. Using a Higher-Level Spell Slot. You can target one additional Humanoid for each spell slot level above 2.',
      summary: 'A humanoid you can see makes a Wisdom save or is Paralyzed; repeats save at end of each turn.',
    },
  },
  {
    id: 'scorching-ray',
    name: 'Scorching Ray',
    school: 'evocation',
    level: 2,
    classes: ['sorcerer', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 120, unit: 'ft' } },
    duration: { kind: 'instantaneous' },
    components: { verbal: true, somatic: true },
    deliveryMethod: 'ranged-spell-attack',
    effects: [
      {
        kind: 'targeting',
        target: 'chosen-creatures',
        targetType: 'creature',
        canSelectSameTargetMultipleTimes: true,
      },
      {
        kind: 'damage',
        damage: '2d6',
        damageType: 'fire',
        instances: { count: 3, canSplitTargets: true, canStackOnSingleTarget: true },
      },
      {
        kind: 'note',
        text: 'Each ray requires a separate ranged spell attack roll.',
      },
    ],
    scaling: [{
      category: 'extra-damage',
      description: 'You create one additional ray for each spell slot level above 2.',
      mode: 'per-slot-level',
      startsAtSlotLevel: 2,
    }],
    description: {
      full: 'You hurl three fiery rays. You can hurl them at one target within range or at several. Make a ranged spell attack for each ray. On a hit, the target takes 2d6 Fire damage. Using a Higher-Level Spell Slot. You create one additional ray for each spell slot level above 2.',
      summary: 'Three ranged spell attacks dealing 2d6 fire damage each; rays can be split among targets.',
    },
  },
  {
    id: 'web',
    name: 'Web',
    school: 'conjuration',
    level: 2,
    classes: ['sorcerer', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
    duration: { kind: 'timed', value: 1, unit: 'hour', concentration: true, upTo: true },
    components: { verbal: true, somatic: true, material: { description: 'a bit of spiderweb' } },
    effects: [
      {
        kind: 'targeting',
        target: 'creatures-in-area',
        area: { kind: 'cube', size: 20 },
      },
      {
        kind: 'save',
        save: { ability: 'dex' },
        onFail: [{ kind: 'condition', conditionId: 'restrained' }],
        text: 'First time a creature enters the webs on a turn or starts its turn there.',
      },
      {
        kind: 'check',
        actor: 'nearby-creature',
        actionRequired: true,
        check: { ability: 'str', skill: 'athletics', dc: 0 },
        onSuccess: [{ kind: 'note', text: 'The creature is no longer Restrained.' }],
        text: 'DC equals your spell save DC. A creature Restrained by the webs can take an action to attempt this check.',
      },
      {
        kind: 'note',
        text: 'The webs are Difficult Terrain and the area is Lightly Obscured. If not anchored between two solid masses or layered across a surface, the web collapses and the spell ends at the start of your next turn. The webs are flammable; any 5-foot Cube exposed to fire burns away in 1 round, dealing 2d4 Fire damage to any creature that starts its turn in the fire.',
      },
    ],
    description: {
      full: "You conjure a mass of sticky webbing at a point within range. The webs fill a 20-foot Cube there for the duration. The webs are Difficult Terrain, and the area within them is Lightly Obscured. If the webs aren't anchored between two solid masses (such as walls or trees) or layered across a floor, wall, or ceiling, the web collapses on itself, and the spell ends at the start of your next turn. Webs layered over a flat surface have a depth of 5 feet. The first time a creature enters the webs on a turn or starts its turn there, it must succeed on a Dexterity saving throw or have the Restrained condition while in the webs or until it breaks free. A creature Restrained by the webs can take an action to make a Strength (Athletics) check against your spell save DC. If it succeeds, it is no longer Restrained. The webs are flammable. Any 5-foot Cube of webs exposed to fire burns away in 1 round, dealing 2d4 Fire damage to any creature that starts its turn in the fire.",
      summary: '20-foot cube of webs; creatures entering or starting a turn make a Dex save or are Restrained. Flammable.',
    },
  },
  {
    id: 'invisibility',
    name: 'Invisibility',
    school: 'illusion',
    level: 2,
    classes: ['bard', 'sorcerer', 'warlock', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'touch' },
    duration: { kind: 'timed', value: 1, unit: 'hour', concentration: true, upTo: true },
    components: { verbal: true, somatic: true, material: { description: 'an eyelash in gum arabic' } },
    effects: [
      { kind: 'targeting', target: 'one-creature', targetType: 'creature' },
      { kind: 'condition', conditionId: 'invisible' },
      {
        kind: 'note',
        text: 'The spell ends early immediately after the target makes an attack roll, deals damage, or casts a spell.',
      },
    ],
    scaling: [{
      category: 'extra-targets',
      description: 'You can target one additional creature for each spell slot level above 2.',
      mode: 'per-slot-level',
      startsAtSlotLevel: 2,
    }],
    description: {
      full: 'A creature you touch has the Invisible condition until the spell ends. The spell ends early immediately after the target makes an attack roll, deals damage, or casts a spell. Using a Higher-Level Spell Slot. You can target one additional creature for each spell slot level above 2.',
      summary: 'A creature you touch becomes Invisible for up to 1 hour; ends if the target attacks, deals damage, or casts a spell.',
    },
  },
  {
    id: 'silence',
    name: 'Silence',
    school: 'illusion',
    level: 2,
    classes: ['bard', 'cleric', 'ranger'],
    effects: [{ kind: 'note', text: '' }],
    description: {
      full: '',
      summary: '',
    },
  },
  {
    id: 'lesser-restoration',
    name: 'Lesser Restoration',
    school: 'abjuration',
    level: 2,
    classes: ['bard', 'cleric', 'druid', 'paladin', 'ranger'],
    effects: [{ kind: 'note', text: '' }],
    description: {
      full: '',
      summary: '',
    },
  },
  {
    id: 'fireball',
    name: 'Fireball',
    school: 'evocation',
    level: 3,
    classes: ['sorcerer', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 150, unit: 'ft' } },
    duration: { kind: 'instantaneous' },
    components: { verbal: true, somatic: true, material: { description: 'a ball of bat guano and sulfur' } },
    effects: [
      {
        kind: 'targeting',
        target: 'creatures-in-area',
        targetType: 'creature',
        rangeFeet: 150,
        area: {
          kind: 'sphere',
          size: 20,
        },
      },
      {
        kind: 'save',
        save: { ability: 'dex' },
        onFail: [{ kind: 'damage', damage: '8d6', damageType: 'fire' }],
        onSuccess: [{ kind: 'damage', damage: '4d6', damageType: 'fire' }],
      },
      {
        kind: 'note',
        text: "Flammable objects in the area that aren't being worn or carried start burning.",
      },
    ],
    scaling: [{ category: 'extra-damage', description: 'Damage increases by 1d6 for each slot level above 3rd.', mode: 'per-slot-level', startsAtSlotLevel: 3, amount: '1d6' }],
    description: {
      full: "A bright streak flashes from you to a point you choose within range and then blossoms with a low roar into a fiery explosion. Each creature in a 20-foot-radius Sphere centered on that point makes a Dexterity saving throw, taking 8d6 Fire damage on a failed save or half as much damage on a successful one. Flammable objects in the area that aren't being worn or carried start burning.",
      summary: '20-foot-radius fire explosion dealing 8d6 fire damage; Dexterity save for half.',
    },
  },
  {
    id: 'counterspell',
    name: 'Counterspell',
    school: 'abjuration',
    level: 3,
    classes: ['sorcerer', 'warlock', 'wizard'],
    effects: [{ kind: 'note', text: '' }],
    description: {
      full: '',
      summary: '',
    },
  },
  {
    id: 'spirit-guardians',
    name: 'Spirit Guardians',
    school: 'conjuration',
    level: 3,
    classes: ['cleric'],
    effects: [{ kind: 'note', text: '' }],
    description: {
      full: '',
      summary: '',
    },
  },
  {
    id: 'revivify',
    name: 'Revivify',
    school: 'necromancy',
    level: 3,
    classes: ['cleric', 'paladin'],
    effects: [{ kind: 'note', text: '' }],
    description: {
      full: '',
      summary: '',
    },
  },
  {
    id: 'haste',
    name: 'Haste',
    school: 'transmutation',
    level: 3,
    classes: ['sorcerer', 'wizard'],
    effects: [{ kind: 'note', text: '' }],
    description: {
      full: '',
      summary: '',
    },
  },
  {
    id: 'lightning-bolt',
    name: 'Lightning Bolt',
    school: 'evocation',
    level: 3,
    classes: ['sorcerer', 'wizard'],
    effects: [{ kind: 'note', text: '' }],
    description: {
      full: '',
      summary: '',
    },
  },
  {
    id: 'fly',
    name: 'Fly',
    school: 'transmutation',
    level: 3,
    classes: ['sorcerer', 'warlock', 'wizard'],
    effects: [{ kind: 'note', text: '' }],
  },
  {
    id: 'dispel-magic',
    name: 'Dispel Magic',
    school: 'abjuration',
    level: 3,
    classes: ['bard', 'cleric', 'druid', 'paladin', 'sorcerer', 'warlock', 'wizard'],
    effects: [{ kind: 'note', text: '' }],
    description: {
      full: '',
      summary: '',
    },
  },
  {
    id: 'remove-curse',
    name: 'Remove Curse',
    school: 'abjuration',
    level: 3,
    classes: ['cleric', 'paladin', 'warlock', 'wizard'],
    effects: [{ kind: 'note', text: '' }],
    description: {
      full: '',
      summary: '',
    },
  },
  {
    id: 'slow',
    name: 'Slow',
    school: 'transmutation',
    level: 3,
    classes: ['sorcerer', 'wizard'],
    effects: [{ kind: 'note', text: '' }],
    description: {
      full: '',
      summary: '',
    },
  },
  // ═══════════════════════════════════════════════════════════════
  // 4th Level
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'dimension-door',
    name: 'Dimension Door',
    school: 'conjuration',
    level: 4,
    classes: ['bard', 'sorcerer', 'warlock', 'wizard'],
    effects: [{ kind: 'note', text: '' }],
    description: {
      full: '',
      summary: '',
    },
  },
  {
    id: 'banishment',
    name: 'Banishment',
    school: 'abjuration',
    level: 4,
    classes: ['cleric', 'paladin', 'sorcerer', 'warlock', 'wizard'],
    effects: [{ kind: 'note', text: '' }],
    description: {
      full: '',
      summary: '',
    },
  },
  {
    id: 'polymorph',
    name: 'Polymorph',
    school: 'transmutation',
    level: 4,
    classes: ['bard', 'druid', 'sorcerer', 'wizard'],
    effects: [{ kind: 'note', text: '' }],
    description: {
      full: '',
      summary: '',
    },
  },
  {
    id: 'ice-storm',
    name: 'Ice Storm',
    school: 'evocation',
    level: 4,
    classes: ['druid', 'sorcerer', 'wizard'],
    effects: [{ kind: 'note', text: '' }],
    description: {
      full: '',
      summary: '',
    },
  },
  {
    id: 'fire-shield',
    name: 'Fire Shield',
    school: 'evocation',
    level: 4,
    classes: ['druid', 'sorcerer', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'self' },
    duration: { kind: 'timed', value: 10, unit: 'minute' },
    components: { verbal: true, somatic: true, material: { description: 'a bit of phosphorus or a firefly' } },
    effects: [
      {
        kind: 'note',
        text: 'Choose warm shield (Resistance to Cold, retaliatory 2d8 Fire) or chill shield (Resistance to Fire, retaliatory 2d8 Cold). Shield variant selection is under-modeled.',
      },
      {
        kind: 'trigger',
        trigger: 'hit',
        effects: [{ kind: 'damage', damage: '2d8' }],
        text: 'When a creature within 5 feet hits you with a melee attack roll. Damage type is Fire (warm) or Cold (chill) depending on shield choice.',
      },
    ],
    description: {
      full: 'Wispy flames wreathe your body for the duration, shedding Bright Light in a 10-foot radius and Dim Light for an additional 10 feet. The flames provide you with a warm shield or a chill shield, as you choose. The warm shield grants you Resistance to Cold damage, and the chill shield grants you Resistance to Fire damage. In addition, whenever a creature within 5 feet of you hits you with a melee attack roll, the shield erupts with flame. The attacker takes 2d8 Fire damage from a warm shield or 2d8 Cold damage from a chill shield.',
      summary: 'Flames wreathe you for 10 minutes, granting damage resistance and dealing 2d8 retaliatory damage when hit in melee.',
    },
  },
  {
    id: 'wall-of-force',
    name: 'Wall of Force',
    school: 'evocation',
    level: 5,
    classes: ['wizard'],
    effects: [{ kind: 'note', text: '' }],
  },
  {
    id: 'greater-restoration',
    name: 'Greater Restoration',
    school: 'abjuration',
    level: 5,
    classes: ['bard', 'cleric', 'druid'],
    effects: [{ kind: 'note', text: '' }],
    description: {
      full: '',
      summary: '',
    },
  },
  {
    id: 'raise-dead',
    name: 'Raise Dead',
    school: 'necromancy',
    level: 5,
    classes: ['bard', 'cleric', 'paladin'],
    effects: [{ kind: 'note', text: '' }],
    description: {
      full: '',
      summary: '',
    },
  },
  {
    id: 'chain-lightning',
    name: 'Chain Lightning',
    school: 'evocation',
    level: 6,
    classes: ['sorcerer', 'wizard'],
    effects: [{ kind: 'note', text: '' }],
  },
  {
    id: 'disintegrate',
    name: 'Disintegrate',
    school: 'transmutation',
    level: 6,
    classes: ['sorcerer', 'wizard'],
    effects: [{ kind: 'note', text: '' }],
    description: {
      full: '',
      summary: '',
    },
  },
  {
    id: 'teleport',
    name: 'Teleport',
    school: 'conjuration',
    level: 7,
    classes: ['bard', 'sorcerer', 'wizard'],
    effects: [{ kind: 'note', text: '' }],
    description: {
      full: '',
      summary: '',
    },
  },
  {
    id: 'resurrection',
    name: 'Resurrection',
    school: 'necromancy',
    level: 7,
    classes: ['bard', 'cleric'],
    effects: [{ kind: 'note', text: '' }],
    description: {
      full: '',
      summary: '',
    },
  },
  {
    id: 'power-word-stun',
    name: 'Power Word Stun',
    school: 'enchantment',
    level: 8,
    classes: ['bard', 'sorcerer', 'warlock', 'wizard'],
    effects: [{ kind: 'note', text: '' }],
    description: {
      full: '',
      summary: '',
    },
  },
  {
    id: 'wish',
    name: 'Wish',
    school: 'conjuration',
    level: 9,
    classes: ['sorcerer', 'wizard'],
    effects: [{ kind: 'note', text: '' }],
    description: {
      full: '',
      summary: '',
    },
  },
  {
    id: 'power-word-kill',
    name: 'Power Word Kill',
    school: 'enchantment',
    level: 9,
    classes: ['bard', 'sorcerer', 'warlock', 'wizard'],
    effects: [{ kind: 'note', text: '' }],
    description: {
      full: '',
      summary: '',
    },
  },
];

function toSystemSpell(
  spell: SpellEntry,
  systemId: SystemRulesetId,
): Spell {
  return {
    ...spell,
    source: 'system',
    systemId,
    patched: false,
  } as Spell;
}

const SYSTEM_SPELLS_SRD_CC_V5_2_1: readonly Spell[] = SPELLS_RAW.map(
  (s) => toSystemSpell(s, DEFAULT_SYSTEM_RULESET_ID),
);

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const SYSTEM_SPELLS_BY_SYSTEM_ID: Record<SystemRulesetId, readonly Spell[]> = {
  [DEFAULT_SYSTEM_RULESET_ID]: SYSTEM_SPELLS_SRD_CC_V5_2_1,
};

export function getSystemSpells(systemId: SystemRulesetId): readonly Spell[] {
  return SYSTEM_SPELLS_BY_SYSTEM_ID[systemId] ?? [];
}

export function getSystemSpell(systemId: SystemRulesetId, id: string): Spell | undefined {
  return getSystemSpells(systemId).find((s) => s.id === id);
}
