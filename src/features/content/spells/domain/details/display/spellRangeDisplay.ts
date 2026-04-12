import { getSpellRangeKindName } from '@/features/content/spells/domain/vocab/spellRange.vocab';
import type { SpellRange } from '@/features/content/spells/domain/types/spell.types';

export function formatSpellDistance(d: { value: number; unit: string }): string {
  if (d.unit === 'ft') return `${d.value} ft.`;
  if (d.unit === 'mi') return `${d.value} mi.`;
  return `${d.value} ${d.unit}`;
}

/**
 * Single line for `spell.range` (detail UI, combat display meta, etc.).
 * Fixed kinds use {@link SPELL_RANGE_KIND_OPTIONS}; `distance` uses feet/miles; `special` uses `description`.
 */
export function formatSpellRange(range: SpellRange): string {
  switch (range.kind) {
    case 'distance':
      return formatSpellDistance(range.value);
    case 'special':
      return range.description;
    case 'self':
    case 'touch':
    case 'sight':
    case 'unlimited':
      return getSpellRangeKindName(range.kind);
  }
}
