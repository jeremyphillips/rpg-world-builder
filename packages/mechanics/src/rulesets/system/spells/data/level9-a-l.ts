import type { SpellEntry } from '../types';
/**
 * Level 9 spells (ids **a–l**) — authoring status:
 * - **Utility / travel / binding:** Astral Projection, Gate, Imprisonment.
 * - **Buffs:** Foresight.
 * - **Heavy caveats:** (Most high-impact 9ths are in **m–z**: Mass Heal, Meteor Swarm, Power Words, Wish, etc.)
 */
export const SPELLS_LEVEL_9_A_L: readonly SpellEntry[] = [
    {
        id: 'astral-projection',
        name: 'Astral Projection',
        school: 'necromancy',
        level: 9,
        classes: ['cleric', 'warlock', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'hour' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 10, unit: 'ft' } },
        duration: { kind: 'until-dispelled' },
        components: { verbal: true, somatic: true, material: { description: 'for each target: jacinth 1000+ GP and silver bar 100+ GP', cost: { value: 1100, unit: 'gp', atLeast: true }, consumed: true } },
        resolution: {
            caveats: [
                'Astral travel, silver cord, and plane transitions are not simulated as a full journey system.',
            ],
        },
        effectGroups: [
            {
                effects: [
                    {
                        kind: 'note',
                        text: 'You and up to 8 willing creatures project to Astral Plane. Bodies in suspended animation. Silver cord links forms.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "You and up to eight willing creatures within range project your astral bodies into the Astral Plane. Each target's body is left behind in a state of suspended animation; it has the Unconscious condition, doesn't need food or air, and doesn't age. A target's astral form resembles its body in almost every way, replicating its game statistics and possessions. The principal difference is the addition of a silvery cord that trails from between the shoulder blades. If the cord is cut, the target's body and astral form both die. The moment an astral form leaves the Astral Plane, the target re-enters its body on the new plane. When the spell ends, the target reappears in its body and exits suspended animation.",
            summary: 'Project self and up to 8 creatures to Astral Plane. Bodies in suspended animation; silver cord links forms.',
        },
    },
    {
        id: 'foresight',
        name: 'Foresight',
        school: 'divination',
        level: 9,
        classes: ['bard', 'druid', 'warlock', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'minute' }, canBeCastAsRitual: false },
        range: { kind: 'touch' },
        duration: { kind: 'timed', value: 8, unit: 'hour' },
        components: { verbal: true, somatic: true, material: { description: 'a hummingbird feather' } },
        resolution: {
            caveats: [
                'Advantage on all D20 Tests and defensive Disadvantage are broad; ends if you cast this spell again.',
            ],
        },
        effectGroups: [
            {
                targeting: { selection: 'one', targetType: 'creature', requiresWilling: true },
                effects: [
                    {
                        kind: 'note',
                        text: 'Willing creature: Advantage on d20 tests. Others have Disadvantage to hit. Ends if you cast again.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "You touch a willing creature and bestow a limited ability to see into the immediate future. For the duration, the target has Advantage on D20 Tests, and other creatures have Disadvantage on attack rolls against it. The spell ends early if you cast it again.",
            summary: 'Advantage on d20 tests. Disadvantage to hit target. Ends on recast.',
        },
    },
    {
        id: 'gate',
        name: 'Gate',
        school: 'conjuration',
        level: 9,
        classes: ['cleric', 'sorcerer', 'warlock', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
        duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
        components: { verbal: true, somatic: true, material: { description: 'a diamond worth 5,000+ GP', cost: { value: 5000, unit: 'gp', atLeast: true } } },
        resolution: {
            caveats: [
                'Named-creature summons and planar ruler veto are GM scope; portal facing rules apply.',
            ],
        },
        effectGroups: [
            {
                effects: [
                    {
                        kind: 'note',
                        text: 'Portal 5-20 ft to another plane. Speak creature name: portal opens next to them, transports to you. Deities can prevent.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "You conjure a portal linking an unoccupied space you can see within range to a precise location on a different plane of existence. The portal is a circular opening, which you can make 5 to 20 feet in diameter. You can orient the portal in any direction you choose. The portal lasts for the duration, and the portal's destination is visible through it. The portal has a front and a back on each plane where it appears. Travel through the portal is possible only by moving through its front. Anything that does so is instantly transported to the other plane, appearing in the unoccupied space nearest to the portal. Deities and other planar rulers can prevent portals created by this spell from opening in their presence or anywhere within their domains. When you cast this spell, you can speak the name of a specific creature (a pseudonym, title, or nickname doesn't work). If that creature is on a plane other than the one you are on, the portal opens next to the named creature and transports it to the nearest unoccupied space on your side of the portal. You gain no special power over the creature, and it is free to act as the GM deems appropriate. It might leave, attack you, or help you.",
            summary: 'Portal to other plane. Optional: summon named creature. Deities can block.',
        },
    },
    {
        id: 'imprisonment',
        name: 'Imprisonment',
        school: 'abjuration',
        level: 9,
        classes: ['warlock', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'minute' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 30, unit: 'ft' } },
        duration: { kind: 'until-dispelled' },
        components: { verbal: true, somatic: true, material: { description: 'a statuette of the target worth 5,000+ GP', cost: { value: 5000, unit: 'gp', atLeast: true } } },
        resolution: {
            caveats: [
                'Imprisonment variant, custom trigger, and 9th-level Dispel only are summarized in notes.',
            ],
        },
        effectGroups: [
            {
                effects: [
                    {
                        kind: 'note',
                        text: 'Wis save or imprisoned. Choose: Burial, Chaining, Hedged Prison, Minimus Containment, Slumber. Specify trigger to end. Dispel Magic 9th only.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "You create a magical restraint to hold a creature that you can see within range. The target must make a Wisdom saving throw. On a successful save, the target is unaffected, and it is immune to this spell for the next 24 hours. On a failed save, the target is imprisoned. While imprisoned, the target doesn't need to breathe, eat, or drink, and it doesn't age. Divination spells can't locate or perceive the imprisoned target, and the target can't teleport. Until the spell ends, the target is also affected by one of the following effects of your choice: Burial, Chaining, Hedged Prison, Minimus Containment, or Slumber. When you cast the spell, specify a trigger that will end it. A Dispel Magic spell can end the spell only if it is cast with a level 9 spell slot, targeting either the prison or the component used to create it.",
            summary: 'Wis save or imprisoned. Choose imprisonment type. Trigger to end. 9th-level Dispel only.',
        },
    },
];
