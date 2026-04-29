import type { DieFace } from './dice.definitions';

export type { DieFace } from './dice.definitions';

export type dY = `d${DieFace}`;
export type XdY = `${number}d${DieFace}`;
export type FlatDamage = number;
export type FlatDamageString = `${number}`;
export type DieModifierString = `${'+' | '-'}${number}`;
export type XdYWithModifier = `${number}d${DieFace}${DieModifierString}`;

export type DiceOrFlat = XdY | FlatDamage | FlatDamageString | XdYWithModifier | '-';
