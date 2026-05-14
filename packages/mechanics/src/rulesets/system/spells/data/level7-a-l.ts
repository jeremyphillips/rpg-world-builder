import type { SpellEntry } from '../types';
/**
 * Level 7 spells A–L — authoring status:
 * - **Attack/save/AoE modeled:** Delayed Blast Fireball, Finger of Death, Fire Storm.
 * - **Utility / travel / ritual:** Etherealness, Magnificent Mansion, Plane Shift (in m–z), Teleport (in m–z).
 * - **Note-first / summons / heavy caveats:** Arcane Sword, Conjure Celestial, Divine Word, Forcecage, Mirage Arcane, etc.
 */
export const SPELLS_LEVEL_7_A_L: readonly SpellEntry[] = [
    {
        id: 'arcane-sword',
        name: 'Arcane Sword',
        school: 'evocation',
        level: 7,
        classes: ['bard', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 90, unit: 'ft' } },
        duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
        components: { verbal: true, somatic: true, material: { description: 'a miniature sword worth 250+ GP', cost: { value: 250, unit: 'gp', atLeast: true } } },
        resolution: {
            caveats: [
                'Melee spell attacks and Bonus Action movement are not modeled as discrete rolls/actions.',
            ],
        },
        effectGroups: [
            {
                effects: [
                    {
                        kind: 'note',
                        text: 'Spectral sword: melee spell attack 4d12+mod Force. Bonus action to move 30ft and repeat attack.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "You create a spectral sword that hovers within range. It lasts for the duration. When the sword appears, you make a melee spell attack against a target within 5 feet of the sword. On a hit, the target takes Force damage equal to 4d12 plus your spellcasting ability modifier. On your later turns, you can take a Bonus Action to move the sword up to 30 feet to a spot you can see and repeat the attack against the same target or a different one.",
            summary: 'Spectral sword makes melee spell attacks for 4d12+mod Force. Bonus action to move and attack.',
        },
    },
    {
        id: 'conjure-celestial',
        name: 'Conjure Celestial',
        school: 'conjuration',
        level: 7,
        classes: ['cleric'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 90, unit: 'ft' } },
        duration: { kind: 'timed', value: 10, unit: 'minute', concentration: true, upTo: true },
        components: { verbal: true, somatic: true },
        resolution: {
            caveats: [
                'Cylinder placement, movement, and per-creature Healing vs Searing each time a creature is bathed require table tracking.',
            ],
        },
        scaling: [{ category: 'extra-damage', description: '+1d12 to healing and damage rolls per slot level above 7', mode: 'per-slot-level', startsAtSlotLevel: 8, amount: '1d12' }],
        effectGroups: [
            {
                effects: [
                    {
                        kind: 'note',
                        text: '10ft radius, 40ft cylinder of light. Per creature you can see in the cylinder: Healing Light (4d12+mod) or Searing Light (6d12 radiant, Dex save). You can move the cylinder up to 30 feet when you move.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "You conjure a spirit from the Upper Planes, which manifests as a pillar of light in a 10-foot-radius, 40-foot-high Cylinder centered on a point within range. For each creature you can see in the Cylinder, choose: Healing Light (regain 4d12+mod HP) or Searing Light (Dex save or 6d12 Radiant). When you move, you can move the Cylinder up to 30 feet. Creatures entering or ending turn there can be bathed in one light. Using a Higher-Level Spell Slot. The healing and damage increase by 1d12 for each spell slot level above 7.",
            summary: 'Pillar of light: Healing or Radiant damage per creature. Scales with slot.',
        },
    },
    {
        id: 'delayed-blast-fireball',
        name: 'Delayed Blast Fireball',
        school: 'evocation',
        level: 7,
        classes: ['sorcerer', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 150, unit: 'ft' } },
        duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
        components: { verbal: true, somatic: true, material: { description: 'a ball of bat guano and sulfur' } },
        resolution: {
            caveats: [
                'Total damage includes +1d6 per turn the bead persists; adjust rolled damage manually before applying the save.',
                'The bead is a point in space (or thrown), not a self-centered emanation. Do not use the shared `emanation` effect: persistent bead location is a future `place` (or similar) anchor, not `attachedTo: self`.',
            ],
        },
        effectGroups: [
            {
                targeting: { selection: 'in-area', targetType: 'creature', area: { kind: 'sphere', size: 20 } },
                effects: [
                    {
                        kind: 'save',
                        save: { ability: 'dex' },
                        onFail: [{ kind: 'damage', damage: '12d6', damageType: 'fire' }],
                        onSuccess: [{ kind: 'damage', damage: '6d6', damageType: 'fire' }],
                    },
                    {
                        kind: 'note',
                        text: 'Bead accumulates +1d6 fire each turn it persists. If touched before detonation, creature makes Dex save or it explodes.',
                        category: 'under-modeled' as const,
                    },
                    {
                        kind: 'note',
                        text: 'Explosion is centered on the bead’s location when the spell ends or early detonation occurs—not on the caster.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        scaling: [{ category: 'extra-damage', description: '+1d6 fire base per slot level above 7', mode: 'per-slot-level', startsAtSlotLevel: 8, amount: '1d6' }],
        description: {
            full: "A beam of yellow light flashes from you, then condenses at a chosen point within range as a glowing bead for the duration. When the spell ends, the bead explodes. Each creature in a 20-foot-radius Sphere centered on that point makes a Dexterity saving throw. A creature takes Fire damage equal to the total accumulated damage on a failed save or half as much on a successful one. The spell's base damage is 12d6, and the damage increases by 1d6 whenever your turn ends and the spell hasn't ended. If a creature touches the bead before the spell ends, that creature makes a Dexterity saving throw; on a failed save, the bead explodes. On a successful save, the creature can throw the bead up to 40 feet. Using a Higher-Level Spell Slot. The base damage increases by 1d6 for each spell slot level above 7.",
            summary: 'Delayed fire bead. 12d6 base, +1d6/turn. Explodes when spell ends or touched.',
        },
    },
    {
        id: 'divine-word',
        name: 'Divine Word',
        school: 'evocation',
        level: 7,
        classes: ['cleric'],
        castingTime: { normal: { value: 1, unit: 'bonus-action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 30, unit: 'ft' } },
        duration: { kind: 'instantaneous' },
        components: { verbal: true },
        resolution: {
            caveats: [
                'HP thresholds, extraplanar banishment, and target selection are not encoded as automated branches.',
            ],
        },
        effectGroups: [
            {
                effects: [
                    {
                        kind: 'note',
                        text: 'Chosen creatures Cha save. By HP: 0-20 die, 21-30 Blinded+Deafened+Stunned 1h, 31-40 Blinded+Deafened 10min, 41-50 Deafened 1min. Celestial/Elemental/Fey/Fiend: fail=banished 24h.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "You utter a word imbued with power from the Upper Planes. Each creature of your choice in range makes a Charisma saving throw. On a failed save, a target with 50 HP or fewer suffers an effect based on current HP: 0-20 die, 21-30 Blinded+Deafened+Stunned 1 hour, 31-40 Blinded+Deafened 10 minutes, 41-50 Deafened 1 minute. Regardless of HP, a Celestial, Elemental, Fey, or Fiend that fails is forced back to its plane of origin and can't return for 24 hours (except by Wish).",
            summary: 'Cha save. HP-based effects. Extraplanar: banished 24h on fail.',
        },
    },
    {
        id: 'etherealness',
        name: 'Etherealness',
        school: 'conjuration',
        level: 7,
        classes: ['bard', 'cleric', 'sorcerer', 'warlock', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'self' },
        duration: { kind: 'timed', value: 8, unit: 'hour', upTo: true },
        components: { verbal: true, somatic: true },
        resolution: {
            caveats: [
                'Additional willing targets must be within 10 feet of you when you cast.',
            ],
        },
        scaling: [{ category: 'extra-targets', description: '+3 willing targets within 10 feet per slot level above 7', mode: 'per-slot-level', startsAtSlotLevel: 8, amount: 3 }],
        effectGroups: [
            {
                effects: [
                    { kind: 'state', stateId: 'etherealness', notes: 'Step into Border Ethereal. Can only affect and be affected by creatures on Ethereal Plane. Return at spell end.' },
                    { kind: 'note', text: 'If you appear in an occupied space, shunted to nearest unoccupied space and take Force damage equal to twice the feet moved.', category: 'flavor' as const }
                ]
            }
        ],
        description: {
            full: "You step into the border regions of the Ethereal Plane, where it overlaps with your current plane. You remain in the Border Ethereal for the duration. You can perceive the plane you left (gray, can't see more than 60 feet away). While on the Ethereal Plane, you can affect and be affected only by creatures, objects, and effects on that plane. When the spell ends, you return to the plane you left. If you appear in an occupied space, you are shunted to the nearest unoccupied space and take Force damage equal to twice the feet moved. Using a Higher-Level Spell Slot. You can target up to three willing creatures (including yourself) for each spell slot level above 7. Creatures must be within 10 feet when you cast.",
            summary: 'Enter Border Ethereal. Immune to material plane. +3 targets per slot.',
        },
    },
    {
        id: 'finger-of-death',
        name: 'Finger of Death',
        school: 'necromancy',
        level: 7,
        classes: ['sorcerer', 'warlock', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
        duration: { kind: 'instantaneous' },
        components: { verbal: true, somatic: true },
        resolution: {
            caveats: [
                'Zombie creation from slain Humanoids is not spawned as an encounter actor.',
            ],
        },
        effectGroups: [
            {
                targeting: { selection: 'one', targetType: 'creature' },
                effects: [
                    {
                        kind: 'save',
                        save: { ability: 'con' },
                        onFail: [{ kind: 'damage', damage: '7d8+30', damageType: 'necrotic' }],
                        onSuccess: [{ kind: 'damage', damage: '3d8+15', damageType: 'necrotic' }],
                    },
                    { kind: 'note', text: 'A Humanoid killed by this spell rises as a Zombie under your control at the start of your next turn.', category: 'under-modeled' as const }
                ]
            }
        ],
        description: {
            full: "You unleash negative energy toward a creature you can see within range. The target makes a Constitution saving throw, taking 7d8 + 30 Necrotic damage on a failed save or half as much on a successful one. A Humanoid killed by this spell rises at the start of your next turn as a Zombie that follows your verbal orders.",
            summary: 'Con save or 7d8+30 necrotic. Humanoid killed becomes Zombie.',
        },
    },
    {
        id: 'fire-storm',
        name: 'Fire Storm',
        school: 'evocation',
        level: 7,
        classes: ['cleric', 'druid', 'sorcerer'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 150, unit: 'ft' } },
        duration: { kind: 'instantaneous' },
        components: { verbal: true, somatic: true },
        resolution: {
            caveats: [
                'Area is up to ten contiguous 10-foot Cubes, not a single cube; the save below is a simplified aggregate.',
            ],
        },
        effectGroups: [
            {
                targeting: { selection: 'in-area', targetType: 'creature', area: { kind: 'cube', size: 10 } },
                effects: [
                    {
                        kind: 'save',
                        save: { ability: 'dex' },
                        onFail: [{ kind: 'damage', damage: '7d10', damageType: 'fire' }],
                        onSuccess: [{ kind: 'damage', damage: '3d10', damageType: 'fire' }],
                    },
                    { kind: 'note', text: 'Up to ten 10-foot Cubes, each contiguous with at least one other. Flammable unattended objects start burning.', category: 'flavor' as const }
                ]
            }
        ],
        description: {
            full: "A storm of fire appears within range. The area of the storm consists of up to ten 10-foot Cubes, which you arrange as you like. Each Cube must be contiguous with at least one other Cube. Each creature in the area makes a Dexterity saving throw, taking 7d10 Fire damage on a failed save or half as much damage on a successful one. Flammable objects in the area that aren't being worn or carried start burning.",
            summary: 'Up to ten 10ft cubes of fire. Dex save or 7d10 fire.',
        },
    },
    {
        id: 'forcecage',
        name: 'Forcecage',
        school: 'evocation',
        level: 7,
        classes: ['bard', 'warlock', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'action' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 100, unit: 'ft' } },
        duration: { kind: 'timed', value: 1, unit: 'hour', concentration: true, upTo: true },
        components: { verbal: true, somatic: true, material: { description: 'ruby dust worth 1,500+ GP', cost: { value: 1500, unit: 'gp', atLeast: true }, consumed: true } },
        resolution: {
            caveats: [
                'Teleportation save, Ethereal blocking, and cage vs solid box modes are summarized in narrative.',
            ],
        },
        effectGroups: [
            {
                effects: [
                    {
                        kind: 'note',
                        text: 'Cage (20ft) or box (10ft). Invisible force prison. Cha save to teleport out. Cannot be dispelled by Dispel Magic.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "An immobile, Invisible, Cube-shaped prison composed of magical force springs into existence around an area you choose within range. The prison can be a cage or a solid box, as you choose. A prison in the shape of a cage can be up to 20 feet on a side and is made from 1/2-inch diameter bars spaced 1/2 inch apart. A prison in the shape of a box can be up to 10 feet on a side, creating a solid barrier that prevents any matter from passing through it and blocking any spells cast into or out from the area. When you cast the spell, any creature that is completely inside the cage's area is trapped. Creatures only partially within the area, or those too large to fit inside it, are pushed away from the center of the area until they are completely outside it. A creature inside the cage can't leave it by nonmagical means. If the creature tries to use teleportation or interplanar travel to leave, it must first make a Charisma saving throw. On a successful save, the creature can use that magic to exit the cage. On a failed save, the creature doesn't exit the cage and wastes the spell or effect. The cage also extends into the Ethereal Plane, blocking ethereal travel. This spell can't be dispelled by Dispel Magic.",
            summary: 'Force prison (cage or box). Cha save to teleport out. Immune to Dispel Magic.',
        },
    },
    {
        id: 'magnificent-mansion',
        name: 'Magnificent Mansion',
        school: 'conjuration',
        level: 7,
        classes: ['bard', 'wizard'],
        castingTime: { normal: { value: 1, unit: 'minute' }, canBeCastAsRitual: false },
        range: { kind: 'distance', value: { value: 300, unit: 'ft' } },
        duration: { kind: 'timed', value: 24, unit: 'hour' },
        components: { verbal: true, somatic: true, material: { description: 'a miniature door worth 15+ GP', cost: { value: 15, unit: 'gp', atLeast: true } } },
        resolution: {
            caveats: [
                'Extradimensional space, layout, and servants are not simulated as a map or combat encounter.',
            ],
        },
        effectGroups: [
            {
                effects: [
                    {
                        kind: 'note',
                        text: 'Extradimensional dwelling, 50 contiguous 10ft cubes. 100 servants. Food for 9-course banquet for 100. Expelled when spell ends.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "You conjure a shimmering door in range that lasts for the duration. The door leads to an extradimensional dwelling and is 5 feet wide and 10 feet tall. You and any creature you designate when you cast the spell can enter. You can open or close it (no action) if within 30 feet. While closed, the door is imperceptible. Beyond is a magnificent foyer with numerous chambers. You can create any floor plan up to 50 contiguous 10-foot Cubes. The place is furnished as you choose. It contains sufficient food to serve a nine-course banquet for up to 100 people. A staff of 100 near-transparent servants attends all who enter. They are invulnerable and obey your commands but can't attack or harm. When the spell ends, any creatures or objects left inside are expelled to the nearest unoccupied spaces.",
            summary: 'Extradimensional mansion. 50 10ft cubes. 100 servants. Food for 100.',
        },
    },
    {
        id: 'mirage-arcane',
        name: 'Mirage Arcane',
        school: 'illusion',
        level: 7,
        classes: ['bard', 'druid', 'wizard'],
        castingTime: { normal: { value: 10, unit: 'minute' }, canBeCastAsRitual: false },
        range: { kind: 'sight' },
        duration: { kind: 'timed', value: 10, unit: 'day' },
        components: { verbal: true, somatic: true },
        resolution: {
            caveats: [
                '1-mile terrain illusion and tactile interaction are GM/table scope.',
            ],
        },
        effectGroups: [
            {
                effects: [
                    {
                        kind: 'note',
                        text: 'Terrain up to 1 mile square looks, sounds, smells, feels like other terrain. Can add structures. Tactile, can be Difficult Terrain. Truesight sees through but can still interact.',
                        category: 'under-modeled' as const,
                    }
                ]
            }
        ],
        description: {
            full: "You make terrain in an area up to 1 mile square look, sound, smell, and even feel like some other sort of terrain. You can alter the appearance of structures or add them where none are present. The spell doesn't disguise, conceal, or add creatures. The illusion includes audible, visual, tactile, and olfactory elements, so it can turn clear ground into Difficult Terrain or otherwise impede movement. Any piece of the illusory terrain that is removed from the spell's area disappears immediately. Creatures with Truesight can see through the illusion to the terrain's true form; however, all other elements of the illusion remain, so the creature can still physically interact with the illusion.",
            summary: '1 mile square illusory terrain. Tactile. Truesight sees through but can interact.',
        },
    },
];
