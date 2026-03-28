import { EXTRAPLANAR_CREATURE_TYPE_IDS } from '@/features/content/monsters/domain/vocab/monster.vocab';
import type { SpellEntry } from '../types';

/**
 * Level 4 spells A–L — authoring status:
 * - **Attack/save/AoE modeled:** Banishment, Blight, Black Tentacles, Confusion, Ice Storm (in m–z), Phantasmal Killer, Wall of Fire (in m–z).
 * - **Utility / sense / state:** Arcane Eye, Divination, Greater Invisibility (in m–z), Locate Creature (in m–z).
 * - **Note-first / summons / heavy caveats:** Conjure Minor Elementals, Conjure Woodland Beings, Control Water, Dimension Door, Fabricate, Polymorph, etc.
 */
export const SPELLS_LEVEL_4_A_L: readonly SpellEntry[] = [
{
    id: 'arcane-eye',
    name: 'Arcane Eye',
    school: 'divination',
    level: 4,
    classes: ['wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 30, unit: 'ft' } },
    duration: { kind: 'timed', value: 1, unit: 'hour', concentration: true, upTo: true },
    components: { verbal: true, somatic: true, material: { description: 'a bit of bat fur' } },
    resolution: {
      caveats: [
        'Remote vision and barrier blocking are not enforced as encounter line-of-sight.',
      ],
    },
    effects: [
      { kind: 'state', stateId: 'arcane-eye', notes: 'Invisible, invulnerable eye. See in every direction with 30ft Darkvision. Bonus Action to move eye up to 30ft.' },
    ],
    description: {
      full: "You create an Invisible, invulnerable eye within range that hovers for the duration. You mentally receive visual information from the eye, which can see in every direction. It also has Darkvision with a range of 30 feet. As a Bonus Action, you can move the eye up to 30 feet in any direction. A solid barrier blocks the eye's movement, but the eye can pass through an opening as small as 1 inch in diameter.",
      summary: 'Invisible eye relays vision; 30ft darkvision. Bonus action to move 30ft.',
    },
  },
{
    id: 'aura-of-life',
    name: 'Aura of Life',
    school: 'abjuration',
    level: 4,
    classes: ['cleric', 'paladin'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'self' },
    duration: { kind: 'timed', value: 10, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true },
    resolution: {
      caveats: [
        'HP max cannot be reduced for allies in the aura, ally at 0 HP regaining 1 HP at turn start, and spatial overlap checks are not fully automated.',
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
      { kind: 'modifier', target: 'resistance', mode: 'add', value: 'necrotic' as const },
      { kind: 'note', text: 'HP max cannot be reduced for creatures in aura.', category: 'under-modeled' as const },
      { kind: 'note', text: 'Ally at 0 HP regains 1 HP at start of turn.', category: 'under-modeled' as const },
    ],
    description: {
      full: "An aura radiates from you in a 30-foot Emanation for the duration. While in the aura, you and your allies have Resistance to Necrotic damage, and your Hit Point maximums can't be reduced. If an ally with 0 Hit Points starts its turn in the aura, that ally regains 1 Hit Point.",
      summary: '30ft aura: Necrotic resistance, HP max protection, 0 HP allies regain 1 HP at turn start.',
    },
  },
  {
    id: 'banishment',
    name: 'Banishment',
    school: 'abjuration',
    level: 4,
    classes: ['cleric', 'paladin', 'sorcerer', 'warlock', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 30, unit: 'ft' } },
    duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true, material: { description: 'a pentacle' } },
    resolution: {
      caveats: [
        'Native-plane routing is not simulated.',
      ],
    },
    effects: [
      { kind: 'targeting', target: 'one-creature', targetType: 'creature', creatureTypeFilter: [...EXTRAPLANAR_CREATURE_TYPE_IDS] },
      {
        kind: 'save',
        save: { ability: 'cha' },
        onFail: [
          { kind: 'condition', conditionId: 'incapacitated' },
          { kind: 'state', stateId: 'banished' },
          { kind: 'note', text: 'Target is transported to a harmless demiplane for the duration.', category: 'flavor' as const },
        ],
      },
      {
        kind: 'note',
        text: 'Aberration, Celestial, Elemental, Fey, or Fiend: if the spell lasts the full 1 minute, the target does not return—it is transported to a random location on an associated plane (GM).',
        category: 'under-modeled' as const,
      },
    ],
    scaling: [{ category: 'extra-targets', description: '+1 target per slot level above 4', mode: 'per-slot-level', startsAtSlotLevel: 5 }],
    description: {
      full: "One creature that you can see within range must succeed on a Charisma saving throw or be transported to a harmless demiplane for the duration. While there, the target has the Incapacitated condition. When the spell ends, the target reappears in the space it left or in the nearest unoccupied space if that space is occupied. If the target is an Aberration, a Celestial, an Elemental, a Fey, or a Fiend, the target doesn't return if the spell lasts for 1 minute. The target is instead transported to a random location on a plane (GM's choice) associated with its creature type. Using a Higher-Level Spell Slot. You can target one additional creature for each spell slot level above 4.",
      summary: 'Cha save or banished to demiplane. Native outsiders permanently banished at full duration.',
    },
  },
  {
    id: 'black-tentacles',
    name: 'Black Tentacles',
    school: 'conjuration',
    level: 4,
    classes: ['wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 90, unit: 'ft' } },
    duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true, material: { description: 'a tentacle' } },
    resolution: {
      caveats: [
        'Enter/end-turn timing, Athletics escape, and repeat saves are not fully automated.',
      ],
    },
    effects: [
      { kind: 'targeting', target: 'creatures-in-area', targetType: 'creature', area: { kind: 'square', size: 20 } },
      {
        kind: 'save',
        save: { ability: 'str' },
        onFail: [
          { kind: 'damage', damage: '3d6', damageType: 'bludgeoning' },
          { kind: 'condition', conditionId: 'restrained' },
        ],
      },
      {
        kind: 'note',
        text: 'For the duration, the ground in the area is Difficult Terrain.',
        category: 'flavor' as const,
      },
      {
        kind: 'note',
        text: 'Also saves on enter or end turn in area. Restrained creature can use an action for Strength (Athletics) vs. spell save DC to end Restrained.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "Squirming, ebony tentacles fill a 20-foot square on ground that you can see within range. For the duration, these tentacles turn the ground in that area into Difficult Terrain. Each creature in that area makes a Strength saving throw. On a failed save, it takes 3d6 Bludgeoning damage, and it has the Restrained condition until the spell ends. A creature also makes that save if it enters the area or ends its turn there. A Restrained creature can take an action to make a Strength (Athletics) check against your spell save DC, ending the condition on itself on a success.",
      summary: '20-foot square of tentacles: Str save or 3d6 bludgeoning and Restrained.',
    },
  },
{
    id: 'blight',
    name: 'Blight',
    school: 'necromancy',
    level: 4,
    classes: ['druid', 'sorcerer', 'warlock', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 30, unit: 'ft' } },
    duration: { kind: 'instantaneous' },
    components: { verbal: true, somatic: true },
    resolution: {
      caveats: [
        'Plant auto-fail and nonmagical plant object mode are not validated automatically.',
      ],
    },
    effects: [
      { kind: 'targeting', target: 'one-creature', targetType: 'creature' },
      {
        kind: 'save',
        save: { ability: 'con' },
        onFail: [{ kind: 'damage', damage: '8d8', damageType: 'necrotic' }],
        onSuccess: [{ kind: 'damage', damage: '4d8', damageType: 'necrotic' }],
      },
      { kind: 'note', text: 'Plant creatures automatically fail the save. Alternatively, targets a nonmagical plant (not a creature) which withers and dies.', category: 'flavor' as const },
    ],
    scaling: [{ category: 'extra-damage', description: '+1d8 necrotic per slot level above 4', mode: 'per-slot-level', startsAtSlotLevel: 5, amount: '1d8' }],
    description: {
      full: "A creature that you can see within range makes a Constitution saving throw, taking 8d8 Necrotic damage on a failed save or half as much on a successful one. A Plant creature automatically fails the save. Alternatively, target a nonmagical plant that isn't a creature, such as a tree or shrub. It doesn't make a save; it simply withers and dies. Using a Higher-Level Spell Slot. The damage increases by 1d8 for each spell slot level above 4.",
      summary: 'Con save or 8d8 necrotic. Plant auto-fails. Or wither nonmagical plant. Scales with slot.',
    },
  },
{
    id: 'charm-monster',
    name: 'Charm Monster',
    school: 'enchantment',
    level: 4,
    classes: ['bard', 'druid', 'sorcerer', 'warlock', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 30, unit: 'ft' } },
    duration: { kind: 'timed', value: 1, unit: 'hour' },
    components: { verbal: true, somatic: true },
    resolution: {
      caveats: [
        'Advantage when fighting, damage ending the charm, and post-spell awareness are not fully enforced.',
      ],
    },
    effects: [
      { kind: 'targeting', target: 'one-creature', targetType: 'creature' },
      {
        kind: 'save',
        save: { ability: 'wis' },
        onFail: [{ kind: 'condition', conditionId: 'charmed' }],
      },
      {
        kind: 'note',
        text: 'Save is made with Advantage if you or your allies are fighting the target. Charmed is Friendly; ends if you or your allies damage the target. When the spell ends, the target knows it was Charmed.',
        category: 'under-modeled' as const,
      },
    ],
    scaling: [{ category: 'extra-targets', description: '+1 target per spell slot level above 4', mode: 'per-slot-level', startsAtSlotLevel: 5 }],
    description: {
      full: "One creature you can see within range makes a Wisdom saving throw. It does so with Advantage if you or your allies are fighting it. On a failed save, the target has the Charmed condition until the spell ends or until you or your allies damage it. The Charmed creature is Friendly to you. When the spell ends, the target knows it was Charmed by you. Using a Higher-Level Spell Slot. You can target one additional creature for each spell slot level above 4.",
      summary: 'Wis save or Charmed for 1 hour. Friendly. Scales with extra targets.',
    },
  },
{
    id: 'compulsion',
    name: 'Compulsion',
    school: 'enchantment',
    level: 4,
    classes: ['bard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 30, unit: 'ft' } },
    duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true },
    resolution: {
      caveats: [
        'Bonus Action direction and repeat save after movement are not automated.',
      ],
    },
    effects: [
      { kind: 'targeting', target: 'chosen-creatures', targetType: 'creature', requiresSight: true },
      { kind: 'save', save: { ability: 'wis' }, onFail: [{ kind: 'condition', conditionId: 'charmed' }] },
      { kind: 'note', text: 'Bonus Action each turn: designate horizontal direction. Charmed targets must move that way. Target repeats save after moving (not a standard turn-boundary save).', category: 'under-modeled' as const },
    ],
    description: {
      full: "Each creature of your choice that you can see within range must succeed on a Wisdom saving throw or have the Charmed condition until the spell ends. For the duration, you can take a Bonus Action to designate a direction that is horizontal to you. Each Charmed target must use as much of its movement as possible to move in that direction on its next turn, taking the safest route. After moving in this way, a target repeats the save, ending the spell on itself on a success.",
      summary: 'Wis save or Charmed. Bonus action: Charmed must move in designated direction.',
    },
  },
{
    id: 'confusion',
    name: 'Confusion',
    school: 'enchantment',
    level: 4,
    classes: ['bard', 'druid', 'sorcerer', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 90, unit: 'ft' } },
    duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true, material: { description: 'three nut shells' } },
    resolution: {
      caveats: [
        '1d10 behavior table and repeat saves are not fully enforced.',
      ],
    },
    effects: [
      { kind: 'targeting', target: 'creatures-in-area', targetType: 'creature', area: { kind: 'sphere', size: 10 } },
      {
        kind: 'save',
        save: { ability: 'wis' },
        onFail: [
      { kind: 'state', stateId: 'confused', notes: 'Cannot take Bonus Actions or Reactions. Roll 1d10 each turn: move randomly, do nothing, attack random creature, or act normally.', repeatSave: { ability: 'wis', timing: 'turn-end' } },
    ],
  },
  { kind: 'note', text: 'Behavior determined by 1d10 roll each turn.', category: 'flavor' as const },
],
    scaling: [{ category: 'expanded-area', description: '+5ft sphere radius per slot level above 4', mode: 'per-slot-level', startsAtSlotLevel: 5 }],
    description: {
      full: "Each creature in a 10-foot-radius Sphere centered on a point you choose within range must succeed on a Wisdom saving throw, or that target can't take Bonus Actions or Reactions and must roll 1d10 at the start of each of its turns to determine its behavior (move randomly, do nothing, attack random creature, or act normally). At the end of each of its turns, an affected target repeats the save. Using a Higher-Level Spell Slot. The Sphere's radius increases by 5 feet for each spell slot level above 4.",
      summary: '10ft sphere: Wis save or random behavior each turn. Radius scales with slot.',
    },
  },
  {
    id: 'conjure-minor-elementals',
    name: 'Conjure Minor Elementals',
    school: 'conjuration',
    level: 4,
    classes: ['druid', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'minute' } },
    range: { kind: 'distance', value: { value: 90, unit: 'ft' } },
    duration: { kind: 'timed', value: 10, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true },
    resolution: {
      casterOptions: [
        {
          kind: 'enum',
          id: 'conjure-minor-elementals-option',
          label: 'Summoning option',
          options: [
            { value: 'cr2-one', label: 'One elemental (CR 2 or lower)' },
            { value: 'cr1-two', label: 'Two elementals (CR 1 or lower)' },
            { value: 'cr-half-four', label: 'Four elementals (CR 1/2 or lower)' },
            { value: 'cr-quarter-eight', label: 'Eight elementals (CR 1/4 or lower)' },
          ],
        },
      ],
    },
    effects: [
      {
        kind: 'spawn',
        count: 1,
        placement: {
          kind: 'single-cell',
          rangeFromCaster: { value: 90, unit: 'ft' },
          requiresLineOfSight: true,
          mustBeUnoccupied: true,
        },
        poolFromCasterOption: {
          fieldId: 'conjure-minor-elementals-option',
          mapping: {
            'cr2-one': { count: 1, maxChallengeRating: 2, creatureType: 'elemental' },
            'cr1-two': { count: 2, maxChallengeRating: 1, creatureType: 'elemental' },
            'cr-half-four': { count: 4, maxChallengeRating: 0.5, creatureType: 'elemental' },
            'cr-quarter-eight': { count: 8, maxChallengeRating: 0.25, creatureType: 'elemental' },
          },
        },
        initiativeMode: 'group',
      },
      {
        kind: 'note',
        text: '6th-level slot: twice as many creatures. 8th-level slot: three times as many.',
        category: 'flavor' as const,
      },
    ],
    scaling: [
      {
        category: 'other',
        description: 'Using a 6th-level slot: twice as many creatures. Using an 8th-level slot: three times as many.',
        mode: 'threshold',
      },
    ],
    description: {
      full: "You summon elementals that appear in unoccupied spaces that you can see within range. You choose one of the following options for what appears: one elemental of challenge rating 2 or lower, two elementals of challenge rating 1 or lower, four elementals of challenge rating 1/2 or lower, or eight elementals of challenge rating 1/4 or lower. An elemental summoned by this spell disappears when it drops to 0 Hit Points or when the spell ends. The elementals are friendly to you and your companions. Roll initiative for the elementals as a group, which has its own turns. They obey any verbal commands that you issue to them (no action required by you). If you don't issue any, they defend themselves from hostile creatures but otherwise take no actions. Using a Higher-Level Spell Slot. Choose one of the summoning options above, and more creatures appear: twice as many with a 6th-level slot and three times as many with an 8th-level slot.",
      summary: 'Summon elementals (CR options). Group initiative; verbal commands. 6th/8th slot multiplies count.',
    },
  },
  {
    id: 'conjure-woodland-beings',
    name: 'Conjure Woodland Beings',
    school: 'conjuration',
    level: 4,
    classes: ['druid', 'ranger'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
    duration: { kind: 'timed', value: 10, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true },
    resolution: {
      casterOptions: [
        {
          kind: 'enum',
          id: 'conjure-woodland-beings-option',
          label: 'Summoning option',
          options: [
            { value: 'cr2-one', label: 'One fey (CR 2 or lower)' },
            { value: 'cr1-two', label: 'Two fey (CR 1 or lower)' },
            { value: 'cr-half-four', label: 'Four fey (CR 1/2 or lower)' },
            { value: 'cr-quarter-eight', label: 'Eight fey (CR 1/4 or lower)' },
          ],
        },
      ],
    },
    effects: [
      {
        kind: 'spawn',
        count: 1,
        placement: {
          kind: 'single-cell',
          rangeFromCaster: { value: 60, unit: 'ft' },
          requiresLineOfSight: true,
          mustBeUnoccupied: true,
        },
        poolFromCasterOption: {
          fieldId: 'conjure-woodland-beings-option',
          mapping: {
            'cr2-one': { count: 1, maxChallengeRating: 2, creatureType: 'fey' },
            'cr1-two': { count: 2, maxChallengeRating: 1, creatureType: 'fey' },
            'cr-half-four': { count: 4, maxChallengeRating: 0.5, creatureType: 'fey' },
            'cr-quarter-eight': { count: 8, maxChallengeRating: 0.25, creatureType: 'fey' },
          },
        },
        initiativeMode: 'group',
      },
      {
        kind: 'note',
        text: '6th-level slot: twice as many creatures. 8th-level slot: three times as many.',
        category: 'flavor' as const,
      },
    ],
    scaling: [
      {
        category: 'other',
        description: 'Using a 6th-level slot: twice as many creatures. Using an 8th-level slot: three times as many.',
        mode: 'threshold',
      },
    ],
    description: {
      full: "You summon fey creatures that appear in unoccupied spaces that you can see within range. You choose one of the following options for what appears: one fey creature of challenge rating 2 or lower, two fey creatures of challenge rating 1 or lower, four fey creatures of challenge rating 1/2 or lower, or eight fey creatures of challenge rating 1/4 or lower. A creature summoned by this spell disappears when it drops to 0 Hit Points or when the spell ends. The creatures are friendly to you and your companions. Roll initiative for the summoned creatures as a group, which has its own turns. They obey any verbal commands that you issue to them (no action required by you). If you don't issue any, they defend themselves from hostile creatures but otherwise take no actions. Using a Higher-Level Spell Slot. Choose one of the summoning options above, and more creatures appear: twice as many with a 6th-level slot and three times as many with an 8th-level slot.",
      summary: 'Summon fey (CR options). Group initiative; verbal commands. 6th/8th slot multiplies count.',
    },
  },
  {
    id: 'control-water',
    name: 'Control Water',
    school: 'transmutation',
    level: 4,
    classes: ['cleric', 'druid', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 300, unit: 'ft' } },
    duration: { kind: 'timed', value: 10, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true, material: { description: 'a mixture of water and dust' } },
    resolution: {
      caveats: [
        'Flood, Part Water, Redirect Flow, and Whirlpool mechanics are not simulated in encounter.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Control water in a Cube up to 100 feet on a side. Magic action to choose Flood, Part Water, Redirect Flow, or Whirlpool (see spell text).',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "Until the spell ends, you control any water inside an area that is a Cube up to 100 feet on a side. Magic action to choose: Flood (rise 20ft or create wave), Part Water (trench), Redirect Flow, or Whirlpool (50ft square, 25ft deep; Str save or 2d8 bludgeoning, pulled 10ft).",
      summary: 'Control water in 100ft cube. Flood, Part, Redirect, or Whirlpool.',
    },
  },
{
    id: 'death-ward',
    name: 'Death Ward',
    school: 'abjuration',
    level: 4,
    classes: ['cleric', 'paladin'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'touch' },
    duration: { kind: 'timed', value: 8, unit: 'hour' },
    components: { verbal: true, somatic: true },
    resolution: {
      caveats: [
        '0 HP replacement and instant-death negation are not enforced automatically.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'First time the target would drop to 0 HP: instead 1 HP, spell ends. If subjected to an instant-death effect without damage, negates it and spell ends.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "You touch a creature and grant it a measure of protection from death. The first time the target would drop to 0 Hit Points before the spell ends, the target instead drops to 1 Hit Point, and the spell ends. If the spell is still in effect when the target is subjected to an effect that would kill it instantly without dealing damage, that effect is negated against the target, and the spell ends.",
      summary: 'Once: 0 HP becomes 1 HP. Negates instant-death effects.',
    },
  },
{
    id: 'dimension-door',
    name: 'Dimension Door',
    school: 'conjuration',
    level: 4,
    classes: ['bard', 'sorcerer', 'warlock', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 500, unit: 'ft' } },
    duration: { kind: 'instantaneous' },
    components: { verbal: true },
    resolution: {
      caveats: [
        'Destination validity, carrying capacity, and mishap damage are not enforced in encounter.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Teleport from your current location to any spot within range you know. Bring objects you can carry. Optionally bring one willing creature of your size or smaller within 5 feet of you.',
        category: 'under-modeled' as const,
      },
      {
        kind: 'note',
        text: 'If you would arrive in a space occupied by a creature or object, you and any traveler each take 4d6 Force damage and the spell fails to teleport you.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "You teleport yourself from your current location to any other spot within range. You must know the destination. You can bring along objects as long as their weight doesn't exceed what you can carry. You can also bring one willing creature of your size or smaller who is within 5 feet of you when you cast this spell. If you would arrive in a space already occupied by an object or a creature, you and any creature traveling with you each take 4d6 Force damage, and the spell fails to teleport you.",
      summary: 'Teleport 500 ft to a known destination; optional willing creature within 5 ft. Mishap if occupied.',
    },
  },
{
    id: 'divination',
    name: 'Divination',
    school: 'divination',
    level: 4,
    classes: ['cleric', 'druid', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' }, alternate: [{ value: 1, unit: 'action', ritual: true }] },
    range: { kind: 'self' },
    duration: { kind: 'instantaneous' },
    components: { verbal: true, somatic: true, material: { description: 'incense worth 25+ GP', cost: { value: 25, unit: 'gp', atLeast: true }, consumed: true } },
    resolution: {
      caveats: [
        'GM answer and cumulative no-answer chance are not simulated.',
      ],
    },
    effects: [
      { kind: 'note', text: 'Ask one question about a goal, event, or activity within 7 days. Receive a truthful reply. 25% cumulative no-answer chance per repeat cast before Long Rest.', category: 'flavor' as const },
    ],
    description: {
      full: "This spell puts you in contact with a god or a god's servants. You ask one question about a specific goal, event, or activity to occur within 7 days. The GM offers a truthful reply, which might be a short phrase or cryptic rhyme. If you cast the spell more than once before finishing a Long Rest, there is a cumulative 25 percent chance for each casting after the first that you get no answer.",
      summary: 'One question about next 7 days. Truthful reply. 25% no-answer on repeat.',
    },
  },
{
    id: 'dominate-beast',
    name: 'Dominate Beast',
    school: 'enchantment',
    level: 4,
    classes: ['druid', 'ranger', 'sorcerer'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
    duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true },
    resolution: {
      caveats: [
        'Telepathic commands, repeat saves on damage, and higher-slot durations are not fully enforced.',
      ],
    },
    effects: [
      { kind: 'targeting', target: 'one-creature', targetType: 'creature' },
      {
        kind: 'save',
        save: { ability: 'wis' },
        onFail: [{ kind: 'condition', conditionId: 'charmed' }],
      },
      {
        kind: 'note',
        text: 'Wis save with Advantage if you or allies are fighting the target. Telepathic commands (no action). Target repeats the save when it takes damage. Higher slot: longer duration per spell text.',
        category: 'under-modeled' as const,
      },
    ],
    scaling: [{ category: 'longer-duration', description: 'Duration extends at 5th–7th+ slot levels per spell text', mode: 'per-slot-level', startsAtSlotLevel: 5 }],
    description: {
      full: "One Beast you can see within range must succeed on a Wisdom saving throw or have the Charmed condition. Advantage if you or allies are fighting it. Whenever the target takes damage, it repeats the save. You have a telepathic link; issue commands (no action). Using a Higher-Level Spell Slot. Duration: 5 (10 min), 6 (1 hour), 7+ (8 hours).",
      summary: 'Beast Wis save or Charmed. Telepathic commands. Repeat save when damaged.',
    },
  },
{
    id: 'fabricate',
    name: 'Fabricate',
    school: 'transmutation',
    level: 4,
    classes: ['wizard'],
    castingTime: { normal: { value: 10, unit: 'minute' } },
    range: { kind: 'distance', value: { value: 120, unit: 'ft' } },
    duration: { kind: 'instantaneous' },
    components: { verbal: true, somatic: true },
    resolution: {
      caveats: [
        'Crafting outcomes and tool proficiency gates are not enforced.',
      ],
    },
    effects: [
      { kind: 'note', text: 'Convert raw materials into products of the same material. Large or smaller (10ft cube). Metal/stone: max Medium (5ft cube). Proficiency with tools required for weapons/armor.', category: 'flavor' as const },
    ],
    description: {
      full: "You convert raw materials into products of the same material. You can fabricate a Large or smaller object (10-foot Cube or eight 5-foot Cubes) given sufficient material. Metal, stone, or mineral: max Medium (5-foot Cube). Can't create creatures or magic items. Need proficiency with Artisan's Tools for weapons and armor.",
      summary: 'Convert raw materials to finished products. Size limits by material.',
    },
  },
{
    id: 'faithful-hound',
    name: 'Faithful Hound',
    school: 'conjuration',
    level: 4,
    classes: ['wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 30, unit: 'ft' } },
    duration: { kind: 'timed', value: 8, unit: 'hour' },
    components: { verbal: true, somatic: true, material: { description: 'a silver whistle' } },
    resolution: {
      caveats: [
        'Watchdog detection, bite timing, and movement are not modeled as a combatant.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Phantom watchdog: invisible, intangible, invulnerable. Barks when a Small+ creature comes within 30 ft without the password. Truesight 30 ft. At the start of each of your turns, bite one enemy within 5 ft: Dex save or 4d8 Force. Magic action to move the hound 30 ft.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "You conjure a phantom watchdog in an unoccupied space within range. No one but you can see it; it is intangible and invulnerable. When a Small or larger creature comes within 30 feet without speaking the password, the hound barks loudly. It has Truesight 30 feet. At the start of each of your turns, the hound attempts to bite one enemy within 5 feet: Dex save or 4d8 Force damage. Magic action to move the hound up to 30 feet.",
      summary: 'Phantom watchdog. Barks at intruders. Bite 4d8 Force.',
    },
  },
];
