import type { SpellEntry } from '../types';
import { EXTRAPLANAR_CREATURE_TYPES } from '../../monsters';
/**
 * Level 1 spells M–Z — authoring status:
 * - **Attack/save/AoE modeled:** Grease (initial prone save), Guiding Bolt, Healing Word, Hellish Rebuke, Hideous Laughter (Wis + prone/incap), Ice Knife (ranged hit), Inflict Wounds, Longstrider, Magic Missile, Protection from Evil, Ray of Sickness (hit + poisoned), Searing Smite (rider fire), Shield, Shield of Faith, Thunderwave.
 * - **Utility / sense / state:** Heroism (frightened immunity + state), Hex, Hunter's Mark, Jump, Speak with Animals; Identify / Illusory Script / Silent Image (notes + caveats).
 * - **Note-first / heavy caveats:** Goodberry, Purify Food and Drink, Sanctuary, Unseen Servant; Sleep uses caveats for area mapping; engine handles two-stage save + wake on damage (not elves / “doesn’t sleep” — caveat).
 */
export const SPELLS_LEVEL_1_M_Z: readonly SpellEntry[] = [
    {
        id: 'goodberry',
        name: 'Goodberry',
        school: 'conjuration',
        level: 1,
        classes: ['druid', 'ranger'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'self' },
        duration: { kind: 'timed', value: 24, unit: 'hour' },
        components: { verbal: true, somatic: true, material: { description: 'a sprig of mistletoe' } },
        resolution: {
            caveats: [
                'Berry consumption, healing, and nourishment are not tracked in encounter resolution.',
            ],
        },
        effectGroups: [
            {
                effects: [
                    {
                        kind: 'note',
                        text: 'Ten berries appear. Bonus action to eat one: restore 1 HP, nourishment for one day. Uneaten berries disappear when spell ends.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "Ten berries appear in your hand and are infused with magic for the duration. A creature can take a Bonus Action to eat one berry. Eating a berry restores 1 Hit Point, and the berry provides enough nourishment to sustain a creature for one day. Uneaten berries disappear when the spell ends.",
            summary: 'Ten berries: Bonus action to eat, 1 HP and one day nourishment each.',
        },
    },
    {
        id: 'grease',
        name: 'Grease',
        school: 'conjuration',
        level: 1,
        classes: ['sorcerer', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
        duration: { kind: 'timed', value: 1, unit: 'minute' },
        components: { verbal: true, somatic: true, material: { description: 'a bit of pork rind or butter' } },
        resolution: {
            caveats: [
                'Saves when entering the area or ending a turn there are not modeled; only the initial appearance save is represented.',
            ],
        },
        effectGroups: [
            {
                targeting: {
                    selection: 'in-area', targetType: 'creature',
                    area: { kind: 'cube', size: 10 }
                },
                effects: [
                    {
                        kind: 'save',
                        save: { ability: 'dex' },
                        onFail: [{ kind: 'condition', conditionId: 'prone' }],
                    },
                    {
                        kind: 'note',
                        text: 'Ground in the area is Difficult Terrain for the duration. Creatures that enter the area or end their turn there also risk falling Prone (not automated).',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "Nonflammable grease covers the ground in a 10-foot square centered on a point within range and turns it into Difficult Terrain for the duration. When the grease appears, each creature standing in its area must succeed on a Dexterity saving throw or have the Prone condition. A creature that enters the area or ends its turn there must also succeed on that save or fall Prone.",
            summary: '10-foot square Difficult Terrain. Dex save or Prone when appearing, entering, or ending turn.',
        },
    },
    {
        id: 'guiding-bolt',
        name: 'Guiding Bolt',
        school: 'evocation',
        level: 1,
        classes: ['cleric'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 120, unit: 'ft' } },
        duration: { kind: 'instantaneous' },
        components: { verbal: true, somatic: true },
        deliveryMethod: 'ranged-spell-attack',
        effectGroups: [
            {
                targeting: { selection: 'one', targetType: 'creature' },
                effects: [
                    { kind: 'damage', damage: '4d6', damageType: 'radiant' },
                    { kind: 'roll-modifier', appliesTo: 'incoming-attacks', modifier: 'advantage', duration: { kind: 'until-turn-boundary', subject: 'source', turn: 'next', boundary: 'end' } }
                ]
            }
        ],
        scaling: [{ category: 'extra-damage', description: '+1d6 radiant per slot level above 1', mode: 'per-slot-level', startsAtSlotLevel: 2, amount: '1d6' }],
        description: {
            full: "You hurl a bolt of light toward a creature within range. Make a ranged spell attack against the target. On a hit, it takes 4d6 Radiant damage, and the next attack roll made against it before the end of your next turn has Advantage. Using a Higher-Level Spell Slot. The damage increases by 1d6 for each spell slot level above 1.",
            summary: 'Ranged spell attack 4d6 radiant. Next attack against target has Advantage. Scales with slot.',
        },
    },
    {
        id: 'healing-word',
        name: 'Healing Word',
        school: 'abjuration',
        level: 1,
        classes: ['bard', 'cleric', 'druid'],
        castingTime: { normal: { value: 1, unit: 'bonus-action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
        duration: { kind: 'instantaneous' },
        components: { verbal: true },
        effectGroups: [
            {
                targeting: { selection: 'one', targetType: 'creature', requiresSight: true },
                effects: [
                    { kind: 'hit-points', mode: 'heal', value: '2d4', abilityModifier: true }
                ]
            }
        ],
        scaling: [{
                category: 'extra-healing',
                description: 'The healing increases by 2d4 for each spell slot level above 1.',
                mode: 'per-slot-level',
                startsAtSlotLevel: 1,
                amount: '2d4',
            }],
        description: {
            full: 'A creature of your choice that you can see within range regains Hit Points equal to 2d4 plus your spellcasting ability modifier. Using a Higher-Level Spell Slot. The healing increases by 2d4 for each spell slot level above 1.',
            summary: 'A creature you can see within 60 feet regains 2d4 + spellcasting modifier HP.',
        },
    },
    {
        id: 'hellish-rebuke',
        name: 'Hellish Rebuke',
        school: 'evocation',
        level: 1,
        classes: ['warlock'],
        castingTime: {
            normal: {
                value: 1,
                unit: 'reaction',
                trigger: 'in response to taking damage from a creature that you can see within 60 feet of yourself',
            },
            canBeCastAsRitual: false,
        },
        range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
        duration: { kind: 'instantaneous' },
        components: { verbal: true, somatic: true },
        effectGroups: [
            {
                targeting: { selection: 'one', targetType: 'creature' },
                effects: [
                    {
                        kind: 'save',
                        save: { ability: 'dex' },
                        onFail: [{ kind: 'damage', damage: '2d10', damageType: 'fire' }],
                        onSuccess: [{ kind: 'damage', damage: '1d10', damageType: 'fire' }],
                    }
                ]
            }
        ],
        scaling: [{ category: 'extra-damage', description: '+1d10 fire per slot level above 1', mode: 'per-slot-level', startsAtSlotLevel: 2, amount: '1d10' }],
        description: {
            full: "The creature that damaged you is momentarily surrounded by green flames. It makes a Dexterity saving throw, taking 2d10 Fire damage on a failed save or half as much damage on a successful one. Using a Higher-Level Spell Slot. The damage increases by 1d10 for each spell slot level above 1.",
            summary: 'Reaction: creature that damaged you makes Dex save or takes 2d10 fire. Scales with slot.',
        },
    },
    {
        id: 'heroism',
        name: 'Heroism',
        school: 'enchantment',
        level: 1,
        classes: ['bard', 'paladin'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'touch' },
        duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
        components: { verbal: true, somatic: true },
        resolution: {
            caveats: [
                'Temporary Hit Points at the start of each turn are not granted automatically in encounter.',
            ],
        },
        effectGroups: [
            {
                targeting: { selection: 'one', targetType: 'creature', requiresWilling: true },
                effects: [
                    {
                        kind: 'grant',
                        grantType: 'condition-immunity',
                        value: 'frightened',
                    },
                    {
                        kind: 'state',
                        stateId: 'heroism',
                        notes: 'Immune to Frightened; gains Temporary Hit Points equal to your spellcasting ability modifier at the start of each of its turns.',
                    }
                ]
            }
        ],
        scaling: [{ category: 'extra-targets', description: '+1 target per slot level above 1', mode: 'per-slot-level', startsAtSlotLevel: 2 }],
        description: {
            full: "A willing creature you touch is imbued with bravery. Until the spell ends, the creature is immune to the Frightened condition and gains Temporary Hit Points equal to your spellcasting ability modifier at the start of each of its turns. Using a Higher-Level Spell Slot. You can target one additional creature for each spell slot level above 1.",
            summary: 'Touch: immune to Frightened, temp HP each turn. Scales with targets.',
        },
    },
    {
        id: 'hex',
        name: 'Hex',
        school: 'enchantment',
        level: 1,
        classes: ['warlock'],
        castingTime: { normal: { value: 1, unit: 'bonus-action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 90, unit: 'ft' } },
        duration: { kind: 'timed', value: 1, unit: 'hour', concentration: true, upTo: true },
        components: { verbal: true, somatic: true, material: { description: 'the petrified eye of a newt' } },
        resolution: {
            caveats: [
                'Bonus damage on hit, chosen-ability check Disadvantage, and moving the curse after a kill are not enforced in encounter.',
            ],
            casterOptions: [
                { kind: 'ability', id: 'hex-disadvantage-ability', label: 'Ability checks (Disadvantage)' },
            ],
        },
        effectGroups: [
            {
                targeting: { selection: 'one', targetType: 'creature', requiresSight: true },
                effects: [
                    {
                        kind: 'state',
                        stateId: 'hex',
                        notes: '+1d6 Necrotic when you hit the cursed target; Disadvantage on ability checks with one ability you choose; Bonus Action to move curse if target drops to 0 HP.',
                    },
                    {
                        kind: 'note',
                        text: 'Concentration duration extends with higher-level slots (2: up to 4 hours; 3–4: up to 8 hours; 5+: 24 hours).',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "You place a curse on a creature that you can see within range. Until the spell ends, you deal an extra 1d6 Necrotic damage to the target whenever you hit it with an attack roll. Also, choose one ability when you cast the spell. The target has Disadvantage on ability checks made with the chosen ability. If the target drops to 0 Hit Points before this spell ends, you can take a Bonus Action on a later turn to curse a new creature. Using a Higher-Level Spell Slot. Your Concentration can last longer with a spell slot of level 2 (up to 4 hours), 3–4 (up to 8 hours), or 5+ (24 hours).",
            summary: 'Curse: +1d6 necrotic on hit, Disadvantage on chosen ability. Move curse on kill. Duration scales.',
        },
    },
    {
        id: 'hideous-laughter',
        name: 'Hideous Laughter',
        school: 'enchantment',
        level: 1,
        classes: ['bard', 'warlock', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 30, unit: 'ft' } },
        duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
        components: { verbal: true, somatic: true, material: { description: 'a tart and a feather' } },
        resolution: {
            caveats: [
                'Repeat saves at end of turn and when taking damage (Advantage if damaged) are not enforced.',
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
                            { kind: 'condition', conditionId: 'prone' },
                            { kind: 'condition', conditionId: 'incapacitated' },
                        ],
                    },
                    {
                        kind: 'note',
                        text: 'Target laughs and cannot stand from Prone while the spell lasts. Repeat save each turn and when damaged. Scales with extra targets at higher slots.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        scaling: [{ category: 'extra-targets', description: '+1 target per slot level above 1', mode: 'per-slot-level', startsAtSlotLevel: 2 }],
        description: {
            full: "One creature of your choice that you can see within range makes a Wisdom saving throw. On a failed save, it has the Prone and Incapacitated conditions for the duration. During that time, it laughs uncontrollably if it's capable of laughter, and it can't end the Prone condition on itself. At the end of each of its turns and each time it takes damage, it makes another Wisdom saving throw. The target has Advantage on the save if the save is triggered by damage. On a successful save, the spell ends. Using a Higher-Level Spell Slot. You can target one additional creature for each spell slot level above 1.",
            summary: 'Wis save or Prone and Incapacitated. Repeat save at end of turn and when damaged.',
        },
    },
    {
        id: 'hunters-mark',
        name: "Hunter's Mark",
        school: 'divination',
        level: 1,
        classes: ['ranger'],
        castingTime: { normal: { value: 1, unit: 'bonus-action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 90, unit: 'ft' } },
        duration: { kind: 'timed', value: 1, unit: 'hour', concentration: true, upTo: true },
        components: { verbal: true },
        resolution: {
            caveats: [
                'Bonus damage on hit, Perception/Survival Advantage, and moving the mark after a kill are not enforced in encounter.',
            ],
        },
        effectGroups: [
            {
                targeting: { selection: 'one', targetType: 'creature', requiresSight: true },
                effects: [
                    {
                        kind: 'state',
                        stateId: 'hunters-mark',
                        notes: '+1d6 Force on hit; Advantage on Wisdom (Perception or Survival) to find the quarry; Bonus Action to move mark if target drops to 0 HP.',
                    },
                    {
                        kind: 'note',
                        text: 'Concentration duration extends with higher-level slots (3–4: up to 8 hours; 5+: up to 24 hours).',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "You magically mark one creature you can see within range as your quarry. Until the spell ends, you deal an extra 1d6 Force damage to the target whenever you hit it with an attack roll. You also have Advantage on any Wisdom (Perception or Survival) check you make to find it. If the target drops to 0 Hit Points before this spell ends, you can take a Bonus Action to move the mark to a new creature you can see within range. Using a Higher-Level Spell Slot. Your Concentration can last longer with a spell slot of level 3–4 (up to 8 hours) or 5+ (up to 24 hours).",
            summary: 'Mark quarry: +1d6 force on hit, Advantage to find. Move mark on kill. Duration scales.',
        },
    },
    {
        id: 'ice-knife',
        name: 'Ice Knife',
        school: 'conjuration',
        level: 1,
        classes: ['druid', 'sorcerer', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
        duration: { kind: 'instantaneous' },
        components: { somatic: true, material: { description: 'a drop of water or a piece of ice' } },
        deliveryMethod: 'ranged-spell-attack',
        resolution: {
            caveats: [
                'Explosion occurs on hit or miss; secondary Dex save and cold damage to creatures within 5 feet are not fully modeled.',
            ],
        },
        effectGroups: [
            {
                targeting: { selection: 'one', targetType: 'creature', requiresSight: true },
                effects: [
                    { kind: 'damage', damage: '1d10', damageType: 'piercing' },
                    {
                        kind: 'note',
                        text: 'Hit or miss, the shard explodes: the target and each creature within 5 feet of it Dex save or 2d6 Cold damage. +1d6 cold per slot level above 1.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        scaling: [{ category: 'extra-damage', description: '+1d6 cold per slot level above 1 (explosion)', mode: 'per-slot-level', startsAtSlotLevel: 2, amount: '1d6' }],
        description: {
            full: "You create a shard of ice and fling it at one creature within range. Make a ranged spell attack against the target. On a hit, the target takes 1d10 Piercing damage. Hit or miss, the shard then explodes. The target and each creature within 5 feet of it must succeed on a Dexterity saving throw or take 2d6 Cold damage. Using a Higher-Level Spell Slot. The Cold damage increases by 1d6 for each spell slot level above 1.",
            summary: 'Ranged spell attack 1d10 piercing; explosion 2d6 cold in 5ft. Cold scales with slot.',
        },
    },
    {
        id: 'identify',
        name: 'Identify',
        school: 'divination',
        level: 1,
        classes: ['bard', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'minute' }, canBeCastAsRitual: true },
        range: { kind: 'touch' },
        duration: { kind: 'instantaneous' },
        components: { verbal: true, somatic: true, material: { description: 'a pearl worth 100+ GP', cost: { value: 100, unit: 'gp', atLeast: true } } },
        resolution: {
            caveats: [
                'Item/creature analysis and lore reveal are not enforced in encounter.',
            ],
        },
        effectGroups: [
            {
                effects: [
                    {
                        kind: 'note',
                        text: 'Touch object: learn magic item properties, attunement, charges, ongoing spells. Touch creature: learn spells affecting it.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "You touch an object throughout the spell's casting. If the object is a magic item or some other magical object, you learn its properties and how to use them, whether it requires Attunement, and how many charges it has, if any. You learn whether any ongoing spells are affecting the item and what they are. If the item was created by a spell, you learn that spell's name. If you instead touch a creature throughout the casting, you learn which ongoing spells, if any, are currently affecting it.",
            summary: 'Touch object or creature to learn magical properties and affecting spells.',
        },
    },
    {
        id: 'illusory-script',
        name: 'Illusory Script',
        school: 'illusion',
        level: 1,
        classes: ['bard', 'warlock', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'minute' }, canBeCastAsRitual: true },
        range: { kind: 'touch' },
        duration: { kind: 'timed', value: 10, unit: 'day' },
        components: { somatic: true, material: { description: 'ink worth 10+ GP', cost: { value: 10, unit: 'gp', atLeast: true }, consumed: true } },
        resolution: {
            caveats: [
                'Designated readers, altered meaning, and dispel interactions are not enforced in encounter.',
            ],
        },
        effectGroups: [
            {
                effects: [
                    {
                        kind: 'note',
                        text: 'Writing appears normal to designated creatures, unintelligible to others. Can alter meaning, handwriting, language. Truesight reveals hidden message.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "You write on parchment, paper, or another suitable material and imbue it with an illusion that lasts for the duration. To you and any creatures you designate when you cast the spell, the writing appears normal, seems to be written in your hand, and conveys whatever meaning you intended when you wrote the text. To all others, the writing appears as if it were written in an unknown or magical script that is unintelligible. Alternatively, the illusion can alter the meaning, handwriting, and language of the text, though the language must be one you know. If the spell is dispelled, the original script and the illusion both disappear. A creature that has Truesight can read the hidden message.",
            summary: 'Writing appears normal to designated creatures, unintelligible to others. Truesight reveals.',
        },
    },
    {
        id: 'inflict-wounds',
        name: 'Inflict Wounds',
        school: 'necromancy',
        level: 1,
        classes: ['cleric'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'touch' },
        duration: { kind: 'instantaneous' },
        components: { verbal: true, somatic: true },
        effectGroups: [
            {
                targeting: { selection: 'one', targetType: 'creature' },
                effects: [
                    {
                        kind: 'save',
                        save: { ability: 'con' },
                        onFail: [{ kind: 'damage', damage: '2d10', damageType: 'necrotic' }],
                        onSuccess: [{ kind: 'damage', damage: '1d10', damageType: 'necrotic' }],
                    }
                ]
            }
        ],
        scaling: [{ category: 'extra-damage', description: '+1d10 necrotic per slot level above 1', mode: 'per-slot-level', startsAtSlotLevel: 2, amount: '1d10' }],
        description: {
            full: "A creature you touch makes a Constitution saving throw, taking 2d10 Necrotic damage on a failed save or half as much damage on a successful one. Using a Higher-Level Spell Slot. The damage increases by 1d10 for each spell slot level above 1.",
            summary: 'Touch: Con save or 2d10 necrotic. Scales with slot.',
        },
    },
    {
        id: 'jump',
        name: 'Jump',
        school: 'transmutation',
        level: 1,
        classes: ['druid', 'ranger', 'sorcerer', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'bonus-action' }, canBeCastAsRitual: false },
        range: { kind: 'touch' },
        duration: { kind: 'timed', value: 1, unit: 'minute' },
        components: { verbal: true, somatic: true, material: { description: "a grasshopper's hind leg" } },
        resolution: {
            caveats: [
                'Jump distance and movement trade are not applied automatically to movement in encounter.',
            ],
        },
        effectGroups: [
            {
                targeting: { selection: 'one', targetType: 'creature', requiresWilling: true },
                effects: [
                    {
                        kind: 'state',
                        stateId: 'jump',
                        notes: 'Once on each of its turns, can jump up to 30 feet by spending 10 feet of movement.',
                    }
                ]
            }
        ],
        scaling: [{ category: 'extra-targets', description: '+1 target per slot level above 1', mode: 'per-slot-level', startsAtSlotLevel: 2 }],
        description: {
            full: "You touch a willing creature. Once on each of its turns until the spell ends, that creature can jump up to 30 feet by spending 10 feet of movement. Using a Higher-Level Spell Slot. You can target one additional creature for each spell slot level above 1.",
            summary: 'Touch: jump 30ft for 10ft movement, once per turn. Scales with targets.',
        },
    },
    {
        id: 'longstrider',
        name: 'Longstrider',
        school: 'transmutation',
        level: 1,
        classes: ['bard', 'druid', 'ranger', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'touch' },
        duration: { kind: 'timed', value: 1, unit: 'hour' },
        components: { verbal: true, somatic: true, material: { description: 'a pinch of dirt' } },
        effectGroups: [
            {
                targeting: { selection: 'one', targetType: 'creature' },
                effects: [
                    { kind: 'modifier', target: 'speed', mode: 'add', value: 10 }
                ]
            }
        ],
        scaling: [{ category: 'extra-targets', description: '+1 target per slot level above 1', mode: 'per-slot-level', startsAtSlotLevel: 2 }],
        description: {
            full: "You touch a creature. The target's Speed increases by 10 feet until the spell ends. Using a Higher-Level Spell Slot. You can target one additional creature for each spell slot level above 1.",
            summary: 'Touch: Speed +10 ft per target. Scales with targets.',
        },
    },
    {
        id: 'mage-armor',
        name: 'Mage Armor',
        school: 'abjuration',
        level: 1,
        classes: ['sorcerer', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'touch' },
        duration: { kind: 'timed', value: 8, unit: 'hour' },
        components: { verbal: true, somatic: true, material: { description: 'a piece of cured leather' } },
        resolution: {
            caveats: [
                'Encounter UI does not auto-sync character loadout; call encounter equipment patch or refresh combatant when armor changes.',
            ],
        },
        effectGroups: [
            {
                targeting: { selection: 'one', targetType: 'creature', requiresWilling: true },
                effects: [
                    {
                        kind: 'modifier',
                        target: 'armor_class',
                        mode: 'set',
                        value: 13,
                        condition: {
                            kind: 'state',
                            target: 'self',
                            property: 'equipment.armorEquipped',
                            equals: null,
                        },
                    },
                    {
                        kind: 'note',
                        text: 'True AC is 13 + Dexterity modifier while the spell applies.',
                        category: 'flavor' as const,
                    }
                ]
            }
        ],
        description: {
            full: "You touch a willing creature who isn't wearing armor. Until the spell ends, the target's base AC becomes 13 plus its Dexterity modifier. The spell ends early if the target dons armor.",
            summary: 'Touch unarmored willing creature: AC 13 + Dex for 8 hours.',
        },
    },
    {
        id: 'magic-missile',
        name: 'Magic Missile',
        school: 'evocation',
        level: 1,
        classes: ['sorcerer', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 120, unit: 'ft' } },
        duration: { kind: 'instantaneous' },
        components: { verbal: true, somatic: true },
        effectGroups: [
            {
                targeting: {
                    selection: 'chosen', targetType: 'creature',
                    rangeFeet: 120,
                    requiresSight: true,
                    count: 3,
                    canSelectSameTargetMultipleTimes: true
                },
                effects: [
                    {
                        kind: 'damage',
                        damage: '1d4+1',
                        damageType: 'force',
                        instances: {
                            count: 3,
                            simultaneous: true,
                            canSplitTargets: true,
                            canStackOnSingleTarget: true,
                        },
                    },
                    {
                        kind: 'note',
                        text: 'Each dart hits automatically and can be directed at one creature or split among several creatures you can see within range.',
                    }
                ]
            }
        ],
        scaling: [{ category: 'extra-damage', description: 'One additional dart per slot level above 1st.', mode: 'per-slot-level', startsAtSlotLevel: 1 }],
        description: {
            full: 'You create three glowing darts of magical force. Each dart strikes a creature of your choice that you can see within range. A dart deals 1d4 + 1 Force damage to its target. The darts all strike simultaneously, and you can direct them to hit one creature or several.',
            summary: 'Three automatic-hit darts deal 1d4 + 1 force damage each and can be split among visible creatures in range.',
        },
    },
    {
        id: 'protection-from-evil',
        name: 'Protection from Evil and Good',
        school: 'abjuration',
        level: 1,
        classes: ['cleric', 'druid', 'paladin', 'warlock', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'touch' },
        duration: { kind: 'timed', value: 10, unit: 'minute', concentration: true },
        components: { verbal: true, somatic: true, material: { description: 'a flask of Holy Water', cost: { value: 25, unit: 'gp', atLeast: true }, consumed: true } },
        effectGroups: [
            {
                targeting: {
                    selection: 'one', targetType: 'creature',
                    requiresWilling: true
                },
                effects: [
                    {
                        kind: 'roll-modifier',
                        appliesTo: 'incoming-attacks',
                        modifier: 'disadvantage',
                        condition: EXTRAPLANAR_CREATURE_TYPES,
                    },
                    {
                        kind: 'grant',
                        grantType: 'condition-immunity',
                        value: 'charmed',
                        condition: EXTRAPLANAR_CREATURE_TYPES,
                        text: 'Also immune to possession from these creature types.',
                    },
                    {
                        kind: 'grant',
                        grantType: 'condition-immunity',
                        value: 'frightened',
                        condition: EXTRAPLANAR_CREATURE_TYPES,
                    },
                    {
                        kind: 'note',
                        text: 'If the target is already possessed, Charmed, or Frightened by such a creature, the target has Advantage on any new saving throw against the relevant effect.',
                    }
                ]
            }
        ],
        description: {
            full: 'Until the spell ends, one willing creature you touch is protected against creatures that are Aberrations, Celestials, Elementals, Fey, Fiends, or Undead. The protection grants several benefits. Creatures of those types have Disadvantage on attack rolls against the target. The target also can\'t be possessed by or gain the Charmed or Frightened conditions from them. If the target is already possessed, Charmed, or Frightened by such a creature, the target has Advantage on any new saving throw against the relevant effect.',
            summary: 'Touch a willing creature to protect it against Aberrations, Celestials, Elementals, Fey, Fiends, and Undead for up to 10 minutes.',
        },
    },
    {
        id: 'purify-food-and-drink',
        name: 'Purify Food and Drink',
        school: 'transmutation',
        level: 1,
        classes: ['cleric', 'druid', 'paladin'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: true },
        range: { kind: 'distance', value: { value: 10, unit: 'ft' } },
        duration: { kind: 'instantaneous' },
        components: { verbal: true, somatic: true },
        resolution: {
            caveats: [
                'Purification of supplies is narrative only; not tracked in encounter.',
            ],
        },
        effectGroups: [
            {
                effects: [
                    {
                        kind: 'note',
                        text: '5-foot-radius Sphere centered on a point in range: remove poison and rot from nonmagical food and drink in that area.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "You remove poison and rot from nonmagical food and drink in a 5-foot-radius Sphere centered on a point within range.",
            summary: 'Purifies nonmagical food and drink in 5-foot sphere.',
        },
    },
    {
        id: 'ray-of-sickness',
        name: 'Ray of Sickness',
        school: 'necromancy',
        level: 1,
        classes: ['sorcerer', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
        duration: { kind: 'instantaneous' },
        components: { verbal: true, somatic: true },
        deliveryMethod: 'ranged-spell-attack',
        resolution: {
            caveats: [
                'If Poisoned duration is not honored at the table, clear it at the end of your next turn.',
            ],
        },
        effectGroups: [
            {
                targeting: { selection: 'one', targetType: 'creature', requiresSight: true },
                effects: [
                    { kind: 'damage', damage: '2d8', damageType: 'poison' },
                    {
                        kind: 'condition',
                        conditionId: 'poisoned',
                        duration: { kind: 'until-turn-boundary', subject: 'source', turn: 'next', boundary: 'end' },
                    }
                ]
            }
        ],
        scaling: [{ category: 'extra-damage', description: '+1d8 poison per slot level above 1', mode: 'per-slot-level', startsAtSlotLevel: 2, amount: '1d8' }],
        description: {
            full: "You shoot a greenish ray at a creature within range. Make a ranged spell attack against the target. On a hit, the target takes 2d8 Poison damage and has the Poisoned condition until the end of your next turn. Using a Higher-Level Spell Slot. The damage increases by 1d8 for each spell slot level above 1.",
            summary: 'Ranged spell attack: 2d8 poison, Poisoned until end of next turn. +1d8 per slot.',
        },
    },
    {
        id: 'sanctuary',
        name: 'Sanctuary',
        school: 'abjuration',
        level: 1,
        classes: ['cleric'],
        castingTime: { normal: { value: 1, unit: 'bonus-action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 30, unit: 'ft' } },
        duration: { kind: 'timed', value: 1, unit: 'minute' },
        components: { verbal: true, somatic: true, material: { description: 'a shard of glass from a mirror' } },
        resolution: {
            caveats: [
                'Ward save for attackers and “choose new target or lose the attack” are not enforced in encounter.',
            ],
        },
        effectGroups: [
            {
                targeting: { selection: 'one', targetType: 'creature', requiresSight: true },
                effects: [
                    {
                        kind: 'note',
                        text: 'Creatures that target the ward with an attack or damaging spell must succeed on a Wis save or choose a new target or lose the attack/spell. No protection from areas of effect. Ends if the warded creature attacks, casts a spell, or deals damage.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "You ward a creature within range. Until the spell ends, any creature who targets the warded creature with an attack roll or a damaging spell must succeed on a Wisdom saving throw or either choose a new target or lose the attack or spell. This spell doesn't protect the warded creature from areas of effect. The spell ends if the warded creature makes an attack roll, casts a spell, or deals damage.",
            summary: 'Ward creature: Wis save or attackers lose target. Ends if warded creature attacks or deals damage.',
        },
    },
    {
        id: 'searing-smite',
        name: 'Searing Smite',
        school: 'evocation',
        level: 1,
        classes: ['paladin'],
        castingTime: {
            normal: {
                value: 1,
                unit: 'bonus-action',
                trigger: 'immediately after hitting a target with a Melee weapon or an Unarmed Strike',
            },
            canBeCastAsRitual: false,
        },
        range: { kind: 'self' },
        duration: { kind: 'timed', value: 1, unit: 'minute' },
        components: { verbal: true },
        resolution: {
            caveats: [
                'Bonus-action rider after a melee hit; ongoing fire at turn start and Con save to end are not enforced in encounter.',
            ],
        },
        effectGroups: [
            {
                targeting: { selection: 'one', targetType: 'creature' },
                effects: [
                    { kind: 'damage', damage: '1d6', damageType: 'fire' },
                    {
                        kind: 'note',
                        text: "At the start of each of the target's turns: 1d6 Fire damage, then Con save; success ends the spell.",
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        scaling: [{ category: 'extra-damage', description: '+1d6 fire per spell slot level above 1 (initial and ongoing damage)', mode: 'per-slot-level', startsAtSlotLevel: 2, amount: '1d6' }],
        description: {
            full: "As you hit the target, it takes an extra 1d6 Fire damage from the attack. At the start of each of its turns until the spell ends, the target takes 1d6 Fire damage and then makes a Constitution saving throw. On a failed save, the spell continues. On a successful save, the spell ends. Using a Higher-Level Spell Slot. All the damage increases by 1d6 for each spell slot level above 1.",
            summary: 'Extra 1d6 fire on hit. 1d6 fire each turn, Con save ends. +1d6 per slot.',
        },
    },
    {
        id: 'shield',
        name: 'Shield',
        school: 'abjuration',
        level: 1,
        classes: ['sorcerer', 'wizard'],
        castingTime: {
            normal: {
                value: 1,
                unit: 'reaction',
                trigger: 'when you are hit by an attack or targeted by the magic missile spell',
            },
            canBeCastAsRitual: false,
        },
        range: { kind: 'self' },
        duration: {
            kind: 'until-turn-boundary',
            subject: 'self',
            turn: 'next',
            boundary: 'start',
        },
        components: { verbal: true, somatic: true },
        effectGroups: [
            {
                effects: [
                    {
                        kind: 'modifier',
                        target: 'armor_class',
                        mode: 'add',
                        value: 5,
                        text: 'Including against the triggering attack.',
                    },
                    {
                        kind: 'immunity',
                        scope: 'spell',
                        spellIds: ['magic-missile'],
                        duration: {
                            kind: 'until-turn-boundary',
                            subject: 'self',
                            turn: 'next',
                            boundary: 'start',
                        },
                        notes: 'You take no damage from Magic Missile.',
                    }
                ]
            }
        ],
        description: {
            full: 'An imperceptible barrier of magical force protects you. Until the start of your next turn, you have a +5 bonus to AC, including against the triggering attack, and you take no damage from Magic Missile.',
            summary: 'Reaction spell that grants +5 AC until the start of your next turn and negates Magic Missile damage.',
        },
    },
    {
        id: 'shield-of-faith',
        name: 'Shield of Faith',
        school: 'abjuration',
        level: 1,
        classes: ['cleric', 'paladin'],
        castingTime: { normal: { value: 1, unit: 'bonus-action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
        duration: { kind: 'timed', value: 10, unit: 'minute', concentration: true, upTo: true },
        components: { verbal: true, somatic: true, material: { description: 'a prayer scroll' } },
        effectGroups: [
            {
                targeting: { selection: 'one', targetType: 'creature' },
                effects: [
                    { kind: 'modifier', target: 'armor_class', mode: 'add', value: 2 }
                ]
            }
        ],
        description: {
            full: "A shimmering field surrounds a creature of your choice within range, granting it a +2 bonus to AC for the duration.",
            summary: '+2 AC for one creature. Concentration.',
        },
    },
    {
        id: 'silent-image',
        name: 'Silent Image',
        school: 'illusion',
        level: 1,
        classes: ['bard', 'sorcerer', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
        duration: { kind: 'timed', value: 10, unit: 'minute', concentration: true, upTo: true },
        components: { verbal: true, somatic: true, material: { description: 'a bit of fleece' } },
        resolution: {
            caveats: [
                'Illusion movement, interaction, and Investigation checks are not enforced in encounter.',
            ],
        },
        effectGroups: [
            {
                effects: [
                    {
                        kind: 'note',
                        text: 'Image of object/creature/phenomenon up to 15ft cube. Purely visual. Magic action to move. Physical interaction reveals illusion. Study + Int (Investigation) vs DC to discern.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "You create the image of an object, a creature, or some other visible phenomenon that is no larger than a 15-foot Cube. The image appears at a spot within range and lasts for the duration. The image is purely visual; it isn't accompanied by sound, smell, or other sensory effects. As a Magic action, you can cause the image to move to any spot within range. As the image changes location, you can alter its appearance so that its movements appear natural for the image. Physical interaction with the image reveals it to be an illusion, since things can pass through it. A creature that takes a Study action to examine the image can determine that it is an illusion with a successful Intelligence (Investigation) check against your spell save DC. If a creature discerns the illusion for what it is, the creature can see through the image.",
            summary: '15ft cube image. Purely visual. Magic action to move. Study to discern.',
        },
    },
    {
        id: 'sleep',
        name: 'Sleep',
        school: 'enchantment',
        level: 1,
        classes: ['bard', 'sorcerer', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
        duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
        components: { verbal: true, somatic: true, material: { description: 'a pinch of sand or rose petals' } },
        resolution: {
            caveats: [
                'Encounter maps area spells to all living enemies only; no creature choice or geometry inside the sphere.',
                'Creatures that do not sleep (e.g. elves) are not auto-succeed modeled; only Immunity to Exhaustion grants auto-success on saves.',
                'Waking a creature within 5 feet using an action is not automated.',
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
                        save: { ability: 'wis' },
                        autoSuccessIfImmuneTo: 'exhaustion',
                        onFail: [
                            {
                                kind: 'condition',
                                conditionId: 'incapacitated',
                                repeatSave: {
                                    ability: 'wis',
                                    timing: 'turn-end',
                                    singleAttempt: true,
                                    onFail: {
                                        addCondition: 'unconscious',
                                        markerClassification: ['sleep'],
                                    },
                                    autoSuccessIfImmuneTo: 'exhaustion',
                                },
                            },
                        ],
                    }
                ]
            }
        ],
        description: {
            full: "Each creature of your choice in a 5-foot-radius Sphere centered on a point within range must succeed on a Wisdom saving throw or have the Incapacitated condition until the end of its next turn, at which point it must repeat the save. If the target fails the second save, the target has the Unconscious condition for the duration. The spell ends on a target if it takes damage or someone within 5 feet of it takes an action to shake it out of the spell's effect. Creatures that don't sleep, such as elves, or that have Immunity to the Exhaustion condition automatically succeed on saves against this spell.",
            summary: '5ft sphere: Wis save or Incapacitated, repeat save or Unconscious. Ends on damage.',
        },
    },
    {
        id: 'speak-with-animals',
        name: 'Speak with Animals',
        school: 'divination',
        level: 1,
        classes: ['bard', 'druid', 'ranger', 'warlock'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: true },
        range: { kind: 'self' },
        duration: { kind: 'timed', value: 10, unit: 'minute' },
        components: { verbal: true, somatic: true },
        effectGroups: [
            {
                effects: [
                    { kind: 'state', stateId: 'speak-with-animals', notes: 'Comprehend and verbally communicate with Beasts. Use Influence skill options.' },
                    { kind: 'note', text: 'Beasts can give info about nearby locations and monsters (past day).', category: 'flavor' as const }
                ]
            }
        ],
        description: {
            full: "For the duration, you can comprehend and verbally communicate with Beasts, and you can use any of the Influence action's skill options with them. Most Beasts have little to say about topics that don't pertain to survival or companionship, but at minimum, a Beast can give you information about nearby locations and monsters, including whatever it has perceived within the past day.",
            summary: 'Speak with Beasts. Use Influence. Info about nearby locations and monsters.',
        },
    },
    {
        id: 'thunderwave',
        name: 'Thunderwave',
        school: 'evocation',
        level: 1,
        classes: ['bard', 'druid', 'sorcerer', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'self' },
        duration: { kind: 'instantaneous' },
        components: { verbal: true, somatic: true },
        effectGroups: [
            {
                targeting: { selection: 'in-area', targetType: 'creature', area: { kind: 'cube', size: 15 } },
                effects: [
                    {
                        kind: 'save',
                        save: { ability: 'con' },
                        onFail: [
                            { kind: 'damage', damage: '2d8', damageType: 'thunder' },
                            { kind: 'move', distance: 10, forced: true },
                        ],
                        onSuccess: [{ kind: 'damage', damage: '1d8', damageType: 'thunder' }],
                    },
                    { kind: 'note', text: 'Unsecured objects entirely within the Cube are pushed 10 feet away. Thunderous boom audible within 300 feet.', category: 'flavor' as const }
                ]
            }
        ],
        scaling: [{ category: 'extra-damage', description: '+1d8 thunder per slot level above 1', mode: 'per-slot-level', startsAtSlotLevel: 2, amount: '1d8' }],
        description: {
            full: "You unleash a wave of thunderous energy. Each creature in a 15-foot Cube originating from you makes a Constitution saving throw. On a failed save, a creature takes 2d8 Thunder damage and is pushed 10 feet away from you. On a successful save, a creature takes half as much damage only. In addition, unsecured objects that are entirely within the Cube are pushed 10 feet away from you, and a thunderous boom is audible within 300 feet. Using a Higher-Level Spell Slot. The damage increases by 1d8 for each spell slot level above 1.",
            summary: '15-foot cube: Con save or 2d8 thunder + 10ft push. Damage scales with slot.',
        },
    },
    {
        id: 'unseen-servant',
        name: 'Unseen Servant',
        school: 'conjuration',
        level: 1,
        classes: ['bard', 'warlock', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: true },
        range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
        duration: { kind: 'timed', value: 1, unit: 'hour' },
        components: { verbal: true, somatic: true, material: { description: 'a bit of string and of wood' } },
        resolution: {
            caveats: [
                'No combatant or object-interaction simulation; servant tasks and range limit are narrative only.',
            ],
        },
        effectGroups: [
            {
                effects: [
                    {
                        kind: 'note',
                        text: 'Invisible mindless force performs simple tasks. AC 10, 1 HP, Str 2. Bonus action: move 15ft and interact. Ends if >60ft from you.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "This spell creates an Invisible, mindless, shapeless, Medium force that performs simple tasks at your command until the spell ends. The servant springs into existence in an unoccupied space on the ground within range. It has AC 10, 1 Hit Point, and a Strength of 2, and it can't attack. If it drops to 0 Hit Points, the spell ends. Once on each of your turns as a Bonus Action, you can mentally command the servant to move up to 15 feet and interact with an object. The servant can perform simple tasks that a human could do, such as fetching things, cleaning, mending, folding clothes, lighting fires, serving food, and pouring drinks. Once you give the command, the servant performs the task to the best of its ability until it completes the task, then waits for your next command. If you command the servant to perform a task that would move it more than 60 feet away from you, the spell ends.",
            summary: 'Invisible servant performs simple tasks. Bonus action to command. Ends if >60ft away.',
        },
    },
];
