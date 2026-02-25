/**
 * Maps editions that don't have their own spell data to the nearest
 * supported edition key used in spell catalog entries.
 *
 * Spell data uses 'b' for Basic-era editions (BECMI, B/X).
 * Add future mappings here (e.g. 5e variants, homebrew) without
 * touching any call sites.
 */
const SPELL_EDITION_FALLBACK: Record<string, string> = {
  'becmi': 'b',
  'bx':    'b',
}

export const resolveSpellEdition = (edition: string): string =>
  SPELL_EDITION_FALLBACK[edition] ?? edition
