import type { ModifierValue } from '@/features/mechanics/domain/effects/effects.types';
import type { SpellEntry } from '../types';

/**
 * Level 4 spells M–Z — authoring status:
 * - **Attack/save/AoE modeled:** Ice Storm, Phantasmal Killer, Wall of Fire, Stoneskin (resistance).
 * - **Utility / sense / state:** Freedom of Movement, Greater Invisibility, Locate Creature, Tongues-adjacent buffs.
 * - **Note-first / heavy caveats:** Guardian of Faith, Hallucinatory Terrain, Private Sanctum, Polymorph, Resilient Sphere, Secret Chest, Stone Shape, Giant Insect.
 */
export const SPELLS_LEVEL_4_M_Z: readonly SpellEntry[] = [
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
    resolution: {
      caveats: [
        'Warm vs chill shield choice and light radius are not toggled.',
      ],
    },
    effects: [
      { kind: 'modifier', target: 'resistance', mode: 'add', value: 'cold' as const },
      {
        kind: 'trigger',
        trigger: 'hit',
        effects: [{ kind: 'damage', damage: '2d8', damageType: 'fire' }],
        text: 'When a creature within 5 feet hits you with a melee attack roll.',
      },
      { kind: 'note', text: 'Caster chooses warm shield (Resistance Cold, retaliatory Fire) or chill shield (Resistance Fire, retaliatory Cold). Modeled as warm shield.', category: 'flavor' as const },
    ],
    description: {
      full: 'Wispy flames wreathe your body for the duration, shedding Bright Light in a 10-foot radius and Dim Light for an additional 10 feet. The flames provide you with a warm shield or a chill shield, as you choose. The warm shield grants you Resistance to Cold damage, and the chill shield grants you Resistance to Fire damage. In addition, whenever a creature within 5 feet of you hits you with a melee attack roll, the shield erupts with flame. The attacker takes 2d8 Fire damage from a warm shield or 2d8 Cold damage from a chill shield.',
      summary: 'Flames wreathe you for 10 minutes, granting damage resistance and dealing 2d8 retaliatory damage when hit in melee.',
    },
  },
{
    id: 'freedom-of-movement',
    name: 'Freedom of Movement',
    school: 'abjuration',
    level: 4,
    classes: ['bard', 'cleric', 'druid', 'ranger'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'touch' },
    duration: { kind: 'timed', value: 1, unit: 'hour' },
    components: { verbal: true, somatic: true, material: { description: 'a leather strap' } },
    resolution: {
      caveats: [
        'Paralyzed/Restrained immunity and escape restraints are not fully automated.',
      ],
    },
    effects: [
      { kind: 'targeting', target: 'one-creature', targetType: 'creature', requiresWilling: true },
      {
        kind: 'state',
        stateId: 'freedom-of-movement',
        notes: 'Ignore Difficult Terrain; Speed cannot be reduced by magic; immune to Paralyzed and Restrained; Swim Speed equals Speed; 5 ft of movement to escape nonmagical restraints.',
      },
    ],
    scaling: [{ category: 'extra-targets', description: '+1 target per spell slot level above 4', mode: 'per-slot-level', startsAtSlotLevel: 5 }],
    description: {
      full: "You touch a willing creature. For the duration, the target's movement is unaffected by Difficult Terrain, and spells and other magical effects can neither reduce the target's Speed nor cause the target to have the Paralyzed or Restrained conditions. The target also has a Swim Speed equal to its Speed. In addition, the target can spend 5 feet of movement to automatically escape from nonmagical restraints, such as manacles or a creature imposing the Grappled condition on it. Using a Higher-Level Spell Slot. You can target one additional creature for each spell slot level above 4.",
      summary: 'Immune to movement reduction, Paralyzed, Restrained. Swim Speed. Escape restraints. Scales with targets.',
    },
  },
{
    id: 'giant-insect',
    name: 'Giant Insect',
    school: 'conjuration',
    level: 4,
    classes: ['druid'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
    duration: { kind: 'timed', value: 10, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true },
    resolution: {
      caveats: [
        'Summoned insect is not represented as a full combatant in encounter.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Summon giant centipede, spider, or wasp. Uses Giant Insect stat block. Ally, shares Initiative. Use slot level for spell level in stat block.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "You summon a giant centipede, spider, or wasp (chosen when you cast the spell). It manifests in an unoccupied space you can see within range and uses the Giant Insect stat block. The form you choose determines certain details in its stat block. The creature disappears when it drops to 0 Hit Points or when the spell ends. The creature is an ally to you and your allies. In combat, the creature shares your Initiative count, but it takes its turn immediately after yours. It obeys your verbal commands (no action required by you). If you don't issue any, it takes the Dodge action and uses its movement to avoid danger. Using a Higher-Level Spell Slot. Use the spell slot's level for the spell's level in the stat block.",
      summary: 'Summon Giant Insect (centipede, spider, or wasp). Stat block scales with slot level.',
    },
  },
{
    id: 'greater-invisibility',
    name: 'Greater Invisibility',
    school: 'illusion',
    level: 4,
    classes: ['bard', 'sorcerer', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'touch' },
    duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true },
    resolution: {
      caveats: [
        'Invisibility does not end on attack or spell (unlike lesser Invisibility).',
      ],
    },
    effects: [
      { kind: 'targeting', target: 'one-creature', targetType: 'creature', requiresWilling: true },
      { kind: 'condition', conditionId: 'invisible' },
      { kind: 'roll-modifier', appliesTo: 'attack rolls', modifier: 'advantage' },
      { kind: 'roll-modifier', appliesTo: 'attacks against', modifier: 'disadvantage' },
    ],
    description: {
      full: "A creature you touch has the Invisible condition until the spell ends.",
      summary: 'Touch grants Invisible. Does not end on attack or spell.',
    },
  },
{
    id: 'guardian-of-faith',
    name: 'Guardian of Faith',
    school: 'conjuration',
    level: 4,
    classes: ['cleric'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 30, unit: 'ft' } },
    duration: { kind: 'timed', value: 8, unit: 'hour' },
    components: { verbal: true },
    resolution: {
      caveats: [
        '60 damage cap, first-time-on-turn triggers, and half damage on success are not automated.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Large spectral guardian. Enemy that moves within 10 ft for the first time on a turn or starts its turn there: Dex save or 20 Radiant (half on success). Vanishes after 60 total damage dealt.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "A Large spectral guardian appears and hovers for the duration in an unoccupied space that you can see within range. The guardian occupies that space and is invulnerable, and it appears in a form appropriate for your deity or pantheon. Any enemy that moves to a space within 10 feet of the guardian for the first time on a turn or starts its turn there makes a Dexterity saving throw, taking 20 Radiant damage on a failed save or half as much damage on a successful one. The guardian vanishes when it has dealt a total of 60 damage.",
      summary: 'Spectral guardian. Dex save or 20 radiant when entering/starting turn in 10ft. Vanishes at 60 damage.',
    },
  },
{
    id: 'hallucinatory-terrain',
    name: 'Hallucinatory Terrain',
    school: 'illusion',
    level: 4,
    classes: ['bard', 'druid', 'warlock', 'wizard'],
    castingTime: { normal: { value: 10, unit: 'minute' } },
    range: { kind: 'distance', value: { value: 300, unit: 'ft' } },
    duration: { kind: 'timed', value: 24, unit: 'hour' },
    components: { verbal: true, somatic: true, material: { description: 'a mushroom' } },
    resolution: {
      caveats: [
        'Illusory terrain and interaction checks are not simulated in encounter.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: '150-foot Cube natural terrain looks, sounds, and smells like another sort. Touch unchanged. Study + Investigation vs. spell save DC to disbelieve.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "You make natural terrain in a 150-foot Cube in range look, sound, and smell like another sort of natural terrain. Thus, open fields or a road can be made to resemble a swamp, hill, crevasse, or some other difficult or impassable terrain. A pond can be made to seem like a grassy meadow, a precipice like a gentle slope, or a rock-strewn gully like a wide and smooth road. Manufactured structures, equipment, and creatures within the area aren't changed. The tactile characteristics of the terrain are unchanged, so creatures entering the area are likely to notice the illusion. If the difference isn't obvious by touch, a creature examining the illusion can take the Study action to make an Intelligence (Investigation) check against your spell save DC to disbelieve it. If a creature discerns that the terrain is illusory, the creature sees a vague image superimposed on the real terrain.",
      summary: 'Illusory terrain in 150ft cube. Study + Investigation to disbelieve.',
    },
  },
{
    id: 'ice-storm',
    name: 'Ice Storm',
    school: 'evocation',
    level: 4,
    classes: ['druid', 'sorcerer', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 300, unit: 'ft' } },
    duration: { kind: 'instantaneous' },
    components: { verbal: true, somatic: true, material: { description: 'a mitten' } },
    resolution: {
      caveats: [
        'Difficult Terrain duration is not tracked automatically.',
      ],
    },
    effects: [
      { kind: 'targeting', target: 'creatures-in-area', targetType: 'creature', area: { kind: 'cylinder', size: 20 } },
      {
        kind: 'save',
        save: { ability: 'dex' },
        onFail: [
          { kind: 'damage', damage: '2d10', damageType: 'bludgeoning' },
          { kind: 'damage', damage: '4d6', damageType: 'cold' },
        ],
        onSuccess: [
          { kind: 'damage', damage: '1d10', damageType: 'bludgeoning' },
          { kind: 'damage', damage: '2d6', damageType: 'cold' },
        ],
      },
      { kind: 'note', text: 'Ground in the area becomes Difficult Terrain until the end of your next turn.', category: 'flavor' as const },
    ],
    scaling: [{ category: 'extra-damage', description: '+1d10 bludgeoning per slot level above 4', mode: 'per-slot-level', startsAtSlotLevel: 5, amount: '1d10' }],
    description: {
      full: "Hail falls in a 20-foot-radius, 40-foot-high Cylinder centered on a point within range. Each creature in the Cylinder makes a Dexterity saving throw. A creature takes 2d10 Bludgeoning damage and 4d6 Cold damage on a failed save or half as much damage on a successful one. Hailstones turn ground in the Cylinder into Difficult Terrain until the end of your next turn. Using a Higher-Level Spell Slot. The Bludgeoning damage increases by 1d10 for each spell slot level above 4.",
      summary: '20ft radius cylinder: Dex save or 2d10 bludgeoning + 4d6 cold. Difficult Terrain. Bludgeoning scales.',
    },
  },
{
    id: 'locate-creature',
    name: 'Locate Creature',
    school: 'divination',
    level: 4,
    classes: ['bard', 'cleric', 'druid', 'paladin', 'ranger', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'self' },
    duration: { kind: 'timed', value: 1, unit: 'hour', concentration: true, upTo: true },
    components: { verbal: true, somatic: true, material: { description: 'fur from a bloodhound' } },
    resolution: {
      caveats: [
        'Lead blocking and alternate forms are not validated automatically.',
      ],
    },
    effects: [
      { kind: 'state', stateId: 'locate-creature', notes: 'Sense direction to familiar creature within 1,000 ft. Specific creature or nearest of a kind (seen within 30ft).' },
      { kind: 'note', text: 'Does not locate creature in a different form (Polymorph, Flesh to Stone). Blocked by any thickness of lead.', category: 'flavor' as const },
    ],
    description: {
      full: "Describe or name a creature that is familiar to you. You sense the direction to the creature's location if that creature is within 1,000 feet of you. If the creature is moving, you know the direction of its movement. The spell can locate a specific creature known to you or the nearest creature of a specific kind (such as a human or a unicorn) if you have seen such a creature up close—within 30 feet—at least once. If the creature you described or named is in a different form, such as under the effects of a Flesh to Stone or Polymorph spell, this spell doesn't locate the creature. This spell can't locate a creature if any thickness of lead blocks a direct path between you and the creature.",
      summary: 'Sense direction to creature within 1,000 ft. Blocked by lead, different form.',
    },
  },
{
    id: 'phantasmal-killer',
    name: 'Phantasmal Killer',
    school: 'illusion',
    level: 4,
    classes: ['bard', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 120, unit: 'ft' } },
    duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true },
    resolution: {
      caveats: [
        'End-of-turn repeat saves and damage-on-failed-repeat are not fully automated.',
      ],
    },
    effects: [
      { kind: 'targeting', target: 'one-creature', targetType: 'creature' },
      {
        kind: 'save',
        save: { ability: 'wis' },
        onFail: [
          { kind: 'damage', damage: '4d10', damageType: 'psychic' },
          { kind: 'state', stateId: 'terrified', notes: 'Disadvantage on ability checks and attack rolls.', repeatSave: { ability: 'wis', timing: 'turn-end' } },
        ],
        onSuccess: [{ kind: 'damage', damage: '2d10', damageType: 'psychic' }],
      },
      { kind: 'note', text: 'Failed repeat save deals 4d10 psychic damage again.', category: 'under-modeled' as const },
    ],
    scaling: [{ category: 'extra-damage', description: '+1d10 psychic per slot level above 4', mode: 'per-slot-level', startsAtSlotLevel: 5, amount: '1d10' }],
    description: {
      full: "You tap into the nightmares of a creature you can see within range and create an illusion of its deepest fears, visible only to that creature. The target makes a Wisdom saving throw. On a failed save, the target takes 4d10 Psychic damage and has Disadvantage on ability checks and attack rolls for the duration. On a successful save, the target takes half as much damage, and the spell ends. For the duration, the target makes a Wisdom saving throw at the end of each of its turns. On a failed save, it takes the Psychic damage again. On a successful save, the spell ends. Using a Higher-Level Spell Slot. The damage increases by 1d10 for each spell slot level above 4.",
      summary: 'Wis save or 4d10 psychic, Disadvantage. Repeat save each turn. +1d10 per slot.',
    },
  },
{
    id: 'polymorph',
    name: 'Polymorph',
    school: 'transmutation',
    level: 4,
    classes: ['bard', 'druid', 'sorcerer', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
    duration: { kind: 'timed', value: 1, unit: 'hour', concentration: true, upTo: true },
    components: { verbal: true, somatic: true, material: { description: 'a caterpillar cocoon' } },
    resolution: {
      caveats: [
        'Beast stat block, temp HP, and gear melding are not enforced automatically.',
      ],
    },
    effects: [
      { kind: 'targeting', target: 'one-creature', targetType: 'creature' },
      {
        kind: 'save',
        save: { ability: 'wis' },
        onFail: [
          {
            kind: 'note',
            text: 'Shape-shift into a Beast form: stats replaced by Beast stat block; retain alignment, personality, creature type, HP, HP Dice; gain Temp HP equal to Beast HP; spell ends early if Temp HP reaches 0.',
            category: 'under-modeled' as const,
          },
        ],
      },
    ],
    description: {
      full: "You attempt to transform a creature that you can see within range into a Beast. The target must succeed on a Wisdom saving throw or shape-shift into a Beast form for the duration. That form can be any Beast you choose that has a Challenge Rating equal to or less than the target's (or the target's level if it doesn't have a Challenge Rating). The target's game statistics are replaced by the stat block of the chosen Beast, but the target retains its alignment, personality, creature type, Hit Points, and Hit Point Dice. The target gains Temporary Hit Points equal to the Hit Points of the Beast form. These vanish if any remain when the spell ends. The spell ends early on the target if it has no Temporary Hit Points left. The target is limited by the anatomy of its new form and can't speak or cast spells. The target's gear melds into the new form.",
      summary: 'Wis save or become Beast. Stats replaced, Temp HP. Ends if Temp HP gone.',
    },
  },
{
    id: 'private-sanctum',
    name: 'Private Sanctum',
    school: 'abjuration',
    level: 4,
    classes: ['wizard'],
    castingTime: { normal: { value: 10, unit: 'minute' } },
    range: { kind: 'distance', value: { value: 120, unit: 'ft' } },
    duration: { kind: 'timed', value: 24, unit: 'hour' },
    components: { verbal: true, somatic: true, material: { description: 'a thin sheet of lead' } },
    resolution: {
      caveats: [
        'Chosen ward properties and 365-day until-dispelled rule are not enforced automatically.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Cube 5–100 ft per side. Choose: no sound through barrier; dark/foggy barrier; no Divination sensors; no Divination targeting; no teleport; no planar travel. Cast 365 days same spot = until dispelled. +100 ft per slot.',
        category: 'under-modeled' as const,
      },
    ],
    scaling: [{ category: 'expanded-area', description: '+100 feet per side per spell slot level above 4', mode: 'per-slot-level', startsAtSlotLevel: 5 }],
    description: {
      full: "You make an area within range magically secure. The area is a Cube that can be as small as 5 feet to as large as 100 feet on each side. When you cast the spell, you decide what sort of security the spell provides: sound can't pass through; barrier appears dark and foggy; Divination sensors can't appear or pass through; creatures can't be targeted by Divination; nothing can teleport in or out; planar travel blocked. Casting this spell on the same spot every day for 365 days makes the spell last until dispelled. Using a Higher-Level Spell Slot. You can increase the size of the Cube by 100 feet for each spell slot level above 4.",
      summary: 'Secure cube with chosen properties. 365 days = until dispelled. +100ft per slot.',
    },
  },
{
    id: 'resilient-sphere',
    name: 'Resilient Sphere',
    school: 'abjuration',
    level: 4,
    classes: ['wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 30, unit: 'ft' } },
    duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true, material: { description: 'a glass sphere' } },
    resolution: {
      caveats: [
        'Barrier interaction, rolling the sphere, and Disintegrate interaction are not fully modeled.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Shimmering sphere encloses Large or smaller creature/object. Unwilling: Dex save or enclosed. Nothing passes in or out; sphere immune to damage. Action to push and roll at half Speed. Disintegrate destroys the sphere.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "A shimmering sphere encloses a Large or smaller creature or object within range. An unwilling creature must succeed on a Dexterity saving throw or be enclosed for the duration. Nothing—not physical objects, energy, or other spell effects—can pass through the barrier, in or out, though a creature in the sphere can breathe there. The sphere is immune to all damage, and a creature or object inside can't be damaged by attacks or effects originating from outside, nor can a creature inside the sphere damage anything outside it. The sphere is weightless and just large enough to contain the creature or object inside. An enclosed creature can take an action to push against the sphere's walls and thus roll the sphere at up to half the creature's Speed. A Disintegrate spell targeting the globe destroys it without harming anything inside.",
      summary: 'Force sphere. Nothing in/out. Immune to damage. Action to roll. Disintegrate destroys.',
    },
  },
{
    id: 'secret-chest',
    name: 'Secret Chest',
    school: 'conjuration',
    level: 4,
    classes: ['wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'touch' },
    duration: { kind: 'until-dispelled' },
    components: {
      verbal: true,
      somatic: true,
      material: {
        description: 'a chest (3ft×2ft×2ft, rare materials 5,000+ GP) and Tiny replica (50+ GP)',
        cost: { value: 5000, unit: 'gp', atLeast: true },
      },
    },
    resolution: {
      caveats: [
        'Ethereal storage, daily failure chance, and replica destruction are not simulated.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Chest hidden on Ethereal Plane. Magic action + touch replica: recall chest. Magic action: send back. 12 cubic ft capacity. After 60 days, 5% cumulative daily chance to end. Recasting or destroying replica ends spell.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "You hide a chest and all its contents on the Ethereal Plane. You must touch the chest and the miniature replica that serve as Material components for the spell. The chest can contain up to 12 cubic feet of nonliving material (3 feet by 2 feet by 2 feet). While the chest remains on the Ethereal Plane, you can take a Magic action and touch the replica to recall the chest. It appears in an unoccupied space on the ground within 5 feet of you. You can send the chest back to the Ethereal Plane by taking a Magic action to touch the chest and the replica. After 60 days, there is a cumulative 5 percent chance at the end of each day that the spell ends. The spell also ends if you cast this spell again or if the Tiny replica chest is destroyed.",
      summary: 'Chest on Ethereal Plane. Magic action to recall or send back. 5% daily chance after 60 days.',
    },
  },
{
    id: 'stone-shape',
    name: 'Stone Shape',
    school: 'transmutation',
    level: 4,
    classes: ['cleric', 'druid', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'touch' },
    duration: { kind: 'instantaneous' },
    components: { verbal: true, somatic: true, material: { description: 'soft clay' } },
    resolution: {
      caveats: [
        'Shaping limits and passage creation are not enforced in encounter.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Touch Medium or smaller stone object or 5 ft section. Form into any shape. Up to two hinges and a latch. Can make passage through 5 ft wall, seal door.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "You touch a stone object of Medium size or smaller or a section of stone no more than 5 feet in any dimension and form it into any shape you like. For example, you could shape a large rock into a weapon, statue, or coffer, or you could make a small passage through a wall that is 5 feet thick. You could also shape a stone door or its frame to seal the door shut. The object you create can have up to two hinges and a latch, but finer mechanical detail isn't possible.",
      summary: 'Reshape stone (Medium or 5ft section) into any form. Up to 2 hinges, latch.',
    },
  },
{
    id: 'stoneskin',
    name: 'Stoneskin',
    school: 'transmutation',
    level: 4,
    classes: ['druid', 'ranger', 'sorcerer', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'touch' },
    duration: { kind: 'timed', value: 1, unit: 'hour', concentration: true, upTo: true },
    components: { verbal: true, somatic: true, material: { description: 'diamond dust worth 100+ GP', cost: { value: 100, unit: 'gp', atLeast: true }, consumed: true } },
    resolution: {
      caveats: [
        'Nonmagical B/P/S only per typical reading; not split in encounter.',
      ],
    },
    effects: [
      { kind: 'targeting', target: 'one-creature', targetType: 'creature', requiresWilling: true },
      { kind: 'modifier', target: 'resistance', mode: 'add', value: 'bludgeoning' as ModifierValue },
      { kind: 'modifier', target: 'resistance', mode: 'add', value: 'piercing' as ModifierValue },
      { kind: 'modifier', target: 'resistance', mode: 'add', value: 'slashing' as ModifierValue },
    ],
    description: {
      full: "Until the spell ends, one willing creature you touch has Resistance to Bludgeoning, Piercing, and Slashing damage.",
      summary: 'Touch: Resistance to B/P/S damage.',
    },
  },
{
    id: 'vitriolic-sphere',
    name: 'Vitriolic Sphere',
    school: 'evocation',
    level: 4,
    classes: ['sorcerer', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 150, unit: 'ft' } },
    duration: { kind: 'instantaneous' },
    components: { verbal: true, somatic: true, material: { description: 'a drop of bile' } },
    resolution: {
      caveats: [
        'Delayed acid at end of next turn is not tracked automatically.',
      ],
    },
    effects: [
      { kind: 'targeting', target: 'creatures-in-area', targetType: 'creature', area: { kind: 'sphere', size: 20 } },
      {
        kind: 'save',
        save: { ability: 'dex' },
        onFail: [{ kind: 'damage', damage: '10d4', damageType: 'acid' }],
        onSuccess: [{ kind: 'damage', damage: '5d4', damageType: 'acid' }],
      },
      {
        kind: 'note',
        text: 'On a failed save, the target also takes 5d4 Acid damage at the end of its next turn.',
        category: 'under-modeled' as const,
      },
    ],
    scaling: [{ category: 'extra-damage', description: '+2d4 initial acid per spell slot level above 4', mode: 'per-slot-level', startsAtSlotLevel: 5, amount: '2d4' }],
    description: {
      full: "You point at a location within range, and a glowing, 1-foot-diameter ball of acid streaks there and explodes in a 20-foot-radius Sphere. Each creature in that area makes a Dexterity saving throw. On a failed save, a creature takes 10d4 Acid damage and another 5d4 Acid damage at the end of its next turn. On a successful save, a creature takes half the initial damage only. Using a Higher-Level Spell Slot. The initial damage increases by 2d4 for each spell slot level above 4.",
      summary: '20ft sphere: Dex save or 10d4 acid + 5d4 at end of next turn. +2d4 initial per slot.',
    },
  },
{
    id: 'wall-of-fire',
    name: 'Wall of Fire',
    school: 'evocation',
    level: 4,
    classes: ['druid', 'sorcerer', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 120, unit: 'ft' } },
    duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true, material: { description: 'a piece of charcoal' } },
    resolution: {
      caveats: [
        'Damaging side, 10 ft proximity, and enter/end-turn timing are not fully automated.',
      ],
    },
    effects: [
      { kind: 'targeting', target: 'creatures-in-area', targetType: 'creature' },
      {
        kind: 'save',
        save: { ability: 'dex' },
        onFail: [{ kind: 'damage', damage: '5d8', damageType: 'fire' }],
        onSuccess: [{ kind: 'damage', damage: '2d8', damageType: 'fire' }],
      },
      {
        kind: 'interval',
        stateId: 'wall-of-fire-proximity',
        every: { value: 1, unit: 'turn' },
        effects: [
          { kind: 'damage', damage: '5d8', damageType: 'fire' },
        ],
      },
      { kind: 'note', text: 'Wall is 60ft long (or 20ft ring), 20ft high, 1ft thick. One side deals damage to creatures entering or ending turn within 10ft.', category: 'flavor' as const },
    ],
    scaling: [{ category: 'extra-damage', description: '+1d8 fire per slot level above 4', mode: 'per-slot-level', startsAtSlotLevel: 5, amount: '1d8' }],
    description: {
      full: "You create a wall of fire on a solid surface within range. You can make the wall up to 60 feet long, 20 feet high, and 1 foot thick, or a ringed wall up to 20 feet in diameter, 20 feet high, and 1 foot thick. The wall is opaque and lasts for the duration. When the wall appears, each creature in its area makes a Dexterity saving throw, taking 5d8 Fire damage on a failed save or half as much damage on a successful one. One side of the wall, selected by you when you cast this spell, deals 5d8 Fire damage to each creature that ends its turn within 10 feet of that side or inside the wall. A creature takes the same damage when it enters the wall for the first time on a turn or ends its turn there. The other side of the wall deals no damage. Using a Higher-Level Spell Slot. The damage increases by 1d8 for each spell slot level above 4.",
      summary: 'Wall of fire. Dex save or 5d8. One side deals 5d8 when entering/ending turn. +1d8 per slot.',
    },
  },
];
