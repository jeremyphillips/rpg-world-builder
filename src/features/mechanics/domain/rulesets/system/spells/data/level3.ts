import type { SpellEntry } from '../types';
import { SPELLS_LEVEL_3_A_L } from './level3-a-l';
import { SPELLS_LEVEL_3_M_Z } from './level3-m-z';

export const SPELLS_LEVEL_3: readonly SpellEntry[] = [
  ...SPELLS_LEVEL_3_A_L,
  ...SPELLS_LEVEL_3_M_Z,
];
