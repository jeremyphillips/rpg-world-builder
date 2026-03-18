import type { DiceOrFlat, dY } from '@/features/mechanics/domain/dice';
import type { CreatureTypeCondition } from '@/features/mechanics/domain/conditions/condition.types';

export const EXTRAPLANAR_CREATURE_TYPES: CreatureTypeCondition = {
  kind: 'creature-type',
  target: 'source',
  creatureTypes: ['aberration', 'celestial', 'elemental', 'fey', 'fiend', 'undead'],
};

/** Standard cantrip damage upgrade thresholds (levels 5, 11, 17). */
export function cantripDamageScaling(die: dY) {
  return {
    thresholds: [
      { level: 5, damage: `2${die}` as DiceOrFlat },
      { level: 11, damage: `3${die}` as DiceOrFlat },
      { level: 17, damage: `4${die}` as DiceOrFlat },
    ],
  };
}

// ---------------------------------------------------------------------------
// Legacy ID → canonical kebab-case ID mapping (for migration scripts)
// ---------------------------------------------------------------------------

export const LEGACY_SPELL_ID_MAP: Record<string, string> = {
  fireBolt: 'fire-bolt',
  eldritchBlast: 'eldritch-blast',
  sacredFlame: 'sacred-flame',
  mageHand: 'mage-hand',
  magicMissile: 'magic-missile',
  cureWounds: 'cure-wounds',
  healingWord: 'healing-word',
  detectMagic: 'detect-magic',
  guidingBolt: 'guiding-bolt',
  charmPerson: 'charm-person',
  protectionFromEvil: 'protection-from-evil',
  featherFall: 'feather-fall',
  mistyStep: 'misty-step',
  spiritualWeapon: 'spiritual-weapon',
  holdPerson: 'hold-person',
  scorchingRay: 'scorching-ray',
  lesserRestoration: 'lesser-restoration',
  spiritGuardians: 'spirit-guardians',
  lightningBolt: 'lightning-bolt',
  dispelMagic: 'dispel-magic',
  removeCurse: 'remove-curse',
  dimensionDoor: 'dimension-door',
  iceStorm: 'ice-storm',
  wallOfForce: 'wall-of-force',
  greaterRestoration: 'greater-restoration',
  raiseDead: 'raise-dead',
  chainLightning: 'chain-lightning',
  powerWordStun: 'power-word-stun',
  powerWordKill: 'power-word-kill',
};
