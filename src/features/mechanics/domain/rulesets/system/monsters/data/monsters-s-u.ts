import type { MonsterCatalogEntry } from '../types';

/** System catalog — ids starting with [s-u] (first character of `id`). */

export const MONSTERS_S_U: readonly MonsterCatalogEntry[] = [
  {
    id: "skeleton",
    name: "Skeleton",
    imageKey: '/assets/system/monsters/skeleton.png',
    type: "undead",
    sizeCategory: "medium",
    languages: [{ id: "common", speaks: false }],
    description: {
      short: "Animated bones of the dead, mindlessly carrying out their creator's bidding.",
      long: "Skeletons are the animated bones of the dead, given a semblance of life through dark magic. They obey the commands of their creator without question or hesitation.",
    },
    mechanics: {
      hitPoints: {
        count: 2,
        die: 8,
        modifier: +4,
      },
      armorClass: { kind: 'equipment', armorRefs: ["scraps"] },
      movement: { ground: 30 },
      actions: [
        { kind: 'weapon', weaponRef: "shortsword" },
        { kind: 'weapon', weaponRef: "shortbow" },
      ],
      equipment: {
        weapons: {
          shortsword: { weaponId: "shortsword" },
          shortbow: { weaponId: "shortbow" },
        },
        armor: {
          scraps: {
            armorId: "chain-shirt",
            acModifier: -1,
            aliasName: "Armor Scraps",
            notes: "Made from scrap metal and chain mail.",
          },
        },
      },
      proficiencies: {
        weapons: {
          shortsword: { proficiencyLevel: 1 },
          shortbow: { proficiencyLevel: 1 },
        },
      },
      proficiencyBonus: 2,
      abilities: { str: 10, dex: 16, con: 15, int: 6, wis: 8, cha: 5 },
      senses: {
        special: [{ type: "darkvision", range: 60 }],
        passivePerception: 9,
      },
      immunities: ["poison", "exhaustion"],
      vulnerabilities: ["bludgeoning"],
    },
    lore: {
      alignment: "le",
      challengeRating: 0.25,
      xpValue: 50,
      intelligence: "low",
    },
  },
  {
    id: 'steam-mephit',
    name: 'Steam Mephit',
    type: 'elemental',
    sizeCategory: 'small',
    languages: [{ id: 'primordial' }],
    description: {
      short: 'A hissing elemental of scalding vapor and hot mist.',
      long: 'Steam mephits blur the air around themselves and exhale cones of burning steam that cling even underwater.',
    },
    mechanics: {
      hitPoints: { count: 5, die: 6 },
      armorClass: { kind: 'natural' },
      movement: { ground: 30, fly: 30 },
      abilities: { str: 5, dex: 11, con: 10, int: 11, wis: 10, cha: 12 },
      senses: {
        special: [{ type: 'darkvision', range: 60 }],
        passivePerception: 10,
      },
      proficiencies: {
        skills: { stealth: { proficiencyLevel: 1 } },
      },
      proficiencyBonus: 2,
      immunities: ['fire', 'poison', 'exhaustion'],
      traits: [
        {
          name: 'Blurred Form',
          description:
            'Attack rolls against the mephit are made with Disadvantage unless the mephit has the Incapacitated condition.',
          effects: [
            {
              kind: 'note',
              text: 'Treat as disadvantage on attacks vs this creature unless incapacitated; not automated as a defender modifier.',
              category: 'under-modeled',
            },
          ],
        },
        {
          name: 'Death Burst',
          description:
            'The mephit explodes when it dies. Dexterity Saving Throw: DC 10, each creature in a 5-foot Emanation originating from the mephit. Failure: 5 (2d4) Fire damage. Success: Half damage.',
          trigger: { kind: 'reduced-to-0-hp' },
          effects: [
            {
              kind: 'note',
              text: 'Resolve 5-ft emanation Dex save DC 10 vs 2d4 fire (half on success) at table.',
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
          attackBonus: 2,
          reach: 5,
          damage: '1d4',
          damageType: 'slashing',
          onHitEffects: [{ kind: 'damage', damage: '1d4', damageType: 'fire' }],
        },
        {
          kind: 'special',
          name: 'Steam Breath',
          description:
            'Constitution Saving Throw: DC 10, each creature in a 15-foot Cone. Failure: 5 (2d4) Fire damage, and the target’s Speed decreases by 10 feet until the end of the mephit’s next turn. Success: Half damage only. Failure or Success: Being underwater doesn’t grant Resistance to this Fire damage.',
          save: { ability: 'con', dc: 10 },
          area: { kind: 'cone', size: 15 },
          target: 'creatures-in-area',
          damage: '2d4',
          damageType: 'fire',
          halfDamageOnSave: true,
          recharge: { min: 6, max: 6 },
          resolution: {
            caveats: ['Speed reduction and underwater resistance override are not fully automated.'],
          },
        },
      ],
    },
    lore: {
      alignment: 'ne',
      challengeRating: 0.25,
      xpValue: 50,
      intelligence: 'low',
    },
  },
{
    id: "troll",
    name: "Troll",
    type: "giant",
    sizeCategory: "large",
    languages: [{ id: "giant" }],
    description: {
      short: "Loathsome giants with terrible claws and fearsome regeneration.",
      long: "Trolls are fearsome green-skinned giants known for their ability to regenerate even the most grievous wounds. Only fire and acid can permanently halt their regeneration.",
    },
    mechanics: {
      hitPoints: {
        count: 9,
        die: 10,
        modifier: +45,
      },
      armorClass: {
        kind: 'natural',
        offset: 4,
      },
      movement: { ground: 30 },
      actions: [
        {
          kind: "special",
          name: "Multiattack",
          description: "The troll makes three Rend attacks.",
          sequence: [
            { actionId: 'rend', count: 3 }
          ]
        },
        {
          kind: "natural",
          id: 'rend',
          name: "Rend",
          attackType: "claw",
          attackBonus: 7,
          reach: 10,
          damage: "2d6",
          damageBonus: 4,
          damageType: "slashing"
        }
      ],
      bonusActions: [{
        kind: 'special',
        name: 'Charge',
        description: 'The troll moves up to half its Speed straight toward an enemy it can see.',
        movement: {
          upToSpeedFraction: 0.5,
          straightTowardVisibleEnemy: true,
        },
      }],
      senses: {
        special: [{ type: "darkvision", range: 60 }],
        passivePerception: 15,
      },
      abilities: { str: 18, dex: 13, con: 20, int: 7, wis: 9, cha: 7 },
      traits: [
        {
          name: 'Loathsome Limbs',
          description:
            'If the troll ends any turn Bloodied and took 15+ Slashing damage during that turn, one limb is severed and becomes a Troll Limb.',
          uses: {
            count: 4,
            period: 'day',
          },
          trigger: {
            kind: 'turn-end',
          },
          requirements: [
            { kind: 'self-state', state: 'bloodied' },
            { kind: 'damage-taken-this-turn', damageType: 'slashing', min: 15 },
          ],
          effects: [
            {
              kind: 'tracked-part',
              part: 'limb',
              change: {
                mode: 'sever',
                count: 1,
              },
            },
            {
              // Engine caveat: spawn is still partial and does not yet create a fully simulated combatant.
              kind: 'spawn',
              creature: 'Troll Limb',
              count: 1,
              location: 'self-space',
              actsWhen: 'immediately-after-source-turn',
            },
            {
              // Engine caveat: custom tracked-part resource mapping still needs a canonical runtime model.
              kind: 'custom',
              id: 'monster.resource_from_tracked_parts',
              params: {
                resource: 'exhaustion',
                mode: 'set',
                value: 'per-missing-limb',
                part: 'limb',
              },
            },
          ],
          notes:
            'Replacement limbs grow the next time the troll regains Hit Points.',
        },
        {
          name: 'Regeneration',
          description:
            'The troll regains 15 Hit Points at the start of each of its turns. Acid or Fire damage suppresses this trait on its next turn.',
          effects: [
            {
              kind: 'regeneration',
              amount: 15,
              trigger: { kind: 'turn-start', subject: 'self' },
              suppressedByDamageTypes: ['acid', 'fire'],
              suppressionDuration: {
                kind: 'until-turn-boundary',
                subject: 'self',
                turn: 'next',
                boundary: 'end',
              },
              disabledAtZeroHp: true,
            },
          ],
          notes:
            'The troll dies only if it starts its turn with 0 Hit Points and does not regenerate.',
        }
      ],
      proficiencies: {
        skills: { perception: { proficiencyLevel: 2 } },
      },
      proficiencyBonus: 3,
    },
    lore: {
      alignment: "ce",
      challengeRating: 5,
      xpValue: 1800,
      intelligence: "low",
    },
  }
];
