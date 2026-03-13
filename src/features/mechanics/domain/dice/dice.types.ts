import { DIE_FACES } from "./dice.constants";

export type DieFace = (typeof DIE_FACES)[number];
export type dY = `d${DieFace}`;
export type XdY = `${number}d${DieFace}`;
export type FlatDamage = number;
export type DieModifierString = `${'+' | '-'}${number}`
export type XdYWithModifier = `${number}d${DieFace}${DieModifierString}`;

export type DiceOrFlat = XdY | FlatDamage | XdYWithModifier;
