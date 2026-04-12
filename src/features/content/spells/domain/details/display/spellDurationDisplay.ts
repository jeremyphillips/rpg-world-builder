import type {
  SpellDuration,
  TimedDuration,
  TurnBoundarySpellDuration,
} from '@/features/content/spells/domain/types/spell.types';
import type { TimeUnit } from '@/shared/time';
import { getSpellDurationKindName } from '@/features/content/spells/domain/vocab/spellDurationKinds.vocab';

export type SpellDurationPresentation = 'inline' | 'badge';

function formatSpellTimeAmount(value: number, unit: TimeUnit): string {
  const unitLabel =
    unit === 'minute'
      ? value === 1
        ? 'minute'
        : 'minutes'
      : unit === 'hour'
        ? value === 1
          ? 'hour'
          : 'hours'
        : value === 1
          ? 'day'
          : 'days';
  return `${value} ${unitLabel}`;
}

function formatTimed(d: TimedDuration, presentation: SpellDurationPresentation): string {
  const time = formatSpellTimeAmount(d.value, d.unit);
  if (!d.concentration) return time;
  if (presentation === 'badge') {
    return d.upTo ? `Up to ${time}` : time;
  }
  if (d.upTo) {
    return `Concentration, up to ${time}`;
  }
  return `Concentration, ${time}`;
}

function formatTurnBoundary(
  d: TurnBoundarySpellDuration,
  presentation: SpellDurationPresentation,
): string {
  const boundaryPhrase = d.boundary === 'start' ? 'start' : 'end';
  const possessive =
    d.subject === 'self'
      ? 'your'
      : d.subject === 'source'
        ? "the caster's"
        : "the target's";
  const turnPhrase = d.turn === 'next' ? ' next' : '';
  const core = `Until the ${boundaryPhrase} of ${possessive}${turnPhrase} turn`;
  if (!d.concentration) return core;
  if (presentation === 'badge') return core;
  return `Concentration, ${core.charAt(0).toLowerCase()}${core.slice(1)}`;
}

/** True when the spell’s duration entry requires the caster to concentrate. */
export function spellDurationRequiresConcentration(duration: SpellDuration): boolean {
  if (duration.kind === 'instantaneous') return false;
  return 'concentration' in duration && duration.concentration === true;
}

export function formatSpellDuration(
  duration: SpellDuration,
  presentation: SpellDurationPresentation = 'inline',
): string {
  switch (duration.kind) {
    case 'instantaneous':
      return getSpellDurationKindName('instantaneous');
    case 'timed':
      return formatTimed(duration, presentation);
    case 'until-turn-boundary':
      return formatTurnBoundary(duration, presentation);
    case 'until-dispelled':
      if (duration.concentration && presentation === 'badge') {
        return getSpellDurationKindName('until-dispelled');
      }
      return duration.concentration
        ? `Concentration, ${getSpellDurationKindName('until-dispelled').toLowerCase()}`
        : getSpellDurationKindName('until-dispelled');
    case 'until-triggered': {
      const desc = duration.description?.trim();
      if (presentation === 'badge') {
        if (duration.concentration && desc) return desc;
        if (duration.concentration) return getSpellDurationKindName('until-triggered');
        if (desc) return desc;
        return getSpellDurationKindName('until-triggered');
      }
      if (duration.concentration && desc) {
        return `Concentration, ${desc}`;
      }
      if (duration.concentration) {
        return `Concentration, ${getSpellDurationKindName('until-triggered').toLowerCase()}`;
      }
      if (desc) return desc;
      return getSpellDurationKindName('until-triggered');
    }
    case 'special': {
      const desc = duration.description.trim();
      if (presentation === 'badge') {
        if (duration.concentration && desc) return desc;
        if (duration.concentration) return getSpellDurationKindName('special');
        return desc || getSpellDurationKindName('special');
      }
      if (duration.concentration && desc) {
        return `Concentration, ${desc}`;
      }
      if (duration.concentration) {
        return `Concentration, ${getSpellDurationKindName('special').toLowerCase()}`;
      }
      return desc || getSpellDurationKindName('special');
    }
    default: {
      const _exhaustive: never = duration;
      return _exhaustive;
    }
  }
}

export function formatSpellDurationDisplay(spell: { duration: SpellDuration }): string {
  return formatSpellDuration(spell.duration, 'inline');
}
