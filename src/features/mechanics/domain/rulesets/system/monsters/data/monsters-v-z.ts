import type { MonsterCatalogEntry } from '../types';

/** System catalog — ids starting with [v-z] (first character of `id`). */

export const MONSTERS_V_Z: readonly MonsterCatalogEntry[] = [
  {
    id: 'water-elemental',
    name: 'Water Elemental',
    type: 'elemental',
    sizeCategory: 'large',
    languages: [{ id: 'primordial' }],
    description: {
      short: 'A crashing wave of animate water.',
      long: 'Water elementals engulf foes and drag them under.',
    },
    mechanics: {
      hitPoints: { count: 12, die: 10, modifier: 48 },
      armorClass: { kind: 'natural', offset: 2 },
      movement: { ground: 30, swim: 90 },
      abilities: { str: 18, dex: 14, con: 18, int: 5, wis: 10, cha: 8 },
      senses: { special: [{ type: 'darkvision', range: 60 }], passivePerception: 10 },
      resistances: ['acid', 'fire'],
      immunities: [
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
          name: 'Freeze',
          description:
            'If the elemental takes Cold damage, its Speed decreases by 20 feet until the end of its next turn.',
          resolution: { caveats: ['Speed reduction from cold is not applied as a runtime modifier yet.'] },
        },
        {
          name: 'Water Form',
          description:
            'The elemental can enter an enemy’s space and stop there. It can move through a space as narrow as 1 inch without expending extra movement to do so.',
        },
      ],
      actions: [
        {
          kind: 'special',
          name: 'Multiattack',
          description: 'The elemental makes two Slam attacks.',
          sequence: [{ actionId: 'slam', count: 2 }],
        },
        {
          kind: 'natural',
          id: 'slam',
          name: 'Slam',
          attackType: 'slam',
          attackBonus: 7,
          reach: 5,
          damage: '2d8',
          damageBonus: 4,
          damageType: 'bludgeoning',
          notes: 'If the target is Medium or smaller, it has the Prone condition.',
          onHitEffects: [
            {
              kind: 'condition',
              conditionId: 'prone',
              targetSizeMax: 'medium',
            },
          ],
        },
        {
          kind: 'special',
          name: 'Whelm',
          description:
            'Strength Saving Throw: DC 15, each creature in the elemental’s space. Failure: 22 (4d8 + 4) Bludgeoning damage; Large or smaller targets can be grappled and restrained with ongoing damage and suffocation rules.',
          save: { ability: 'str', dc: 15 },
          recharge: { min: 4, max: 6 },
          damage: '4d8',
          damageBonus: 4,
          damageType: 'bludgeoning',
          halfDamageOnSave: true,
          onFail: [{ kind: 'condition', conditionId: 'restrained' }],
          resolution: {
            caveats: [
              'Whelm grapple capacity, ally pull, suffocation, and multi-target space rules are not fully modeled.',
            ],
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
    id: 'wight',
    name: 'Wight',
    type: 'undead',
    sizeCategory: 'medium',
    languages: [{ id: 'common' }, { id: 'goblin' }],
    description: {
      short: 'Malevolent undead knights that drain life force and raise slain foes as zombies.',
      long: 'Wights retain martial skill and a cruel intelligence. Their weapons carry necrotic rot, and those they slay may rise again as shambling servants—up to a dozen at a time.',
    },
    mechanics: {
      hitPoints: { count: 11, die: 8, modifier: 33 },
      armorClass: { kind: 'equipment', armorRefs: ['studded-leather'] },
      movement: { ground: 30 },
      abilities: { str: 15, dex: 14, con: 16, int: 10, wis: 13, cha: 15 },
      senses: {
        special: [{ type: 'darkvision', range: 60 }],
        passivePerception: 13,
      },
      proficiencies: {
        skills: {
          perception: { proficiencyLevel: 1 },
          stealth: { proficiencyLevel: 1 },
        },
        weapons: {
          longsword: { proficiencyLevel: 1 },
          longbow: { proficiencyLevel: 1 },
        },
      },
      proficiencyBonus: 2,
      resistances: ['necrotic'],
      immunities: ['poison', 'exhaustion'],
      traits: [
        {
          name: 'Sunlight Sensitivity',
          description:
            'While in sunlight, the wight has Disadvantage on ability checks and attack rolls.',
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
        },
      ],
      actions: [
        {
          kind: 'special',
          name: 'Multiattack',
          description:
            'The wight makes two attacks, using Necrotic Sword or Necrotic Bow in any combination. It can replace one attack with a use of Life Drain.',
          sequence: [{ actionId: 'necrotic-sword', count: 2 }],
          notes: 'Each attack may use Necrotic Bow instead; one attack may be replaced with Life Drain.',
        },
        { kind: 'weapon', weaponRef: 'necrotic-sword' },
        { kind: 'weapon', weaponRef: 'necrotic-bow' },
        {
          kind: 'special',
          name: 'Life Drain',
          description:
            'Constitution Saving Throw: DC 13, one creature within 5 feet. Failure: 6 (1d8 + 2) Necrotic damage, and the target’s Hit Point maximum decreases by an amount equal to the damage taken.',
          save: { ability: 'con', dc: 13 },
          damage: '1d8',
          damageBonus: 2,
          damageType: 'necrotic',
          halfDamageOnSave: false,
          onFail: [
            {
              kind: 'note',
              text: "Target's Hit Point maximum decreases by an amount equal to the necrotic damage taken (typically until finishing a Long Rest).",
            },
          ],
          notes:
            'A Humanoid slain by this attack rises 24 hours later as a Zombie under the wight’s control, unless the Humanoid is restored to life or its body is destroyed. The wight can have no more than twelve zombies under its control at a time.',
          resolution: {
            caveats: [
              'HP maximum reduction, zombie spawn timing, and a cap of twelve controlled zombies are not enforced in encounter resolution.',
            ],
          },
        },
      ],
      equipment: {
        weapons: {
          'necrotic-sword': {
            weaponId: 'longsword',
            aliasName: 'Necrotic Sword',
            attackBonus: 4,
            damageBonus: 2,
            notes: '+ 4 (1d8) Necrotic damage on hit.',
          },
          'necrotic-bow': {
            weaponId: 'longbow',
            aliasName: 'Necrotic Bow',
            attackBonus: 4,
            damageBonus: 2,
            notes: '+ 4 (1d8) Necrotic damage on hit.',
          },
        },
        armor: {
          'studded-leather': { armorId: 'studded-leather' },
        },
      },
    },
    lore: {
      alignment: 'ne',
      challengeRating: 3,
      xpValue: 700,
      intelligence: 'average',
    },
  },
{
    id: "wolf",
    name: "Wolf",
    type: "beast",
    languages: [],
    sizeCategory: "medium",
    description: {
      short: "Pack hunters found throughout temperate and subarctic wilderness.",
      long: "Wolves are cunning and social predators that hunt in packs, using coordinated tactics to bring down prey larger than themselves.",
    },
    mechanics: {
      hitPoints: {
        count: 2,
        die: 8,
        modifier: +2,
      },
      armorClass: {
        kind: 'natural',
        offset: 1,
      },
      movement: { ground: 40 },
      actions: [
        {
          kind: 'natural',
          name: 'Bite',
          attackType: 'bite',
          damage: '2d4',
          damageBonus: 2,
          damageType: "piercing",
          attackBonus: 4,
          reach: 5,
          onHitEffects: [
            {
              kind: 'save',
              save: { ability: 'str', dc: 11 },
              onFail: [{ kind: 'condition', conditionId: 'prone' }],
            },
          ],
        },
      ],
      abilities: { str: 12, dex: 15, con: 12, int: 3, wis: 12, cha: 6 },
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
        }
      ],
      proficiencyBonus: 2,
    },
    lore: {
      alignment: "n",
      challengeRating: 0.25,
      xpValue: 50,
      intelligence: "semi",
    },
  },
  {
    id: 'xorn',
    name: 'Xorn',
    type: 'elemental',
    sizeCategory: 'medium',
    languages: [{ id: 'primordial' }],
    description: {
      short: 'A tripartite earth elemental that swims through stone and hungers for gems.',
      long: 'Xorns are bizarre natives of the Elemental Plane of Earth. They glide through unworked rock, sense treasure, and overwhelm foes with bites and a flurry of claws.',
    },
    mechanics: {
      hitPoints: { count: 8, die: 8, modifier: 48 },
      armorClass: { kind: 'natural', offset: 9 },
      movement: { ground: 20, burrow: 20 },
      abilities: { str: 17, dex: 10, con: 22, int: 11, wis: 10, cha: 11 },
      senses: {
        special: [
          { type: 'darkvision', range: 60 },
          { type: 'tremorsense', range: 60 },
        ],
        passivePerception: 16,
      },
      proficiencies: {
        skills: { perception: { proficiencyLevel: 2 }, stealth: { proficiencyLevel: 2 } },
      },
      proficiencyBonus: 3,
      immunities: ['poison', 'paralyzed', 'petrified'],
      traits: [
        {
          name: 'Earth Glide',
          description:
            'The xorn can burrow through nonmagical, unworked earth and stone. While doing so, the xorn doesn’t disturb the material it moves through.',
        },
        {
          name: 'Treasure Sense',
          description:
            'The xorn can pinpoint the location of precious metals and stones within 60 feet of itself.',
          resolution: {
            caveats: ['Treasure sense does not reveal exact items or quantities in automation.'],
          },
        },
      ],
      actions: [
        {
          kind: 'special',
          name: 'Multiattack',
          description: 'The xorn makes one Bite attack and three Claw attacks.',
          sequence: [
            { actionId: 'bite', count: 1 },
            { actionId: 'claw', count: 3 },
          ],
        },
        {
          kind: 'natural',
          id: 'bite',
          name: 'Bite',
          attackType: 'bite',
          attackBonus: 6,
          reach: 5,
          damage: '4d6',
          damageBonus: 3,
          damageType: 'piercing',
        },
        {
          kind: 'natural',
          id: 'claw',
          name: 'Claw',
          attackType: 'claw',
          attackBonus: 6,
          reach: 5,
          damage: '1d10',
          damageBonus: 3,
          damageType: 'slashing',
        },
      ],
      bonusActions: [
        {
          kind: 'special',
          name: 'Charge',
          description:
            'The xorn moves up to its Speed or Burrow Speed straight toward an enemy it can sense.',
          movement: {
            upToSpeed: true,
            straightTowardVisibleEnemy: true,
          },
          resolution: {
            caveats: ['Burrow path and tremorsense targeting are not fully simulated.'],
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
    id: "zombie",
    name: "Zombie",
    type: "undead",
    languages: [{ id: "common", speaks: false }],
    description: {
      short: "Shambling corpses animated by dark necromantic energy.",
      long: "Zombies are mindless undead created through necromantic magic. They are slow but relentless, obeying simple commands from their creator without hesitation or self-preservation.",
    },
    mechanics: {
      hitPoints: {
        count: 3,
        die: 8,
        modifier: +9,
      },
      armorClass: { kind: 'natural' },
      movement: { ground: 20 },
      actions: [{ kind: "natural", name: "Slam", attackType: "slam", reach: 5, damage: "1d8", attackBonus: 3, damageBonus: 1, damageType: "bludgeoning" }],
      traits: [
        {
          name: 'Undead Fortitude',
          description:
            'If damage reduces the zombie to 0 Hit Points, it makes a Constitution saving throw...',
          trigger: {
            kind: 'reduced-to-0-hp',
          },
          effects: [
            {
              kind: 'custom',
              id: 'monster.save_exception',
              params: {
                damageTypes: ['radiant'],
                criticalHit: true,
              },
            },
            {
              kind: 'save',
              save: {
                ability: 'con',
                dc: { kind: '5-plus-damage-taken' },
              },
              onFail: [],
              onSuccess: [
                { kind: 'note', text: 'Drops to 1 Hit Point instead.' },
              ],
            },
          ],
        }
      ],
      abilities: { str: 13, dex: 6, con: 16, int: 3, wis: 6, cha: 5 },
      proficiencyBonus: 2,
      immunities: ["poison", "exhaustion"],
    },
    lore: {
      alignment: "ne",
      challengeRating: 0.25,
      xpValue: 50,
      intelligence: "non",
    },
  },
  {
    id: 'young-black-dragon',
    name: 'Young Black Dragon',
    type: 'dragon',
    sizeCategory: 'large',
    languages: [{ id: 'common' }, { id: 'draconic' }],
    description: {
      short: 'A large black dragon wyrm — acid and malice in equal measure.',
      long: 'Young black dragons claim swamps and ruins, hoarding treasure and perfecting ambush with caustic breath.',
    },
    mechanics: {
      hitPoints: { count: 15, die: 10, modifier: 45 },
      armorClass: { kind: 'natural', offset: 6 },
      movement: { ground: 40, fly: 80, swim: 40 },
      abilities: { str: 19, dex: 14, con: 17, int: 12, wis: 11, cha: 15 },
      senses: {
        special: [
          { type: 'blindsight', range: 30 },
          { type: 'darkvision', range: 120 },
        ],
        passivePerception: 16,
      },
      proficiencies: {
        skills: { perception: { proficiencyLevel: 2 }, stealth: { proficiencyLevel: 1 } },
      },
      proficiencyBonus: 3,
      savingThrows: {
        dex: { proficiencyLevel: 1 },
        con: { proficiencyLevel: 1 },
        wis: { proficiencyLevel: 1 },
        cha: { proficiencyLevel: 1 },
      },
      immunities: ['acid'],
      traits: [
        {
          name: 'Amphibious',
          description: 'The dragon can breathe air and water.',
        },
      ],
      actions: [
        {
          kind: 'special',
          name: 'Multiattack',
          description: 'The dragon makes three Rend attacks.',
          sequence: [{ actionId: 'rend', count: 3 }],
        },
        {
          kind: 'natural',
          id: 'rend',
          name: 'Rend',
          attackType: 'claw',
          attackBonus: 7,
          reach: 10,
          damage: '2d4',
          damageBonus: 4,
          damageType: 'slashing',
          onHitEffects: [{ kind: 'damage', damage: '1d6', damageType: 'acid' }],
        },
        {
          kind: 'special',
          name: 'Acid Breath',
          description:
            'Dexterity Saving Throw: DC 14, each creature in a 30-foot-long, 5-foot-wide Line. Failure: 49 (14d6) Acid damage. Success: Half damage.',
          save: { ability: 'dex', dc: 14 },
          target: 'creatures-in-area',
          area: { kind: 'line', size: 30 },
          damage: '14d6',
          damageType: 'acid',
          halfDamageOnSave: true,
          recharge: { min: 5, max: 6 },
          resolution: {
            caveats: ['Line template may be simplified in encounter adapter.'],
          },
        },
      ],
    },
    lore: {
      alignment: 'ce',
      challengeRating: 7,
      xpValue: 2900,
      intelligence: 'average',
    },
  },
  {
    id: "young-red-dragon",
    name: "Young Red Dragon",
    type: "dragon",
    description: {
      short: "A fearsome young chromatic dragon wreathed in flame.",
      long: "Red dragons are the most covetous and arrogant of the chromatic dragons. Even in youth they are formidable predators, capable of unleashing devastating gouts of fire upon any who dare approach their growing hoards.",
    },
    mechanics: {
      hitPoints: {
        count: 17,
        die: 10,
        modifier: +85,
      },
      armorClass: {
        kind: 'natural',
        offset: 8,
      },
      movement: { ground: 40, climb: 40, fly: 80 },
      actions: [
        {
          kind: "special",
          name: "Multiattack",
          description: "The dragon makes three Rend attacks.",
          sequence: [
            {
              actionId: 'rend',
              count: 3
            }
          ]
        },
        {
          kind: "natural",
          id: 'rend',
          name: "Rend",
          attackType: "claw",
          attackBonus: 10,
          reach: 10,
          damage: "2d6",
          damageBonus: 6, // remove? accounted for in str bonus
          damageType: "slashing",
          onHitEffects: [
            {
              kind: "damage",
              damage: "1d6",
              damageType: "fire"
            }
          ]
        },
        {
          kind: "special",
          name: "Fire Breath",
          description: "Dexterity Saving Throw: DC 17, each creature in a 30-foot cone.",
          save: { ability: "dex", dc: 17 },
          damage: "16d6",
          damageType: "fire",
          halfDamageOnSave: true,
          area: { kind: "cone", size: 30 },
          target: "creatures-in-area",
          recharge: { min: 5, max: 6 }
        }
      ],
      senses: {
        special: [
          { type: "darkvision", range: 120 },
          { type: "blindsight", range: 30 }
        ],
        passivePerception: 18,
      },
      proficiencies: {
        skills: { 
          perception: { proficiencyLevel: 2 },
          stealth: { proficiencyLevel: 1 }
        }
      },
      proficiencyBonus: 4,
      abilities: { str: 23, dex: 10, con: 17, int: 12, wis: 11, cha: 15 },
      savingThrows: {
        dex: { proficiencyLevel: 1 },
        wis: { proficiencyLevel: 1 },
      },
      immunities: ["fire"],
    },
    lore: {
      alignment: "ce",
      challengeRating: 10,
      xpValue: 5900,
      intelligence: "average",
    },
  }
];
