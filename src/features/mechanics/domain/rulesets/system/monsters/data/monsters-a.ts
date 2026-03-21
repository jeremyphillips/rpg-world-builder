import type { MonsterCatalogEntry } from '../types';

/** System catalog — ids whose `id` starts with `a`. */

export const MONSTERS_A: readonly MonsterCatalogEntry[] = [
  {
    id: 'aboleth',
    name: 'Aboleth',
    type: 'aberration',
    sizeCategory: 'large',
    languages: [{ id: 'common' }],
    description: {
      short: 'Ancient psionic horrors of the deep that enslave minds and remember every slight.',
      long: 'Aboleths are primeval aberrations of the deep sea and alien minds. They are scheming telepaths that curse foes with slime and dominate the will of lesser creatures.',
    },
    mechanics: {
      hitPoints: { count: 20, die: 10, modifier: 40 },
      armorClass: { kind: 'natural', offset: 8 },
      movement: { ground: 10, swim: 40 },
      abilities: { str: 21, dex: 9, con: 15, int: 18, wis: 15, cha: 18 },
      savingThrows: {
        dex: { proficiencyLevel: 1 },
        con: { proficiencyLevel: 1 },
        int: { proficiencyLevel: 1 },
        wis: { proficiencyLevel: 1 },
      },
      proficiencies: {
        skills: { history: { proficiencyLevel: 2 }, perception: { proficiencyLevel: 2 } },
      },
      senses: {
        special: [{ type: 'darkvision', range: 120 }],
        passivePerception: 20,
      },
      proficiencyBonus: 4,
      resolution: {
        caveats: [
          'Deep Speech and telepathy 120 ft. are not separate language ids; lair XP 7,200 vs wandering 5,900 is noted in lore only.',
        ],
      },
      traits: [
        {
          name: 'Amphibious',
          description: 'The aboleth can breathe air and water.',
        },
        {
          name: 'Eldritch Restoration',
          description:
            'If destroyed, the aboleth gains a new body in 5d10 days, reviving with all its Hit Points in the Far Realm or another location chosen by the GM.',
          resolution: {
            caveats: ['Revival timing and location are not enforced in encounter.'],
          },
        },
        {
          name: 'Legendary Resistance',
          description:
            'Legendary Resistance (3/Day, or 4/Day in Lair). If the aboleth fails a saving throw, it can choose to succeed instead.',
        },
        {
          name: 'Mucus Cloud',
          description:
            'While underwater, the aboleth is surrounded by mucus. Constitution Saving Throw: DC 14, each creature in a 5-foot Emanation originating from the aboleth at the end of the aboleth’s turn. Failure: The target is cursed. Until the curse ends, the target’s skin becomes slimy, the target can breathe air and water, and it can’t regain Hit Points unless it is underwater. While the cursed creature is outside a body of water, the creature takes 6 (1d12) Acid damage at the end of every 10 minutes unless moisture is applied to its skin before those minutes have passed.',
          effects: [
            {
              kind: 'note',
              text: 'End-of-turn aura, curse, and out-of-water acid ticks are not auto-resolved.',
              category: 'under-modeled',
            },
          ],
        },
        {
          name: 'Probing Telepathy',
          description:
            'If a creature the aboleth can see communicates telepathically with the aboleth, the aboleth learns the creature’s greatest desires.',
        },
        {
          name: 'Legendary Actions',
          description:
            'Legendary Action Uses: 3 (4 in Lair). Immediately after another creature’s turn, the aboleth can expend a use to take one of the following actions. The aboleth regains all expended uses at the start of each of its turns. Lash: The aboleth makes one Tentacle attack. Psychic Drain: If the aboleth has at least one creature Charmed or Grappled, it uses Consume Memories and regains 5 (1d10) Hit Points.',
          resolution: {
            caveats: ['Legendary action economy and Psychic Drain healing are not automated.'],
          },
        },
      ],
      actions: [
        {
          kind: 'special',
          name: 'Multiattack',
          description:
            'The aboleth makes two Tentacle attacks and uses either Consume Memories or Dominate Mind if available.',
          sequence: [{ actionName: 'Tentacle', count: 2 }],
          notes: 'May also resolve Consume Memories or Dominate Mind when available.',
        },
        {
          kind: 'natural',
          name: 'Tentacle',
          attackType: 'pseudopod',
          attackBonus: 9,
          reach: 15,
          damage: '2d6',
          damageBonus: 5,
          damageType: 'bludgeoning',
          notes:
            'If the target is a Large or smaller creature, it has the Grappled condition (escape DC 14) from one of four tentacles.',
        },
        {
          kind: 'special',
          name: 'Consume Memories',
          description:
            'Intelligence Saving Throw: DC 16, one creature within 30 feet that is Charmed or Grappled by the aboleth. Failure: 10 (3d6) Psychic damage. Success: Half damage. Failure or Success: The aboleth gains the target’s memories if the target is a Humanoid and is reduced to 0 Hit Points by this action.',
          save: { ability: 'int', dc: 16 },
          damage: '3d6',
          damageType: 'psychic',
          halfDamageOnSave: true,
          resolution: {
            caveats: ['Memory theft on 0 HP requires Humanoid; not enforced.'],
          },
        },
        {
          kind: 'special',
          name: 'Dominate Mind',
          description:
            'Wisdom Saving Throw: DC 16, one creature the aboleth can see within 30 feet. Failure: The target has the Charmed condition until the aboleth dies or is on a different plane of existence from the target. While Charmed, the target acts as an ally to the aboleth and is under its control while within 60 feet of it. In addition, the aboleth and the target can communicate telepathically with each other over any distance. The target repeats the save whenever it takes damage as well as after every 24 hours it spends at least 1 mile away from the aboleth, ending the effect on itself on a success.',
          save: { ability: 'wis', dc: 16 },
          uses: { count: 2, period: 'day' },
          resolution: {
            caveats: ['Long-term charm, plane checks, and repeat saves are not automated.'],
          },
        },
      ],
    },
    lore: {
      alignment: 'le',
      challengeRating: 10,
      xpValue: 5900,
      intelligence: 'high',
    },
  },
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
    id: 'animated-armor',
    name: 'Animated Armor',
    type: 'construct',
    sizeCategory: 'medium',
    languages: [],
    description: {
      short: 'A hollow suit of armor given motive force—an animated object that guards without tiring.',
      long: 'Animated armor is a classic animated object: an empty suit of plate or mail that strikes intruders with tireless, mindless obedience to its creator’s will.',
    },
    mechanics: {
      hitPoints: { count: 6, die: 8, modifier: 6 },
      armorClass: { kind: 'natural', offset: 8 },
      movement: { ground: 25 },
      abilities: { str: 14, dex: 11, con: 13, int: 1, wis: 3, cha: 1 },
      senses: {
        special: [{ type: 'blindsight', range: 60 }],
        passivePerception: 6,
      },
      proficiencyBonus: 2,
      immunities: [
        'poison',
        'psychic',
        'charmed',
        'deafened',
        'exhaustion',
        'frightened',
        'paralyzed',
        'petrified',
        'poisoned',
      ],
      actions: [
        {
          kind: 'special',
          name: 'Multiattack',
          description: 'The armor makes two Slam attacks.',
          sequence: [{ actionName: 'Slam', count: 2 }],
        },
        {
          kind: 'natural',
          name: 'Slam',
          attackType: 'slam',
          attackBonus: 4,
          reach: 5,
          damage: '1d6',
          damageBonus: 2,
          damageType: 'bludgeoning',
        },
      ],
    },
    lore: {
      alignment: 'n',
      challengeRating: 1,
      xpValue: 200,
      intelligence: 'non',
    },
  },
  {
    id: 'animated-flying-sword',
    name: 'Animated Flying Sword',
    type: 'construct',
    sizeCategory: 'small',
    languages: [],
    description: {
      short: 'A levitating blade that darts through the air—an animated object driven by magic.',
      long: 'This animated object is a flying sword: a blade that hovers and slashes without a wielder, often set as a guardian in tombs and vaults.',
    },
    mechanics: {
      hitPoints: { count: 4, die: 6 },
      armorClass: { kind: 'natural', offset: 5 },
      movement: { ground: 5, fly: 50 },
      abilities: { str: 12, dex: 15, con: 11, int: 1, wis: 5, cha: 1 },
      senses: {
        special: [{ type: 'blindsight', range: 60 }],
        passivePerception: 7,
      },
      proficiencyBonus: 2,
      immunities: [
        'poison',
        'psychic',
        'charmed',
        'deafened',
        'exhaustion',
        'frightened',
        'paralyzed',
        'petrified',
        'poisoned',
      ],
      actions: [
        {
          kind: 'natural',
          name: 'Slash',
          attackType: 'claw',
          attackBonus: 4,
          reach: 5,
          damage: '1d8',
          damageBonus: 2,
          damageType: 'slashing',
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
    id: 'animated-rug-of-smothering',
    name: 'Animated Rug of Smothering',
    type: 'construct',
    sizeCategory: 'large',
    languages: [],
    description: {
      short: 'A deadly carpet that grapples and suffocates—an animated object that mimics harmless décor.',
      long: 'This animated object is a rug of smothering: a large carpet that wraps victims in suffocating folds, sharing damage while it grapples.',
    },
    mechanics: {
      hitPoints: { count: 5, die: 10 },
      armorClass: { kind: 'natural' },
      movement: { ground: 10 },
      abilities: { str: 17, dex: 14, con: 10, int: 1, wis: 3, cha: 1 },
      senses: {
        special: [{ type: 'blindsight', range: 60 }],
        passivePerception: 6,
      },
      proficiencyBonus: 2,
      immunities: [
        'poison',
        'psychic',
        'charmed',
        'deafened',
        'exhaustion',
        'frightened',
        'paralyzed',
        'petrified',
        'poisoned',
      ],
      actions: [
        {
          kind: 'natural',
          name: 'Smother',
          attackType: 'slam',
          attackBonus: 5,
          reach: 5,
          damage: '2d6',
          damageBonus: 3,
          damageType: 'bludgeoning',
          notes:
            'If the target is a Medium or smaller creature, the rug can give it the Grappled condition (escape DC 13) instead of dealing damage. Until the grapple ends, the target has the Blinded and Restrained conditions, is suffocating, and takes 10 (2d6 + 3) Bludgeoning damage at the start of each of its turns. The rug can smother only one creature at a time. While grappling the target, the rug can’t take this action, the rug halves the damage it takes (round down), and the target takes the same amount of damage. (Damage splitting, suffocation, and grapple choice are not fully modeled in encounter.)',
        },
      ],
    },
    lore: {
      alignment: 'n',
      challengeRating: 2,
      xpValue: 450,
      intelligence: 'non',
    },
  },
  {
    id: 'ankheg',
    name: 'Ankheg',
    type: 'monstrosity',
    sizeCategory: 'large',
    languages: [],
    description: {
      short: 'Burrowing insect horrors that spit acid and drag prey underground.',
      long: 'Ankhegs are large burrowing predators of grasslands and badlands. They tunnel through earth and stone, erupting to seize prey with crushing mandibles.',
    },
    mechanics: {
      hitPoints: { count: 6, die: 10, modifier: 12 },
      armorClass: { kind: 'natural', offset: 3 },
      movement: { ground: 30, burrow: 10 },
      abilities: { str: 17, dex: 11, con: 14, int: 1, wis: 13, cha: 6 },
      senses: {
        special: [
          { type: 'darkvision', range: 60 },
          { type: 'tremorsense', range: 60 },
        ],
        passivePerception: 11,
      },
      proficiencyBonus: 2,
      traits: [
        {
          name: 'Tunneler',
          description:
            'The ankheg can burrow through solid rock at half its Burrow Speed and leaves a 10-foot-diameter tunnel in its wake.',
        },
      ],
      actions: [
        {
          kind: 'natural',
          name: 'Bite',
          attackType: 'bite',
          attackBonus: 5,
          reach: 5,
          damage: '2d6',
          damageBonus: 3,
          damageType: 'slashing',
          onHitEffects: [{ kind: 'damage', damage: '1d6', damageType: 'acid' }],
          notes:
            'Melee Attack Roll: +5 (with Advantage if the target is Grappled by the ankheg). If the target is a Large or smaller creature, it has the Grappled condition (escape DC 13).',
        },
        {
          kind: 'special',
          name: 'Acid Spray',
          description:
            'Dexterity Saving Throw: DC 12, each creature in a 30-foot-long, 5-foot-wide Line. Failure: 14 (4d6) Acid damage. Success: Half damage.',
          save: { ability: 'dex', dc: 12 },
          damage: '4d6',
          damageType: 'acid',
          halfDamageOnSave: true,
          recharge: { min: 6, max: 6 },
          resolution: {
            caveats: ['Line shape and multi-target saves are not auto-resolved.'],
          },
        },
      ],
    },
    lore: {
      alignment: 'n',
      challengeRating: 2,
      xpValue: 450,
      intelligence: 'animal',
    },
  },
  {
    id: 'assassin',
    name: 'Assassin',
    type: 'humanoid',
    sizeCategory: 'medium',
    languages: [{ id: 'common' }],
    description: {
      short: 'A professional killer who strikes from stealth with poisoned blades and crossbow bolts.',
      long: 'Assassins are elite murderers trained in infiltration and poison. They favor ambush, evasion, and finishing blows over fair fights.',
    },
    mechanics: {
      hitPoints: { count: 15, die: 8, modifier: 30 },
      armorClass: { kind: 'equipment', armorRefs: ['studded-leather'] },
      movement: { ground: 30 },
      abilities: { str: 11, dex: 18, con: 14, int: 16, wis: 11, cha: 10 },
      savingThrows: {
        dex: { proficiencyLevel: 1 },
        int: { proficiencyLevel: 1 },
      },
      proficiencies: {
        skills: {
          acrobatics: { proficiencyLevel: 1 },
          perception: { proficiencyLevel: 1 },
          stealth: { proficiencyLevel: 2 },
        },
        weapons: {
          shortsword: { proficiencyLevel: 1 },
          'light-crossbow': { proficiencyLevel: 1 },
        },
      },
      senses: { passivePerception: 16 },
      proficiencyBonus: 3,
      resistances: ['poison'],
      resolution: {
        caveats: ['Speaks Common and Thieves’ Cant (Cant not encoded as a language id).'],
      },
      traits: [
        {
          name: 'Evasion',
          description:
            'If the assassin is subjected to an effect that allows it to make a Dexterity saving throw to take only half damage, the assassin instead takes no damage if it succeeds on the save and only half damage if it fails. It can’t use this trait if it has the Incapacitated condition.',
          resolution: {
            caveats: ['Evasion is not automated on AoE resolution.'],
          },
        },
      ],
      actions: [
        {
          kind: 'special',
          name: 'Multiattack',
          description:
            'The assassin makes three attacks, using Shortsword or Light Crossbow in any combination.',
          sequence: [{ actionName: 'Shortsword', count: 3 }],
          notes: 'Attacks may use Light Crossbow instead of Shortsword.',
        },
        { kind: 'weapon', weaponRef: 'shortsword' },
        { kind: 'weapon', weaponRef: 'light-crossbow' },
      ],
      bonusActions: [
        {
          kind: 'special',
          name: 'Cunning Action',
          description: 'The assassin takes the Dash, Disengage, or Hide action.',
        },
      ],
      equipment: {
        weapons: {
          shortsword: {
            weaponId: 'shortsword',
            attackBonus: 7,
            damageBonus: 4,
            notes:
              '+ 17 (5d6) Poison damage, and the target has the Poisoned condition until the start of the assassin’s next turn.',
          },
          'light-crossbow': {
            weaponId: 'light-crossbow',
            attackBonus: 7,
            damageBonus: 4,
            notes: '+ 21 (6d6) Poison damage.',
          },
        },
        armor: {
          'studded-leather': { armorId: 'studded-leather' },
        },
      },
    },
    lore: {
      alignment: 'n',
      challengeRating: 8,
      xpValue: 3900,
      intelligence: 'high',
    },
  },
  {
    id: 'awakened-shrub',
    name: 'Awakened Shrub',
    type: 'plant',
    sizeCategory: 'small',
    languages: [{ id: 'common' }],
    description: {
      short: 'A tiny awakened plant that rakes with twiggy claws.',
      long: 'This awakened plant is a shrub given motion and purpose by druidic magic, often serving as a watchful garden guardian.',
    },
    mechanics: {
      hitPoints: { count: 3, die: 6 },
      armorClass: { kind: 'natural' },
      movement: { ground: 20 },
      abilities: { str: 3, dex: 8, con: 11, int: 10, wis: 10, cha: 6 },
      senses: { passivePerception: 10 },
      proficiencyBonus: 2,
      vulnerabilities: ['fire'],
      resistances: ['piercing'],
      resolution: {
        caveats: ['Languages: Common plus one other language (GM choice; not encoded).'],
      },
      actions: [
        {
          kind: 'natural',
          name: 'Rake',
          attackType: 'claw',
          attackBonus: 1,
          reach: 5,
          damage: '1',
          damageType: 'slashing',
        },
      ],
    },
    lore: {
      alignment: 'n',
      challengeRating: 0,
      xpValue: 10,
      intelligence: 'average',
    },
  },
  {
    id: 'awakened-tree',
    name: 'Awakened Tree',
    type: 'plant',
    sizeCategory: 'huge',
    languages: [{ id: 'common' }],
    description: {
      short: 'A towering awakened plant that slams foes with branch-like limbs.',
      long: 'This awakened plant is a tree given a slow, relentless strength—often bound to a grove it defends without question.',
    },
    mechanics: {
      hitPoints: { count: 7, die: 12, modifier: 14 },
      armorClass: { kind: 'natural', offset: 3 },
      movement: { ground: 20 },
      abilities: { str: 19, dex: 6, con: 15, int: 10, wis: 10, cha: 7 },
      senses: { passivePerception: 10 },
      proficiencyBonus: 2,
      vulnerabilities: ['fire'],
      resistances: ['bludgeoning', 'piercing'],
      resolution: {
        caveats: ['Languages: Common plus one other language (GM choice; not encoded).'],
      },
      actions: [
        {
          kind: 'natural',
          name: 'Slam',
          attackType: 'slam',
          attackBonus: 6,
          reach: 10,
          damage: '3d6',
          damageBonus: 4,
          damageType: 'bludgeoning',
        },
      ],
    },
    lore: {
      alignment: 'n',
      challengeRating: 2,
      xpValue: 450,
      intelligence: 'average',
    },
  },
  {
    id: 'axe-beak',
    name: 'Axe Beak',
    type: 'beast',
    sizeCategory: 'large',
    languages: [],
    description: {
      short: 'A flightless terror bird that charges with a heavy, axe-like beak.',
      long: 'Axe beaks are large, aggressive flightless birds that roam open grasslands in packs, shearing flesh with powerful hooked beaks.',
    },
    mechanics: {
      hitPoints: { count: 3, die: 10, modifier: 3 },
      armorClass: { kind: 'natural' },
      movement: { ground: 50 },
      abilities: { str: 14, dex: 12, con: 12, int: 2, wis: 10, cha: 5 },
      senses: { passivePerception: 10 },
      proficiencyBonus: 2,
      actions: [
        {
          kind: 'natural',
          name: 'Beak',
          attackType: 'beak',
          attackBonus: 4,
          reach: 5,
          damage: '1d6',
          damageBonus: 2,
          damageType: 'slashing',
          notes: 'SRD: +4 to hit, 7 (1d6 + 2) slashing.',
        },
      ],
    },
    lore: {
      alignment: 'n',
      challengeRating: 0.25,
      xpValue: 50,
      intelligence: 'animal',
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
];
