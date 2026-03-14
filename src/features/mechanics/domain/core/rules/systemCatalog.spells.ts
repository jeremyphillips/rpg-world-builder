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
import type { SystemRulesetId } from './ruleset.types';
import { DEFAULT_SYSTEM_RULESET_ID } from './systemIds';

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
    effects: [{ kind: 'note', text: '' }],
  },
  {
    id: 'eldritch-blast',
    name: 'Eldritch Blast',
    school: 'evocation',
    level: 0,
    classes: ['warlock'],
    effects: [{ kind: 'note', text: '' }],
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
    scaling: [{ category: 'extra-damage', description: 'One additional dart per slot level above 1st.' }],
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
    school: 'evocation',
    level: 1,
    classes: ['bard', 'cleric', 'druid', 'paladin', 'ranger'],
    effects: [{ kind: 'note', text: '' }],
  },
  {
    id: 'healing-word',
    name: 'Healing Word',
    school: 'evocation',
    level: 1,
    classes: ['bard', 'cleric', 'druid'],
    effects: [{ kind: 'note', text: '' }],
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
    effects: [{ kind: 'note', text: '' }],
  },
  {
    id: 'protection-from-evil',
    name: 'Protection from Evil and Good',
    school: 'abjuration',
    level: 1,
    classes: ['cleric', 'paladin', 'warlock', 'wizard'],
    effects: [{ kind: 'note', text: '' }],
  },
  {
    id: 'bless',
    name: 'Bless',
    school: 'enchantment',
    level: 1,
    classes: ['cleric', 'paladin'],
    effects: [{ kind: 'note', text: '' }],
  },
  {
    id: 'feather-fall',
    name: 'Feather Fall',
    school: 'transmutation',
    level: 1,
    classes: ['bard', 'sorcerer', 'wizard'],
    effects: [{ kind: 'note', text: '' }],
  },
  {
    id: 'identify',
    name: 'Identify',
    school: 'divination',
    level: 1,
    classes: ['bard', 'wizard'],
    effects: [{ kind: 'note', text: '' }],
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
  },
  {
    id: 'spiritual-weapon',
    name: 'Spiritual Weapon',
    school: 'evocation',
    level: 2,
    classes: ['cleric'],
    effects: [{ kind: 'note', text: '' }],
  },
  {
    id: 'hold-person',
    name: 'Hold Person',
    school: 'enchantment',
    level: 2,
    classes: ['bard', 'cleric', 'druid', 'sorcerer', 'warlock', 'wizard'],
    effects: [{ kind: 'note', text: '' }],
  },
  {
    id: 'scorching-ray',
    name: 'Scorching Ray',
    school: 'evocation',
    level: 2,
    classes: ['sorcerer', 'wizard'],
    effects: [{ kind: 'note', text: '' }],
  },
  {
    id: 'web',
    name: 'Web',
    school: 'conjuration',
    level: 2,
    classes: ['sorcerer', 'wizard'],
    effects: [{ kind: 'note', text: '' }],
  },
  {
    id: 'invisibility',
    name: 'Invisibility',
    school: 'illusion',
    level: 2,
    classes: ['bard', 'sorcerer', 'warlock', 'wizard'],
    effects: [{ kind: 'note', text: '' }],
  },
  {
    id: 'silence',
    name: 'Silence',
    school: 'illusion',
    level: 2,
    classes: ['bard', 'cleric', 'ranger'],
    effects: [{ kind: 'note', text: '' }],
  },
  {
    id: 'lesser-restoration',
    name: 'Lesser Restoration',
    school: 'abjuration',
    level: 2,
    classes: ['bard', 'cleric', 'druid', 'paladin', 'ranger'],
    effects: [{ kind: 'note', text: '' }],
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
    scaling: [{ category: 'extra-damage', description: 'Damage increases by 1d6 for each slot level above 3rd.' }],
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
  },
  {
    id: 'spirit-guardians',
    name: 'Spirit Guardians',
    school: 'conjuration',
    level: 3,
    classes: ['cleric'],
    effects: [{ kind: 'note', text: '' }],
  },
  {
    id: 'revivify',
    name: 'Revivify',
    school: 'necromancy',
    level: 3,
    classes: ['cleric', 'paladin'],
    effects: [{ kind: 'note', text: '' }],
  },
  {
    id: 'haste',
    name: 'Haste',
    school: 'transmutation',
    level: 3,
    classes: ['sorcerer', 'wizard'],
    effects: [{ kind: 'note', text: '' }],
  },
  {
    id: 'lightning-bolt',
    name: 'Lightning Bolt',
    school: 'evocation',
    level: 3,
    classes: ['sorcerer', 'wizard'],
    effects: [{ kind: 'note', text: '' }],
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
  },
  {
    id: 'remove-curse',
    name: 'Remove Curse',
    school: 'abjuration',
    level: 3,
    classes: ['cleric', 'paladin', 'warlock', 'wizard'],
    effects: [{ kind: 'note', text: '' }],
  },
  {
    id: 'slow',
    name: 'Slow',
    school: 'transmutation',
    level: 3,
    classes: ['sorcerer', 'wizard'],
    effects: [{ kind: 'note', text: '' }],
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
  },
  {
    id: 'banishment',
    name: 'Banishment',
    school: 'abjuration',
    level: 4,
    classes: ['cleric', 'paladin', 'sorcerer', 'warlock', 'wizard'],
    effects: [{ kind: 'note', text: '' }],
  },
  {
    id: 'polymorph',
    name: 'Polymorph',
    school: 'transmutation',
    level: 4,
    classes: ['bard', 'druid', 'sorcerer', 'wizard'],
    effects: [{ kind: 'note', text: '' }],
  },
  {
    id: 'ice-storm',
    name: 'Ice Storm',
    school: 'evocation',
    level: 4,
    classes: ['druid', 'sorcerer', 'wizard'],
    effects: [{ kind: 'note', text: '' }],
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
  },
  {
    id: 'raise-dead',
    name: 'Raise Dead',
    school: 'necromancy',
    level: 5,
    classes: ['bard', 'cleric', 'paladin'],
    effects: [{ kind: 'note', text: '' }],
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
  },
  {
    id: 'teleport',
    name: 'Teleport',
    school: 'conjuration',
    level: 7,
    classes: ['bard', 'sorcerer', 'wizard'],
    effects: [{ kind: 'note', text: '' }],
  },
  {
    id: 'resurrection',
    name: 'Resurrection',
    school: 'necromancy',
    level: 7,
    classes: ['bard', 'cleric'],
    effects: [{ kind: 'note', text: '' }],
  },
  {
    id: 'power-word-stun',
    name: 'Power Word Stun',
    school: 'enchantment',
    level: 8,
    classes: ['bard', 'sorcerer', 'warlock', 'wizard'],
    effects: [{ kind: 'note', text: '' }],
  },
  {
    id: 'wish',
    name: 'Wish',
    school: 'conjuration',
    level: 9,
    classes: ['sorcerer', 'wizard'],
    effects: [{ kind: 'note', text: '' }],
  },
  {
    id: 'power-word-kill',
    name: 'Power Word Kill',
    school: 'enchantment',
    level: 9,
    classes: ['bard', 'sorcerer', 'warlock', 'wizard'],
    effects: [{ kind: 'note', text: '' }],
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
