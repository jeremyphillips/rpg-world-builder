/**
 * Read-path normalization: legacy campaign spell documents → canonical SpellBase-aligned payload.
 * Lossy cases (legacy string description, ritual/concentration flags only) are documented inline.
 */
import type { TimeUnit } from '../../../../../shared/domain/time';
import type {
  SpellCastingTime,
  SpellComponents,
  SpellDuration,
  SpellRange,
} from '../../../../../src/features/content/spells/domain/types/spell.types';
import {
  DEFAULT_SPELL_CASTING_TIME,
  DEFAULT_SPELL_COMPONENTS,
  DEFAULT_SPELL_DESCRIPTION,
  DEFAULT_SPELL_DURATION,
  DEFAULT_SPELL_RANGE,
} from './campaignSpell.defaults';

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

function parseDescription(raw: unknown): { full: string; summary: string } {
  if (typeof raw === 'string') {
    /** Legacy: entire string treated as long description; summary empty. */
    return { full: raw, summary: '' };
  }
  if (isPlainObject(raw)) {
    const full = typeof raw.full === 'string' ? raw.full : '';
    const summary = typeof raw.summary === 'string' ? raw.summary : '';
    return { full, summary };
  }
  return { ...DEFAULT_SPELL_DESCRIPTION };
}

function mergeRitualIntoCastingTime(
  ct: SpellCastingTime,
  legacyRitual: boolean | undefined,
): SpellCastingTime {
  if (!legacyRitual) return ct;
  return { ...ct, canBeCastAsRitual: true };
}

/**
 * Legacy `concentration: true` with no duration object: lossy default — 1 minute, concentrated.
 */
function legacyConcentrationDuration(): SpellDuration {
  return {
    kind: 'timed',
    value: 1,
    unit: 'minute',
    concentration: true,
  };
}

function parseCastingTime(raw: unknown, legacyRitual: boolean | undefined): SpellCastingTime {
  if (!isPlainObject(raw)) {
    return mergeRitualIntoCastingTime({ ...DEFAULT_SPELL_CASTING_TIME }, legacyRitual);
  }
  const canBeCastAsRitual =
    typeof raw.canBeCastAsRitual === 'boolean'
      ? raw.canBeCastAsRitual
      : DEFAULT_SPELL_CASTING_TIME.canBeCastAsRitual;
  const normal = raw.normal;
  if (!isPlainObject(normal)) {
    return mergeRitualIntoCastingTime(
      { ...DEFAULT_SPELL_CASTING_TIME, canBeCastAsRitual },
      legacyRitual,
    );
  }
  const value = typeof normal.value === 'number' && Number.isFinite(normal.value) ? normal.value : 1;
  const unit =
    typeof normal.unit === 'string' ? (normal.unit as SpellCastingTime['normal']['unit']) : 'action';
  const trigger = typeof normal.trigger === 'string' ? normal.trigger : undefined;
  const label = typeof normal.label === 'string' ? normal.label : undefined;
  const mode: SpellCastingTime['normal'] = { value, unit, ...(trigger !== undefined && { trigger }), ...(label !== undefined && { label }) };
  let alternate: SpellCastingTime['alternate'];
  if (Array.isArray(raw.alternate)) {
    alternate = raw.alternate as SpellCastingTime['alternate'];
  }
  return mergeRitualIntoCastingTime(
    {
      normal: mode,
      canBeCastAsRitual,
      ...(alternate !== undefined && { alternate }),
    },
    legacyRitual,
  );
}

function parseRange(raw: unknown): SpellRange {
  if (!isPlainObject(raw) || typeof raw.kind !== 'string') {
    return { ...DEFAULT_SPELL_RANGE };
  }
  const kind = raw.kind as SpellRange['kind'];
  switch (kind) {
    case 'self':
    case 'touch':
    case 'sight':
    case 'unlimited':
      return { kind };
    case 'distance': {
      const value = raw.value;
      if (!isPlainObject(value)) return { kind: 'distance', value: { value: 30, unit: 'ft' } };
      const n = typeof value.value === 'number' && Number.isFinite(value.value) ? value.value : 30;
      const unit = value.unit === 'mi' || value.unit === 'ft' ? value.unit : 'ft';
      return { kind: 'distance', value: { value: n, unit } };
    }
    case 'special': {
      const desc = typeof raw.description === 'string' ? raw.description : '';
      return { kind: 'special', description: desc };
    }
    default:
      return { ...DEFAULT_SPELL_RANGE };
  }
}

