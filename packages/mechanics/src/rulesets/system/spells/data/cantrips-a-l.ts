import type { DamageType } from '@/features/mechanics/domain/damage/damage.types';
import type { SpellTags } from '@/features/content/spells/domain/types';
import type { SpellFunctionTag } from '@/features/content/spells/domain/vocab/spellFunctionTags.vocab';
import type { SpellRoleTag } from '@/features/content/spells/domain/vocab/spellRoleTags.vocab';
import type { SpellEntry } from '../types';
import { cantripDamageScaling } from '../shared';
/**
 * Cantrips A–L — authoring status:
 * - **Attack/save modeled:** Acid Splash, Chill Touch, Eldritch Blast, Fire Bolt.
 * - **Utility / light / illusion:** Dancing Lights, Druidcraft, Guidance, Light, Mage Hand, Message, Minor Illusion.
 * - **Ritual-like / crafting:** Elementalism, Mending.
 */
export const SPELLS_LEVEL_0_A_L: readonly SpellEntry[] = [
    {
        id: 'acid-splash',
        name: 'Acid Splash',
        school: 'evocation',
        level: 0,
        classes: ['sorcerer', 'wizard'],
        tags: {
            damageTypes: ['acid'] satisfies DamageType[],
            roles: ['damage'] satisfies SpellRoleTag[],
        } satisfies SpellTags,
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
        duration: { kind: 'instantaneous' },
        components: { verbal: true, somatic: true },
        resolution: {
            caveats: [
                'Encounter maps area spells to all living enemies only; no geometry or ally targeting.',
            ],
        },
        effectGroups: [
            {
                targeting: {
                    selection: 'in-area', targetType: 'creature',
                    area: { kind: 'sphere', size: 5 }
                },
                effects: [
                    {
                        kind: 'save',
                        save: { ability: 'dex' },
                        onFail: [
                            {
                                kind: 'damage',
                                damage: '1d6',
                                damageType: 'acid',
                                levelScaling: cantripDamageScaling('d6'),
                            },
                        ],
                    },
                    {
                        kind: 'note',
                        text: 'Edition-specific targeting (e.g. two creatures within 5 feet, objects) may differ; not fully modeled.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "You create an acidic bubble at a point within range, where it explodes in a 5-foot-radius Sphere. Each creature in that Sphere must succeed on a Dexterity saving throw or take 1d6 Acid damage. Cantrip Upgrade. The damage increases by 1d6 when you reach levels 5 (2d6), 11 (3d6), and 17 (4d6).",
            summary: '5-foot sphere; Dex save or 1d6 acid damage. Scales at levels 5, 11, 17.',
        },
    },
    {
        id: 'chill-touch',
        name: 'Chill Touch',
        school: 'necromancy',
        level: 0,
        classes: ['sorcerer', 'warlock', 'wizard'],
        tags: {
            damageTypes: ['necrotic'] satisfies DamageType[],
            roles: ['damage', 'debuff'] satisfies SpellRoleTag[],
        } satisfies SpellTags,
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'touch' },
        duration: { kind: 'instantaneous' },
        components: { verbal: true, somatic: true },
        deliveryMethod: 'melee-spell-attack',
        resolution: {
            caveats: [
                'HP-regain block until end of your next turn is not applied as a combat marker.',
            ],
        },
        effectGroups: [
            {
                targeting: { selection: 'one', targetType: 'creature' },
                effects: [
                    {
                        kind: 'damage',
                        damage: '1d10',
                        damageType: 'necrotic',
                        levelScaling: cantripDamageScaling('d10'),
                    },
                    {
                        kind: 'note',
                        text: "On a hit, the target can't regain Hit Points until the end of your next turn. Not tracked in encounter.",
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "Channeling the chill of the grave, make a melee spell attack against a target within reach. On a hit, the target takes 1d10 Necrotic damage, and it can't regain Hit Points until the end of your next turn. Cantrip Upgrade. The damage increases by 1d10 when you reach levels 5 (2d10), 11 (3d10), and 17 (4d10).",
            summary: 'Melee spell attack: 1d10 necrotic, blocks HP regain until end of next turn. Scales at 5/11/17.',
        },
    },
    {
        id: 'dancing-lights',
        name: 'Dancing Lights',
        school: 'illusion',
        level: 0,
        classes: ['bard', 'sorcerer', 'wizard'],
        tags: {
            functions: ['creation', 'deception', 'utility'] satisfies SpellFunctionTag[],
        } satisfies SpellTags,
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 120, unit: 'ft' } },
        duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
        components: { verbal: true, somatic: true, material: { description: 'a bit of phosphorus' } },
        resolution: {
            caveats: [
                'Light positions, 20ft spacing between lights, and humanoid “form” are not enforced as tokens.',
            ],
        },
        effectGroups: [
            {
                effects: [
                    {
                        kind: 'note',
                        text: 'Up to 4 torch-size lights or 1 Medium humanoid form. Dim light 10ft. Bonus action: move up to 60ft.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "You create up to four torch-size lights within range, making them appear as torches, lanterns, or glowing orbs that hover for the duration. Alternatively, you combine the four lights into one glowing Medium form that is vaguely humanlike. Each light sheds Dim Light in a 10-foot radius. As a Bonus Action, you can move the lights up to 60 feet to a space within range. A light must be within 20 feet of another light created by this spell, and a light vanishes if it exceeds the spell's range.",
            summary: 'Up to 4 lights or 1 humanoid form. Dim light 10ft. Bonus action to move.',
        },
    },
    {
        id: 'druidcraft',
        name: 'Druidcraft',
        school: 'transmutation',
        level: 0,
        classes: ['druid'],
        tags: {
            roles: ['detection'] satisfies SpellRoleTag[],
            functions: ['environment', 'foreknowledge', 'utility'] satisfies SpellFunctionTag[],
        } satisfies SpellTags,
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 30, unit: 'ft' } },
        duration: { kind: 'instantaneous' },
        components: { verbal: true, somatic: true },
        resolution: {
            caveats: [
                'Chosen druidcraft mode is narrative; no mechanical payload per option.',
            ],
        },
        effectGroups: [
            {
                effects: [
                    {
                        kind: 'note',
                        text: 'Weather sensor, bloom, sensory effect, or fire play. Minor nature effects.',
                        category: 'flavor' as const,
                    }
                ]
            }
        ],
        description: {
            full: "Whispering to the spirits of nature, you create one of the following effects within range: Weather Sensor (predict weather 24h, 1 round), Bloom (flower blossom, seed open, leaf bud), Sensory Effect (harmless effect in 5ft cube), Fire Play (light or snuff candle, torch, campfire).",
            summary: 'Minor nature effects: weather prediction, bloom, sensory effect, or fire control.',
        },
    },
    {
        id: 'eldritch-blast',
        name: 'Eldritch Blast',
        school: 'evocation',
        level: 0,
        classes: ['warlock'],
        tags: {
            damageTypes: ['force'] satisfies DamageType[],
            roles: ['damage'] satisfies SpellRoleTag[],
        } satisfies SpellTags,
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 120, unit: 'ft' } },
        duration: { kind: 'instantaneous' },
        components: { verbal: true, somatic: true },
        deliveryMethod: 'ranged-spell-attack',
        effectGroups: [
            {
                targeting: {
                    selection: 'chosen', targetType: 'creature',
                    canSelectSameTargetMultipleTimes: true
                },
                effects: [
                    {
                        kind: 'damage',
                        damage: '1d10',
                        damageType: 'force',
                        instances: { count: 1, canSplitTargets: true, canStackOnSingleTarget: true },
                        levelScaling: {
                            thresholds: [
                                { level: 5, instances: 2 },
                                { level: 11, instances: 3 },
                                { level: 17, instances: 4 },
                            ],
                        },
                    },
                    {
                        kind: 'note',
                        text: 'Each beam requires a separate ranged spell attack roll.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        resolution: {
            caveats: [
                'Beam count scales with caster level (5/11/17); confirm `instances` when resolving attacks.',
            ],
        },
        description: {
            full: 'You hurl a beam of crackling energy. Make a ranged spell attack against one creature or object in range. On a hit, the target takes 1d10 Force damage. Cantrip Upgrade. The spell creates two beams at level 5, three beams at level 11, and four beams at level 17. You can direct the beams at the same target or at different ones. Make a separate attack roll for each beam.',
            summary: 'Ranged spell attack dealing 1d10 force damage per beam; beam count increases at levels 5, 11, and 17.',
        },
    },
    {
        id: 'elementalism',
        name: 'Elementalism',
        school: 'transmutation',
        level: 0,
        classes: ['druid', 'sorcerer', 'wizard'],
        tags: {
            roles: ['control'] satisfies SpellRoleTag[],
            functions: ['environment', 'utility'] satisfies SpellFunctionTag[],
        } satisfies SpellTags,
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 30, unit: 'ft' } },
        duration: { kind: 'instantaneous' },
        components: { verbal: true, somatic: true },
        resolution: {
            caveats: [
                'Mode choice (beckon vs sculpt) and volume limits are narrative-only.',
            ],
        },
        effectGroups: [
            {
                effects: [
                    {
                        kind: 'note',
                        text: 'Beckon Air/Earth/Fire/Water or Sculpt Element. Minor elemental control.',
                        category: 'flavor' as const,
                    }
                ]
            }
        ],
        description: {
            full: "You exert control over the elements, creating one of the following effects within range: Beckon Air (breeze in 5ft cube), Beckon Earth (dust/sand or word in dirt), Beckon Fire (embers and scented smoke, can light candles), Beckon Water (mist or 1 cup water), Sculpt Element (1ft cube of element assumes crude shape for 1 hour).",
            summary: 'Minor elemental control: beckon air/earth/fire/water or sculpt element.',
        },
    },
    {
        id: 'fire-bolt',
        name: 'Fire Bolt',
        school: 'evocation',
        level: 0,
        classes: ['sorcerer', 'wizard'],
        tags: {
            damageTypes: ['fire'] satisfies DamageType[],
            roles: ['damage'] satisfies SpellRoleTag[],
        } satisfies SpellTags,
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 120, unit: 'ft' } },
        duration: { kind: 'instantaneous' },
        components: { verbal: true, somatic: true },
        deliveryMethod: 'ranged-spell-attack',
        resolution: {
            caveats: [
                'Can target a creature or object; encounter may assume creature targeting for attacks.',
            ],
        },
        effectGroups: [
            {
                targeting: { selection: 'one', targetType: 'creature' },
                effects: [
                    {
                        kind: 'damage',
                        damage: '1d10',
                        damageType: 'fire',
                        levelScaling: cantripDamageScaling('d10'),
                    },
                    {
                        kind: 'note',
                        text: "A flammable object hit by this spell starts burning if it isn't being worn or carried.",
                        category: 'flavor' as const,
                    }
                ]
            }
        ],
        description: {
            full: "You hurl a mote of fire at a creature or an object within range. Make a ranged spell attack against the target. On a hit, the target takes 1d10 Fire damage. A flammable object hit by this spell starts burning if it isn't being worn or carried. Cantrip Upgrade. The damage increases by 1d10 when you reach levels 5 (2d10), 11 (3d10), and 17 (4d10).",
            summary: 'Ranged spell attack dealing 1d10 fire damage; flammable objects start burning.',
        },
    },
    {
        id: 'guidance',
        name: 'Guidance',
        school: 'divination',
        level: 0,
        classes: ['cleric', 'druid'],
        tags: {
            roles: ['buff'] satisfies SpellRoleTag[],
            functions: ['utility'] satisfies SpellFunctionTag[],
        } satisfies SpellTags,
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'touch' },
        duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
        components: { verbal: true, somatic: true },
        resolution: {
            caveats: [
                'Chosen skill and 1d4 application to checks are not auto-tracked as a buff marker.',
            ],
        },
        effectGroups: [
            {
                targeting: { selection: 'one', targetType: 'creature', requiresWilling: true },
                effects: [
                    {
                        kind: 'note',
                        text: 'Touch willing creature, choose skill. Add 1d4 to ability checks using chosen skill until spell ends.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "You touch a willing creature and choose a skill. Until the spell ends, the creature adds 1d4 to any ability check using the chosen skill.",
            summary: 'Touch creature: add 1d4 to ability checks with chosen skill.',
        },
    },
    {
        id: 'light',
        name: 'Light',
        school: 'evocation',
        level: 0,
        classes: ['bard', 'cleric', 'sorcerer', 'wizard'],
        tags: {
            functions: ['creation', 'utility'] satisfies SpellFunctionTag[],
        } satisfies SpellTags,
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'touch' },
        duration: { kind: 'timed', value: 1, unit: 'hour' },
        components: { verbal: true, material: { description: 'a firefly or phosphorescent moss' } },
        resolution: {
            caveats: [
                'Spell targets an object (or creature carrying an object); `one-creature` targeting is a loose stand-in.',
            ],
        },
        effectGroups: [
            {
                targeting: {
                    selection: 'one', targetType: 'creature',
                },
                effects: [
                    {
                        kind: 'note',
                        text: 'You touch one object that is no larger than 10 feet in any dimension. The object sheds bright light in a 20-foot radius and dim light for an additional 20 feet.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: 'You touch one object that is no larger than 10 feet in any dimension. Until the spell ends, the object sheds bright light in a 20-foot radius and dim light for an additional 20 feet. The light can be colored as you like. Completely covering the object with something opaque blocks the light. The spell ends if you cast it again or dismiss it as an action.',
            summary: 'An object you touch sheds bright light in a 20-foot radius for 1 hour.',
        },
    },
    {
        id: 'mage-hand',
        name: 'Mage Hand',
        school: 'conjuration',
        level: 0,
        classes: ['bard', 'sorcerer', 'warlock', 'wizard'],
        tags: {
            functions: ['utility'] satisfies SpellFunctionTag[],
        } satisfies SpellTags,
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 30, unit: 'ft' } },
        duration: { kind: 'timed', value: 1, unit: 'minute' },
        components: { verbal: true, somatic: true },
        resolution: {
            caveats: [
                'Fine manipulation and weight limit are not simulated as inventory interaction.',
            ],
        },
        effectGroups: [
            {
                effects: [
                    {
                        kind: 'note',
                        text: 'Spectral hand: manipulate objects, open doors, stow/retrieve items. Magic action to move 30ft. Cannot attack, activate magic items, or carry more than 10 lb.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "A spectral, floating hand appears at a point you choose within range. The hand lasts for the duration. The hand vanishes if it is ever more than 30 feet away from you or if you cast this spell again. When you cast the spell, you can use the hand to manipulate an object, open an unlocked door or container, stow or retrieve an item from an open container, or pour the contents out of a vial. As a Magic action on your later turns, you can control the hand thus again. As part of that action, you can move the hand up to 30 feet. The hand can't attack, activate magic items, or carry more than 10 pounds.",
            summary: 'Spectral hand manipulates objects, opens doors, stows/retrieves items. 10 lb limit.',
        },
    },
    {
        id: 'mending',
        name: 'Mending',
        school: 'transmutation',
        level: 0,
        classes: ['bard', 'cleric', 'druid', 'sorcerer', 'wizard'],
        tags: {
            functions: ['utility'] satisfies SpellFunctionTag[],
        } satisfies SpellTags,
        castingTime: { normal: { value: 1, unit: 'minute' }, canBeCastAsRitual: false },
        range: { kind: 'touch' },
        duration: { kind: 'instantaneous' },
        components: { verbal: true, somatic: true, material: { description: 'two lodestones' } },
        resolution: {
            caveats: [
                'Repair outcome is narrative; magic-item limitation is not enforced by data.',
            ],
        },
        effectGroups: [
            {
                effects: [
                    {
                        kind: 'note',
                        text: 'Repairs single break or tear up to 1 foot in any dimension. Cannot restore magic to magic items.',
                        category: 'flavor' as const,
                    }
                ]
            }
        ],
        description: {
            full: "This spell repairs a single break or tear in an object you touch, such as a broken chain link, two halves of a broken key, a torn cloak, or a leaking wineskin. As long as the break or tear is no larger than 1 foot in any dimension, you mend it, leaving no trace of the former damage. This spell can physically repair a magic item, but it can't restore magic to such an object.",
            summary: 'Repairs single break or tear up to 1 foot. Cannot restore magic to magic items.',
        },
    },
    {
        id: 'message',
        name: 'Message',
        school: 'transmutation',
        level: 0,
        classes: ['bard', 'druid', 'sorcerer', 'wizard'],
        tags: {
            functions: ['communication'] satisfies SpellFunctionTag[],
        } satisfies SpellTags,
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 120, unit: 'ft' } },
        duration: { kind: 'special', description: '1 round' },
        components: { somatic: true, material: { description: 'a copper wire' } },
        resolution: {
            caveats: [
                'Barrier thickness and silence rules for message delivery are table-adjudicated.',
            ],
        },
        effectGroups: [
            {
                effects: [
                    { kind: 'note', text: 'Whisper to creature within range; only target hears. Target can reply in a whisper only you hear. Works through solid objects if familiar with target. Blocked by magical silence, 1ft of stone/metal/wood, or lead.', category: 'flavor' as const }
                ]
            }
        ],
        description: {
            full: "You point toward a creature within range and whisper a message. The target (and only the target) hears the message and can reply in a whisper that only you can hear. You can cast this spell through solid objects if you are familiar with the target and know it is beyond the barrier. Magical silence; 1 foot of stone, metal, or wood; or a thin sheet of lead blocks the spell.",
            summary: 'Whisper message to one creature; only they hear. Can work through solid objects.',
        },
    },
    {
        id: 'minor-illusion',
        name: 'Minor Illusion',
        school: 'illusion',
        level: 0,
        classes: ['bard', 'sorcerer', 'warlock', 'wizard'],
        tags: {
            functions: ['deception', 'utility'] satisfies SpellFunctionTag[],
        } satisfies SpellTags,
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 30, unit: 'ft' } },
        duration: { kind: 'timed', value: 1, unit: 'minute' },
        components: { somatic: true, material: { description: 'a bit of fleece' } },
        resolution: {
            caveats: [
                'Sound vs image mode and Investigation check are not enforced as separate branches.',
            ],
        },
        effectGroups: [
            {
                effects: [
                    {
                        kind: 'note',
                        text: 'Create sound (whisper to scream) or image of object (5ft cube max). Image has no sound, light, smell. Study action + Int (Investigation) vs DC to discern.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "You create a sound or an image of an object within range that lasts for the duration. The illusion ends if you cast this spell again. If a creature takes a Study action to examine the sound or image, the creature can determine that it is an illusion with a successful Intelligence (Investigation) check against your spell save DC. If a creature discerns the illusion for what it is, the illusion becomes faint to the creature. Sound: volume from whisper to scream; can be discrete sounds. Image: object no larger than 5-foot Cube; no sound, light, smell; physical interaction reveals illusion.",
            summary: 'Create sound or 5ft cube image. Study + Int (Investigation) to discern.',
        },
    },
];
