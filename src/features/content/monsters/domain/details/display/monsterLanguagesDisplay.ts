import type { Monster } from '@/features/content/monsters/domain/types';
import { humanizeKebabCase } from '@/features/content/monsters/domain/details/display/monsterDisplayFormatUtils';

function formatLanguageId(id: string): string {
  return humanizeKebabCase(id);
}

function formatMonsterLanguageEntry(l: NonNullable<Monster['languages']>[number]): string {
  const name = formatLanguageId(l.id);
  if (l.speaks === false) {
    return `${name} (understands, but can't speak)`;
  }
  return name;
}

/**
 * Comma-separated language labels (ids resolved to title case; extend with catalog later if needed).
 * When `speaks: false`, appends a understands-but-can’t-speak rider (e.g. some undead).
 */
export function formatMonsterLanguagesLine(languages: Monster['languages']): string {
  if (!languages?.length) return '—';

  return languages.map((l) => formatMonsterLanguageEntry(l)).join(', ');
}
