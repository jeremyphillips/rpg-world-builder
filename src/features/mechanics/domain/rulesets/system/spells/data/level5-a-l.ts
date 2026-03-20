import type { SpellEntry } from '../types';

/**
 * Level 5 spells A–L — authoring status:
 * - **Attack/save/AoE modeled:** Cloudkill, Cone of Cold, Contagion, Flame Strike.
 * - **Utility / divination / ritual:** Commune, Commune with Nature, Contact Other Plane, Legend Lore (in m–z), Scrying (in m–z).
 * - **Note-first / summons / heavy caveats:** Animate Objects, Arcane Hand, Conjure Elemental, Creation, Dream, Geas, Hallow, etc.
 */
export const SPELLS_LEVEL_5_A_L: readonly SpellEntry[] = [
{
    id: 'animate-objects',
    name: 'Animate Objects',
    school: 'transmutation',
    level: 5,
    classes: ['bard', 'sorcerer', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 120, unit: 'ft' } },
    duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true },
    resolution: {
      caveats: [
        'Animated constructs are not represented as full combatants in encounter.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Animate objects up to spellcasting mod count (M=1, L=2, H=3). Constructs under your control. Slam damage scales with slot.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "Objects animate at your command. Choose a number of nonmagical objects within range that aren't being worn or carried, aren't fixed to a surface, and aren't Gargantuan. The maximum number of objects is equal to your spellcasting ability modifier; for this number, a Medium or smaller target counts as one object, a Large target counts as two, and a Huge target counts as three. Each target animates, sprouts legs, and becomes a Construct that uses the Animated Object stat block; this creature is under your control until the spell ends or until it is reduced to 0 Hit Points. Using a Higher-Level Spell Slot. The creature's Slam damage increases by 1d4 (Medium or smaller), 1d6 (Large), or 1d12 (Huge) for each spell slot level above 5.",
      summary: 'Animate objects as Constructs under your control. Count and damage scale with slot level.',
    },
  },
{
    id: 'antilife-shell',
    name: 'Antilife Shell',
    school: 'abjuration',
    level: 5,
    classes: ['druid'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'self' },
    duration: { kind: 'timed', value: 1, unit: 'hour', concentration: true, upTo: true },
    components: { verbal: true, somatic: true },
    resolution: {
      caveats: [
        'Barrier passage and spell end on forced movement are not fully enforced.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: '10-foot Emanation blocks non-Construct/Undead from passing or reaching through. Spells and Ranged/Reach attacks pass through. Spell ends if you move and force an affected creature through the barrier.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "An aura extends from you in a 10-foot Emanation for the duration. The aura prevents creatures other than Constructs and Undead from passing or reaching through it. An affected creature can cast spells or make attacks with Ranged or Reach weapons through the barrier. If you move so that an affected creature is forced to pass through the barrier, the spell ends.",
      summary: '10ft aura blocks living creatures from passing. Ranged attacks and spells can pass through.',
    },
  },
{
    id: 'arcane-hand',
    name: 'Arcane Hand',
    school: 'evocation',
    level: 5,
    classes: ['sorcerer', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 120, unit: 'ft' } },
    duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true, material: { description: 'an eggshell and a glove' } },
    resolution: {
      caveats: [
        'Hand modes, Bonus Action timing, and object HP are not fully modeled.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Large hand: Clenched Fist (5d8 Force), Forceful Hand (push), Grasping Hand (grapple+crush), Interposing Hand (cover).',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "You create a Large hand of shimmering magical energy in an unoccupied space that you can see within range. The hand lasts for the duration, and it moves at your command, mimicking the movements of your own hand. The hand is an object that has AC 20 and Hit Points equal to your Hit Point maximum. When you cast the spell and as a Bonus Action on your later turns, you can move the hand up to 60 feet and then cause one of the following effects: Clenched Fist (5d8 Force), Forceful Hand (push), Grasping Hand (grapple and crush), Interposing Hand (half cover). Using a Higher-Level Spell Slot. The damage of the Clenched Fist increases by 2d8 and the damage of the Grasping Hand increases by 2d6 for each spell slot level above 5.",
      summary: 'Large magical hand with multiple modes: attack, push, grapple, or cover. Damage scales with slot.',
    },
  },
{
    id: 'awaken',
    name: 'Awaken',
    school: 'transmutation',
    level: 5,
    classes: ['bard', 'druid'],
    castingTime: { normal: { value: 8, unit: 'hour' } },
    range: { kind: 'touch' },
    duration: { kind: 'instantaneous' },
    components: { verbal: true, somatic: true, material: { description: 'an agate worth 1,000+ GP', cost: { value: 1000, unit: 'gp', atLeast: true }, consumed: true } },
    resolution: {
      caveats: [
        'Awakened stats and 30-day Charmed service are not enforced in encounter.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Beast or Plant with Int 3 or less (or natural plant): gains Int 10 and a language you know; Charmed 30 days or until you/allies damage. Awakened plant stats per GM.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "You spend the casting time tracing magical pathways within a precious gemstone, and then touch the target. The target must be either a Beast or Plant creature with an Intelligence of 3 or less or a natural plant that isn't a creature. The target gains language you know. If the target is a natural plant, it becomes a Plant creature and gains the ability to move its limbs, roots, vines, creepers, and so forth, and it gains senses similar to a human’s. The GM chooses statistics appropriate for the awakened Plant, such as the statistics for the Awakened Shrub or Awakened Tree in 'Monsters.' The awakened target has the Charmed condition for 30 days or until you or your allies deal damage to it. When that condition ends, the awakened creature chooses its attitude toward you.",
      summary: 'Beast or Plant gains Intelligence 10, speech, and is Charmed by you for 30 days.',
    },
  },
{
    id: 'cloudkill',
    name: 'Cloudkill',
    school: 'conjuration',
    level: 5,
    classes: ['sorcerer', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 120, unit: 'ft' } },
    duration: { kind: 'timed', value: 10, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true },
    resolution: {
      caveats: [
        'Fog movement, enter/end-turn saves, and wind dispersal are not fully automated.',
      ],
    },
    effects: [
      { kind: 'targeting', target: 'creatures-in-area', targetType: 'creature', area: { kind: 'sphere', size: 20 } },
      {
        kind: 'save',
        save: { ability: 'con' },
        onFail: [{ kind: 'damage', damage: '5d8', damageType: 'poison' }],
        onSuccess: [{ kind: 'damage', damage: '2d8', damageType: 'poison' }],
      },
      { kind: 'state', stateId: 'heavily-obscured', notes: 'Area is Heavily Obscured.' },
      { kind: 'note', text: 'Sphere moves 10ft away from caster at start of each turn. Dispersed by strong wind.', category: 'under-modeled' as const },
    ],
    scaling: [{ category: 'extra-damage', description: '+1d8 poison per slot level above 5', mode: 'per-slot-level', startsAtSlotLevel: 6, amount: '1d8' }],
    description: {
      full: "You create a 20-foot-radius Sphere of yellow-green fog centered on a point within range. The fog lasts for the duration or until strong wind disperses it. Its area is Heavily Obscured. Each creature in the Sphere makes a Constitution saving throw, taking 5d8 Poison damage on a failed save or half as much on a successful one. A creature must also make this save when the Sphere moves into its space and when it enters or ends its turn there. The Sphere moves 10 feet away from you at the start of each of your turns. Using a Higher-Level Spell Slot. The damage increases by 1d8 for each spell slot level above 5.",
      summary: '20ft poison fog. Con save or 5d8. Moves 10ft/turn. Damage scales with slot.',
    },
  },
{
    id: 'commune',
    name: 'Commune',
    school: 'divination',
    level: 5,
    classes: ['cleric'],
    castingTime: { normal: { value: 1, unit: 'minute' }, alternate: [{ value: 1, unit: 'minute', ritual: true }] },
    range: { kind: 'self' },
    duration: { kind: 'timed', value: 1, unit: 'minute' },
    components: { verbal: true, somatic: true, material: { description: 'incense' } },
    resolution: {
      caveats: [
        'Answers and repeat-cast failure chance are not simulated.',
      ],
    },
    effects: [
      { kind: 'note', text: 'Contact a deity or divine proxy. Ask up to 3 yes/no questions. Receive correct answers. 25% cumulative no-answer chance per repeat cast before Long Rest.', category: 'flavor' as const },
    ],
    description: {
      full: "You contact a deity or a divine proxy and ask up to three questions that can be answered with yes or no. You must ask your questions before the spell ends. You receive a correct answer for each question. Divine beings aren't necessarily omniscient, so you might receive \"unclear\" as an answer. If you cast the spell more than once before finishing a Long Rest, there is a cumulative 25 percent chance for each casting after the first that you get no answer.",
      summary: 'Ask deity up to 3 yes/no questions. Cumulative 25% no-answer on repeat casts.',
    },
  },
{
    id: 'commune-with-nature',
    name: 'Commune with Nature',
    school: 'divination',
    level: 5,
    classes: ['druid', 'ranger'],
    castingTime: { normal: { value: 1, unit: 'minute' }, alternate: [{ value: 1, unit: 'minute', ritual: true }] },
    range: { kind: 'self' },
    duration: { kind: 'instantaneous' },
    components: { verbal: true, somatic: true },
    resolution: {
      caveats: [
        'Lore facts and underground radius are informational only.',
      ],
    },
    effects: [
      { kind: 'note', text: 'Learn 3 facts about surroundings: 3 miles outdoors, 300ft underground. Choose from settlements, portals, CR 10+ creatures, prevalent flora/fauna, water bodies.', category: 'flavor' as const },
    ],
    description: {
      full: "You commune with nature spirits and gain knowledge of the surrounding area. In the outdoors, the spell gives you knowledge of the area within 3 miles of you. In caves and other natural underground settings, the radius is limited to 300 feet. The spell doesn't function where nature has been replaced by construction. Choose three of the following facts: locations of settlements, portals to other planes, location of one CR 10+ Celestial/Elemental/Fey/Fiend/Undead, most prevalent plant/mineral/Beast, locations of bodies of water.",
      summary: 'Learn 3 facts about area (3 miles outdoors, 300ft underground).',
    },
  },
{
    id: 'cone-of-cold',
    name: 'Cone of Cold',
    school: 'evocation',
    level: 5,
    classes: ['druid', 'sorcerer', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'self' },
    duration: { kind: 'instantaneous' },
    components: { verbal: true, somatic: true, material: { description: 'a small crystal or glass cone' } },
    resolution: {
      caveats: [
        'Frozen statue rider on kill is not applied automatically.',
      ],
    },
    effects: [
      { kind: 'targeting', target: 'creatures-in-area', targetType: 'creature', area: { kind: 'cone', size: 60 } },
      {
        kind: 'save',
        save: { ability: 'con' },
        onFail: [{ kind: 'damage', damage: '8d8', damageType: 'cold' }],
        onSuccess: [{ kind: 'damage', damage: '4d8', damageType: 'cold' }],
      },
      { kind: 'note', text: 'A creature killed by this spell becomes a frozen statue until it thaws.', category: 'flavor' as const },
    ],
    scaling: [{ category: 'extra-damage', description: '+1d8 cold per slot level above 5', mode: 'per-slot-level', startsAtSlotLevel: 6, amount: '1d8' }],
    description: {
      full: "You unleash a blast of cold air. Each creature in a 60-foot Cone originating from you makes a Constitution saving throw, taking 8d8 Cold damage on a failed save or half as much on a successful one. A creature killed by this spell becomes a frozen statue until it thaws. Using a Higher-Level Spell Slot. The damage increases by 1d8 for each spell slot level above 5.",
      summary: '60-foot cone: Con save or 8d8 cold. Killed become frozen. Damage scales with slot.',
    },
  },
{
    id: 'conjure-elemental',
    name: 'Conjure Elemental',
    school: 'conjuration',
    level: 5,
    classes: ['druid', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
    duration: { kind: 'timed', value: 10, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true },
    resolution: {
      caveats: [
        'Spirit position, element damage type, and repeat saves are not fully automated.',
      ],
    },
    effects: [
      {
        kind: 'save',
        save: { ability: 'dex' },
        onFail: [
          { kind: 'damage', damage: '8d8', damageType: 'fire' },
          { kind: 'condition', conditionId: 'restrained', repeatSave: { ability: 'dex', timing: 'turn-start' } },
        ],
      },
      {
        kind: 'note',
        text: 'Large elemental spirit: choose air (Lightning), earth (Thunder), fire (Fire), or water (Cold)—replace structured damage type in play to match. Save when a creature enters the spirit’s space or starts its turn within 5 feet.',
        category: 'under-modeled' as const,
      },
    ],
    scaling: [{ category: 'extra-damage', description: '+1d8 per spell slot level above 5', mode: 'per-slot-level', startsAtSlotLevel: 6, amount: '1d8' }],
    description: {
      full: "You conjure a Large, intangible spirit from the Elemental Planes. Choose the spirit's element: air (Lightning), earth (Thunder), fire (Fire), or water (Cold). Whenever a creature enters the spirit's space or starts its turn within 5 feet of the spirit, you can force a Dexterity saving throw. On failed save, the target takes 8d8 damage of the spirit's type and has the Restrained condition until the spell ends. At the start of each of its turns, the Restrained target repeats the save. Using a Higher-Level Spell Slot. The damage increases by 1d8 for each spell slot level above 5.",
      summary: 'Elemental spirit: Dex save or 8d8 and Restrained. Damage scales with slot.',
    },
  },
{
    id: 'contact-other-plane',
    name: 'Contact Other Plane',
    school: 'divination',
    level: 5,
    classes: ['warlock', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'minute' }, alternate: [{ value: 1, unit: 'minute', ritual: true }] },
    range: { kind: 'self' },
    duration: { kind: 'timed', value: 1, unit: 'minute' },
    components: { verbal: true },
    resolution: {
      caveats: [
        'Self-targeted Int save and GM answers are not fully modeled.',
      ],
    },
    effects: [
      { kind: 'save', save: { ability: 'int', dc: 15 }, onFail: [{ kind: 'damage', damage: '6d6', damageType: 'psychic' }, { kind: 'condition', conditionId: 'incapacitated' }], onSuccess: [{ kind: 'state', stateId: 'contact-other-plane', notes: 'Ask up to 5 questions. GM answers each with one word.' }] },
      { kind: 'note', text: 'Incapacitated condition lasts until Long Rest. Greater Restoration ends it. This is a self-targeted save.', category: 'flavor' as const },
    ],
    description: {
      full: "You mentally contact a demigod, the spirit of a long-dead sage, or some other knowledgeable entity from another plane. When you cast this spell, make a DC 15 Intelligence saving throw. On a successful save, you can ask the entity up to five questions. You must ask your questions before the spell ends. The GM answers each question with one word. On a failed save, you take 6d6 Psychic damage and have the Incapacitated condition until you finish a Long Rest. A Greater Restoration spell cast on you ends this effect.",
      summary: 'Contact entity. Int save: 5 questions or 6d6 psychic and Incapacitated.',
    },
  },
{
    id: 'contagion',
    name: 'Contagion',
    school: 'necromancy',
    level: 5,
    classes: ['cleric', 'druid'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'touch' },
    duration: { kind: 'timed', value: 7, unit: 'day' },
    components: { verbal: true, somatic: true },
    resolution: {
      caveats: [
        'Three-strike save track and healing Con save to end Poisoned are not automated.',
      ],
    },
    effects: [
      { kind: 'targeting', target: 'one-creature', targetType: 'creature' },
      {
        kind: 'save',
        save: { ability: 'con' },
        onFail: [
          { kind: 'damage', damage: '11d8', damageType: 'necrotic' },
          { kind: 'condition', conditionId: 'poisoned' },
        ],
      },
      { kind: 'note', text: 'Choose one ability: target has Disadvantage on saves with it while Poisoned. Track 3 successes/failures to end or lock in 7-day duration. Healing effects require Con save to end Poisoned.', category: 'under-modeled' as const },
    ],
    description: {
      full: "Your touch inflicts a magical contagion. The target must succeed on a Constitution saving throw or take 11d8 Necrotic damage and have the Poisoned condition. Also, choose one ability when you cast the spell. While Poisoned, the target has Disadvantage on saving throws made with the chosen ability. The target must repeat the saving throw at the end of each of its turns until it gets three successes or failures. Three successes: spell ends. Three failures: spell lasts 7 days. Whenever the Poisoned target receives an effect that would end the Poisoned condition, the target must succeed on a Constitution saving throw, or the Poisoned condition doesn't end.",
      summary: 'Touch: Con save or 11d8 necrotic and Poisoned. Best of 3 saves/fails.',
    },
  },
{
    id: 'creation',
    name: 'Creation',
    school: 'illusion',
    level: 5,
    classes: ['sorcerer', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'minute' } },
    range: { kind: 'distance', value: { value: 30, unit: 'ft' } },
    duration: { kind: 'special', description: 'Vegetable 24h, stone 12h, precious metal 1h, gems 10min, adamantine/mithral 1min' },
    components: { verbal: true, somatic: true, material: { description: 'a paintbrush' } },
    resolution: {
      caveats: [
        'Created object duration and higher-slot cube size are not enforced in encounter.',
      ],
    },
    effects: [
      { kind: 'note', text: 'Create an object from Shadowfell material (vegetable or mineral, max 5ft cube). Duration varies: vegetable 24h, stone 12h, precious metal 1h, gems 10min, adamantine/mithral 1min. Cannot be used as spell component.', category: 'flavor' as const },
    ],
    scaling: [{ category: 'expanded-area', description: '+5 feet per side of the Cube per spell slot level above 5', mode: 'per-slot-level', startsAtSlotLevel: 6 }],
    description: {
      full: "You pull wisps of shadow material from the Shadowfell to create an object within range. The object must be vegetable matter (soft goods, rope, wood) or mineral matter (stone, crystal, metal), no larger than a 5-foot Cube, and of a form and material you have seen. Duration: Vegetable 24 hours, Stone/crystal 12 hours, Precious metals 1 hour, Gems 10 minutes, Adamantine/mithral 1 minute. Using any created object as a spell's Material component causes that spell to fail. Using a Higher-Level Spell Slot. The Cube increases by 5 feet for each spell slot level above 5.",
      summary: 'Create object from shadow. Duration by material. +5ft per slot.',
    },
  },
{
    id: 'dispel-evil-and-good',
    name: 'Dispel Evil and Good',
    school: 'abjuration',
    level: 5,
    classes: ['cleric', 'paladin'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'self' },
    duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true, material: { description: 'powdered silver and iron' } },
    resolution: {
      caveats: [
        'Break Enchantment and Dismissal actions are not fully simulated.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Celestials, Elementals, Fey, Fiends, Undead have Disadvantage on attack rolls against you. Magic action: Break Enchantment (touch) or Dismissal (Cha save, send home).',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "For the duration, Celestials, Elementals, Fey, Fiends, and Undead have Disadvantage on attack rolls against you. Break Enchantment: Magic action, touch creature possessed or Charmed/Frightened by such creatures; effect ends. Dismissal: Magic action, target within 5 feet; Cha save or sent to home plane (Undead to Shadowfell, Fey to Feywild).",
      summary: 'Disadvantage for extraplanar types. Break Enchantment or Dismissal.',
    },
  },
{
    id: 'dominate-person',
    name: 'Dominate Person',
    school: 'enchantment',
    level: 5,
    classes: ['bard', 'sorcerer', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
    duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true },
    resolution: {
      caveats: [
        'Telepathic commands, repeat saves on damage, and higher-slot duration are not fully enforced.',
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
        text: 'Advantage on the save if you or allies are fighting the target. Telepathic commands (no action). Target repeats the save when it takes damage. Higher slot: longer duration per spell text.',
        category: 'under-modeled' as const,
      },
    ],
    scaling: [{ category: 'longer-duration', description: 'Duration extends at 6th–8th+ slot levels per spell text', mode: 'per-slot-level', startsAtSlotLevel: 6 }],
    description: {
      full: "One Humanoid you can see within range must succeed on a Wisdom saving throw or have the Charmed condition. Advantage if you or allies are fighting it. Whenever the target takes damage, it repeats the save. You have a telepathic link; issue commands (no action). Using a Higher-Level Spell Slot. Duration: 6 (10 min), 7 (1 hour), 8+ (8 hours).",
      summary: 'Humanoid Wis save or Charmed. Telepathic commands. Repeat save when damaged.',
    },
  },
{
    id: 'dream',
    name: 'Dream',
    school: 'illusion',
    level: 5,
    classes: ['bard', 'warlock', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'minute' } },
    range: { kind: 'special', description: 'creature known on same plane' },
    duration: { kind: 'timed', value: 8, unit: 'hour' },
    components: { verbal: true, somatic: true, material: { description: 'a handful of sand' } },
    resolution: {
      caveats: [
        'Dream messenger, sleep state, and terrifying option are not simulated in encounter.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'You or a willing creature you touch enters a trance as dream messenger. If target asleep: converse in dreams. Terrifying: up to 10 words, Wis save or no rest benefit + 3d6 Psychic when waking.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "You target a creature you know on the same plane of existence. You or a willing creature you touch enters a trance state to act as a dream messenger (Incapacitated, Speed 0). If the target is asleep, the messenger appears in its dreams and can converse for the duration. The messenger can shape the dream's environment. If the target is awake, the messenger knows it and can wait for the target to sleep. You can make the messenger terrifying: deliver up to 10 words, then target makes Wis save or gains no benefit from rest and takes 3d6 Psychic damage when it wakes.",
      summary: 'Enter target dreams as messenger. Option: terrifying message, Wis save or no rest + 3d6 psychic.',
    },
  },
{
    id: 'flame-strike',
    name: 'Flame Strike',
    school: 'evocation',
    level: 5,
    classes: ['cleric'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
    duration: { kind: 'instantaneous' },
    components: { verbal: true, somatic: true, material: { description: 'a pinch of sulfur' } },
    resolution: {
      caveats: [
        '40-foot height cylinder and half damage on success are represented in dice only.',
      ],
    },
    effects: [
      { kind: 'targeting', target: 'creatures-in-area', targetType: 'creature', area: { kind: 'cylinder', size: 10 } },
      {
        kind: 'save',
        save: { ability: 'dex' },
        onFail: [
          { kind: 'damage', damage: '5d6', damageType: 'fire' },
          { kind: 'damage', damage: '5d6', damageType: 'radiant' },
        ],
        onSuccess: [
          { kind: 'damage', damage: '2d6', damageType: 'fire' },
          { kind: 'damage', damage: '2d6', damageType: 'radiant' },
        ],
      },
    ],
    scaling: [{ category: 'extra-damage', description: '+1d6 fire and +1d6 radiant per slot level above 5', mode: 'per-slot-level', startsAtSlotLevel: 6, amount: '1d6' }],
    description: {
      full: "A vertical column of brilliant fire roars down from above. Each creature in a 10-foot-radius, 40-foot-high Cylinder centered on a point within range makes a Dexterity saving throw, taking 5d6 Fire damage and 5d6 Radiant damage on a failed save or half as much damage on a successful one. Using a Higher-Level Spell Slot. The Fire damage and the Radiant damage increase by 1d6 for each spell slot level above 5.",
      summary: '10ft radius cylinder: Dex save or 5d6 fire + 5d6 radiant. Both scale with slot.',
    },
  },
{
    id: 'geas',
    name: 'Geas',
    school: 'enchantment',
    level: 5,
    classes: ['bard', 'cleric', 'druid', 'paladin', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'minute' } },
    range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
    duration: { kind: 'timed', value: 30, unit: 'day' },
    components: { verbal: true },
    resolution: {
      caveats: [
        'Command obedience and 5d10 disobedience damage (max once per day) are not enforced automatically.',
      ],
    },
    effects: [
      { kind: 'targeting', target: 'one-creature', targetType: 'creature', requiresSight: true },
      { kind: 'save', save: { ability: 'wis' }, onFail: [{ kind: 'condition', conditionId: 'charmed' }] },
      {
        kind: 'note',
        text: 'While Charmed, the creature takes 5d10 Psychic damage if it acts directly counter to your command (no more than once per day). Remove Curse, Greater Restoration, or Wish ends the spell.',
        category: 'under-modeled' as const,
      },
    ],
    scaling: [
      { category: 'longer-duration', description: '7th–8th slot: 365 days; 9th slot: until ended by Remove Curse, Greater Restoration, or Wish', mode: 'threshold' },
    ],
    description: {
      full: "You give a verbal command to a creature that you can see within range, ordering it to carry out some service or refrain from an action or a course of activity as you decide. The target must succeed on a Wisdom saving throw or have the Charmed condition for the duration. The target automatically succeeds if it can't understand your command. While Charmed, the creature takes 5d10 Psychic damage if it acts in a manner directly counter to your command. It takes this damage no more than once each day. You can issue any command you choose, short of an activity that would result in certain death. Should you issue a suicidal command, the spell ends. A Remove Curse, Greater Restoration, or Wish spell ends this spell. Using a Higher-Level Spell Slot. If you use a level 7 or 8 spell slot, the duration is 365 days. If you use a level 9 spell slot, the spell lasts until it is ended by one of the spells mentioned above.",
      summary: 'Command creature. Wis save or Charmed. 5d10 psychic if disobeys. Duration scales with slot.',
    },
  },
{
    id: 'greater-restoration',
    name: 'Greater Restoration',
    school: 'abjuration',
    level: 5,
    classes: ['bard', 'cleric', 'druid', 'paladin', 'ranger'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'touch' },
    duration: { kind: 'instantaneous' },
    components: { verbal: true, somatic: true, material: { description: 'diamond dust worth 100+ GP', cost: { value: 100, unit: 'gp', atLeast: true }, consumed: true } },
    resolution: {
      caveats: [
        'Which single effect is removed is not validated automatically.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Touch: remove 1 Exhaustion, Charmed, Petrified, curse, ability score reduction, or HP max reduction.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "You touch a creature and magically remove one of the following effects from it: 1 Exhaustion level; The Charmed or Petrified condition; A curse, including the target's Attunement to a cursed magic item; Any reduction to one of the target's ability scores; Any reduction to the target's Hit Point maximum.",
      summary: 'Remove exhaustion, Charmed, Petrified, curse, ability/HP reduction.',
    },
  },
{
    id: 'hallow',
    name: 'Hallow',
    school: 'abjuration',
    level: 5,
    classes: ['cleric'],
    castingTime: { normal: { value: 24, unit: 'hour' } },
    range: { kind: 'touch' },
    duration: { kind: 'until-dispelled' },
    components: { verbal: true, somatic: true, material: { description: 'incense worth 1,000+ GP', cost: { value: 1000, unit: 'gp', atLeast: true }, consumed: true } },
    resolution: {
      caveats: [
        '24-hour cast, ward types, and bound extra effects are not enforced in encounter.',
      ],
    },
    effects: [
      { kind: 'state', stateId: 'hallowed', notes: 'Area wards chosen creature types. Bound extra effects.' },
      { kind: 'note', text: 'Up to 60ft radius. Ward: chosen creature types cannot willingly enter. Extra effects: Courage, Darkness, Daylight, Peaceful Rest, Extradimensional Interference, Fear, Resistance, Silence, Tongues, Vulnerability.', category: 'flavor' as const },
    ],
    description: {
      full: "You touch a point and infuse an area around it with holy or unholy power. The area can have a radius up to 60 feet, and the spell fails if the radius includes an area already under the effect of Hallow. The affected area has the following effects. Hallowed Ward. Choose any of these creature types: Aberration, Celestial, Elemental, Fey, Fiend, or Undead. Creatures of the chosen types can't willingly enter the area, and any creature that is possessed by or that has the Charmed or Frightened condition from such creatures isn't possessed, Charmed, or Frightened by them while in the area. Extra Effect. You bind an extra effect to the area from the list: Courage, Darkness, Daylight, Peaceful Rest, Extradimensional Interference, Fear, Resistance, Silence, Tongues, Vulnerability.",
      summary: 'Consecrate area. Ward creature types. Bind extra effects.',
    },
  },
];
