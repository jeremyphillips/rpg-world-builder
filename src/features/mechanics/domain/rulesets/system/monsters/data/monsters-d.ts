import type { MonsterCatalogEntry } from '../types';

/** System catalog — ids whose `id` starts with `d`. */

export const MONSTERS_D: readonly MonsterCatalogEntry[] = [
  {
    id: 'djinni',
    name: 'Djinni',
    type: 'elemental',
    sizeCategory: 'large',
    languages: [{ id: 'primordial' }],
    description: {
      short: 'A proud air genie of storm and wind, bound by ancient bargains and capricious whims.',
      long:
        'Djinni are noble elementals of the Plane of Air. They wield lightning and thunder, command the winds, and are famed for their magic and rare wishes.',
    },
    mechanics: {
      hitPoints: { count: 19, die: 10, modifier: 114 },
      armorClass: { kind: 'natural', offset: 5 },
      movement: { ground: 30, fly: 90 },
      abilities: { str: 21, dex: 15, con: 22, int: 15, wis: 16, cha: 20 },
      savingThrows: {
        dex: { proficiencyLevel: 1 },
        wis: { proficiencyLevel: 1 },
      },
      senses: {
        special: [{ type: 'darkvision', range: 120 }],
        passivePerception: 13,
      },
      proficiencyBonus: 4,
      immunities: ['lightning', 'thunder'],
      traits: [
        {
          name: 'Elemental Restoration',
          description:
            'If the djinni dies outside the Elemental Plane of Air, its body dissolves into mist, and it gains a new body in 1d4 days, reviving with all its Hit Points somewhere on the Plane of Air.',
          resolution: {
            caveats: ['Plane-bound revival is narrative; not enforced in encounter runtime.'],
          },
        },
        {
          name: 'Magic Resistance',
          description: 'The djinni has Advantage on saving throws against spells and other magical effects.',
          effects: [
            {
              kind: 'roll-modifier',
              appliesTo: 'saving-throws',
              modifier: 'advantage',
            },
          ],
          resolution: {
            caveats: ['Advantage is not filtered to spell/magic-only saves in automation.'],
          },
        },
        {
          name: 'Wishes',
          description:
            'The djinni has a 30 percent chance of knowing the Wish spell. If the djinni knows it, the djinni can cast it only on behalf of a non-genie creature who communicates a wish in a way the djinni can understand. If the djinni casts the spell for the creature, the djinni suffers none of the spell’s stress. Once the djinni has cast it three times, the djinni can’t do so again for 365 days.',
          resolution: {
            caveats: ['Wish availability and casting limits are not modeled in data.'],
          },
        },
      ],
      actions: [
        {
          kind: 'special',
          name: 'Multiattack',
          description:
            'The djinni makes three attacks, using Storm Blade or Storm Bolt in any combination.',
          sequence: [{ actionName: 'Storm Blade', count: 3 }],
          notes: 'At table, substitute Storm Bolt for any Storm Blade step.',
        },
        {
          kind: 'natural',
          name: 'Storm Blade',
          attackType: 'claw',
          attackBonus: 9,
          reach: 5,
          damage: '2d6',
          damageBonus: 5,
          damageType: 'slashing',
          onHitEffects: [{ kind: 'damage', damage: '2d6', damageType: 'lightning' }],
        },
        {
          kind: 'special',
          name: 'Storm Bolt',
          description:
            'Ranged Attack Roll: +9, range 120 feet. Hit: 13 (3d8) Thunder damage. If the target is a Large or smaller creature, it has the Prone condition.',
          damage: '3d8',
          damageType: 'thunder',
          resolution: {
            caveats: ['Prone rider on hit and ranged targeting are not fully automated.'],
          },
        },
        {
          kind: 'special',
          name: 'Create Whirlwind',
          description:
            'The djinni conjures a whirlwind at a point it can see within 120 feet. The whirlwind fills a 20-foot-radius, 60-foot-high Cylinder centered on that point. The whirlwind lasts until the djinni’s Concentration on it ends. The djinni can move the whirlwind up to 20 feet at the start of each of its turns. Whenever the whirlwind enters a creature’s space or a creature enters the whirlwind, that creature is subjected to the following effect. Strength Saving Throw: DC 17 (a creature makes this save only once per turn, and the djinni is unaffected). Failure: While in the whirlwind, the target has the Restrained condition and moves with the whirlwind. At the start of each of its turns, the Restrained target takes 21 (6d6) Thunder damage. At the end of each of its turns, the target repeats the save, ending the effect on itself on a success.',
          save: { ability: 'str', dc: 17 },
          area: { kind: 'cylinder', size: 20 },
          damage: '6d6',
          damageType: 'thunder',
          onFail: [{ kind: 'condition', conditionId: 'restrained' }],
          resolution: {
            caveats: [
              'Cylinder geometry, concentration, movement with whirlwind, and once-per-turn save tracking are not fully modeled.',
            ],
          },
        },
        {
          kind: 'special',
          name: 'Spellcasting',
          description:
            'The djinni casts one of the following spells, requiring no Material components and using Charisma as the spellcasting ability (spell save DC 17): At Will: Detect Evil and Good, Detect Magic; 2/Day Each: Create Food and Water (can create wine instead of water), Tongues, Wind Walk; 1/Day Each: Creation, Gaseous Form, Invisibility, Major Image, Plane Shift.',
          resolution: {
            caveats: ['Innate spell list and per-spell frequency are not automated from catalog.'],
          },
        },
      ],
    },
    lore: {
      alignment: 'n',
      challengeRating: 11,
      xpValue: 7200,
      intelligence: 'high',
    },
  },
  {
    id: 'dust-mephit',
    name: 'Dust Mephit',
    type: 'elemental',
    sizeCategory: 'small',
    languages: [{ id: 'primordial' }],
    description: {
      short: 'A sneering little elemental of grit and choking dust.',
      long: 'Dust mephits delight in blinding foes and leave explosive clouds of debris when destroyed.',
    },
    mechanics: {
      hitPoints: { count: 5, die: 6 },
      armorClass: { kind: 'natural' },
      movement: { ground: 30, fly: 30 },
      abilities: { str: 5, dex: 14, con: 10, int: 9, wis: 11, cha: 10 },
      senses: {
        special: [{ type: 'darkvision', range: 60 }],
        passivePerception: 12,
      },
      proficiencies: {
        skills: { perception: { proficiencyLevel: 1 }, stealth: { proficiencyLevel: 1 } },
      },
      proficiencyBonus: 2,
      vulnerabilities: ['fire'],
      immunities: ['poison', 'exhaustion', 'poisoned'],
      traits: [
        {
          name: 'Death Burst',
          description:
            'The mephit explodes when it dies. Dexterity Saving Throw: DC 10, each creature in a 5-foot Emanation originating from the mephit. Failure: 5 (2d4) Bludgeoning damage. Success: Half damage.',
          trigger: { kind: 'reduced-to-0-hp' },
          effects: [
            {
              kind: 'note',
              text: 'Resolve 5-ft emanation Dex save DC 10 vs 2d4 bludgeoning (half on success) at table.',
              category: 'under-modeled',
            },
          ],
        },
      ],
      actions: [
        {
          kind: 'natural',
          name: 'Claw',
          attackType: 'claw',
          attackBonus: 4,
          reach: 5,
          damage: '1d4',
          damageBonus: 2,
          damageType: 'slashing',
        },
        {
          kind: 'special',
          name: 'Blinding Breath',
          description:
            'Dexterity Saving Throw: DC 10, each creature in a 15-foot Cone. Failure: The target has the Blinded condition until the end of the mephit’s next turn.',
          save: { ability: 'dex', dc: 10 },
          area: { kind: 'cone', size: 15 },
          target: 'creatures-in-area',
          recharge: { min: 6, max: 6 },
          onFail: [{ kind: 'condition', conditionId: 'blinded' }],
          resolution: {
            caveats: ['Blinded duration until end of mephit’s next turn may need manual tracking.'],
          },
        },
        {
          kind: 'special',
          name: 'Sleep',
          description:
            'The mephit casts the Sleep spell, requiring no spell components and using Charisma as the spellcasting ability (spell save DC 10).',
          uses: { count: 1, period: 'day' },
          resolution: {
            caveats: ['Sleep spell is not resolved from this action in encounter automation.'],
          },
        },
      ],
    },
    lore: {
      alignment: 'ne',
      challengeRating: 0.5,
      xpValue: 100,
      intelligence: 'low',
    },
  },
];
