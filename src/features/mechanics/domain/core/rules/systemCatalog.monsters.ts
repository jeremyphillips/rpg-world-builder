/**
 * System monster catalog — code-defined monster entries per system ruleset.
 *
 * These are the "factory defaults" for monsters. Campaign-owned custom monsters
 * are stored in the DB and merged at runtime by buildCampaignCatalog.
 */
import type { Monster, MonsterFields } from '@/features/content/monsters/domain/types';
import type { SystemRulesetId } from './ruleset.types';
import { DEFAULT_SYSTEM_RULESET_ID } from './systemIds';

/** Build a Monster from the system catalog data (no DB fields). */
function toSystemMonster(systemId: SystemRulesetId, raw: MonsterFields): Monster {
  return {
    ...raw,
    source: 'system',
    imageKey: null,
    accessPolicy: undefined,
    patched: false,
    systemId,
  };
}

const MONSTERS_RAW: readonly MonsterFields[] = [
  {
    id: "goblin-warrior",
    name: "Goblin Warrior",
    type: "humanoid",
    languages: [{ id: "common" }, { id: "goblin" }],
    sizeCategory: "small",
    description: {
      short: "Small, malicious humanoids that dwell in dark underground lairs.",
      long: "Goblins are small, black-hearted creatures that lair in despoiled dungeons and other dismal settings. Individually weak, they gather in large numbers to torment other creatures.",
    },
    mechanics: {
      hitPoints: {
        count: 3,
        die: 6,
      },
      armorClass: { kind: 'equipment', armorRefs: ["leather", "shield-wood"] },
      movement: { ground: 30 },
      abilities: { str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8 },
      actions: [
        { kind: 'weapon', weaponRef: "scimitar" },
        { kind: 'weapon', weaponRef: "shortbow" },
      ],
      bonusActions: [{
        kind: 'special',
        name: 'Nimble Escape',
        description: 'The goblin takes the Disengage or Hide action.',
        effects: [
          { kind: 'action', action: 'disengage' },
          { kind: 'action', action: 'hide' },
        ],
      }],
      senses: {
        special: [{ type: "darkvision", range: 60 }],
        passivePerception: 9,
      },
      proficiencies: {
        skills: { stealth: { proficiencyLevel: 2 } },
        weapons: {
          scimitar: { proficiencyLevel: 1 },
          shortbow: { proficiencyLevel: 1 },
        },
      },
      proficiencyBonus: 2,
      equipment: {
        weapons: {
          scimitar: { weaponId: "scimitar" },
          shortbow: { weaponId: "shortbow" },
        },
        armor: {
          leather: { armorId: "leather" },
          'shield-wood': { armorId: "shield-wood" },
        },
      },
    },
    lore: {
      alignment: "ne",
      challengeRating: 0.25,
      xpValue: 50,
      intelligence: "average",
    },
  },
  {
    id: "skeleton",
    name: "Skeleton",
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
    id: "gnoll-warrior",
    name: "Gnoll Warrior",
    type: "humanoid",
    languages: [{ id: "gnoll" }],
    sizeCategory: "medium",
    description: {
      short: "Hulking hyena-headed humanoids driven by an insatiable hunger.",
      long: "Gnolls are tall, lanky humanoids with hyena-like heads. They are savage raiders who worship the demon lord Yeenoghu and leave destruction in their wake.",
    },
    mechanics: {
      hitPoints: { count: 6, die: 8 },
      armorClass: { kind: 'equipment', armorRefs: ["hide", "shield-wood"] },
      movement: { ground: 30 },
      actions: [
        { kind: "natural", name: "Rend", attackType: "claw", attackBonus: 4, reach: 5, damage: "1d6", damageBonus: 2, damageType: "piercing" },
        { kind: "weapon", weaponRef: "bone-spear" },
      ],
      bonusActions: [{
        kind: "special",
        name: "Rampage",
        description: "Immediately after dealing damage to a creature that is already Bloodied, the gnoll moves up to half its Speed and makes one Rend attack.",
        uses: { count: 1, period: "day" },
        effects: [
          {
            kind: 'trigger',
            trigger: 'damage-dealt',
            condition: {
              kind: 'state',
              target: 'target',
              property: 'combat.bloodied',
              equals: true,
            },
            effects: [
              {
                kind: 'move',
                upToSpeedFraction: 0.5,
              },
              {
                kind: 'action',
                action: 'Rend',
              },
            ],
          },
        ],
      }],
      proficiencies: { weapons: { longbow: { proficiencyLevel: 1 } } },
      proficiencyBonus: 2,
      equipment: {
        weapons: { 'bone-bow': { weaponId: "longbow", aliasName: "Bone Bow", damageOverride: "1d10", notes: "Uses a monster-specific bow profile." } },
        armor: { hide: { armorId: "hide" }, 'shield-wood': { armorId: "shield-wood" } },
      },
      senses: { special: [{ type: "darkvision", range: 60 }], passivePerception: 10 },
      abilities: { str: 14, dex: 12, con: 11, int: 6, wis: 10, cha: 7 },
    },
    lore: { alignment: "ce", challengeRating: 0.5, xpValue: 100, intelligence: "low" },
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
    id: "kobold-warrior",
    name: "Kobold Warrior",
    type: "humanoid",
    languages: [{ id: "common" }, { id: "draconic" }],
    sizeCategory: "small",
    description: {
      short: "Diminutive, reptilian humanoids with a knack for traps and ambushes.",
      long: "Kobolds are craven reptilian humanoids that commonly infest dungeons. They are physically weak but make up for it with cunning traps, overwhelming numbers, and a fanatical devotion to dragons.",
    },
    mechanics: {
      hitPoints: {
        count: 3,
        die: 6,
        modifier: -3
      },
      armorClass: { kind: 'natural', base: 12, dexApplies: true },
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
        base: 11,
        dexApplies: true,
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
    id: "mummy",
    name: "Mummy",
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
        base: 12,
        dexApplies: true,
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
            { actionName: "Rotting Fist", count: 2 },
            { actionName: "Dreadful Glare", count: 1 },
          ],
        },
        {
          kind: "natural",
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
              // Engine caveat: death outcome is currently modeled as a descriptive rider, not a full outcome pipeline.
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
        base: 14,
        dexApplies: true,
      },
      movement: { ground: 30 },
      actions: [
        {
          kind: "special",
          name: "Multiattack",
          description: "The troll makes three Rend attacks.",
          sequence: [
            { actionName: "Rend", count: 3 }
          ]
        },
        {
          kind: "natural",
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
          trigger: {
            kind: 'turn-start',
          },
          effects: [
            { kind: 'hit-points', mode: 'heal', value: 15 },
          ],
          suppression: {
            ifTookDamageTypes: ['acid', 'fire'],
            duration: {
              kind: 'until-turn-boundary',
              subject: 'self',
              turn: 'next',
              boundary: 'end',
            },
          },
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
        base: 13,
        dexApplies: false,
      },
      movement: { ground: 40, climb: 40 },
      actions: [
        {
          kind: "special",
          name: "Multiattack",
          description: "The owlbear makes two Rend attacks.",
          sequence: [
            { actionName: "Rend", count: 2 }
          ]
        },
        {
          kind: "natural",
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
    id: "gelatinous-cube",
    name: "Gelatinous Cube",
    type: "ooze",
    sizeCategory: "large",
    languages: [],
    description: {
      short: "A nearly transparent ooze that fills dungeon corridors.",
      long: "The gelatinous cube is a transparent, ten-foot cube of gelatinous material that scours dungeon corridors clean of organic refuse. Treasures of past victims float suspended within its body.",
    },
    mechanics: {
      hitPoints: {
        count: 6,
        die: 10,
        modifier: +30,
      },
      armorClass: { kind: 'natural' },
      movement: { ground: 15 },
      actions: [
        { kind: 'natural', name: 'Pseudopod', attackType: "pseudopod", damage: "3d6", damageBonus: 2, damageType: "acid", attackBonus: 4, reach: 5 },
        {
          kind: 'special',
          name: 'Engulf',
          description:
            'The cube moves up to its Speed without provoking opportunity attacks and can enter the spaces of Large or smaller creatures if it has room to contain them.',
          target: 'creatures-entered-during-move',
          movement: {
            upToSpeed: true,
            noOpportunityAttacks: true,
            canEnterCreatureSpaces: true,
            targetSizeMax: 'large',
          },
          save: {
            ability: 'dex',
            dc: 12,
          },
          onFail: [
            { kind: 'damage', damage: '3d6', damageType: 'acid' },
            {
              kind: 'state',
              stateId: 'engulfed',
              targetSizeMax: 'large',
              escape: {
                dc: 12,
                ability: 'str',
                skill: 'athletics',
                actionRequired: true,
              },
              ongoingEffects: [
                { kind: 'condition', conditionId: 'restrained' },
                { kind: 'damage', damage: '3d6', damageType: 'acid' },
                { kind: 'note', text: 'Target is suffocating.' },
                { kind: 'note', text: 'Target cannot cast spells with verbal components.' },
                { kind: 'move', movesWithSource: true },
              ],
              notes: 'Target takes the acid damage at the start of the cube’s turns.',
            },
          ],
          onSuccess: [
            { kind: 'damage', damage: '3d6', damageType: 'acid' },
            {
              kind: 'move',
              forced: true,
              withinFeetOfSource: 5,
              toNearestUnoccupiedSpace: true,
              failIfNoSpace: true,
            },
          ],
          halfDamageOnSave: true,
        }
      ],
      abilities: { str: 14, dex: 3, con: 20, int: 1, wis: 6, cha: 1 },
      senses: {
        special: [{ type: "blindsight", range: 60 }],
        passivePerception: 8,
      },
      proficiencyBonus: 2,
      immunities: ["acid", "blinded", "charmed", "deafened", "exhaustion", "frightened", "prone"],
      traits: [
        {
          // Engine caveat: full movement + containment + action modifier semantics remain partial/log-first.
          name: 'Ooze Cube',
          description:
            'The cube fills its entire space and is transparent. Other creatures can enter that space, but a creature that does so is subjected to the cube’s Engulf and has Disadvantage on the saving throw. Creatures inside the cube have Total Cover, and the cube can hold one Large creature or up to four Medium or Small creatures inside itself at a time. As an action, a creature within 5 feet of the cube can pull a creature or an object out of the cube by succeeding on a DC 12 Strength (Athletics) check, and the puller takes 10 (3d6) Acid damage.',
          effects: [
            {
              kind: 'containment',
              fillsEntireSpace: true,
              canContainCreatures: true,
              creatureCover: 'total-cover',
              capacity: {
                large: 1,
                mediumOrSmall: 4,
              },
            },
            {
              kind: 'visibility-rule',
              transparent: true,
            },
            {
              kind: 'custom',
              id: 'monster.action_modifier',
              params: {
                actionName: 'Engulf',
                trigger: {
                  kind: 'enters_space',
                },
                saveModifier: 'disadvantage',
              },
            },
            {
              kind: 'check',
              name: 'Pull From Cube',
              actor: 'nearby-creature',
              distanceFeet: 5,
              actionRequired: true,
              target: 'creature-inside',
              check: {
                ability: 'str',
                skill: 'athletics',
                dc: 12,
              },
              onSuccess: [
                { kind: 'damage', damage: '3d6', damageType: 'acid' },
              ],
            },
            {
              kind: 'check',
              name: 'Pull Object From Cube',
              actor: 'nearby-creature',
              distanceFeet: 5,
              actionRequired: true,
              target: 'object-inside',
              check: {
                ability: 'str',
                skill: 'athletics',
                dc: 12,
              },
              onSuccess: [
                { kind: 'damage', damage: '3d6', damageType: 'acid' },
              ],
            },
          ],
        },
        {
          name: 'Transparent',
          description:
            'Even when the cube is in plain sight, a creature must succeed on a DC 15 Wisdom (Perception) check to notice the cube if it hasn’t witnessed the cube move or otherwise act.',
          effects: [
            {
              kind: 'visibility-rule',
              transparent: true,
              noticeCheck: {
                ability: 'wis',
                skill: 'perception',
                dc: 15,
                unlessWitnessedMoveOrAction: true,
              },
            },
          ],
        }
      ],
    },
    lore: {
      alignment: "unaligned",
      challengeRating: 2,
      xpValue: 450,
      intelligence: "non",
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
        base: 11,
        dexApplies: true,
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
        base: 18,
        dexApplies: true,
      },
      movement: { ground: 40, climb: 40, fly: 80 },
      actions: [
        {
          kind: "special",
          name: "Multiattack",
          description: "The dragon makes three Rend attacks.",
          sequence: [
            {
              actionName: "Rend",
              count: 3
            }
          ]
        },
        {
          kind: "natural",
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
  },
  {
    id: "hydra",
    name: "Hydra",
    type: "monstrosity",
    sizeCategory: "huge",
    languages: [],
    description: {
      short: "A many-headed reptilian horror that regrows heads when severed.",
      long: "Hydras are massive reptilian creatures with multiple heads. When a head is severed, the hydra can grow two more in its place—unless it has taken fire damage. It can hold its breath for an hour and gains extra reactions for opportunity attacks based on its number of heads.",
    },
    mechanics: {
      hitPoints: {
        count: 16,
        die: 12,
        modifier: 80,
      },
      armorClass: {
        kind: "natural",
        base: 14,
        dexApplies: true,
      },
      movement: { ground: 40, swim: 40 },
      abilities: { str: 20, dex: 12, con: 20, int: 2, wis: 10, cha: 7 },
      actions: [
        {
          kind: "special",
          name: "Multiattack",
          description: "The hydra makes as many Bite attacks as it has heads.",
          sequence: [{ actionName: "Bite", count: 5 }],
          notes: "Number of attacks equals current number of heads.",
        },
        {
          kind: "natural",
          name: "Bite",
          attackType: "bite",
          attackBonus: 8,
          reach: 10,
          damage: "1d10",
          damageBonus: 5,
          damageType: "piercing",
        },
      ],
      traits: [
        {
          name: "Hold Breath",
          description: "The hydra can hold its breath for 1 hour.",
          effects: [
            {
              kind: "hold-breath",
              duration: {
                kind: "fixed",
                value: 1,
                unit: "hour",
              },
            },
          ],
        },
        {
          name: "Multiple Heads",
          description:
            "The hydra has five heads. Whenever the hydra takes 25 damage or more on a single turn, one of its heads dies. The hydra dies if all its heads are dead. At the end of each of its turns when it has at least one living head, the hydra grows two heads for each of its heads that died since its last turn, unless it has taken Fire damage since its last turn. The hydra regains 20 Hit Points when it grows new heads.",
          effects: [
            {
              kind: "tracked-part",
              part: "head",
              initialCount: 5,
              loss: {
                trigger: "damage-taken-in-single-turn",
                minDamage: 25,
                count: 1,
              },
              deathWhenCountReaches: 0,
              regrowth: {
                trigger: "turn-end",
                requiresLivingPart: true,
                countPerPartLostSinceLastTurn: 2,
                suppressedByDamageTypes: ["fire"],
                healHitPoints: 20,
              },
            },
          ],
        },
        {
          name: "Reactive Heads",
          description:
            "For each head the hydra has beyond one, it gets an extra Reaction that can be used only for Opportunity Attacks.",
          effects: [
            {
              // Engine caveat: extra reaction pools are not fully enforced yet.
              kind: "extra-reaction",
              appliesTo: "opportunity-attacks-only",
              count: {
                kind: "per-part-beyond",
                part: "head",
                baseline: 1,
              },
            },
          ],
        },
      ],
      senses: {
        special: [{ type: "darkvision", range: 60 }],
        passivePerception: 16,
      },
      proficiencies: {
        skills: { perception: { proficiencyLevel: 2 } },
      },
      proficiencyBonus: 3,
      immunities: [
        "blinded",
        "charmed",
        "deafened",
        "frightened",
        "stunned",
        "unconscious",
      ],
    },
    lore: {
      alignment: "unaligned",
      challengeRating: 8,
      xpValue: 3900,
    },
  },
];

const SYSTEM_MONSTERS_SRD_CC_V5_2_1: readonly Monster[] = MONSTERS_RAW.map((m) =>
  toSystemMonster(DEFAULT_SYSTEM_RULESET_ID, m),
);

export const SYSTEM_MONSTERS_BY_SYSTEM_ID: Record<SystemRulesetId, readonly Monster[]> = {
  [DEFAULT_SYSTEM_RULESET_ID]: SYSTEM_MONSTERS_SRD_CC_V5_2_1,
};

export function getSystemMonsters(systemId: SystemRulesetId): readonly Monster[] {
  return SYSTEM_MONSTERS_BY_SYSTEM_ID[systemId] ?? [];
}

export function getSystemMonster(systemId: SystemRulesetId, monsterId: string): Monster | undefined {
  return getSystemMonsters(systemId).find((m) => m.id === monsterId);
}
