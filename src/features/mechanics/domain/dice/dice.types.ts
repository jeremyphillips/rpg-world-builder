import { DIE_FACES } from "./dice.constants";

export type DieFace = (typeof DIE_FACES)[number];
export type dY = `d${DieFace}`;
export type XdY = `${dY}d${DieFace}`;
export type FlatDamage = number;
export type XdYWithModifier = `${number}d${DieFace}${'+' | '-'}${number}`;

export type DiceOrFlat = XdY | FlatDamage | XdYWithModifier;
