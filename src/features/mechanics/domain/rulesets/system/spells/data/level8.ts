import type { SpellEntry } from '../types';
import { SPELLS_LEVEL_8_A_L } from './level8-a-l';
import { SPELLS_LEVEL_8_M_Z } from './level8-m-z';

/** Level 8 catalog = `level8-a-l` + `level8-m-z`; see those files for authoring notes. */
export const SPELLS_LEVEL_8: readonly SpellEntry[] = [
  ...SPELLS_LEVEL_8_A_L,
  ...SPELLS_LEVEL_8_M_Z,
];
