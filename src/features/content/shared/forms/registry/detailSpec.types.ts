import type { ReactNode } from 'react';

export type DetailPlacement = 'main' | 'advanced' | 'both';

/**
 * Who may see the advanced/raw cell when building with `section: 'advanced'`.
 *
 * `platformOwner` corresponds to {@link CampaignViewer.isPlatformAdmin} at runtime
 * (platform-level admin, not campaign owner).
 */
export type DetailAudience = 'all' | 'platformOwner';

export type DetailSpec<T, Ctx = unknown> = {
  key: string;
  label: ReactNode;
  order: number;

  /**
   * Single-path / legacy render for the main section when `renderFriendly` is absent.
   * Omit when using `getValue` + `renderFriendly` for dual presentation.
   */
  render?: (item: T, ctx: Ctx) => ReactNode;

  /**
   * Canonical value for structured fields (friendly main cell + raw/advanced cell).
   */
  getValue?: (item: T, ctx: Ctx) => unknown;

  /**
   * Main/friendly cell when `getValue` is present.
   */
  renderFriendly?: (value: unknown, item: T, ctx: Ctx) => ReactNode;

  /**
   * Advanced/raw cell when `section: 'advanced'`. Defaults to pretty-printed JSON of `getValue`.
   */
  renderRaw?: (value: unknown, item: T, ctx: Ctx) => ReactNode;

  /**
   * Where this spec contributes rows. Default `main` (legacy: main section only).
   */
  placement?: DetailPlacement;

  /**
   * Audience for the advanced/raw row when `section: 'advanced'`. Default `all`.
   * `platformOwner` requires `viewer.isPlatformAdmin` when building the advanced section.
   */
  rawAudience?: DetailAudience;

  /** Omit the row when the resolved value is empty (see `isEmptyDetailValue`). */
  hideIfEmpty?: boolean;

  /** Hint for structured/stat-block fields; optional for styling or future use. */
  isStructured?: boolean;

  /** Hide this field for both sections. */
  hidden?: (item: T) => boolean;
};
