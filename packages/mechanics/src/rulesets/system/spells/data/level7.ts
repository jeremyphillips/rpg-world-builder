import type { SpellEntry } from '../types';
import { SPELLS_LEVEL_7_A_L } from './level7-a-l';
import { SPELLS_LEVEL_7_M_Z } from './level7-m-z';
/** Level 7 catalog = `level7-a-l` + `level7-m-z`; see those files for authoring notes. */
export const SPELLS_LEVEL_7: readonly SpellEntry[] = [
    ...SPELLS_LEVEL_7_A_L,
    ...SPELLS_LEVEL_7_M_Z,
];
