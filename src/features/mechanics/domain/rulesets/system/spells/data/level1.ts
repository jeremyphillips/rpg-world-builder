import type { SpellEntry } from '../types';
import { SPELLS_LEVEL_1_A_L } from './level1-a-l';
import { SPELLS_LEVEL_1_M_Z } from './level1-m-z';

export const SPELLS_LEVEL_1: readonly SpellEntry[] = [
  ...SPELLS_LEVEL_1_A_L,
  ...SPELLS_LEVEL_1_M_Z,
];
