import type { MonsterCatalogEntry } from '../types';

/** System catalog — ids whose `id` starts with `f`. */

export const MONSTERS_F: readonly MonsterCatalogEntry[] = [
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
              kind: 'emanation',
              attachedTo: 'self',
              area: { kind: 'sphere', size: 10 },
            },
            {
              kind: 'interval',
              stateId: 'fire-elemental-fire-aura',
              every: { value: 1, unit: 'turn' },
              effects: [{ kind: 'damage', damage: '1d10', damageType: 'fire' }],
            },
          ],
          resolution: {
            caveats: [
              'Rules as written: damage applies at the end of the elemental’s turn to creatures in the emanation.',
              'Encounter automation applies fire damage when a hostile creature ends its turn inside the 10-ft emanation (Spirit Guardians–style timing).',
            ],
          },
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
          sequence: [{ actionId: 'burn', count: 2 }],
        },
        {
          kind: 'natural',
          id: 'burn',
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
