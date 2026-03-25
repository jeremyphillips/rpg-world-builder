import type { MonsterCatalogEntry } from '../types';

/** System catalog — ids starting with [m-o] (first character of `id`). */

export const MONSTERS_M_O: readonly MonsterCatalogEntry[] = [
  {
    id: 'magmin',
    name: 'Magmin',
    type: 'elemental',
    sizeCategory: 'small',
    languages: [{ id: 'primordial' }],
    description: {
      short: 'A capering elemental of magma that explodes when slain.',
      long: 'Magmins are minor fire elementals that caper through volcanic vents and forge halls, leaving scorch marks and dangerous bursts when destroyed.',
    },
    mechanics: {
      hitPoints: { count: 3, die: 6, modifier: 3 },
      armorClass: { kind: 'natural', offset: 2 },
      movement: { ground: 30 },
      abilities: { str: 7, dex: 15, con: 12, int: 8, wis: 11, cha: 10 },
      senses: {
        special: [{ type: 'darkvision', range: 60 }],
        passivePerception: 10,
      },
      proficiencyBonus: 2,
      immunities: ['fire'],
      traits: [
        {
          name: 'Death Burst',
          description:
            'The magmin explodes when it dies. Dexterity Saving Throw: DC 11, each creature in a 10-foot Emanation originating from the magmin. Failure: 7 (2d6) Fire damage. Success: Half damage.',
          trigger: { kind: 'reduced-to-0-hp' },
          effects: [
            {
              kind: 'note',
              text: 'Resolve 10-ft emanation Dex save DC 11 vs 2d6 fire (half on success) at table.',
              category: 'under-modeled',
            },
          ],
        },
      ],
      actions: [
        {
          kind: 'natural',
          name: 'Touch',
          attackType: 'touch',
          attackBonus: 4,
          reach: 5,
          damage: '2d4',
          damageBonus: 2,
          damageType: 'fire',
          notes:
            'If the target is a creature or a flammable object that isn’t being worn or carried, it starts burning.',
        },
      ],
    },
    lore: {
      alignment: 'cn',
      challengeRating: 0.5,
      xpValue: 100,
      intelligence: 'low',
    },
  },
  {
    id: 'merfolk-skirmisher',
    name: 'Merfolk Skirmisher',
    type: 'elemental',
    sizeCategory: 'medium',
    languages: [{ id: 'common' }, { id: 'primordial' }],
    description: {
      short: 'A swift coastal raider with a tide-touched spear.',
      long: 'Merfolk skirmishers strike from the surf with spears that carry the chill of the deep, harrying foes who underestimate the shallows.',
    },
    mechanics: {
      hitPoints: { count: 2, die: 8, modifier: 2 },
      armorClass: { kind: 'natural' },
      movement: { ground: 10, swim: 40 },
      abilities: { str: 10, dex: 13, con: 12, int: 11, wis: 14, cha: 12 },
      senses: { passivePerception: 12 },
      proficiencyBonus: 2,
      actions: [
        {
          kind: 'natural',
          name: 'Ocean Spear',
          attackType: 'slam',
          attackBonus: 2,
          reach: 5,
          damage: '1d6',
          damageType: 'piercing',
          notes: 'Melee or ranged 20/60 ft.; returning spear returns after a ranged attack.',
          onHitEffects: [
            { kind: 'damage', damage: '1d4', damageType: 'cold' },
            {
              kind: 'note',
              text: 'If the target is a creature, its Speed decreases by 10 feet until the end of its next turn.',
              category: 'under-modeled',
            },
          ],
        },
      ],
      traits: [
        {
          name: 'Amphibious',
          description: 'The merfolk can breathe air and water.',
        },
      ],
    },
    lore: {
      alignment: 'n',
      challengeRating: 0.125,
      xpValue: 25,
      intelligence: 'average',
    },
  },
{
    id: "orc",
    name: "Orc",
    type: "humanoid",
    languages: [{ id: "common" }, { id: "giant" }],
    sizeCategory: "medium",
    description: {
      short: "Brutish, aggressive humanoids that plague civilized lands.",
      long: "Orcs are aggressive humanoids that raid, pillage, and battle other creatures. They are driven by a hatred of the civilized races and a desire for conquest.",
    },
    mechanics: {
      hitPoints: {
        count: 2,
        die: 8,
        modifier: +6,
      },
      armorClass: { kind: 'equipment', armorRefs: ["hide"] },
      movement: { ground: 30 },
      actions: [
        { kind: "weapon", weaponRef: "greataxe" },
        { kind: "weapon", weaponRef: "javelin" },
      ],
      abilities: { str: 19, dex: 8, con: 16, int: 5, wis: 7, cha: 7 },
      senses: { 
        special: [{ type: "darkvision", range: 60 }],
        passivePerception: 8,
      },
      equipment: {
        weapons: {
          'greataxe': { weaponId: "greataxe", attackBonus: 3 },
          'javelin': { weaponId: "javelin", attackBonus: 3 },
        },
        armor: { hide: { armorId: "hide" } },
      },
      proficiencies: {
        weapons: {
          greataxe: { proficiencyLevel: 1 },
          javelin: { proficiencyLevel: 1 },
        },
        skills: { intimidation: { proficiencyLevel: 1 } },
      },
      proficiencyBonus: 2,
    },
    lore: {
      alignment: "ce",
      challengeRating: 0.5,
      xpValue: 100,
      intelligence: "average",
    },
  },
{
    id: "mummy",
    name: "Mummy",
    imageKey: '/assets/system/monsters/mummy.png',
    type: "undead",
    sizeCategory: "medium",
    languages: [{ id: "common" }],
    description: {
      short: "Desiccated corpses animated by dark ritual, spreading a withering curse.",
      long: "Mummies are undead created through dark funerary rites. Their touch carries a terrible curse that prevents healing and slowly drains the victim's life force. A dreadful glare can freeze even the bravest warrior in fear.",
    },
    mechanics: {
      hitPoints: {
        count: 9,
        die: 8,
        modifier: 18,
      },
      armorClass: {
        kind: "natural",
        offset: 2,
      },
      movement: { ground: 20 },
      abilities: { str: 16, dex: 8, con: 15, int: 6, wis: 12, cha: 12 },
      savingThrows: {
        wis: { proficiencyLevel: 1 },
      },
      actions: [
        {
          kind: "special",
          name: "Multiattack",
          description: "The mummy makes two Rotting Fist attacks and uses Dreadful Glare.",
          sequence: [
            { actionId: 'rotting-fist', count: 2 },
            { actionId: 'dreadful-glare', count: 1 },
          ],
        },
        {
          kind: "natural",
          id: 'rotting-fist',
          name: "Rotting Fist",
          attackType: "slam",
          attackBonus: 5,
          reach: 5,
          damage: "1d10",
          damageBonus: 3,
          damageType: "bludgeoning",
          onHitEffects: [
            {
              kind: "damage",
              damage: "3d6",
              damageType: "necrotic",
            },
            {
              kind: "state",
              stateId: "mummy-rot",
              classification: ["curse"],
              ongoingEffects: [
                {
                  kind: "note",
                  text: "Target can't regain Hit Points.",
                },
                {
                  kind: "note",
                  text:
                    "Target's Hit Point maximum doesn't return to normal when finishing a Long Rest.",
                },
              ],
            },
            {
              // Engine caveat: long-lived interval resolution is still log-first.
              kind: "interval",
              stateId: "mummy-rot",
              every: {
                value: 24,
                unit: "hour",
              },
              effects: [
                {
                  kind: "note",
                  text: "Target's Hit Point maximum decreases by 10 (3d6).",
                },
              ],
            },
            {
              kind: "death-outcome",
              trigger: "reduced-to-0-hit-points-by-this-action",
              targetType: "creature",
              outcome: "turns-to-dust",
            },
          ],
          notes:
            "If the target is a creature, it is cursed. While cursed, the target can't regain Hit Points, its Hit Point maximum doesn't return to normal when finishing a Long Rest, and its Hit Point maximum decreases by 10 (3d6) every 24 hours. A creature dies and turns to dust if reduced to 0 Hit Points by this attack.",
        },
        {
          kind: "special",
          id: 'dreadful-glare',
          name: "Dreadful Glare",
          description:
            "Wisdom Saving Throw: DC 11, one creature the mummy can see within 60 feet. Failure: The target has the Frightened condition until the end of the mummy's next turn. Success: The target is immune to this mummy's Dreadful Glare for 24 hours.",
          save: { ability: "wis", dc: 11 },
          onFail: [
            {
              kind: "condition",
              conditionId: "frightened",
              duration: {
                kind: "until-turn-boundary",
                subject: "source",
                turn: "next",
                boundary: "end",
              },
            },
          ],
          onSuccess: [
            {
              kind: "immunity",
              scope: "source-action",
              duration: {
                kind: "fixed",
                value: 24,
                unit: "hour",
              },
              notes: "Target is immune to this mummy's Dreadful Glare.",
            },
          ],
          effects: [
            {
              kind: "targeting",
              target: "one-creature",
              targetType: "creature",
              rangeFeet: 60,
              requiresSight: true,
            },
          ],
        },
      ],
      senses: {
        special: [{ type: "darkvision", range: 60 }],
        passivePerception: 11,
      },
      proficiencyBonus: 2,
      immunities: [
        "necrotic",
        "poison",
        "charmed",
        "exhaustion",
        "frightened",
        "paralyzed",
        "poisoned",
      ],
      vulnerabilities: ["fire"],
    },
    lore: {
      alignment: "le",
      challengeRating: 3,
      xpValue: 700,
    },
  },
{
    id: "ogre",
    name: "Ogre",
    type: "giant",
    sizeCategory: "large",
    languages: [{ id: "common" }, { id: "giant" }],
    description: {
      short: "Dim-witted, hulking giants that use brute strength to dominate.",
      long: "Ogres are large, ugly, and bad-tempered creatures that subsist through raiding and scavenging. They are often employed as mercenaries or enforcers by more cunning evil leaders.",
    },
    mechanics: {
      hitPoints: {
        count: 8,
        die: 10,
        modifier: +24,
      },
      armorClass: { kind: 'equipment', armorRefs: ["hide"] },
      movement: { ground: 40 },
      actions: [
        { kind: "weapon", weaponRef: "greatclub" },
        { kind: "weapon", weaponRef: "javelin" },
      ],
      abilities: { str: 19, dex: 8, con: 16, int: 5, wis: 7, cha: 7 },
      equipment: {
        weapons: {
          greatclub: { weaponId: "greatclub", damageOverride: "2d8" },
          javelin: { weaponId: "javelin", damageOverride: "2d6" },
        },
        armor: {
          hide: { armorId: "hide" },
        },
      },
      proficiencies: {
        weapons: {
          greatclub: { proficiencyLevel: 1 },
          javelin: { proficiencyLevel: 1 },
        },
      },
      proficiencyBonus: 2,
    },
    lore: {
      alignment: "ce",
      challengeRating: 2,
      xpValue: 450,
      intelligence: "low",
    },
  },
{
    id: "owlbear",
    name: "Owlbear",
    type: "monstrosity",
    sizeCategory: "large",
    languages: [],
    description: {
      short: "A monstrous cross between a giant owl and a bear.",
      long: "The owlbear is a ferocious predator with the body of a bear and the head of a giant owl. Its origin is commonly attributed to a wizard's experiment gone wrong.",
    },
    mechanics: {
      hitPoints: {
        count: 7,
        die: 10,
        modifier: +21,
      },
      armorClass: {
        kind: 'natural',
        offset: 2,
      },
      movement: { ground: 40, climb: 40 },
      actions: [
        {
          kind: "special",
          name: "Multiattack",
          description: "The owlbear makes two Rend attacks.",
          sequence: [
            { actionId: 'rend', count: 2 }
          ]
        },
        {
          kind: "natural",
          id: 'rend',
          name: "Rend",
          attackType: "claw",
          attackBonus: 7,
          reach: 5,
          damage: "2d8",
          damageBonus: 5, // remove? accounted for in str bonus
          damageType: "slashing"
        }
      ],
      proficiencies: {
        skills: { perception: { proficiencyLevel: 2 } },
      },
      proficiencyBonus: 2,
      senses: {
        special: [{ type: "darkvision", range: 60 }],
        passivePerception: 15,
      },
      abilities: { str: 20, dex: 12, con: 17, int: 3, wis: 12, cha: 7 },
    },
    lore: {
      alignment: "unaligned",
      challengeRating: 3,
      xpValue: 700,
      intelligence: "animal",
    },
  },
{
    id: "mimic",
    name: "Mimic",
    type: "monstrosity",
    languages: [],
    sizeCategory: "medium",
    description: {
      short: "A shapeshifting predator that disguises itself as mundane objects.",
      long: "Mimics are shapeshifting creatures that can alter their form to resemble ordinary dungeon objects such as treasure chests, doors, or furniture, using a powerful adhesive to trap unsuspecting prey.",
    },
    mechanics: {
      hitPoints: {
        count: 9,
        die: 8,
        modifier: +18,
      },
      armorClass: {
        kind: 'natural',
        offset: 1,
      },
      movement: { ground: 20 },
      actions: [
        {
          kind: "natural",
          name: "Bite",
          attackType: "bite",
          attackBonus: 5,
          reach: 5,
          damage: "1d8",
          damageBonus: 3,
          damageType: "piercing",
          onHitEffects: [
            {
              kind: "damage",
              damage: "1d8",
              damageType: "acid"
            }
          ]
        },
        {
          kind: "natural",
          name: "Pseudopod",
          attackType: "pseudopod",
          attackBonus: 5,
          reach: 5,
          damage: "1d8",
          damageBonus: 3,
          damageType: "bludgeoning",
          onHitEffects: [
            {
              kind: "damage",
              damage: "1d8",
              damageType: "acid"
            },
            {
              kind: "condition",
              conditionId: "grappled",
              targetSizeMax: "large",
              escapeDc: 13,
              escapeCheckDisadvantage: true
            }
          ]
        }
      ],
      bonusActions: [{
        kind: 'special',
        name: 'Shape Shift',
        description: 'The mimic transforms into a Small or Medium creature.',
        effects: [
          {
            kind: 'form',
            form: 'object',
            allowedSizes: ['small', 'medium'],
            canReturnToTrueForm: true,
            retainsStatistics: true,
            equipmentTransforms: false,
          }
        ],
        notes: 'The mimic retains its statistics and equipment.',
      }],
      traits: [{
        name: 'Adhesive',
        description:
          'The mimic adheres to anything that touches it while in object form.',
        trigger: [
          { kind: 'in-form', form: 'object' },
          { kind: 'contact' },
        ],
        effects: [
          {
            kind: 'condition',
            conditionId: 'grappled',
            targetSizeMax: 'huge',
            escapeDc: 13,
            escapeCheckDisadvantage: true,
          },
        ],
      }],
      abilities: { str: 17, dex: 12, con: 15, int: 5, wis: 13, cha: 8 },
      senses: {
        special: [{ type: "darkvision", range: 60 }],
        passivePerception: 11,
      },
      proficiencies: {
        skills: { stealth: { proficiencyLevel: 2 } },
      },
      proficiencyBonus: 2,
      immunities: ["acid", "prone"],
    },
    lore: {
      alignment: "n",
      challengeRating: 2,
      xpValue: 450,
      intelligence: "average",
    },
  }
];
