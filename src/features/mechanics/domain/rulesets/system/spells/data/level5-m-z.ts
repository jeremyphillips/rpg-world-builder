import type { SpellEntry } from '../types';

/**
 * Level 5 spells M–Z — authoring status:
 * - **Attack/save/AoE modeled:** Hold Monster, Insect Plague, Mass Cure Wounds, Seeming (partial).
 * - **Utility / travel / divination:** Legend Lore, Passwall, Scrying, Telepathic Bond, Teleportation Circle, Tree Stride.
 * - **Note-first / summons / heavy caveats:** Mislead, Modify Memory, Planar Binding, Summon Dragon, Telekinesis, Wall of Force, Wall of Stone, etc.
 */
export const SPELLS_LEVEL_5_M_Z: readonly SpellEntry[] = [
{
    id: 'hold-monster',
    name: 'Hold Monster',
    school: 'enchantment',
    level: 5,
    classes: ['bard', 'sorcerer', 'warlock', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 90, unit: 'ft' } },
    duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true, material: { description: 'a straight piece of iron' } },
    resolution: {
      caveats: [
        'Repeat saves at end of turn and extra targets are not fully automated.',
      ],
    },
    effects: [
      { kind: 'targeting', target: 'one-creature', targetType: 'creature' },
      {
        kind: 'save',
        save: { ability: 'wis' },
        onFail: [{ kind: 'condition', conditionId: 'paralyzed', repeatSave: { ability: 'wis', timing: 'turn-end' } }],
      },
    ],
    scaling: [{ category: 'extra-targets', description: '+1 target per slot level above 5', mode: 'per-slot-level', startsAtSlotLevel: 6 }],
    description: {
      full: "Choose a creature that you can see within range. The target must succeed on a Wisdom saving throw or have the Paralyzed condition for the duration. At the end of each of its turns, the target repeats the save, ending the spell on itself on a success. Using a Higher-Level Spell Slot. You can target one additional creature for each spell slot level above 5.",
      summary: 'Wis save or Paralyzed. Repeat save each turn. Scales with targets.',
    },
  },
{
    id: 'mislead',
    name: 'Mislead',
    school: 'illusion',
    level: 5,
    classes: ['bard', 'warlock', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'self' },
    duration: { kind: 'timed', value: 1, unit: 'hour', concentration: true, upTo: true },
    components: { somatic: true },
    resolution: {
      caveats: [
        'Double movement, invisibility break, and sensor perspective are not fully enforced.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Become Invisible; illusory double appears. Invisibility ends after attack, damage, or spell. Magic action: move double 2× Speed, gesture, speak. See/hear through double.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "You gain the Invisible condition at the same time that an illusory double of you appears where you are standing. The double lasts for the duration, but the invisibility ends immediately after you make an attack roll, deal damage, or cast a spell. As a Magic action, you can move the illusory double up to twice your Speed and make it gesture, speak, and behave in whatever way you choose. It is intangible and invulnerable. You can see through its eyes and hear through its ears as if you were located where it is.",
      summary: 'Invisible + illusory double. See/hear through double. Invisibility ends on attack/damage/spell.',
    },
  },
{
    id: 'modify-memory',
    name: 'Modify Memory',
    school: 'enchantment',
    level: 5,
    classes: ['bard', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 30, unit: 'ft' } },
    duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true },
    resolution: {
      caveats: [
        'Memory editing and higher-slot time windows are not simulated.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Wis save (Advantage if fighting). Charmed, Incapacitated. Alter memory of event in last 24h (≤10 min). Eliminate, recall, change, or create memory. Remove Curse/Greater Restoration restores. Slot 6-9: longer ago.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "You attempt to reshape another creature's memories. One creature that you can see within range makes a Wisdom saving throw. If you are fighting the creature, it has Advantage on the save. On a failed save, the target has the Charmed condition for the duration. While Charmed, the target also has the Incapacitated condition and is unaware of its surroundings, though it can hear you. If it takes any damage or is targeted by another spell, this spell ends, and no memories are modified. While this charm lasts, you can affect the target's memory of an event that it experienced within the last 24 hours and that lasted no more than 10 minutes. You can permanently eliminate all memory of the event, allow the target to recall the event with perfect clarity, change its memory of the event's details, or create a memory of some other event. A Remove Curse or Greater Restoration spell cast on the target restores the creature's true memory. Using a Higher-Level Spell Slot. You can alter memories of events up to 7 days ago (level 6), 30 days (level 7), 365 days (level 8), or any time in the past (level 9).",
      summary: 'Wis save or Charmed. Alter memory of event (24h, 10 min). Remove Curse/Greater Restoration restores.',
    },
  },
{
    id: 'insect-plague',
    name: 'Insect Plague',
    school: 'conjuration',
    level: 5,
    classes: ['cleric', 'druid', 'sorcerer'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 300, unit: 'ft' } },
    duration: { kind: 'timed', value: 10, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true, material: { description: 'a locust' } },
    resolution: {
      caveats: [
        'Enter/end-turn timing and once-per-turn save are not fully automated.',
      ],
    },
    effects: [
      { kind: 'targeting', target: 'creatures-in-area', targetType: 'creature', area: { kind: 'sphere', size: 20 } },
      {
        kind: 'save',
        save: { ability: 'con' },
        onFail: [{ kind: 'damage', damage: '4d10', damageType: 'piercing' }],
        onSuccess: [{ kind: 'damage', damage: '2d10', damageType: 'piercing' }],
      },
      { kind: 'state', stateId: 'lightly-obscured-difficult-terrain', notes: 'Area is Lightly Obscured and Difficult Terrain.' },
      { kind: 'note', text: 'Creature also saves when entering or ending turn in area.', category: 'under-modeled' as const },
    ],
    scaling: [{ category: 'extra-damage', description: '+1d10 piercing per slot level above 5', mode: 'per-slot-level', startsAtSlotLevel: 6, amount: '1d10' }],
    description: {
      full: "Swarming locusts fill a 20-foot-radius Sphere centered on a point you choose within range. The Sphere remains for the duration, and its area is Lightly Obscured and Difficult Terrain. When the swarm appears, each creature in it makes a Constitution saving throw, taking 4d10 Piercing damage on a failed save or half as much damage on a successful one. A creature also makes this save when it enters the spell's area for the first time on a turn or ends its turn there. A creature makes this save only once per turn. Using a Higher-Level Spell Slot. The damage increases by 1d10 for each spell slot level above 5.",
      summary: '20ft sphere locusts. Con save or 4d10 piercing. Damage scales with slot.',
    },
  },
{
    id: 'mass-cure-wounds',
    name: 'Mass Cure Wounds',
    school: 'abjuration',
    level: 5,
    classes: ['bard', 'cleric', 'druid'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
    duration: { kind: 'instantaneous' },
    components: { verbal: true, somatic: true },
    resolution: {
      caveats: [
        'Healing split across up to six targets is not tracked per creature automatically.',
      ],
    },
    effects: [
      { kind: 'targeting', target: 'chosen-creatures', targetType: 'creature', count: 6, area: { kind: 'sphere', size: 30 } },
      { kind: 'hit-points', mode: 'heal', value: '5d8', abilityModifier: true },
    ],
    scaling: [{ category: 'extra-healing', description: '+1d8 healing per slot level above 5', mode: 'per-slot-level', startsAtSlotLevel: 6, amount: '1d8' }],
    description: {
      full: "A wave of healing energy washes out from a point you can see within range. Choose up to six creatures in a 30-foot-radius Sphere centered on that point. Each target regains Hit Points equal to 5d8 plus your spellcasting ability modifier. Using a Higher-Level Spell Slot. The healing increases by 1d8 for each spell slot level above 5.",
      summary: 'Up to 6 creatures in 30ft sphere: 5d8+mod HP. +1d8 per slot.',
    },
  },
{
    id: 'passwall',
    name: 'Passwall',
    school: 'transmutation',
    level: 5,
    classes: ['wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 30, unit: 'ft' } },
    duration: { kind: 'timed', value: 1, unit: 'hour' },
    components: { verbal: true, somatic: true, material: { description: 'a pinch of sesame seeds' } },
    resolution: {
      caveats: [
        'Passage geometry and ejection are not simulated in encounter.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Passage in wood, plaster, or stone. Up to 5 ft wide, 8 ft tall, 20 ft deep. Creatures/objects ejected when opening disappears.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "A passage appears at a point that you can see on a wooden, plaster, or stone surface (such as a wall, ceiling, or floor) within range and lasts for the duration. You choose the opening's dimensions: up to 5 feet wide, 8 feet tall, and 20 feet deep. The passage creates no instability in a structure surrounding it. When the opening disappears, any creatures or objects still in the passage created by the spell are safely ejected to an unoccupied space nearest to the surface on which you cast the spell.",
      summary: 'Create passage in wall/ceiling/floor. 5×8×20 ft. Safe ejection when ends.',
    },
  },
{
    id: 'planar-binding',
    name: 'Planar Binding',
    school: 'abjuration',
    level: 5,
    classes: ['bard', 'cleric', 'druid', 'warlock', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'hour' } },
    range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
    duration: { kind: 'timed', value: 24, unit: 'hour' },
    components: { verbal: true, somatic: true, material: { description: 'a jewel worth 1,000+ GP', cost: { value: 1000, unit: 'gp', atLeast: true }, consumed: true } },
    resolution: {
      caveats: [
        'Binding service and extended summon duration are not enforced automatically.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Bind Celestial, Elemental, Fey, or Fiend in range for entire casting. Cha save or bound to serve. Extends summon duration. Slot 6-9: longer duration.',
        category: 'under-modeled' as const,
      },
    ],
    scaling: [
      {
        category: 'longer-duration',
        description: '6th: 10 days; 7th: 30 days; 8th: 180 days; 9th: 366 days',
        mode: 'threshold',
      },
    ],
    description: {
      full: "You attempt to bind a Celestial, an Elemental, a Fey, or a Fiend to your service. The creature must be within range for the entire casting of the spell. At the completion of the casting, the target must succeed on a Charisma saving throw or be bound to serve you for the duration. If the creature was summoned or created by another spell, that spell's duration is extended to match the duration of this spell. A bound creature must follow your commands to the best of its ability. Using a Higher-Level Spell Slot. The duration increases with a spell slot of level 6 (10 days), 7 (30 days), 8 (180 days), and 9 (366 days).",
      summary: 'Bind Celestial/Elemental/Fey/Fiend. Cha save or serve. Duration scales with slot.',
    },
  },
{
    id: 'legend-lore',
    name: 'Legend Lore',
    school: 'divination',
    level: 5,
    classes: ['bard', 'cleric', 'wizard'],
    castingTime: { normal: { value: 10, unit: 'minute' } },
    range: { kind: 'self' },
    duration: { kind: 'instantaneous' },
    components: { verbal: true, somatic: true, material: { description: 'incense worth 250+ GP, four ivory strips worth 50+ GP each', cost: { value: 250, unit: 'gp', atLeast: true }, consumed: true } },
    resolution: {
      caveats: [
        'GM lore delivery and “not famous” failure are not simulated.',
      ],
    },
    effects: [
      { kind: 'note', text: 'Name or describe a famous person, place, or object. Receive a brief summary of significant lore. If not actually famous, the spell fails with sad trombone.', category: 'flavor' as const },
    ],
    description: {
      full: "Name or describe a famous person, place, or object. The spell brings to your mind a brief summary of the significant lore about that famous thing, as described by the GM. The lore might consist of important details, amusing revelations, or even secret lore that has never been widely known. The more information you already know about the thing, the more precise and detailed the information you receive is. That information is accurate but might be couched in figurative language or poetry, as determined by the GM. If the famous thing you chose isn't actually famous, you hear sad musical notes played on a trombone, and the spell fails.",
      summary: 'Learn lore about famous person, place, or object. Fails if not famous.',
    },
  },
{
    id: 'raise-dead',
    name: 'Raise Dead',
    school: 'necromancy',
    level: 5,
    classes: ['bard', 'cleric', 'paladin'],
    castingTime: { normal: { value: 1, unit: 'hour' } },
    range: { kind: 'touch' },
    duration: { kind: 'instantaneous' },
    components: { verbal: true, somatic: true, material: { description: 'a diamond worth 500+ GP', cost: { value: 500, unit: 'gp', atLeast: true }, consumed: true } },
    resolution: {
      caveats: [
        'Death timing, corpse integrity, and resurrection penalty are not enforced automatically.',
      ],
    },
    effects: [
      { kind: 'targeting', target: 'one-dead-creature', targetType: 'creature' },
      { kind: 'hit-points', mode: 'heal', value: 1 },
      {
        kind: 'note',
        text: 'Target must have been dead no longer than 10 days and not Undead. Neutralize poisons. Close wounds but not restore missing parts. -4 d20 penalty to all d20 tests, reduced by 1 per Long Rest. Lacking vital body parts = auto fail.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "With a touch, you revive a dead creature if it has been dead no longer than 10 days and it wasn't Undead when it died. The creature returns to life with 1 Hit Point. This spell also neutralizes any poisons that affected the creature at the time of death. This spell closes all mortal wounds, but it doesn't restore missing body parts. If the creature is lacking body parts or organs integral for its survival—its head, for instance—the spell automatically fails. Coming back from the dead is an ordeal. The target takes a −4 penalty to D20 Tests. Every time the target finishes a Long Rest, the penalty is reduced by 1 until it becomes 0.",
      summary: 'Revive dead (≤10 days). 1 HP. -4 d20 penalty, -1 per Long Rest.',
    },
  },
{
    id: 'reincarnate',
    name: 'Reincarnate',
    school: 'necromancy',
    level: 5,
    classes: ['druid'],
    castingTime: { normal: { value: 1, unit: 'hour' } },
    range: { kind: 'touch' },
    duration: { kind: 'instantaneous' },
    components: { verbal: true, somatic: true, material: { description: 'rare oils worth 1,000+ GP', cost: { value: 1000, unit: 'gp', atLeast: true }, consumed: true } },
    resolution: {
      caveats: [
        'Species table and new-body traits are not enforced in encounter.',
      ],
    },
    effects: [
      { kind: 'targeting', target: 'one-dead-creature', targetType: 'creature', creatureTypeFilter: ['humanoid'] },
      { kind: 'hit-points', mode: 'heal', value: 1 },
      {
        kind: 'note',
        text: 'Target must have been dead no longer than 10 days. New body, roll 1d10 for species (or GM chooses). Retains capabilities, loses old species traits, gains new. 1=Roll again, 2=Dragonborn, 3=Dwarf, 4=Elf, 5=Gnome, 6=Goliath, 7=Halfling, 8=Human, 9=Orc, 10=Tiefling.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "You touch a dead Humanoid or a piece of one. If the creature has been dead no longer than 10 days, the spell forms a new body for it and calls the soul to enter that body. Roll 1d10 and consult the table to determine the body's species, or the GM chooses another playable species. 1=Roll again, 2=Dragonborn, 3=Dwarf, 4=Elf, 5=Gnome, 6=Goliath, 7=Halfling, 8=Human, 9=Orc, 10=Tiefling. The reincarnated creature makes any choices that a species' description offers, and the creature recalls its former life. It retains the capabilities it had in its original form, except it loses the traits of its previous species and gains the traits of its new one.",
      summary: 'Revive as new species (1d10 table). Retains capabilities, new species traits.',
    },
  },
{
    id: 'scrying',
    name: 'Scrying',
    school: 'divination',
    level: 5,
    classes: ['bard', 'cleric', 'druid', 'warlock', 'wizard'],
    castingTime: { normal: { value: 10, unit: 'minute' } },
    range: { kind: 'self' },
    duration: { kind: 'timed', value: 10, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true, material: { description: 'a focus worth 1,000+ GP (crystal ball, mirror, etc.)', cost: { value: 1000, unit: 'gp', atLeast: true } } },
    resolution: {
      caveats: [
        'DC modifiers, 24h block, and location targeting are not fully automated.',
      ],
    },
    effects: [
      { kind: 'targeting', target: 'one-creature', targetType: 'creature' },
      { kind: 'save', save: { ability: 'wis' }, onFail: [{ kind: 'state', stateId: 'scried', notes: 'Invisible sensor within 10ft. Caster sees and hears through sensor.' }] },
      { kind: 'note', text: 'Save DC modified by familiarity and physical connection. On success, cannot target again for 24h. Can target a location instead (no save, sensor stays in place).', category: 'flavor' as const },
    ],
    description: {
      full: "You can see and hear a creature you choose that is on the same plane of existence as you. The target makes a Wisdom saving throw, which is modified by how well you know the target and the sort of physical connection you have to it. On a successful save, the target isn't affected, and you can't use this spell on it again for 24 hours. On a failed save, the spell creates an Invisible, intangible sensor within 10 feet of the target. You can see and hear through the sensor as if you were there. The sensor moves with the target, remaining within 10 feet of it for the duration. Instead of targeting a creature, you can target a location you have seen. When you do so, the sensor appears at that location and doesn't move.",
      summary: 'See and hear creature on same plane. Wis save. Sensor 10ft from target. Or target location.',
    },
  },
{
    id: 'seeming',
    name: 'Seeming',
    school: 'illusion',
    level: 5,
    classes: ['bard', 'sorcerer', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 30, unit: 'ft' } },
    duration: { kind: 'timed', value: 8, unit: 'hour' },
    components: { verbal: true, somatic: true },
    resolution: {
      caveats: [
        'Per-target willingness and disguise checks are not fully enforced.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Illusory appearance to chosen creatures. Unwilling: Cha save. Same or different appearances. ±1ft height, weight. Study + Int (Investigation) vs DC to discern.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "You give an illusory appearance to each creature of your choice that you can see within range. An unwilling target can make a Charisma saving throw, and if it succeeds, it is unaffected by this spell. You can give the same appearance or different ones to the targets. The spell can change the appearance of the targets' bodies and equipment. You can make each creature seem 1 foot shorter or taller and appear heavier or lighter. The changes wrought by this spell fail to hold up to physical inspection. A creature that takes the Study action to examine a target can make an Intelligence (Investigation) check against your spell save DC. If it succeeds, it becomes aware that the target is disguised.",
      summary: 'Illusory appearance to chosen creatures. Cha save. Study to discern.',
    },
  },
{
    id: 'summon-dragon',
    name: 'Summon Dragon',
    school: 'conjuration',
    level: 5,
    classes: ['wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
    duration: { kind: 'timed', value: 1, unit: 'hour', concentration: true, upTo: true },
    components: { verbal: true, somatic: true, material: { description: 'object with dragon image worth 500+ GP', cost: { value: 500, unit: 'gp', atLeast: true } } },
    resolution: {
      caveats: [
        'Draconic Spirit is not represented as a full combatant in encounter.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Draconic Spirit (Large Dragon). AC 14+level, HP 50+10/level. Multiattack (Rend + Breath Weapon). Choose Resistance for shared resistances. Use slot level for stat block.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "You call forth a Dragon spirit. It manifests in an unoccupied space that you can see within range and uses the Draconic Spirit stat block. The creature disappears when it drops to 0 Hit Points or when the spell ends. The creature is an ally to you and your allies. In combat, the creature shares your Initiative count, but it takes its turn immediately after yours. It obeys your verbal commands. When you summon the spirit, choose one of its Resistances. You have Resistance to the chosen damage type until the spell ends. Using a Higher-Level Spell Slot. Use the spell slot's level for the spell's level in the stat block.",
      summary: 'Summon Draconic Spirit. Choose shared Resistance. Slot level for stat block.',
    },
  },
{
    id: 'telekinesis',
    name: 'Telekinesis',
    school: 'transmutation',
    level: 5,
    classes: ['sorcerer', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
    duration: { kind: 'timed', value: 10, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true },
    resolution: {
      caveats: [
        'Creature vs object choice, Restrained, and fine control are not fully automated.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Magic action: move Huge or smaller creature (Str save or 30ft, Restrained) or object (auto 30ft if unattended). Fine control on objects.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "You gain the ability to move or manipulate creatures or objects by thought. When you cast the spell and as a Magic action on your later turns before the spell ends, you can exert your will on one creature or object that you can see within range. Creature: The target must succeed on a Strength saving throw, or you move it up to 30 feet in any direction. Until the end of your next turn, the creature has the Restrained condition, and if you lift it into the air, it is suspended there. Object: If the object isn't being worn or carried, you automatically move it up to 30 feet. If worn or carried, the creature must succeed on a Strength saving throw or you pull the object away. You can exert fine control on objects with your telekinetic grip.",
      summary: 'Move creature (Str save) or object (30ft). Restrained if lifted. Fine control.',
    },
  },
{
    id: 'telepathic-bond',
    name: 'Telepathic Bond',
    school: 'divination',
    level: 5,
    classes: ['bard', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' }, alternate: [{ value: 1, unit: 'action', ritual: true }] },
    range: { kind: 'distance', value: { value: 30, unit: 'ft' } },
    duration: { kind: 'timed', value: 1, unit: 'hour' },
    components: { verbal: true, somatic: true, material: { description: 'two eggs' } },
    resolution: {
      caveats: [
        'Telepathic communication and language requirement are not enforced in encounter.',
      ],
    },
    effects: [
      {
        kind: 'targeting',
        target: 'chosen-creatures',
        targetType: 'creature',
        count: 8,
        requiresSight: true,
        requiresWilling: true,
      },
      {
        kind: 'note',
        text: 'Up to 8 willing creatures: telepathic link among all. Communicate over any distance. Cannot extend to other planes.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "You forge a telepathic link among up to eight willing creatures of your choice within range, psychically linking each creature to all the others for the duration. Creatures that can't communicate in any languages aren't affected by this spell. Until the spell ends, the targets can communicate telepathically through the bond whether or not they share a language. The communication is possible over any distance, though it can't extend to other planes of existence.",
      summary: 'Up to 8: telepathic link. Communicate over any distance. Cannot cross planes.',
    },
  },
{
    id: 'teleportation-circle',
    name: 'Teleportation Circle',
    school: 'conjuration',
    level: 5,
    classes: ['bard', 'sorcerer', 'warlock', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'minute' } },
    range: { kind: 'distance', value: { value: 10, unit: 'ft' } },
    duration: { kind: 'until-turn-boundary', subject: 'self', turn: 'next', boundary: 'end' },
    components: { verbal: true, material: { description: 'rare inks worth 50+ GP', cost: { value: 50, unit: 'gp', atLeast: true }, consumed: true } },
    resolution: {
      caveats: [
        'Sigil destinations, portal timing, and permanent circle creation are not simulated.',
      ],
    },
    effects: [
      { kind: 'note', text: 'Draw 5ft radius circle. Portal opens to known permanent circle sigil sequence. Open until end of next turn. Enter to appear at destination. Learn 2 sigils at first. Cast same spot 365 days = permanent.', category: 'flavor' as const },
    ],
    description: {
      full: "As you cast the spell, you draw a 5-foot-radius circle on the ground inscribed with sigils that link your location to a permanent teleportation circle of your choice whose sigil sequence you know and that is on the same plane of existence as you. A shimmering portal opens within the circle you drew and remains open until the end of your next turn. Any creature that enters the portal instantly appears within 5 feet of the destination circle or in the nearest unoccupied space if that space is occupied. Many major temples, guildhalls, and other important places have permanent teleportation circles. Each circle includes a unique sigil sequence. When you first gain the ability to cast this spell, you learn the sigil sequences for two destinations on the Material Plane, determined by the GM. You can create a permanent teleportation circle by casting this spell in the same location every day for 365 days.",
      summary: 'Portal to known permanent circle. Enter = teleport. 365 days same spot = permanent.',
    },
  },
{
    id: 'tree-stride',
    name: 'Tree Stride',
    school: 'conjuration',
    level: 5,
    classes: ['druid', 'ranger'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'self' },
    duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true },
    resolution: {
      caveats: [
        'Tree network, once-per-turn transport, and end-turn-outside rule are not fully automated.',
      ],
    },
    effects: [
      { kind: 'state', stateId: 'tree-stride', notes: 'Enter a tree and move to same-kind tree within 500ft. 5ft movement to enter/exit. Know location of same-kind trees. Once per turn.' },
      { kind: 'note', text: 'Must end each turn outside a tree.', category: 'flavor' as const },
    ],
    description: {
      full: "You gain the ability to enter a tree and move from inside it to inside another tree of the same kind within 500 feet. Both trees must be living and at least the same size as you. You must use 5 feet of movement to enter a tree. You instantly know the location of all other trees of the same kind within 500 feet and, as part of the move used to enter the tree, can either pass into one of those trees or step out of the tree you're in. You appear in a spot of your choice within 5 feet of the destination tree, using another 5 feet of movement. If you have no movement left, you appear within 5 feet of the tree you entered. You can use this transportation ability only once on each of your turns. You must end each turn outside a tree.",
      summary: 'Enter tree, teleport to same-kind tree within 500ft. Once per turn. End turn outside.',
    },
  },
{
    id: 'wall-of-force',
    name: 'Wall of Force',
    school: 'evocation',
    level: 5,
    classes: ['wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 120, unit: 'ft' } },
    duration: { kind: 'timed', value: 10, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true, material: { description: 'a pinch of powder made by crushing a clear gemstone' } },
    resolution: {
      caveats: [
        'Wall shape (panels, dome, sphere), Ethereal blocking, and Disintegrate interaction are not fully modeled.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Invisible wall of force: horizontal, vertical, or angled; can be a hemisphere or sphere (radius up to 10 ft) or ten contiguous 10×10 ft panels (¼ inch thick). Nothing passes through physically; immune to damage; Dispel Magic does not end it. Disintegrate destroys it instantly. Extends into the Ethereal Plane.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "An invisible wall of force springs into existence at a point you choose within range. The wall appears in any orientation you choose, as a horizontal or vertical barrier or at an angle. It can be free floating or resting on a solid surface. You can form it into a hemispherical dome or a sphere with a radius of up to 10 feet, or you can shape a flat surface made up of ten 10-foot-by-10-foot panels. Each panel must be contiguous with another panel. In any form, the wall is 1/4 inch thick. It lasts for the duration. Nothing can physically pass through the wall. It is immune to all damage and can't be dispelled by dispel magic. A disintegrate spell destroys the wall instantly, however. The wall also extends into the Ethereal Plane, blocking ethereal travel.",
      summary: 'Invisible force wall or dome. Blocks passage and ethereal travel. Disintegrate destroys.',
    },
  },
{
    id: 'wall-of-stone',
    name: 'Wall of Stone',
    school: 'evocation',
    level: 5,
    classes: ['druid', 'sorcerer', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 120, unit: 'ft' } },
    duration: { kind: 'timed', value: 10, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true, material: { description: 'a cube of granite' } },
    resolution: {
      caveats: [
        'Panel layout, Dex save when surrounded, and permanent-on-full-concentration are not enforced.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Stone wall: ten 10×10ft panels, 6in thick (or 10×20ft, 3in). Creature in space: pushed. Surrounded: Dex save, Reaction to move. Must merge with stone. AC 15, 30 HP per inch. Full concentration = permanent.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "A nonmagical wall of solid stone springs into existence at a point you choose within range. The wall is 6 inches thick and is composed of ten 10-foot-by-10-foot panels. Each panel must be contiguous with another panel. Alternatively, you can create 10-foot-by-20-foot panels that are only 3 inches thick. If the wall cuts through a creature's space when it appears, the creature is pushed to one side of the wall (you choose which side). If a creature would be surrounded on all sides by the wall (or the wall and another solid surface), that creature can make a Dexterity saving throw. On a success, it can use its Reaction to move up to its Speed so that it is no longer enclosed by the wall. The wall can have any shape you desire, though it can't occupy the same space as a creature or object. The wall doesn't need to be vertical or rest on a firm foundation. It must, however, merge with and be solidly supported by existing stone. Thus, you can use this spell to bridge a chasm or create a ramp. If you create a span greater than 20 feet in length, you must halve the size of each panel to create supports. You can crudely shape the wall to create battlements and the like. The wall is an object made of stone that can be damaged and thus breached. Each panel has AC 15 and 30 Hit Points per inch of thickness, and it has Immunity to Poison and Psychic damage. Reducing a panel to 0 Hit Points destroys it and might cause connected panels to collapse at the GM's discretion. If you maintain your Concentration on this spell for its full duration, the wall becomes permanent and can't be dispelled. Otherwise, the wall disappears when the spell ends.",
      summary: 'Stone wall. Panels AC 15, 30 HP per inch. Full concentration = permanent.',
    },
  },
];
