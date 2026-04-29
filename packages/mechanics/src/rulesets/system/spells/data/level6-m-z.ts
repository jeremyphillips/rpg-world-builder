import type { ModifierValue } from '@/features/mechanics/domain/effects/effects.types';
import type { SpellEntry } from '../types';
/**
 * Level 6 spells M–Z — authoring status:
 * - **Attack/save/AoE modeled:** Heal, Irresistible Dance, Mass Suggestion, Sunbeam.
 * - **Utility / divination:** Programmed Illusion, Transport via Plants, True Seeing, Word of Recall.
 * - **Note-first / terrain / heavy caveats:** Heroes' Feast, Magic Jar, Move Earth, Planar Ally, Wall of Ice, Wall of Thorns, Wind Walk, etc.
 */
export const SPELLS_LEVEL_6_M_Z: readonly SpellEntry[] = [
    {
        id: 'heal',
        name: 'Heal',
        school: 'abjuration',
        level: 6,
        classes: ['cleric', 'druid'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
        duration: { kind: 'instantaneous' },
        components: { verbal: true, somatic: true },
        resolution: {
            caveats: [
                'Condition removal is bundled with healing; targets must be valid (see spell text).',
            ],
        },
        effectGroups: [
            {
                targeting: { selection: 'one', targetType: 'creature', requiresSight: true },
                effects: [
                    { kind: 'hit-points', mode: 'heal', value: 70 },
                    { kind: 'note', text: 'Also ends Blinded, Deafened, and Poisoned conditions on the target.', category: 'flavor' as const }
                ]
            }
        ],
        scaling: [{ category: 'extra-healing', description: '+10 HP per slot level above 6', mode: 'per-slot-level', startsAtSlotLevel: 7, amount: 10 }],
        description: {
            full: "Choose a creature that you can see within range. Positive energy washes through the target, restoring 70 Hit Points. This spell also ends the Blinded, Deafened, and Poisoned conditions on the target. Using a Higher-Level Spell Slot. The healing increases by 10 for each spell slot level above 6.",
            summary: 'Restore 70 HP, end Blinded/Deafened/Poisoned. Healing scales with slot.',
        },
    },
    {
        id: 'heroes-feast',
        name: "Heroes' Feast",
        school: 'conjuration',
        level: 6,
        classes: ['bard', 'cleric', 'druid'],
        castingTime: { normal: { value: 10, unit: 'minute' }, canBeCastAsRitual: false },
        range: { kind: 'self' },
        duration: { kind: 'instantaneous' },
        components: { verbal: true, somatic: true, material: { description: 'a gem-encrusted bowl worth 1,000+ GP', cost: { value: 1000, unit: 'gp', atLeast: true }, consumed: true } },
        resolution: {
            caveats: [
                '1-hour meal time and twelve participants are narrative; benefits apply after the hour.',
            ],
        },
        effectGroups: [
            {
                effects: [
                    {
                        kind: 'note',
                        text: 'Feast for 12. 1 hour to consume. 24h: Resistance poison, Immunity Frightened/Poisoned, +2d10 HP max and current.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "You conjure a feast that appears on a surface in an unoccupied 10-foot Cube next to you. The feast takes 1 hour to consume and disappears at the end of that time, and the beneficial effects don't set in until this hour is over. Up to twelve creatures can partake of the feast. A creature that partakes gains several benefits, which last for 24 hours. The creature has Resistance to Poison damage, and it has Immunity to the Frightened and Poisoned conditions. Its Hit Point maximum also increases by 2d10, and it gains the same number of Hit Points.",
            summary: 'Feast for 12. 24h benefits: poison resistance, immunity Frightened/Poisoned, +2d10 HP.',
        },
    },
    {
        id: 'instant-summons',
        name: 'Instant Summons',
        school: 'conjuration',
        level: 6,
        classes: ['wizard'],
        castingTime: { normal: { value: 1, unit: 'minute' }, canBeCastAsRitual: true },
        range: { kind: 'touch' },
        duration: { kind: 'until-dispelled' },
        components: { verbal: true, somatic: true, material: { description: 'a sapphire worth 1,000+ GP', cost: { value: 1000, unit: 'gp', atLeast: true } } },
        resolution: {
            caveats: [
                'Planar retrieval and “who holds it” divination are not automated as inventory moves.',
            ],
        },
        effectGroups: [
            {
                effects: [
                    {
                        kind: 'note',
                        text: 'Mark object (10 lb, 6 ft). Magic action + crush sapphire: object appears in hand. If held by another: learn who and where.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "You touch the sapphire used in the casting and an object weighing 10 pounds or less whose longest dimension is 6 feet or less. The spell leaves an Invisible mark on that object and invisibly inscribes the object's name on the sapphire. Each time you cast this spell, you must use a different sapphire. Thereafter, you can take a Magic action to speak the object's name and crush the sapphire. The object instantly appears in your hand regardless of physical or planar distances, and the spell ends. If another creature is holding or carrying the object, crushing the sapphire doesn't transport it, but instead you learn who that creature is and where that creature is currently located.",
            summary: 'Mark object. Crush sapphire: object appears, or learn holder location.',
        },
    },
    {
        id: 'irresistible-dance',
        name: 'Irresistible Dance',
        school: 'enchantment',
        level: 6,
        classes: ['bard', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 30, unit: 'ft' } },
        duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
        components: { verbal: true },
        resolution: {
            caveats: [
                'On a successful initial save, the target still dances until the end of its next turn (not modeled as Charmed).',
            ],
        },
        effectGroups: [
            {
                targeting: { selection: 'one', targetType: 'creature' },
                effects: [
                    {
                        kind: 'save',
                        save: { ability: 'wis' },
                        onFail: [{ kind: 'condition', conditionId: 'charmed' }],
                    },
                    { kind: 'roll-modifier', appliesTo: 'attack-rolls', modifier: 'disadvantage' },
                    { kind: 'roll-modifier', appliesTo: 'dexterity-saves', modifier: 'disadvantage' },
                    { kind: 'modifier', target: 'speed' as const, mode: 'set' as const, value: 0 },
                    { kind: 'note', text: 'Advantage on attacks against target. Action to repeat save. On initial success, dances until end of next turn only.', category: 'under-modeled' as const }
                ]
            }
        ],
        description: {
            full: "One creature that you can see within range must make a Wisdom saving throw. On a successful save, the target dances comically until the end of its next turn, during which it must spend all its movement to dance in place. On a failed save, the target has the Charmed condition for the duration. While Charmed, the target dances comically, must use all its movement to dance in place, and has Disadvantage on Dexterity saving throws and attack rolls, and other creatures have Advantage on attack rolls against it. On each of its turns, the target can take an action to collect itself and repeat the save, ending the spell on itself on a success.",
            summary: 'Wis save: dance 1 turn or Charmed and dance. Action to repeat save.',
        },
    },
    {
        id: 'magic-jar',
        name: 'Magic Jar',
        school: 'necromancy',
        level: 6,
        classes: ['wizard'],
        castingTime: { normal: { value: 1, unit: 'minute' }, canBeCastAsRitual: false },
        range: { kind: 'self' },
        duration: { kind: 'until-dispelled' },
        components: { verbal: true, somatic: true, material: { description: 'a gem, crystal, or reliquary worth 500+ GP', cost: { value: 500, unit: 'gp', atLeast: true } } },
        resolution: {
            caveats: [
                'Possession, host stats, and death/return branches are heavily table-adjudicated.',
            ],
        },
        effectGroups: [
            {
                effects: [
                    {
                        kind: 'note',
                        text: 'Soul enters container, body catatonic. Project soul 100ft: return to body or possess Humanoid (Cha save). Protection from Evil/Magic Circle blocks. Host dies = you Cha save or die. Container destroyed = return or die.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "Your body falls into a catatonic state as your soul leaves it and enters the container you used for the spell's Material component. While your soul inhabits the container, you are aware of your surroundings as if you were in the container's space. You can't move or take Reactions. The only action you can take is to project your soul up to 100 feet out of the container, either returning to your living body (and ending the spell) or attempting to possess a Humanoid's body. You can attempt to possess any Humanoid within 100 feet of you that you can see (creatures warded by Protection from Evil and Good or Magic Circle can't be possessed). The target makes a Charisma saving throw. On a failed save, your soul enters the target's body, and the target's soul becomes trapped in the container. On a successful save, the target resists, and you can't attempt to possess it again for 24 hours. Once you possess a creature's body, you control it. Your HP, HP Dice, Str, Dex, Con, Speed, and senses are replaced by the creature's. If the host body dies while you're in it, you make a Cha save against your own DC; success returns you to the container if within 100ft, otherwise you die. If the container is destroyed or the spell ends, your soul returns to your body. If your body is more than 100 feet away or dead, you die.",
            summary: 'Soul in container; possess Humanoid. Cha save. Complex death/return rules.',
        },
    },
    {
        id: 'mass-suggestion',
        name: 'Mass Suggestion',
        school: 'enchantment',
        level: 6,
        classes: ['bard', 'sorcerer', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
        duration: { kind: 'timed', value: 24, unit: 'hour' },
        components: { verbal: true, material: { description: "a snake's tongue" } },
        resolution: {
            caveats: [
                'Suggestion wording (25 words) and “obviously harmful” gate are not validated mechanically.',
            ],
        },
        effectGroups: [
            {
                targeting: { selection: 'chosen', targetType: 'creature', requiresSight: true, count: 12 },
                effects: [
                    { kind: 'save', save: { ability: 'wis' }, onFail: [{ kind: 'condition', conditionId: 'charmed' }] },
                    { kind: 'note', text: 'Charmed targets pursue suggested course (25 words or fewer). Must sound achievable, not obviously harmful. Ends if caster or allies damage target.', category: 'flavor' as const }
                ]
            }
        ],
        scaling: [
            {
                category: 'longer-duration',
                description: '7th slot: 10 days; 8th: 30 days; 9th: 366 days',
                mode: 'threshold',
            },
        ],
        description: {
            full: "You suggest a course of activity—described in no more than 25 words—to twelve or fewer creatures you can see within range that can hear and understand you. The suggestion must sound achievable and not involve obvious damage to targets or allies. Each target must succeed on a Wisdom saving throw or have the Charmed condition for the duration or until you or your allies deal damage to the target. Each Charmed target pursues the suggestion to the best of its ability. Using a Higher-Level Spell Slot. The duration is longer with a spell slot of level 7 (10 days), 8 (30 days), or 9 (366 days).",
            summary: 'Suggest course to 12 creatures. Wis save or Charmed. Duration scales with slot.',
        },
    },
    {
        id: 'move-earth',
        name: 'Move Earth',
        school: 'transmutation',
        level: 6,
        classes: ['druid', 'sorcerer', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 120, unit: 'ft' } },
        duration: { kind: 'timed', value: 2, unit: 'hour', concentration: true, upTo: true },
        components: { verbal: true, somatic: true, material: { description: 'a miniature shovel' } },
        resolution: {
            caveats: [
                'Cannot manipulate stone or stone construction; repeated 10-minute reshapes are manual.',
            ],
        },
        effectGroups: [
            {
                effects: [
                    {
                        kind: 'note',
                        text: '40ft area dirt/sand/clay. Reshape: raise/lower, trench, wall, pillar. Changes up to half largest dimension. 10 min to complete. New area every 10 min.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "Choose an area of terrain no larger than 40 feet on a side within range. You can reshape dirt, sand, or clay in the area in any manner you choose for the duration. You can raise or lower the area's elevation, create or fill in a trench, erect or flatten a wall, or form a pillar. The extent of any such changes can't exceed half the area's largest dimension. It takes 10 minutes for these changes to complete. At the end of every 10 minutes you spend concentrating on the spell, you can choose a new area of terrain to affect within range. This spell can't manipulate natural stone or stone construction.",
            summary: 'Reshape dirt/sand/clay in 40ft area. 10 min per change.',
        },
    },
    {
        id: 'planar-ally',
        name: 'Planar Ally',
        school: 'conjuration',
        level: 6,
        classes: ['cleric'],
        castingTime: { normal: { value: 10, unit: 'minute' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
        duration: { kind: 'instantaneous' },
        components: { verbal: true, somatic: true },
        resolution: {
            caveats: [
                'Service terms, payment, and creature behavior are GM/table negotiation, not enforced.',
            ],
        },
        effectGroups: [
            {
                effects: [
                    { kind: 'note', text: 'Beseech an otherworldly entity. A Celestial, Elemental, or Fiend appears. No compulsion; bargain for service. Payment: 100 GP/min, 1,000 GP/hr, 10,000 GP/day.', category: 'flavor' as const }
                ]
            }
        ],
        description: {
            full: "You beseech an otherworldly entity for aid. The being must be known to you: a god, a demon prince, or some other being of cosmic power. That entity sends a Celestial, an Elemental, or a Fiend loyal to it to aid you, making the creature appear in an unoccupied space within range. When the creature appears, it is under no compulsion to behave a particular way. You can ask it to perform a service in exchange for payment, but it isn't obliged to do so. Payment: 100 GP per minute, 1,000 GP per hour, 10,000 GP per day (up to 10 days). The GM can adjust. The creature returns to its home plane after the task or when the agreed duration expires.",
            summary: 'Summon Celestial/Elemental/Fiend. Bargain for service. Payment scales with task.',
        },
    },
    {
        id: 'programmed-illusion',
        name: 'Programmed Illusion',
        school: 'illusion',
        level: 6,
        classes: ['bard', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 120, unit: 'ft' } },
        duration: { kind: 'until-dispelled' },
        components: { verbal: true, somatic: true, material: { description: 'jade dust worth 25+ GP', cost: { value: 25, unit: 'gp', atLeast: true } } },
        resolution: {
            caveats: [
                'Trigger conditions and scripted performance are narrative; Investigation DC is GM-set.',
            ],
        },
        effectGroups: [
            {
                effects: [
                    {
                        kind: 'note',
                        text: 'Illusion up to 30ft cube. Imperceptible until trigger (visual/audible within 30ft). Scripted performance up to 5 min. Dormant 10 min after. Study + Int (Investigation) to discern.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "You create an illusion of an object, a creature, or some other visible phenomenon within range that activates when a specific trigger occurs. The illusion is imperceptible until then. It must be no larger than a 30-foot Cube, and you decide when you cast the spell how the illusion behaves and what sounds it makes. This scripted performance can last up to 5 minutes. When the trigger you specify occurs, the illusion springs into existence and performs. Once finished, it disappears and remains dormant for 10 minutes, after which it can be activated again. The trigger must be based on visual or audible phenomena within 30 feet of the area. Physical interaction reveals the illusion. Study + Int (Investigation) vs DC to discern.",
            summary: 'Triggered illusion up to 30ft cube. 5 min performance. Repeats after 10 min dormant.',
        },
    },
    {
        id: 'sunbeam',
        name: 'Sunbeam',
        school: 'evocation',
        level: 6,
        classes: ['cleric', 'druid', 'sorcerer', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'self' },
        duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
        components: { verbal: true, somatic: true, material: { description: 'a magnifying glass' } },
        resolution: {
            caveats: [
                'New Line on later turns uses a Magic action; Blinded duration is until the start of your next turn.',
            ],
        },
        effectGroups: [
            {
                targeting: { selection: 'in-area', targetType: 'creature', area: { kind: 'line', size: 60 } },
                effects: [
                    {
                        kind: 'save',
                        save: { ability: 'con' },
                        onFail: [
                            { kind: 'damage', damage: '6d8', damageType: 'radiant' },
                            { kind: 'condition', conditionId: 'blinded', duration: { kind: 'until-turn-boundary', subject: 'source', turn: 'next', boundary: 'start' } },
                        ],
                        onSuccess: [{ kind: 'damage', damage: '3d8', damageType: 'radiant' }],
                    },
                    { kind: 'note', text: 'Magic action on subsequent turns to create new Line.', category: 'under-modeled' as const },
                    { kind: 'note', text: 'Mote sheds Bright Light 30ft and Dim Light 30ft (counts as sunlight).', category: 'flavor' as const }
                ]
            }
        ],
        description: {
            full: "You launch a sunbeam in a 5-foot-wide, 60-foot-long Line. Each creature in the Line makes a Constitution saving throw. On a failed save, a creature takes 6d8 Radiant damage and has the Blinded condition until the start of your next turn. On a successful save, it takes half as much damage only. Until the spell ends, you can take a Magic action to create a new Line of radiance. For the duration, a mote of brilliant radiance shines above you. It sheds Bright Light in a 30-foot radius and Dim Light for an additional 30 feet. This light is sunlight.",
            summary: '60ft Line: Con save or 6d8 Radiant + Blinded. Magic action: new Line. Sunlight mote.',
        },
    },
    {
        id: 'transport-via-plants',
        name: 'Transport via Plants',
        school: 'conjuration',
        level: 6,
        classes: ['druid'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 10, unit: 'ft' } },
        duration: { kind: 'timed', value: 1, unit: 'minute' },
        components: { verbal: true, somatic: true },
        resolution: {
            caveats: [
                'Destination plant must be known; portal usage is voluntary movement, not forced teleport.',
            ],
        },
        effectGroups: [
            {
                effects: [
                    { kind: 'note', text: 'Link a Large or larger plant to another plant on the same plane. Any creature can step in (5ft movement) and exit from destination (5ft movement). Must have seen or touched destination plant.', category: 'flavor' as const }
                ]
            }
        ],
        description: {
            full: "This spell creates a magical link between a Large or larger inanimate plant within range and another plant, at any distance, on the same plane of existence. You must have seen or touched the destination plant at least once before. For the duration, any creature can step into the target plant and exit from the destination plant by using 5 feet of movement.",
            summary: 'Link two plants. Step into one, exit from other. 5ft movement each way.',
        },
    },
    {
        id: 'true-seeing',
        name: 'True Seeing',
        school: 'divination',
        level: 6,
        classes: ['bard', 'cleric', 'sorcerer', 'warlock', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'touch' },
        duration: { kind: 'timed', value: 1, unit: 'hour' },
        components: { verbal: true, somatic: true, material: { description: 'mushroom powder worth 25+ GP', cost: { value: 25, unit: 'gp', atLeast: true }, consumed: true } },
        resolution: {
            caveats: [
                'Truesight reveals illusions, shapechangers, and Ethereal as per PHB; range is 120 feet.',
            ],
        },
        effectGroups: [
            {
                targeting: { selection: 'one', targetType: 'creature', requiresWilling: true },
                effects: [
                    { kind: 'state', stateId: 'true-seeing', notes: 'Truesight with a range of 120 feet.' }
                ]
            }
        ],
        description: {
            full: "For the duration, the willing creature you touch has Truesight with a range of 120 feet.",
            summary: 'Truesight 120ft for 1 hour.',
        },
    },
    {
        id: 'wall-of-ice',
        name: 'Wall of Ice',
        school: 'evocation',
        level: 6,
        classes: ['wizard'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 120, unit: 'ft' } },
        duration: { kind: 'timed', value: 10, unit: 'minute', concentration: true, upTo: true },
        components: { verbal: true, somatic: true, material: { description: 'a piece of quartz' } },
        resolution: {
            caveats: [
                'Wall sections, breach HP, and post-destruction frigid air use separate saves from the appearance burst.',
            ],
        },
        scaling: [
            {
                category: 'extra-damage',
                description: '+2d6 cold when the wall appears and +1d6 cold from passing through frigid air per slot level above 6',
                mode: 'per-slot-level',
                startsAtSlotLevel: 7,
            },
        ],
        effectGroups: [
            {
                effects: [
                    {
                        kind: 'note',
                        text: 'Dome/globe 10ft radius or ten 10ft panels. Appear: Dex save or 10d6 cold, pushed. AC 12, 30 HP per 10ft. Vulnerability Fire. Destroyed leaves frigid air: Con save or 5d6 cold. +2d6/+1d6 per slot above 6.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "You create a wall of ice on a solid surface within range. You can form it into a hemispherical dome or a globe with a radius of up to 10 feet, or you can shape a flat surface made up of ten 10-foot-square panels. Each panel must be contiguous with another panel. In any form, the wall is 1 foot thick and lasts for the duration. If the wall cuts through a creature's space when it appears, the creature is pushed to one side of the wall (you choose which side) and makes a Dexterity saving throw, taking 10d6 Cold damage on a failed save or half as much damage on a successful one. The wall is an object that can be damaged and thus breached. It has AC 12 and 30 Hit Points per 10-foot section, and it has Immunity to Cold, Poison, and Psychic damage and Vulnerability to Fire damage. Reducing a 10-foot section of wall to 0 Hit Points destroys it and leaves behind a sheet of frigid air in the space the wall occupied. A creature moving through the sheet of frigid air for the first time on a turn makes a Constitution saving throw, taking 5d6 Cold damage on a failed save or half as much damage on a successful one. Using a Higher-Level Spell Slot. The damage the wall deals when it appears increases by 2d6 and the damage from passing through the sheet of frigid air increases by 1d6 for each spell slot level above 6.",
            summary: 'Ice wall. Dex save or 10d6 cold. AC 12, 30 HP per 10ft. Frigid air: Con save or 5d6. +2d6/+1d6 per slot.',
        },
    },
    {
        id: 'wall-of-thorns',
        name: 'Wall of Thorns',
        school: 'conjuration',
        level: 6,
        classes: ['druid'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 120, unit: 'ft' } },
        duration: { kind: 'timed', value: 10, unit: 'minute', concentration: true, upTo: true },
        components: { verbal: true, somatic: true, material: { description: 'a handful of thorns' } },
        resolution: {
            caveats: [
                'Piercing on appearance vs slashing when moving through/ending turn in the wall are separate damage instances.',
            ],
        },
        scaling: [{ category: 'extra-damage', description: '+1d8 piercing and +1d8 slashing per slot level above 6', mode: 'per-slot-level', startsAtSlotLevel: 7, amount: '1d8' }],
        effectGroups: [
            {
                effects: [
                    {
                        kind: 'note',
                        text: 'Wall 60ft long or 20ft circle, 10ft high, 5ft thick. Blocks line of sight. Appear: Dex save or 7d8 piercing. Move through: 4ft per 1ft. Enter/end turn: Dex save or 7d8 slashing. +1d8 both per slot above 6.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "You create a wall of tangled brush bristling with needle-sharp thorns. The wall appears within range on a solid surface and lasts for the duration. You choose to make the wall up to 60 feet long, 10 feet high, and 5 feet thick or a circle that has a 20-foot diameter and is up to 20 feet high and 5 feet thick. The wall blocks line of sight. When the wall appears, each creature in its area makes a Dexterity saving throw, taking 7d8 Piercing damage on a failed save or half as much damage on a successful one. A creature can move through the wall, albeit slowly and painfully. For every 1 foot a creature moves through the wall, it must spend 4 feet of movement. Furthermore, the first time a creature enters a space in the wall on a turn or ends its turn there, the creature makes a Dexterity saving throw, taking 7d8 Slashing damage on a failed save or half as much damage on a successful one. A creature makes this save only once per turn. Using a Higher-Level Spell Slot. Both types of damage increase by 1d8 for each spell slot level above 6.",
            summary: 'Thorn wall. Dex save or 7d8 piercing. 4ft movement per 1ft. Enter/end turn: 7d8 slashing. +1d8 per slot.',
        },
    },
    {
        id: 'wind-walk',
        name: 'Wind Walk',
        school: 'transmutation',
        level: 6,
        classes: ['druid'],
        castingTime: { normal: { value: 1, unit: 'minute' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 30, unit: 'ft' } },
        duration: { kind: 'timed', value: 8, unit: 'hour' },
        components: { verbal: true, somatic: true, material: { description: 'a candle' } },
        resolution: {
            caveats: [
                'Up to ten willing targets; cloud form action economy (Dash vs Magic action revert) is summarized in notes.',
            ],
        },
        effectGroups: [
            {
                effects: [
                    { kind: 'state', stateId: 'wind-walk', notes: 'Cloud form. Fly Speed 300ft, hover. Only Dash or Magic action to revert (1 min transformation, Stunned while reverting).' },
                    { kind: 'modifier', target: 'resistance', mode: 'add', value: 'bludgeoning' as ModifierValue },
                    { kind: 'modifier', target: 'resistance', mode: 'add', value: 'piercing' as ModifierValue },
                    { kind: 'modifier', target: 'resistance', mode: 'add', value: 'slashing' as ModifierValue },
                    { kind: 'grant', grantType: 'condition-immunity', value: 'prone' },
                    { kind: 'note', text: 'Up to 10 willing creatures. Reverting takes 1 min (Stunned). Can revert to cloud again with Magic action + 1 min.', category: 'flavor' as const }
                ]
            }
        ],
        description: {
            full: "You and up to ten willing creatures of your choice within range assume gaseous forms for the duration, appearing as wisps of cloud. While in this cloud form, a target has a Fly Speed of 300 feet and can hover; it has Immunity to the Prone condition; and it has Resistance to Bludgeoning, Piercing, and Slashing damage. The only actions a target can take in this form are the Dash action or a Magic action to begin reverting to its normal form. Reverting takes 1 minute, during which the target has the Stunned condition. Until the spell ends, the target can revert to cloud form, which also requires a Magic action followed by a 1-minute transformation. If a target is in cloud form and flying when the effect ends, the target descends 60 feet per round for 1 minute until it lands, which it does safely. If it can't land after 1 minute, it falls the remaining distance.",
            summary: 'Gaseous form: Fly 300ft, Resistance B/P/S. Magic action to revert (1 min Stunned).',
        },
    },
    {
        id: 'word-of-recall',
        name: 'Word of Recall',
        school: 'conjuration',
        level: 6,
        classes: ['cleric'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 5, unit: 'ft' } },
        duration: { kind: 'instantaneous' },
        components: { verbal: true },
        resolution: {
            caveats: [
                'Sanctuary must be designated beforehand by casting there; arrival space is nearest unoccupied to the prepared spot.',
            ],
        },
        effectGroups: [
            {
                effects: [
                    { kind: 'note', text: 'You and up to 5 willing creatures within 5ft teleport to a previously designated sanctuary. Must prepare by casting this spell at the location first.', category: 'flavor' as const }
                ]
            }
        ],
        description: {
            full: "You and up to five willing creatures within 5 feet of you instantly teleport to a previously designated sanctuary. You and any creatures that teleport with you appear in the nearest unoccupied space to the spot you designated when you prepared your sanctuary (see below). If you cast this spell without first preparing a sanctuary, the spell has no effect. You must designate a location, such as a temple, as a sanctuary by casting this spell there.",
            summary: 'Teleport self and up to 5 to designated sanctuary. Prepare by casting there first.',
        },
    },
];
