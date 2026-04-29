import { formatCreatureSensesLine } from '@/features/content/shared/domain/detail/display/creatureSenses.format';
import type { MonsterSenses } from '@/features/content/monsters/domain/types/monster-senses.types';

/**
 * Readable senses block: one entry per line (special senses, then passive Perception).
 * Delegates to shared {@link formatCreatureSensesLine}.
 */
export function formatMonsterSensesLine(senses: MonsterSenses | undefined): string {
  return formatCreatureSensesLine(senses);
}
