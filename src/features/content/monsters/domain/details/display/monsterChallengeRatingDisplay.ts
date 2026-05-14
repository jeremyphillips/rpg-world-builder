import type { Monster } from '@/features/content/monsters/domain/types';
import { formatChallengeRatingDisplay } from '@/features/content/monsters/domain/list/challengeRatingDisplay';

/**
 * Stat-block style line: `1/4 (XP 50; PB +2)`.
 * PB comes from {@link Monster.mechanics.proficiencyBonus}.
 */
export function formatMonsterChallengeRatingLine(monster: Monster): string {
  const cr = monster.lore?.challengeRating;
  if (cr === undefined) return '—';

  const crLabel = formatChallengeRatingDisplay(cr);
  const xp = monster.lore?.xpValue;
  const pb = monster.mechanics?.proficiencyBonus;
  const tail: string[] = [];
  if (xp !== undefined) tail.push(`XP ${xp}`);
  if (pb !== undefined) tail.push(`PB +${pb}`);
  if (tail.length === 0) return crLabel;
  return `${crLabel} (${tail.join('; ')})`;
}
