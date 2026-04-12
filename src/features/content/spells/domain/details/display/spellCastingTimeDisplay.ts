import type {
  SpellCastingTime,
  SpellCastingTimeMode,
} from '@/features/content/spells/domain/types/spell.types';

export function formatCastingTimeMode(mode: SpellCastingTimeMode): string {
  const { value, unit, trigger } = mode;
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
  return s;
}

/** True if the spell can be cast as a ritual (ritual flag on normal or any alternate mode). */
export function spellCastingTimeHasRitual(ct: SpellCastingTime): boolean {
  if (ct.normal.ritual) return true;
  return ct.alternate?.some((m) => m.ritual) ?? false;
}

/**
 * Human-readable casting time: primary mode first, then alternate modes.
 * When the spell has a ritual option, ritual-only alternate lines are omitted (use the ritual badge in the UI).
 */
export function formatSpellCastingTimeDisplay(spell: { castingTime: SpellCastingTime }): string {
  const ct = spell.castingTime;
  const omitRitualAlternates = spellCastingTimeHasRitual(ct);
  const parts: string[] = [formatCastingTimeMode(ct.normal)];
  if (ct.alternate) {
    for (const m of ct.alternate) {
      if (omitRitualAlternates && m.ritual) continue;
      parts.push(formatCastingTimeMode(m));
    }
  }
  return parts.join('; ') || '—';
}
