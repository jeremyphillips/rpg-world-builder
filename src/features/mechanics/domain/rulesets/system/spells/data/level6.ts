import type { SpellEntry } from '../types';
import { SPELLS_LEVEL_6_A_L } from './level6-a-l';
import { SPELLS_LEVEL_6_M_Z } from './level6-m-z';

export const SPELLS_LEVEL_6: readonly SpellEntry[] = [
  ...SPELLS_LEVEL_6_A_L,
  ...SPELLS_LEVEL_6_M_Z,
];
