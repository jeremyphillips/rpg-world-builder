import type {
  SpellCastingTime,
  SpellCastingTimeMode,
} from '@/features/content/spells/domain/types/spell.types';

export function formatCastingTimeMode(mode: SpellCastingTimeMode): string {
  const { value, unit, trigger, label } = mode;
  let s: string;
  switch (unit) {
    case 'action':
      s = `${value} ${value === 1 ? 'action' : 'actions'}`;
      break;
    case 'bonus-action':
      s = `${value} ${value === 1 ? 'bonus action' : 'bonus actions'}`;
      break;
    case 'reaction':
      s = `${value} ${value === 1 ? 'reaction' : 'reactions'}`;
      break;
    case 'special':
      s = value === 1 ? 'Special' : `${value} special`;
      break;
    case 'minute':
      s = `${value} ${value === 1 ? 'minute' : 'minutes'}`;
      break;
    case 'hour':
      s = `${value} ${value === 1 ? 'hour' : 'hours'}`;
      break;
    default: {
      const _exhaustive: never = unit;
      return _exhaustive;
    }
  }
  if (unit === 'reaction' && trigger?.trim()) {
    s += ` (${trigger.trim()})`;
  }
  if (label?.trim()) {
    s = `${label.trim()}: ${s}`;
  }
  return s;
}

/**
 * Human-readable casting time: primary mode first, then alternates (multi-mode spells only).
 */
export function formatSpellCastingTimeDisplay(spell: { castingTime: SpellCastingTime }): string {
  const ct = spell.castingTime;
  const parts: string[] = [formatCastingTimeMode(ct.normal)];
  if (ct.alternate) {
    for (const m of ct.alternate) {
      parts.push(formatCastingTimeMode(m));
    }
  }
  return parts.join('; ') || '—';
}
