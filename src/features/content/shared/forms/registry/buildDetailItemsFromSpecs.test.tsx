import { createElement, Fragment } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { buildDetailItemsFromSpecs } from './buildDetailItemsFromSpecs';
import type { DetailSpec } from './detailSpec.types';

type Item = { id: string; name: string; data?: { x: number } };

describe('buildDetailItemsFromSpecs', () => {
  const item: Item = { id: '1', name: 'Test', data: { x: 1 } };

  it('defaults to main section and preserves legacy render-only specs', () => {
    const specs: DetailSpec<Item, unknown>[] = [
      { key: 'name', label: 'Name', order: 10, render: (i) => i.name },
    ];
    const rows = buildDetailItemsFromSpecs(specs, item, {});
    expect(rows).toEqual([{ label: 'Name', value: 'Test' }]);
  });

  it('main section includes placement main and both', () => {
    const specs: DetailSpec<Item, unknown>[] = [
      { key: 'a', label: 'A', order: 10, placement: 'main', render: () => 'main' },
      { key: 'b', label: 'B', order: 20, placement: 'both', render: () => 'both' },
      { key: 'c', label: 'C', order: 30, placement: 'advanced', render: () => 'adv' },
    ];
    const rows = buildDetailItemsFromSpecs(specs, item, {}, { section: 'main' });
    expect(rows.map((r) => r.label)).toEqual(['A', 'B']);
  });

  it('advanced section includes placement advanced and both', () => {
    const specs: DetailSpec<Item, unknown>[] = [
      { key: 'a', label: 'A', order: 10, placement: 'main', render: () => 'main' },
      { key: 'b', label: 'B', order: 20, placement: 'both', getValue: () => ({ k: 1 }), renderFriendly: () => 'friendly' },
      { key: 'c', label: 'C', order: 30, placement: 'advanced', getValue: () => ({ z: 2 }), renderFriendly: () => 'x' },
    ];
    const rows = buildDetailItemsFromSpecs(specs, item, {}, { section: 'advanced' });
    expect(rows.map((r) => r.label)).toEqual(['B', 'C']);
  });

  it('uses renderFriendly + getValue on main and default JSON on advanced', () => {
    const specs: DetailSpec<Item, unknown>[] = [
      {
        key: 'data',
        label: 'Data',
        order: 10,
        placement: 'both',
        getValue: (i) => i.data,
        renderFriendly: (v) => String((v as { x: number }).x),
      },
    ];
    const main = buildDetailItemsFromSpecs(specs, item, {}, { section: 'main' });
    expect(main[0]?.value).toBe('1');

    const adv = buildDetailItemsFromSpecs(specs, item, {}, { section: 'advanced' });
    const html = renderToStaticMarkup(createElement(Fragment, null, adv[0]?.value));
    expect(html).toMatch(/\bx\b.*:\s*1/);
  });

  it('hides empty rows when hideIfEmpty and getValue is empty', () => {
    const specs: DetailSpec<Item, unknown>[] = [
      {
        key: 'data',
        label: 'Data',
        order: 10,
        placement: 'both',
        hideIfEmpty: true,
        getValue: () => undefined,
        renderFriendly: () => 'nope',
      },
    ];
    expect(buildDetailItemsFromSpecs(specs, item, {}, { section: 'main' })).toHaveLength(0);
    expect(buildDetailItemsFromSpecs(specs, item, {}, { section: 'advanced' })).toHaveLength(0);
  });

  it('filters platformOwner advanced rows unless viewer is platform admin', () => {
    const specs: DetailSpec<Item, unknown>[] = [
      {
        key: 'data',
        label: 'Data',
        order: 10,
        placement: 'both',
        rawAudience: 'platformOwner',
        getValue: (i) => i.data,
        renderFriendly: () => 'ok',
      },
    ];
    expect(
      buildDetailItemsFromSpecs(specs, item, {}, { section: 'advanced', viewer: { isPlatformAdmin: false } }),
    ).toHaveLength(0);
    expect(
      buildDetailItemsFromSpecs(specs, item, {}, { section: 'advanced', viewer: { isPlatformAdmin: true } }),
    ).toHaveLength(1);
  });

  it('main section still shows both placement for all users (platformOwner only affects advanced)', () => {
    const specs: DetailSpec<Item, unknown>[] = [
      {
        key: 'data',
        label: 'Data',
        order: 10,
        placement: 'both',
        rawAudience: 'platformOwner',
        getValue: (i) => i.data,
        renderFriendly: () => 'friendly',
      },
    ];
    const main = buildDetailItemsFromSpecs(specs, item, {}, { section: 'main' });
    expect(main).toHaveLength(1);
    expect(main[0]?.value).toBe('friendly');
  });

  it('meta section includes only meta placement and respects metaAudience', () => {
    const specs: DetailSpec<Item, unknown>[] = [
      { key: 'source', label: 'Source', order: 10, placement: 'meta', render: () => 'sys' },
      {
        key: 'visibility',
        label: 'Visibility',
        order: 20,
        placement: 'meta',
        metaAudience: 'privilegedContentMeta',
        render: () => 'dm-only',
      },
      { key: 'name', label: 'Name', order: 5, render: () => 'n' },
    ];
    const metaPlayer = buildDetailItemsFromSpecs(specs, item, {}, {
      section: 'meta',
      viewer: { isPlatformAdmin: false, campaignRole: null },
    });
    expect(metaPlayer.map((r) => r.label)).toEqual(['Source']);

    const metaDm = buildDetailItemsFromSpecs(specs, item, {}, {
      section: 'meta',
      viewer: { isPlatformAdmin: false, campaignRole: 'dm' },
    });
    expect(metaDm.map((r) => r.label)).toEqual(['Source', 'Visibility']);
  });

  it('main-and-advanced placement matches main and advanced sections', () => {
    const specs: DetailSpec<Item, unknown>[] = [
      {
        key: 'data',
        label: 'Data',
        order: 10,
        placement: 'main-and-advanced',
        getValue: (i) => i.data,
        renderFriendly: (v) => String((v as { x: number }).x),
      },
    ];
    const main = buildDetailItemsFromSpecs(specs, item, {}, { section: 'main' });
    expect(main).toHaveLength(1);
    const adv = buildDetailItemsFromSpecs(specs, item, {}, { section: 'advanced' });
    expect(adv).toHaveLength(1);
  });
});
