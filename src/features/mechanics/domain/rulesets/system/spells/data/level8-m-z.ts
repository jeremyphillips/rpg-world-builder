import type { SpellEntry } from '../types';

/**
 * Level 8 spells (ids **m–z**) — authoring status:
 * - **Attack/save/AoE modeled:** Sunburst (Con save + radiant).
 * - **Utility / defense:** Mind Blank.
 * - **Note-first / heavy caveats:** Maze, Tsunami, Power Word Stun (HP threshold; see `resolution`).
 */
export const SPELLS_LEVEL_8_M_Z: readonly SpellEntry[] = [
  {
    id: 'maze',
    name: 'Maze',
    school: 'conjuration',
    level: 8,
    classes: ['wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
    duration: { kind: 'timed', value: 10, unit: 'minute', concentration: true, upTo: true },
    components: { verbal: true, somatic: true },
    resolution: {
      caveats: [
        'Study action escape attempt (DC 20 Int Investigation) is not a standard save effect.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Banish creature to labyrinthine demiplane. Study action + DC 20 Int (Investigation) to escape. Reappears in original space when spell ends.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "You banish a creature that you can see within range into a labyrinthine demiplane. The target remains there for the duration or until it escapes the maze. The target can take a Study action to try to escape. When it does so, it makes a DC 20 Intelligence (Investigation) check. If it succeeds, it escapes, and the spell ends. When the spell ends, the target reappears in the space it left or, if that space is occupied, in the nearest unoccupied space.",
      summary: 'Banish to maze demiplane. DC 20 Int (Investigation) to escape.',
    },
  },
  {
    id: 'mind-blank',
    name: 'Mind Blank',
    school: 'abjuration',
    level: 8,
    classes: ['bard', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'touch' },
    duration: { kind: 'timed', value: 24, unit: 'hour' },
    components: { verbal: true, somatic: true },
    resolution: {
      caveats: [
        'Broad immunity to divination/mind influence is narrative shielding, not per-effect hooks.',
      ],
    },
    effects: [
      { kind: 'targeting', target: 'one-creature', targetType: 'creature', requiresWilling: true },
      {
        kind: 'note',
        text: 'Willing creature: Immunity to Psychic and Charmed. Unaffected by emotion/alignment sensing, thought reading, location detection. No spell can gather info, observe remotely, or control mind.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "Until the spell ends, one willing creature you touch has Immunity to Psychic damage and the Charmed condition. The target is also unaffected by anything that would sense its emotions or alignment, read its thoughts, or magically detect its location, and no spell—not even Wish—can gather information about the target, observe it remotely, or control its mind.",
      summary: 'Immunity Psychic and Charmed. No divination or mind control.',
    },
  },
  {
    id: 'power-word-stun',
    name: 'Power Word Stun',
    school: 'enchantment',
    level: 8,
    classes: ['bard', 'sorcerer', 'warlock', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 60, unit: 'ft' } },
    duration: { kind: 'instantaneous' },
    components: { verbal: true },
    resolution: {
      caveats: [
        'Uses current HP vs 150; Stunned ends on Con save at end of each of the target’s turns.',
      ],
      hpThreshold: {
        maxHp: 150,
        aboveMaxHpEffects: [
          { kind: 'modifier', target: 'speed' as const, mode: 'set' as const, value: 0 },
          {
            kind: 'note',
            text: 'Speed 0 until the start of your next turn (not Stunned).',
            category: 'flavor' as const,
          },
        ],
      },
    },
    effects: [
      { kind: 'targeting', target: 'one-creature', targetType: 'creature' },
      { kind: 'condition', conditionId: 'stunned', repeatSave: { ability: 'con', timing: 'turn-end' } },
    ],
    description: {
      full: "You overwhelm the mind of one creature you can see within range. If the target has 150 Hit Points or fewer, it has the Stunned condition. Otherwise, its Speed is 0 until the start of your next turn. The Stunned target makes a Constitution saving throw at the end of each of its turns, ending the condition on itself on a success.",
      summary: '150 HP or fewer: Stunned. Otherwise Speed 0. Con save each turn to end Stunned.',
    },
  },
  {
    id: 'sunburst',
    name: 'Sunburst',
    school: 'evocation',
    level: 8,
    classes: ['cleric', 'druid', 'sorcerer', 'wizard'],
    castingTime: { normal: { value: 1, unit: 'action' } },
    range: { kind: 'distance', value: { value: 150, unit: 'ft' } },
    duration: { kind: 'instantaneous' },
    components: { verbal: true, somatic: true, material: { description: 'a piece of sunstone' } },
    resolution: {
      caveats: [
        'Blinded lasts 1 minute with repeat Con saves at end of each of the target’s turns.',
      ],
    },
    effects: [
      { kind: 'targeting', target: 'creatures-in-area', targetType: 'creature', area: { kind: 'sphere', size: 60 } },
      {
        kind: 'save',
        save: { ability: 'con' },
        onFail: [
          { kind: 'damage', damage: '12d6', damageType: 'radiant' },
          { kind: 'condition', conditionId: 'blinded', repeatSave: { ability: 'con', timing: 'turn-end' } },
        ],
        onSuccess: [{ kind: 'damage', damage: '6d6', damageType: 'radiant' }],
      },
      { kind: 'note', text: 'Dispels Darkness in the area.', category: 'flavor' as const },
    ],
    description: {
      full: "Brilliant sunlight flashes in a 60-foot-radius Sphere centered on a point you choose within range. Each creature in the Sphere makes a Constitution saving throw. On a failed save, a creature takes 12d6 Radiant damage and has the Blinded condition for 1 minute. On a successful save, it takes half as much damage only. A creature Blinded by this spell makes another Constitution saving throw at the end of each of its turns, ending the effect on itself on a success. This spell dispels Darkness in its area that was created by any spell.",
      summary: '60ft sphere: Con save or 12d6 Radiant + Blinded 1 min. Dispels Darkness.',
    },
  },
  // OUTLIER: Duration is "up to 6 rounds" but TimeUnit (shared/time) only has minute|hour|day.
  // Using kind:'special' as workaround. Revisit if TimeUnit gains 'round' support.
  {
    id: 'tsunami',
    name: 'Tsunami',
    school: 'conjuration',
    level: 8,
    classes: ['druid'],
    castingTime: { normal: { value: 1, unit: 'minute' } },
    range: { kind: 'distance', value: { value: 5280, unit: 'ft' } },
    duration: { kind: 'special', description: 'Concentration, up to 6 rounds', concentration: true },
    components: { verbal: true, somatic: true },
    resolution: {
      caveats: [
        'Wall movement, height/damage decay, and Athletics checks to swim are manual each round.',
      ],
    },
    effects: [
      {
        kind: 'note',
        text: 'Wall up to 300×300×50ft. Appear: Str save or 6d10 bludgeoning. Each turn: wall moves 50ft, Str save or 5d10 (once/round). Height -50ft, damage -1d10 each turn. Swimming: Str (Athletics) vs DC to move.',
        category: 'under-modeled' as const,
      },
    ],
    description: {
      full: "A wall of water springs into existence at a point you choose within range. You can make the wall up to 300 feet long, 300 feet high, and 50 feet thick. The wall lasts for the duration. When the wall appears, each creature in its area makes a Strength saving throw, taking 6d10 Bludgeoning damage on a failed save or half as much damage on a successful one. At the start of each of your turns after the wall appears, the wall, along with any creatures in it, moves 50 feet away from you. Any Huge or smaller creature inside the wall or whose space the wall enters when it moves must succeed on a Strength saving throw or take 5d10 Bludgeoning damage. A creature can take this damage only once per round. At the end of the turn, the wall's height is reduced by 50 feet, and the damage the wall deals on later rounds is reduced by 1d10. When the wall reaches 0 feet in height, the spell ends. A creature caught in the wall can move by swimming. Because of the wave's force, though, the creature must succeed on a Strength (Athletics) check against your spell save DC to move at all. If it fails the check, it can't move. A creature that moves out of the wall falls to the ground.",
      summary: 'Water wall 300×300×50ft. Str save 6d10. Moves 50ft/turn, -50ft height, -1d10 damage.',
    },
  },
];
