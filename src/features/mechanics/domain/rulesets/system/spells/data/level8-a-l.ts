import type { SpellEntry } from '../types';

/**
 * Level 8 spells (ids **a–l**) — authoring status:
 * - **Attack/save/AoE modeled:** Befuddlement (Int save + damage).
 * - **Utility / terrain / weather:** Control Weather, Demiplane, Glibness.
 * - **Note-first / heavy caveats:** Animal Shapes, Antimagic Field, Antipathy/Sympathy, Clone, Dominate Monster, Earthquake, Holy Aura, Incendiary Cloud, etc.
 */
export const SPELLS_LEVEL_8_A_L: readonly SpellEntry[] = [
  {
    id: 'animal-shapes',
    name: 'Animal Shapes',
    school: 'transmutation',
    level: 8,
    classes: ['druid'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 30, unit: 'ft' } },
    duration: { kind: 'timed', value: 24, unit: 'hour' },
    components: { verbal: true, somatic: true },
    resolution: {
      caveats: [
        'Beast stat replacement, temporary HP, and Magic action re-shaping are not a full polymorph sheet.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Willing creatures become Large or smaller Beast CR 4 or lower. Magic action to retransform.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "Choose any number of willing creatures that you can see within range. Each target shape-shifts into a Large or smaller Beast of your choice that has a Challenge Rating of 4 or lower. You can choose a different form for each target. On later turns, you can take a Magic action to transform the targets again. A target's game statistics are replaced by the chosen Beast's statistics, but the target retains its creature type; Hit Points; Hit Point Dice; alignment; ability to communicate; and Intelligence, Wisdom, and Charisma scores. The target gains Temporary Hit Points equal to the first form's HP.",
      summary: 'Transform willing creatures into Beasts (CR 4 or lower). Magic action to change forms.',
    },
  },
  {
    id: 'antimagic-field',
    name: 'Antimagic Field',
    school: 'abjuration',
    level: 8,
    classes: ['cleric', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'self' },
    duration: { kind: 'timed', value: 1, unit: 'hour', concentration: true, upTo: true },
    components: { verbal: true, somatic: true, material: { description: 'iron filings' } },
    resolution: {
      caveats: [
        'Spell suppression, magic-item shutdown, teleport/planar blocks, and artifact/deity exceptions at the aura boundary are not fully automated.',
      ],
    },
    effects: [
      {
        kind: 'emanation',
        attachedTo: 'self',
        area: { kind: 'sphere', size: 10 },
      },
      {
        kind: 'targeting',
        target: 'creatures-in-area',
        targetType: 'creature',
        area: { kind: 'sphere', size: 10 },
      },
      {
        kind: 'note',
        text: '10ft aura: no spells, magic actions, or magic item properties. Suppresses ongoing spells.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "An aura of antimagic surrounds you in 10-foot Emanation. No one can cast spells, take Magic actions, or create other magical effects inside the aura, and those things can't target or otherwise affect anything inside it. Magical properties of magic items don't work inside the aura or on anything inside it. Areas of effect created by spells or other magic can't extend into the aura, and no one can teleport into or out of it or use planar travel there. Ongoing spells, except those cast by an Artifact or a deity, are suppressed in the area.",
      summary: '10ft aura suppresses all magic. Spells and magic items do not function inside.',
    },
  },
  {
    id: 'antipathy-sympathy',
    name: 'Antipathy/Sympathy',
    school: 'enchantment',
    level: 8,
    classes: ['bard', 'druid', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'hour' } },
    range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
    duration: { kind: 'timed', value: 10, unit: 'day' },
    components: { verbal: true, somatic: true, material: { description: 'a mix of vinegar and honey' } },
    resolution: {
      caveats: [
        '120ft proximity, flee/approach behavior, and repeat saves are not fully automated.',
      ],
      casterOptions: [
        {
          kind: 'enum',
          id: 'antipathy-sympathy-mode',
          label: 'Aura',
          options: [
            { value: 'antipathy', label: 'Antipathy (Frightened, must flee)' },
            { value: 'sympathy', label: 'Sympathy (Charmed, must approach)' },
          ],
        },
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Target creature/object: chosen creature kind makes Wis save within 120ft. Antipathy=Frightened, Sympathy=Charmed.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "As you cast the spell, choose whether it creates antipathy or sympathy, and target one creature or object that is Huge or smaller. Then specify a kind of creature, such as red dragons, goblins, or vampires. A creature of the chosen kind makes a Wisdom saving throw when it comes within 120 feet of the target. Antipathy: The creature has the Frightened condition and must flee. Sympathy: The creature has the Charmed condition and must approach. If the Frightened or Charmed creature ends its turn more than 120 feet away, it can make a Wis save to end the effect.",
      summary: 'Target emanates antipathy (Frightened) or sympathy (Charmed) to chosen creature kind within 120ft.',
    },
  },
  {
    id: 'befuddlement',
    name: 'Befuddlement',
    school: 'enchantment',
    level: 8,
    classes: ['bard', 'druid', 'warlock', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 150, unit: 'ft' } },
    duration: { kind: 'instantaneous' },
    components: { verbal: true, somatic: true, material: { description: 'a key ring with no keys' } },
    resolution: {
      caveats: [
        'Long-term “no spells/Magic action” rider applies only on a failed save; 30-day repeat save is not automated.',
      ],
    },
    effects: [
      { kind: 'targeting', target: 'one-creature', targetType: 'creature', requiresSight: true },
      {
        kind: 'save',
        save: { ability: 'int' },
        onFail: [
          { kind: 'damage', damage: '10d12', damageType: 'psychic' },
          {
            kind: 'note',
            text: 'Cannot cast spells or take the Magic action until the effect ends (repeat Int save every 30 days; Greater Restoration, Heal, or Wish ends).',
            category: 'under-modeled' as const,
          },
        ],
        onSuccess: [{ kind: 'damage', damage: '5d12', damageType: 'psychic' }],
      },
    ],
    description: {
      full: "You blast the mind of a creature that you can see within range. The target makes an Intelligence saving throw. On a failed save, the target takes 10d12 Psychic damage and can't cast spells or take the Magic action. At the end of every 30 days, the target repeats the save, ending the effect on a success. The effect can also be ended by the Greater Restoration, Heal, or Wish spell. On a successful save, the target takes half as much damage only.",
      summary: 'Int save: 10d12 psychic, no spells/Magic action. Repeat save every 30 days.',
    },
  },
  {
    id: 'clone',
    name: 'Clone',
    school: 'necromancy',
    level: 8,
    classes: ['wizard'],
    castingTime: { normal: { value: 1, unit: 'hour' } },
    range: { kind: 'touch' },
    duration: { kind: 'instantaneous' },
    components: { verbal: true, somatic: true, material: { description: 'a diamond worth 1,000+ GP (consumed) and a sealable vessel worth 2,000+ GP', cost: { value: 1000, unit: 'gp', atLeast: true }, consumed: true } },
    resolution: {
      caveats: [
        '120-day growth, soul transfer, and vessel rules are narrative/inventory scope.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Touch creature or 1 cubic inch flesh. Inert duplicate grows in vessel over 120 days. Soul transfers to clone on death if free and willing.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "You touch a creature or at least 1 cubic inch of its flesh. An inert duplicate of that creature forms inside the vessel used in the spell's casting and finishes growing after 120 days. The clone remains inert and endures indefinitely while its vessel remains undisturbed. If the original creature dies after the clone finishes forming, the creature's soul transfers to the clone if the soul is free and willing to return. The clone is physically identical to the original and has the same personality, memories, and abilities, but none of the original's equipment.",
      summary: 'Create inert duplicate; soul transfers on death if willing. Grows over 120 days.',
    },
  },
  {
    id: 'control-weather',
    name: 'Control Weather',
    school: 'transmutation',
    level: 8,
    classes: ['cleric', 'druid', 'wizard'],
    castingTime: { normal: { value: 10, unit: 'minute' } },
    range: { kind: 'self' },
    duration: { kind: 'timed', value: 8, unit: 'hour', concentration: true, upTo: true },
    components: { verbal: true, somatic: true, material: { description: 'burning incense' } },
    resolution: {
      caveats: [
        '5-mile radius, outdoor requirement, and staged weather tables are GM scope.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Control weather within 5 miles. Must be outdoors. Change precipitation, temperature, wind by one stage. 1d4×10 min for new conditions.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "You take control of the weather within 5 miles of you for the duration. You must be outdoors to cast this spell, and it ends early if you go indoors. When you cast the spell, you change the current weather conditions. You can change precipitation, temperature, and wind. It takes 1d4 × 10 minutes for the new conditions to take effect. When you change the weather, find a current condition on the tables and change its stage by one, up or down.",
      summary: 'Control weather within 5 miles. Change by one stage. 1d4×10 min to take effect.',
    },
  },
  {
    id: 'demiplane',
    name: 'Demiplane',
    school: 'conjuration',
    level: 8,
    classes: ['sorcerer', 'warlock', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
    duration: { kind: 'timed', value: 1, unit: 'hour' },
    components: { somatic: true },
    resolution: {
      caveats: [
        'Connecting to prior demiplanes and creature shunt choices when the door ends are table-adjudicated.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Create shadowy door to 30ft cube demiplane (wood or stone). Can connect to previous castings. Creatures can opt to be shunted when door vanishes.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "You create a shadowy Medium door on a flat solid surface that you can see within range. This door leads to a demiplane that is an empty room 30 feet in each dimension, made of wood or stone (your choice). When the spell ends, the door vanishes. Objects inside remain. Creatures inside remain unless they opt to be shunted through the door as it vanishes (land Prone in nearest unoccupied space). Each casting can create a new demiplane or connect to one you or another created with this spell.",
      summary: 'Create door to 30ft cube demiplane. Connect to previous castings.',
    },
  },
  {
    id: 'dominate-monster',
    name: 'Dominate Monster',
    school: 'enchantment',
    level: 8,
    classes: ['bard', 'sorcerer', 'warlock', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
    duration: { kind: 'timed', value: 1, unit: 'hour', concentration: true, upTo: true },
    components: { verbal: true, somatic: true },
    resolution: {
      caveats: [
        'Telepathic commands, Advantage when fighting, and repeat saves on damage are summarized in notes.',
      ],
    },
    scaling: [
      {
        category: 'longer-duration',
        description: '9th-level slot: duration can last up to 8 hours',
        mode: 'threshold',
      },
    ],
    effects: [
      {
        kind: 'note',
        text: 'Creature Wis save (Advantage if fighting). Charmed, telepathic commands. Repeat save when damaged. Slot 9: up to 8 hours.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "One creature you can see within range must succeed on a Wisdom saving throw or have the Charmed condition. Advantage if you or allies are fighting it. Whenever the target takes damage, it repeats the save. You have a telepathic link; issue commands (no action). Using a Higher-Level Spell Slot. With a level 9 spell slot, the duration can last up to 8 hours.",
      summary: 'Creature Wis save or Charmed. Telepathic commands. Repeat save when damaged.',
    },
  },
  {
    id: 'earthquake',
    name: 'Earthquake',
    school: 'transmutation',
    level: 8,
    classes: ['cleric', 'druid', 'sorcerer'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 500, unit: 'ft' } },
    duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true, material: { description: 'a fractured rock' } },
    resolution: {
      caveats: [
        'Structures, fissures, and buried escape DCs need manual tracking each turn.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: '100ft radius: Difficult Terrain. Dex save or Prone, Concentration broken. Fissures (1d6), Structures (50 bludgeoning, collapse). Collapse: Dex save or 12d6, Prone, buried.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "Choose a point on the ground within range. For the duration, an intense tremor rips through the ground in a 100-foot-radius circle. The ground is Difficult Terrain. When you cast and at the end of each of your turns, each creature on the ground in the area makes a Dexterity saving throw. On a failed save, a creature has the Prone condition and its Concentration is broken. Fissures: 1d6 fissures open (1d10×10 ft deep, 10 ft wide). Structures: 50 Bludgeoning damage each turn; at 0 HP, collapses. Creature within half structure height: Dex save or 12d6 Bludgeoning, Prone, buried (DC 20 Str to escape).",
      summary: '100ft radius earthquake. Prone, fissures, structure damage and collapse.',
    },
  },
  {
    id: 'glibness',
    name: 'Glibness',
    school: 'enchantment',
    level: 8,
    classes: ['bard', 'warlock'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'self' },
    duration: { kind: 'timed', value: 1, unit: 'hour' },
    components: { verbal: true },
    resolution: {
      caveats: [
        '“Replace roll with 15” applies to Charisma checks you choose at resolution time.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Replace Charisma check roll with 15. Truth-detection magic indicates you are truthful.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "Until the spell ends, when you make a Charisma check, you can replace the number you roll with a 15. Additionally, no matter what you say, magic that would determine if you are telling the truth indicates that you are being truthful.",
      summary: 'Charisma checks become 15. Truth magic says you are truthful.',
    },
  },
  {
    id: 'holy-aura',
    name: 'Holy Aura',
    school: 'abjuration',
    level: 8,
    classes: ['cleric'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'self' },
    duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true, material: { description: 'a reliquary worth 1,000+ GP', cost: { value: 1000, unit: 'gp', atLeast: true } } },
    resolution: {
      caveats: [
        'Chosen creatures (advantage on saves, disadvantage to be hit), Fiend/Undead melee Blinded rider, and per-attacker tracking are not fully automated.',
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
        text: '30-foot emanation. Chosen creatures: Advantage on saves. Others: Disadvantage to hit them. Fiend/Undead melee hit: Con save or Blinded.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "For the duration, you emit an aura in a 30-foot Emanation. While in the aura, creatures of your choice have Advantage on all saving throws, and other creatures have Disadvantage on attack rolls against them. In addition, when a Fiend or an Undead hits an affected creature with a melee attack roll, the attacker must succeed on a Constitution saving throw or have the Blinded condition until the end of its next turn.",
      summary: '30ft aura: Advantage saves, Disadvantage to hit. Fiend/Undead: Con save or Blinded on hit.',
    },
  },
  {
    id: 'incendiary-cloud',
    name: 'Incendiary Cloud',
    school: 'conjuration',
    level: 8,
    classes: ['druid', 'sorcerer', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 150, unit: 'ft' } },
    duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true },
    resolution: {
      caveats: [
        'Cloud moves 10ft each of your turns; one save per turn per creature for entering/being moved through.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: '20-foot sphere of embers. Heavily Obscured. Dex save or 10d8 fire when appearing, when sphere moves into space, when entering/ending turn. Moves 10ft from you each turn.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "A swirling cloud of embers and smoke fills a 20-foot-radius Sphere centered on a point within range. The cloud's area is Heavily Obscured. It lasts for the duration or until a strong wind (like that created by Gust of Wind) disperses it. When the cloud appears, each creature in it makes a Dexterity saving throw, taking 10d8 Fire damage on a failed save or half as much damage on a successful one. A creature must also make this save when the Sphere moves into its space and when it enters the Sphere or ends its turn there. A creature makes this save only once per turn. The cloud moves 10 feet away from you in a direction you choose at the start of each of your turns.",
      summary: '20ft fire cloud. Dex save 10d8 when appearing, entering, or sphere moves. Moves 10ft/turn.',
    },
  },
];
