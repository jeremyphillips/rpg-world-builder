import { describe, expect, it } from 'vitest';

import type { ViewerContext } from '@/shared/domain/capabilities';

import { buildContentDetailSectionsFromSpecs, toDetailSpecViewer } from './buildContentDetailSectionsFromSpecs';
import type { DetailSpec } from './detailSpec.types';

type Item = { id: string };

describe('toDetailSpecViewer', () => {
  it('returns undefined when viewer context is undefined', () => {
    expect(toDetailSpecViewer(undefined)).toBeUndefined();
  });

  it('maps platform admin and campaign role', () => {
    const ctx = {
      campaignRole: 'dm',
      isOwner: false,
      isPlatformAdmin: true,
      characterIds: [],
    } satisfies ViewerContext;
    expect(toDetailSpecViewer(ctx)).toEqual({
      isPlatformAdmin: true,
      campaignRole: 'dm',
    });
  });
});

describe('buildContentDetailSectionsFromSpecs', () => {
  const item: Item = { id: '1' };

  it('builds three sections with the same normalized viewer', () => {
    const specs: DetailSpec<Item, unknown>[] = [
      { key: 'm', label: 'M', order: 1, placement: 'meta', render: () => 'meta' },
      { key: 'a', label: 'A', order: 2, placement: 'main', render: () => 'main' },
      {
        key: 'x',
        label: 'X',
        order: 3,
        placement: 'main-and-advanced',
        rawAudience: 'platformOwner',
        getValue: () => ({ n: 1 }),
        renderFriendly: () => 'friendly',
      },
    ];
    const viewerContext = {
      campaignRole: null,
      isOwner: false,
      isPlatformAdmin: true,
      characterIds: [],
    } satisfies ViewerContext;

    const result = buildContentDetailSectionsFromSpecs({
      specs,
      item,
      ctx: {},
      viewerContext,
    });

    expect(result.viewer).toEqual({ isPlatformAdmin: true, campaignRole: null });
    expect(result.metaItems.map((r) => r.label)).toEqual(['M']);
    expect(result.mainItems.map((r) => r.label)).toEqual(['A', 'X']);
    expect(result.advancedItems).toHaveLength(1);
  });

  it('uses an explicit viewer when provided instead of viewerContext', () => {
    const specs: DetailSpec<Item, unknown>[] = [
      { key: 'm', label: 'M', order: 1, placement: 'meta', render: () => 'meta' },
    ];
    const explicit = { isPlatformAdmin: false, campaignRole: 'co_dm' as const };

    const result = buildContentDetailSectionsFromSpecs({
      specs,
      item,
      ctx: {},
      viewerContext: {
        campaignRole: null,
        isOwner: false,
        isPlatformAdmin: false,
        characterIds: [],
      },
      viewer: explicit,
    });

    expect(result.viewer).toEqual(explicit);
  });

  it('defaults `getValue` rows without explicit placement to structuredMainAndAdvanced', () => {
    const specs: DetailSpec<Item, unknown>[] = [
      {
        key: 'defaulted',
        label: 'Defaulted',
        order: 10,
        getValue: () => ({ n: 1 }),
        renderFriendly: () => 'friendly',
      },
    ];
    const platformAdminViewer = {
      campaignRole: null,
      isOwner: false,
      isPlatformAdmin: true,
      characterIds: [],
    } satisfies ViewerContext;

    const result = buildContentDetailSectionsFromSpecs({
      specs,
      item,
      ctx: {},
      viewerContext: platformAdminViewer,
    });

    expect(result.mainItems.map((r) => r.label)).toEqual(['Defaulted']);
    expect(result.advancedItems.map((r) => r.label)).toEqual(['Defaulted']);
  });

  it('hides defaulted `getValue` rows for non-platform-admin viewers in advanced', () => {
    const specs: DetailSpec<Item, unknown>[] = [
      {
        key: 'defaulted',
        label: 'Defaulted',
        order: 10,
        getValue: () => ({ n: 1 }),
        renderFriendly: () => 'friendly',
      },
    ];
    const memberViewer = {
      campaignRole: null,
      isOwner: false,
      isPlatformAdmin: false,
      characterIds: [],
    } satisfies ViewerContext;

    const result = buildContentDetailSectionsFromSpecs({
      specs,
      item,
      ctx: {},
      viewerContext: memberViewer,
    });

    expect(result.mainItems.map((r) => r.label)).toEqual(['Defaulted']);
    expect(result.advancedItems).toHaveLength(0);
  });

  it('hides defaulted `getValue` rows when value is empty (hideIfEmpty default-on)', () => {
    const specs: DetailSpec<Item, unknown>[] = [
      {
        key: 'empty',
        label: 'Empty',
        order: 10,
        getValue: () => undefined,
        renderFriendly: () => 'friendly',
      },
    ];

    const result = buildContentDetailSectionsFromSpecs({
      specs,
      item,
      ctx: {},
    });

    expect(result.mainItems).toHaveLength(0);
    expect(result.advancedItems).toHaveLength(0);
  });

  it('honors explicit placement opt-out (e.g. advanced-only raw record rows)', () => {
    const specs: DetailSpec<Item, unknown>[] = [
      {
        key: 'rawOnly',
        label: 'Raw Only',
        order: 10,
        placement: 'advanced',
        rawAudience: 'platformOwner',
        getValue: () => ({ n: 1 }),
      },
    ];
    const platformAdminViewer = {
      campaignRole: null,
      isOwner: false,
      isPlatformAdmin: true,
      characterIds: [],
    } satisfies ViewerContext;

    const result = buildContentDetailSectionsFromSpecs({
      specs,
      item,
      ctx: {},
      viewerContext: platformAdminViewer,
    });

    expect(result.mainItems).toHaveLength(0);
    expect(result.advancedItems.map((r) => r.label)).toEqual(['Raw Only']);
  });

  it('does not affect specs that only define `render` (no `getValue`)', () => {
    const specs: DetailSpec<Item, unknown>[] = [
      { key: 'plain', label: 'Plain', order: 10, render: () => 'plain' },
    ];

    const result = buildContentDetailSectionsFromSpecs({
      specs,
      item,
      ctx: {},
    });

    expect(result.mainItems.map((r) => r.label)).toEqual(['Plain']);
    expect(result.advancedItems).toHaveLength(0);
  });
});