function parseDuration(raw: unknown, legacyConcentration: boolean | undefined): SpellDuration {
  if (!isPlainObject(raw) || typeof raw.kind !== 'string') {
    if (legacyConcentration) return legacyConcentrationDuration();
    return { ...DEFAULT_SPELL_DURATION };
  }
  const k = raw.kind as SpellDuration['kind'];
  switch (k) {
    case 'instantaneous':
      return { kind: 'instantaneous' };
    case 'timed': {
      const value = typeof raw.value === 'number' && Number.isFinite(raw.value) ? raw.value : 1;
      const unit = (typeof raw.unit === 'string' ? raw.unit : 'minute') as TimeUnit;
      const concentration =
        typeof raw.concentration === 'boolean' ? raw.concentration : legacyConcentration;
      const upTo = typeof raw.upTo === 'boolean' ? raw.upTo : undefined;
      return {
        kind: 'timed',
        value,
        unit,
        ...(concentration !== undefined && { concentration }),
        ...(upTo !== undefined && { upTo }),
      };
    }
    case 'until-dispelled':
      return {
        kind: 'until-dispelled',
        ...(typeof raw.concentration === 'boolean' && { concentration: raw.concentration }),
      };
    case 'until-triggered':
      return {
        kind: 'until-triggered',
        ...(typeof raw.concentration === 'boolean' && { concentration: raw.concentration }),
        ...(typeof raw.description === 'string' && { description: raw.description }),
      };
    case 'special':
      return {
        kind: 'special',
        description: typeof raw.description === 'string' ? raw.description : '',
        ...(typeof raw.concentration === 'boolean' && { concentration: raw.concentration }),
      };
    case 'until-turn-boundary':
      return raw as SpellDuration;
    default:
      if (legacyConcentration) return legacyConcentrationDuration();
      return { ...DEFAULT_SPELL_DURATION };
  }
}

function parseComponents(raw: unknown): SpellComponents {
  if (!isPlainObject(raw)) return { ...DEFAULT_SPELL_COMPONENTS };
  const out: SpellComponents = {};
  if (raw.verbal === true) out.verbal = true;
  if (raw.somatic === true) out.somatic = true;
  if (isPlainObject(raw.material)) {
    out.material = raw.material as SpellComponents['material'];
  }
  return out;
}

export type CanonicalSpellFields = {
  name: string;
  description: { full: string; summary: string };
  imageKey: string;
  school: string;
  level: number;
  classes: string[];
  castingTime: SpellCastingTime;
  range: SpellRange;
  duration: SpellDuration;
  components: SpellComponents;
  effectGroups: unknown[];
  scaling?: unknown;
  resolution?: unknown;
  deliveryMethod?: string;
};

/**
 * Normalize a raw Mongo lean document or API body fragment to canonical nested spell fields.
 */
export function normalizeRawCampaignSpellToCanonical(
  doc: Record<string, unknown>,
): CanonicalSpellFields {
  const legacyRitual = typeof doc.ritual === 'boolean' ? doc.ritual : undefined;
  const legacyConcentration = typeof doc.concentration === 'boolean' ? doc.concentration : undefined;

  const name = typeof doc.name === 'string' ? doc.name : '';
  const imageKey = typeof doc.imageKey === 'string' ? doc.imageKey : '';
  const school = typeof doc.school === 'string' ? doc.school : '';
  const level = typeof doc.level === 'number' && Number.isInteger(doc.level) ? doc.level : 0;
  const classes = Array.isArray(doc.classes) ? doc.classes.filter((x) => typeof x === 'string') : [];

  const description = parseDescription(doc.description);
  const castingTime = parseCastingTime(doc.castingTime, legacyRitual);
  const duration = parseDuration(doc.duration, legacyConcentration);
  const range = parseRange(doc.range);
  const components = parseComponents(doc.components);
  const effectGroups = Array.isArray(doc.effectGroups) ? doc.effectGroups : [];

  return {
    name,
    description,
    imageKey,
    school,
    level,
    classes,
    castingTime,
    range,
    duration,
    components,
    effectGroups,
    ...(doc.scaling !== undefined && { scaling: doc.scaling }),
    ...(doc.resolution !== undefined && { resolution: doc.resolution }),
    ...(typeof doc.deliveryMethod === 'string' && { deliveryMethod: doc.deliveryMethod }),
  };
}
