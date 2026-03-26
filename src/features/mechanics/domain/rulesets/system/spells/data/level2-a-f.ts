import type { SpellEntry } from '../types';
import { SPELL_CASTER_ABILITY_OPTIONS_NO_CON } from '../shared';

/**
 * Level 2 spells A–F — authoring status:
 * - **Attack/save/AoE modeled:** Acid Arrow (ranged hit), Blindness/Deafness, Blur, Calm Emotions, Detect Thoughts, Flaming Sphere, Hold Person, Invisibility, Flame Blade (melee hit), Moonbeam (interval); Mind Spike / Scorching Ray / Shatter in `level2-g-z`.
 * - **Utility / sense / state:** Barkskin, Darkvision, Find Steed (spawn), Locate Object, See Invisibility (g–z).
 * - **Note-first / heavy caveats:** Aid, Alter Self, Augury, Arcane Lock, Animal Messenger, Continual Flame, Darkness, Enhance Ability, Enlarge/Reduce, Gust of Wind, Knock, Gentle Repose, Find Traps, Dragon’s Breath, Flame Blade, Magic Mouth (g–z), etc.
 */
export const SPELLS_LEVEL_2_A_F: readonly SpellEntry[] = [
{
    id: 'acid-arrow',
    name: 'Acid Arrow',
    school: 'evocation',
    level: 2,
    classes: ['wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 90, unit: 'ft' } },
    duration: { kind: 'instantaneous' },
    components: { verbal: true, somatic: true, material: { description: 'powdered rhubarb leaf' } },
    deliveryMethod: 'ranged-spell-attack',
    resolution: {
      caveats: [
        'End-of-next-turn acid damage and miss (half initial only) are not enforced in encounter.',
      ],
    },
    effects: [
      { kind: 'targeting', target: 'one-creature', targetType: 'creature', requiresSight: true },
      { kind: 'damage', damage: '4d4', damageType: 'acid' },
      {
        kind: 'note',
        text: 'On a hit, the target also takes 2d4 Acid damage at the end of its next turn. On a miss, it takes half as much of the initial damage only.',
        category: 'under-modeled' as const,
      },
    ],
    scaling: [{ category: 'extra-damage', description: '+1d4 to initial and delayed damage per slot level above 2', mode: 'per-slot-level', startsAtSlotLevel: 3, amount: '1d4' }],
    description: {
      full: "A shimmering green arrow streaks toward a target within range and bursts in a spray of acid. Make a ranged spell attack against the target. On a hit, the target takes 4d4 Acid damage and 2d4 Acid damage at the end of its next turn. On a miss, the arrow splashes the target with acid for half as much of the initial damage only. Using a Higher-Level Spell Slot. The damage (both initial and later) increases by 1d4 for each spell slot level above 2.",
      summary: 'Ranged spell attack dealing 4d4 acid plus 2d4 at end of target turn. Scales with slot level.',
    },
  },
{
    id: 'aid',
    name: 'Aid',
    school: 'abjuration',
    level: 2,
    classes: ['bard', 'cleric', 'druid', 'paladin', 'ranger'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 30, unit: 'ft' } },
    duration: { kind: 'timed', value: 8, unit: 'hour' },
    components: { verbal: true, somatic: true, material: { description: 'a strip of white cloth' } },
    resolution: {
      caveats: [
        'Hit Point maximum and current HP increases are not applied in encounter resolution.',
      ],
    },
    effects: [
      {
        kind: 'targeting',
        target: 'chosen-creatures',
        targetType: 'creature',
        count: 3,
      },
      {
        kind: 'note',
        text: "Each target's Hit Point maximum and current Hit Points increase by 5 for the duration.",
        category: 'under-modeled' as const,
      },
    ],
    scaling: [{ category: 'extra-healing', description: '+5 HP max and current per target per slot level above 2', mode: 'per-slot-level', startsAtSlotLevel: 3, amount: 5 }],
    description: {
      full: "Choose up to three creatures within range. Each target's Hit Point maximum and current Hit Points increase by 5 for the duration. Using a Higher-Level Spell Slot. Each target's Hit Points increase by 5 for each spell slot level above 2.",
      summary: 'Up to three creatures gain +5 HP max and current for 8 hours. Scales with slot level.',
    },
  },
{
    id: 'alter-self',
    name: 'Alter Self',
    school: 'transmutation',
    level: 2,
    classes: ['sorcerer', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'self' },
    duration: { kind: 'timed', value: 1, unit: 'hour', concentration: true, upTo: true },
    components: { verbal: true, somatic: true },
    resolution: {
      caveats: [
        'Option switching, swim speed, and natural weapon attacks are not fully modeled in encounter.',
      ],
    },
    effects: [
      {
        kind: 'state',
        stateId: 'alter-self',
        notes: 'Choose Aquatic Adaptation, Change Appearance, or Natural Weapons; Magic action to switch.',
      },
      {
        kind: 'note',
        text: 'Natural Weapons: unarmed strikes use 1d6 of a chosen damage type and your spellcasting ability for attack and damage.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "You alter your physical form. Choose one of the following options. Its effects last for the duration, during which you can take a Magic action to replace the option you chose with a different one. Aquatic Adaptation. You sprout gills and grow webs between your fingers. You can breathe underwater and gain a Swim Speed equal to your Speed. Change Appearance. You alter your appearance. You decide what you look like, including your height, weight, facial features, sound of your voice, hair length, coloration, and other distinguishing characteristics. You can make yourself appear as a member of another species, though none of your statistics change. You can't appear as a creature of a different size, and your basic shape stays the same; if you're bipedal, you can't use this spell to become quadrupedal, for instance. For the duration, you can take a Magic action to change your appearance in this way again. Natural Weapons. You grow claws (Slashing), fangs (Piercing), horns (Piercing), or hooves (Bludgeoning). When you use your Unarmed Strike to deal damage with that new growth, it deals 1d6 damage of the type in parentheses instead of dealing the normal damage for your Unarmed Strike, and you use your spellcasting ability modifier for the attack and damage rolls rather than using Strength.",
      summary: 'Transform with Aquatic Adaptation, Change Appearance, or Natural Weapons. Switch with Magic action.',
    },
  },
{
    id: 'animal-messenger',
    name: 'Animal Messenger',
    school: 'enchantment',
    level: 2,
    classes: ['bard', 'druid', 'ranger'],
    castingTime: { normal: { value: 1, unit: 'action' }, alternate: [{ value: 1, unit: 'action', ritual: true }] },
    range: { kind: 'distance', value: { value: 30, unit: 'ft' } },
    duration: { kind: 'timed', value: 24, unit: 'hour' },
    components: { verbal: true, somatic: true, material: { description: 'a morsel of food' } },
    resolution: {
      caveats: [
        'Tiny Beast messenger, travel, and delivery are not simulated in encounter.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Tiny Beast delivers a 25-word message to a described location/recipient. Travels ~25 mi/day (50 mi if flying). Cha save vs compulsion; non–CR 0 beasts automatically succeed the attempt to serve as messenger.',
        category: 'under-modeled' as const,
      },
    ],
    scaling: [{ category: 'longer-duration', description: '+48 hours duration per slot level above 2', mode: 'per-slot-level', startsAtSlotLevel: 3 }],
    description: {
      full: "A Tiny Beast of your choice that you can see within range must succeed on a Charisma saving throw, or it attempts to deliver a message for you (if the target's Challenge Rating isn't 0, it automatically succeeds). You specify a location you have visited and a recipient who matches a general description, such as \"a person dressed in the uniform of the town guard\" or \"a red-haired dwarf wearing a pointed hat.\" You also communicate a message of up to twenty-five words. The Beast travels for the duration toward the specified location, covering about 25 miles per 24 hours or 50 miles if the Beast can fly. When the Beast arrives, it delivers your message to the creature that you described, mimicking your communication. If the Beast doesn't reach its destination before the spell ends, the message is lost, and the Beast returns to where you cast the spell. Using a Higher-Level Spell Slot. The spell's duration increases by 48 hours for each spell slot level above 2.",
      summary: 'Tiny beast delivers 25-word message to described recipient. Duration scales with slot level.',
    },
  },
{
    id: 'arcane-lock',
    name: 'Arcane Lock',
    school: 'abjuration',
    level: 2,
    classes: ['wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'touch' },
    duration: { kind: 'until-dispelled' },
    components: { verbal: true, somatic: true, material: { description: 'gold dust worth 25+ GP', cost: { value: 25, unit: 'gp', atLeast: true }, consumed: true } },
    resolution: {
      caveats: [
        'Locks, passwords, and suppression of Arcane Lock are not enforced in encounter.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Magically lock door/window/gate/container. Designate who can open; optional password.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "You touch a closed door, window, gate, container, or hatch and magically lock it for the duration. This lock can't be unlocked by any nonmagical means. You and any creatures you designate when you cast the spell can open and close the object despite the lock. You can also set a password that, when spoken within 5 feet of the object, unlocks it for 1 minute.",
      summary: 'Magically lock object until dispelled. Designate who can open; optional password.',
    },
  },
{
    id: 'arcanists-magic-aura',
    name: "Arcanist's Magic Aura",
    school: 'illusion',
    level: 2,
    classes: ['wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'touch' },
    duration: { kind: 'timed', value: 24, unit: 'hour' },
    components: { verbal: true, somatic: true, material: { description: 'a small square of silk' } },
    resolution: {
      caveats: [
        'Mask/False Aura interactions with divination are not enforced in encounter.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Creature: Mask (appear as different creature type). Object: False Aura for detection spells.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "With a touch, you place an illusion on a willing creature or an object that isn't being worn or carried. A creature gains the Mask effect below, and an object gains the False Aura effect below. The effect lasts for the duration. If you cast the spell on the same target every day for 30 days, the illusion lasts until dispelled. Mask (Creature). Choose a creature type other than the target's actual type. Spells and other magical effects treat the target as if it were a creature of the chosen type. False Aura (Object). You change the way the target appears to spells and magical effects that detect magical auras, such as Detect Magic. You can make a nonmagical object appear magical, make a magic item appear nonmagical, or change the object's aura so that it appears to belong to a school of magic you choose.",
      summary: 'Creature: Mask as different type. Object: alter or falsify magical aura for detection.',
    },
  },
{
    id: 'augury',
    name: 'Augury',
    school: 'divination',
    level: 2,
    classes: ['cleric', 'druid', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'minute' }, alternate: [{ value: 1, unit: 'minute', ritual: true }] },
    range: { kind: 'self' },
    duration: { kind: 'instantaneous' },
    components: { verbal: true, somatic: true, material: { description: 'specially marked sticks, bones, cards, or other divinatory tokens worth 25+ GP', cost: { value: 25, unit: 'gp', atLeast: true } } },
    resolution: {
      caveats: [
        'Omens and repeat-cast failure chance are narrative; not resolved by engine.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Receive an omen about results of a planned action within 30 minutes: weal, woe, both, or indifference. 25% cumulative no-answer chance per repeat cast before Long Rest.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "You receive an omen from an otherworldly entity about the results of a course of action that you plan to take within the next 30 minutes. The GM chooses the omen from the Omens table. The spell doesn't account for circumstances, such as other spells, that might change the results. If you cast the spell more than once before finishing a Long Rest, there is a cumulative 25 percent chance for each casting after the first that you get no answer.",
      summary: 'Receive omen about planned action within 30 minutes. Cumulative 25% no-answer on repeat casts.',
    },
  },
  {
    id: 'barkskin',
    name: 'Barkskin',
    school: 'transmutation',
    level: 2,
    classes: ['druid', 'ranger'],
    castingTime: { normal: { value: 1, unit: 'bonus-action' } },
    range: { kind: 'touch' },
    duration: { kind: 'timed', value: 1, unit: 'hour' },
    components: { verbal: true, somatic: true, material: { description: 'a handful of bark' } },
    effects: [
      {
        kind: 'targeting',
        target: 'one-creature',
        targetType: 'creature',
        requiresWilling: true,
      },
      { kind: 'modifier', target: 'armor_class', mode: 'set', value: 17 },
    ],
    description: {
      full: "You touch a willing creature. Until the spell ends, the target's skin assumes a bark-like appearance, and the target has an Armor Class of 17 if its AC is lower than that.",
      summary: 'Touch grants AC 17 (if lower) for 1 hour. Bark-like appearance.',
    },
  },
  {
    id: 'blindness-deafness',
    name: 'Blindness/Deafness',
    school: 'transmutation',
    level: 2,
    classes: ['bard', 'cleric', 'sorcerer', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 120, unit: 'ft' } },
    duration: { kind: 'timed', value: 1, unit: 'minute' },
    components: { verbal: true },
    effects: [
      { kind: 'targeting', target: 'one-creature', targetType: 'creature', requiresSight: true },
      {
        kind: 'save',
        save: { ability: 'con' },
        onFail: [{ kind: 'condition', conditionId: 'blinded', repeatSave: { ability: 'con', timing: 'turn-end' } }],
      },
      {
        kind: 'note',
        text: 'Caster chooses Blinded or Deafened at cast time; data models Blinded only.',
        category: 'under-modeled' as const,
      },
    ],
    scaling: [{
      category: 'extra-targets',
      description: 'You can target one additional creature for each spell slot level above 2.',
      mode: 'per-slot-level',
      startsAtSlotLevel: 2,
    }],
    description: {
      full: "One creature that you can see within range must succeed on a Constitution saving throw, or it has the Blinded or Deafened condition (your choice) for the duration. At the end of each of its turns, the target repeats the save, ending the spell on itself on a success. Using a Higher-Level Spell Slot. You can target one additional creature for each spell slot level above 2.",
      summary: 'Con save or Blinded/Deafened. Repeat save each turn. Scales with extra targets.',
    },
  },
{
    id: 'blur',
    name: 'Blur',
    school: 'illusion',
    level: 2,
    classes: ['sorcerer', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'self' },
    duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true },
    effects: [
      { kind: 'roll-modifier', appliesTo: 'incoming-attacks', modifier: 'disadvantage' },
      { kind: 'note', text: 'Creatures with Blindsight or Truesight are not affected.', category: 'flavor' as const },
    ],
    description: {
      full: "Your body becomes blurred. For the duration, any creature has Disadvantage on attack rolls against you. An attacker is immune to this effect if it perceives you with Blindsight or Truesight.",
      summary: 'Disadvantage on attacks against you. Blindsight/Truesight immune.',
    },
  },
{
    id: 'calm-emotions',
    name: 'Calm Emotions',
    school: 'enchantment',
    level: 2,
    classes: ['bard', 'cleric'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
    duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true },
    effects: [
      { kind: 'targeting', target: 'creatures-in-area', targetType: 'creature', area: { kind: 'sphere', size: 20 }, creatureTypeFilter: ['humanoid'] },
      { kind: 'save', save: { ability: 'cha' }, onFail: [{ kind: 'state', stateId: 'calmed', notes: 'Suppress Charmed/Frightened conditions, or become Indifferent toward chosen Hostile creatures.' }] },
      { kind: 'note', text: 'Indifference ends if target takes damage or witnesses allies taking damage.', category: 'flavor' as const },
    ],
    description: {
      full: "Each Humanoid in a 20-foot-radius Sphere centered on a point you choose within range must succeed on a Charisma saving throw or be affected by one of the following effects (choose for each creature): The creature has Immunity to the Charmed and Frightened conditions until the spell ends (suppressing existing ones). Or the creature becomes Indifferent about creatures of your choice that it's Hostile toward; this ends if the target takes damage or witnesses allies taking damage.",
      summary: '20ft sphere: Cha save or suppress Charmed/Frightened, or become Indifferent toward Hostile creatures.',
    },
  },
{
    id: 'continual-flame',
    name: 'Continual Flame',
    school: 'evocation',
    level: 2,
    classes: ['cleric', 'druid', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'touch' },
    duration: { kind: 'until-dispelled' },
    components: { verbal: true, somatic: true, material: { description: 'ruby dust worth 50+ GP', cost: { value: 50, unit: 'gp', atLeast: true }, consumed: true } },
    resolution: {
      caveats: [
        'Light radius and interaction with environmental darkness are not simulated in encounter.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Object sheds Bright Light in a 20-foot radius and Dim Light for an additional 20 feet. No heat, no fuel. Cannot be smothered or quenched.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "A flame springs from an object that you touch. The effect casts Bright Light in a 20-foot radius and Dim Light for an additional 20 feet. It looks like a regular flame, but it creates no heat and consumes no fuel. The flame can be covered or hidden but not smothered or quenched.",
      summary: 'Permanent flame on object. No heat or fuel. Until dispelled.',
    },
  },
{
    id: 'darkness',
    name: 'Darkness',
    school: 'evocation',
    level: 2,
    classes: ['sorcerer', 'warlock', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
    duration: { kind: 'timed', value: 10, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, material: { description: 'bat fur and a piece of coal' } },
    resolution: {
      caveats: [
        'Magical Darkness vs. light/darkvision and object-centered emanations are not fully modeled.',
        'Encounter may map area effects to creatures only; geometry and allies differ at the table.',
      ],
    },
    effects: [
      { kind: 'targeting', target: 'creatures-in-area', targetType: 'creature', area: { kind: 'sphere', size: 15 } },
      { kind: 'state', stateId: 'heavily-obscured', notes: 'The sphere is Heavily Obscured magical Darkness.' },
      {
        kind: 'note',
        text: 'Darkvision cannot see through it. Nonmagical light cannot illuminate it. Overlaps with level 2 or lower light spells dispels them.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "For the duration, magical Darkness spreads from a point within range and fills a 15-foot-radius Sphere. Darkvision can't see through it, and nonmagical light can't illuminate it. Alternatively, cast on object for 15-foot Emanation. If area overlaps Bright/Dim Light from spell level 2 or lower, that spell is dispelled.",
      summary: '15ft magical Darkness. Darkvision cannot penetrate.',
    },
  },
{
    id: 'darkvision',
    name: 'Darkvision',
    school: 'transmutation',
    level: 2,
    classes: ['druid', 'ranger', 'sorcerer', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'touch' },
    duration: { kind: 'timed', value: 8, unit: 'hour' },
    components: { verbal: true, somatic: true, material: { description: 'a dried carrot' } },
    resolution: {
      caveats: [
        'Darkvision range and vision rules are not applied automatically in encounter.',
      ],
    },
    effects: [
      { kind: 'targeting', target: 'one-creature', targetType: 'creature', requiresWilling: true },
      {
        kind: 'state',
        stateId: 'darkvision',
        notes: 'Darkvision with a range of 150 feet for the duration.',
      },
    ],
    description: {
      full: "For the duration, a willing creature you touch has Darkvision with a range of 150 feet.",
      summary: 'Grant Darkvision 150ft for 8 hours.',
    },
  },
{
    id: 'detect-thoughts',
    name: 'Detect Thoughts',
    school: 'divination',
    level: 2,
    classes: ['bard', 'sorcerer', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'self' },
    duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true, material: { description: '1 Copper Piece' } },
    effects: [
      { kind: 'state', stateId: 'detect-thoughts', notes: 'Sense Thoughts (presence within 30ft) or Read Thoughts (surface mind).' },
      { kind: 'note', text: 'Probe deeper: target makes Wis save. On fail, discern reasoning, emotions, and concerns. Target knows you are probing.', category: 'flavor' as const },
    ],
    description: {
      full: "You activate one of the effects. Sense Thoughts: You sense the presence of thoughts within 30 feet (creatures that know languages or are telepathic). Read Thoughts: Target one creature; learn what is most on its mind. Magic action to probe deeper; target makes Wis save. On fail, discern reasoning, emotions, something looming large. Target knows you are probing. Blocked by 1 foot stone, 1 inch metal, lead.",
      summary: 'Sense or read thoughts within 30ft. Probe deeper with Wis save.',
    },
  },
  {
    id: 'dragons-breath',
    name: "Dragon's Breath",
    school: 'transmutation',
    level: 2,
    classes: ['sorcerer', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'bonus-action' } },
    range: { kind: 'touch' },
    duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true, material: { description: 'a hot pepper' } },
    resolution: {
      caveats: [
        'Damage type choice and Magic action cone breath are not enforced in encounter.',
      ],
      casterOptions: [
        {
          kind: 'enum',
          id: 'dragons-breath-damage-type',
          label: 'Breath damage type',
          options: [
            { value: 'acid', label: 'Acid' },
            { value: 'cold', label: 'Cold' },
            { value: 'fire', label: 'Fire' },
            { value: 'lightning', label: 'Lightning' },
            { value: 'poison', label: 'Poison' },
          ],
        },
      ],
    },
    effects: [
      { kind: 'targeting', target: 'one-creature', targetType: 'creature', requiresWilling: true },
      {
        kind: 'state',
        stateId: 'dragons-breath',
        notes: 'Target can use a Magic action to exhale a 15-foot Cone; Dex save 3d6 of chosen damage type.',
      },
      {
        kind: 'note',
        text: 'Choose Acid, Cold, Fire, Lightning, or Poison when you cast.',
        category: 'under-modeled' as const,
      },
    ],
    scaling: [{ category: 'extra-damage', description: '+1d6 per spell slot level above 2', mode: 'per-slot-level', startsAtSlotLevel: 3, amount: '1d6' }],
    description: {
      full: "You touch one willing creature, and choose Acid, Cold, Fire, Lightning, or Poison. Until the spell ends, the target can take a Magic action to exhale a 15-foot Cone. Each creature in that area makes a Dexterity saving throw, taking 3d6 damage of the chosen type on a failed save or half as much on a successful one. Using a Higher-Level Spell Slot. The damage increases by 1d6 for each spell slot level above 2.",
      summary: 'Grant 15ft cone breath weapon. Dex save 3d6. Scales with slot.',
    },
  },
  {
    id: 'enhance-ability',
    name: 'Enhance Ability',
    school: 'transmutation',
    level: 2,
    classes: ['bard', 'cleric', 'druid', 'ranger', 'sorcerer', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'touch' },
    duration: { kind: 'timed', value: 1, unit: 'hour', concentration: true, upTo: true },
    components: { verbal: true, somatic: true, material: { description: 'fur or a feather' } },
    resolution: {
      caveats: [
        'Chosen ability, Advantage on those checks, and per-target ability choice are not enforced in encounter.',
      ],
      casterOptions: [
        {
          kind: 'enum',
          id: 'enhance-ability-choice',
          label: 'Enhanced ability',
          options: SPELL_CASTER_ABILITY_OPTIONS_NO_CON,
        },
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Touch a creature; choose an ability. The target has Advantage on ability checks using that ability. You can choose a different ability for each target when you cast with a higher-level slot.',
        category: 'under-modeled' as const,
      },
    ],
    scaling: [{ category: 'extra-targets', description: '+1 target per slot level above 2', mode: 'per-slot-level', startsAtSlotLevel: 3 }],
    description: {
      full: "You touch a creature and choose Strength, Dexterity, Intelligence, Wisdom, or Charisma. For the duration, the target has Advantage on ability checks using the chosen ability. Using a Higher-Level Spell Slot. You can target one additional creature for each spell slot level above 2. You can choose a different ability for each target.",
      summary: 'Advantage on ability checks with chosen ability. Scales with targets.',
    },
  },
  {
    id: 'enlarge-reduce',
    name: 'Enlarge/Reduce',
    school: 'transmutation',
    level: 2,
    classes: ['bard', 'druid', 'sorcerer', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 30, unit: 'ft' } },
    duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true, material: { description: 'a pinch of powdered iron' } },
    resolution: {
      caveats: [
        'Unwilling Con save, size change, and weapon damage modifiers are not fully modeled in encounter.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Enlarge or reduce a creature or object you can see. Unwilling creature: Con save negates. Enlarge: larger size, Advantage on Str checks/saves, +1d4 weapon damage. Reduce: smaller size, Disadvantage on Str checks/saves, −1d4 damage (minimum 1).',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "For the duration, the spell enlarges or reduces a creature or object you can see within range. Unwilling creature can make Constitution saving throw; on success, no effect. Enlarge: Size +1 category, Advantage on Str checks/saves, +1d4 damage on attacks. Reduce: Size -1 category, Disadvantage on Str checks/saves, -1d4 damage (min 1).",
      summary: 'Enlarge or reduce creature/object. Con save if unwilling.',
    },
  },
{
    id: 'enthrall',
    name: 'Enthrall',
    school: 'enchantment',
    level: 2,
    classes: ['bard', 'warlock'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
    duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true },
    effects: [
      { kind: 'targeting', target: 'chosen-creatures', targetType: 'creature', requiresSight: true },
      { kind: 'save', save: { ability: 'wis' }, onFail: [{ kind: 'state', stateId: 'enthralled', notes: '-10 to Wisdom (Perception) checks and Passive Perception.' }] },
      { kind: 'note', text: 'Creatures you or companions are fighting automatically succeed.', category: 'flavor' as const },
    ],
    description: {
      full: "You weave a distracting string of words, causing creatures of your choice that you can see within range to make a Wisdom saving throw. Any creature you or your companions are fighting automatically succeeds. On a failed save, a target has a -10 penalty to Wisdom (Perception) checks and Passive Perception until the spell ends.",
      summary: 'Wis save or -10 Perception. Fighting creatures immune.',
    },
  },
{
    id: 'find-steed',
    name: 'Find Steed',
    school: 'conjuration',
    level: 2,
    classes: ['paladin'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 30, unit: 'ft' } },
    duration: { kind: 'instantaneous' },
    components: { verbal: true, somatic: true },
    resolution: {
      caveats: [
        'Spawn effect does not create a combatant; mount rules and slot-scaled stats are not enforced in encounter.',
      ],
    },
    effects: [
      { kind: 'spawn', creature: 'otherworldly-steed', count: 1, placement: { kind: 'self-space' }, location: 'self-space', actsWhen: 'immediately-after-source-turn' },
      {
        kind: 'note',
        text: 'Steed uses Otherworldly Steed stat block. Choose Celestial, Fey, or Fiend. Shares initiative; controlled mount. Disappears at 0 HP or if you die.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "You summon an otherworldly being that appears as a loyal steed in an unoccupied space within range. The steed uses the Otherworldly Steed stat block. Choose creature type: Celestial, Fey, or Fiend. The steed is an ally, shares your Initiative, functions as controlled mount. Disappears if it drops to 0 HP or you die. Using a Higher-Level Spell Slot. Use the spell slot's level for the steed's stats (level 4+ gains Fly 60 ft).",
      summary: 'Summon loyal steed. Celestial/Fey/Fiend. Scales with slot level.',
    },
  },
{
    id: 'find-traps',
    name: 'Find Traps',
    school: 'divination',
    level: 2,
    classes: ['cleric', 'druid', 'ranger'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 120, unit: 'ft' } },
    duration: { kind: 'instantaneous' },
    components: { verbal: true, somatic: true },
    resolution: {
      caveats: [
        'Trap detection and hazard hints are narrative only; not enforced in encounter.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Sense traps within range and line of sight. Learn general nature of danger, not exact location.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "You sense any trap within range that is within line of sight. A trap includes any object or mechanism created to cause damage or danger (Alarm, Glyph of Warding, pit trap). Does not reveal natural weaknesses. This spell reveals that a trap is present but not its location. You do learn the general nature of the danger posed by a trap you sense.",
      summary: 'Sense traps in range. Learn danger type, not location.',
    },
  },
{
    id: 'flame-blade',
    name: 'Flame Blade',
    school: 'evocation',
    level: 2,
    classes: ['druid', 'sorcerer'],
    castingTime: { normal: { value: 1, unit: 'bonus-action' } },
    range: { kind: 'self' },
    duration: { kind: 'timed', value: 10, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true, material: { description: 'a sumac leaf' } },
    deliveryMethod: 'melee-spell-attack',
    resolution: {
      caveats: [
        'Magic action attacks and light radius are not fully modeled.',
      ],
    },
    effects: [
      { kind: 'targeting', target: 'one-creature', targetType: 'creature' },
      { kind: 'damage', damage: '3d6', damageType: 'fire' },
      {
        kind: 'note',
        text: 'Add your spellcasting ability modifier to damage. Bright Light 10 ft, Dim Light 10 ft beyond.',
        category: 'under-modeled' as const,
      },
    ],
    scaling: [{ category: 'extra-damage', description: '+1d6 fire per spell slot level above 2', mode: 'per-slot-level', startsAtSlotLevel: 3, amount: '1d6' }],
    description: {
      full: "You evoke a fiery blade in your free hand. The blade is similar in size and shape to a scimitar, and it lasts for the duration. If you let go of the blade, it disappears, but you can evoke it again as a Bonus Action. As a Magic action, you can make a melee spell attack with the fiery blade. On a hit, the target takes Fire damage equal to 3d6 plus your spellcasting ability modifier. The flaming blade sheds Bright Light in a 10-foot radius and Dim Light for an additional 10 feet. Using a Higher-Level Spell Slot. The damage increases by 1d6 for each spell slot level above 2.",
      summary: 'Fiery blade: melee spell attack 3d6+mod fire. Damage scales with slot.',
    },
  },
{
    id: 'flaming-sphere',
    name: 'Flaming Sphere',
    school: 'conjuration',
    level: 2,
    classes: ['druid', 'sorcerer', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
    duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true, material: { description: 'a ball of wax' } },
    effects: [
      { kind: 'targeting', target: 'creatures-in-area', targetType: 'creature', area: { kind: 'sphere', size: 5 } },
      {
        kind: 'interval',
        stateId: 'flaming-sphere-burn',
        every: { value: 1, unit: 'turn' },
        effects: [
          {
            kind: 'save',
            save: { ability: 'dex' },
            onFail: [{ kind: 'damage', damage: '2d6', damageType: 'fire' }],
            onSuccess: [{ kind: 'damage', damage: '1d6', damageType: 'fire' }],
          },
        ],
      },
      { kind: 'note', text: 'Bonus action to move sphere 30ft. Creatures ending turn within 5ft must save.', category: 'under-modeled' as const },
    ],
    scaling: [{ category: 'extra-damage', description: '+1d6 fire per slot level above 2', mode: 'per-slot-level', startsAtSlotLevel: 3, amount: '1d6' }],
    description: {
      full: "You create a 5-foot-diameter sphere of fire in an unoccupied space on the ground within range. It lasts for the duration. Any creature that ends its turn within 5 feet of the sphere makes a Dexterity saving throw, taking 2d6 Fire damage on a failed save or half as much damage on a successful one. As a Bonus Action, you can move the sphere up to 30 feet, rolling it along the ground. If you move the sphere into a creature's space, that creature makes the save against the sphere, and the sphere stops moving for the turn. When you move the sphere, you can direct it over barriers up to 5 feet tall and jump it across pits up to 10 feet wide. Flammable objects that aren't being worn or carried start burning if touched by the sphere, and it sheds Bright Light in a 20-foot radius and Dim Light for an additional 20 feet. Using a Higher-Level Spell Slot. The damage increases by 1d6 for each spell slot level above 2.",
      summary: '5-foot fire sphere. Dex save 2d6 when ending turn within 5ft. Bonus to move. Damage scales.',
    },
  },
{
    id: 'gentle-repose',
    name: 'Gentle Repose',
    school: 'necromancy',
    level: 2,
    classes: ['cleric', 'paladin', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' }, alternate: [{ value: 1, unit: 'action', ritual: true }] },
    range: { kind: 'touch' },
    duration: { kind: 'timed', value: 10, unit: 'day' },
    components: { verbal: true, somatic: true, material: { description: '2 Copper Pieces', consumed: true } },
    resolution: {
      caveats: [
        'Corpse preservation and raise-dead timers are narrative only in encounter.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Touch corpse. Protected from decay, cannot become Undead. Extends time limit for Raise Dead.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "You touch a corpse or other remains. For the duration, the target is protected from decay and can't become Undead. The spell also effectively extends the time limit on raising the target from the dead, since days spent under the influence of this spell don't count against the time limit of spells such as Raise Dead.",
      summary: 'Protect corpse from decay and undeath. Extends Raise Dead time limit.',
    },
  },
{
    id: 'gust-of-wind',
    name: 'Gust of Wind',
    school: 'evocation',
    level: 2,
    classes: ['druid', 'ranger', 'sorcerer', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'self' },
    duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true, material: { description: 'a legume seed' } },
    resolution: {
      caveats: [
        'Line geometry, wind pushes, and flame extinguishing are not fully modeled.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: '60ft line, 10ft wide. Str save or pushed 15ft. Creatures in line spend 2 ft of movement per 1 ft moved toward you. Disperses gas; extinguishes small flames. Bonus Action to change direction.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "A Line of strong wind 60 feet long and 10 feet wide blasts from you in a direction you choose for the duration. Each creature in the Line must succeed on a Strength saving throw or be pushed 15 feet away from you in a direction following the Line. A creature that ends its turn in the Line must make the same save. Any creature in the Line must spend 2 feet of movement for every 1 foot it moves when moving closer to you. The gust disperses gas or vapor, and it extinguishes candles and similar unprotected flames in the area. It causes protected flames, such as those of lanterns, to dance wildly and has a 50 percent chance to extinguish them. As a Bonus Action on your later turns, you can change the direction in which the Line blasts from you.",
      summary: '60ft line of wind. Str save or pushed 15ft. Difficult to approach. Bonus to change direction.',
    },
  },
  {
    id: 'hold-person',
    name: 'Hold Person',
    school: 'enchantment',
    level: 2,
    classes: ['bard', 'cleric', 'druid', 'sorcerer', 'warlock', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
    duration: { kind: 'timed', value: 1, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true, material: { description: 'a straight piece of iron' } },
    effects: [
      {
        kind: 'targeting',
        target: 'one-creature',
        targetType: 'creature',
        requiresSight: true,
        condition: { kind: 'creature-type', target: 'target', creatureTypes: ['humanoid'] },
      },
      {
        kind: 'save',
        save: { ability: 'wis' },
        onFail: [{ kind: 'condition', conditionId: 'paralyzed', repeatSave: { ability: 'wis', timing: 'turn-end' } }],
      },
    ],
    scaling: [{
      category: 'extra-targets',
      description: 'You can target one additional Humanoid for each spell slot level above 2.',
      mode: 'per-slot-level',
      startsAtSlotLevel: 2,
    }],
    description: {
      full: 'Choose a Humanoid that you can see within range. The target must succeed on a Wisdom saving throw or have the Paralyzed condition for the duration. At the end of each of its turns, the target repeats the save, ending the spell on itself on a success. Using a Higher-Level Spell Slot. You can target one additional Humanoid for each spell slot level above 2.',
      summary: 'A humanoid you can see makes a Wisdom save or is Paralyzed; repeats save at end of each turn.',
    },
  },
  {
    id: 'invisibility',
    name: 'Invisibility',
    school: 'illusion',
    level: 2,
    classes: ['bard', 'sorcerer', 'warlock', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'touch' },
    duration: { kind: 'timed', value: 1, unit: 'hour', concentration: true, upTo: true },
    components: { verbal: true, somatic: true, material: { description: 'an eyelash in gum arabic' } },
    resolution: {
      caveats: [
        'Spell ends early after the target attacks, deals damage, or casts a spell; not tracked automatically.',
      ],
    },
    effects: [
      {
        kind: 'targeting',
        target: 'one-creature',
        targetType: 'creature',
        requiresWilling: true,
      },
      { kind: 'condition', conditionId: 'invisible' },
      {
        kind: 'note',
        text: 'The spell ends early immediately after the target makes an attack roll, deals damage, or casts a spell.',
        category: 'under-modeled' as const,
      },
    ],
    scaling: [{
      category: 'extra-targets',
      description: 'You can target one additional creature for each spell slot level above 2.',
      mode: 'per-slot-level',
      startsAtSlotLevel: 2,
    }],
    description: {
      full: 'A creature you touch has the Invisible condition until the spell ends. The spell ends early immediately after the target makes an attack roll, deals damage, or casts a spell. Using a Higher-Level Spell Slot. You can target one additional creature for each spell slot level above 2.',
      summary: 'A creature you touch becomes Invisible for up to 1 hour; ends if the target attacks, deals damage, or casts a spell.',
    },
  },
  {
    id: 'knock',
    name: 'Knock',
    school: 'transmutation',
    level: 2,
    classes: ['bard', 'sorcerer', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
    duration: { kind: 'instantaneous' },
    components: { verbal: true },
    resolution: {
      caveats: [
        'Lock suppression and audible knock are not modeled in encounter.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Mundane lock: unlock, unstick, unbar. Arcane Lock: suppressed 10 min. Loud knock audible 300ft.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "Choose an object that you can see within range. The object can be a door, a box, a chest, a set of manacles, a padlock, or another object that contains a mundane or magical means that prevents access. A target that is held shut by a mundane lock or that is stuck or barred becomes unlocked, unstuck, or unbarred. If the object has multiple locks, only one of them is unlocked. If the target is held shut by Arcane Lock, that spell is suppressed for 10 minutes, during which time the target can be opened and closed. When you cast the spell, a loud knock, audible up to 300 feet away, emanates from the target.",
      summary: 'Unlock mundane locks. Suppress Arcane Lock 10 min. Loud knock.',
    },
  },
];
