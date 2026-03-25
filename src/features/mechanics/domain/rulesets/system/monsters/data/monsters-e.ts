import type { MonsterCatalogEntry } from '../types';

/** System catalog — ids whose `id` starts with `e`. */

export const MONSTERS_E: readonly MonsterCatalogEntry[] = [
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
      immunities: ['poison', 'exhaustion', 'paralyzed', 'petrified', 'unconscious'],
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
          sequence: [{ actionId: 'slam', count: 2 }],
          notes: 'At table, substitute Rock Launch for any Slam step.',
        },
        {
          kind: 'natural',
          id: 'slam',
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
];
