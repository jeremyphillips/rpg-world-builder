import type { SpellEntry } from '../types';

/**
 * Level 2 spells G–Z — authoring status:
 * - **Attack/save/AoE modeled:** Mind Spike (save+damage), Scorching Ray, Shatter, Moonbeam, Spiritual Weapon (notes), Suggestion, Web, Zone of Truth.
 * - **Utility / sense / state:** Lesser Restoration, Levitate, Locate Object, Misty Step, Pass without Trace, See Invisibility, Silence.
 * - **Note-first / heavy caveats:** Magic Mouth, Magic Weapon, Mirror Image, Phantasmal Force, Prayer of Healing, Rope Trick, Spike Growth, Warding Bond, etc.
 */
export const SPELLS_LEVEL_2_G_Z: readonly SpellEntry[] = [
{
    id: 'lesser-restoration',
    name: 'Lesser Restoration',
    school: 'abjuration',
    level: 2,
    classes: ['bard', 'cleric', 'druid', 'paladin', 'ranger'],
    castingTime: { normal: { value: 1, unit: 'bonus-action' } },
    range: { kind: 'touch' },
    duration: { kind: 'instantaneous' },
    components: { verbal: true, somatic: true },
    resolution: {
      caveats: [
        'Choosing which condition ends is manual; not gated by engine lists.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Touch creature: end one condition (Blinded, Deafened, Paralyzed, or Poisoned).',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "You touch a creature and end one condition on it: Blinded, Deafened, Paralyzed, or Poisoned.",
      summary: 'End Blinded, Deafened, Paralyzed, or Poisoned on touched creature.',
    },
  },
{
    id: 'levitate',
    name: 'Levitate',
    school: 'transmutation',
    level: 2,
    classes: ['sorcerer', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
    duration: { kind: 'timed', value: 10, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true, material: { description: 'a metal spring' } },
    resolution: {
      caveats: [
        'Levitation movement, altitude changes, and weight limit are not enforced in encounter.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Creature or object rises 20ft, suspended. Con save if unwilling. Move by pushing/pulling. Magic action to change altitude.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "One creature or loose object of your choice that you can see within range rises vertically up to 20 feet and remains suspended there for the duration. The spell can levitate an object that weighs up to 500 pounds. An unwilling creature that succeeds on a Constitution saving throw is unaffected. The target can move only by pushing or pulling against a fixed object or surface within reach (such as a wall or a ceiling), which allows it to move as if it were climbing. You can change the target's altitude by up to 20 feet in either direction on your turn. If you are the target, you can move up or down as part of your move. Otherwise, you can take a Magic action to move the target, which must remain within the spell's range. When the spell ends, the target floats gently to the ground if it is still aloft.",
      summary: 'Levitate creature or object up to 500 lb. Con save if unwilling. Move by pushing.',
    },
  },
{
    id: 'locate-animals-or-plants',
    name: 'Locate Animals or Plants',
    school: 'divination',
    level: 2,
    classes: ['bard', 'druid', 'ranger'],
    castingTime: { normal: { value: 1, unit: 'action' }, alternate: [{ value: 1, unit: 'action', ritual: true }] },
    range: { kind: 'self' },
    duration: { kind: 'instantaneous' },
    components: { verbal: true, somatic: true, material: { description: 'fur from a bloodhound' } },
    resolution: {
      caveats: [
        'Divination result is narrative only; not enforced in encounter.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Learn direction and distance to the closest Beast, Plant creature, or nonmagical plant of a named kind within 5 miles.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "Describe or name a specific kind of Beast, Plant creature, or nonmagical plant. You learn the direction and distance to the closest creature or plant of that kind within 5 miles, if any are present.",
      summary: 'Learn direction and distance to nearest Beast/Plant of described kind within 5 miles.',
    },
  },
{
    id: 'locate-object',
    name: 'Locate Object',
    school: 'divination',
    level: 2,
    classes: ['bard', 'cleric', 'druid', 'paladin', 'ranger', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'self' },
    duration: { kind: 'timed', value: 10, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true, material: { description: 'a forked twig' } },
    effects: [
      { kind: 'state', stateId: 'locate-object', notes: 'Sense direction to familiar object within 1,000 ft. Specific object (seen within 30ft) or nearest of a kind.' },
      { kind: 'note', text: 'Blocked by any thickness of lead.', category: 'flavor' as const },
    ],
    description: {
      full: "Describe or name an object that is familiar to you. You sense the direction to the object's location if that object is within 1,000 feet of you. If the object is in motion, you know the direction of its movement. The spell can locate a specific object known to you if you have seen it up close—within 30 feet—at least once. Alternatively, the spell can locate the nearest object of a particular kind, such as a certain kind of apparel, jewelry, furniture, tool, or weapon. This spell can't locate an object if any thickness of lead blocks a direct path between you and the object.",
      summary: 'Sense direction to object within 1,000 ft. Blocked by lead.',
    },
  },
{
    id: 'magic-mouth',
    name: 'Magic Mouth',
    school: 'illusion',
    level: 2,
    classes: ['bard', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'minute' }, alternate: [{ value: 1, unit: 'minute', ritual: true }] },
    range: { kind: 'distance', value: { value: 30, unit: 'ft' } },
    duration: { kind: 'until-dispelled' },
    components: { verbal: true, somatic: true, material: { description: 'jade dust worth 10+ GP', cost: { value: 10, unit: 'gp', atLeast: true }, consumed: true } },
    resolution: {
      caveats: [
        'Triggered messages and object targeting are not simulated in encounter.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Implant message (25 words max) in object. Trigger condition (visual/audible within 30ft) delivers message. Can end after delivery or repeat.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "You implant a message within an object in range—a message that is uttered when a trigger condition is met. Choose an object that you can see and that isn't being worn or carried by another creature. Then speak the message, which must be 25 words or fewer, though it can be delivered over as long as 10 minutes. Finally, determine the circumstance that will trigger the spell to deliver your message. When that trigger occurs, a magical mouth appears on the object and recites the message in your voice. When you cast the spell, you can have the spell end after it delivers its message, or it can remain and repeat its message whenever the trigger occurs. The trigger must be based on visual or audible conditions within 30 feet of the object.",
      summary: 'Message in object; trigger delivers it. Can repeat or end after delivery.',
    },
  },
{
    id: 'magic-weapon',
    name: 'Magic Weapon',
    school: 'transmutation',
    level: 2,
    classes: ['paladin', 'ranger', 'sorcerer', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'bonus-action' } },
    range: { kind: 'touch' },
    duration: { kind: 'timed', value: 1, unit: 'hour' },
    components: { verbal: true, somatic: true },
    resolution: {
      caveats: [
        'Weapon bonus tier by slot and recast rules are not applied automatically.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Nonmagical weapon becomes a +1 magic weapon. Ends if you cast again. Level 3–5 slot: +2. Level 6+ slot: +3.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "You touch a nonmagical weapon. Until the spell ends, that weapon becomes a magic weapon with a +1 bonus to attack rolls and damage rolls. The spell ends early if you cast it again. Using a Higher-Level Spell Slot. The bonus increases to +2 with a level 3–5 spell slot. The bonus increases to +3 with a level 6+ spell slot.",
      summary: 'Weapon becomes +1 magic. Scales to +2/+3 with slot.',
    },
  },
{
    id: 'mind-spike',
    name: 'Mind Spike',
    school: 'divination',
    level: 2,
    classes: ['sorcerer', 'warlock', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 120, unit: 'ft' } },
    duration: { kind: 'timed', value: 1, unit: 'hour', concentration: true, upTo: true },
    components: { somatic: true },
    resolution: {
      caveats: [
        'Location tracking and Invisible interaction on failed save are not fully enforced.',
      ],
    },
    effects: [
      { kind: 'targeting', target: 'one-creature', targetType: 'creature', requiresSight: true },
      {
        kind: 'save',
        save: { ability: 'wis' },
        onFail: [{ kind: 'damage', damage: '3d8', damageType: 'psychic' }],
        onSuccess: [{ kind: 'damage', damage: '2d8', damageType: 'psychic' }],
      },
      {
        kind: 'note',
        text: "On a failed save, you know the target's location while on the same plane; the target cannot hide from you and gains no benefit from Invisible against you.",
        category: 'under-modeled' as const,
      },
    ],
    scaling: [{ category: 'extra-damage', description: '+1d8 psychic per spell slot level above 2', mode: 'per-slot-level', startsAtSlotLevel: 3, amount: '1d8' }],
    description: {
      full: "You drive a spike of psionic energy into the mind of one creature you can see within range. The target makes a Wisdom saving throw, taking 3d8 Psychic damage on a failed save or half as much damage on a successful one. On a failed save, you also always know the target's location until the spell ends, but only while the two of you are on the same plane of existence. While you have this knowledge, the target can't become hidden from you, and if it has the Invisible condition, it gains no benefit from that condition against you. Using a Higher-Level Spell Slot. The damage increases by 1d8 for each spell slot level above 2.",
      summary: 'Wis save or 3d8 psychic; on fail you know location, target cannot hide. +1d8 per slot.',
    },
  },
{
    id: 'mirror-image',
    name: 'Mirror Image',
    school: 'illusion',
    level: 2,
    classes: ['bard', 'sorcerer', 'warlock', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'self' },
    duration: { kind: 'timed', value: 1, unit: 'minute' },
    components: { verbal: true, somatic: true },
    resolution: {
      caveats: [
        'Duplicate decoy rolls and Blindsight/Truesight exceptions are not enforced in encounter.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Three illusory duplicates. When hit, roll d6 per duplicate: 3+ means duplicate hit instead and destroyed. No effect vs Blinded, Blindsight, Truesight.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "Three illusory duplicates of yourself appear in your space. Until the spell ends, the duplicates move with you and mimic your actions, shifting position so it's impossible to track which image is real. Each time a creature hits you with an attack roll during the spell's duration, roll a d6 for each of your remaining duplicates. If any of the d6s rolls a 3 or higher, one of the duplicates is hit instead of you, and the duplicate is destroyed. The duplicates otherwise ignore all other damage and effects. The spell ends when all three duplicates are destroyed. A creature is unaffected by this spell if it has the Blinded condition, Blindsight, or Truesight.",
      summary: 'Three duplicates; 3+ on d6 when hit means duplicate hit instead. Immune to Blinded/Blindsight/Truesight.',
    },
  },
{
    id: 'misty-step',
    name: 'Misty Step',
    school: 'conjuration',
    level: 2,
    classes: ['sorcerer', 'warlock', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'bonus-action' } },
    range: { kind: 'self' },
    duration: { kind: 'instantaneous' },
    components: { verbal: true },
    resolution: {
      caveats: [
        'Teleport destination and opportunity-attack rules are not fully simulated.',
      ],
    },
    effects: [
      { kind: 'move', distance: 30 },
      {
        kind: 'note',
        text: 'Teleport to an unoccupied space you can see within range. No opportunity attacks from this movement.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "Briefly surrounded by silvery mist, you teleport up to 30 feet to an unoccupied space you can see.",
      summary: 'Bonus action: teleport 30 ft to visible unoccupied space.',
    },
  },
{
    id: 'moonbeam',
    name: 'Moonbeam',
    school: 'evocation',
    level: 2,
    classes: ['druid'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 120, unit: 'ft' } },
    duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true, material: { description: 'a moonseed leaf' } },
    effects: [
      { kind: 'targeting', target: 'creatures-in-area', targetType: 'creature', area: { kind: 'cylinder', size: 5 } },
      {
        kind: 'interval',
        stateId: 'moonbeam-radiance',
        every: { value: 1, unit: 'turn' },
        effects: [
          {
            kind: 'save',
            save: { ability: 'con' },
            onFail: [{ kind: 'damage', damage: '2d10', damageType: 'radiant' }],
            onSuccess: [{ kind: 'damage', damage: '1d10', damageType: 'radiant' }],
          },
        ],
      },
      { kind: 'note', text: 'Sheds Dim Light. Shape-shifted creature reverts and cannot shape-shift in area.', category: 'flavor' as const },
      { kind: 'note', text: 'Magic action to move beam 60ft.', category: 'under-modeled' as const },
    ],
    scaling: [{ category: 'extra-damage', description: '+1d10 radiant per slot level above 2', mode: 'per-slot-level', startsAtSlotLevel: 3, amount: '1d10' }],
    description: {
      full: "A silvery beam of pale light shines down in a 5-foot-radius, 40-foot-high Cylinder centered on a point within range. Until the spell ends, Dim Light fills the Cylinder, and you can take a Magic action on later turns to move the Cylinder up to 60 feet. When the Cylinder appears, each creature in it makes a Constitution saving throw. On a failed save, a creature takes 2d10 Radiant damage, and if the creature is shape-shifted (as a result of the Polymorph spell, for example), it reverts to its true form and can't shape-shift until it leaves the Cylinder. On a successful save, a creature takes half as much damage only. A creature also makes this save when the spell's area moves into its space and when it enters the spell's area or ends its turn there. A creature makes this save only once per turn. Using a Higher-Level Spell Slot. The damage increases by 1d10 for each spell slot level above 2.",
      summary: '5ft radius cylinder. Con save or 2d10 radiant. Shape-shifted reverts. +1d10 per slot.',
    },
  },
{
    id: 'pass-without-trace',
    name: 'Pass without Trace',
    school: 'abjuration',
    level: 2,
    classes: ['druid', 'ranger'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'self' },
    duration: { kind: 'timed', value: 1, unit: 'hour', concentration: true, upTo: true },
    components: { verbal: true, somatic: true, material: { description: 'ashes from burned mistletoe' } },
    resolution: {
      caveats: [
        '+10 Dexterity (Stealth), no tracks, and which allies you choose in the aura are not enforced automatically.',
      ],
    },
    effects: [
      {
        kind: 'emanation',
        attachedTo: 'self',
        area: { kind: 'sphere', size: 30 },
      },
      {
        kind: 'targeting',
        target: 'creatures-in-area',
        targetType: 'creature',
        area: { kind: 'sphere', size: 30 },
      },
      {
        kind: 'note',
        text: '30-foot Emanation: you and chosen creatures have +10 to Dexterity (Stealth) and leave no tracks.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "You radiate a concealing aura in a 30-foot Emanation for the duration. While in the aura, you and each creature you choose have a +10 bonus to Dexterity (Stealth) checks and leave no tracks.",
      summary: '30ft aura: +10 Stealth, no tracks.',
    },
  },
{
    id: 'phantasmal-force',
    name: 'Phantasmal Force',
    school: 'illusion',
    level: 2,
    classes: ['bard', 'sorcerer', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
    duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true, material: { description: 'a bit of fleece' } },
    resolution: {
      caveats: [
        'Illusory phantasm, Investigation contest, and ongoing psychic damage are not enforced in encounter.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Int save or phantasmal object/creature (10ft cube) only target perceives. Study + Int (Investigation) vs DC to end. Phantasm can deal 2d8 psychic/turn if dangerous.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "You attempt to craft an illusion in the mind of a creature you can see within range. The target makes an Intelligence saving throw. On a failed save, you create a phantasmal object, creature, or other phenomenon that is no larger than a 10-foot Cube and that is perceivable only to the target for the duration. The phantasm includes sound, temperature, and other stimuli. The target can take a Study action to examine the phantasm with an Intelligence (Investigation) check against your spell save DC. If the check succeeds, the target realizes that the phantasm is an illusion, and the spell ends. While affected, the target treats the phantasm as real and rationalizes illogical outcomes. An affected target can take 2d8 Psychic damage per turn if the phantasm represents something dangerous.",
      summary: 'Int save or phantasmal 10ft cube only target sees. Study to end. Can deal 2d8 psychic/turn.',
    },
  },
{
    id: 'prayer-of-healing',
    name: 'Prayer of Healing',
    school: 'abjuration',
    level: 2,
    classes: ['cleric', 'paladin'],
    castingTime: { normal: { value: 10, unit: 'minute' } },
    range: { kind: 'distance', value: { value: 30, unit: 'ft' } },
    duration: { kind: 'instantaneous' },
    components: { verbal: true },
    resolution: {
      caveats: [
        'Short Rest benefits and per-creature once-per-long-rest limit are not tracked in encounter.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: '10-minute casting: up to 5 creatures who stay in range gain Short Rest benefits and regain 2d8 HP. A creature cannot be affected again until it finishes a Long Rest.',
        category: 'under-modeled' as const,
      },
    ],
    scaling: [{ category: 'extra-healing', description: '+1d8 healing per spell slot level above 2', mode: 'per-slot-level', startsAtSlotLevel: 3, amount: '1d8' }],
    description: {
      full: "Up to five creatures of your choice who remain within range for the spell's entire casting gain the benefits of a Short Rest and also regain 2d8 Hit Points. A creature can't be affected by this spell again until that creature finishes a Long Rest. Using a Higher-Level Spell Slot. The healing increases by 1d8 for each spell slot level above 2.",
      summary: '10 min cast: up to 5 creatures get Short Rest + 2d8 HP. +1d8 per slot.',
    },
  },
{
    id: 'protection-from-poison',
    name: 'Protection from Poison',
    school: 'abjuration',
    level: 2,
    classes: ['cleric', 'druid', 'paladin', 'ranger'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'touch' },
    duration: { kind: 'timed', value: 1, unit: 'hour' },
    components: { verbal: true, somatic: true },
    resolution: {
      caveats: [
        'Poisoned cleanup, Advantage on poison saves, and Poison resistance are not fully automated.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Touch: end Poisoned condition. For the duration, Advantage on saves to avoid/end Poisoned and Resistance to Poison damage.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "You touch a creature and end the Poisoned condition on it. For the duration, the target has Advantage on saving throws to avoid or end the Poisoned condition, and it has Resistance to Poison damage.",
      summary: 'Touch: end Poisoned. Advantage vs Poisoned, Resistance to Poison for 1 hour.',
    },
  },
{
    id: 'ray-of-enfeeblement',
    name: 'Ray of Enfeeblement',
    school: 'necromancy',
    level: 2,
    classes: ['warlock', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
    duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true },
    resolution: {
      caveats: [
        'Ray rider effects and repeat saves are not fully enforced in encounter.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: "Con save: on success, Disadvantage on the target's next attack until the start of your next turn. On failure, Disadvantage on Strength-based D20 Tests and -1d8 from damage rolls; repeat save at end of each of the target's turns.",
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "A beam of enervating energy shoots from you toward a creature within range. The target must make a Constitution saving throw. On a successful save, the target has Disadvantage on the next attack roll it makes until the start of your next turn. On a failed save, the target has Disadvantage on Strength-based D20 Tests for the duration. During that time, it also subtracts 1d8 from all its damage rolls. The target repeats the save at the end of each of its turns, ending the spell on a success.",
      summary: 'Con save: fail = Disadvantage Str tests, -1d8 damage. Repeat save each turn.',
    },
  },
{
    id: 'rope-trick',
    name: 'Rope Trick',
    school: 'transmutation',
    level: 2,
    classes: ['wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'touch' },
    duration: { kind: 'timed', value: 1, unit: 'hour' },
    components: { verbal: true, somatic: true, material: { description: 'a segment of rope' } },
    resolution: {
      caveats: [
        'Extradimensional space and ingress/egress are not simulated in encounter.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Rope hovers perpendicular. 3ft×5ft portal to extradimensional space at top. Holds 8 Medium or smaller. Climb to enter. Attacks/spells cannot pass in or out. Contents drop out when spell ends.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "You touch a rope. One end of it hovers upward until the rope hangs perpendicular to the ground or the rope reaches a ceiling. At the rope's upper end, an Invisible 3-foot-by-5-foot portal opens to an extradimensional space that lasts until the spell ends. That space can be reached by climbing the rope, which can be pulled into or dropped out of it. The space can hold up to eight Medium or smaller creatures. Attacks, spells, and other effects can't pass into or out of the space, but creatures inside it can see through the portal. Anything inside the space drops out when the spell ends.",
      summary: 'Rope leads to extradimensional space. Holds 8. No attacks in/out.',
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
    id: 'see-invisibility',
    name: 'See Invisibility',
    school: 'divination',
    level: 2,
    classes: ['bard', 'sorcerer', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'self' },
    duration: { kind: 'timed', value: 1, unit: 'hour' },
    components: { verbal: true, somatic: true, material: { description: 'a pinch of talc' } },
    effects: [
      { kind: 'state', stateId: 'see-invisibility', notes: 'See Invisible creatures and objects as if visible. See into the Ethereal Plane.' },
    ],
    description: {
      full: "For the duration, you see creatures and objects that have the Invisible condition as if they were visible, and you can see into the Ethereal Plane. Creatures and objects there appear ghostly.",
      summary: 'See Invisible and into Ethereal Plane for 1 hour.',
    },
  },
{
    id: 'shatter',
    name: 'Shatter',
    school: 'evocation',
    level: 2,
    classes: ['bard', 'sorcerer', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
    duration: { kind: 'instantaneous' },
    components: { verbal: true, somatic: true, material: { description: 'a chip of mica' } },
    effects: [
      { kind: 'targeting', target: 'creatures-in-area', targetType: 'creature', area: { kind: 'sphere', size: 10 } },
      {
        kind: 'save',
        save: { ability: 'con' },
        onFail: [{ kind: 'damage', damage: '3d8', damageType: 'thunder' }],
        onSuccess: [{ kind: 'damage', damage: '1d8', damageType: 'thunder' }],
      },
      { kind: 'note', text: 'Constructs have Disadvantage on the save. Nonmagical objects not being worn or carried also take damage.', category: 'under-modeled' as const },
    ],
    scaling: [{ category: 'extra-damage', description: '+1d8 thunder per slot level above 2', mode: 'per-slot-level', startsAtSlotLevel: 3, amount: '1d8' }],
    description: {
      full: "A loud noise erupts from a point of your choice within range. Each creature in a 10-foot-radius Sphere centered there makes a Constitution saving throw, taking 3d8 Thunder damage on a failed save or half as much damage on a successful one. A Construct has Disadvantage on the save. A nonmagical object that isn't being worn or carried also takes the damage if it's in the spell's area. Using a Higher-Level Spell Slot. The damage increases by 1d8 for each spell slot level above 2.",
      summary: '10ft sphere: Con save or 3d8 thunder. Construct Disadvantage. +1d8 per slot.',
    },
  },
{
    id: 'shining-smite',
    name: 'Shining Smite',
    school: 'transmutation',
    level: 2,
    classes: ['paladin'],
    castingTime: {
      normal: {
        value: 1,
        unit: 'bonus-action',
        trigger: 'immediately after hitting a creature with a Melee weapon or an Unarmed Strike',
      },
    },
    range: { kind: 'self' },
    duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true },
    resolution: {
      caveats: [
        'Bonus-action rider after a melee hit; light radius and Invisible negation are not fully enforced.',
      ],
    },
    effects: [
      { kind: 'targeting', target: 'one-creature', targetType: 'creature' },
      { kind: 'damage', damage: '2d6', damageType: 'radiant' },
      {
        kind: 'note',
        text: 'Target sheds Bright Light in 5 ft; attack rolls against it have Advantage; it cannot benefit from Invisible.',
        category: 'under-modeled' as const,
      },
    ],
    scaling: [{ category: 'extra-damage', description: '+1d6 radiant per spell slot level above 2', mode: 'per-slot-level', startsAtSlotLevel: 3, amount: '1d6' }],
    description: {
      full: "The target hit by the strike takes an extra 2d6 Radiant damage from the attack. Until the spell ends, the target sheds Bright Light in a 5-foot radius, attack rolls against it have Advantage, and it can't benefit from the Invisible condition. Using a Higher-Level Spell Slot. The damage increases by 1d6 for each spell slot level above 2.",
      summary: 'Extra 2d6 radiant. Target: Bright Light 5ft, Advantage to hit, no Invisible. +1d6 per slot.',
    },
  },
{
    id: 'silence',
    name: 'Silence',
    school: 'illusion',
    level: 2,
    classes: ['bard', 'cleric', 'ranger'],
    castingTime: { normal: { value: 1, unit: 'action' }, alternate: [{ value: 1, unit: 'action', ritual: true }] },
    range: { kind: 'distance', value: { value: 120, unit: 'ft' } },
    duration: { kind: 'timed', value: 10, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true },
    resolution: {
      caveats: [
        'Sound suppression and Verbal spell blocking are not fully modeled in encounter.',
      ],
    },
    effects: [
      {
        kind: 'targeting',
        target: 'creatures-in-area',
        targetType: 'creature',
        area: { kind: 'sphere', size: 20 },
      },
      {
        kind: 'note',
        text: 'No sound passes through or is created in the sphere; Thunder Immunity; Deafened while inside; cannot cast spells with a Verbal component there.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "For the duration, no sound can be created within or pass through a 20-foot-radius Sphere centered on a point you choose within range. Any creature or object entirely inside the Sphere has Immunity to Thunder damage, and creatures have the Deafened condition while entirely inside it. Casting a spell that includes a Verbal component is impossible there.",
      summary: '20ft sphere: no sound, Immunity to Thunder, Deafened, no Verbal spells.',
    },
  },
{
    id: 'spider-climb',
    name: 'Spider Climb',
    school: 'transmutation',
    level: 2,
    classes: ['sorcerer', 'warlock', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'touch' },
    duration: { kind: 'timed', value: 1, unit: 'hour', concentration: true, upTo: true },
    components: { verbal: true, somatic: true, material: { description: 'a drop of bitumen and a spider' } },
    resolution: {
      caveats: [
        'Climb Speed and vertical movement are not applied automatically.',
      ],
    },
    effects: [
      { kind: 'targeting', target: 'one-creature', targetType: 'creature', requiresWilling: true },
      {
        kind: 'state',
        stateId: 'spider-climb',
        notes: 'Climb Speed equal to Speed; can move on vertical surfaces and ceilings with hands free.',
      },
    ],
    scaling: [{ category: 'extra-targets', description: '+1 target per spell slot level above 2', mode: 'per-slot-level', startsAtSlotLevel: 3 }],
    description: {
      full: "Until the spell ends, one willing creature you touch gains the ability to move up, down, and across vertical surfaces and along ceilings, while leaving its hands free. The target also gains a Climb Speed equal to its Speed. Using a Higher-Level Spell Slot. You can target one additional creature for each spell slot level above 2.",
      summary: 'Touch: climb walls and ceilings, hands free. +1 target per slot.',
    },
  },
{
    id: 'spike-growth',
    name: 'Spike Growth',
    school: 'transmutation',
    level: 2,
    classes: ['druid', 'ranger'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 150, unit: 'ft' } },
    duration: { kind: 'timed', value: 10, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true, material: { description: 'seven thorns' } },
    resolution: {
      caveats: [
        'Movement-based piercing, camouflage, and Search DC are not enforced in encounter.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: '20-foot sphere: Difficult Terrain. 2d4 piercing per 5 feet moved within the area. Camouflaged; Search + Wis (Perception or Survival) vs your spell save DC to spot hazards before entering.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "The ground in a 20-foot-radius Sphere centered on a point within range sprouts hard spikes and thorns. The area becomes Difficult Terrain for the duration. When a creature moves into or within the area, it takes 2d4 Piercing damage for every 5 feet it travels. The transformation of the ground is camouflaged to look natural. Any creature that can't see the area when the spell is cast must take a Search action and succeed on a Wisdom (Perception or Survival) check against your spell save DC to recognize the terrain as hazardous before entering it.",
      summary: '20ft sphere Difficult Terrain. 2d4 piercing per 5ft moved. Camouflaged.',
    },
  },
{
    id: 'spiritual-weapon',
    name: 'Spiritual Weapon',
    school: 'evocation',
    level: 2,
    classes: ['cleric'],
    castingTime: { normal: { value: 1, unit: 'bonus-action' } },
    range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
    duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true },
    resolution: {
      caveats: [
        'Bonus Action movement and repeated attacks are not automated; damage uses spellcasting modifier.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Floating spectral weapon: melee spell attack 1d8 + spellcasting modifier Force; Bonus Action to move 20 ft and attack again.',
        category: 'under-modeled' as const,
      },
    ],
    scaling: [{ category: 'extra-damage', description: '+1d8 force per spell slot level above 2', mode: 'per-slot-level', startsAtSlotLevel: 3, amount: '1d8' }],
    description: {
      full: "You create a floating, spectral force that resembles a weapon of your choice and lasts for the duration. The force appears within range in a space of your choice, and you can immediately make one melee spell attack against one creature within 5 feet of the force. On a hit, the target takes Force damage equal to 1d8 plus your spellcasting ability modifier. As a Bonus Action on your later turns, you can move the force up to 20 feet and repeat the attack against a creature within 5 feet of it. Using a Higher-Level Spell Slot. The damage increases by 1d8 for every slot level above 2.",
      summary: 'Spectral weapon: Bonus action attack 1d8+mod Force. Move 20ft and repeat. +1d8 per slot.',
    },
  },
{
    id: 'suggestion',
    name: 'Suggestion',
    school: 'enchantment',
    level: 2,
    classes: ['bard', 'sorcerer', 'warlock', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 30, unit: 'ft' } },
    duration: { kind: 'timed', value: 8, unit: 'hour', concentration: true, upTo: true },
    components: { verbal: true, material: { description: 'a drop of honey' } },
    effects: [
      { kind: 'targeting', target: 'one-creature', targetType: 'creature', requiresSight: true },
      { kind: 'save', save: { ability: 'wis' }, onFail: [{ kind: 'condition', conditionId: 'charmed' }] },
      { kind: 'note', text: 'Charmed target pursues a suggested course of activity (25 words or fewer). Must sound achievable, not obviously harmful. Ends if caster or allies damage target.', category: 'flavor' as const },
    ],
    description: {
      full: "You suggest a course of activity—described in no more than 25 words—to one creature you can see within range that can hear and understand you. The suggestion must sound achievable and not involve anything that would obviously deal damage to the target or its allies. The target must succeed on a Wisdom saving throw or have the Charmed condition for the duration or until you or your allies deal damage to the target. The Charmed target pursues the suggestion to the best of its ability. The suggested activity can continue for the entire duration, but if the suggested activity can be completed in a shorter time, the spell ends for the target upon completing it.",
      summary: '25-word suggestion. Wis save or Charmed, pursues suggestion. Ends on damage.',
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
    id: 'warding-bond',
    name: 'Warding Bond',
    school: 'abjuration',
    level: 2,
    classes: ['cleric', 'paladin'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'touch' },
    duration: { kind: 'timed', value: 1, unit: 'hour' },
    components: { verbal: true, somatic: true, material: { description: 'a pair of platinum rings worth 50+ GP each, which you and the target must wear for the duration', cost: { value: 50, unit: 'gp', atLeast: true } } },
    resolution: {
      caveats: [
        'Shared damage, AC/save bonuses, and Resistance are not enforced automatically.',
      ],
    },
    effects: [
      { kind: 'targeting', target: 'one-creature', targetType: 'creature', requiresWilling: true },
      {
        kind: 'note',
        text: 'While within 60 ft: target +1 AC and saving throws, Resistance to all damage; you take the same damage when the target takes damage. Ends at 0 HP or if separated by more than 60 ft.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "You touch another creature that is willing and create a mystic connection between you and the target until the spell ends. While the target is within 60 feet of you, it gains a +1 bonus to AC and saving throws, and it has Resistance to all damage. Also, each time it takes damage, you take the same amount of damage. The spell ends if you drop to 0 Hit Points or if you and the target become separated by more than 60 feet. It also ends if the spell is cast again on either of the connected creatures.",
      summary: 'Target gains +1 AC/saves and Resistance. You take same damage. Ends if 0 HP or >60ft apart.',
    },
  },
{
    id: 'zone-of-truth',
    name: 'Zone of Truth',
    school: 'enchantment',
    level: 2,
    classes: ['bard', 'cleric', 'paladin'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
    duration: { kind: 'timed', value: 10, unit: 'minute' },
    components: { verbal: true, somatic: true },
    effects: [
      { kind: 'targeting', target: 'creatures-in-area', area: { kind: 'sphere', size: 15 } },
      { kind: 'save', save: { ability: 'cha' }, onFail: [{ kind: 'state', stateId: 'zone-of-truth', notes: 'Cannot speak a deliberate lie while in the radius.' }] },
      { kind: 'note', text: 'Caster knows whether each creature succeeds or fails. Affected creatures are aware and can avoid answering.', category: 'flavor' as const },
    ],
    description: {
      full: "You create a magical zone that guards against deception in a 15-foot-radius Sphere centered on a point within range. Until the spell ends, a creature that enters the spell's area for the first time on a turn or starts its turn there makes a Charisma saving throw. On a failed save, a creature can't speak a deliberate lie while in the radius. You know whether a creature succeeds or fails on this save. An affected creature is aware of the spell and can avoid answering questions to which it would normally respond with a lie. Such a creature can be evasive yet must be truthful.",
      summary: '15ft sphere: Cha save or cannot lie. You know success/fail. Creature can avoid answering.',
    },
  },
];
