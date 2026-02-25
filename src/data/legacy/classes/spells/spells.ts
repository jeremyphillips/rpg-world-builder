import type { Spell } from './spells.types'

// ---------------------------------------------------------------------------
// Cross-Edition Spell Catalog
// ---------------------------------------------------------------------------
// Each spell has one entry with multiple editions in its editions[] array.
// Class IDs use canonical catalog IDs (post-alias): 'wizard' not 'mage'.
// Editions without cantrips (1e, 2e, Basic, OD&D) omit level-0 entries.
// ---------------------------------------------------------------------------

export const spells: Spell[] = [

  // ═══════════════════════════════════════════════════════════════
  // Cantrips (level 0) — 5e / 3.5e only
  // ═══════════════════════════════════════════════════════════════

  {
    id: 'fireBolt',
    name: 'Fire Bolt',
    school: 'evocation',
    editions: [
      { edition: '5e', level: 0, classes: ['artificer', 'sorcerer', 'wizard'], source: 'PHB' },
    ],
  },
  {
    id: 'eldritchBlast',
    name: 'Eldritch Blast',
    school: 'evocation',
    editions: [
      { edition: '5e', level: 0, classes: ['warlock'], source: 'PHB' },
    ],
  },
  {
    id: 'sacredFlame',
    name: 'Sacred Flame',
    school: 'evocation',
    editions: [
      { edition: '5e', level: 0, classes: ['cleric'], source: 'PHB' },
    ],
  },
  {
    id: 'mageHand',
    name: 'Mage Hand',
    school: 'conjuration',
    editions: [
      { edition: '5e', level: 0, classes: ['artificer', 'bard', 'sorcerer', 'warlock', 'wizard'], source: 'PHB' },
      { edition: '3.5e', level: 0, classes: ['bard', 'sorcerer', 'wizard'], source: 'PHB' },
    ],
  },
  {
    id: 'prestidigitation',
    name: 'Prestidigitation',
    school: 'transmutation',
    editions: [
      { edition: '5e', level: 0, classes: ['artificer', 'bard', 'sorcerer', 'warlock', 'wizard'], source: 'PHB' },
      { edition: '3.5e', level: 0, classes: ['bard', 'sorcerer', 'wizard'], source: 'PHB' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // 1st Level
  // ═══════════════════════════════════════════════════════════════

  {
    id: 'light',
    name: 'Light',
    school: 'evocation',
    editions: [
      { edition: '5e', level: 0, classes: ['artificer', 'bard', 'cleric', 'sorcerer', 'wizard'], source: 'PHB' },
      { edition: '3.5e', level: 0, classes: ['bard', 'cleric', 'sorcerer', 'wizard'], source: 'PHB' },
      { edition: '2e', level: 1, classes: ['wizard'], source: 'PHB' },
      { edition: '1e', level: 1, classes: ['wizard', 'cleric'], source: 'PHB' },
      { edition: 'b', level: 1, classes: ['wizard', 'cleric'] },
      { edition: 'odd', level: 1, classes: ['wizard', 'cleric'] },
    ],
  },
  {
    id: 'magicMissile',
    name: 'Magic Missile',
    school: 'evocation',
    editions: [
      { edition: '5e', level: 1, classes: ['sorcerer', 'wizard'], source: 'PHB' },
      { edition: '3.5e', level: 1, classes: ['sorcerer', 'wizard'], source: 'PHB' },
      { edition: '2e', level: 1, classes: ['wizard'], source: 'PHB' },
      { edition: '1e', level: 1, classes: ['wizard'], source: 'PHB' },
      { edition: 'b', level: 1, classes: ['wizard'] },
      { edition: 'odd', level: 1, classes: ['wizard'] },
    ],
  },
  {
    id: 'shield',
    name: 'Shield',
    school: 'abjuration',
    editions: [
      { edition: '5e', level: 1, classes: ['sorcerer', 'wizard'], source: 'PHB' },
      { edition: '3.5e', level: 1, classes: ['sorcerer', 'wizard'], source: 'PHB' },
      { edition: '2e', level: 1, classes: ['wizard'], source: 'PHB' },
      { edition: '1e', level: 1, classes: ['wizard'], source: 'PHB' },
      { edition: 'b', level: 1, classes: ['wizard'] },
      { edition: 'odd', level: 1, classes: ['wizard'] },
    ],
  },
  {
    id: 'cureWounds',
    name: 'Cure Wounds',
    school: 'evocation',
    editions: [
      { edition: '5e', level: 1, classes: ['artificer', 'bard', 'cleric', 'druid', 'paladin', 'ranger'], source: 'PHB' },
      // 3.5e/2e/1e/Basic: "Cure Light Wounds" — same spell, different name
      { edition: '3.5e', level: 1, classes: ['bard', 'cleric', 'druid', 'paladin', 'ranger'], source: 'PHB' },
      { edition: '2e', level: 1, classes: ['cleric', 'druid'], source: 'PHB' },
      { edition: '1e', level: 1, classes: ['cleric', 'druid'], source: 'PHB' },
      { edition: 'b', level: 1, classes: ['cleric'] },
      { edition: 'odd', level: 1, classes: ['cleric'] },
    ],
  },
  {
    id: 'healingWord',
    name: 'Healing Word',
    school: 'evocation',
    editions: [
      { edition: '5e', level: 1, classes: ['bard', 'cleric', 'druid'], source: 'PHB' },
    ],
  },
  {
    id: 'thunderwave',
    name: 'Thunderwave',
    school: 'evocation',
    editions: [
      { edition: '5e', level: 1, classes: ['bard', 'druid', 'sorcerer', 'wizard'], source: 'PHB' },
    ],
  },
  {
    id: 'detectMagic',
    name: 'Detect Magic',
    school: 'divination',
    editions: [
      { edition: '5e', level: 1, classes: ['artificer', 'bard', 'cleric', 'druid', 'paladin', 'ranger', 'sorcerer', 'wizard'], ritual: true, concentration: true, source: 'PHB' },
      { edition: '3.5e', level: 1, classes: ['bard', 'cleric', 'druid', 'sorcerer', 'wizard'], source: 'PHB' },
      { edition: '2e', level: 1, classes: ['wizard'], source: 'PHB' },
      { edition: '1e', level: 1, classes: ['wizard', 'cleric'], source: 'PHB' },
      { edition: 'b', level: 1, classes: ['wizard', 'cleric'] },
      { edition: 'odd', level: 1, classes: ['wizard', 'cleric'] },
    ],
  },
  {
    id: 'guidingBolt',
    name: 'Guiding Bolt',
    school: 'evocation',
    editions: [
      { edition: '5e', level: 1, classes: ['cleric'], source: 'PHB' },
    ],
  },
  {
    id: 'sleep',
    name: 'Sleep',
    school: 'enchantment',
    editions: [
      { edition: '5e', level: 1, classes: ['bard', 'sorcerer', 'wizard'], source: 'PHB' },
      { edition: '3.5e', level: 1, classes: ['bard', 'sorcerer', 'wizard'], source: 'PHB' },
      { edition: '2e', level: 1, classes: ['wizard'], source: 'PHB' },
      { edition: '1e', level: 1, classes: ['wizard'], source: 'PHB' },
      { edition: 'b', level: 1, classes: ['wizard'] },
      { edition: 'odd', level: 1, classes: ['wizard'] },
    ],
  },
  {
    id: 'charmPerson',
    name: 'Charm Person',
    school: 'enchantment',
    editions: [
      { edition: '5e', level: 1, classes: ['bard', 'druid', 'sorcerer', 'warlock', 'wizard'], source: 'PHB' },
      { edition: '3.5e', level: 1, classes: ['bard', 'sorcerer', 'wizard'], source: 'PHB' },
      { edition: '2e', level: 1, classes: ['wizard'], source: 'PHB' },
      { edition: '1e', level: 1, classes: ['wizard'], source: 'PHB' },
      { edition: 'b', level: 1, classes: ['wizard'] },
      { edition: 'odd', level: 1, classes: ['wizard'] },
    ],
  },
  {
    id: 'protectionFromEvil',
    name: 'Protection from Evil and Good',
    school: 'abjuration',
    editions: [
      // 5e: "Protection from Evil and Good"
      { edition: '5e', level: 1, classes: ['cleric', 'paladin', 'warlock', 'wizard'], concentration: true, source: 'PHB' },
      // Earlier editions: "Protection from Evil"
      { edition: '3.5e', level: 1, classes: ['cleric', 'paladin', 'sorcerer', 'wizard'], source: 'PHB' },
      { edition: '2e', level: 1, classes: ['wizard', 'cleric'], source: 'PHB' },
      { edition: '1e', level: 1, classes: ['wizard', 'cleric'], source: 'PHB' },
      { edition: 'b', level: 1, classes: ['wizard', 'cleric'] },
      { edition: 'odd', level: 1, classes: ['wizard', 'cleric'] },
    ],
  },
  {
    id: 'bless',
    name: 'Bless',
    school: 'enchantment',
    editions: [
      { edition: '5e', level: 1, classes: ['cleric', 'paladin'], concentration: true, source: 'PHB' },
      { edition: '3.5e', level: 1, classes: ['cleric', 'paladin'], source: 'PHB' },
      { edition: '2e', level: 1, classes: ['cleric'], source: 'PHB' },
      { edition: '1e', level: 1, classes: ['cleric'], source: 'PHB' },
    ],
  },
  {
    id: 'featherFall',
    name: 'Feather Fall',
    school: 'transmutation',
    editions: [
      { edition: '5e', level: 1, classes: ['artificer', 'bard', 'sorcerer', 'wizard'], source: 'PHB' },
      { edition: '3.5e', level: 1, classes: ['bard', 'sorcerer', 'wizard'], source: 'PHB' },
      { edition: '2e', level: 1, classes: ['wizard'], source: 'PHB' },
      { edition: '1e', level: 1, classes: ['wizard'], source: 'PHB' },
    ],
  },
  {
    id: 'identify',
    name: 'Identify',
    school: 'divination',
    editions: [
      { edition: '5e', level: 1, classes: ['artificer', 'bard', 'wizard'], ritual: true, source: 'PHB' },
      { edition: '3.5e', level: 1, classes: ['bard', 'wizard'], source: 'PHB' },
      { edition: '2e', level: 1, classes: ['wizard'], source: 'PHB' },
      { edition: '1e', level: 1, classes: ['wizard'], source: 'PHB' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // 2nd Level
  // ═══════════════════════════════════════════════════════════════

  {
    id: 'mistyStep',
    name: 'Misty Step',
    school: 'conjuration',
    editions: [
      { edition: '5e', level: 2, classes: ['sorcerer', 'warlock', 'wizard'], source: 'PHB' },
    ],
  },
  {
    id: 'spiritualWeapon',
    name: 'Spiritual Weapon',
    school: 'evocation',
    editions: [
      { edition: '5e', level: 2, classes: ['cleric'], source: 'PHB' },
      { edition: '3.5e', level: 2, classes: ['cleric'], source: 'PHB' },
      { edition: '2e', level: 2, classes: ['cleric'], source: 'PHB' },
    ],
  },
  {
    id: 'holdPerson',
    name: 'Hold Person',
    school: 'enchantment',
    editions: [
      { edition: '5e', level: 2, classes: ['bard', 'cleric', 'druid', 'sorcerer', 'warlock', 'wizard'], concentration: true, source: 'PHB' },
      { edition: '3.5e', level: 2, classes: ['bard', 'cleric', 'sorcerer', 'wizard'], source: 'PHB' },
      { edition: '2e', level: 2, classes: ['cleric'], source: 'PHB' },
      { edition: '1e', level: 2, classes: ['cleric'], source: 'PHB' },
      { edition: 'b', level: 2, classes: ['cleric'] },
    ],
  },
  {
    id: 'scorchingRay',
    name: 'Scorching Ray',
    school: 'evocation',
    editions: [
      { edition: '5e', level: 2, classes: ['sorcerer', 'wizard'], source: 'PHB' },
      { edition: '3.5e', level: 2, classes: ['sorcerer', 'wizard'], source: 'PHB' },
    ],
  },
  {
    id: 'web',
    name: 'Web',
    school: 'conjuration',
    editions: [
      { edition: '5e', level: 2, classes: ['artificer', 'sorcerer', 'wizard'], concentration: true, source: 'PHB' },
      { edition: '3.5e', level: 2, classes: ['sorcerer', 'wizard'], source: 'PHB' },
      { edition: '2e', level: 2, classes: ['wizard'], source: 'PHB' },
      { edition: '1e', level: 2, classes: ['wizard'], source: 'PHB' },
      { edition: 'b', level: 2, classes: ['wizard'] },
      { edition: 'odd', level: 2, classes: ['wizard'] },
    ],
  },
  {
    id: 'invisibility',
    name: 'Invisibility',
    school: 'illusion',
    editions: [
      { edition: '5e', level: 2, classes: ['artificer', 'bard', 'sorcerer', 'warlock', 'wizard'], concentration: true, source: 'PHB' },
      { edition: '3.5e', level: 2, classes: ['bard', 'sorcerer', 'wizard'], source: 'PHB' },
      { edition: '2e', level: 2, classes: ['wizard'], source: 'PHB' },
      { edition: '1e', level: 2, classes: ['wizard'], source: 'PHB' },
      { edition: 'b', level: 2, classes: ['wizard'] },
      { edition: 'odd', level: 2, classes: ['wizard'] },
    ],
  },
  {
    id: 'silence',
    name: 'Silence',
    school: 'illusion',
    editions: [
      { edition: '5e', level: 2, classes: ['bard', 'cleric', 'ranger'], ritual: true, concentration: true, source: 'PHB' },
      { edition: '3.5e', level: 2, classes: ['bard', 'cleric'], source: 'PHB' },
      { edition: '2e', level: 2, classes: ['cleric'], source: 'PHB' },
      { edition: '1e', level: 2, classes: ['cleric'], source: 'PHB' },
    ],
  },
  {
    id: 'lesserRestoration',
    name: 'Lesser Restoration',
    school: 'abjuration',
    editions: [
      { edition: '5e', level: 2, classes: ['artificer', 'bard', 'cleric', 'druid', 'paladin', 'ranger'], source: 'PHB' },
      { edition: '3.5e', level: 2, classes: ['cleric', 'druid', 'paladin'], source: 'PHB' },
      // 2e/1e: "Slow Poison" / partial restoration — not a direct map
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // 3rd Level
  // ═══════════════════════════════════════════════════════════════

  {
    id: 'fireball',
    name: 'Fireball',
    school: 'evocation',
    editions: [
      { edition: '5e', level: 3, classes: ['sorcerer', 'wizard'], source: 'PHB' },
      { edition: '3.5e', level: 3, classes: ['sorcerer', 'wizard'], source: 'PHB' },
      { edition: '2e', level: 3, classes: ['wizard'], source: 'PHB' },
      { edition: '1e', level: 3, classes: ['wizard'], source: 'PHB' },
      { edition: 'b', level: 3, classes: ['wizard'] },
      { edition: 'odd', level: 3, classes: ['wizard'] },
    ],
  },
  {
    id: 'counterspell',
    name: 'Counterspell',
    school: 'abjuration',
    editions: [
      { edition: '5e', level: 3, classes: ['sorcerer', 'warlock', 'wizard'], source: 'PHB' },
    ],
  },
  {
    id: 'spiritGuardians',
    name: 'Spirit Guardians',
    school: 'conjuration',
    editions: [
      { edition: '5e', level: 3, classes: ['cleric'], concentration: true, source: 'PHB' },
    ],
  },
  {
    id: 'revivify',
    name: 'Revivify',
    school: 'necromancy',
    editions: [
      { edition: '5e', level: 3, classes: ['artificer', 'cleric', 'paladin'], source: 'PHB' },
      // 3.5e: similar functionality via "Revivify" in Spell Compendium
    ],
  },
  {
    id: 'haste',
    name: 'Haste',
    school: 'transmutation',
    editions: [
      { edition: '5e', level: 3, classes: ['artificer', 'sorcerer', 'wizard'], concentration: true, source: 'PHB' },
      { edition: '3.5e', level: 3, classes: ['bard', 'sorcerer', 'wizard'], source: 'PHB' },
      { edition: '2e', level: 3, classes: ['wizard'], source: 'PHB' },
      { edition: '1e', level: 3, classes: ['wizard'], source: 'PHB' },
    ],
  },
  {
    id: 'lightningBolt',
    name: 'Lightning Bolt',
    school: 'evocation',
    editions: [
      { edition: '5e', level: 3, classes: ['sorcerer', 'wizard'], source: 'PHB' },
      { edition: '3.5e', level: 3, classes: ['sorcerer', 'wizard'], source: 'PHB' },
      { edition: '2e', level: 3, classes: ['wizard'], source: 'PHB' },
      { edition: '1e', level: 3, classes: ['wizard'], source: 'PHB' },
      { edition: 'b', level: 3, classes: ['wizard'] },
      { edition: 'odd', level: 3, classes: ['wizard'] },
    ],
  },
  {
    id: 'fly',
    name: 'Fly',
    school: 'transmutation',
    editions: [
      { edition: '5e', level: 3, classes: ['artificer', 'sorcerer', 'warlock', 'wizard'], concentration: true, source: 'PHB' },
      { edition: '3.5e', level: 3, classes: ['sorcerer', 'wizard'], source: 'PHB' },
      { edition: '2e', level: 3, classes: ['wizard'], source: 'PHB' },
      { edition: '1e', level: 3, classes: ['wizard'], source: 'PHB' },
      { edition: 'b', level: 3, classes: ['wizard'] },
    ],
  },
  {
    id: 'dispelMagic',
    name: 'Dispel Magic',
    school: 'abjuration',
    editions: [
      { edition: '5e', level: 3, classes: ['artificer', 'bard', 'cleric', 'druid', 'paladin', 'sorcerer', 'warlock', 'wizard'], source: 'PHB' },
      { edition: '3.5e', level: 3, classes: ['bard', 'cleric', 'druid', 'paladin', 'sorcerer', 'wizard'], source: 'PHB' },
      { edition: '2e', level: 3, classes: ['wizard', 'cleric'], source: 'PHB' },
      { edition: '1e', level: 3, classes: ['wizard', 'cleric'], source: 'PHB' },
      { edition: 'b', level: 3, classes: ['wizard', 'cleric'] },
      { edition: 'odd', level: 3, classes: ['wizard', 'cleric'] },
    ],
  },
  {
    id: 'removeCurse',
    name: 'Remove Curse',
    school: 'abjuration',
    editions: [
      { edition: '5e', level: 3, classes: ['cleric', 'paladin', 'warlock', 'wizard'], source: 'PHB' },
      { edition: '3.5e', level: 3, classes: ['cleric', 'paladin', 'sorcerer', 'wizard'], source: 'PHB' },
      { edition: '2e', level: 3, classes: ['wizard', 'cleric'], source: 'PHB' },
      { edition: '1e', level: 3, classes: ['wizard', 'cleric'], source: 'PHB' },
      { edition: 'b', level: 3, classes: ['wizard', 'cleric'] },
    ],
  },
  {
    id: 'slow',
    name: 'Slow',
    school: 'transmutation',
    editions: [
      { edition: '5e', level: 3, classes: ['sorcerer', 'wizard'], concentration: true, source: 'PHB' },
      { edition: '3.5e', level: 3, classes: ['bard', 'sorcerer', 'wizard'], source: 'PHB' },
      { edition: '2e', level: 3, classes: ['wizard'], source: 'PHB' },
      { edition: '1e', level: 3, classes: ['wizard'], source: 'PHB' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // 4th Level
  // ═══════════════════════════════════════════════════════════════

  {
    id: 'dimensionDoor',
    name: 'Dimension Door',
    school: 'conjuration',
    editions: [
      { edition: '5e', level: 4, classes: ['bard', 'sorcerer', 'warlock', 'wizard'], source: 'PHB' },
      { edition: '3.5e', level: 4, classes: ['bard', 'sorcerer', 'wizard'], source: 'PHB' },
      { edition: '2e', level: 4, classes: ['wizard'], source: 'PHB' },
      { edition: '1e', level: 4, classes: ['wizard'], source: 'PHB' },
      { edition: 'b', level: 4, classes: ['wizard'] },
    ],
  },
  {
    id: 'banishment',
    name: 'Banishment',
    school: 'abjuration',
    editions: [
      { edition: '5e', level: 4, classes: ['cleric', 'paladin', 'sorcerer', 'warlock', 'wizard'], concentration: true, source: 'PHB' },
      { edition: '3.5e', level: 4, classes: ['cleric', 'sorcerer', 'wizard'], source: 'PHB' },
    ],
  },
  {
    id: 'polymorph',
    name: 'Polymorph',
    school: 'transmutation',
    editions: [
      { edition: '5e', level: 4, classes: ['bard', 'druid', 'sorcerer', 'wizard'], concentration: true, source: 'PHB' },
      { edition: '3.5e', level: 4, classes: ['sorcerer', 'wizard'], source: 'PHB' },
      // 2e/1e: "Polymorph Self" (4th) and "Polymorph Other" (4th) — two separate spells
      { edition: '2e', level: 4, classes: ['wizard'], source: 'PHB' },
      { edition: '1e', level: 4, classes: ['wizard'], source: 'PHB' },
      { edition: 'b', level: 4, classes: ['wizard'] },
    ],
  },
  {
    id: 'iceStorm',
    name: 'Ice Storm',
    school: 'evocation',
    editions: [
      { edition: '5e', level: 4, classes: ['druid', 'sorcerer', 'wizard'], source: 'PHB' },
      { edition: '3.5e', level: 4, classes: ['druid', 'sorcerer', 'wizard'], source: 'PHB' },
      { edition: '2e', level: 4, classes: ['wizard'], source: 'PHB' },
      { edition: '1e', level: 4, classes: ['wizard'], source: 'PHB' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // 5th Level
  // ═══════════════════════════════════════════════════════════════

  {
    id: 'wallOfForce',
    name: 'Wall of Force',
    school: 'evocation',
    editions: [
      { edition: '5e', level: 5, classes: ['wizard'], concentration: true, source: 'PHB' },
      { edition: '3.5e', level: 5, classes: ['sorcerer', 'wizard'], source: 'PHB' },
      { edition: '2e', level: 5, classes: ['wizard'], source: 'PHB' },
      { edition: '1e', level: 5, classes: ['wizard'], source: 'PHB' },
    ],
  },
  {
    id: 'greaterRestoration',
    name: 'Greater Restoration',
    school: 'abjuration',
    editions: [
      { edition: '5e', level: 5, classes: ['artificer', 'bard', 'cleric', 'druid'], source: 'PHB' },
      { edition: '3.5e', level: 5, classes: ['cleric'], source: 'PHB' },
    ],
  },
  {
    id: 'raiseDead',
    name: 'Raise Dead',
    school: 'necromancy',
    editions: [
      { edition: '5e', level: 5, classes: ['bard', 'cleric', 'paladin'], source: 'PHB' },
      { edition: '3.5e', level: 5, classes: ['cleric'], source: 'PHB' },
      { edition: '2e', level: 5, classes: ['cleric'], source: 'PHB' },
      { edition: '1e', level: 5, classes: ['cleric'], source: 'PHB' },
      { edition: 'b', level: 5, classes: ['cleric'] },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // 6th Level
  // ═══════════════════════════════════════════════════════════════

  {
    id: 'chainLightning',
    name: 'Chain Lightning',
    school: 'evocation',
    editions: [
      { edition: '5e', level: 6, classes: ['sorcerer', 'wizard'], source: 'PHB' },
      { edition: '3.5e', level: 6, classes: ['sorcerer', 'wizard'], source: 'PHB' },
      { edition: '2e', level: 6, classes: ['wizard'], source: 'PHB' },
      { edition: '1e', level: 6, classes: ['wizard'], source: 'PHB' },
    ],
  },
  {
    id: 'disintegrate',
    name: 'Disintegrate',
    school: 'transmutation',
    editions: [
      { edition: '5e', level: 6, classes: ['sorcerer', 'wizard'], source: 'PHB' },
      { edition: '3.5e', level: 6, classes: ['sorcerer', 'wizard'], source: 'PHB' },
      { edition: '2e', level: 6, classes: ['wizard'], source: 'PHB' },
      { edition: '1e', level: 6, classes: ['wizard'], source: 'PHB' },
      { edition: 'b', level: 6, classes: ['wizard'] },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // 7th Level
  // ═══════════════════════════════════════════════════════════════

  {
    id: 'teleport',
    name: 'Teleport',
    school: 'conjuration',
    editions: [
      { edition: '5e', level: 7, classes: ['bard', 'sorcerer', 'wizard'], source: 'PHB' },
      { edition: '3.5e', level: 5, classes: ['sorcerer', 'wizard'], source: 'PHB' },
      { edition: '2e', level: 5, classes: ['wizard'], source: 'PHB' },
      { edition: '1e', level: 5, classes: ['wizard'], source: 'PHB' },
      { edition: 'b', level: 5, classes: ['wizard'] },
    ],
  },
  {
    id: 'resurrection',
    name: 'Resurrection',
    school: 'necromancy',
    editions: [
      { edition: '5e', level: 7, classes: ['bard', 'cleric'], source: 'PHB' },
      { edition: '3.5e', level: 7, classes: ['cleric'], source: 'PHB' },
      { edition: '2e', level: 7, classes: ['cleric'], source: 'PHB' },
      { edition: '1e', level: 7, classes: ['cleric'], source: 'PHB' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // 8th Level
  // ═══════════════════════════════════════════════════════════════

  {
    id: 'powerWordStun',
    name: 'Power Word Stun',
    school: 'enchantment',
    editions: [
      { edition: '5e', level: 8, classes: ['bard', 'sorcerer', 'warlock', 'wizard'], source: 'PHB' },
      { edition: '3.5e', level: 8, classes: ['sorcerer', 'wizard'], source: 'PHB' },
      { edition: '2e', level: 7, classes: ['wizard'], source: 'PHB' },
      { edition: '1e', level: 7, classes: ['wizard'], source: 'PHB' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // 9th Level
  // ═══════════════════════════════════════════════════════════════

  {
    id: 'wish',
    name: 'Wish',
    school: 'conjuration',
    editions: [
      { edition: '5e', level: 9, classes: ['sorcerer', 'wizard'], source: 'PHB' },
      { edition: '3.5e', level: 9, classes: ['sorcerer', 'wizard'], source: 'PHB' },
      { edition: '2e', level: 9, classes: ['wizard'], source: 'PHB' },
      { edition: '1e', level: 9, classes: ['wizard'], source: 'PHB' },
    ],
  },
  {
    id: 'powerWordKill',
    name: 'Power Word Kill',
    school: 'enchantment',
    editions: [
      { edition: '5e', level: 9, classes: ['bard', 'sorcerer', 'warlock', 'wizard'], source: 'PHB' },
      { edition: '3.5e', level: 9, classes: ['sorcerer', 'wizard'], source: 'PHB' },
      { edition: '2e', level: 9, classes: ['wizard'], source: 'PHB' },
      { edition: '1e', level: 9, classes: ['wizard'], source: 'PHB' },
    ],
  },
]
