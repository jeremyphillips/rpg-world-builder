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
});
