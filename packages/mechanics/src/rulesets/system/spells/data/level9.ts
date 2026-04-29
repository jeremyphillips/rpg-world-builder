import type { SpellEntry } from '../types';
import { SPELLS_LEVEL_9_A_L } from './level9-a-l';
import { SPELLS_LEVEL_9_M_Z } from './level9-m-z';
/** Level 9 catalog = `level9-a-l` + `level9-m-z`; see those files for authoring notes. */
export const SPELLS_LEVEL_9: readonly SpellEntry[] = [
    ...SPELLS_LEVEL_9_A_L,
    ...SPELLS_LEVEL_9_M_Z,
];
