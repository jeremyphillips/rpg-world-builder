import { describe, expect, it } from 'vitest';

import { buildDefaultValues } from '@/ui/patterns';
import { buildFormLayout } from '../buildFormLayout';
import type { FormNodeSpec } from '../formNodeSpec.types';

type TestForm = {
  title: string;
  effectGroups: { targeting: { selection: string }; effects: { kind: string }[] }[];
};

describe('buildFormLayout', () => {
  it('builds nested repeatable-group layout', () => {
    const specs: FormNodeSpec<TestForm>[] = [
      {
        name: 'title',
        label: 'Title',
        kind: 'text',
        defaultValue: '',
      },
      {
        kind: 'repeatable-group',
        name: 'effectGroups',
        itemLabel: 'Group',
        children: [
          {
            name: 'targeting.selection',
            label: 'Selection',
            kind: 'select',
            options: [{ value: 'one', label: 'One' }],
            defaultFromOptions: 'first',
          },
          {
            kind: 'repeatable-group',
            name: 'effects',
            itemLabel: 'Effect',
            children: [
              {
                name: 'kind',
                label: 'Kind',
                kind: 'select',
                options: [{ value: 'damage', label: 'Damage' }],
                defaultFromOptions: 'first',
              },
            ],
          },
        ],
      },
    ];

    const layout = buildFormLayout(specs);
    expect(layout).toHaveLength(2);
    expect(layout[1]).toMatchObject({
      type: 'repeatable-group',
      name: 'effectGroups',
      itemLabel: 'Group',
    });
    const inner = (layout[1] as { type: 'repeatable-group'; children: unknown[] }).children;
    expect(inner[1]).toMatchObject({ type: 'repeatable-group', name: 'effects' });
  });

  it('buildDefaultValues sets repeatable arrays to empty', () => {
    const specs: FormNodeSpec<TestForm>[] = [
      {
        name: 'title',
        label: 'Title',
        kind: 'text',
        defaultValue: 'x',
      },
      {
        kind: 'repeatable-group',
        name: 'effectGroups',
        itemLabel: 'Group',
        children: [
          {
            name: 'targeting.selection',
            label: 'Selection',
            kind: 'select',
            options: [{ value: 'one', label: 'One' }],
            defaultFromOptions: 'first',
          },
        ],
      },
    ];
    const defaults = buildDefaultValues(buildFormLayout(specs));
    expect(defaults.title).toBe('x');
    expect(defaults.effectGroups).toEqual([]);
  });
});
