import type { SpellEntry } from '../types';
/**
 * Level 9 spells (ids **m–z**) — authoring status:
 * - **Attack/save/AoE modeled:** Meteor Swarm, Weird (Wis save + damage).
 * - **Healing / death:** Mass Heal, Power Word Heal, Power Word Kill (`hpThreshold`), True Resurrection.
 * - **Note-first / reality-altering:** Prismatic Wall, Shapechange, Storm of Vengeance, Time Stop, True Polymorph, Wish.
 */
export const SPELLS_LEVEL_9_M_Z: readonly SpellEntry[] = [
    {
        id: 'mass-heal',
        name: 'Mass Heal',
        school: 'abjuration',
        level: 9,
        classes: ['cleric'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
        duration: { kind: 'instantaneous' },
        components: { verbal: true, somatic: true },
        resolution: {
            caveats: [
                '700 HP is split among any number of chosen visible creatures; pool is not auto-distributed.',
            ],
        },
        effectGroups: [
            {
                targeting: { selection: 'chosen', targetType: 'creature', requiresSight: true },
                effects: [
                    { kind: 'hit-points', mode: 'heal', value: 700 },
                    { kind: 'note', text: 'Up to 700 HP divided among chosen creatures. Also ends Blinded, Deafened, and Poisoned conditions.', category: 'under-modeled' as const }
                ]
            }
        ],
        description: {
            full: "A flood of healing energy flows from you into creatures around you. You restore up to 700 Hit Points, divided as you choose among any number of creatures that you can see within range. Creatures healed by this spell also have the Blinded, Deafened, and Poisoned conditions removed from them.",
            summary: 'Restore up to 700 HP total. Ends Blinded, Deafened, Poisoned.',
        },
    },
    {
        id: 'meteor-swarm',
        name: 'Meteor Swarm',
        school: 'evocation',
        level: 9,
        classes: ['sorcerer', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 5280, unit: 'ft' } },
        duration: { kind: 'instantaneous' },
        components: { verbal: true, somatic: true },
        resolution: {
            caveats: [
                'Four separate 40-foot spheres; a creature in overlapping areas is affected only once (use highest single application).',
            ],
        },
        effectGroups: [
            {
                targeting: { selection: 'in-area', targetType: 'creature', area: { kind: 'sphere', size: 40 } },
                effects: [
                    {
                        kind: 'save',
                        save: { ability: 'dex' },
                        onFail: [
                            { kind: 'damage', damage: '20d6', damageType: 'fire' },
                            { kind: 'damage', damage: '20d6', damageType: 'bludgeoning' },
                        ],
                        onSuccess: [
                            { kind: 'damage', damage: '10d6', damageType: 'fire' },
                            { kind: 'damage', damage: '10d6', damageType: 'bludgeoning' },
                        ],
                    },
                    { kind: 'note', text: 'Four 40-foot-radius spheres centered on points you choose within range. A creature in multiple areas is affected only once.', category: 'under-modeled' as const },
                    { kind: 'note', text: 'Flammable objects start burning.', category: 'flavor' as const }
                ]
            }
        ],
        description: {
            full: "Blazing orbs of fire plummet to the ground at four different points you can see within range. Each creature in a 40-foot-radius Sphere centered on each of those points makes a Dexterity saving throw. A creature takes 20d6 Fire damage and 20d6 Bludgeoning damage on a failed save or half as much damage on a successful one. A creature in the area of more than one fiery Sphere is affected only once. A nonmagical object that isn't being worn or carried also takes the damage if it's in the spell's area, and the object starts burning if it's flammable.",
            summary: 'Four 40ft spheres. Dex save or 20d6 fire + 20d6 bludgeoning each.',
        },
    },
    {
        id: 'power-word-heal',
        name: 'Power Word Heal',
        school: 'enchantment',
        level: 9,
        classes: ['bard', 'cleric'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
        duration: { kind: 'instantaneous' },
        components: { verbal: true },
        resolution: {
            caveats: [
                '“Restore all HP” and condition cleanup are not represented as a numeric heal roll.',
            ],
        },
        effectGroups: [
            {
                targeting: { selection: 'one', targetType: 'creature', requiresSight: true },
                effects: [
                    { kind: 'note', text: 'Target regains all HP. Ends Charmed, Frightened, Paralyzed, Poisoned, and Stunned conditions. Prone target can use Reaction to stand.', category: 'under-modeled' as const }
                ]
            }
        ],
        description: {
            full: "A wave of healing energy washes over one creature you can see within range. The target regains all its Hit Points. If the creature has the Charmed, Frightened, Paralyzed, Poisoned, or Stunned condition, the condition ends. If the creature has the Prone condition, it can use its Reaction to stand up.",
            summary: 'Full heal. Ends Charmed, Frightened, Paralyzed, Poisoned, Stunned. Prone can stand.',
        },
    },
    {
        id: 'power-word-kill',
        name: 'Power Word Kill',
        school: 'enchantment',
        level: 9,
        classes: ['bard', 'sorcerer', 'warlock', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
        duration: { kind: 'instantaneous' },
        components: { verbal: true },
        effectGroups: [
            {
                targeting: { selection: 'one', targetType: 'creature' },
                effects: [
                    // Overkill damage when at/below threshold — instant death for typical encounter HP (does not model “die regardless of HP” verbatim).
                    { kind: 'damage', damage: '5000', damageType: 'psychic' }
                ]
            }
        ],
        resolution: {
            caveats: [
                'At or below 100 HP: death is narrative; overkill damage is a stand-in for automation.',
            ],
            hpThreshold: {
                maxHp: 100,
                aboveMaxHpEffects: [{ kind: 'damage', damage: '12d12', damageType: 'psychic' }],
            },
        },
        description: {
            full: "You compel one creature you can see within range to die. If the target has 100 Hit Points or fewer, it dies. Otherwise, it takes 12d12 Psychic damage.",
            summary: '100 HP or fewer: die. Otherwise 12d12 psychic.',
        },
    },
    {
        id: 'prismatic-wall',
        name: 'Prismatic Wall',
        school: 'abjuration',
        level: 9,
        classes: ['bard', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
        duration: { kind: 'timed', value: 10, unit: 'minute' },
        components: { verbal: true, somatic: true },
        resolution: {
            caveats: [
                'Seven layers, per-layer Dex saves, AC/HP per layer, and violet-only Dispel are not modeled as discrete effects.',
            ],
        },
        effectGroups: [
            {
                effects: [
                    {
                        kind: 'note',
                        text: 'Wall 90×30×1 ft or 30ft globe. Bright 100ft, Dim 100ft. Con save or Blinded 1 min within 20ft. Seven layers (red→violet): each Dex save or effect. Layers destroyable. Antimagic Field no effect. Dispel Magic violet only.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "A shimmering, multicolored plane of light forms a vertical opaque wall—up to 90 feet long, 30 feet high, and 1 inch thick—centered on a point within range. Alternatively, you shape the wall into a globe up to 30 feet in diameter. The wall lasts for the duration. The wall sheds Bright Light within 100 feet and Dim Light for an additional 100 feet. You and creatures you designate when you cast can pass through unharmed. If another creature that can see the wall moves within 20 feet of it or starts its turn there, it must succeed on a Constitution saving throw or have the Blinded condition for 1 minute. The wall consists of seven layers, each with a different color. When a creature reaches into or passes through the wall, it does so one layer at a time. Each layer forces a Dexterity saving throw or that layer's effect. The wall (AC 10) can be destroyed one layer at a time. Antimagic Field has no effect. Dispel Magic can affect only the violet layer.",
            summary: 'Seven-layer wall. Each layer: Dex save or effect. Layers destroyable. Complex.',
        },
    },
    {
        id: 'shapechange',
        name: 'Shapechange',
        school: 'transmutation',
        level: 9,
        classes: ['druid', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'self' },
        duration: { kind: 'timed', value: 1, unit: 'hour', concentration: true, upTo: true },
        components: { verbal: true, somatic: true, material: { description: 'a jade circlet worth 1,500+ GP', cost: { value: 1500, unit: 'gp', atLeast: true } } },
        resolution: {
            caveats: [
                'CR cap, form swapping, and Spellcasting retention are table/character-sheet scope.',
            ],
        },
        effectGroups: [
            {
                effects: [
                    {
                        kind: 'note',
                        text: 'Shape-shift into creature CR ≤ your level (seen, not Construct/Undead). Magic action: new form. Gain THP = first form HP. Retain type, alignment, Int/Wis/Cha, HP, proficiencies, Spellcasting. Equipment drops or resizes.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "You shape-shift into another creature for the duration or until you take a Magic action to shape-shift into a different eligible form. The new form must be of a creature that has a Challenge Rating no higher than your level or Challenge Rating. You must have seen the sort of creature before, and it can't be a Construct or an Undead. When you cast the spell, you gain a number of Temporary Hit Points equal to the Hit Points of the first form into which you shape-shift. These Temporary Hit Points vanish if any remain when the spell ends. Your game statistics are replaced by the stat block of the chosen form, but you retain your creature type; alignment; personality; Intelligence, Wisdom, and Charisma scores; Hit Points; Hit Point Dice; proficiencies; and ability to communicate. If you have the Spellcasting feature, you retain it too. Upon shape-shifting, you determine whether your equipment drops to the ground or changes in size and shape to fit the new form while you're in it.",
            summary: 'Shape-shift into creature CR ≤ level. Retain Int/Wis/Cha, HP, proficiencies, Spellcasting.',
        },
    },
    {
        id: 'storm-of-vengeance',
        name: 'Storm of Vengeance',
        school: 'conjuration',
        level: 9,
        classes: ['druid'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 5280, unit: 'ft' } },
        duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
        components: { verbal: true, somatic: true },
        resolution: {
            caveats: [
                'Turn-by-turn escalation (acid, lightning, hail, then cold/obscurement) must be tracked manually.',
            ],
        },
        effectGroups: [
            {
                effects: [
                    {
                        kind: 'note',
                        text: '300ft radius storm cloud. Appear: Con save or 2d6 Thunder + Deafened. Turn 2: 4d6 Acid. Turn 3: 6 lightning bolts, Dex save 10d6. Turn 4: 2d6 Bludgeoning. Turns 5-10: 1d6 Cold, Difficult Terrain, Heavily Obscured, no ranged weapons.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "A churning storm cloud forms for the duration, centered on a point within range and spreading to a radius of 300 feet. Each creature under the cloud when it appears must succeed on a Constitution saving throw or take 2d6 Thunder damage and have the Deafened condition for the duration. At the start of each of your later turns, the storm produces different effects: Turn 2. Acidic rain falls. Each creature and object under the cloud takes 4d6 Acid damage. Turn 3. You call six bolts of lightning from the cloud to strike six different creatures or objects beneath it. Each target makes a Dexterity saving throw, taking 10d6 Lightning damage on a failed save or half as much damage on a successful one. Turn 4. Hailstones rain down. Each creature under the cloud takes 2d6 Bludgeoning damage. Turns 5–10. Gusts and freezing rain assail the area under the cloud. Each creature there takes 1d6 Cold damage. Until the spell ends, the area is Difficult Terrain and Heavily Obscured, ranged attacks with weapons are impossible there, and strong wind blows through the area.",
            summary: '300ft storm. Turn 2: Acid. Turn 3: Lightning. Turn 4: Hail. Turns 5-10: Cold, Difficult Terrain.',
        },
    },
    {
        id: 'time-stop',
        name: 'Time Stop',
        school: 'transmutation',
        level: 9,
        classes: ['sorcerer', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'self' },
        duration: { kind: 'instantaneous' },
        components: { verbal: true },
        resolution: {
            caveats: [
                '1d4+1 extra turns and early-end triggers are not modeled as encounter round injection.',
            ],
        },
        effectGroups: [
            {
                effects: [
                    {
                        kind: 'note',
                        text: 'Time stops for others. You take 1d4+1 turns. Ends if you affect another creature or object worn/carried by another, or move >1000ft from cast location.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "You briefly stop the flow of time for everyone but yourself. No time passes for other creatures, while you take 1d4 + 1 turns in a row, during which you can use actions and move as normal. This spell ends if one of the actions you use during this period, or any effects that you create during it, affects a creature other than you or an object being worn or carried by someone other than you. In addition, the spell ends if you move to a place more than 1,000 feet from the location where you cast it.",
            summary: 'Time stops. You take 1d4+1 turns. Ends if you affect others or move >1000ft.',
        },
    },
    {
        id: 'true-polymorph',
        name: 'True Polymorph',
        school: 'transmutation',
        level: 9,
        classes: ['bard', 'warlock', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 30, unit: 'ft' } },
        duration: { kind: 'timed', value: 1, unit: 'hour', concentration: true, upTo: true },
        components: { verbal: true, somatic: true, material: { description: 'a drop of mercury, a dollop of gum arabic, and a wisp of smoke' } },
        resolution: {
            caveats: [
                'Object/creature modes, Wis save, and “concentrate full duration = until dispelled” need manual tracking.',
            ],
        },
        effectGroups: [
            {
                effects: [
                    {
                        kind: 'note',
                        text: 'Creature or object: creature↔creature (Wis save unwilling), object→creature, creature→object. Full concentration = until dispelled. Complex CR/size rules.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "Choose one creature or nonmagical object that you can see within range. The creature shape-shifts into a different creature or a nonmagical object, or the object shape-shifts into a creature (the object must be neither worn nor carried). The transformation lasts for the duration or until the target dies or is destroyed, but if you maintain Concentration on this spell for the full duration, the spell lasts until dispelled. An unwilling creature can make a Wisdom saving throw, and if it succeeds, it isn't affected by this spell. Creature into Creature. If you turn a creature into another kind of creature, the new form can be any kind you choose that has a Challenge Rating equal to or less than the target's Challenge Rating or level. The target's game statistics are replaced by the stat block of the new form, but it retains its Hit Points, Hit Point Dice, alignment, and personality. The target gains a number of Temporary Hit Points equal to the Hit Points of the new form. These Temporary Hit Points vanish if any remain when the spell ends. The target is limited in the actions it can perform by the anatomy of its new form, and it can't speak or cast spells. The target's gear melds into the new form. The creature can't use or otherwise benefit from any of that equipment. Object into Creature. You can turn an object into any kind of creature, as long as the creature's size is no larger than the object's size and the creature has a Challenge Rating of 9 or lower. The creature is Friendly to you and your allies. In combat, it takes its turns immediately after yours, and it obeys your commands. If the spell lasts more than an hour, you no longer control the creature. It might remain Friendly to you, depending on how you have treated it. Creature into Object. If you turn a creature into an object, it transforms along with whatever it is wearing and carrying into that form, as long as the object's size is no larger than the creature's size. The creature's statistics become those of the object, and the creature has no memory of time spent in this form after the spell ends and it returns to normal.",
            summary: 'Polymorph creature↔creature, object→creature, creature→object. Full concentration = until dispelled.',
        },
    },
    {
        id: 'true-resurrection',
        name: 'True Resurrection',
        school: 'necromancy',
        level: 9,
        classes: ['cleric', 'druid'],
        castingTime: { normal: { value: 1, unit: 'hour' }, canBeCastAsRitual: false },
        range: { kind: 'touch' },
        duration: { kind: 'instantaneous' },
        components: { verbal: true, somatic: true, material: { description: 'diamonds worth 25,000+ GP', cost: { value: 25000, unit: 'gp', atLeast: true }, consumed: true } },
        resolution: {
            caveats: [
                'New-body revival and full condition cleansing are narrative, not a heal number.',
            ],
        },
        effectGroups: [
            {
                effects: [
                    {
                        kind: 'note',
                        text: 'Touch creature dead ≤200 years (not old age). Revive full HP. Closes wounds, neutralizes poison, cures contagions, lifts curses. Replaces organs/limbs. Undead→non-Undead. Can provide new body if original gone.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "You touch a creature that has been dead for no longer than 200 years and that died for any reason except old age. The creature is revived with all its Hit Points. This spell closes all wounds, neutralizes any poison, cures all magical contagions, and lifts any curses affecting the creature when it died. The spell replaces damaged or missing organs and limbs. If the creature was Undead, it is restored to its non-Undead form. The spell can provide a new body if the original no longer exists, in which case you must speak the creature's name. The creature then appears in an unoccupied space you choose within 10 feet of you.",
            summary: 'Revive creature dead ≤200 years (not old age) with full HP. Can create new body.',
        },
    },
    {
        id: 'weird',
        name: 'Weird',
        school: 'illusion',
        level: 9,
        classes: ['warlock', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 120, unit: 'ft' } },
        duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
        components: { verbal: true, somatic: true },
        resolution: {
            caveats: [
                'Chosen creatures in the sphere; end-of-turn rider damage and “ends on successful save” are summarized below.',
            ],
        },
        effectGroups: [
            {
                targeting: { selection: 'in-area', targetType: 'creature', area: { kind: 'sphere', size: 30 } },
                effects: [
                    {
                        kind: 'save',
                        save: { ability: 'wis' },
                        onFail: [
                            { kind: 'damage', damage: '10d10', damageType: 'psychic' },
                            { kind: 'condition', conditionId: 'frightened' },
                        ],
                        onSuccess: [{ kind: 'damage', damage: '5d10', damageType: 'psychic' }],
                    },
                    {
                        kind: 'note',
                        text: 'At the end of each Frightened target’s turn: Wis save — fail: 5d10 psychic; success: spell ends on that target.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "You try to create illusory terrors in others' minds. Each creature of your choice in a 30-foot-radius Sphere centered on a point within range makes a Wisdom saving throw. On a failed save, a target takes 10d10 Psychic damage and has the Frightened condition for the duration. On a successful save, a target takes half as much damage only. A Frightened target makes a Wisdom saving throw at the end of each of its turns. On a failed save, it takes 5d10 Psychic damage. On a successful save, the spell ends on that target.",
            summary: '30ft sphere: Wis save or 10d10 psychic + Frightened. Repeat save each turn.',
        },
    },
    {
        id: 'wish',
        name: 'Wish',
        school: 'conjuration',
        level: 9,
        classes: ['sorcerer', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'self' },
        duration: { kind: 'instantaneous' },
        components: { verbal: true },
        resolution: {
            caveats: [
                'Non-duplication effects are GM-adjudicated. Stress: if you use wish for anything other than duplicating a spell of 8th level or lower, until you finish a long rest you take 1d10 necrotic damage per spell level whenever you cast a spell, and you have a 33% chance of being unable to cast wish ever again.',
            ],
        },
        effectGroups: [
            {
                effects: [
                    {
                        kind: 'note',
                        text: 'Duplicate any spell of 8th level or lower without requiring that spell’s components. Alternatively, create another effect of similar power (examples: valuable nonmagical object, mass heal + greater-restoration-style cleansing for up to 20 creatures, immunity to an effect for up to 10 creatures, undo a recent event—see spell text). Stress applies when not duplicating a spell.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "Wish is the mightiest spell a mortal creature can cast. By speaking aloud, you alter the foundations of reality in accord with your desires. The basic use is to duplicate any other spell of 8th level or lower. You don’t need to meet any requirements of that spell, including costly components; the spell simply takes effect. Alternatively, you might create another effect of appropriate power (at the GM’s discretion)—such as creating a nonmagical object of great value, restoring many creatures with effects akin to greater restoration, granting short-term immunity to a magical effect, or undoing a single recent event—see your rulebook for scope and examples. If you cast wish to produce any effect other than duplicating another spell, you suffer stress: until you finish a long rest, whenever you cast a spell you take 1d10 necrotic damage per level of that spell, and there is a 33 percent chance you can never cast wish again.",
            summary: 'Duplicate an 8th-level-or-lower spell without components, or a major wish effect; using non-duplication wishes risks severe stress.',
        },
    },
];
