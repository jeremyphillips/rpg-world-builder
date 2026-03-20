import type { SpellEntry } from '../types';
import { SPELLS_LEVEL_5_A_L } from './level5-a-l';
import { SPELLS_LEVEL_5_M_Z } from './level5-m-z';

/** Level 5 catalog = `level5-a-l` + `level5-m-z`; see those files for authoring notes. */
export const SPELLS_LEVEL_5: readonly SpellEntry[] = [
  ...SPELLS_LEVEL_5_A_L,
  ...SPELLS_LEVEL_5_M_Z,
];
