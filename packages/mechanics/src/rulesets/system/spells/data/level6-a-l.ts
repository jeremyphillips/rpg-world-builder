import type { SpellEntry } from '../types';
import { FORBIDDANCE_CREATURE_TYPE_CASTER_OPTIONS } from '../../monsters';
/**
 * Level 6 spells A–L — authoring status:
 * - **Attack/save/AoE modeled:** Blade Barrier, Chain Lightning, Circle of Death, Disintegrate, Flesh to Stone, Freezing Sphere, Harm, Irresistible Dance (in m–z), Sunbeam (in m–z).
 * - **Utility / divination / ritual:** Contingency, Find the Path, Instant Summons (in m–z), True Seeing (in m–z).
 * - **Note-first / wards / heavy caveats:** Blade Barrier, Conjure Fey, Create Undead, Forbiddance, Freezing Sphere, Globe of Invulnerability, Guards and Wards, Harm, etc.
 */
export const SPELLS_LEVEL_6_A_L: readonly SpellEntry[] = [
    {
        id: 'blade-barrier',
        name: 'Blade Barrier',
        school: 'evocation',
        level: 6,
        classes: ['cleric'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 90, unit: 'ft' } },
        duration: { kind: 'timed', value: 10, unit: 'minute', concentration: true, upTo: true },
        components: { verbal: true, somatic: true },
        resolution: {
            caveats: [
                'Damage applies only to creatures in the wall’s space; geometry (straight wall vs ring) is narrative-only.',
            ],
        },
        effectGroups: [
            {
                effects: [
                    {
                        kind: 'note',
                        text: 'Wall 100ft long or 60ft ring, 20ft high, 5ft thick. Three-Quarters Cover; the wall’s space is Difficult Terrain.',
                        category: 'under-modeled' as const,
                    },
                    {
                        kind: 'save',
                        save: { ability: 'dex' },
                        onFail: [{ kind: 'damage', damage: '6d10', damageType: 'force' }],
                        onSuccess: [{ kind: 'damage', damage: '3d10', damageType: 'force' }],
                    }
                ]
            }
        ],
        description: {
            full: "You create a wall of whirling blades made of magical energy. The wall appears within range and lasts for the duration. You make a straight wall up to 100 feet long, 20 feet high, and 5 feet thick, or a ringed wall up to 60 feet in diameter, 20 feet high, and 5 feet thick. The wall provides Three-Quarters Cover, and its space is Difficult Terrain. Any creature in the wall's space makes a Dexterity saving throw, taking 6d10 Force damage on a failed save or half as much on a successful one.",
            summary: 'Wall of blades: 6d10 Force, Dex save for half. Three-Quarters Cover, Difficult Terrain.',
        },
    },
    {
        id: 'chain-lightning',
        name: 'Chain Lightning',
        school: 'evocation',
        level: 6,
        classes: ['sorcerer', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 150, unit: 'ft' } },
        duration: { kind: 'instantaneous' },
        components: { verbal: true, somatic: true, material: { description: 'a bit of fur, a piece of amber, and a crystal rod' } },
        resolution: {
            caveats: [
                'Primary bolt modeled; additional bolts (each with its own save) are summarized in notes.',
            ],
        },
        effectGroups: [
            {
                targeting: { selection: 'one', targetType: 'creature' },
                effects: [
                    {
                        kind: 'save',
                        save: { ability: 'dex' },
                        onFail: [{ kind: 'damage', damage: '10d8', damageType: 'lightning' }],
                        onSuccess: [{ kind: 'damage', damage: '5d8', damageType: 'lightning' }],
                    },
                    { kind: 'note', text: 'Lightning arcs from primary target to up to 3 additional targets within 30 feet. Each additional target also makes the save.', category: 'under-modeled' as const }
                ]
            }
        ],
        scaling: [{ category: 'extra-damage', description: '+1d8 lightning per slot level above 6', mode: 'per-slot-level', startsAtSlotLevel: 7, amount: '1d8' }],
        description: {
            full: "You create a bolt of lightning that arcs toward a target of your choice that you can see within range. Three bolts then leap from that target to as many as three other targets, each of which must be within 30 feet of the first target. A target can be a creature or an object and can be targeted by only one of the bolts. A target makes a Dexterity saving throw, taking 10d8 Lightning damage on a failed save or half as much on a successful one. Using a Higher-Level Spell Slot. One additional bolt leaps from the first target to another target for each spell slot level above 6.",
            summary: 'Lightning bolt arcs to 1 target + up to 3 others within 30ft. Dex save or 10d8 lightning.',
        },
    },
    {
        id: 'circle-of-death',
        name: 'Circle of Death',
        school: 'necromancy',
        level: 6,
        classes: ['sorcerer', 'warlock', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 150, unit: 'ft' } },
        duration: { kind: 'instantaneous' },
        components: { verbal: true, somatic: true, material: { description: 'the powder of a crushed black pearl worth 500+ GP', cost: { value: 500, unit: 'gp', atLeast: true } } },
        resolution: {
            caveats: [
                'Large spherical AoE may affect many targets; adjudicate cover and position separately.',
            ],
        },
        effectGroups: [
            {
                targeting: { selection: 'in-area', targetType: 'creature', area: { kind: 'sphere', size: 60 } },
                effects: [
                    {
                        kind: 'save',
                        save: { ability: 'con' },
                        onFail: [{ kind: 'damage', damage: '8d8', damageType: 'necrotic' }],
                        onSuccess: [{ kind: 'damage', damage: '4d8', damageType: 'necrotic' }],
                    }
                ]
            }
        ],
        scaling: [{ category: 'extra-damage', description: '+2d8 necrotic per slot level above 6', mode: 'per-slot-level', startsAtSlotLevel: 7, amount: '2d8' }],
        description: {
            full: "Negative energy ripples out in a 60-foot-radius Sphere from a point you choose within range. Each creature in that area makes a Constitution saving throw, taking 8d8 Necrotic damage on a failed save or half as much on a successful one. Using a Higher-Level Spell Slot. The damage increases by 2d8 for each spell slot level above 6.",
            summary: '60ft sphere: Con save or 8d8 necrotic. Damage scales with slot.',
        },
    },
    {
        id: 'conjure-fey',
        name: 'Conjure Fey',
        school: 'conjuration',
        level: 6,
        classes: ['druid'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
        duration: { kind: 'timed', value: 10, unit: 'minute', concentration: true, upTo: true },
        components: { verbal: true, somatic: true },
        resolution: {
            caveats: [
                'Summon stat block and command economy (Bonus Action teleport + attack) are not represented as a full combatant.',
            ],
        },
        effectGroups: [
            {
                effects: [
                    {
                        kind: 'note',
                        text: 'Medium Fey spirit in an unoccupied space. When it appears, you may make one melee spell attack vs a creature within 5 feet of the spirit. On a hit: 3d12 + spellcasting modifier Psychic, and Frightened until the start of your next turn. Bonus Action on later turns: teleport the spirit up to 30 feet to an unoccupied space and repeat the attack.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        scaling: [{ category: 'extra-damage', description: '+1d12 psychic per slot level above 6', mode: 'per-slot-level', startsAtSlotLevel: 7, amount: '1d12' }],
        description: {
            full: "You conjure a Medium spirit from the Feywild in an unoccupied space you can see within range. The spirit looks like a Fey creature of your choice. When the spirit appears, you can make one melee spell attack against a creature within 5 feet of it. On a hit, the target takes Psychic damage equal to 3d12 plus your spellcasting ability modifier, and the target has the Frightened condition until the start of your next turn. As a Bonus Action on your later turns, you can teleport the spirit to an unoccupied space within 30 feet and make the attack. Using a Higher-Level Spell Slot. The damage increases by 1d12 for each spell slot level above 6.",
            summary: 'Fey spirit: melee spell attack 3d12+mod Psychic, Frightened. Bonus teleport and attack. Scales with slot.',
        },
    },
    {
        id: 'contingency',
        name: 'Contingency',
        school: 'abjuration',
        level: 6,
        classes: ['wizard'],
        castingTime: { normal: { value: 10, unit: 'minute' }, canBeCastAsRitual: false },
        range: { kind: 'self' },
        duration: { kind: 'timed', value: 10, unit: 'day' },
        components: { verbal: true, somatic: true, material: { description: 'a gem-encrusted statuette of yourself worth 1,500+ GP', cost: { value: 1500, unit: 'gp', atLeast: true } } },
        resolution: {
            caveats: [
                'Contingent spell choice, trigger wording, and interaction timing are table/GM adjudicated.',
            ],
        },
        effectGroups: [
            {
                effects: [
                    {
                        kind: 'note',
                        text: 'Cast a spell of 5th level or lower (casting time 1 action, can target you) as part of this casting; describe a trigger. The contingent spell takes effect on you when the trigger first occurs. Only one Contingency at a time; ends if the material component leaves your person.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "Choose a spell of level 5 or lower that you can cast, that has a casting time of an action, and that can target you. You cast that spell—called the contingent spell—as part of casting Contingency, expending spell slots for both, but the contingent spell doesn't come into effect. Instead, it takes effect when a certain trigger occurs. You describe that trigger when you cast the two spells. The contingent spell takes effect immediately after the trigger occurs for the first time. The contingent spell takes effect only on you. You can use only one Contingency spell at a time. Contingency ends if its material component is ever not on your person.",
            summary: 'Store spell (5th or lower) to trigger on condition. One at a time.',
        },
    },
    {
        id: 'create-undead',
        name: 'Create Undead',
        school: 'necromancy',
        level: 6,
        classes: ['cleric', 'warlock', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'minute' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 10, unit: 'ft' } },
        duration: { kind: 'instantaneous' },
        components: { verbal: true, somatic: true, material: { description: 'one 150+ GP black onyx stone per corpse', cost: { value: 150, unit: 'gp', atLeast: true } } },
        resolution: {
            caveats: [
                'Created undead use stat blocks and are not spawned as full encounter actors here.',
            ],
        },
        effectGroups: [
            {
                effects: [
                    {
                        kind: 'note',
                        text: 'Night only. Up to 3 corpses become Ghouls. Control 24h; re-cast to maintain. Slot 7: 4 Ghouls. Slot 8: 5 Ghouls or 2 Ghasts/Wights. Slot 9: 6 Ghouls, 3 Ghasts/Wights, or 2 Mummies.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "You can cast this spell only at night. Choose up to three corpses of Medium or Small Humanoids within range. Each one becomes a Ghoul under your control. Bonus Action to command within 120 feet. Control 24 hours; re-cast to maintain. Using a Higher-Level Spell Slot. Level 7: 4 Ghouls. Level 8: 5 Ghouls or 2 Ghasts/Wights. Level 9: 6 Ghouls, 3 Ghasts/Wights, or 2 Mummies.",
            summary: 'Create Ghouls from corpses. Control 24h. Scales with slot (Ghasts, Wights, Mummies).',
        },
    },
    {
        id: 'disintegrate',
        name: 'Disintegrate',
        school: 'transmutation',
        level: 6,
        classes: ['sorcerer', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
        duration: { kind: 'instantaneous' },
        components: { verbal: true, somatic: true, material: { description: 'a lodestone and pinch of dust' } },
        resolution: {
            caveats: [
                'Non-creature targets (objects, magical-force creations, Huge or larger partial destruction) are not fully modeled; creature line uses Dex save and damage only.',
            ],
        },
        effectGroups: [
            {
                targeting: { selection: 'one', targetType: 'creature' },
                effects: [
                    {
                        kind: 'save',
                        save: { ability: 'dex' },
                        onFail: [{ kind: 'damage', damage: '10d6+40', damageType: 'force' }],
                        onSuccess: [{ kind: 'damage', damage: '5d6+20', damageType: 'force' }],
                    },
                    { kind: 'note', text: 'Target reduced to 0 HP is disintegrated (turned to fine gray dust). Nonmagical objects and Huge or smaller creations of magical force are automatically destroyed.', category: 'flavor' as const }
                ]
            }
        ],
        scaling: [{ category: 'extra-damage', description: '+3d6 force per slot level above 6', mode: 'per-slot-level', startsAtSlotLevel: 7, amount: '3d6' }],
        description: {
            full: "You launch a green ray at a target you can see within range. The target can be a creature, a nonmagical object, or a creation of magical force, such as the wall created by Wall of Force. A creature targeted by this spell makes a Dexterity saving throw. On a failed save, the target takes 10d6 + 40 Force damage. The target is disintegrated if this damage leaves it with 0 Hit Points. A disintegrated creature and everything nonmagical it is wearing and carrying are reduced to fine gray dust. The creature can be restored to life only by means of a True Resurrection or a Wish spell. This spell automatically disintegrates a Large or smaller nonmagical object or a creation of magical force. If the target is a Huge or larger nonmagical object or creation of force, this spell disintegrates a 10-foot-Cube portion of it. Using a Higher-Level Spell Slot. The damage increases by 3d6 for each spell slot level above 6.",
            summary: 'Green ray: Dex save or 10d6+40 force. Disintegrates target if reduced to 0 HP.',
        },
    },
    {
        id: 'eyebite',
        name: 'Eyebite',
        school: 'necromancy',
        level: 6,
        classes: ['bard', 'sorcerer', 'warlock', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'self' },
        duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
        components: { verbal: true, somatic: true },
        resolution: {
            caveats: [
                'Chosen effect (asleep / panicked / sickened) and per-turn retargeting are not split into separate effect payloads.',
            ],
        },
        effectGroups: [
            {
                targeting: { selection: 'one', targetType: 'creature', requiresSight: true },
                effects: [
                    {
                        kind: 'save',
                        save: { ability: 'wis' },
                        onFail: [
                            { kind: 'note', text: 'Choose: Asleep (Unconscious), Panicked (Frightened, must Dash away), or Sickened (Poisoned).', category: 'under-modeled' as const },
                        ],
                    },
                    { kind: 'note', text: 'Magic action each turn to target another creature. Cannot re-target a creature that has succeeded on the save.', category: 'under-modeled' as const }
                ]
            }
        ],
        description: {
            full: "For the duration, your eyes become an inky void. One creature of your choice within 60 feet that you can see must succeed on a Wisdom saving throw or be affected by one effect of your choice: Asleep (Unconscious), Panicked (Frightened, must Dash away), or Sickened (Poisoned). On each of your turns, you can take a Magic action to target another creature but can't target a creature again if it has succeeded on a save against this casting.",
            summary: 'Wis save or Asleep, Panicked, or Sickened. New target each turn.',
        },
    },
    {
        id: 'find-the-path',
        name: 'Find the Path',
        school: 'divination',
        level: 6,
        classes: ['bard', 'cleric', 'druid'],
        castingTime: { normal: { value: 1, unit: 'minute' }, canBeCastAsRitual: false },
        range: { kind: 'self' },
        duration: { kind: 'timed', value: 1, unit: 'day', concentration: true, upTo: true },
        components: { verbal: true, somatic: true, material: { description: 'a set of divination tools worth 100+ GP', cost: { value: 100, unit: 'gp', atLeast: true } } },
        resolution: {
            caveats: [
                'Fails for other planes, moving destinations, or vague destinations; route is informational only.',
            ],
        },
        effectGroups: [
            {
                effects: [
                    { kind: 'state', stateId: 'find-the-path', notes: 'Know most direct physical route to a named familiar location. Know distance, direction, and which path at choices.' }
                ]
            }
        ],
        description: {
            full: "You magically sense the most direct physical route to a location you name. You must be familiar with the location. The spell fails if you name a destination on another plane, a moving destination, or an unspecific destination. For the duration, you know how far it is and in what direction it lies. Whenever you face a choice of paths along the way, you know which path is the most direct.",
            summary: 'Know direct route to familiar location. Distance, direction, path choices.',
        },
    },
    {
        id: 'flesh-to-stone',
        name: 'Flesh to Stone',
        school: 'transmutation',
        level: 6,
        classes: ['druid', 'sorcerer', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
        duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
        components: { verbal: true, somatic: true, material: { description: 'a cockatrice feather' } },
        resolution: {
            caveats: [
                'Restrained vs repeated saves toward Petrified, and “full concentration” permanency, require manual tracking.',
            ],
        },
        effectGroups: [
            {
                targeting: { selection: 'one', targetType: 'creature' },
                effects: [
                    {
                        kind: 'save',
                        save: { ability: 'con' },
                        onFail: [{ kind: 'condition', conditionId: 'restrained' }],
                    },
                    { kind: 'note', text: 'Constructs auto-succeed. Track 3 successes/failures: 3 failures = Petrified. On success, Speed is 0 until start of next turn. Full-duration concentration = permanent Petrified.', category: 'under-modeled' as const }
                ]
            }
        ],
        description: {
            full: "You attempt to turn one creature that you can see within range into stone. The target makes a Constitution saving throw. On a failed save, it has the Restrained condition for the duration. On a successful save, its Speed is 0 until the start of your next turn. Constructs automatically succeed on the save. A Restrained target makes another Constitution saving throw at the end of each of its turns. If it successfully saves against this spell three times, the spell ends. If it fails its saves three times, it is turned to stone and has the Petrified condition for the duration. The successes and failures needn't be consecutive; keep track of both until the target collects three of a kind. If you maintain your Concentration on this spell for the entire possible duration, the target is Petrified until the condition is ended by Greater Restoration or similar magic.",
            summary: 'Con save or Restrained. Best of 3: Petrified on 3 failures. Full concentration: Petrified until Greater Restoration.',
        },
    },
    {
        id: 'forbiddance',
        name: 'Forbiddance',
        school: 'abjuration',
        level: 6,
        classes: ['cleric'],
        castingTime: { normal: { value: 10, unit: 'minute' }, canBeCastAsRitual: true },
        range: { kind: 'touch' },
        duration: { kind: 'timed', value: 1, unit: 'day' },
        components: { verbal: true, somatic: true, material: { description: 'ruby dust worth 1,000+ GP', cost: { value: 1000, unit: 'gp', atLeast: true } } },
        resolution: {
            caveats: [
                'Areas cannot overlap another Forbiddance; 30-day renewal for permanent ward is narrative.',
                'SRD allows choosing one or more creature types; encounter UI records one selection (or “all”). Password is not a caster option here.',
            ],
            casterOptions: [
                {
                    kind: 'enum',
                    id: 'forbiddance-damage-type',
                    label: 'Damage type',
                    options: [
                        { value: 'radiant', label: 'Radiant' },
                        { value: 'necrotic', label: 'Necrotic' },
                    ],
                },
                {
                    kind: 'enum',
                    id: 'forbiddance-creature-types',
                    label: 'Creature types damaged',
                    options: FORBIDDANCE_CREATURE_TYPE_CASTER_OPTIONS,
                },
            ],
        },
        effectGroups: [
            {
                effects: [
                    {
                        kind: 'note',
                        text: 'Ward 40,000 sq ft, 30ft high. No teleport/portals. Choose creature types: 5d10 radiant or necrotic when entering/ending turn. Password exempts. 30 days casting: until dispelled.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "You create a ward against magical travel that protects up to 40,000 square feet of floor space to a height of 30 feet above the floor. For the duration, creatures can't teleport into the area or use portals, such as those created by the Gate spell, to enter the area. The spell proofs the area against planar travel, and therefore prevents creatures from accessing the area by way of the Astral Plane, the Ethereal Plane, the Feywild, the Shadowfell, or the Plane Shift spell. In addition, the spell damages types of creatures that you choose when you cast it. Choose one or more of the following: Aberrations, Celestials, Elementals, Fey, Fiends, and Undead. When a creature of a chosen type enters the spell's area for the first time on a turn or ends its turn there, the creature takes 5d10 Radiant or Necrotic damage (your choice when you cast this spell). You can designate a password when you cast the spell. A creature that speaks the password as it enters the area takes no damage from the spell. The spell's area can't overlap with the area of another Forbiddance spell. If you cast Forbiddance every day for 30 days in the same location, the spell lasts until it is dispelled, and the Material components are consumed on the last casting.",
            summary: 'Ward area from teleport. Damage chosen creature types. Password exempts. 30-day casting: until dispelled.',
        },
    },
    {
        id: 'freezing-sphere',
        name: 'Freezing Sphere',
        school: 'evocation',
        level: 6,
        classes: ['sorcerer', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 300, unit: 'ft' } },
        duration: { kind: 'instantaneous' },
        components: { verbal: true, somatic: true, material: { description: 'a miniature crystal sphere' } },
        resolution: {
            caveats: [
                'Optional held globe (delayed detonation) and water-freezing rider are not separate automated branches.',
            ],
        },
        scaling: [{ category: 'extra-damage', description: '+1d6 cold per slot level above 6', mode: 'per-slot-level', startsAtSlotLevel: 7, amount: '1d6' }],
        effectGroups: [
            {
                targeting: {
                    selection: 'in-area', targetType: 'creature',
                    area: { kind: 'sphere', size: 60 }
                },
                effects: [
                    {
                        kind: 'save',
                        save: { ability: 'con' },
                        onFail: [{ kind: 'damage', damage: '10d6', damageType: 'cold' }],
                        onSuccess: [{ kind: 'damage', damage: '5d6', damageType: 'cold' }],
                    },
                    {
                        kind: 'note',
                        text: 'Frigid globe to a point in range; explosion is a 60-foot-radius sphere. Water: freeze 6 inches deep over a 30-foot square (1 minute). You may complete the spell with a held globe (throw 40ft or sling) that shatters on impact or explodes after 1 minute.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "A frigid globe streaks from you to a point of your choice within range, where it explodes in a 60-foot-radius Sphere. Each creature in that area makes a Constitution saving throw, taking 10d6 Cold damage on failed save or half as much damage on a successful one. If the globe strikes a body of water, it freezes the water to a depth of 6 inches over an area 30 feet square. This ice lasts for 1 minute. Creatures that were swimming on the surface of frozen water are trapped in the ice and have the Restrained condition. A trapped creature can take an action to make a Strength (Athletics) check against your spell save DC to break free. You can refrain from firing the globe after completing the spell's casting. If you do so, a globe about the size of a sling bullet, cool to the touch, appears in your hand. At any time, you or a creature you give the globe to can throw the globe (to a range of 40 feet) or hurl it with a sling (to the sling's normal range). It shatters on impact, with the same effect as a normal casting of the spell. You can also set the globe down without shattering it. After 1 minute, if the globe hasn't already shattered, it explodes. Using a Higher-Level Spell Slot. The damage increases by 1d6 for each spell slot level above 6.",
            summary: '60ft sphere: Con save or 10d6 cold. Can delay as held globe. Damage scales with slot.',
        },
    },
    {
        id: 'globe-of-invulnerability',
        name: 'Globe of Invulnerability',
        school: 'abjuration',
        level: 6,
        classes: ['sorcerer', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'self' },
        duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
        components: { verbal: true, somatic: true, material: { description: 'a glass bead' } },
        resolution: {
            caveats: [
                'Spell-level cutoff (5th at base, +1 per slot above 6th) must be compared to incoming spell slot.',
            ],
        },
        effectGroups: [
            {
                targeting: {
                    selection: 'in-area', targetType: 'creature',
                    area: { kind: 'sphere', size: 10 }
                },
                effects: [
                    {
                        kind: 'emanation',
                        attachedTo: 'self',
                        area: { kind: 'sphere', size: 10 },
                    },
                    {
                        kind: 'note',
                        text: '10-foot emanation. Spells of 5th level or lower cast from outside the barrier cannot affect creatures or objects inside (+1 blocked level per slot level above 6).',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "An immobile, shimmering barrier appears in a 10-foot Emanation around you and remains for the duration. Any spell of level 5 or lower cast from outside the barrier can't affect anything within it. Such a spell can target creatures and objects within the barrier, but the spell has no effect on them. Similarly, the area within the barrier is excluded from areas of effect created by such spells. Using a Higher-Level Spell Slot. The barrier blocks spells of 1 level higher for each spell slot level above 6.",
            summary: '10ft barrier blocks 5th or lower spells. Blocked level scales with slot.',
        },
    },
    {
        id: 'guards-and-wards',
        name: 'Guards and Wards',
        school: 'abjuration',
        level: 6,
        classes: ['bard', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'hour' }, canBeCastAsRitual: false },
        range: { kind: 'touch' },
        duration: { kind: 'timed', value: 24, unit: 'hour' },
        components: { verbal: true, somatic: true, material: { description: 'a silver rod worth 10+ GP', cost: { value: 10, unit: 'gp', atLeast: true } } },
        resolution: {
            caveats: [
                'Corridor/door/stair bundles and 365-day permanency are summarized, not each sub-effect.',
            ],
        },
        effectGroups: [
            {
                effects: [
                    {
                        kind: 'note',
                        text: 'Ward up to 2,500 sq ft. Fog, locked doors, illusions, Dancing Lights, Magic Mouth, Stinking Cloud, Gust of Wind, Suggestion. 365 days: until dispelled.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "You create a ward that protects up to 2,500 square feet of floor space. The warded area can be up to 20 feet tall, and you shape it as one 50-foot square, one hundred 5-foot squares that are contiguous, or twenty-five 10-foot squares that are contiguous. When you cast this spell, you can specify individuals that are unaffected by the spell's effects. You can also specify a password that, when spoken aloud within 5 feet of the warded area, makes the speaker immune to its effects. The spell creates: Corridors (fog, 50% wrong direction), Doors (Arcane Lock, illusions), Stairs (Web), Other (Dancing Lights, Magic Mouth, Stinking Cloud, Gust of Wind, Suggestion). If you cast the spell every day for 365 days on the same area, the spell thereafter lasts until all its effects are dispelled.",
            summary: 'Ward area with fog, locks, webs, and other effects. 365-day casting: until dispelled.',
        },
    },
    {
        id: 'harm',
        name: 'Harm',
        school: 'necromancy',
        level: 6,
        classes: ['cleric'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
        duration: { kind: 'instantaneous' },
        components: { verbal: true, somatic: true },
        resolution: {
            caveats: [
                'Hit Point maximum reduction applies only on a failed save and cannot reduce max HP below 1.',
            ],
        },
        effectGroups: [
            {
                targeting: { selection: 'one', targetType: 'creature', requiresSight: true },
                effects: [
                    {
                        kind: 'save',
                        save: { ability: 'con' },
                        onFail: [{ kind: 'damage', damage: '14d6', damageType: 'necrotic' }],
                        onSuccess: [{ kind: 'damage', damage: '7d6', damageType: 'necrotic' }],
                    },
                    {
                        kind: 'note',
                        text: 'On a failed save, the target’s Hit Point maximum is reduced by the necrotic damage it took (not on a successful save).',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "You unleash virulent magic on a creature you can see within range. The target makes a Constitution saving throw. On a failed save, it takes 14d6 Necrotic damage, and its Hit Point maximum is reduced by an amount equal to the Necrotic damage it took. On a successful save, it takes half as much damage only. This spell can't reduce a target's Hit Point maximum below 1.",
            summary: 'Con save or 14d6 necrotic, HP max reduced. Half on success.',
        },
    },
];
