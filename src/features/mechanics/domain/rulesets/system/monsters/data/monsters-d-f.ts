import type { MonsterCatalogEntry } from '../types';

/** System catalog — ids starting with [d-f] (first character of `id`). */

export const MONSTERS_D_F: readonly MonsterCatalogEntry[] = [
  {
    id: 'earth-elemental',
    name: 'Earth Elemental',
    type: 'elemental',
    sizeCategory: 'large',
    languages: [{ id: 'primordial' }],
    description: {
      short: 'A walking landslide of rock and soil.',
      long: 'Earth elementals batter fortifications and burrow through stone.',
    },
    mechanics: {
      hitPoints: { count: 14, die: 10, modifier: 70 },
      armorClass: { kind: 'natural', offset: 8 },
      movement: { ground: 30, burrow: 30 },
      abilities: { str: 20, dex: 8, con: 20, int: 5, wis: 10, cha: 5 },
      senses: {
        special: [
          { type: 'darkvision', range: 60 },
          { type: 'tremorsense', range: 60 },
        ],
        passivePerception: 10,
      },
      vulnerabilities: ['thunder'],
      immunities: ['poison', 'exhaustion', 'paralyzed', 'petrified', 'poisoned', 'unconscious'],
      proficiencyBonus: 3,
      traits: [
        {
          name: 'Earth Glide',
          description:
            'The elemental can burrow through nonmagical, unworked earth and stone. While doing so, the elemental doesn’t disturb the material it moves through.',
        },
        {
          name: 'Siege Monster',
          description: 'The elemental deals double damage to objects and structures.',
          resolution: { caveats: ['Siege damage multiplier not applied automatically to objects.'] },
        },
      ],
      actions: [
        {
          kind: 'special',
          name: 'Multiattack',
          description:
            'The elemental makes two attacks, using Slam or Rock Launch in any combination.',
          sequence: [{ actionName: 'Slam', count: 2 }],
          notes: 'At table, substitute Rock Launch for any Slam step.',
        },
        {
          kind: 'natural',
          name: 'Slam',
          attackType: 'slam',
          attackBonus: 8,
          reach: 10,
          damage: '2d8',
          damageBonus: 5,
          damageType: 'bludgeoning',
        },
        {
          kind: 'natural',
          name: 'Rock Launch',
          attackType: 'slam',
          attackBonus: 8,
          reach: 5,
          damage: '1d6',
          damageBonus: 5,
          damageType: 'bludgeoning',
          notes: 'Ranged 60 ft.; if the target is Large or smaller, it has the Prone condition.',
          onHitEffects: [
            {
              kind: 'condition',
              conditionId: 'prone',
              targetSizeMax: 'large',
            },
          ],
        },
      ],
    },
    lore: {
      alignment: 'n',
      challengeRating: 5,
      xpValue: 1800,
      intelligence: 'low',
    },
  },
  {
    id: 'fire-elemental',
    name: 'Fire Elemental',
    type: 'elemental',
    sizeCategory: 'large',
    languages: [{ id: 'primordial' }],
    description: {
      short: 'A living bonfire that scorches everything nearby.',
      long: 'Fire elementals spread flame and ash wherever they roam.',
    },
    mechanics: {
      hitPoints: { count: 11, die: 10, modifier: 33 },
      armorClass: { kind: 'natural' },
      movement: { ground: 50 },
      abilities: { str: 10, dex: 17, con: 16, int: 6, wis: 10, cha: 7 },
      senses: { special: [{ type: 'darkvision', range: 60 }], passivePerception: 10 },
      resistances: ['bludgeoning', 'piercing', 'slashing'],
      immunities: [
        'fire',
        'poison',
        'exhaustion',
        'grappled',
        'paralyzed',
        'petrified',
        'poisoned',
        'prone',
        'restrained',
        'unconscious',
      ],
      proficiencyBonus: 3,
      traits: [
        {
          name: 'Fire Aura',
          description:
            'At the end of each of the elemental’s turns, each creature in a 10-foot Emanation originating from the elemental takes 5 (1d10) Fire damage.',
          effects: [
            {
              kind: 'note',
              text: 'End-of-turn aura damage to creatures in 10 ft. is not auto-resolved in encounter.',
              category: 'under-modeled',
            },
          ],
        },
        {
          name: 'Fire Form',
          description:
            'The elemental can move through a space as narrow as 1 inch without expending extra movement to do so, and it can enter a creature’s space and stop there. The first time it enters a creature’s space on a turn, that creature takes 5 (1d10) Fire damage.',
          resolution: {
            caveats: ['Enter-space fire damage and movement through occupied squares are not fully automated.'],
          },
        },
        {
          name: 'Illumination',
          description: 'The elemental sheds Bright Light in a 30-foot radius and Dim Light for an additional 30 feet.',
        },
        {
          name: 'Water Susceptibility',
          description:
            'The elemental takes 3 (1d6) Cold damage for every 5 feet the elemental moves in water or for every gallon of water splashed on it.',
          resolution: { caveats: ['Water/cold interaction is narrative; not tracked as automatic damage.'] },
        },
      ],
      actions: [
        {
          kind: 'special',
          name: 'Multiattack',
          description: 'The elemental makes two Burn attacks.',
          sequence: [{ actionName: 'Burn', count: 2 }],
        },
        {
          kind: 'natural',
          name: 'Burn',
          attackType: 'touch',
          attackBonus: 6,
          reach: 5,
          damage: '2d6',
          damageBonus: 3,
          damageType: 'fire',
          notes: 'If the target is a creature or a flammable object, it starts burning.',
        },
      ],
    },
    lore: {
      alignment: 'n',
      challengeRating: 5,
      xpValue: 1800,
      intelligence: 'low',
    },
  },
];
