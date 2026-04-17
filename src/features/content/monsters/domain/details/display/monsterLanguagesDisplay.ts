import type { Monster } from '@/features/content/monsters/domain/types';
import { humanizeKebabCase } from '@/features/content/monsters/domain/details/display/monsterDisplayFormatUtils';

function formatLanguageId(id: string): string {
  return humanizeKebabCase(id);
}

/**
 * Comma-separated language labels (ids resolved to title case; extend with catalog later if needed).
 */
export function formatMonsterLanguagesLine(languages: Monster['languages']): string {
  if (!languages?.length) return '—';

  return languages.map((l) => formatLanguageId(l.id)).join(', ');
}
