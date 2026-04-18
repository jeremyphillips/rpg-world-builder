import { normalizeCreatureSenses } from '@/features/content/shared/domain/vocab/creatureSenses.selectors';
import { getCreatureSenseTypeDisplayName } from '@/features/content/shared/domain/vocab/creatureSenses.vocab';
import type { MonsterSense, MonsterSenses } from '@/features/content/monsters/domain/types/monster-senses.types';
import { humanizeKebabCase } from '@/features/content/monsters/domain/details/display/monsterDisplayFormatUtils';

function formatSenseLabel(type: MonsterSense['type']): string {
  return getCreatureSenseTypeDisplayName(type) ?? humanizeKebabCase(type);
}

function formatSenseEntry(sense: MonsterSense): string {
  const label = formatSenseLabel(sense.type);
  if (sense.range != null) {
    return `${label} ${sense.range} ft.${sense.notes ? ` ${sense.notes}` : ''}`;
  }
  if (sense.notes) {
    return `${label} (${sense.notes})`;
  }
  return label;
}

/**
 * Readable senses block: one entry per line (special senses, then passive Perception).
 */
export function formatMonsterSensesLine(senses: MonsterSenses | undefined): string {
  if (!senses) return '—';

  const normalized = normalizeCreatureSenses(senses);
  const parts: string[] = [];

  if (normalized.special.length) {
    for (const s of normalized.special) {
      parts.push(formatSenseEntry(s));
    }
  }

  if (normalized.passivePerception != null) {
    parts.push(`passive Perception ${normalized.passivePerception}`);
  }

  return parts.length > 0 ? parts.join('\n') : '—';
}
