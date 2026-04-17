import type { DetailMetaAudience, DetailSpec } from './detailSpec.types';

/** Meta row, visible to all viewers (e.g. source). */
export const metaAll = {
  placement: 'meta' as const,
  metaAudience: 'all' as const satisfies DetailMetaAudience,
};

/** Meta row for DM / co-DM or platform admin only (e.g. visibility). */
export const metaDmOrPlatformOwner = {
  placement: 'meta' as const,
  metaAudience: 'dm-or-platformOwner' as const satisfies DetailMetaAudience,
};

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
