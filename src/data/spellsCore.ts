export interface SpellData {
  id: string
  name: string
  school: string                          // 'evocation', 'abjuration', 'conjuration', etc.
  level: number                           // 0 = cantrip (5e), 1-9 for leveled spells
  classes: string[]                       // canonical class IDs: ['wizard', 'sorcerer']
  ritual?: boolean                        // can be cast as a ritual
  concentration?: boolean                 // requires concentration (5e)
  source?: string
}

export const spellsCore: SpellData[] = [
  {
    id: 'fireBolt',
    name: 'Fire Bolt',
    school: 'evocation',
    level: 0,
    classes: ['artificer', 'sorcerer', 'wizard'],
    source: 'PHB'
  },
  {
    id: 'eldritchBlast',
    name: 'Eldritch Blast',
    school: 'evocation',
    level: 0,
    classes: ['warlock'],
    source: 'PHB'
  },
  {
    id: 'sacredFlame',
    name: 'Sacred Flame',
    school: 'evocation',
    level: 0,
    classes: ['cleric'],
    source: 'PHB'
  },
  {
    id: 'mageHand',
    name: 'Mage Hand',
    school: 'conjuration',
    level: 0,
    classes: ['artificer', 'bard', 'sorcerer', 'warlock', 'wizard'],
    source: 'PHB'
  },
  {
    id: 'prestidigitation',
    name: 'Prestidigitation',
    school: 'transmutation',
    level: 0,
    classes: ['artificer', 'bard', 'sorcerer', 'warlock', 'wizard'],
    source: 'PHB'
  },
  {
    id: 'light',
    name: 'Light',
    school: 'evocation',
    level: 0,
    classes: ['artificer', 'bard', 'cleric', 'sorcerer', 'wizard'],
    source: 'PHB'
  },
  {
    id: 'magicMissile',
    name: 'Magic Missile',
    school: 'evocation',
    level: 1,
    classes: ['sorcerer', 'wizard'],
    source: 'PHB'
  },
  {
    id: 'shield',
    name: 'Shield',
    school: 'abjuration',
    level: 1,
    classes: ['sorcerer', 'wizard'],
    source: 'PHB'
  },
  {
    id: 'cureWounds',
    name: 'Cure Wounds',
    school: 'evocation',
    level: 1,
    classes: ['artificer', 'bard', 'cleric', 'druid', 'paladin', 'ranger'],
    source: 'PHB'
  },
  {
    id: 'healingWord',
    name: 'Healing Word',
    school: 'evocation',
    level: 1,
    classes: ['bard', 'cleric', 'druid'],
    source: 'PHB'
  },
  {
    id: 'thunderwave',
    name: 'Thunderwave',
    school: 'evocation',
    level: 1,
    classes: ['bard', 'druid', 'sorcerer', 'wizard'],
    source: 'PHB'
  },
  {
    id: 'detectMagic',
    name: 'Detect Magic',
    school: 'divination',
    level: 1,
    classes: ['artificer', 'bard', 'cleric', 'druid', 'paladin', 'ranger', 'sorcerer', 'wizard'],
    ritual: true,
    concentration: true,
    source: 'PHB'
  },
  {
    id: 'guidingBolt',
    name: 'Guiding Bolt',
    school: 'evocation',
    level: 1,
    classes: ['cleric'],
    source: 'PHB'
  },
  {
    id: 'sleep',
    name: 'Sleep',
    school: 'enchantment',
    level: 1,
    classes: ['bard', 'sorcerer', 'wizard'],
    source: 'PHB'
  },
  {
    id: 'charmPerson',
    name: 'Charm Person',
    school: 'enchantment',
    level: 1,
    classes: ['bard', 'druid', 'sorcerer', 'warlock', 'wizard'],
    source: 'PHB'
  },
  {
    id: 'protectionFromEvil',
    name: 'Protection from Evil and Good',
    school: 'abjuration',
    level: 1,
    classes: ['cleric', 'paladin', 'warlock', 'wizard'],
    concentration: true,
    source: 'PHB'
  },
  {
    id: 'bless',
    name: 'Bless',
    school: 'enchantment',
    level: 1,
    classes: ['cleric', 'paladin'],
    concentration: true,
    source: 'PHB'
  },
  {
    id: 'featherFall',
    name: 'Feather Fall',
    school: 'transmutation',
    level: 1,
    classes: ['artificer', 'bard', 'sorcerer', 'wizard'],
    source: 'PHB'
  },
  {
    id: 'identify',
    name: 'Identify',
    school: 'divination',
    level: 1,
    classes: ['artificer', 'bard', 'wizard'],
    ritual: true,
    source: 'PHB'
  },
  // ═══════════════════════════════════════════════════════════════
  // 2nd Level
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'mistyStep',
    name: 'Misty Step',
    school: 'conjuration',
    level: 2,
    classes: ['sorcerer', 'warlock', 'wizard'],
    source: 'PHB'
  },
  {
    id: 'spiritualWeapon',
    name: 'Spiritual Weapon',
    school: 'evocation',
    level: 2,
    classes: ['cleric'],
    source: 'PHB'
  },
  {
    id: 'holdPerson',
    name: 'Hold Person',
    school: 'enchantment',
    level: 2,
    classes: ['bard', 'cleric', 'druid', 'sorcerer', 'warlock', 'wizard'],
    concentration: true,
    source: 'PHB'
  },
  {
    id: 'scorchingRay',
    name: 'Scorching Ray',
    school: 'evocation',
    level: 2,
    classes: ['sorcerer', 'wizard'],
    source: 'PHB'
  },
  {
    id: 'web',
    name: 'Web',
    school: 'conjuration',
    level: 2,
    classes: ['artificer', 'sorcerer', 'wizard'],
    concentration: true,
    source: 'PHB'
  },
  {
    id: 'invisibility',
    name: 'Invisibility',
    school: 'illusion',
    level: 2,
    classes: ['artificer', 'bard', 'sorcerer', 'warlock', 'wizard'],
    concentration: true,
    source: 'PHB'
  },
  {
    id: 'silence',
    name: 'Silence',
    school: 'illusion',
    level: 2,
    classes: ['bard', 'cleric', 'ranger'],
    ritual: true,
    concentration: true,
    source: 'PHB'
  },
  {
    id: 'lesserRestoration',
    name: 'Lesser Restoration',
    school: 'abjuration',
    level: 2,
    classes: ['artificer', 'bard', 'cleric', 'druid', 'paladin', 'ranger'],
    source: 'PHB'
  },
  {
    id: 'fireball',
    name: 'Fireball',
    school: 'evocation',
    level: 3,
    classes: ['sorcerer', 'wizard'],
    source: 'PHB'
  },
  {
    id: 'counterspell',
    name: 'Counterspell',
    school: 'abjuration',
    level: 3,
    classes: ['sorcerer', 'warlock', 'wizard'],
    source: 'PHB'
  },
  {
    id: 'spiritGuardians',
    name: 'Spirit Guardians',
    school: 'conjuration',
    level: 3,
    classes: ['cleric'],
    concentration: true,
    source: 'PHB'
  },
  {
    id: 'revivify',
    name: 'Revivify',
    school: 'necromancy',
    level: 3,
    classes: ['artificer', 'cleric', 'paladin'],
    source: 'PHB'
  },
  {
    id: 'haste',
    name: 'Haste',
    school: 'transmutation',
    level: 3,
    classes: ['artificer', 'sorcerer', 'wizard'],
    concentration: true,
    source: 'PHB'
  },
  {
    id: 'lightningBolt',
    name: 'Lightning Bolt',
    school: 'evocation',
    level: 3,
    classes: ['sorcerer', 'wizard'],
    source: 'PHB'
  },
  {
    id: 'fly',
    name: 'Fly',
    school: 'transmutation',
    level: 3,
    classes: ['artificer', 'sorcerer', 'warlock', 'wizard'],
    concentration: true,
    source: 'PHB'
  },
  {
    id: 'dispelMagic',
    name: 'Dispel Magic',
    school: 'abjuration',
    level: 3,
    classes: ['artificer', 'bard', 'cleric', 'druid', 'paladin', 'sorcerer', 'warlock', 'wizard'],
    source: 'PHB'
  },
  {
    id: 'removeCurse',
    name: 'Remove Curse',
    school: 'abjuration',
    level: 3,
    classes: ['cleric', 'paladin', 'warlock', 'wizard'],
    source: 'PHB'
  },
  {
    id: 'slow',
    name: 'Slow',
    school: 'transmutation',
    level: 3,
    classes: ['sorcerer', 'wizard'],
    concentration: true,
    source: 'PHB'
  },

  // ═══════════════════════════════════════════════════════════════
  // 4th Level
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'dimensionDoor',
    name: 'Dimension Door',
    school: 'conjuration',
    level: 4,
    classes: ['bard', 'sorcerer', 'warlock', 'wizard'],
    source: 'PHB'
  },
  {
    id: 'banishment',
    name: 'Banishment',
    school: 'abjuration',
    level: 4,
    classes: ['cleric', 'paladin', 'sorcerer', 'warlock', 'wizard'],
    concentration: true,
    source: 'PHB'
  },
  {
    id: 'polymorph',
    name: 'Polymorph',
    school: 'transmutation',
    level: 4,
    classes: ['bard', 'druid', 'sorcerer', 'wizard'],
    concentration: true,
    source: 'PHB'
  },
  {
    id: 'iceStorm',
    name: 'Ice Storm',
    school: 'evocation',
    level: 4,
    classes: ['druid', 'sorcerer', 'wizard'],
    source: 'PHB'
  },
  {
    id: 'wallOfForce',
    name: 'Wall of Force',
    school: 'evocation',
    level: 5,
    classes: ['wizard'],
    concentration: true,
    source: 'PHB'
  },
  {
    id: 'greaterRestoration',
    name: 'Greater Restoration',
    school: 'abjuration',
    level: 5,
    classes: ['artificer', 'bard', 'cleric', 'druid'],
    source: 'PHB'
  },
  {
    id: 'raiseDead',
    name: 'Raise Dead',
    school: 'necromancy',
    level: 5,
    classes: ['bard', 'cleric', 'paladin'],
    source: 'PHB'
  },
  {
    id: 'chainLightning',
    name: 'Chain Lightning',
    school: 'evocation',
    level: 6,
    classes: ['sorcerer', 'wizard'],
    source: 'PHB'
  },
  {
    id: 'disintegrate',
    name: 'Disintegrate',
    school: 'transmutation',
    level: 6,
    classes: ['sorcerer', 'wizard'],
    source: 'PHB'
  },
  {
    id: 'teleport',
    name: 'Teleport',
    school: 'conjuration',
    level: 7,
    classes: ['bard', 'sorcerer', 'wizard'],
    source: 'PHB'
  },
  {
    id: 'resurrection',
    name: 'Resurrection',
    school: 'necromancy',
    level: 7,
    classes: ['bard', 'cleric'],
    source: 'PHB'
  },
  {
    id: 'powerWordStun',
    name: 'Power Word Stun',
    school: 'enchantment',
    level: 8,
    classes: ['bard', 'sorcerer', 'warlock', 'wizard'],
    source: 'PHB'
  },
  {
    id: 'wish',
    name: 'Wish',
    school: 'conjuration',
    level: 9,
    classes: ['sorcerer', 'wizard'],
    source: 'PHB'
  },
  {
    id: 'powerWordKill',
    name: 'Power Word Kill',
    school: 'enchantment',
    level: 9,
    classes: ['bard', 'sorcerer', 'warlock', 'wizard'],
    source: 'PHB'
  }
] as const