/**
 * Field selectors for searchable text. Order is preserved when joining; add
 * routes can extend with spell-specific or monster-specific fields later.
 */
export type ContentSearchConfig<T> = {
  fields: Array<(item: T) => string | undefined | null>;
};

/** Shared default: match on `name` only (content list rows expose `name`). */
export const DEFAULT_CONTENT_SEARCH_NAME_ONLY: ContentSearchConfig<{ name: string }> = {
  fields: [(item) => item.name],
};

const COMBINING_MARK = /\p{M}/gu;
/** Non-letters and non-numbers become separators (Unicode-aware). */
const NON_WORD_RUN = /[^\p{L}\p{N}]+/gu;

/**
 * Lowercase, strip diacritics, replace punctuation/special chars with spaces,
 * collapse whitespace.
 */
export function normalizeSearchText(value: string): string {
  const base = value.normalize('NFD').replace(COMBINING_MARK, '').toLowerCase();
  return base.replace(NON_WORD_RUN, ' ').trim().replace(/\s+/g, ' ');
}

/** Normalized text with all whitespace removed (e.g. "fire ball" → "fireball"). */
export function squashSearchText(value: string): string {
  return normalizeSearchText(value).replace(/\s/g, '');
}

/**
 * Forgiving substring match: normalized-with-spaces and/or squashed forms so
 * queries like "fire ball", "fireball", and "fire-ball" align with stored names.
 */
export function searchTextIncludes(haystack: string, query: string): boolean {
  const q = query.trim();
  if (!q) return true;

  const nq = normalizeSearchText(q);
  if (!nq) return false;

  const nh = normalizeSearchText(haystack);
  const sh = squashSearchText(haystack);
  const sq = squashSearchText(q);

  return nh.includes(nq) || sh.includes(sq);
}

export function getContentSearchHaystack<T>(item: T, config: ContentSearchConfig<T>): string {
  const parts: string[] = [];
  for (const field of config.fields) {
    const v = field(item);
    if (v != null && String(v).trim() !== '') {
      parts.push(String(v));
    }
  }
  return parts.join(' ');
}

export function rowMatchesContentSearch<T>(
  item: T,
  query: string,
  config: ContentSearchConfig<T>,
): boolean {
  return searchTextIncludes(getContentSearchHaystack(item, config), query);
}

export function createContentSearchMatcher<T>(
  config: ContentSearchConfig<T>,
): (row: T, query: string) => boolean {
  return (row, query) => rowMatchesContentSearch(row, query, config);
}
