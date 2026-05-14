import type { Coin } from '@/shared/money/types';
import type {
  SpellCastingTime,
  SpellComponents,
  SpellDuration,
  SpellRange,
} from '@/features/content/spells/domain/types';
import type { CastingTimeUnit } from '@/features/content/spells/domain/types';
import type { TimeUnit } from '@/shared/domain/time';
import type { SpellFormValues } from '../types/spellForm.types';
import {
  SPELL_FORM_DEFAULT_CASTING_TIME,
  SPELL_FORM_DEFAULT_COMPONENTS,
  SPELL_FORM_DEFAULT_DURATION,
  SPELL_FORM_DEFAULT_RANGE,
} from '../spellForm.defaults';
import { SPELL_CASTING_TIME_DURATION_UNIT_IDS } from '@/shared/domain/time/time.definitions';

const isLongCastUnit = (u: string): boolean =>
  (SPELL_CASTING_TIME_DURATION_UNIT_IDS as readonly string[]).includes(u);

function parsePositiveNumber(s: string, fallback: number): number {
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export function buildDescriptionFromForm(v: SpellFormValues): { full: string; summary: string } {
  return {
    full: typeof v.descriptionFull === 'string' ? v.descriptionFull : '',
    summary: typeof v.descriptionSummary === 'string' ? v.descriptionSummary : '',
  };
}

export function splitDescriptionToForm(d: { full: string; summary: string }): Pick<
  SpellFormValues,
  'descriptionFull' | 'descriptionSummary'
> {
  return {
    descriptionFull: d.full ?? '',
    descriptionSummary: d.summary ?? '',
  };
}

export function buildCastingTimeFromForm(v: SpellFormValues): SpellCastingTime {
  const unit = (v.castingTimeUnit || 'action') as CastingTimeUnit;
  const value = isLongCastUnit(unit)
    ? Math.max(1, Math.floor(parsePositiveNumber(v.castingTimeValue, 1)))
    : 1;
  const trigger =
    unit === 'reaction' && typeof v.castingTimeTrigger === 'string' && v.castingTimeTrigger
      ? v.castingTimeTrigger
      : undefined;
  return {
    normal: {
      value,
      unit,
      ...(trigger !== undefined && { trigger }),
    },
    canBeCastAsRitual: Boolean(v.castingTimeCanRitual),
  };
}

export function splitCastingTimeToForm(ct: SpellCastingTime): Pick<
  SpellFormValues,
  'castingTimeUnit' | 'castingTimeValue' | 'castingTimeCanRitual' | 'castingTimeTrigger'
> {
  const u = ct.normal?.unit ?? SPELL_FORM_DEFAULT_CASTING_TIME.normal.unit;
  const trigger = ct.normal?.unit === 'reaction' ? (ct.normal.trigger ?? '') : '';
  return {
    castingTimeUnit: String(u),
    castingTimeValue: isLongCastUnit(String(u)) ? String(ct.normal?.value ?? 1) : '1',
    castingTimeCanRitual: ct.canBeCastAsRitual,
    castingTimeTrigger: trigger,
  };
}

export function buildDurationFromForm(v: SpellFormValues): SpellDuration {
  const kind = v.durationKind || 'instantaneous';
  switch (kind) {
    case 'instantaneous':
      return { kind: 'instantaneous' };
    case 'timed': {
      const value = Math.max(0, parsePositiveNumber(v.durationTimedValue, 1));
      const unit = (v.durationTimedUnit || 'minute') as TimeUnit;
      return {
        kind: 'timed',
        value,
        unit,
        ...(v.durationTimedUpTo && { upTo: true }),
        ...(v.durationConcentration && { concentration: true }),
      };
    }
    case 'special':
      return {
        kind: 'special',
        description: v.durationSpecialText ?? '',
        ...(v.durationConcentration && { concentration: true }),
      };
    case 'until-dispelled':
      return {
        kind: 'until-dispelled',
        ...(v.durationConcentration && { concentration: true }),
      };
    case 'until-triggered':
      return {
        kind: 'until-triggered',
        description: v.durationUntilTriggeredText ?? '',
        ...(v.durationConcentration && { concentration: true }),
      };
    case 'until-turn-boundary':
      return {
        kind: 'until-turn-boundary',
        subject: (v.durationTurnBoundarySubject as 'self' | 'source' | 'target') ?? 'self',
        turn: (v.durationTurnBoundaryTurn as 'current' | 'next') ?? 'current',
        boundary: (v.durationTurnBoundaryBoundary as 'start' | 'end') ?? 'end',
        ...(v.durationConcentration && { concentration: true }),
      };
    default:
      return { ...SPELL_FORM_DEFAULT_DURATION };
  }
}

export function splitDurationToForm(d: SpellDuration): Pick<
  SpellFormValues,
  | 'durationKind'
  | 'durationTimedValue'
  | 'durationTimedUnit'
  | 'durationTimedUpTo'
  | 'durationConcentration'
  | 'durationSpecialText'
  | 'durationUntilTriggeredText'
  | 'durationTurnBoundarySubject'
  | 'durationTurnBoundaryTurn'
  | 'durationTurnBoundaryBoundary'
> {
  const base = {
    durationKind: d.kind,
    durationTimedValue: '1',
    durationTimedUnit: 'minute',
    durationTimedUpTo: false,
    durationConcentration: false,
    durationSpecialText: '',
    durationUntilTriggeredText: '',
    durationTurnBoundarySubject: 'self',
    durationTurnBoundaryTurn: 'current',
    durationTurnBoundaryBoundary: 'end',
  };
  const conc = 'concentration' in d ? Boolean(d.concentration) : false;
  if (d.kind === 'timed') {
    return {
      ...base,
      durationTimedValue: String(d.value),
      durationTimedUnit: d.unit,
      durationTimedUpTo: Boolean(d.upTo),
      durationConcentration: conc,
    };
  }
  if (d.kind === 'special') {
    return {
      ...base,
      durationSpecialText: d.description,
      durationConcentration: conc,
    };
  }
  if (d.kind === 'until-dispelled') {
    return {
      ...base,
      durationConcentration: conc,
    };
  }
  if (d.kind === 'until-triggered') {
    return {
      ...base,
      durationUntilTriggeredText: d.description ?? '',
      durationConcentration: conc,
    };
  }
  if (d.kind === 'until-turn-boundary') {
    return {
      ...base,
      durationTurnBoundarySubject: d.subject,
      durationTurnBoundaryTurn: d.turn,
      durationTurnBoundaryBoundary: d.boundary,
      durationConcentration: conc,
    };
  }
  return base;
}

export function buildRangeFromForm(v: SpellFormValues): SpellRange {
  const kind = (v.rangeKind || 'self') as SpellRange['kind'];
  switch (kind) {
    case 'self':
    case 'touch':
    case 'sight':
    case 'unlimited':
      return { kind };
    case 'distance': {
      const value = parsePositiveNumber(v.rangeDistanceValue, 30);
      const unit = v.rangeDistanceUnit === 'mi' ? 'mi' : 'ft';
      return { kind: 'distance', value: { value, unit } };
    }
    case 'special':
      return { kind: 'special', description: v.rangeSpecialDescription ?? '' };
    default:
      return { ...SPELL_FORM_DEFAULT_RANGE };
  }
}

export function splitRangeToForm(r: SpellRange): Pick<
  SpellFormValues,
  'rangeKind' | 'rangeDistanceValue' | 'rangeDistanceUnit' | 'rangeSpecialDescription'
> {
  if (r.kind === 'distance') {
    return {
      rangeKind: 'distance',
      rangeDistanceValue: String(r.value.value),
      rangeDistanceUnit: r.value.unit,
      rangeSpecialDescription: '',
    };
  }
  if (r.kind === 'special') {
    return {
      rangeKind: 'special',
      rangeDistanceValue: '30',
      rangeDistanceUnit: 'ft',
      rangeSpecialDescription: r.description,
    };
  }
  return {
    rangeKind: r.kind,
    rangeDistanceValue: '30',
    rangeDistanceUnit: 'ft',
    rangeSpecialDescription: '',
  };
}

function parseCoin(u: string): Coin {
  if (u === 'cp' || u === 'sp' || u === 'ep' || u === 'gp' || u === 'pp') return u;
  return 'gp';
}

export function buildComponentsFromForm(v: SpellFormValues): SpellComponents {
  const ids = Array.isArray(v.componentIds) ? v.componentIds : [];
  const out: SpellComponents = {};
  if (ids.includes('verbal')) out.verbal = true;
  if (ids.includes('somatic')) out.somatic = true;
  if (ids.includes('material')) {
    const desc = (v.materialDescription ?? '').trim();
    const costVal = parsePositiveNumber(v.materialCostValue, 0);
    const costUnit = parseCoin(v.materialCostUnit || 'gp');
    out.material = {
      description: desc.length > 0 ? desc : 'Material component',
      ...(costVal > 0 && {
        cost: { value: costVal, unit: costUnit, atLeast: true },
      }),
      ...(v.materialConsumed && { consumed: true }),
    };
  }
  return Object.keys(out).length > 0 ? out : { ...SPELL_FORM_DEFAULT_COMPONENTS };
}

export function splitComponentsToForm(c: SpellComponents): Pick<
  SpellFormValues,
  | 'componentIds'
  | 'materialDescription'
  | 'materialCostValue'
  | 'materialCostUnit'
  | 'materialConsumed'
> {
  const ids: string[] = [];
  if (c.verbal) ids.push('verbal');
  if (c.somatic) ids.push('somatic');
  if (c.material) ids.push('material');
  const m = c.material;
  return {
    componentIds: ids,
    materialDescription: m?.description ?? '',
    materialCostValue: m?.cost != null ? String(m.cost.value) : '',
    materialCostUnit: m?.cost?.unit ?? 'gp',
    materialConsumed: Boolean(m?.consumed),
  };
}
