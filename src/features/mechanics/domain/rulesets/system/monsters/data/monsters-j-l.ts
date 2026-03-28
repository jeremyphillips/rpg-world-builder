import type { MonsterCatalogEntry } from '../types';

/** System catalog — ids starting with [j-l] (first character of `id`). */

export const MONSTERS_J_L: readonly MonsterCatalogEntry[] = [
{
    id: "kobold-warrior",
    name: "Kobold Warrior",
    imageKey: '/assets/system/monsters/kobold-warrior.png',
    type: "dragon",
    languages: [{ id: "common" }, { id: "draconic" }],
    sizeCategory: "small",
    description: {
      short: "Small diminutive, reptilian dragons with a knack for traps and ambushes.",
      long: "Kobolds are craven reptilian dragons that commonly infest dungeons. They are physically weak but make up for it with cunning traps, overwhelming numbers, and a fanatical devotion to dragons.",
    },
    mechanics: {
      hitPoints: {
        count: 3,
        die: 6,
        modifier: -3
      },
      armorClass: { kind: 'natural', offset: 2 },
      movement: { ground: 30 },
      actions: [
        { kind: 'weapon', weaponRef: "dagger" },
        { kind: 'weapon', weaponRef: "sling" },
      ],
      abilities: { str: 7, dex: 15, con: 9, int: 8, wis: 7, cha: 8 },
      senses: { 
        special: [{ type: "darkvision", range: 60 }],
        passivePerception: 8,
      },
      proficiencies: {
        weapons: {
          dagger: { proficiencyLevel: 1 },
          sling: { proficiencyLevel: 1 },
        },
      },
      proficiencyBonus: 2,
      equipment: {
        weapons: {
          dagger: { weaponId: "dagger" },
          sling: { weaponId: "sling" },
        },
      },
      traits: [
        {
          name: 'Pack Tactics',
          description:
            'The creature has Advantage on attack rolls against a creature if at least one of its allies is within 5 feet of the creature and the ally doesn’t have the Incapacitated condition.',
          trigger: {
            kind: 'ally-near-target',
            withinFeet: 5,
            allyConditionNot: 'incapacitated',
          },
          effects: [
            {
              kind: 'roll-modifier',
              appliesTo: 'attack-rolls',
              modifier: 'advantage',
            },
          ],
        },
        {
          name: 'Sunlight Sensitivity',
          description:
            'While in sunlight, the kobold has Disadvantage on ability checks and attack rolls.',
          trigger: {
            kind: 'in-environment',
            environment: 'sunlight',
          },
          effects: [
            {
              kind: 'roll-modifier',
              appliesTo: ['ability-checks', 'attack-rolls'],
              modifier: 'disadvantage',
            },
          ],
        }
      ]
    },
    lore: {
      alignment: "le",
      challengeRating: 0.125,
      xpValue: 25,
      intelligence: "average",
    },
  }
];
