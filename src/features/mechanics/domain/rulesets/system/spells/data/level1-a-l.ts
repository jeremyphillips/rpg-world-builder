import type { SpellEntry } from '../types';

/**
 * Level 1 spells A–L — authoring status:
 * - **Attack/save/AoE modeled:** Burning Hands, Bane, Bless, Charm Person, Command, Cure Wounds, Faerie Fire, Chromatic Orb (base hit), Color Spray, Dissonant Whispers, Entangle, Ensnaring Strike (save + Restrained), Divine Smite (rider damage).
 * - **Utility / sense / state:** Comprehend Languages, Detect Evil and Good, Detect Magic, Detect Poison, Expeditious Retreat, Find Familiar (spawn + notes).
 * - **Note-first / heavy caveats:** Alarm (ward), False Life (temp HP), Floating Disk; Create or Destroy Water uses caveats + under-modeled note.
 */
export const SPELLS_LEVEL_1_A_L: readonly SpellEntry[] = [
  {
    id: 'alarm',
    name: 'Alarm',
    school: 'abjuration',
    level: 1,
    classes: ['ranger', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'minute' }, alternate: [{ value: 1, unit: 'minute', ritual: true }] },
    range: { kind: 'distance', value: { value: 30, unit: 'ft' } },
    duration: { kind: 'timed', value: 8, unit: 'hour' },
    components: { verbal: true, somatic: true, material: { description: 'a bell and silver wire' } },
    resolution: {
      caveats: [
        'Ward triggers, exclusions, and audible vs mental alarm are not enforced in encounter.',
      ],
      casterOptions: [
        {
          kind: 'enum',
          id: 'alarm-ward-shape',
          label: 'Ward',
          options: [
            { value: 'door', label: 'A door' },
            { value: 'window', label: 'A window' },
            { value: 'area', label: 'An area (max 20-foot Cube)' },
          ],
        },
        {
          kind: 'enum',
          id: 'alarm-kind',
          label: 'Alarm',
          options: [
            { value: 'audible', label: 'Audible (handbell sound, 60 ft)' },
            { value: 'mental', label: 'Mental (ping within 1 mile)' },
          ],
        },
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Wards door, window, or 20-foot cube. Alerts when touched. Audible or mental alarm.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "You set an alarm against intrusion. Choose a door, a window, or an area within range that is no larger than a 20-foot Cube. Until the spell ends, an alarm alerts you whenever a creature touches or enters the warded area. When you cast the spell, you can designate creatures that won't set off the alarm. You also choose whether the alarm is audible or mental: Audible Alarm. The alarm produces the sound of a handbell for 10 seconds within 60 feet of the warded area. Mental Alarm. You are alerted by a mental ping if you are within 1 mile of the warded area. This ping awakens you if you're asleep.",
      summary: 'Wards an area; alerts when creatures touch or enter. Audible or mental alarm.',
    },
  },
  {
    id: 'animal-friendship',
    name: 'Animal Friendship',
    school: 'enchantment',
    level: 1,
    classes: ['bard', 'druid', 'ranger'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 30, unit: 'ft' } },
    duration: { kind: 'timed', value: 24, unit: 'hour' },
    components: { verbal: true, somatic: true, material: { description: 'a morsel of food' } },
    resolution: {
      caveats: [
        'Spell ends if the caster or any ally damages the target; not enforced in encounter resolution.',
      ],
    },
    effects: [
      { kind: 'targeting', target: 'one-creature', targetType: 'creature', requiresSight: true, creatureTypeFilter: ['beast'] },
      { kind: 'save', save: { ability: 'wis' }, onFail: [{ kind: 'condition', conditionId: 'charmed' }] },
      { kind: 'note', text: 'Ends if you or allies deal damage to the target.', category: 'flavor' as const },
    ],
    description: {
      full: "Target a Beast that you can see within range. The target must succeed on a Wisdom saving throw or have the Charmed condition for the duration. If you or one of your allies deals damage to the target, the spells ends. Using a Higher-Level Spell Slot. You can target one additional Beast for each spell slot level above 1.",
      summary: 'Beast makes Wis save or is Charmed for 24 hours. Scales with extra targets.',
    },
  },
{
    id: 'bane',
    name: 'Bane',
    school: 'enchantment',
    level: 1,
    classes: ['bard', 'cleric', 'warlock'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 30, unit: 'ft' } },
    duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true, material: { description: 'a drop of blood' } },
    effects: [
      { kind: 'targeting', target: 'chosen-creatures', targetType: 'creature', count: 3, requiresSight: true },
      {
        kind: 'save',
        save: { ability: 'cha' },
        onFail: [
          { kind: 'state', stateId: 'baned', notes: 'Subtract 1d4 from attack rolls and saving throws.' },
        ],
      },
    ],
    scaling: [{ category: 'extra-targets', description: '+1 target per slot level above 1', mode: 'per-slot-level', startsAtSlotLevel: 2 }],
    description: {
      full: "Up to three creatures of your choice that you can see within range must each make a Charisma saving throw. Whenever a target that fails this save makes an attack roll or a saving throw before the spell ends, the target must subtract 1d4 from the attack roll or save. Using a Higher-Level Spell Slot. You can target one additional creature for each spell slot level above 1.",
      summary: 'Up to 3 creatures: Cha save or subtract 1d4 from attacks and saves. Scales with extra targets.',
    },
  },
{
    id: 'bless',
    name: 'Bless',
    school: 'enchantment',
    level: 1,
    classes: ['cleric', 'paladin'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 30, unit: 'ft' } },
    duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true, material: { description: 'a Holy Symbol worth 5+ GP', cost: { value: 5, unit: 'gp', atLeast: true } } },
    effects: [
      { kind: 'targeting', target: 'chosen-creatures', targetType: 'creature', count: 3 },
      { kind: 'state', stateId: 'blessed', notes: 'Add 1d4 to attack rolls and saving throws.' },
    ],
    scaling: [{ category: 'extra-targets', description: '+1 target per slot level above 1', mode: 'per-slot-level', startsAtSlotLevel: 2 }],
    description: {
      full: "You bless up to three creatures within range. Whenever a target makes an attack roll or a saving throw before the spell ends, the target adds 1d4 to the attack roll or save. Using a Higher-Level Spell Slot. You can target one additional creature for each spell slot level above 1.",
      summary: 'Up to 3 creatures add 1d4 to attacks and saves. Scales with extra targets.',
    },
  },
{
    id: 'burning-hands',
    name: 'Burning Hands',
    school: 'evocation',
    level: 1,
    classes: ['sorcerer', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'self' },
    duration: { kind: 'instantaneous' },
    components: { verbal: true, somatic: true },
    effects: [
      { kind: 'targeting', target: 'creatures-in-area', targetType: 'creature', area: { kind: 'cone', size: 15 } },
      {
        kind: 'save',
        save: { ability: 'dex' },
        onFail: [{ kind: 'damage', damage: '3d6', damageType: 'fire' }],
        onSuccess: [{ kind: 'damage', damage: '1d6', damageType: 'fire' }],
      },
      { kind: 'note', text: "Flammable objects in the Cone that aren't being worn or carried start burning.", category: 'flavor' as const },
    ],
    scaling: [{ category: 'extra-damage', description: '+1d6 fire per slot level above 1', mode: 'per-slot-level', startsAtSlotLevel: 2, amount: '1d6' }],
    description: {
      full: "A thin sheet of flames shoots forth from you. Each creature in a 15-foot Cone makes a Dexterity saving throw, taking 3d6 Fire damage on a failed save or half as much damage on a successful one. Flammable objects in the Cone that aren't being worn or carried start burning. Using a Higher-Level Spell Slot. The damage increases by 1d6 for each spell slot level above 1.",
      summary: '15-foot cone: Dex save or 3d6 fire. Damage scales with slot level.',
    },
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
    resolution: {
      caveats: [
        'Advantage on the save when you or allies are fighting the target is not applied by the engine.',
      ],
    },
    effects: [
      { kind: 'targeting', target: 'one-creature', targetType: 'creature', creatureTypeFilter: ['humanoid'] },
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
        text: 'The Charmed creature is Friendly to you. When the spell ends, the target knows it was Charmed by you.',
        category: 'flavor' as const,
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
    id: 'chromatic-orb',
    name: 'Chromatic Orb',
    school: 'evocation',
    level: 1,
    classes: ['sorcerer', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 90, unit: 'ft' } },
    duration: { kind: 'instantaneous' },
    components: { verbal: true, somatic: true, material: { description: 'a diamond worth 50+ GP', cost: { value: 50, unit: 'gp', atLeast: true } } },
    deliveryMethod: 'ranged-spell-attack',
    resolution: {
      caveats: [
        'Damage type is chosen when you cast; encounter logging may use a single type.',
        'Duplicate d8 leap to another target and slot-level leap cap are not resolved.',
      ],
    },
    effects: [
      { kind: 'targeting', target: 'one-creature', targetType: 'creature' },
      {
        kind: 'damage',
        damage: '3d8',
        damageType: 'acid',
      },
      {
        kind: 'note',
        text: 'Choose Acid, Cold, Fire, Lightning, Poison, or Thunder. If two or more d8s show the same number, the orb can leap to another target within 30 feet (up to a number of leaps equal to the spell slot level).',
        category: 'under-modeled' as const,
      },
    ],
    scaling: [{ category: 'extra-damage', description: '+1d8 per spell slot level above 1', mode: 'per-slot-level', startsAtSlotLevel: 2, amount: '1d8' }],
    description: {
      full: "You hurl an orb of energy at a target within range. Choose Acid, Cold, Fire, Lightning, Poison, or Thunder for the type of orb you create, and then make a ranged spell attack against the target. On a hit, the target takes 3d8 damage of the chosen type. If you roll the same number on two or more of the d8s, the orb leaps to a different target within 30 feet. Using a Higher-Level Spell Slot. The damage increases by 1d8 for each spell slot level above 1. The orb can leap a maximum number of times equal to the slot level.",
      summary: 'Ranged spell attack 3d8 (choose damage type). Orb can leap on duplicate rolls. Scales with slot.',
    },
  },
{
    id: 'color-spray',
    name: 'Color Spray',
    school: 'illusion',
    level: 1,
    classes: ['bard', 'sorcerer', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'self' },
    duration: { kind: 'instantaneous' },
    components: { verbal: true, somatic: true, material: { description: 'a pinch of colorful sand' } },
    resolution: {
      caveats: [
        'Encounter maps cone AoE to all-enemies; no cone geometry or selective creatures.',
      ],
    },
    effects: [
      { kind: 'targeting', target: 'creatures-in-area', targetType: 'creature', area: { kind: 'cone', size: 15 } },
      {
        kind: 'save',
        save: { ability: 'con' },
        onFail: [{ kind: 'condition', conditionId: 'blinded' }],
      },
      {
        kind: 'note',
        text: 'Blinded until the end of your next turn. Duration not tracked as effect-level timing in encounter.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "You launch a dazzling array of flashing, colorful light. Each creature in a 15-foot Cone originating from you must succeed on a Constitution saving throw or have the Blinded condition until the end of your next turn.",
      summary: '15-foot cone: Con save or Blinded until end of your next turn.',
    },
  },
{
    id: 'command',
    name: 'Command',
    school: 'enchantment',
    level: 1,
    classes: ['bard', 'cleric', 'paladin'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
    duration: { kind: 'instantaneous' },
    components: { verbal: true },
    effects: [
      { kind: 'targeting', target: 'one-creature', targetType: 'creature', requiresSight: true },
      { kind: 'save', save: { ability: 'wis' }, onFail: [{ kind: 'state', stateId: 'commanded', notes: 'Target follows one-word command on its next turn: Approach, Drop, Flee, Grovel, or Halt.' }] },
      { kind: 'note', text: 'Specific command behavior (Approach, Drop, Flee, Grovel, Halt) varies by DM ruling.', category: 'flavor' as const },
    ],
    description: {
      full: "You speak a one-word command to a creature you can see within range. The target must succeed on a Wisdom saving throw or follow the command on its next turn. Choose: Approach, Drop, Flee, Grovel, or Halt. Using a Higher-Level Spell Slot. You can affect one additional creature for each spell slot level above 1.",
      summary: 'One-word command (Approach, Drop, Flee, Grovel, Halt). Wis save or obey. Scales with targets.',
    },
  },
{
    id: 'comprehend-languages',
    name: 'Comprehend Languages',
    school: 'divination',
    level: 1,
    classes: ['bard', 'sorcerer', 'warlock', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' }, alternate: [{ value: 1, unit: 'action', ritual: true }] },
    range: { kind: 'self' },
    duration: { kind: 'timed', value: 1, unit: 'hour' },
    components: { verbal: true, somatic: true, material: { description: 'a pinch of soot and salt' } },
    effects: [
      { kind: 'state', stateId: 'comprehend-languages', notes: 'Understand literal meaning of any spoken/written language. Touch to read.' },
      { kind: 'note', text: 'Does not decode symbols or secret messages.', category: 'flavor' as const },
    ],
    description: {
      full: "For the duration, you understand the literal meaning of any language that you hear or see signed. You also understand any written language that you see, but you must be touching the surface on which the words are written. It takes about 1 minute to read one page of text. This spell doesn't decode symbols or secret messages.",
      summary: 'Understand any spoken or written language. Touch to read. Does not decode symbols.',
    },
  },
{
    id: 'create-or-destroy-water',
    name: 'Create or Destroy Water',
    school: 'transmutation',
    level: 1,
    classes: ['cleric', 'druid'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 30, unit: 'ft' } },
    duration: { kind: 'instantaneous' },
    components: { verbal: true, somatic: true, material: { description: 'a mix of water and sand' } },
    resolution: {
      caveats: [
        'Create/destroy modes, volume, and slot scaling are not enforced in encounter.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Create: 10 gallons water or 30ft cube rain. Destroy: 10 gallons or 30ft cube fog.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "Create Water: You create up to 10 gallons of clean water within range in an open container, or the water falls as rain in a 30-foot Cube, extinguishing exposed flames. Destroy Water: You destroy up to 10 gallons of water in an open container, or destroy fog in a 30-foot Cube. Using a Higher-Level Spell Slot. You create or destroy 10 additional gallons, or the Cube size increases by 5 feet, for each spell slot level above 1.",
      summary: 'Create or destroy water. Amount/area scales with slot level.',
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
      { kind: 'hit-points', mode: 'heal', value: '2d8', abilityModifier: true },
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
    id: 'detect-evil-and-good',
    name: 'Detect Evil and Good',
    school: 'divination',
    level: 1,
    classes: ['cleric', 'paladin'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'self' },
    duration: { kind: 'timed', value: 10, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true },
    effects: [
      { kind: 'state', stateId: 'detect-evil-and-good', notes: 'Sense Aberration, Celestial, Elemental, Fey, Fiend, Undead within 30ft. Sense Hallow.' },
      { kind: 'note', text: 'Blocked by 1 foot of stone, dirt, or wood; 1 inch of metal; or a thin sheet of lead.', category: 'flavor' as const },
    ],
    description: {
      full: "For the duration, you sense the location of any Aberration, Celestial, Elemental, Fey, Fiend, or Undead within 30 feet of yourself. You also sense whether the Hallow spell is active there. The spell is blocked by 1 foot of stone, dirt, or wood; 1 inch of metal; or a thin sheet of lead.",
      summary: 'Sense extraplanar creature types within 30ft. Blocked by stone/lead.',
    },
  },
{
    id: 'detect-magic',
    name: 'Detect Magic',
    school: 'divination',
    level: 1,
    classes: ['bard', 'cleric', 'druid', 'paladin', 'ranger', 'sorcerer', 'warlock', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' }, alternate: [{ value: 1, unit: 'action', ritual: true }] },
    range: { kind: 'self' },
    duration: { kind: 'timed', value: 10, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true },
    effects: [
      { kind: 'state', stateId: 'detect-magic', notes: 'Sense magic within 30ft. Magic action to see aura and learn spell school.' },
      { kind: 'note', text: 'Blocked by 1 foot of stone, metal, or wood, or a thin sheet of lead.', category: 'flavor' as const },
    ],
    description: {
      full: "For the duration, you sense the presence of magical effects within 30 feet of yourself. If you sense such effects, you can take the Magic action to see a faint aura around any visible creature or object in the area that bears the magic, and if an effect was created by a spell, you learn the spell's school of magic. The spell is blocked by 1 foot of stone, dirt, or wood; 1 inch of metal; or a thin sheet of lead.",
      summary: 'Sense magic within 30ft. Magic action to identify school. Blocked by stone/lead.',
    },
  },
{
    id: 'detect-poison-and-disease',
    name: 'Detect Poison and Disease',
    school: 'divination',
    level: 1,
    classes: ['cleric', 'druid', 'paladin', 'ranger'],
    castingTime: { normal: { value: 1, unit: 'action' }, alternate: [{ value: 1, unit: 'action', ritual: true }] },
    range: { kind: 'self' },
    duration: { kind: 'timed', value: 10, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true, material: { description: 'a yew leaf' } },
    effects: [
      { kind: 'state', stateId: 'detect-poison-and-disease', notes: 'Sense poisons, poisonous creatures, and magical contagions within 30ft. Learn kind.' },
      { kind: 'note', text: 'Blocked by 1 foot of stone, dirt, or wood; 1 inch of metal; or a thin sheet of lead.', category: 'flavor' as const },
    ],
    description: {
      full: "For the duration, you sense the location of poisons, poisonous or venomous creatures, and magical contagions within 30 feet of yourself. You sense the kind of poison, creature, or contagion in each case. The spell is blocked by 1 foot of stone, dirt, or wood; 1 inch of metal; or a thin sheet of lead.",
      summary: 'Sense poisons and diseases within 30ft. Blocked by stone/lead.',
    },
  },
{
    id: 'disguise-self',
    name: 'Disguise Self',
    school: 'illusion',
    level: 1,
    classes: ['bard', 'sorcerer', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'self' },
    duration: { kind: 'timed', value: 1, unit: 'hour' },
    components: { verbal: true, somatic: true },
    resolution: {
      caveats: [
        'Investigation contest to discern disguise is not resolved in encounter.',
      ],
    },
    effects: [
      {
        kind: 'state',
        stateId: 'disguise-self',
        notes: 'Illusory change to appearance, clothing, and gear; same limb layout. Fails physical inspection.',
      },
      {
        kind: 'note',
        text: 'A creature can take the Study action and succeed on Intelligence (Investigation) vs your spell save DC to discern the disguise.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "You make yourself—including your clothing, armor, weapons, and other belongings—look different until the spell ends. You can seem 1 foot shorter or taller and can appear heavier or lighter. You must adopt a form that has the same basic arrangement of limbs. The changes fail to hold up to physical inspection. To discern that you are disguised, a creature must take the Study action and succeed on an Intelligence (Investigation) check against your spell save DC.",
      summary: 'Illusory disguise. Study + Investigation check to discern.',
    },
  },
{
    id: 'dissonant-whispers',
    name: 'Dissonant Whispers',
    school: 'enchantment',
    level: 1,
    classes: ['bard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
    duration: { kind: 'instantaneous' },
    components: { verbal: true },
    resolution: {
      caveats: [
        'Half damage on success uses a fixed dice expression in data; forced reaction movement is not enforced.',
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
            damage: '3d6',
            damageType: 'psychic',
          },
        ],
        onSuccess: [
          {
            kind: 'damage',
            damage: '2d6',
            damageType: 'psychic',
          },
        ],
      },
      {
        kind: 'note',
        text: 'On a failed save, the target must immediately use its Reaction, if available, to move as far from you as its speed allows. On a successful save, half damage only (2d6 approximates half of 3d6 for automated resolution).',
        category: 'under-modeled' as const,
      },
    ],
    scaling: [{ category: 'extra-damage', description: '+1d6 per spell slot level above 1', mode: 'per-slot-level', startsAtSlotLevel: 2, amount: '1d6' }],
    description: {
      full: "One creature of your choice that you can see within range hears a discordant melody in its mind. The target makes a Wisdom saving throw. On a failed save, it takes 3d6 Psychic damage and must immediately use its Reaction, if available, to move as far away from you as it can. On a successful save, the target takes half as much damage only. Using a Higher-Level Spell Slot. The damage increases by 1d6 for each spell slot level above 1.",
      summary: 'Wis save or 3d6 psychic and must flee. Damage scales with slot.',
    },
  },
{
    id: 'divine-favor',
    name: 'Divine Favor',
    school: 'transmutation',
    level: 1,
    classes: ['paladin'],
    castingTime: { normal: { value: 1, unit: 'bonus-action' } },
    range: { kind: 'self' },
    duration: { kind: 'timed', value: 1, unit: 'minute' },
    components: { verbal: true, somatic: true },
    resolution: {
      caveats: [
        'Extra weapon damage on hit is not applied as a separate damage roll in encounter.',
      ],
    },
    effects: [
      {
        kind: 'state',
        stateId: 'divine-favor',
        notes: 'Your weapon attacks deal an extra 1d4 Radiant damage on a hit.',
      },
    ],
    description: {
      full: "Until the spell ends, your attacks with weapons deal an extra 1d4 Radiant damage on a hit.",
      summary: 'Weapon attacks deal +1d4 radiant.',
    },
  },
{
    id: 'divine-smite',
    name: 'Divine Smite',
    school: 'evocation',
    level: 1,
    classes: ['paladin'],
    castingTime: { normal: { value: 1, unit: 'bonus-action', trigger: 'immediately after hitting with melee weapon or Unarmed Strike' } },
    range: { kind: 'self' },
    duration: { kind: 'instantaneous' },
    components: { verbal: true },
    resolution: {
      caveats: [
        'Cast as a rider after a weapon hit; Fiend/Undead bonus damage and slot scaling are noted only.',
      ],
    },
    effects: [
      { kind: 'targeting', target: 'one-creature', targetType: 'creature' },
      {
        kind: 'damage',
        damage: '2d8',
        damageType: 'radiant',
      },
      {
        kind: 'note',
        text: '+1d8 if the target is a Fiend or Undead. +1d8 per spell slot level above 1.',
        category: 'under-modeled' as const,
      },
    ],
    scaling: [{ category: 'extra-damage', description: '+1d8 per spell slot level above 1', mode: 'per-slot-level', startsAtSlotLevel: 2, amount: '1d8' }],
    description: {
      full: "The target takes an extra 2d8 Radiant damage from the attack. The damage increases by 1d8 if the target is a Fiend or an Undead. Using a Higher-Level Spell Slot. The damage increases by 1d8 for each spell slot level above 1.",
      summary: 'Extra 2d8 radiant on hit. +1d8 vs Fiend/Undead. Scales with slot.',
    },
  },
{
    id: 'ensnaring-strike',
    name: 'Ensnaring Strike',
    school: 'conjuration',
    level: 1,
    classes: ['ranger'],
    castingTime: { normal: { value: 1, unit: 'bonus-action', trigger: 'immediately after hitting creature with a weapon' } },
    range: { kind: 'self' },
    duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true },
    resolution: {
      caveats: [
        'Bonus-action rider after a weapon hit; Large+ advantage on save and ongoing turn damage not fully enforced.',
      ],
    },
    effects: [
      { kind: 'targeting', target: 'one-creature', targetType: 'creature' },
      {
        kind: 'save',
        save: { ability: 'str' },
        onFail: [{ kind: 'condition', conditionId: 'restrained' }],
      },
      {
        kind: 'note',
        text: 'Large or larger targets have Advantage on the save. Restrained target takes 1d6 Piercing at the start of each of its turns; escape with Athletics vs your spell save DC. +1d6 per slot to that damage.',
        category: 'under-modeled' as const,
      },
    ],
    scaling: [{ category: 'extra-damage', description: '+1d6 Piercing per turn per spell slot level above 1', mode: 'per-slot-level', startsAtSlotLevel: 2, amount: '1d6' }],
    description: {
      full: "As you hit the target, grasping vines appear on it, and it makes a Strength saving throw. A Large or larger creature has Advantage. On a failed save, the target has the Restrained condition until the spell ends. While Restrained, the target takes 1d6 Piercing damage at the start of each of its turns. The target or a creature within reach can take an action to make a Strength (Athletics) check against your spell save DC to end the spell. Using a Higher-Level Spell Slot. The damage increases by 1d6 for each spell slot level above 1.",
      summary: 'Str save or Restrained, 1d6 piercing/turn. Scales with slot.',
    },
  },
{
    id: 'entangle',
    name: 'Entangle',
    school: 'conjuration',
    level: 1,
    classes: ['druid', 'ranger'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 90, unit: 'ft' } },
    duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true },
    resolution: {
      caveats: [
        'Encounter maps area spells to all-enemies; difficult terrain and selective creatures in the square are not modeled.',
      ],
    },
    effects: [
      { kind: 'targeting', target: 'creatures-in-area', targetType: 'creature', area: { kind: 'cube', size: 20 } },
      {
        kind: 'save',
        save: { ability: 'str' },
        onFail: [{ kind: 'condition', conditionId: 'restrained' }],
      },
      {
        kind: 'note',
        text: 'Ground in the area is Difficult Terrain. Restrained creature can use an action to make Strength (Athletics) vs your spell save DC to escape.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "Grasping plants sprout from the ground in a 20-foot square within range. For the duration, these plants turn the ground in the area into Difficult Terrain. Each creature (other than you) in the area when you cast the spell must succeed on a Strength saving throw or have the Restrained condition until the spell ends. A Restrained creature can take an action to make a Strength (Athletics) check against your spell save DC to free itself.",
      summary: '20-foot square: Str save or Restrained. Difficult Terrain.',
    },
  },
{
    id: 'expeditious-retreat',
    name: 'Expeditious Retreat',
    school: 'transmutation',
    level: 1,
    classes: ['sorcerer', 'warlock', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'bonus-action' } },
    range: { kind: 'self' },
    duration: { kind: 'timed', value: 10, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true },
    effects: [
      { kind: 'action', action: 'dash' },
      { kind: 'state', stateId: 'expeditious-retreat', notes: 'Can take Dash as a Bonus Action for the duration.' },
    ],
    description: {
      full: "You take the Dash action, and until the spell ends, you can take that action again as a Bonus Action.",
      summary: 'Dash as action and Bonus Action for duration.',
    },
  },
{
    id: 'faerie-fire',
    name: 'Faerie Fire',
    school: 'evocation',
    level: 1,
    classes: ['bard', 'druid'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
    duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true },
    effects: [
      { kind: 'targeting', target: 'creatures-in-area', targetType: 'creature', area: { kind: 'cube', size: 20 } },
      {
        kind: 'save',
        save: { ability: 'dex' },
        onFail: [
          { kind: 'roll-modifier', appliesTo: 'incoming-attacks', modifier: 'advantage' },
          { kind: 'note', text: 'Target outlined in light; sheds Dim Light 10ft. Cannot benefit from being Invisible.', category: 'flavor' as const },
        ],
      },
    ],
    description: {
      full: "Objects in a 20-foot Cube within range are outlined in blue, green, or violet light (your choice). Each creature in the Cube is also outlined if it fails a Dexterity saving throw. For the duration, objects and affected creatures shed Dim Light in a 10-foot radius and can't benefit from the Invisible condition. Attack rolls against an affected creature or object have Advantage if the attacker can see it.",
      summary: '20ft cube: Dex save or outlined. Advantage to hit affected. No Invisible.',
    },
  },
{
    id: 'false-life',
    name: 'False Life',
    school: 'necromancy',
    level: 1,
    classes: ['sorcerer', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'self' },
    duration: { kind: 'instantaneous' },
    components: { verbal: true, somatic: true, material: { description: 'a drop of alcohol' } },
    resolution: {
      caveats: [
        'Temporary Hit Points are not a first-class hit-points effect in encounter resolution.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'You gain 2d4 + 4 Temporary Hit Points. +5 temp HP per spell slot level above 1.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "You gain 2d4 + 4 Temporary Hit Points. Using a Higher-Level Spell Slot. You gain 5 additional Temporary Hit Points for each spell slot level above 1.",
      summary: 'Gain 2d4+4 temp HP. Scales with slot.',
    },
  },
{
    id: 'feather-fall',
    name: 'Feather Fall',
    school: 'transmutation',
    level: 1,
    classes: ['bard', 'sorcerer', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'reaction', trigger: 'when you or a creature you can see within 60 feet of you falls' } },
    range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
    duration: { kind: 'timed', value: 1, unit: 'minute' },
    components: { verbal: true, material: { description: 'a small feather or piece of down' } },
    resolution: {
      caveats: [
        'Fall rate, multi-target selection, and per-creature spell end are not enforced in encounter.',
      ],
    },
    effects: [
      {
        kind: 'targeting',
        target: 'chosen-creatures',
        targetType: 'creature',
        count: 5,
      },
      {
        kind: 'note',
        text: 'Chosen creatures fall 60 feet per round; if a creature lands before the spell ends, it takes no damage from the fall and the spell ends for that creature.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "Choose up to five falling creatures within range. A falling creature's rate of descent slows to 60 feet per round until the spell ends. If a creature lands before the spell ends, the creature takes no damage from the fall, and the spell ends for that creature.",
      summary: 'Up to 5 creatures fall 60ft/round, no fall damage.',
    },
  },
{
    id: 'find-familiar',
    name: 'Find Familiar',
    school: 'conjuration',
    level: 1,
    classes: ['wizard'],
    castingTime: { normal: { value: 1, unit: 'hour' }, alternate: [{ value: 1, unit: 'hour', ritual: true }] },
    range: { kind: 'distance', value: { value: 10, unit: 'ft' } },
    duration: { kind: 'instantaneous' },
    components: { verbal: true, somatic: true, material: { description: 'burning incense worth 10+ GP', cost: { value: 10, unit: 'gp', atLeast: true }, consumed: true } },
    resolution: {
      caveats: [
        'Spawn effect does not create a combatant; familiar abilities are not enforced in encounter.',
      ],
    },
    effects: [
      { kind: 'spawn', creature: 'familiar', count: 1, location: 'self-space', actsWhen: 'immediately-after-source-turn' },
      {
        kind: 'note',
        text: 'Familiar is CR 0 Beast form (Celestial/Fey/Fiend). Telepathy 100ft. Bonus Action: see/hear through it. Can deliver touch spells.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "You gain the service of a familiar, a spirit that takes an animal form you choose (Bat, Cat, Frog, Hawk, Lizard, Octopus, Owl, Rat, Raven, Spider, Weasel, or CR 0 Beast). The familiar has the statistics of the chosen form but is Celestial, Fey, or Fiend. Telepathic connection within 100 feet. Bonus Action: see through familiar's eyes. Familiar can deliver touch spells. Dismiss to pocket dimension as Magic action.",
      summary: 'Gain familiar. Telepathy, see through eyes, deliver touch spells.',
    },
  },
{
    id: 'floating-disk',
    name: 'Floating Disk',
    school: 'conjuration',
    level: 1,
    classes: ['wizard'],
    castingTime: { normal: { value: 1, unit: 'action' }, alternate: [{ value: 1, unit: 'action', ritual: true }] },
    range: { kind: 'distance', value: { value: 30, unit: 'ft' } },
    duration: { kind: 'timed', value: 1, unit: 'hour' },
    components: { verbal: true, somatic: true, material: { description: 'a drop of mercury' } },
    resolution: {
      caveats: [
        'Disk movement, weight limit, and distance termination are not simulated in encounter.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: '3-foot diameter force disk floats 3ft above ground. Holds 500 lb. Follows you within 20ft. Spell ends if moved 100ft away.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "This spell creates a circular, horizontal plane of force, 3 feet in diameter and 1 inch thick, that floats 3 feet above the ground in an unoccupied space of your choice that you can see within range. The disk remains for the duration and can hold up to 500 pounds. If more weight is placed on it, the spell ends, and everything on the disk falls to the ground. The disk is immobile while you are within 20 feet of it. If you move more than 20 feet away from it, the disk follows you so that it remains within 20 feet of you. It can move across uneven terrain, up or down stairs, slopes and the like, but it can't cross an elevation change of 10 feet or more. For example, the disk can't move across a 10-foot-deep pit, nor could it leave such a pit if it was created at the bottom. If you move more than 100 feet from the disk (typically because it can't move around an obstacle to follow you), the spell ends.",
      summary: '3-foot force disk holds 500 lb, follows within 20ft. Ends if 100ft away.',
    },
  },
{
    id: 'fog-cloud',
    name: 'Fog Cloud',
    school: 'conjuration',
    level: 1,
    classes: ['druid', 'ranger', 'sorcerer', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 120, unit: 'ft' } },
    duration: { kind: 'timed', value: 1, unit: 'hour', concentration: true, upTo: true },
    components: { verbal: true, somatic: true },
    resolution: {
      caveats: [
        'Encounter maps area spells to all-enemies; fog placement and wind dispersal are not modeled.',
      ],
    },
    effects: [
      { kind: 'targeting', target: 'creatures-in-area', targetType: 'creature', area: { kind: 'sphere', size: 20 } },
      { kind: 'state', stateId: 'heavily-obscured', notes: 'The sphere is Heavily Obscured.' },
      {
        kind: 'note',
        text: 'Dispersed by strong wind. Radius increases by 20 feet for each spell slot level above 1.',
        category: 'under-modeled' as const,
      },
    ],
    scaling: [{ category: 'expanded-area', description: '+20 ft radius per spell slot level above 1', mode: 'per-slot-level', startsAtSlotLevel: 2 }],
    description: {
      full: "You create a 20-foot-radius Sphere of fog centered on a point within range. The Sphere is Heavily Obscured. It lasts for the duration or until a strong wind (such as one created by Gust of Wind) disperses it. Using a Higher-Level Spell Slot. The fog's radius increases by 20 feet for each spell slot level above 1.",
      summary: '20-foot sphere Heavily Obscured fog. Radius scales with slot.',
    },
  },
];
