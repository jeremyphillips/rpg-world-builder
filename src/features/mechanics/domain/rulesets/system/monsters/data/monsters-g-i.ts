import type { MonsterCatalogEntry } from '../types';

/** System catalog — ids starting with [g-i] (first character of `id`). */

export const MONSTERS_G_I: readonly MonsterCatalogEntry[] = [
  {
    id: 'gargoyle',
    name: 'Gargoyle', 
    imageKey: '/assets/system/monsters/gargoyle.png',
    type: 'elemental',
    sizeCategory: 'medium',
    languages: [{ id: 'primordial' }],
    description: {
      short: 'Grotesque stone-winged predators that perch atop ruins and strike from above.',
      long: 'Gargoyles resemble animated stone statues with leathery wings. They lurk on battlements and desecrated shrines, dropping on prey with cruel claws.',
    },
    mechanics: {
      hitPoints: { count: 9, die: 8, modifier: 27 },
      armorClass: { kind: 'natural', offset: 5 },
      movement: { ground: 30, fly: 60 },
      abilities: { str: 15, dex: 11, con: 16, int: 6, wis: 11, cha: 7 },
      senses: {
        special: [{ type: 'darkvision', range: 60 }],
        passivePerception: 10,
      },
      proficiencies: {
        skills: { stealth: { proficiencyLevel: 2 } },
      },
      proficiencyBonus: 2,
      immunities: ['poison', 'exhaustion', 'petrified'],
      traits: [
        {
          name: 'Flyby',
          description:
            "The gargoyle doesn't provoke an Opportunity Attack when it flies out of an enemy's reach.",
          resolution: {
            caveats: ['Opportunity-attack exemption when leaving reach is not automated for monsters.'],
          },
        },
      ],
      actions: [
        {
          kind: 'special',
          name: 'Multiattack',
          description: 'The gargoyle makes two Claw attacks.',
          sequence: [{ actionId: 'claw', count: 2 }],
        },
        {
          kind: 'natural',
          id: 'claw',
          name: 'Claw',
          attackType: 'claw',
          attackBonus: 4,
          reach: 5,
          damage: '2d4',
          damageBonus: 2,
          damageType: 'slashing',
        },
      ],
    },
    lore: {
      alignment: 'ce',
      challengeRating: 2,
      xpValue: 450,
      intelligence: 'low',
    },
  },
{
    id: "gelatinous-cube",
    name: "Gelatinous Cube",
    imageKey: '/assets/system/monsters/gelatinous-cube.png',
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
    id: 'ghoul',
    name: 'Ghoul',
    imageKey: '/assets/system/monsters/ghoul.png',
    type: 'undead',
    sizeCategory: 'medium',
    languages: [{ id: 'common' }],
    description: {
      short: 'Undead horrors that devour flesh and spread paralysis with their claws.',
      long: 'Ghouls haunt graveyards and battlefields, driven by endless hunger for corpses and living flesh.',
    },
    mechanics: {
      resolution: {
        caveats: [
          'Claw paralysis does not exempt elves or Undead targets in encounter resolution; validate at table.',
        ],
      },
      hitPoints: { count: 5, die: 8 },
      armorClass: { kind: 'natural' },
      movement: { ground: 30 },
      abilities: { str: 13, dex: 15, con: 10, int: 7, wis: 10, cha: 6 },
      senses: {
        special: [{ type: 'darkvision', range: 60 }],
        passivePerception: 10,
      },
      proficiencyBonus: 2,
      immunities: ['poison', 'charmed', 'exhaustion'],
      actions: [
        {
          kind: 'special',
          name: 'Multiattack',
          description: 'The ghoul makes two Bite attacks.',
          sequence: [{ actionId: 'bite', count: 2 }],
        },
        {
          kind: 'natural',
          id: 'bite',
          name: 'Bite',
          attackType: 'bite',
          attackBonus: 4,
          reach: 5,
          damage: '1d6',
          damageBonus: 2,
          damageType: 'piercing',
          onHitEffects: [{ kind: 'damage', damage: '1d6', damageType: 'necrotic' }],
        },
        {
          kind: 'natural',
          name: 'Claw',
          attackType: 'claw',
          attackBonus: 4,
          reach: 5,
          damage: '1d4',
          damageBonus: 2,
          damageType: 'slashing',
          notes: 'Constitution save vs paralysis for non-elf, non-Undead targets (see resolution caveats).',
          onHitEffects: [
            {
              kind: 'save',
              save: { ability: 'con', dc: 10 },
              onFail: [
                {
                  kind: 'condition',
                  conditionId: 'paralyzed',
                  duration: {
                    kind: 'until-turn-boundary',
                    subject: 'target',
                    turn: 'next',
                    boundary: 'end',
                  },
                },
              ],
            },
          ],
        },
      ],
    },
    lore: {
      alignment: 'ce',
      challengeRating: 1,
      xpValue: 200,
      intelligence: 'low',
    },
  },
  {
    id: 'giant-centipede',
    name: 'Giant Centipede',
    imageKey: '/assets/system/monsters/giant-centipede.png',
    type: 'beast',
    sizeCategory: 'small',
    languages: [],
    description: {
      short: 'A venomous many-legged predator.',
      long: 'Giant centipedes skitter through undergrowth and dungeon cracks, delivering debilitating poison.',
    },
    mechanics: {
      hitPoints: { count: 2, die: 6, modifier: 2 },
      armorClass: { kind: 'natural', offset: 2 },
      movement: { ground: 30, climb: 30 },
      abilities: { str: 5, dex: 14, con: 12, int: 1, wis: 7, cha: 3 },
      senses: {
        special: [{ type: 'blindsight', range: 30 }],
        passivePerception: 8,
      },
      proficiencyBonus: 2,
      actions: [
        {
          kind: 'natural',
          name: 'Bite',
          attackType: 'bite',
          attackBonus: 4,
          reach: 5,
          damage: '1d4',
          damageBonus: 2,
          damageType: 'piercing',
          onHitEffects: [
            {
              kind: 'save',
              save: { ability: 'con', dc: 11 },
              onFail: [
                {
                  kind: 'condition',
                  conditionId: 'poisoned',
                  duration: {
                    kind: 'until-turn-boundary',
                    subject: 'target',
                    turn: 'next',
                    boundary: 'start',
                  },
                },
              ],
            },
          ],
        },
      ],
    },
    lore: {
      alignment: 'n',
      challengeRating: 0.25,
      xpValue: 50,
      intelligence: 'non',
    },
  },
  {
    id: 'giant-spider',
    name: 'Giant Spider',
    imageKey: '/assets/system/monsters/giant-spider.png',
    type: 'beast',
    sizeCategory: 'large',
    languages: [],
    description: {
      short: 'A horse-sized hunting spider.',
      long: 'Giant spiders weave deadly webs and ambush prey in forests and ruins.',
    },
    mechanics: {
      hitPoints: { count: 4, die: 10, modifier: 4 },
      armorClass: { kind: 'natural', offset: 1 },
      movement: { ground: 30, climb: 30 },
      abilities: { str: 14, dex: 16, con: 12, int: 2, wis: 11, cha: 4 },
      senses: {
        special: [{ type: 'darkvision', range: 60 }],
        passivePerception: 14,
      },
      proficiencies: {
        skills: { perception: { proficiencyLevel: 2 }, stealth: { proficiencyLevel: 2 } },
      },
      proficiencyBonus: 2,
      traits: [
        {
          name: 'Spider Climb',
          description:
            'The spider can climb difficult surfaces, including along ceilings, without needing to make an ability check.',
        },
        {
          name: 'Web Walker',
          description:
            'The spider ignores movement restrictions caused by webs, and it knows the location of any other creature in contact with the same web.',
        },
      ],
      actions: [
        {
          kind: 'natural',
          name: 'Bite',
          attackType: 'bite',
          attackBonus: 5,
          reach: 5,
          damage: '1d8',
          damageBonus: 3,
          damageType: 'piercing',
          onHitEffects: [{ kind: 'damage', damage: '2d6', damageType: 'poison' }],
        },
        {
          kind: 'special',
          name: 'Web',
          description:
            'Dexterity Saving Throw: DC 13, one creature the spider can see within 60 feet. Failure: The target has the Restrained condition until the web is destroyed (AC 10; HP 5; Vulnerability to Fire damage; Immunity to Poison and Psychic damage).',
          save: { ability: 'dex', dc: 13 },
          recharge: { min: 5, max: 6 },
          onFail: [{ kind: 'condition', conditionId: 'restrained' }],
          resolution: {
            caveats: ['Web object AC/HP/destruction and ranged targeting limits are not fully modeled in encounter combat.'],
          },
        },
      ],
    },
    lore: {
      alignment: 'n',
      challengeRating: 1,
      xpValue: 200,
      intelligence: 'animal',
    },
  },
  {
    id: 'giant-wasp',
    name: 'Giant Wasp',
    imageKey: '/assets/system/monsters/giant-wasp.png',
    type: 'beast',
    sizeCategory: 'medium',
    languages: [],
    description: {
      short: 'An oversized stinging insect.',
      long: 'Giant wasps are aggressive aerial predators.',
    },
    mechanics: {
      hitPoints: { count: 5, die: 8 },
      armorClass: { kind: 'natural', offset: 1 },
      movement: { ground: 10, fly: 50 },
      abilities: { str: 10, dex: 14, con: 10, int: 1, wis: 10, cha: 3 },
      senses: { passivePerception: 10 },
      proficiencyBonus: 2,
      traits: [
        {
          name: 'Flyby',
          description:
            "The wasp doesn't provoke an Opportunity Attack when it flies out of an enemy's reach.",
          resolution: {
            caveats: ['Opportunity-attack exemption when leaving reach is not automated for monsters.'],
          },
        },
      ],
      actions: [
        {
          kind: 'natural',
          name: 'Sting',
          attackType: 'bite',
          attackBonus: 4,
          reach: 5,
          damage: '1d6',
          damageBonus: 2,
          damageType: 'piercing',
          onHitEffects: [{ kind: 'damage', damage: '2d4', damageType: 'poison' }],
        },
      ],
    },
    lore: {
      alignment: 'n',
      challengeRating: 0.5,
      xpValue: 100,
      intelligence: 'non',
    },
  },
  {
    id: 'goblin-boss',
    name: 'Goblin Boss',
    imageKey: '/assets/system/monsters/goblin-boss.png',
    type: 'fey',
    subtype: 'goblinoid',
    sizeCategory: 'small',
    languages: [{ id: 'common' }, { id: 'goblin' }],
    description: {
      short: 'A tougher goblin leader in chain mail, directing allies and slipping away with tricks.',
      long: 'Goblin bosses wear better armor and coordinate their warbands. Some learn to throw lesser kin into harm’s way when blades come too close.',
    },
    mechanics: {
      hitPoints: { count: 6, die: 6 },
      armorClass: { kind: 'equipment', armorRefs: ['chain-shirt', 'shield-wood'] },
      movement: { ground: 30 },
      abilities: { str: 10, dex: 15, con: 10, int: 10, wis: 8, cha: 10 },
      senses: {
        special: [{ type: 'darkvision', range: 60 }],
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
      traits: [
        {
          name: 'Redirect Attack',
          description:
            'Trigger: A creature the goblin can see makes an attack roll against it. Response: The goblin chooses a Small or Medium ally within 5 feet of itself. The goblin and that ally swap places, and the ally becomes the target of the attack instead.',
          resolution: {
            caveats: [
              'Reaction, swap positions, and retargeting the attack are not enforced in encounter resolution; resolve at table.',
            ],
          },
        },
      ],
      actions: [
        {
          kind: 'special',
          name: 'Multiattack',
          description:
            'The goblin makes two attacks, using Scimitar or Shortbow in any combination.',
          sequence: [{ actionId: 'scimitar', count: 2 }],
          notes: 'Each attack may use Shortbow instead.',
        },
        { kind: 'weapon', weaponRef: 'scimitar' },
        { kind: 'weapon', weaponRef: 'shortbow' },
      ],
      bonusActions: [
        {
          kind: 'special',
          name: 'Nimble Escape',
          description: 'The goblin takes the Disengage or Hide action.',
          effects: [
            { kind: 'action', action: 'disengage' },
            { kind: 'action', action: 'hide' },
          ],
        },
      ],
      equipment: {
        weapons: {
          scimitar: {
            weaponId: 'scimitar',
            attackBonus: 4,
            damageBonus: 2,
            notes: '+ 2 (1d4) Slashing damage if the attack roll had Advantage.',
          },
          shortbow: {
            weaponId: 'shortbow',
            attackBonus: 4,
            damageBonus: 2,
            notes: '+ 2 (1d4) Piercing damage if the attack roll had Advantage.',
          },
        },
        armor: {
          'chain-shirt': { armorId: 'chain-shirt' },
          'shield-wood': { armorId: 'shield-wood' },
        },
      },
    },
    lore: {
      alignment: 'cn',
      challengeRating: 1,
      xpValue: 200,
      intelligence: 'average',
    },
  },
  {
    id: 'goblin-minion',
    name: 'Goblin Minion',
    type: 'fey',
    subtype: 'goblinoid',
    sizeCategory: 'small',
    languages: [{ id: 'common' }, { id: 'goblin' }],
    description: {
      short: 'A scrappy goblin skirmisher.',
      long: 'Goblin minions rely on numbers, stealth, and hit-and-run tactics.',
    },
    mechanics: {
      hitPoints: { count: 2, die: 6 },
      armorClass: { kind: 'natural' },
      movement: { ground: 30 },
      abilities: { str: 8, dex: 15, con: 10, int: 10, wis: 8, cha: 8 },
      senses: {
        special: [{ type: 'darkvision', range: 60 }],
        passivePerception: 9,
      },
      proficiencies: {
        skills: { stealth: { proficiencyLevel: 2 } },
        weapons: { dagger: { proficiencyLevel: 1 } },
      },
      proficiencyBonus: 2,
      actions: [{ kind: 'weapon', weaponRef: 'dagger' }],
      bonusActions: [
        {
          kind: 'special',
          name: 'Nimble Escape',
          description: 'The goblin takes the Disengage or Hide action.',
          effects: [
            { kind: 'action', action: 'disengage' },
            { kind: 'action', action: 'hide' },
          ],
        },
      ],
      equipment: {
        weapons: {
          dagger: {
            weaponId: 'dagger',
            attackBonus: 4,
            notes: 'Gear includes three daggers; one attack profile for melee or thrown.',
          },
        },
      },
    },
    lore: {
      alignment: 'cn',
      challengeRating: 0.125,
      xpValue: 25,
      intelligence: 'average',
    },
  },
{
    id: "goblin-warrior",
    name: "Goblin Warrior",
    imageKey: '/assets/system/monsters/goblin-warrior.png',
    type: "fey",
    subtype: "goblinoid",
    languages: [{ id: "common" }, { id: "goblin" }],
    sizeCategory: "small",
    description: {
      short: "Small, malicious feys that dwell in dark underground lairs.",
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
    id: "gnoll-warrior",
    name: "Gnoll Warrior",
    imageKey: '/assets/system/monsters/gnoll-warrior.png',
    type: "fiend",
    languages: [{ id: "gnoll" }],
    sizeCategory: "medium",
    description: {
      short: "Hulking hyena-headed fiends driven by an insatiable hunger.",
      long: "Gnolls are tall, lanky fiends with hyena-like heads. They are savage raiders who worship the demon lord Yeenoghu and leave destruction in their wake.",
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
    id: 'hobgoblin-captain',
    name: 'Hobgoblin Captain',
    type: 'fey',
    subtype: 'goblinoid',
    sizeCategory: 'medium',
    languages: [{ id: 'common' }, { id: 'goblin' }],
    description: {
      short: 'Disciplined hobgoblin officers whose mere presence steels allies.',
      long: 'Hobgoblin captains wear half plate and lead from the front, greatsword in hand, while their aura of authority rallies lesser troops.',
    },
    mechanics: {
      hitPoints: { count: 9, die: 8, modifier: 18 },
      armorClass: { kind: 'equipment', armorRefs: ['half-plate'] },
      movement: { ground: 30 },
      abilities: { str: 15, dex: 14, con: 14, int: 12, wis: 10, cha: 13 },
      senses: {
        special: [{ type: 'darkvision', range: 60 }],
        passivePerception: 10,
      },
      proficiencies: {
        weapons: {
          greatsword: { proficiencyLevel: 1 },
          longbow: { proficiencyLevel: 1 },
        },
      },
      proficiencyBonus: 2,
      traits: [
        {
          name: 'Aura of Authority',
          description:
            'While in a 10-foot Emanation originating from the hobgoblin, the hobgoblin and its allies have Advantage on attack rolls and saving throws, provided the hobgoblin doesn’t have the Incapacitated condition.',
          effects: [
            {
              kind: 'emanation',
              attachedTo: 'self',
              area: { kind: 'sphere', size: 10 },
            },
            {
              kind: 'note',
              text: 'Advantage on attack rolls and saving throws for the hobgoblin and its allies in the emanation, if the hobgoblin is not Incapacitated. Ally detection and Incapacitated gate are not automated.',
              category: 'under-modeled',
            },
          ],
          resolution: {
            caveats: [
              'Advantage on attacks and saves for allies is not rolled automatically; emanation footprint is for positioning only.',
            ],
          },
        },
      ],
      actions: [
        {
          kind: 'special',
          name: 'Multiattack',
          description:
            'The hobgoblin makes two attacks, using Greatsword or Longbow in any combination.',
          sequence: [{ actionId: 'greatsword', count: 2 }],
          notes: 'Each attack may use Longbow instead.',
        },
        { kind: 'weapon', weaponRef: 'greatsword' },
        { kind: 'weapon', weaponRef: 'longbow' },
      ],
      equipment: {
        weapons: {
          greatsword: {
            weaponId: 'greatsword',
            attackBonus: 4,
            damageBonus: 2,
            notes: '+ 3 (1d6) Poison damage on hit.',
          },
          longbow: {
            weaponId: 'longbow',
            attackBonus: 4,
            damageBonus: 2,
            notes: '+ 5 (2d4) Poison damage on hit.',
          },
        },
        armor: {
          'half-plate': { armorId: 'half-plate' },
        },
      },
    },
    lore: {
      alignment: 'le',
      challengeRating: 3,
      xpValue: 700,
      intelligence: 'average',
    },
  },
  {
    id: 'hobgoblin-warrior',
    name: 'Hobgoblin Warrior',
    type: 'fey',
    subtype: 'goblinoid',
    sizeCategory: 'medium',
    languages: [{ id: 'common' }, { id: 'goblin' }],
    description: {
      short: 'Armored hobgoblin soldiers with poisoned arrows and martial discipline.',
      long: 'Hobgoblin warriors fight in formation, favoring half plate, shield, and longsword while supporting allies with envenomed longbow shots.',
    },
    mechanics: {
      hitPoints: { count: 2, die: 8, modifier: 2 },
      armorClass: { kind: 'equipment', armorRefs: ['half-plate', 'shield-wood'] },
      movement: { ground: 30 },
      abilities: { str: 13, dex: 12, con: 12, int: 10, wis: 10, cha: 9 },
      senses: {
        special: [{ type: 'darkvision', range: 60 }],
        passivePerception: 10,
      },
      proficiencies: {
        weapons: {
          longsword: { proficiencyLevel: 1 },
          longbow: { proficiencyLevel: 1 },
        },
      },
      proficiencyBonus: 2,
      traits: [
        {
          name: 'Pack Tactics',
          description:
            'The hobgoblin has Advantage on an attack roll against a creature if at least one of the hobgoblin’s allies is within 5 feet of the creature and the ally doesn’t have the Incapacitated condition.',
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
      ],
      actions: [
        { kind: 'weapon', weaponRef: 'longsword' },
        { kind: 'weapon', weaponRef: 'longbow' },
      ],
      equipment: {
        weapons: {
          longsword: {
            weaponId: 'longsword',
            attackBonus: 3,
            damageOverride: '2d10',
            damageBonus: 1,
            notes: 'Two-handed profile (2d10 + 1).',
          },
          longbow: {
            weaponId: 'longbow',
            attackBonus: 3,
            damageBonus: 1,
            notes: 'On hit: + 7 (3d4) Poison damage.',
          },
        },
        armor: {
          'half-plate': { armorId: 'half-plate' },
          'shield-wood': { armorId: 'shield-wood' },
        },
      },
    },
    lore: {
      alignment: 'le',
      challengeRating: 0.5,
      xpValue: 100,
      intelligence: 'average',
    },
  },
{
    id: "hydra",
    name: "Hydra",
    imageKey: '/assets/system/monsters/hydra.png',
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
        offset: 4,
      },
      movement: { ground: 40, swim: 40 },
      abilities: { str: 20, dex: 12, con: 20, int: 2, wis: 10, cha: 7 },
      actions: [
        {
          kind: "special",
          name: "Multiattack",
          description: "The hydra makes as many Bite attacks as it has heads.",
          sequence: [{ actionId: 'bite', count: 5 }],
          notes: "Number of attacks equals current number of heads.",
        },
        {
          kind: "natural",
          id: 'bite',
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
  }
];
