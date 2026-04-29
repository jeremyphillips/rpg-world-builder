import type { SpellEntry } from '../types';
/**
 * Level 7 spells M–Z — authoring status:
 * - **Attack/save/AoE modeled:** Prismatic Spray, Regenerate (healing).
 * - **Utility / travel:** Plane Shift, Project Image, Teleport.
 * - **Note-first / long-form:** Reverse Gravity, Sequester, Simulacrum, Symbol, Resurrection, etc.
 */
export const SPELLS_LEVEL_7_M_Z: readonly SpellEntry[] = [
    {
        id: 'plane-shift',
        name: 'Plane Shift',
        school: 'conjuration',
        level: 7,
        classes: ['cleric', 'druid', 'sorcerer', 'warlock', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'touch' },
        duration: { kind: 'instantaneous' },
        components: { verbal: true, somatic: true, material: { description: 'a forked, metal rod worth 250+ GP attuned to a plane of existence', cost: { value: 250, unit: 'gp', atLeast: true } } },
        resolution: {
            caveats: [
                'Arrival location (general vs teleportation circle) is GM-determined.',
            ],
        },
        effectGroups: [
            {
                targeting: {
                    selection: 'chosen', targetType: 'creature',
                    count: 8,
                    requiresWilling: true
                },
                effects: [
                    { kind: 'note', text: 'You and up to 8 willing creatures (linking hands) transport to a different plane of existence. Specify destination generally or use a teleportation circle sigil sequence.', category: 'flavor' as const }
                ]
            }
        ],
        description: {
            full: "You and up to eight willing creatures who link hands in a circle are transported to a different plane of existence. You can specify a target destination in general terms, such as a specific city on the Elemental Plane of Fire or palace on the second level of the Nine Hells, and you appear in or near that destination, as determined by the GM. Alternatively, if you know the sigil sequence of a teleportation circle on another plane of existence, this spell can take you to that circle. If the teleportation circle is too small to hold all the creatures you transported, they appear in the closest unoccupied spaces next to the circle.",
            summary: 'Transport self and up to 8 to another plane. General destination or circle sigil.',
        },
    },
    {
        id: 'prismatic-spray',
        name: 'Prismatic Spray',
        school: 'evocation',
        level: 7,
        classes: ['bard', 'sorcerer', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'self' },
        duration: { kind: 'instantaneous' },
        components: { verbal: true, somatic: true },
        resolution: {
            caveats: [
                'Each target rolls 1d8 for ray color; the Dex save below models only the common energy rays (roughly 12d6 on fail / half on success), not Indigo/Violet/special.',
            ],
        },
        effectGroups: [
            {
                targeting: { selection: 'in-area', targetType: 'creature', area: { kind: 'cone', size: 60 } },
                effects: [
                    {
                        kind: 'save',
                        save: { ability: 'dex' },
                        onFail: [{ kind: 'damage', damage: '12d6', damageType: 'fire' }],
                        onSuccess: [{ kind: 'damage', damage: '6d6', damageType: 'fire' }],
                    },
                    { kind: 'note', text: 'Roll 1d8 per creature for ray color: 1-5 deal 12d6 of varying damage types (fire, acid, lightning, poison, cold). 6 Indigo: Restrained then track 3 fails for Petrified. 7 Violet: Blinded then Wis save or plane shift. 8: two rays.', category: 'under-modeled' as const }
                ]
            }
        ],
        description: {
            full: "Eight rays of light flash from you in a 60-foot Cone. Each creature in the Cone makes a Dexterity saving throw. For each target, roll 1d8 to determine which color ray affects it: 1 Red (12d6 Fire), 2 Orange (12d6 Acid), 3 Yellow (12d6 Lightning), 4 Green (12d6 Poison), 5 Blue (12d6 Cold), 6 Indigo (Restrained, Con save 3 fails=Petrified), 7 Violet (Blinded, Wis save fail=plane shift), 8 Special (two rays).",
            summary: '60ft cone, 8 random rays. Various damage and effects.',
        },
    },
    {
        id: 'project-image',
        name: 'Project Image',
        school: 'illusion',
        level: 7,
        classes: ['bard', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 500, unit: 'mi' } },
        duration: { kind: 'timed', value: 1, unit: 'day', concentration: true, upTo: true },
        components: { verbal: true, somatic: true, material: { description: 'a statuette of yourself worth 5+ GP', cost: { value: 5, unit: 'gp', atLeast: true } } },
        resolution: {
            caveats: [
                'Remote sensing and Magic action puppetry are narrative; damage to the illusion ends the spell.',
            ],
        },
        effectGroups: [
            {
                effects: [
                    {
                        kind: 'note',
                        text: 'Illusory copy at location you have seen (within 500 miles). Intangible. See/hear through it. Magic action: move 60ft, gesture, speak. Damage ends spell. Study + Int (Investigation) to discern.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "You create an illusory copy of yourself that lasts for the duration. The copy can appear at any location within range that you have seen before, regardless of intervening obstacles. The illusion looks and sounds like you, but it is intangible. If the illusion takes any damage, it disappears, and the spell ends. You can see through the illusion's eyes and hear through its ears as if you were in its space. As a Magic action, you can move it up to 60 feet and make it gesture, speak, and behave in whatever way you choose. Physical interaction reveals the illusion. Study + Int (Investigation) vs DC to discern.",
            summary: 'Illusory copy up to 500 miles away. See/hear through it. Damage ends spell.',
        },
    },
    {
        id: 'regenerate',
        name: 'Regenerate',
        school: 'transmutation',
        level: 7,
        classes: ['bard', 'cleric', 'druid'],
        castingTime: { normal: { value: 1, unit: 'minute' }, canBeCastAsRitual: false },
        range: { kind: 'touch' },
        duration: { kind: 'timed', value: 1, unit: 'hour' },
        components: { verbal: true, somatic: true, material: { description: 'a prayer wheel' } },
        resolution: {
            caveats: [
                '1 HP per turn ticks at the start of the target’s turns for the duration.',
            ],
        },
        effectGroups: [
            {
                targeting: { selection: 'one', targetType: 'creature' },
                effects: [
                    { kind: 'hit-points', mode: 'heal', value: '4d8+15' },
                    { kind: 'interval', stateId: 'regeneration', every: { value: 1, unit: 'turn' }, effects: [{ kind: 'hit-points', mode: 'heal', value: 1 }] },
                    { kind: 'note', text: 'Severed body parts regrow after 2 minutes.', category: 'flavor' as const }
                ]
            }
        ],
        description: {
            full: "A creature you touch regains 4d8 + 15 Hit Points. For the duration, the target regains 1 Hit Point at the start of each of its turns, and any severed body parts regrow after 2 minutes.",
            summary: '4d8+15 HP. 1 HP/turn for 1 hour. Severed parts regrow in 2 min.',
        },
    },
    {
        id: 'resurrection',
        name: 'Resurrection',
        school: 'necromancy',
        level: 7,
        classes: ['bard', 'cleric'],
        castingTime: { normal: { value: 1, unit: 'hour' }, canBeCastAsRitual: false },
        range: { kind: 'touch' },
        duration: { kind: 'instantaneous' },
        components: { verbal: true, somatic: true, material: { description: 'a diamond worth 1,000+ GP', cost: { value: 1000, unit: 'gp', atLeast: true }, consumed: true } },
        resolution: {
            caveats: [
                'Caster tax when dead ≥365 days and target’s −4 d20 test penalty are not automated.',
            ],
        },
        effectGroups: [
            {
                targeting: { selection: 'one', targetType: 'dead-creature' },
                effects: [
                    { kind: 'hit-points', mode: 'heal', value: 1 },
                    { kind: 'note', text: 'Revives to full HP. Not dead >100 years, not old age, not Undead. Neutralizes poisons, closes wounds, restores body parts. -4 penalty to d20 tests, reduced by 1 per Long Rest. If dead 365+ days, caster cannot cast spells and has Disadvantage on d20 tests until Long Rest.', category: 'flavor' as const }
                ]
            }
        ],
        description: {
            full: "With a touch, you revive a dead creature that has been dead for no more than a century, didn't die of old age, and wasn't Undead when it died. The creature returns to life with all its Hit Points. This spell also neutralizes any poisons that affected the creature at the time of death. This spell closes all mortal wounds and restores any missing body parts. Coming back from the dead is an ordeal. The target takes a −4 penalty to D20 Tests. Every time the target finishes a Long Rest, the penalty is reduced by 1 until it becomes 0. Casting this spell to revive a creature that has been dead for 365 days or longer taxes you. Until you finish a Long Rest, you can't cast spells again, and you have Disadvantage on D20 Tests.",
            summary: 'Revive dead (≤100 years). Full HP. -4 d20 penalty, -1 per Long Rest. Dead 365+ days: exhaustion.',
        },
    },
    {
        id: 'reverse-gravity',
        name: 'Reverse Gravity',
        school: 'transmutation',
        level: 7,
        classes: ['druid', 'sorcerer', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 100, unit: 'ft' } },
        duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
        components: { verbal: true, somatic: true, material: { description: 'a lodestone and iron filings' } },
        resolution: {
            caveats: [
                'Falling damage, ceiling impacts, and end-of-spell falls need manual adjudication.',
            ],
        },
        effectGroups: [
            {
                effects: [
                    {
                        kind: 'note',
                        text: '50-foot radius, 100-foot cylinder. Unanchored creatures/objects fall upward. Dex save to grab fixed object. Hover at top. Fall down when spell ends.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "This spell reverses gravity in a 50-foot-radius, 100-foot high Cylinder centered on a point within range. All creatures and objects in that area that aren't anchored to the ground fall upward and reach the top of the Cylinder. A creature can make a Dexterity saving throw to grab a fixed object it can reach, thus avoiding the fall upward. If a ceiling or an anchored object is encountered in this upward fall, creatures and objects strike it just as they would during a downward fall. If an affected creature or object reaches the Cylinder's top without striking anything, it hovers there for the duration. When the spell ends, affected objects and creatures fall downward.",
            summary: '50ft radius cylinder: gravity reversed. Fall up, hover at top. Fall down when ends.',
        },
    },
    {
        id: 'sequester',
        name: 'Sequester',
        school: 'transmutation',
        level: 7,
        classes: ['wizard'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'touch' },
        duration: { kind: 'until-dispelled' },
        components: { verbal: true, somatic: true, material: { description: 'gem dust worth 5,000+ GP', cost: { value: 5000, unit: 'gp', atLeast: true }, consumed: true } },
        resolution: {
            caveats: [
                'Custom end conditions and “no remote viewing” are not enforced by mechanics.',
            ],
        },
        effectGroups: [
            {
                effects: [
                    {
                        kind: 'note',
                        text: 'Object or willing creature: Invisible, cannot be targeted by Divination, detected by magic, or viewed remotely. Creature: Unconscious, suspended animation, no aging/food/water/air. Set condition to end. Damage ends spell.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "With a touch, you magically sequester an object or a willing creature. For the duration, the target has the Invisible condition and can't be targeted by Divination spells, detected by magic, or viewed remotely with magic. If the target is a creature, it enters a state of suspended animation; it has the Unconscious condition, doesn't age, and doesn't need food, water, or air. You can set a condition for the spell to end early. The condition can be anything you choose, but it must occur or be visible within 1 mile of the target. This spell also ends if the target takes any damage.",
            summary: 'Invisible, undetectable. Creature: suspended animation. Set end condition. Damage ends.',
        },
    },
    {
        id: 'simulacrum',
        name: 'Simulacrum',
        school: 'illusion',
        level: 7,
        classes: ['wizard'],
        castingTime: { normal: { value: 12, unit: 'hour' }, canBeCastAsRitual: false },
        range: { kind: 'touch' },
        duration: { kind: 'until-dispelled' },
        components: { verbal: true, somatic: true, material: { description: 'powdered ruby worth 1,500+ GP', cost: { value: 1500, unit: 'gp', atLeast: true }, consumed: true } },
        resolution: {
            caveats: [
                'Simulacrum uses the copied stat block at half HP; not instantiated as a full sheet here.',
            ],
        },
        effectGroups: [
            {
                effects: [
                    {
                        kind: 'note',
                        text: 'Create simulacrum of Beast or Humanoid (within 10ft entire casting). Construct, half HP, cannot cast this spell. Friendly, obeys commands. Repair 100 GP/HP during Long Rest. Recasting destroys previous.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "You create a simulacrum of one Beast or Humanoid that is within 10 feet of you for the entire casting of the spell. You finish the casting by touching both the creature and a pile of ice or snow that is the same size as that creature, and the pile turns into the simulacrum, which is a creature. It uses the game statistics of the original creature at the time of casting, except it is a Construct, its Hit Point maximum is half as much, and it can't cast this spell. The simulacrum is Friendly to you and creatures you designate. It obeys your commands and acts on your turn in combat. The simulacrum can't gain levels, and it can't take Short or Long Rests. If the simulacrum takes damage, the only way to restore its Hit Points is to repair it as you take a Long Rest, during which you expend components worth 100 GP per Hit Point restored. The simulacrum must stay within 5 feet of you for the repair. The simulacrum lasts until it drops to 0 Hit Points, at which point it reverts to snow and melts away. If you cast this spell again, any simulacrum you created with this spell is instantly destroyed.",
            summary: 'Create Construct copy. Half HP, obeys commands. Repair 100 GP/HP. Recasting destroys previous.',
        },
    },
    {
        id: 'symbol',
        name: 'Symbol',
        school: 'abjuration',
        level: 7,
        classes: ['bard', 'cleric', 'druid', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'minute' }, canBeCastAsRitual: false },
        range: { kind: 'touch' },
        duration: { kind: 'until-dispelled', concentration: false },
        components: { verbal: true, somatic: true, material: { description: 'powdered diamond worth 1,000+ GP', cost: { value: 1000, unit: 'gp', atLeast: true }, consumed: true } },
        resolution: {
            caveats: [
                'Glyph trigger, effect choice, and 60-foot sphere after activation need setup tracking.',
            ],
            casterOptions: [
                {
                    kind: 'enum',
                    id: 'symbol-effect',
                    label: 'Glyph effect',
                    options: [
                        { value: 'death', label: 'Death (10d10 necrotic)' },
                        { value: 'discord', label: 'Discord (argue 1 min)' },
                        { value: 'fear', label: 'Fear (Frightened 1 min)' },
                        { value: 'pain', label: 'Pain (Incapacitated 1 min)' },
                        { value: 'sleep', label: 'Sleep (Unconscious 10 min)' },
                        { value: 'stunning', label: 'Stunning (Stunned 1 min)' },
                    ],
                },
            ],
        },
        effectGroups: [
            {
                effects: [
                    {
                        kind: 'note',
                        text: 'Inscribe glyph (surface or object). 10ft diameter max. Set trigger. Choose: Death (10d10 necrotic), Discord (argue 1min), Fear (Frightened 1min), Pain (Incapacitated 1min), Sleep (Unconscious 10min), Stunning (Stunned 1min). 60ft sphere when triggered. Wis (Perception) vs DC to notice.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "You inscribe a harmful glyph either on a surface or within an object that can be closed. The glyph can cover an area no larger than 10 feet in diameter. The glyph is nearly imperceptible and requires a successful Wisdom (Perception) check against your spell save DC to notice. When you inscribe the glyph, you set its trigger and choose which effect the symbol bears: Death (10d10 Necrotic), Discord (argue 1 min), Fear (Frightened 1 min), Pain (Incapacitated 1 min), Sleep (Unconscious 10 min), or Stunning (Stunned 1 min). Once triggered, the glyph glows, filling a 60-foot-radius Sphere with Dim Light for 10 minutes. Each creature in the Sphere when the glyph activates is targeted by its effect, as is a creature that enters the Sphere for the first time on a turn or ends its turn there.",
            summary: 'Glyph with trigger. Death, Discord, Fear, Pain, Sleep, or Stunning. 60ft sphere when triggered.',
        },
    },
    {
        id: 'teleport',
        name: 'Teleport',
        school: 'conjuration',
        level: 7,
        classes: ['bard', 'sorcerer', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 10, unit: 'ft' } },
        duration: { kind: 'instantaneous' },
        components: { verbal: true },
        resolution: {
            caveats: [
                'Outcome is GM 1d100 on the Teleportation table by familiarity; mishap damage and rerolls are not automated.',
            ],
        },
        effectGroups: [
            {
                targeting: {
                    selection: 'chosen', targetType: 'creature',
                    count: 8,
                    requiresSight: true,
                    requiresWilling: true
                },
                effects: [
                    { kind: 'note', text: 'Transport self and up to 8 willing creatures or one object to a destination. Outcome determined by d100 roll based on familiarity: On Target, Off Target, Similar Area, or Mishap.', category: 'flavor' as const }
                ]
            }
        ],
        description: {
            full: `This spell instantly transports you and up to eight willing creatures that you can see within range, or a single object that you can see within range, to a destination you select. If you target an object, it must be Large or smaller, and it can't be held or carried by an unwilling creature.

The destination you choose must be known to you, and it must be on the same plane of existence as you. Your familiarity with the destination determines whether you arrive there successfully. The GM rolls 1d100 and consults the Teleportation Outcome table and the explanations after it.

TELEPORTATION OUTCOME

Roll d100 based on destination familiarity:

• Permanent circle: On Target only (01–00)
• Linked object: On Target only (01–00)
• Very familiar: Mishap 01–05, Similar Area 06–13, Off Target 14–24, On Target 25–00
• Seen casually: Mishap 01–33, Similar Area 34–43, Off Target 44–53, On Target 54–00
• Viewed once or described: Mishap 01–43, Similar Area 44–53, Off Target 54–73, On Target 74–00
• False destination: Mishap 01–50, Similar Area 51–00

Familiarity. "Permanent circle" means a permanent teleportation circle whose sigil sequence you know. "Linked object" means you possess an object taken from the desired destination within the last six months, such as a book from a wizard's library. "Very familiar" is a place you have visited often, a place you have carefully studied, or a place you can see when you cast the spell. "Seen casually" is a place you have seen more than once but with which you aren't very familiar. "Viewed once or described" is a place you have seen once, possibly using magic, or a place you know through someone else's description, perhaps from a map. "False destination" is a place that doesn't exist—perhaps you tried to scry an enemy's sanctum but instead viewed an illusion, or you are attempting to teleport to a location that no longer exists.

Mishap. The spell's unpredictable magic results in a difficult journey. Each teleporting creature (or the target object) takes 3d10 Force damage, and the GM rerolls on the table to see where you wind up (multiple mishaps can occur, dealing damage each time).

Similar Area. You and your group (or the target object) appear in a different area that's visually or thematically similar to the target area. You appear in the closest similar place. If you are heading for your home laboratory, for example, you might appear in another person's laboratory in the same city.

Off Target. You and your group (or the target object) appear 2d12 miles away from the destination in a random direction. Roll 1d8 for the direction: 1, east; 2, southeast; 3, south; 4, southwest; 5, west; 6, northwest; 7, north; or 8, northeast.

On Target. You and your group (or the target object) appear where you intended.`,
            summary: 'Transport self + up to 8 creatures or one object. GM rolls d100 on Teleportation Outcome table by familiarity.',
        },
    },
];
