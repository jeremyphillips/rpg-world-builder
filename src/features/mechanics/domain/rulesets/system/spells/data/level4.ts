import type { SpellEntry } from '../types';
import { SPELLS_LEVEL_4_A_L } from './level4-a-l';
import { SPELLS_LEVEL_4_M_Z } from './level4-m-z';

export const SPELLS_LEVEL_4: readonly SpellEntry[] = [
  ...SPELLS_LEVEL_4_A_L,
  ...SPELLS_LEVEL_4_M_Z,
];
