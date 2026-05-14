import type { ModifierValue } from '@/features/mechanics/domain/effects/effects.types';
import type { SpellEntry } from '../types';
/**
 * Level 3 spells A–L — authoring status:
 * - **Attack/save/AoE modeled:** Call Lightning, Conjure Animals (spectral pack), Fear, Fireball, Fly (notes), Haste, Hypnotic Pattern, Lightning Bolt, Slow, Spirit Guardians (in m–z).
 * - **Utility / sense / state:** Blink, Clairvoyance, Gaseous Form (extra targets), Nondetection, Tongues, Water Breathing / Water Walk (in m–z).
 * - **Note-first / heavy caveats:** Beacon of Hope, Bestow Curse, Counterspell, Daylight, Dispel Magic, Glyph of Warding, Magic Circle, Major Image, etc. (Animate Dead: dead humanoid + remains → spawn.)
 */
export const SPELLS_LEVEL_3_A_L: readonly SpellEntry[] = [
    {
        id: 'animate-dead',
        name: 'Animate Dead',
        school: 'necromancy',
        level: 3,
        classes: ['cleric', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'minute' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 10, unit: 'ft' } },
        duration: { kind: 'instantaneous' },
        components: { verbal: true, somatic: true, material: { description: 'a drop of blood, a piece of flesh, and a pinch of bone dust' } },
        effectGroups: [
            {
                targeting: {
                    selection: 'one', targetType: 'dead-creature',
                    creatureTypeFilter: ['humanoid']
                },
                effects: [
                    {
                        kind: 'spawn',
                        count: 1,
                        placement: { kind: 'inherit-from-target' },
                        mapMonsterIdFromTargetRemains: { corpse: 'zombie', bones: 'skeleton' },
                        initiativeMode: 'individual',
                    },
                    {
                        kind: 'note',
                        text: 'Bonus Action to command within 60 ft. Reassert control for up to four creatures with a repeat cast. +2 undead per slot level above 3.',
                        category: 'flavor' as const,
                    }
                ]
            }
        ],
        scaling: [{ category: 'other', description: '+2 undead creatures per spell slot level above 3', mode: 'per-slot-level', startsAtSlotLevel: 4 }],
        description: {
            full: "Choose a pile of bones or a corpse of a Medium or Small Humanoid within range. The target becomes an Undead creature: a Skeleton if you chose bones or a Zombie if you chose a corpse. On each of your turns, you can take a Bonus Action to mentally command any creature you made with this spell if the creature is within 60 feet of you. The creature is under your control for 24 hours, after which it stops obeying any command you've given it. To maintain control of the creature for another 24 hours, you must cast this spell on the creature again before the current 24-hour period ends. This use of the spell reasserts your control over up to four creatures you have animated with this spell rather than animating a new creature. Using a Higher-Level Spell Slot. You animate or reassert control over two additional Undead creatures for each spell slot level above 3.",
            summary: 'Create Skeleton or Zombie from bones/corpse. Control 24h; re-cast to maintain. Scales with extra undead.',
        },
    },
    {
        id: 'beacon-of-hope',
        name: 'Beacon of Hope',
        school: 'abjuration',
        level: 3,
        classes: ['cleric'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 30, unit: 'ft' } },
        duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
        components: { verbal: true, somatic: true },
        resolution: {
            caveats: [
                'Advantage on saves and max healing from dice are not enforced automatically.',
            ],
        },
        effectGroups: [
            {
                effects: [
                    {
                        kind: 'note',
                        text: 'Any number of creatures in range: Advantage on Wisdom saving throws and Death Saving Throws; regain maximum HP from healing.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "Choose any number of creatures within range. For the duration, each target has Advantage on Wisdom saving throws and Death Saving Throws and regains the maximum number of Hit Points possible from any healing.",
            summary: 'Advantage on Wis and Death saves; healing restores max HP.',
        },
    },
    {
        id: 'bestow-curse',
        name: 'Bestow Curse',
        school: 'necromancy',
        level: 3,
        classes: ['bard', 'cleric', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'touch' },
        duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
        components: { verbal: true, somatic: true },
        resolution: {
            caveats: [
                'Curse option, duration by slot, and concentration at high levels are not fully enforced.',
            ],
        },
        effectGroups: [
            {
                targeting: { selection: 'one', targetType: 'creature' },
                effects: [
                    {
                        kind: 'save',
                        save: { ability: 'wis' },
                        onFail: [{ kind: 'state', stateId: 'bestow-curse', notes: 'Curse: choose one listed effect in spell text.' }],
                    },
                    {
                        kind: 'note',
                        text: 'Choose one curse effect (ability Disadvantage, attacks vs you, Dodge-only, or +1d8 necrotic on your hits). Duration extends with higher-level slots per spell text.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "You touch a creature, which must succeed on a Wisdom saving throw or become cursed for the duration. Choose one effect: Disadvantage on ability checks and saves with one ability; Disadvantage on attack rolls against you; must save at turn start or take Dodge only; or +1d8 Necrotic when you hit with attack/spell. Using a Higher-Level Spell Slot. Level 4: 10 min. Level 5+: no Concentration, 8h (5-6) or 24h (7-8). Level 9: until dispelled.",
            summary: 'Touch: Wis save or cursed with one of four effects. Duration scales with slot level.',
        },
    },
    {
        id: 'blink',
        name: 'Blink',
        school: 'transmutation',
        level: 3,
        classes: ['sorcerer', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'self' },
        duration: { kind: 'timed', value: 1, unit: 'minute' },
        components: { verbal: true, somatic: true },
        effectGroups: [
            {
                effects: [
                    { kind: 'state', stateId: 'blink', notes: 'Roll 1d6 at end of each turn. On 4-6, vanish to Ethereal Plane until start of next turn. Return to space within 10ft.' }
                ]
            }
        ],
        description: {
            full: "Roll 1d6 at the end of each of your turns for the duration. On a roll of 4–6, you vanish from your current plane of existence and appear in the Ethereal Plane. While there, you can perceive the plane you left in shades of gray but can't see more than 60 feet away. You return to an unoccupied space of your choice within 10 feet of the space you left at the start of your next turn.",
            summary: '50% chance each turn to blink to Ethereal Plane. Return at start of next turn.',
        },
    },
    {
        id: 'call-lightning',
        name: 'Call Lightning',
        school: 'conjuration',
        level: 3,
        classes: ['druid'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 120, unit: 'ft' } },
        duration: { kind: 'timed', value: 10, unit: 'minute', concentration: true, upTo: true },
        components: { verbal: true, somatic: true },
        effectGroups: [
            {
                targeting: { selection: 'in-area', targetType: 'creature', area: { kind: 'sphere', size: 5 } },
                effects: [
                    {
                        kind: 'save',
                        save: { ability: 'dex' },
                        onFail: [{ kind: 'damage', damage: '3d10', damageType: 'lightning' }],
                        onSuccess: [{ kind: 'damage', damage: '1d10', damageType: 'lightning' }],
                    },
                    { kind: 'note', text: 'Requires Magic action each turn after first cast to call lightning again. +1d10 damage if outdoors in a storm.', category: 'under-modeled' as const }
                ]
            }
        ],
        scaling: [{ category: 'extra-damage', description: '+1d10 lightning per slot level above 3', mode: 'per-slot-level', startsAtSlotLevel: 4, amount: '1d10' }],
        description: {
            full: "A storm cloud appears at a point within range that you can see above yourself. It takes the shape of a Cylinder that is 10 feet tall with a 60-foot radius. When you cast the spell, choose a point you can see under the cloud. A lightning bolt shoots from the cloud to that point. Each creature within 5 feet of that point makes a Dexterity saving throw, taking 3d10 Lightning damage on a failed save or half as much on a successful one. Until the spell ends, you can take a Magic action to call down lightning again. If outdoors in a storm, damage increases by 1d10. Using a Higher-Level Spell Slot. The damage increases by 1d10 for each spell slot level above 3.",
            summary: 'Storm cloud: Magic action to strike 3d10 lightning. +1d10 in storm or per slot.',
        },
    },
    {
        id: 'clairvoyance',
        name: 'Clairvoyance',
        school: 'divination',
        level: 3,
        classes: ['bard', 'cleric', 'sorcerer', 'wizard'],
        castingTime: { normal: { value: 10, unit: 'minute' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 5280, unit: 'ft' } },
        duration: { kind: 'timed', value: 10, unit: 'minute', concentration: true, upTo: true },
        components: { verbal: true, somatic: true, material: { description: 'a focus worth 100+ GP (jeweled horn for hearing or glass eye for seeing)', cost: { value: 100, unit: 'gp', atLeast: true } } },
        effectGroups: [
            {
                effects: [
                    { kind: 'state', stateId: 'clairvoyance', notes: 'Invisible sensor at familiar or obvious location. Choose seeing or hearing. Bonus Action to switch.' }
                ]
            }
        ],
        description: {
            full: "You create an Invisible sensor within range in a location familiar to you or in an obvious location that is unfamiliar. The intangible, invulnerable sensor remains in place for the duration. When you cast the spell, choose seeing or hearing. You can use the chosen sense through the sensor as if you were in its space. As a Bonus Action, you can switch between seeing and hearing.",
            summary: 'Invisible sensor at location. See or hear through it; Bonus action to switch.',
        },
    },
    {
        id: 'conjure-animals',
        name: 'Conjure Animals',
        school: 'conjuration',
        level: 3,
        classes: ['druid', 'ranger'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
        duration: { kind: 'timed', value: 10, unit: 'minute', concentration: true, upTo: true },
        components: { verbal: true, somatic: true },
        effectGroups: [
            {
                targeting: { selection: 'in-area', targetType: 'creature', area: { kind: 'sphere', size: 10 } },
                effects: [
                    { kind: 'save', save: { ability: 'dex' }, onFail: [{ kind: 'damage', damage: '3d10', damageType: 'slashing' }] },
                    { kind: 'roll-modifier', appliesTo: 'saving-throws', modifier: 'advantage', text: 'Advantage on Str saves while within 5ft of pack.' },
                    { kind: 'note', text: 'Large spectral pack. Move pack up to 30ft when you move. Save triggered when pack moves within 10ft of a creature or creature enters/ends turn there.', category: 'under-modeled' as const }
                ]
            }
        ],
        description: {
            full: "You conjure nature spirits that appear as a Large pack of spectral, intangible animals. You have Advantage on Strength saving throws within 5 feet of the pack. When you move, you can move the pack up to 30 feet. Whenever the pack moves within 10 feet of a creature or a creature enters/ends turn there, you can force a Dexterity saving throw: 3d10 Slashing on fail. Using a Higher-Level Spell Slot. The damage increases by 1d10 for each spell slot level above 3.",
            summary: 'Spectral animal pack. Dex save 3d10 slashing when near. Damage scales with slot.',
        },
    },
    {
        id: 'counterspell',
        name: 'Counterspell',
        school: 'abjuration',
        level: 3,
        classes: ['sorcerer', 'warlock', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'reaction', trigger: 'when you see a creature within 60 feet of yourself casting a spell with Verbal, Somatic, or Material components' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
        duration: { kind: 'instantaneous' },
        components: { somatic: true },
        resolution: {
            caveats: [
                'Countering a specific casting and slot refund are not simulated in encounter.',
            ],
        },
        effectGroups: [
            {
                effects: [
                    {
                        kind: 'note',
                        text: 'Reaction: target makes a Con save or the spell fails with no effect; if a spell slot was used, it is not expended.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "You attempt to interrupt a creature in the process of casting a spell. The creature makes a Constitution saving throw. On a failed save, the spell dissipates with no effect, and the action, Bonus Action, or Reaction used to cast it is wasted. If that spell was cast with a spell slot, the slot isn't expended.",
            summary: 'Reaction: interrupt spell. Con save or spell fails.',
        },
    },
    {
        id: 'create-food-and-water',
        name: 'Create Food and Water',
        school: 'conjuration',
        level: 3,
        classes: ['cleric', 'paladin'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 30, unit: 'ft' } },
        duration: { kind: 'instantaneous' },
        components: { verbal: true, somatic: true },
        effectGroups: [
            {
                effects: [
                    { kind: 'note', text: 'Create 45 pounds of food and 30 gallons of fresh water. Bland but nourishing. Food spoils after 24 hours.', category: 'flavor' as const }
                ]
            }
        ],
        description: {
            full: "You create 45 pounds of food and 30 gallons of fresh water on the ground or in containers within range—both useful in fending off malnutrition and dehydration. The food is bland but nourishing and looks like a food of your choice, and the water is clean. The food spoils after 24 hours if uneaten.",
            summary: 'Create 45 lb food and 30 gal water. Spoils after 24h.',
        },
    },
    {
        id: 'daylight',
        name: 'Daylight',
        school: 'evocation',
        level: 3,
        classes: ['cleric', 'druid', 'paladin', 'ranger', 'sorcerer'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
        duration: { kind: 'timed', value: 1, unit: 'hour' },
        components: { verbal: true, somatic: true },
        resolution: {
            caveats: [
                'Light vs. Darkness overlap and object emanation are not fully modeled.',
                'Like Darkness: default is a sphere at a point or an emanation from an object—not caster-centered. Do not use the shared `emanation` effect (`attachedTo: self`) here until place/object anchor authoring exists.',
            ],
        },
        effectGroups: [
            {
                effects: [
                    {
                        kind: 'note',
                        text: '60-foot-radius Sphere of sunlight (Bright Light; Dim Light 60 ft beyond) or 60-foot Emanation from an object. Dispels Darkness of level 3 or lower in overlap.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "For the duration, sunlight spreads from a point within range and fills a 60-foot-radius Sphere. The sunlight's area is Bright Light and sheds Dim Light for an additional 60 feet. Alternatively, cast on object for 60-foot Emanation. If area overlaps Darkness from spell level 3 or lower, that spell is dispelled.",
            summary: '60ft sphere sunlight. Dispels lower-level Darkness.',
        },
    },
    {
        id: 'dispel-magic',
        name: 'Dispel Magic',
        school: 'abjuration',
        level: 3,
        classes: ['bard', 'cleric', 'druid', 'paladin', 'ranger', 'sorcerer', 'warlock', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 120, unit: 'ft' } },
        duration: { kind: 'instantaneous' },
        components: { verbal: true, somatic: true },
        resolution: {
            caveats: [
                'Which ongoing spells end and ability checks vs. higher-level effects are not automated.',
            ],
        },
        effectGroups: [
            {
                effects: [
                    {
                        kind: 'note',
                        text: 'End ongoing spells of level 3 or lower on the target; ability check vs. DC 10 + spell level for higher spells; higher slot can auto-end if spell level ≤ slot level.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "Choose one creature, object, or magical effect within range. Any ongoing spell of level 3 or lower on the target ends. For each ongoing spell of level 4 or higher on the target, make an ability check using your spellcasting ability (DC 10 plus that spell's level). On a successful check, the spell ends. Using a Higher-Level Spell Slot. You automatically end a spell on the target if the spell's level is equal to or less than the level of the spell slot you use.",
            summary: 'End level 3 or lower spells. Check for higher. Higher slot auto-ends lower spells.',
        },
    },
    {
        id: 'fear',
        name: 'Fear',
        school: 'illusion',
        level: 3,
        classes: ['bard', 'sorcerer', 'warlock', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'self' },
        duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
        components: { verbal: true, somatic: true, material: { description: 'a white feather' } },
        effectGroups: [
            {
                targeting: { selection: 'in-area', targetType: 'creature', area: { kind: 'cone', size: 30 } },
                effects: [
                    {
                        kind: 'save',
                        save: { ability: 'wis' },
                        onFail: [{ kind: 'condition', conditionId: 'frightened', repeatSave: { ability: 'wis', timing: 'turn-end' } }],
                    },
                    { kind: 'note', text: 'Frightened creature drops held items, must Dash away each turn.', category: 'flavor' as const },
                    { kind: 'note', text: 'Repeat save only available when no line of sight to caster.', category: 'under-modeled' as const }
                ]
            }
        ],
        description: {
            full: "Each creature in a 30-foot Cone must succeed on a Wisdom saving throw or drop whatever it is holding and have the Frightened condition for the duration. A Frightened creature takes the Dash action and moves away from you by the safest route on each of its turns unless there is nowhere to move. If the creature ends its turn in a space where it doesn't have line of sight to you, the creature makes a Wisdom saving throw. On a successful save, the spell ends on that creature.",
            summary: '30ft cone: Wis save or Frightened, must flee. Save if no line of sight.',
        },
    },
    {
        id: 'fireball',
        name: 'Fireball',
        school: 'evocation',
        level: 3,
        classes: ['sorcerer', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 150, unit: 'ft' } },
        duration: { kind: 'instantaneous' },
        components: { verbal: true, somatic: true, material: { description: 'a ball of bat guano and sulfur' } },
        effectGroups: [
            {
                targeting: {
                    selection: 'in-area', targetType: 'creature',
                    rangeFeet: 150,
                    area: {
                        kind: 'sphere',
                        size: 20,
                    }
                },
                effects: [
                    {
                        kind: 'save',
                        save: { ability: 'dex' },
                        onFail: [{ kind: 'damage', damage: '8d6', damageType: 'fire' }],
                        onSuccess: [{ kind: 'damage', damage: '4d6', damageType: 'fire' }],
                    },
                    {
                        kind: 'note',
                        text: "Flammable objects in the area that aren't being worn or carried start burning.",
                    }
                ]
            }
        ],
        scaling: [{ category: 'extra-damage', description: 'Damage increases by 1d6 for each slot level above 3rd.', mode: 'per-slot-level', startsAtSlotLevel: 3, amount: '1d6' }],
        description: {
            full: "A bright streak flashes from you to a point you choose within range and then blossoms with a low roar into a fiery explosion. Each creature in a 20-foot-radius Sphere centered on that point makes a Dexterity saving throw, taking 8d6 Fire damage on a failed save or half as much damage on a successful one. Flammable objects in the area that aren't being worn or carried start burning.",
            summary: '20-foot-radius fire explosion dealing 8d6 fire damage; Dexterity save for half.',
        },
    },
    {
        id: 'fly',
        name: 'Fly',
        school: 'transmutation',
        level: 3,
        classes: ['sorcerer', 'warlock', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'touch' },
        duration: { kind: 'timed', value: 10, unit: 'minute', concentration: true, upTo: true },
        components: { verbal: true, somatic: true, material: { description: 'a feather' } },
        resolution: {
            caveats: [
                'Fly Speed and falling when the spell ends are not applied automatically.',
            ],
        },
        effectGroups: [
            {
                targeting: { selection: 'one', targetType: 'creature', requiresWilling: true },
                effects: [
                    {
                        kind: 'state',
                        stateId: 'fly',
                        notes: 'Fly Speed 60 feet and can hover.',
                    },
                    {
                        kind: 'note',
                        text: 'When the spell ends, the target falls if still aloft unless it can stop the fall.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        scaling: [{ category: 'extra-targets', description: '+1 target per spell slot level above 3', mode: 'per-slot-level', startsAtSlotLevel: 4 }],
        description: {
            full: "You touch a willing creature. For the duration, the target gains a Fly Speed of 60 feet and can hover. When the spell ends, the target falls if it is still aloft unless it can stop the fall. Using a Higher-Level Spell Slot. You can target one additional creature for each spell slot level above 3.",
            summary: 'Grant Fly 60ft and hover. Target falls when spell ends. Scales with targets.',
        },
    },
    {
        id: 'gaseous-form',
        name: 'Gaseous Form',
        school: 'transmutation',
        level: 3,
        classes: ['sorcerer', 'warlock', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'touch' },
        duration: { kind: 'timed', value: 1, unit: 'hour', concentration: true, upTo: true },
        components: { verbal: true, somatic: true, material: { description: 'a bit of gauze' } },
        resolution: {
            caveats: [
                'Gaseous movement limits, liquid-as-solid, and no attacks/spells are not fully enforced.',
            ],
        },
        effectGroups: [
            {
                targeting: { selection: 'one', targetType: 'creature', requiresWilling: true },
                effects: [
                    { kind: 'state', stateId: 'gaseous-form', notes: 'Misty cloud. Fly 10ft, hover. Can pass through openings as small as 1 inch.' },
                    { kind: 'modifier', target: 'resistance', mode: 'add', value: 'bludgeoning' as ModifierValue },
                    { kind: 'modifier', target: 'resistance', mode: 'add', value: 'piercing' as ModifierValue },
                    { kind: 'modifier', target: 'resistance', mode: 'add', value: 'slashing' as ModifierValue },
                    { kind: 'roll-modifier', appliesTo: 'saving-throws', modifier: 'advantage', text: 'Advantage on Str, Dex, and Con saves.' }
                ]
            }
        ],
        scaling: [{ category: 'extra-targets', description: '+1 target per spell slot level above 3', mode: 'per-slot-level', startsAtSlotLevel: 4 }],
        description: {
            full: "A willing creature you touch shape-shifts, along with everything it's wearing and carrying, into a misty cloud for the duration. The spell ends on the target if it drops to 0 Hit Points or if it takes a Magic action to end the spell on itself. While in this form, the target's only method of movement is a Fly Speed of 10 feet, and it can hover. The target can enter and occupy the space of another creature. The target has Resistance to Bludgeoning, Piercing, and Slashing damage; it has Immunity to the Prone condition; and it has Advantage on Strength, Dexterity, and Constitution saving throws. The target can pass through narrow openings, but it treats liquids as though they were solid surfaces. The target can't talk or manipulate objects, and any objects it was carrying or holding can't be dropped, used, or otherwise interacted with. Finally, the target can't attack or cast spells. Using a Higher-Level Spell Slot. You can target one additional creature for each spell slot level above 3.",
            summary: 'Misty form: Fly 10ft, Resistance B/P/S, pass through openings. Scales with targets.',
        },
    },
    {
        id: 'glyph-of-warding',
        name: 'Glyph of Warding',
        school: 'abjuration',
        level: 3,
        classes: ['bard', 'cleric', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'hour' }, canBeCastAsRitual: false },
        range: { kind: 'touch' },
        duration: { kind: 'until-dispelled', concentration: false },
        components: { verbal: true, somatic: true, material: { description: 'powdered diamond worth 200+ GP', cost: { value: 200, unit: 'gp', atLeast: true }, consumed: true } },
        resolution: {
            caveats: [
                'Triggers, explosive runes, and stored spells are not simulated in encounter.',
            ],
        },
        effectGroups: [
            {
                effects: [
                    {
                        kind: 'note',
                        text: 'Inscribe glyph on a surface or in a closed object; set trigger. Explosive rune: 20-foot Sphere, Dex save, 5d8 damage (type chosen). Spell glyph: store a spell of 3rd level or lower. Scales with slot.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        scaling: [{ category: 'other', description: 'Explosive damage +1d8 per slot above 3; spell glyph can store higher-level spells', mode: 'per-slot-level', startsAtSlotLevel: 4 }],
        description: {
            full: "You inscribe a glyph that later unleashes a magical effect. You inscribe it either on a surface (such as a table or a section of floor) or within an object that can be closed (such as a book or chest) to conceal the glyph. The glyph can cover an area no larger than 10 feet in diameter. If the surface or object is moved more than 10 feet from where you cast this spell, the glyph is broken, and the spell ends without being triggered. The glyph is nearly imperceptible and requires a successful Wisdom (Perception) check against your spell save DC to notice. When you inscribe the glyph, you set its trigger and choose whether it's an explosive rune or a spell glyph. Explosive Rune: When triggered, 20-foot-radius Sphere, Dex save 5d8 Acid/Cold/Fire/Lightning/Thunder (your choice). Spell Glyph: Store spell 3rd or lower. When triggered, stored spell takes effect. Using a Higher-Level Spell Slot. Explosive rune damage +1d8 per slot above 3. Spell glyph can store spell up to slot level.",
            summary: 'Inscribe glyph with trigger. Explosive rune or spell storage. Damage/stored level scale with slot.',
        },
    },
    {
        id: 'haste',
        name: 'Haste',
        school: 'transmutation',
        level: 3,
        classes: ['sorcerer', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 30, unit: 'ft' } },
        duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
        components: { verbal: true, somatic: true, material: { description: 'a shaving of licorice root' } },
        effectGroups: [
            {
                targeting: { selection: 'one', targetType: 'creature', requiresWilling: true },
                effects: [
                    { kind: 'modifier', target: 'armor_class', mode: 'add', value: 2 },
                    { kind: 'roll-modifier', appliesTo: 'dexterity-saves', modifier: 'advantage' },
                    { kind: 'modifier', target: 'speed' as const, mode: 'multiply' as const, value: 2 },
                    { kind: 'note', text: 'Extra action each turn (Attack one weapon only, Dash, Disengage, Hide, Utilize). When spell ends: cannot move or take actions until end of next turn.', category: 'under-modeled' as const }
                ]
            }
        ],
        description: {
            full: "Choose a willing creature that you can see within range. Until the spell ends, the target's Speed is doubled, it gains a +2 bonus to Armor Class, it has Advantage on Dexterity saving throws, and it gains an additional action on each of its turns. That action can be used to take only the Attack (one attack only), Dash, Disengage, Hide, or Utilize action. When the spell ends, the target is Incapacitated and has a Speed of 0 until the end of its next turn, as a wave of lethargy washes over it.",
            summary: 'Double Speed, +2 AC, Advantage Dex saves, extra action. Lethargy when spell ends.',
        },
    },
    {
        id: 'hypnotic-pattern',
        name: 'Hypnotic Pattern',
        school: 'illusion',
        level: 3,
        classes: ['bard', 'sorcerer', 'warlock', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 120, unit: 'ft' } },
        duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
        components: { somatic: true, material: { description: 'a pinch of confetti' } },
        effectGroups: [
            {
                targeting: { selection: 'in-area', targetType: 'creature', area: { kind: 'cube', size: 30 } },
                effects: [
                    {
                        kind: 'save',
                        save: { ability: 'wis' },
                        onFail: [
                            { kind: 'condition', conditionId: 'charmed' },
                            { kind: 'condition', conditionId: 'incapacitated' },
                            { kind: 'modifier', target: 'speed' as const, mode: 'set' as const, value: 0 },
                        ],
                    },
                    { kind: 'note', text: 'Ends if creature takes damage or another creature uses an action to shake it.', category: 'flavor' as const }
                ]
            }
        ],
        description: {
            full: "You create a twisting pattern of colors in a 30-foot Cube within range. The pattern appears for a moment and vanishes. Each creature in the area who can see the pattern must succeed on a Wisdom saving throw or have the Charmed condition for the duration. While Charmed, the creature has the Incapacitated condition and a Speed of 0. The spell ends for an affected creature if it takes any damage or if someone else uses an action to shake the creature out of its stupor.",
            summary: '30ft cube: Wis save or Charmed, Incapacitated. Ends on damage or shake.',
        },
    },
    {
        id: 'lightning-bolt',
        name: 'Lightning Bolt',
        school: 'evocation',
        level: 3,
        classes: ['sorcerer', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'self' },
        duration: { kind: 'instantaneous' },
        components: { verbal: true, somatic: true, material: { description: 'a bit of fur and a crystal rod' } },
        effectGroups: [
            {
                targeting: { selection: 'in-area', targetType: 'creature', area: { kind: 'line', size: 100 } },
                effects: [
                    {
                        kind: 'save',
                        save: { ability: 'dex' },
                        onFail: [{ kind: 'damage', damage: '8d6', damageType: 'lightning' }],
                        onSuccess: [{ kind: 'damage', damage: '4d6', damageType: 'lightning' }],
                    },
                    { kind: 'note', text: "The line is 5 feet wide. Flammable objects not being worn or carried start burning.", category: 'flavor' as const }
                ]
            }
        ],
        scaling: [{ category: 'extra-damage', description: '+1d6 lightning per slot level above 3', mode: 'per-slot-level', startsAtSlotLevel: 4, amount: '1d6' }],
        description: {
            full: "A stroke of lightning forming a 100-foot-long, 5-foot-wide Line blasts out from you in a direction you choose. Each creature in the Line makes a Dexterity saving throw, taking 8d6 Lightning damage on a failed save or half as much damage on a successful one. Using a Higher-Level Spell Slot. The damage increases by 1d6 for each spell slot level above 3.",
            summary: '100ft line: Dex save or 8d6 lightning. Damage scales with slot.',
        },
    },
    {
        id: 'magic-circle',
        name: 'Magic Circle',
        school: 'abjuration',
        level: 3,
        classes: ['cleric', 'paladin', 'warlock', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'minute' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 10, unit: 'ft' } },
        duration: { kind: 'timed', value: 1, unit: 'hour' },
        components: { verbal: true, somatic: true, material: { description: 'salt and powdered silver worth 100+ GP', cost: { value: 100, unit: 'gp', atLeast: true }, consumed: true } },
        resolution: {
            caveats: [
                'Circle orientation, teleport saves, and warded creature types are not fully enforced.',
            ],
        },
        effectGroups: [
            {
                effects: [
                    {
                        kind: 'note',
                        text: '10-foot-radius, 20-foot-tall Cylinder; ward against chosen types (Celestial, Elemental, Fey, Fiend, Undead). Can invert to trap inside or protect outside. +1 hour duration per slot level above 3.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        scaling: [{ category: 'longer-duration', description: '+1 hour duration per spell slot level above 3', mode: 'per-slot-level', startsAtSlotLevel: 4 }],
        description: {
            full: "You create a 10-foot-radius, 20-foot-tall Cylinder of magical energy centered on a point on the ground that you can see within range. Choose one or more: Celestials, Elementals, Fey, Fiends, or Undead. The creature can't willingly enter by nonmagical means; Cha save to teleport in. Disadvantage on attack rolls against targets inside. Targets inside can't be possessed or gain Charmed/Frightened from the creature. You can reverse the circle to keep the creature inside and protect targets outside. Using a Higher-Level Spell Slot. The duration increases by 1 hour for each spell slot level above 3.",
            summary: '10ft cylinder wards chosen types. Can reverse to trap inside. +1h per slot.',
        },
    },
    {
        id: 'major-image',
        name: 'Major Image',
        school: 'illusion',
        level: 3,
        classes: ['bard', 'sorcerer', 'warlock', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 120, unit: 'ft' } },
        duration: { kind: 'timed', value: 10, unit: 'minute', concentration: true, upTo: true },
        components: { verbal: true, somatic: true, material: { description: 'a bit of fleece' } },
        resolution: {
            caveats: [
                'Illusion movement, interaction, and slot-based duration are not fully enforced.',
            ],
        },
        effectGroups: [
            {
                effects: [
                    {
                        kind: 'note',
                        text: 'Image up to 20-foot Cube; sound, smell, temperature; Magic action to move; Study + Investigation to discern. Level 4+ slot: lasts until dispelled without Concentration.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "You create the image of an object, a creature, or some other visible phenomenon that is no larger than a 20-foot Cube. The image appears at a spot you can see within range and lasts for the duration. It seems real, including sounds, smells, and temperature, but it can't deal damage or cause conditions. If you are within range, you can take a Magic action to move the image. Physical interaction reveals the illusion. Study + Int (Investigation) vs DC to discern. Using a Higher-Level Spell Slot. The spell lasts until dispelled, without requiring Concentration, if cast with a level 4+ spell slot.",
            summary: '20ft cube illusion with sound, smell, temperature. Slot 4+: until dispelled.',
        },
    },
];
