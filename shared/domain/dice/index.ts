export {
  DIE_FACE_DEFINITIONS,
  DIE_FACE_OPTIONS,
  DIE_FACES,
  type DieFace,
  type DieFaceDefinition,
} from './dice.definitions';

export type {
  DiceOrFlat,
  DieModifierString,
  FlatDamage,
  FlatDamageString,
  XdY,
  XdYWithModifier,
  dY,
} from './dice.types';

export {
  buildXdY,
  parseXdY,
  toCount,
  toCountOrZero,
  toDieFace,
  type ParseXdYOptions,
  type ParsedXdY,
} from './dice.parse';
