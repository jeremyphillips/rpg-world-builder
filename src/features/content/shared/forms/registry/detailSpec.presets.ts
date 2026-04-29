import type { ContentMetaAudience, DetailSpec } from './detailSpec.types';

/** Meta row, visible to all viewers (e.g. source). */
export const metaAll = {
  placement: 'meta' as const,
  metaAudience: 'all' as const satisfies ContentMetaAudience,
};

/** Meta row for privileged content metadata (DM / co-DM or platform admin only). */
export const metaPrivilegedContentMeta = {
  placement: 'meta' as const,
  metaAudience: 'privilegedContentMeta' as const satisfies ContentMetaAudience,
};

/** @deprecated Use {@link metaPrivilegedContentMeta}. */
export const metaDmOrPlatformOwner = metaPrivilegedContentMeta;

/** Main KeyValueSection only. */
export const mainOnly = {
  placement: 'main' as const,
};

/**
 * Friendly summary in main + raw JSON in advanced (platform-admin advanced section).
 * Omit per-spec `renderRaw` to use default pretty-printed JSON.
 */
export const structuredMainAndAdvanced = {
  placement: 'main-and-advanced' as const,
  rawAudience: 'platformOwner' as const,
  hideIfEmpty: true,
  isStructured: true,
} as const satisfies Pick<
  DetailSpec<unknown, unknown>,
  'placement' | 'rawAudience' | 'hideIfEmpty' | 'isStructured'
>;

/**
 * Raw JSON in advanced only (not shown in main). Platform-admin advanced section.
 */
export const structuredAdvancedOnly = {
  placement: 'advanced' as const,
  rawAudience: 'platformOwner' as const,
  hideIfEmpty: true,
  isStructured: true,
} as const satisfies Pick<
  DetailSpec<unknown, unknown>,
  'placement' | 'rawAudience' | 'hideIfEmpty' | 'isStructured'
>;
