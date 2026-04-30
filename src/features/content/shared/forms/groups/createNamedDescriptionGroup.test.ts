import { describe, expect, it } from 'vitest';

import { createNamedDescriptionGroup } from './createNamedDescriptionGroup';

type TraitDomain = {
  name: string;
  description: string;
  trigger?: string;
};

describe('createNamedDescriptionGroup', () => {
  it('produces a repeatable-group spec with __rowId, name, and description', () => {
    const group = createNamedDescriptionGroup<TraitDomain>({
      name: 'traits',
      domainPath: 'mechanics.traits',
      itemLabel: 'Trait',
      label: 'Traits',
    });

    expect(group.kind).toBe('repeatable-group');
    expect(group.name).toBe('traits');
    expect(group.label).toBe('Traits');
    expect(group.itemLabel).toBe('Trait');

    const childNames = group.children.map((c) => ('name' in c ? c.name : ''));
    expect(childNames).toEqual(['__rowId', 'name', 'description']);

    const rowIdField = group.children[0] as { skipInForm?: boolean; kind: string };
    expect(rowIdField.skipInForm).toBe(true);
    expect(rowIdField.kind).toBe('text');
  });

  it('omits description when includeDescription is false', () => {
    const group = createNamedDescriptionGroup<{ name: string }>({
      name: 'naturalActions',
      domainPath: 'mechanics.actions',
      itemLabel: 'Natural attack',
      includeDescription: false,
    });

    const childNames = group.children.map((c) => ('name' in c ? c.name : ''));
    expect(childNames).toEqual(['__rowId', 'name']);
  });

  it('appends extras after the standard fields', () => {
    const group = createNamedDescriptionGroup<{ name: string; description: string; level: number }>({
      name: 'features',
      domainPath: 'progression.features',
      itemLabel: 'Feature',
      extras: [
        {
          name: 'level',
          label: 'Level',
          kind: 'numberText',
          required: true,
        },
      ],
    });

    const childNames = group.children.map((c) => ('name' in c ? c.name : ''));
    expect(childNames).toEqual(['__rowId', 'name', 'description', 'level']);
  });

  it('parse() tags domain rows with __rowId', () => {
    const group = createNamedDescriptionGroup<TraitDomain>({
      name: 'traits',
      domainPath: 'mechanics.traits',
      itemLabel: 'Trait',
    });

    const tagged = group.patchBinding!.parse([
      { name: 'A', description: 'A', trigger: 'always' },
    ]) as Array<{ __rowId?: string; name: string; trigger?: string }>;

    expect(tagged).toHaveLength(1);
    expect(tagged[0].__rowId).toBeDefined();
    expect(tagged[0].name).toBe('A');
    expect(tagged[0].trigger).toBe('always');
  });

  it('parse() returns [] for non-array input', () => {
    const group = createNamedDescriptionGroup<TraitDomain>({
      name: 'traits',
      domainPath: 'mechanics.traits',
      itemLabel: 'Trait',
    });

    expect(group.patchBinding!.parse(undefined)).toEqual([]);
    expect(group.patchBinding!.parse(null)).toEqual([]);
    expect(group.patchBinding!.parse({})).toEqual([]);
  });

  it('serialize() preserves extras for matched rows', () => {
    const group = createNamedDescriptionGroup<TraitDomain>({
      name: 'traits',
      domainPath: 'mechanics.traits',
      itemLabel: 'Trait',
    });

    const sourceRows: Array<TraitDomain & { __rowId?: string }> = [
      { __rowId: 'r1', name: 'A', description: 'old', trigger: 'always' },
    ];
    const formRows = [{ __rowId: 'r1', name: 'A', description: 'edited' }];

    const out = group.patchBinding!.serialize(formRows, sourceRows) as TraitDomain[];

    expect(out).toEqual([
      { name: 'A', description: 'edited', trigger: 'always' },
    ]);
  });

  it('serialize() drops __rowId from output', () => {
    const group = createNamedDescriptionGroup<TraitDomain>({
      name: 'traits',
      domainPath: 'mechanics.traits',
      itemLabel: 'Trait',
    });

    const out = group.patchBinding!.serialize(
      [{ __rowId: 'new1', name: 'B', description: 'B' }],
      undefined,
    ) as Array<Record<string, unknown>>;

    expect(out).toHaveLength(1);
    expect(out[0]).not.toHaveProperty('__rowId');
    expect(out[0]).toEqual({ name: 'B', description: 'B' });
  });

  it('respects custom ownedKeys (e.g. when extras edit domain values)', () => {
    type Feature = { name: string; description: string; level: number; effects?: string[] };
    const group = createNamedDescriptionGroup<Feature>({
      name: 'features',
      domainPath: 'progression.features',
      itemLabel: 'Feature',
      extras: [{ name: 'level', label: 'Level', kind: 'numberText' }],
      ownedKeys: ['name', 'description', 'level'],
    });

    const sourceRows: Array<Feature & { __rowId?: string }> = [
      {
        __rowId: 'r1',
        name: 'Cleave',
        description: 'old',
        level: 5,
        effects: ['preserved'],
      },
    ];
    const formRows = [
      { __rowId: 'r1', name: 'Cleave', description: 'edited', level: 6 },
    ];

    const out = group.patchBinding!.serialize(formRows, sourceRows) as Feature[];
    expect(out).toEqual([
      {
        name: 'Cleave',
        description: 'edited',
        level: 6,
        effects: ['preserved'],
      },
    ]);
  });
});
