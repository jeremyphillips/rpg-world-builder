import { describe, expect, it } from 'vitest';

import {
  createRowId,
  mergePreserveExtras,
  tagRowsWithIds,
} from './mergePreserveExtras';

type Trait = {
  name: string;
  description: string;
  /** Domain extras the form does not author yet. */
  trigger?: string;
  uses?: { kind: 'recharge'; recharge: '5-6' };
  effects?: string[];
};

describe('tagRowsWithIds', () => {
  it('returns [] when rows are undefined', () => {
    expect(tagRowsWithIds<Trait>(undefined)).toEqual([]);
  });

  it('attaches a unique __rowId to each row', () => {
    const rows: Trait[] = [
      { name: 'a', description: 'A' },
      { name: 'b', description: 'B' },
    ];
    const tagged = tagRowsWithIds(rows);
    expect(tagged).toHaveLength(2);
    expect(tagged[0].__rowId).toBeDefined();
    expect(tagged[1].__rowId).toBeDefined();
    expect(tagged[0].__rowId).not.toEqual(tagged[1].__rowId);
  });

  it('does not mutate the source array or its rows', () => {
    const rows: Trait[] = [{ name: 'a', description: 'A' }];
    tagRowsWithIds(rows);
    expect(rows[0]).not.toHaveProperty('__rowId');
  });
});

describe('createRowId', () => {
  it('returns distinct strings on each call', () => {
    const a = createRowId();
    const b = createRowId();
    expect(a).not.toEqual(b);
    expect(a.length).toBeGreaterThan(0);
  });
});

describe('mergePreserveExtras', () => {
  const ownedKeys = ['name', 'description'] as const;

  it('preserves extras for matched rows and overwrites owned keys', () => {
    const source = tagRowsWithIds<Trait>([
      {
        name: 'Mucus Cloud',
        description: 'old',
        trigger: 'on_hit',
        uses: { kind: 'recharge', recharge: '5-6' },
        effects: ['restrained'],
      },
    ]);
    const formRows = source.map((row) => ({
      __rowId: row.__rowId,
      name: row.name,
      description: 'edited',
    }));

    const result = mergePreserveExtras<Trait>(formRows, source, ownedKeys);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: 'Mucus Cloud',
      description: 'edited',
      trigger: 'on_hit',
      uses: { kind: 'recharge', recharge: '5-6' },
      effects: ['restrained'],
    });
    expect(result[0]).not.toHaveProperty('__rowId');
  });

  it('returns owned-keys-only for new rows with no source match', () => {
    const source = tagRowsWithIds<Trait>([
      { name: 'A', description: 'A', trigger: 'always' },
    ]);
    const formRows = [
      ...source.map((r) => ({ __rowId: r.__rowId, name: r.name, description: r.description })),
      { __rowId: createRowId(), name: 'B', description: 'B' },
    ];

    const result = mergePreserveExtras<Trait>(formRows, source, ownedKeys);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ name: 'A', description: 'A', trigger: 'always' });
    expect(result[1]).toEqual({ name: 'B', description: 'B' });
  });

  it('honors form-side reordering', () => {
    const source = tagRowsWithIds<Trait>([
      { name: 'A', description: 'A', trigger: 'first' },
      { name: 'B', description: 'B', trigger: 'second' },
    ]);
    const formRows = [source[1], source[0]].map((r) => ({
      __rowId: r.__rowId,
      name: r.name,
      description: r.description,
    }));

    const result = mergePreserveExtras<Trait>(formRows, source, ownedKeys);

    expect(result.map((r) => r.name)).toEqual(['B', 'A']);
    expect(result.map((r) => r.trigger)).toEqual(['second', 'first']);
  });

  it('drops rows that the form omits', () => {
    const source = tagRowsWithIds<Trait>([
      { name: 'A', description: 'A' },
      { name: 'B', description: 'B' },
    ]);
    const formRows = [
      { __rowId: source[0].__rowId, name: 'A', description: 'A' },
    ];

    const result = mergePreserveExtras<Trait>(formRows, source, ownedKeys);

    expect(result.map((r) => r.name)).toEqual(['A']);
  });

  it('treats undefined sourceRows as empty (all form rows are new)', () => {
    const formRows = [{ __rowId: createRowId(), name: 'A', description: 'A' }];

    const result = mergePreserveExtras<Trait>(formRows, undefined, ownedKeys);

    expect(result).toEqual([{ name: 'A', description: 'A' }]);
  });

  it('skips undefined owned keys so they do not clobber source values', () => {
    const source = tagRowsWithIds<Trait>([
      { name: 'A', description: 'kept', trigger: 'always' },
    ]);
    const formRows = [
      {
        __rowId: source[0].__rowId,
        name: 'A',
        description: undefined as unknown as string,
      },
    ];

    const result = mergePreserveExtras<Trait>(formRows, source, ownedKeys);

    expect(result[0]).toEqual({ name: 'A', description: 'kept', trigger: 'always' });
  });
});
