/**
 * Backward-compatible re-export of system races.
 *
 * New code should import from:
 *   - `@/features/mechanics/domain/core/rules/systemCatalog.races`
 *   - or use `systemCatalog.racesById` from `systemCatalog.ts`
 */
import { getSystemRaces } from '@/features/mechanics/domain/core/rules/systemCatalog.races';
import type { Race } from '@/features/content/domain/types';

export const races: readonly Race[] = getSystemRaces('5e_v1');
