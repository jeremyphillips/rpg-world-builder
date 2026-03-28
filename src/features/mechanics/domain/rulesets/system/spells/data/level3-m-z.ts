import type { SpellEntry } from '../types';

/**
 * Level 3 spells M–Z — authoring status:
 * - **Attack/save/AoE modeled:** Mass Healing Word, Protection from Energy, Revivify, Slow, Spirit Guardians, Stinking Cloud.
 * - **Utility / sense / state:** Nondetection, Tongues, Water Breathing, Water Walk.
 * - **Note-first / heavy caveats:** Meld into Stone, Phantom Steed, Plant Growth, Sending, Sleet Storm, Speak with Dead/Plants, Tiny Hut, Wind Wall, etc.
 */
export const SPELLS_LEVEL_3_M_Z: readonly SpellEntry[] = [
{
    id: 'mass-healing-word',
    name: 'Mass Healing Word',
    school: 'abjuration',
    level: 3,
    classes: ['bard', 'cleric'],
    castingTime: { normal: { value: 1, unit: 'bonus-action' } },
    range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
    duration: { kind: 'instantaneous' },
    components: { verbal: true },
    resolution: {
      caveats: [
        'Healing split across multiple targets is not tracked automatically.',
      ],
    },
    effects: [
      { kind: 'targeting', target: 'chosen-creatures', targetType: 'creature', count: 6, requiresSight: true },
      { kind: 'hit-points', mode: 'heal', value: '2d4', abilityModifier: true },
    ],
    scaling: [{ category: 'extra-healing', description: '+1d4 healing per slot level above 3', mode: 'per-slot-level', startsAtSlotLevel: 4, amount: '1d4' }],
    description: {
      full: "Up to six creatures of your choice that you can see within range regain Hit Points equal to 2d4 plus your spellcasting ability modifier. Using a Higher-Level Spell Slot. The healing increases by 1d4 for each spell slot level above 3.",
      summary: 'Up to 6 creatures: 2d4+mod HP. +1d4 per slot.',
    },
  },
{
    id: 'meld-into-stone',
    name: 'Meld into Stone',
    school: 'transmutation',
    level: 3,
    classes: ['cleric', 'druid', 'ranger'],
    castingTime: { normal: { value: 1, unit: 'action' }, alternate: [{ value: 1, unit: 'action', ritual: true }] },
    range: { kind: 'touch' },
    duration: { kind: 'timed', value: 8, unit: 'hour' },
    components: { verbal: true, somatic: true },
    resolution: {
      caveats: [
        'Merged state, destruction expulsion, and damage are not simulated in encounter.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Merge with stone large enough to contain you. Undetectable. Cannot see outside; Disadvantage to hear. 5ft movement to leave. Partial destruction: 6d6 force. Complete destruction: 50 force, Prone.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "You step into a stone object or surface large enough to fully contain your body, merging yourself and your equipment with the stone for the duration. You must touch the stone to do so. Nothing of your presence remains visible or otherwise detectable by nonmagical senses. While merged, you can't see outside; Wisdom (Perception) to hear has Disadvantage. You can use 5 feet of movement to leave the stone where you entered, which ends the spell. Minor damage doesn't harm you. Partial destruction or shape change expels you for 6d6 Force. Complete destruction or transmutation expels you for 50 Force and Prone.",
      summary: 'Merge with stone. Undetectable. 5ft to leave. Destruction expels and damages.',
    },
  },
{
    id: 'nondetection',
    name: 'Nondetection',
    school: 'abjuration',
    level: 3,
    classes: ['bard', 'ranger', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'touch' },
    duration: { kind: 'timed', value: 8, unit: 'hour' },
    components: { verbal: true, somatic: true, material: { description: 'a pinch of diamond dust worth 25+ GP', cost: { value: 25, unit: 'gp', atLeast: true }, consumed: true } },
    resolution: {
      caveats: [
        'Divination blocking is informational only in encounter.',
      ],
    },
    effects: [
      { kind: 'state', stateId: 'nondetection', notes: 'Target hidden from Divination spells and magical scrying sensors.' },
      { kind: 'note', text: 'Target can be a willing creature, or a place or object no larger than 10 feet in any dimension.', category: 'flavor' as const },
    ],
    description: {
      full: "For the duration, you hide a target that you touch from Divination spells. The target can be a willing creature, or it can be a place or an object no larger than 10 feet in any dimension. The target can't be targeted by any Divination spell or perceived through magical scrying sensors.",
      summary: 'Hide from Divination and scrying. 8 hours.',
    },
  },
{
    id: 'phantom-steed',
    name: 'Phantom Steed',
    school: 'illusion',
    level: 3,
    classes: ['wizard'],
    castingTime: { normal: { value: 1, unit: 'minute' }, alternate: [{ value: 1, unit: 'minute', ritual: true }] },
    range: { kind: 'distance', value: { value: 30, unit: 'ft' } },
    duration: { kind: 'timed', value: 1, unit: 'hour' },
    components: { verbal: true, somatic: true },
    resolution: {
      caveats: [
        'Mount stats, travel pace, and damage ending the steed are not modeled as a combatant.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Large quasi-real horse. Riding Horse stat block, Speed 100ft, 13 miles/hour. Fades gradually when spell ends (1 min to dismount). Ends if steed takes damage.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "A Large, quasi-real, horselike creature appears in an unoccupied space within range. You decide its appearance. It is equipped with saddle, bit, and bridle. Equipment vanishes if carried 10+ feet from steed. You or a chosen creature can ride it. The steed uses the Riding Horse stat block except it has Speed 100 feet and can travel 13 miles in an hour. When the spell ends, the steed gradually fades, giving the rider 1 minute to dismount. The spell ends early if the steed takes any damage.",
      summary: 'Quasi-real horse, Speed 100ft. 1 min to dismount when ends. Ends if damaged.',
    },
  },
{
    id: 'plant-growth',
    name: 'Plant Growth',
    school: 'transmutation',
    level: 3,
    classes: ['bard', 'druid', 'ranger'],
    castingTime: { normal: { value: 1, unit: 'action' }, alternate: [{ value: 8, unit: 'hour' }] },
    range: { kind: 'distance', value: { value: 150, unit: 'ft' } },
    duration: { kind: 'instantaneous' },
    components: { verbal: true, somatic: true },
    resolution: {
      caveats: [
        'Overgrowth vs enrichment casting time and yearly enrichment limit are not enforced.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Overgrowth (Action): 100-foot-radius Sphere, 4 ft movement per 1 ft. Enrichment (8 hours): half-mile radius, double food yield for 365 days (one enrichment per year per area).',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "This spell channels vitality into plants. Overgrowth (Action): Choose point. All normal plants in 100-foot-radius Sphere become thick and overgrown. A creature moving through that area must spend 4 feet of movement for every 1 foot it moves. You can exclude areas. Enrichment (8 hours): All plants in a half-mile radius become enriched for 365 days. The plants yield twice the normal amount of food when harvested. They can benefit from only one Plant Growth per year.",
      summary: 'Overgrowth: 100ft radius, 4:1 movement. Enrichment: half-mile, double food for 1 year.',
    },
  },
{
    id: 'protection-from-energy',
    name: 'Protection from Energy',
    school: 'abjuration',
    level: 3,
    classes: ['cleric', 'druid', 'ranger', 'sorcerer', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'touch' },
    duration: { kind: 'timed', value: 1, unit: 'hour', concentration: true, upTo: true },
    components: { verbal: true, somatic: true },
    resolution: {
      caveats: [
        'Only one damage type is modeled; choose the matching resistance in play when not Fire.',
      ],
    },
    effects: [
      { kind: 'targeting', target: 'one-creature', targetType: 'creature', requiresWilling: true },
      { kind: 'modifier', target: 'resistance', mode: 'add', value: 'fire' as const },
      { kind: 'note', text: 'Caster chooses damage type at cast time: Acid, Cold, Fire, Lightning, or Thunder. Modeled as Fire by default.', category: 'flavor' as const },
    ],
    description: {
      full: "For the duration, the willing creature you touch has Resistance to one damage type of your choice: Acid, Cold, Fire, Lightning, or Thunder.",
      summary: 'Touch: Resistance to one damage type.',
    },
  },
  {
    id: 'remove-curse',
    name: 'Remove Curse',
    school: 'abjuration',
    level: 3,
    classes: ['cleric', 'paladin', 'warlock', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'touch' },
    duration: { kind: 'instantaneous' },
    components: { verbal: true, somatic: true },
    resolution: {
      caveats: [
        'Which specific curses end and magic item attunement are not fully automated.',
      ],
    },
    effects: [
      { kind: 'remove-classification', classification: 'curse' },
      {
        kind: 'note',
        text: 'Cursed magic item: curse remains but breaks Attunement so it can be removed.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "At your touch, all curses affecting one creature or object end. If the object is a cursed magic item, its curse remains, but the spell breaks its owner's Attunement to the object so it can be removed or discarded.",
      summary: 'Touch: end all curses. Cursed item: break Attunement.',
    },
  },
{
    id: 'revivify',
    name: 'Revivify',
    school: 'necromancy',
    level: 3,
    classes: ['cleric', 'druid', 'paladin', 'ranger'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'touch' },
    duration: { kind: 'instantaneous' },
    components: { verbal: true, somatic: true, material: { description: 'a diamond worth 300+ GP', cost: { value: 300, unit: 'gp', atLeast: true }, consumed: true } },
    resolution: {},
    effects: [
      { kind: 'targeting', target: 'one-dead-creature', targetType: 'creature' },
      { kind: 'hit-points', mode: 'heal', value: 1 },
      { kind: 'note', text: "Must have died within the last minute. Can't revive creatures that died of old age. Does not restore missing body parts.", category: 'flavor' as const },
    ],
    description: {
      full: "You touch a creature that has died within the last minute. That creature revives with 1 Hit Point. This spell can't revive a creature that has died of old age, nor does it restore any missing body parts.",
      summary: 'Revive creature dead within 1 minute with 1 HP.',
    },
  },
{
    id: 'sending',
    name: 'Sending',
    school: 'divination',
    level: 3,
    classes: ['bard', 'cleric', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'unlimited' },
    duration: { kind: 'instantaneous' },
    components: { verbal: true, somatic: true, material: { description: 'a copper wire' } },
    resolution: {
      caveats: [
        'Cross-plane failure and blocking future Sendings are not simulated.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Send 25-word message to a creature you have met or that has been described to you. Target hears, recognizes sender, and can reply. 5% fail chance if on a different plane. Recipient can block further Sendings for 8 hours.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "You send a short message of 25 words or fewer to a creature you have met or a creature described to you by someone who has met it. The target hears the message in its mind, recognizes you as the sender if it knows you, and can answer in a like manner immediately. You can send the message across any distance and even to other planes of existence, but if the target is on a different plane than you, there is a 5 percent chance that the message doesn't arrive. You know if the delivery fails. Upon receiving your message, a creature can block your ability to reach it again with this spell for 8 hours.",
      summary: 'Send 25-word message to known creature. Can reply. 5% fail cross-plane.',
    },
  },
{
    id: 'sleet-storm',
    name: 'Sleet Storm',
    school: 'conjuration',
    level: 3,
    classes: ['druid', 'sorcerer', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 150, unit: 'ft' } },
    duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true, material: { description: 'a miniature umbrella' } },
    resolution: {
      caveats: [
        'Cylinder overlap, difficult terrain, save timing, and concentration loss are not fully automated.',
      ],
    },
    effects: [
      {
        kind: 'targeting',
        target: 'creatures-in-area',
        targetType: 'creature',
        area: { kind: 'cylinder', size: 20 },
      },
      { kind: 'state', stateId: 'heavily-obscured', notes: '40-foot-tall, 20-foot-radius Cylinder: Heavily Obscured; ground is Difficult Terrain; exposed flames doused.' },
      {
        kind: 'note',
        text: 'When a creature enters the cylinder for the first time on a turn or starts its turn there: Dexterity save or Prone and lose Concentration.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "Until the spell ends, sleet falls in a 40-foot-tall, 20-foot-radius Cylinder centered on a point you choose within range. The area is Heavily Obscured, and exposed flames in the area are doused. Ground in the Cylinder is Difficult Terrain. When a creature enters the Cylinder for the first time on a turn or starts its turn there, it must succeed on a Dexterity saving throw or have the Prone condition and lose Concentration.",
      summary: '40ft cylinder sleet. Heavily Obscured, Difficult Terrain. Dex save or Prone.',
    },
  },
{
    id: 'slow',
    name: 'Slow',
    school: 'transmutation',
    level: 3,
    classes: ['bard', 'sorcerer', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 120, unit: 'ft' } },
    duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true, material: { description: 'a drop of molasses' } },
    effects: [
      { kind: 'targeting', target: 'creatures-in-area', targetType: 'creature', area: { kind: 'cube', size: 40 } },
      {
        kind: 'save',
        save: { ability: 'wis' },
        onFail: [
      { kind: 'state', stateId: 'slowed', notes: 'Speed halved, -2 AC and Dex saves, no Reactions, one attack only, action or bonus action (not both). 25% spell failure if casting requires Somatic.', repeatSave: { ability: 'wis', timing: 'turn-end' } },
    ],
  },
  { kind: 'note', text: 'Up to 6 creatures.', category: 'flavor' as const },
],
    description: {
      full: "You alter time around up to six creatures of your choice in a 40-foot Cube within range. Each target must succeed on a Wisdom saving throw or be affected by this spell for the duration. An affected target's Speed is halved, it takes a −2 penalty to AC and Dexterity saving throws, and it can't take Reactions. On its turns, it can take either an action or a Bonus Action, not both, and it can make only one attack if it takes the Attack action. If it casts a spell with a Somatic component, there is a 25 percent chance the spell fails. An affected target repeats the save at the end of each of its turns, ending the spell on itself on a success.",
      summary: 'Up to 6: Wis save or Speed halved, -2 AC/Dex, no Reactions, action OR bonus. Repeat save.',
    },
  },
{
    id: 'speak-with-dead',
    name: 'Speak with Dead',
    school: 'necromancy',
    level: 3,
    classes: ['bard', 'cleric', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 10, unit: 'ft' } },
    duration: { kind: 'timed', value: 10, unit: 'minute' },
    components: { verbal: true, somatic: true, material: { description: 'burning incense' } },
    resolution: {
      caveats: [
        'Q&A flow and truthfulness are not enforced in encounter.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Corpse answers up to 5 questions. Knows only what it knew in life. Fails if Undead when died or targeted within past 10 days. No compulsion to be truthful.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "You grant the semblance of life to a corpse of your choice within range, allowing it to answer questions you pose. The corpse must have a mouth, and this spell fails if the deceased creature was Undead when it died. The spell also fails if the corpse was the target of this spell within the past 10 days. Until the spell ends, you can ask the corpse up to five questions. The corpse knows only what it knew in life. Answers are usually brief, cryptic, or repetitive, and the corpse is under no compulsion to offer a truthful answer if you are antagonistic toward it or it recognizes you as an enemy. This spell doesn't return the creature's soul to its body, only its animating spirit.",
      summary: 'Corpse answers 5 questions. Knows only life knowledge. No compulsion to be truthful.',
    },
  },
{
    id: 'speak-with-plants',
    name: 'Speak with Plants',
    school: 'transmutation',
    level: 3,
    classes: ['bard', 'druid', 'ranger'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'self' },
    duration: { kind: 'timed', value: 10, unit: 'minute' },
    components: { verbal: true, somatic: true },
    resolution: {
      caveats: [
        'Terrain toggling and plant knowledge are not simulated mechanically.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: '30-foot Emanation: plants gain limited sentience, communicate, follow simple commands. Question about events in the past day. Toggle plant-based Difficult Terrain. Plant creatures: communicate as if shared language.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "You imbue plants in an immobile 30-foot Emanation with limited sentience and animation, giving them the ability to communicate with you and follow your simple commands. You can question plants about events in the spell's area within the past day. You can also turn Difficult Terrain caused by plant growth into ordinary terrain that lasts for the duration. Or you can turn ordinary terrain where plants are present into Difficult Terrain that lasts for the duration. If a Plant creature is in the area, you can communicate with it as if you shared a common language.",
      summary: '30ft emanation: speak with plants, question past day, alter Difficult Terrain.',
    },
  },
  {
    id: 'spirit-guardians',
    name: 'Spirit Guardians',
    school: 'conjuration',
    level: 3,
    classes: ['cleric'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'self' },
    duration: { kind: 'timed', value: 10, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true, material: { description: 'a prayer scroll' } },
    effects: [
      {
        kind: 'emanation',
        attachedTo: 'self',
        area: { kind: 'sphere', size: 15 },
        selectUnaffectedAtCast: true,
      },
      { kind: 'targeting', target: 'creatures-in-area', targetType: 'creature', area: { kind: 'sphere', size: 15 } },
      {
        kind: 'interval',
        stateId: 'spirit-guardians-damage',
        every: { value: 1, unit: 'turn' },
        spatialTriggers: ['enter'],
        effects: [
          {
            kind: 'save',
            save: { ability: 'wis' },
            onFail: [{ kind: 'damage', damage: '3d8', damageType: 'radiant' }],
            onSuccess: [{ kind: 'damage', damage: '1d8', damageType: 'radiant' }],
          },
        ],
      },
      { kind: 'modifier', target: 'speed' as const, mode: 'multiply' as const, value: 0.5 },
      { kind: 'note', text: 'Caster designates creatures unaffected. Damage type is necrotic if caster is evil.', category: 'flavor' as const },
    ],
    scaling: [{ category: 'extra-damage', description: '+1d8 per slot level above 3', mode: 'per-slot-level', startsAtSlotLevel: 4, amount: '1d8' }],
    description: {
      full: "Protective spirits flit around you in a 15-foot Emanation for the duration. If you are good or neutral, their spectral form appears angelic or fey (your choice). If you are evil, they appear fiendish. When you cast this spell, you can designate creatures to be unaffected by it. Any other creature's Speed is halved in the Emanation, and whenever the Emanation enters a creature's space and whenever a creature enters the Emanation or ends its turn there, the creature must make a Wisdom saving throw. On a failed save, the creature takes 3d8 Radiant damage (if you are good or neutral) or 3d8 Necrotic damage (if you are evil). On a successful save, the creature takes half as much damage. Using a Higher-Level Spell Slot. The damage increases by 1d8 for each spell slot level above 3.",
      summary: '15ft emanation: Speed halved, Wis save or 3d8 radiant/necrotic. +1d8 per slot.',
    },
  },
  {
    id: 'stinking-cloud',
    name: 'Stinking Cloud',
    school: 'conjuration',
    level: 3,
    classes: ['bard', 'sorcerer', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 90, unit: 'ft' } },
    duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true, material: { description: 'a rotten egg' } },
    effects: [
      {
        kind: 'emanation',
        attachedTo: 'self',
        area: { kind: 'sphere', size: 20 },
        anchorMode: 'place',
        environmentZoneProfile: 'fog',
      },
      { kind: 'targeting', target: 'creatures-in-area', targetType: 'creature', area: { kind: 'sphere', size: 20 } },
      {
        kind: 'save',
        save: { ability: 'con' },
        onFail: [{ kind: 'condition', conditionId: 'poisoned' }],
      },
      { kind: 'state', stateId: 'heavily-obscured', notes: 'Area is Heavily Obscured.' },
      { kind: 'note', text: 'Poisoned creature wastes its action. Save when starting turn in area. Dispersed by strong wind.', category: 'under-modeled' as const },
    ],
    description: {
      full: "You create a 20-foot-radius Sphere of yellow, nauseating gas centered on a point within range. The cloud is Heavily Obscured. The cloud lingers in the air for the duration or until a strong wind (such as the one created by Gust of Wind) disperses it. Each creature that starts its turn in the Sphere must succeed on a Constitution saving throw or have the Poisoned condition until the end of the current turn. While Poisoned in this way, the creature can't take an action or a Bonus Action.",
      summary: '20ft sphere gas. Heavily Obscured. Con save or Poisoned (no action/bonus).',
    },
  },
  {
    id: 'tiny-hut',
    name: 'Tiny Hut',
    school: 'evocation',
    level: 3,
    classes: ['bard', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'minute' }, alternate: [{ value: 1, unit: 'minute', ritual: true }] },
    range: { kind: 'self' },
    duration: { kind: 'timed', value: 8, unit: 'hour' },
    components: { verbal: true, somatic: true, material: { description: 'a crystal bead' } },
    resolution: {
      caveats: [
        'Interior occupancy, spell blocking, and early end conditions are not fully enforced.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: '10-foot Emanation dome. Creatures inside when cast can pass freely; others barred. Spells of level 3 or lower cannot pass through or extend in. Comfortable atmosphere; Dim Light or Darkness inside. Opaque outside, transparent inside. Ends if you leave or recast.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "A 10-foot Emanation springs into existence around you and remains stationary for the duration. The spell fails when you cast it if the Emanation isn't big enough to fully encapsulate all creatures in its area. Creatures and objects within the Emanation when you cast the spell can move through it freely. All other creatures and objects are barred from passing through it. Spells of level 3 or lower can't be cast through it, and the effects of such spells can't extend into it. The atmosphere inside the Emanation is comfortable and dry, regardless of the weather outside. Until the spell ends, you can command the interior to have Dim Light or Darkness (no action required). The Emanation is opaque from the outside and of any color you choose, but it's transparent from the inside. The spell ends early if you leave the Emanation or if you cast it again.",
      summary: '10ft dome. Creatures inside pass freely; others barred. Blocks 3rd-level or lower spells.',
    },
  },
  {
    id: 'tongues',
    name: 'Tongues',
    school: 'divination',
    level: 3,
    classes: ['bard', 'cleric', 'sorcerer', 'warlock', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'touch' },
    duration: { kind: 'timed', value: 1, unit: 'hour' },
    components: { verbal: true, material: { description: 'a miniature ziggurat' } },
    resolution: {
      caveats: [
        'Language comprehension in dialogue is not enforced mechanically.',
      ],
    },
    effects: [
      { kind: 'targeting', target: 'one-creature', targetType: 'creature' },
      { kind: 'state', stateId: 'tongues', notes: 'Target understands any spoken or signed language. When target speaks/signs, any creature knowing a language understands.' },
    ],
    description: {
      full: "This spell grants the creature you touch the ability to understand any spoken or signed language that it hears or sees. Moreover, when the target communicates by speaking or signing, any creature that knows at least one language can understand it if that creature can hear the speech or see the signing.",
      summary: 'Understand any language. Others understand target when they speak or sign.',
    },
  },
{
    id: 'vampiric-touch',
    name: 'Vampiric Touch',
    school: 'necromancy',
    level: 3,
    classes: ['sorcerer', 'warlock', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'self' },
    duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true },
    deliveryMethod: 'melee-spell-attack',
    resolution: {
      caveats: [
        'Magic-action repeat attacks and healing half of necrotic dealt are not fully automated.',
      ],
    },
    effects: [
      { kind: 'targeting', target: 'one-creature', targetType: 'creature' },
      { kind: 'damage', damage: '3d6', damageType: 'necrotic' },
      {
        kind: 'note',
        text: 'On hit, regains Hit Points equal to half the Necrotic damage dealt. Until the spell ends, repeat as a Magic action each turn (same or new target).',
        category: 'under-modeled' as const,
      },
    ],
    scaling: [{ category: 'extra-damage', description: '+1d6 necrotic per spell slot level above 3', mode: 'per-slot-level', startsAtSlotLevel: 4, amount: '1d6' }],
    description: {
      full: "The touch of your shadow-wreathed hand can siphon life force from others to heal your wounds. Make a melee spell attack against one creature within reach. On a hit, the target takes 3d6 Necrotic damage, and you regain Hit Points equal to half the amount of Necrotic damage dealt. Until the spell ends, you can make the attack again on each of your turns as a Magic action, targeting the same creature or a different one. Using a Higher-Level Spell Slot. The damage increases by 1d6 for each spell slot level above 3.",
      summary: 'Melee spell attack: 3d6 necrotic, regain half as HP. Repeat as Magic action. +1d6 per slot.',
    },
  },
{
    id: 'water-breathing',
    name: 'Water Breathing',
    school: 'transmutation',
    level: 3,
    classes: ['druid', 'ranger', 'sorcerer', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' }, alternate: [{ value: 1, unit: 'action', ritual: true }] },
    range: { kind: 'distance', value: { value: 30, unit: 'ft' } },
    duration: { kind: 'timed', value: 24, unit: 'hour' },
    components: { verbal: true, somatic: true, material: { description: 'a short reed' } },
    resolution: {
      caveats: [
        'Underwater breathing and movement are not applied automatically.',
      ],
    },
    effects: [
      {
        kind: 'targeting',
        target: 'chosen-creatures',
        targetType: 'creature',
        count: 10,
        requiresSight: true,
        requiresWilling: true,
      },
      {
        kind: 'state',
        stateId: 'water-breathing',
        notes: 'Can breathe underwater; retains normal respiration.',
      },
    ],
    description: {
      full: "This spell grants up to ten willing creatures of your choice within range the ability to breathe underwater until the spell ends. Affected creatures also retain their normal mode of respiration.",
      summary: 'Up to 10 creatures breathe underwater for 24 hours.',
    },
  },
{
    id: 'water-walk',
    name: 'Water Walk',
    school: 'transmutation',
    level: 3,
    classes: ['cleric', 'druid', 'ranger', 'sorcerer'],
    castingTime: { normal: { value: 1, unit: 'action' }, alternate: [{ value: 1, unit: 'action', ritual: true }] },
    range: { kind: 'distance', value: { value: 30, unit: 'ft' } },
    duration: { kind: 'timed', value: 1, unit: 'hour' },
    components: { verbal: true, somatic: true, material: { description: 'a piece of cork' } },
    resolution: {
      caveats: [
        'Liquid surfaces, Bonus Action entry, and falling through are not fully modeled.',
      ],
    },
    effects: [
      {
        kind: 'targeting',
        target: 'chosen-creatures',
        targetType: 'creature',
        count: 10,
        requiresSight: true,
        requiresWilling: true,
      },
      {
        kind: 'state',
        stateId: 'water-walk',
        notes: 'Treat liquid surfaces as solid ground; Bonus Action to enter/exit liquid; fall passes through surface.',
      },
    ],
    description: {
      full: "This spell grants the ability to move across any liquid surface—such as water, acid, mud, snow, quicksand, or lava—as if it were harmless solid ground (creatures crossing molten lava can still take damage from the heat). Up to ten willing creatures of your choice within range gain this ability for the duration. An affected target must take a Bonus Action to pass from the liquid's surface into the liquid itself and vice versa, but if the target falls into the liquid, the target passes through the surface into the liquid below.",
      summary: 'Up to 10 creatures walk on liquids. Bonus action to enter/exit liquid.',
    },
  },
{
    id: 'wind-wall',
    name: 'Wind Wall',
    school: 'evocation',
    level: 3,
    classes: ['druid', 'ranger'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 120, unit: 'ft' } },
    duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true, material: { description: 'a fan and a feather' } },
    resolution: {
      caveats: [
        'Wall shape, appearance damage, projectile deflection, and creature gating are not simulated in encounter.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'When the wall appears, each creature in its area: Strength save or 4d8 Bludgeoning (half on success). Up to 50 ft long, 15 ft high, 1 ft thick, one continuous path. Blocks fog/smoke/gases; Small or smaller flying creatures/objects; deflects ordinary projectiles; blocks Gaseous Form.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "A wall of strong wind rises from the ground at a point you choose within range. You can make the wall up to 50 feet long, 15 feet high, and 1 foot thick. You can shape the wall in any way you choose so long as it makes one continuous path along the ground. The wall lasts for the duration. When the wall appears, each creature in its area makes a Strength saving throw, taking 4d8 Bludgeoning damage on a failed save or half as much damage on a successful one. The strong wind keeps fog, smoke, and other gases at bay. Small or smaller flying creatures or objects can't pass through the wall. Loose, lightweight materials brought into the wall fly upward. Arrows, bolts, and other ordinary projectiles launched at targets behind the wall are deflected upward and miss automatically. Boulders hurled by Giants or siege engines, and similar projectiles, are unaffected. Creatures in gaseous form can't pass through it.",
      summary: 'Wind wall: Str save or 4d8 bludgeoning. Blocks fog, small flyers, arrows. Gaseous form cannot pass.',
    },
  },
];
