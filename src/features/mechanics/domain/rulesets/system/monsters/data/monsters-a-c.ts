import type { MonsterCatalogEntry } from '../types';

/** System catalog — ids starting with [a-c] (first character of `id`). */

export const MONSTERS_A_C: readonly MonsterCatalogEntry[] = [
  {
    id: 'air-elemental',
    name: 'Air Elemental',
    type: 'elemental',
    sizeCategory: 'large',
    languages: [{ id: 'primordial' }],
    description: {
      short: 'A howling vortex of wind and debris.',
      long: 'Air elementals are destructive storms given purpose, battering foes with thunderous force.',
    },
    mechanics: {
      hitPoints: { count: 12, die: 10, modifier: 24 },
      armorClass: { kind: 'natural' },
      movement: { ground: 10, fly: 90 },
      abilities: { str: 14, dex: 20, con: 14, int: 6, wis: 10, cha: 6 },
      senses: { special: [{ type: 'darkvision', range: 60 }], passivePerception: 10 },
      resistances: ['bludgeoning', 'piercing', 'slashing', 'lightning'],
      immunities: [
        'poison',
        'thunder',
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
          name: 'Air Form',
          description:
            "The elemental can enter a creature's space and stop there. It can move through a space as narrow as 1 inch without expending extra movement to do so.",
        },
      ],
      actions: [
        {
          kind: 'special',
          name: 'Multiattack',
          description: 'The elemental makes two Thunderous Slam attacks.',
          sequence: [{ actionName: 'Thunderous Slam', count: 2 }],
        },
        {
          kind: 'natural',
          name: 'Thunderous Slam',
          attackType: 'slam',
          attackBonus: 8,
          reach: 10,
          damage: '2d8',
          damageBonus: 5,
          damageType: 'thunder',
        },
        {
          kind: 'special',
          name: 'Whirlwind',
          description:
            'Strength Saving Throw: DC 13, one Medium or smaller creature in the elemental’s space. Failure: 24 (4d10 + 2) Thunder damage, and the target is pushed up to 20 feet straight away from the elemental and has the Prone condition. Success: Half damage only.',
          save: { ability: 'str', dc: 13 },
          recharge: { min: 4, max: 6 },
          damage: '4d10',
          damageBonus: 2,
          damageType: 'thunder',
          halfDamageOnSave: true,
          onFail: [{ kind: 'condition', conditionId: 'prone' }],
          resolution: {
            caveats: ['Space/size targeting and push vector are not simulated; uses single-target hostile flow.'],
          },
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
    id: 'azer-sentinel',
    name: 'Azer Sentinel',
    type: 'elemental',
    sizeCategory: 'medium',
    languages: [{ id: 'primordial' }],
    description: {
      short: 'A dwarf-like brass-skinned elemental wreathed in forge heat.',
      long: 'Azers are disciplined elementals of flame and metal. Azer sentinels guard planar forges and blazing halls, hammering intruders with superheated weapons.',
    },
    mechanics: {
      hitPoints: { count: 6, die: 8, modifier: 12 },
      armorClass: { kind: 'natural', offset: 6 },
      movement: { ground: 30 },
      abilities: { str: 17, dex: 12, con: 15, int: 12, wis: 13, cha: 10 },
      savingThrows: {
        con: { proficiencyLevel: 1 },
      },
      senses: { passivePerception: 11 },
      proficiencyBonus: 2,
      immunities: ['fire', 'poison', 'poisoned'],
      traits: [
        {
          name: 'Fire Aura',
          description:
            'At the end of each of the azer’s turns, each creature of the azer’s choice in a 5-foot Emanation originating from the azer takes 5 (1d10) Fire damage unless the azer has the Incapacitated condition.',
          effects: [
            {
              kind: 'note',
              text: 'End-of-turn aura damage and chosen targets in 5 ft. are not auto-resolved in encounter.',
              category: 'under-modeled',
            },
          ],
        },
        {
          name: 'Illumination',
          description:
            'The azer sheds Bright Light in a 10-foot radius and Dim Light for an additional 10 feet.',
        },
      ],
      actions: [
        {
          kind: 'natural',
          name: 'Burning Hammer',
          attackType: 'slam',
          attackBonus: 5,
          reach: 5,
          damage: '1d10',
          damageBonus: 3,
          damageType: 'bludgeoning',
          onHitEffects: [{ kind: 'damage', damage: '1d6', damageType: 'fire' }],
        },
      ],
    },
    lore: {
      alignment: 'ln',
      challengeRating: 2,
      xpValue: 450,
      intelligence: 'average',
    },
  },
{
    id: "bugbear-warrior",
    name: "Bugbear Warrior",
    type: "fey",
    sizeCategory: "medium",
    languages: [{ id: "common" }, { id: "goblin" }],
    description: {
      short: "Stealthy, brutish goblinoids that delight in ambush and cruelty.",
      long: "Bugbears are the largest of the goblinoid races, combining brute strength with a surprising talent for stealth. They prefer ambush over direct confrontation and bully weaker creatures into servitude.",
    },
    mechanics: {
      hitPoints: {
        count: 6,
        die: 8,
        modifier: +6,
      },
      armorClass: { kind: 'equipment', armorRefs: ["hide"] },
      movement: { ground: 30 },
      actions: [
        {
          kind: "special",
          name: "Grab",
          attackBonus: 4,
          reach: 10,
          damage: "2d6",
          damageBonus: 2,
          damageType: "bludgeoning",
          description: "If the target is a Medium or smaller creature, it has the Grappled condition with an escape DC of 12.",
          onSuccess: [
            { kind: 'condition', conditionId: 'grappled', targetSizeMax: 'medium', escapeDc: 12 }
          ]
        },
        { kind: "weapon", weaponRef: "light-hammer" }
      ],
      traits: [{
        name: 'Abduct',
        description:
          'The bugbear needn’t spend extra movement to move a creature it is grappling.',
        trigger: {
          kind: 'while-moving-grappled-creature',
        },
        effects: [
          {
            kind: 'move',
            ignoresExtraCostForGrappledCreature: true,
          },
        ],
      }],
      proficiencies: {
        skills: { stealth: { proficiencyLevel: 2 }, survival: { proficiencyLevel: 1 } },
        weapons: { 'light-hammer': { proficiencyLevel: 1 } },
      },
      proficiencyBonus: 2,
      equipment: {
        weapons: {
          'light-hammer': { 
            weaponId: "light-hammer",
            attackBonus: 4,
            damageOverride: "3d4",
            reach: 10,
            notes: "Has advantage if the target is grappled by the bugbear.",
          },
        },
        armor: {
          hide: { armorId: "hide" },
        },
      },
      senses: {
        special: [{ type: "darkvision", range: 60 }],
        passivePerception: 10,
      },
      abilities: { str: 15, dex: 14, con: 13, int: 8, wis: 11, cha: 9 },
    },
    lore: {
      alignment: "ce",
      challengeRating: 1,
      xpValue: 200,
      intelligence: "average",
    },
  }
];
