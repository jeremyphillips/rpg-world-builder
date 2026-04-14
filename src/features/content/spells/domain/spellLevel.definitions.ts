/**
 * Enriched display metadata for authored spell tier (`0` = cantrip). Numeric `SpellLevel` remains the
 * source of truth in spell data; this module owns labels, headings, and short forms for UI.
 */
import { SPELL_LEVELS, type SpellLevel } from './types/spell.types';

export const SPELL_LEVEL_DEFINITIONS = [
  { id: 0, name: 'Cantrip', heading: 'Cantrips', shortName: 'Cantrip', ordinal: 'Cantrip' },
  { id: 1, name: '1st Level', heading: '1st Level', shortName: '1st', ordinal: '1st' },
  { id: 2, name: '2nd Level', heading: '2nd Level', shortName: '2nd', ordinal: '2nd' },
  { id: 3, name: '3rd Level', heading: '3rd Level', shortName: '3rd', ordinal: '3rd' },
  { id: 4, name: '4th Level', heading: '4th Level', shortName: '4th', ordinal: '4th' },
  { id: 5, name: '5th Level', heading: '5th Level', shortName: '5th', ordinal: '5th' },
  { id: 6, name: '6th Level', heading: '6th Level', shortName: '6th', ordinal: '6th' },
  { id: 7, name: '7th Level', heading: '7th Level', shortName: '7th', ordinal: '7th' },
  { id: 8, name: '8th Level', heading: '8th Level', shortName: '8th', ordinal: '8th' },
  { id: 9, name: '9th Level', heading: '9th Level', shortName: '9th', ordinal: '9th' },
] as const satisfies readonly { id: SpellLevel; name: string; heading: string; shortName: string; ordinal: string }[];

export type SpellLevelDefinition = (typeof SPELL_LEVEL_DEFINITIONS)[number];

const SPELL_LEVEL_DEFINITION_BY_ID: ReadonlyMap<SpellLevel, SpellLevelDefinition> = new Map(
  SPELL_LEVEL_DEFINITIONS.map((row) => [row.id, row]),
);

export { SPELL_LEVEL_DEFINITION_BY_ID };

export function isSpellLevel(n: number): n is SpellLevel {
  return Number.isInteger(n) && n >= SPELL_LEVELS[0] && n <= SPELL_LEVELS[SPELL_LEVELS.length - 1];
}

export function getSpellLevelDefinition(level: SpellLevel): SpellLevelDefinition {
  return SPELL_LEVEL_DEFINITION_BY_ID.get(level)!;
}

/** Lookup by numeric level; `undefined` if out of authored range. */
export function getSpellLevelDefinitionOrUndefined(level: number): SpellLevelDefinition | undefined {
  return isSpellLevel(level) ? getSpellLevelDefinition(level) : undefined;
}

export function formatSpellLevelName(level: SpellLevel): string {
  return getSpellLevelDefinition(level).name;
}

export function formatSpellLevelHeading(level: SpellLevel): string {
  return getSpellLevelDefinition(level).heading;
}

export function formatSpellLevelShort(level: SpellLevel): string {
  return getSpellLevelDefinition(level).shortName;
}

const INVALID_PLACEHOLDER = '—';

export function formatSpellLevelNameUnsafe(level: number | null | undefined): string {
  if (level == null || !isSpellLevel(level)) return INVALID_PLACEHOLDER;
  return formatSpellLevelName(level);
}

export function formatSpellLevelHeadingUnsafe(level: number | null | undefined): string {
  if (level == null || !isSpellLevel(level)) return INVALID_PLACEHOLDER;
  return formatSpellLevelHeading(level);
}

export function formatSpellLevelShortUnsafe(level: number | null | undefined): string {
  if (level == null || !isSpellLevel(level)) return INVALID_PLACEHOLDER;
  return formatSpellLevelShort(level);
}

/** Grid / untyped values: accepts non-integers and unknown without throwing. */
export function formatSpellLevelShortFromUnknown(level: unknown): string {
  if (typeof level !== 'number' || !Number.isInteger(level)) return INVALID_PLACEHOLDER;
  return formatSpellLevelShortUnsafe(level);
}
