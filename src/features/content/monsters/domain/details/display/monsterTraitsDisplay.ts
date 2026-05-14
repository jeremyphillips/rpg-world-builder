import type { MonsterTrait } from '@/features/content/monsters/domain/types/monster-traits.types';

/**
 * Compact preview of trait names (for dense summaries). Prefer section UI for full text.
 */
export function formatMonsterTraitNamesLine(traits: MonsterTrait[] | undefined): string {
  if (!traits?.length) return '—';
  return traits.map((t) => t.name).join(', ');
}
