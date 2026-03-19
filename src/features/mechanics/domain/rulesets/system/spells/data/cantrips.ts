import type { SpellEntry } from '../types';
import { SPELLS_LEVEL_0_A_L } from './cantrips-a-l';
import { SPELLS_LEVEL_0_M_Z } from './cantrips-m-z';

export const SPELLS_LEVEL_0: readonly SpellEntry[] = [
  ...SPELLS_LEVEL_0_A_L,
  ...SPELLS_LEVEL_0_M_Z,
];
