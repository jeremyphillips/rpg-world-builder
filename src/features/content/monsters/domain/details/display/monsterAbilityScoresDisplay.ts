import { ABILITIES } from '@/features/mechanics/domain/character';
import type { MonsterAbilityScoreMap } from '@/features/mechanics/domain/character';
import { abilityIdToAbbrev } from '@/features/mechanics/domain/character';

/**
 * Compact stat-block style line: `STR 21 · DEX 9 · …`
 */
export function formatMonsterAbilityScoresLine(
  abilities: MonsterAbilityScoreMap | undefined,
): string {
  if (!abilities) return '—';

  const parts: string[] = [];
  for (const a of ABILITIES) {
    const v = abilities[a.id];
    if (v != null) {
      parts.push(`${abilityIdToAbbrev(a.id)} ${v}`);
    }
  }

  return parts.length > 0 ? parts.join(' · ') : '—';
}
