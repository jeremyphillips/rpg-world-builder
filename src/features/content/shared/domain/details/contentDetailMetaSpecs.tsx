import type { ContentBase } from '@/features/content/shared/domain/types/content.types';
import { type DetailSpec, metaAll, metaPrivilegedContentMeta } from '@/features/content/shared/forms/registry';
import { AppBadge } from '@/ui/primitives';
import { VisibilityBadge } from '@/ui/patterns';

/**
 * Sort order for shared source / visibility meta rows.
 * Keep below typical `main` body fields that use order ≥ 10.
 */
export const CONTENT_DETAIL_META_ORDER = {
  source: 8,
  /** Leave 9 free for type-specific meta (e.g. patched) between source and visibility. */
  visibility: 10,
} as const;

/**
 * Shared detail meta rows for entries with {@link ContentBase} `source` and `accessPolicy`
 * (all standard campaign content items).
 */
export function contentDetailMetaSpecs<
  T extends Pick<ContentBase, 'source' | 'accessPolicy'>,
  Ctx = unknown,
>(): DetailSpec<T, Ctx>[] {
  return [
    {
      key: 'source',
      label: 'Source',
      order: CONTENT_DETAIL_META_ORDER.source,
      render: (item) => (
        <AppBadge
          label={item.source}
          tone={item.source === 'system' ? 'info' : 'default'}
        />
      ),
      ...metaAll,
    },
    {
      key: 'visibility',
      label: 'Visibility',
      order: CONTENT_DETAIL_META_ORDER.visibility,
      render: (item) =>
        item.accessPolicy && item.accessPolicy.scope !== 'public' ? (
          <VisibilityBadge visibility={item.accessPolicy} />
        ) : (
          'Public'
        ),
      ...metaPrivilegedContentMeta,
    },
  ];
}

/**
 * Meta row: system-patch indicator — compact label + badge. Order 9 between source and visibility.
 * Same audience as visibility ({@link metaPrivilegedContentMeta}): DM / co-DM or platform admin only (`canViewPrivilegedContentMeta`).
 */
export function contentDetailPatchedMetaSpecs<
  T extends Pick<ContentBase, 'patched'>,
  Ctx = unknown,
>(): DetailSpec<T, Ctx>[] {
  return [
    {
      key: 'patched',
      label: '',
      order: 9,
      hidden: (item) => !item.patched,
      render: () => <AppBadge label="Patched" tone="warning" size="small" />,
      ...metaPrivilegedContentMeta,
    },
  ];
}
