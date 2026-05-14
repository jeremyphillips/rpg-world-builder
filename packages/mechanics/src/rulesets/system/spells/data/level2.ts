import type { SpellEntry } from '../types';
import { SPELLS_LEVEL_2_A_F } from './level2-a-f';
import { SPELLS_LEVEL_2_G_Z } from './level2-g-z';
/** Level 2 catalog = `level2-a-f` + `level2-g-z`; see those files for per-spell authoring notes. */
export const SPELLS_LEVEL_2: readonly SpellEntry[] = [
    ...SPELLS_LEVEL_2_A_F,
    ...SPELLS_LEVEL_2_G_Z,
];
