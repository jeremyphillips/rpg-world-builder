import { describe, expect, it } from 'vitest';

import {
  createContentSearchMatcher,
  getContentSearchHaystack,
  normalizeSearchText,
  rowMatchesContentSearch,
  searchTextIncludes,
  squashSearchText,
} from './contentSearch';

describe('normalizeSearchText', () => {
  it('lowercases and collapses whitespace', () => {
    expect(normalizeSearchText('  Fire\tBall  ')).toBe('fire ball');
  });

  it('strips diacritics', () => {
    expect(normalizeSearchText('Café')).toBe('cafe');
  });

  it('replaces punctuation with spaces', () => {
    expect(normalizeSearchText('fire-bolt')).toBe('fire bolt');
    expect(normalizeSearchText("O'Malley")).toBe('o malley');
  });
});

describe('squashSearchText', () => {
  it('removes spaces from normalized text', () => {
    expect(squashSearchText('Fire Ball')).toBe('fireball');
  });
});

describe('searchTextIncludes', () => {
  it('matches fireball against fire ball and fire-ball', () => {
    expect(searchTextIncludes('Fireball', 'fire ball')).toBe(true);
    expect(searchTextIncludes('Fire Ball', 'fireball')).toBe(true);
    expect(searchTextIncludes('Fire-Ball', 'fireball')).toBe(true);
  });

  it('matches fire bolt vs firebolt spacing variants', () => {
    expect(searchTextIncludes('Fire Bolt', 'firebolt')).toBe(true);
    expect(searchTextIncludes('Firebolt', 'fire bolt')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(searchTextIncludes('SHADOW BLADE', 'shadow')).toBe(true);
  });

  it('returns true for empty query', () => {
    expect(searchTextIncludes('anything', '')).toBe(true);
    expect(searchTextIncludes('anything', '   ')).toBe(true);
  });

  it('returns false for query with no searchable letters/digits', () => {
    expect(searchTextIncludes('Fireball', '...')).toBe(false);
  });
});

describe('rowMatchesContentSearch', () => {
  it('joins multiple fields in order', () => {
    const config = {
      fields: [(row: { a: string; b: string }) => row.a, (row: { a: string; b: string }) => row.b],
    };
    expect(getContentSearchHaystack({ a: 'Fire', b: 'Bolt' }, config)).toBe('Fire Bolt');
    expect(rowMatchesContentSearch({ a: 'Fire', b: 'Bolt' }, 'firebolt', config)).toBe(true);
  });
});

describe('createContentSearchMatcher', () => {
  it('works as AppDataGrid searchRowMatch', () => {
    const match = createContentSearchMatcher({
      fields: [(r: { name: string }) => r.name],
    });
    expect(match({ name: 'Magic Missile' }, 'magicmissile')).toBe(true);
    expect(match({ name: 'Other' }, 'nomatch')).toBe(false);
  });
});
