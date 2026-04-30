import type { ReactNode } from 'react';

import type { ViewerContext } from '@/shared/domain/capabilities';

import { buildDetailItemsFromSpecs, type BuildDetailViewer } from './buildDetailItemsFromSpecs';
import type { DetailSpec } from './detailSpec.types';
import { structuredMainAndAdvanced } from './detailSpec.presets';

/** Rows returned for each detail section (meta / main / advanced). */
export type ContentDetailSectionItems = { label: ReactNode; value?: ReactNode }[];

/**
 * Normalizes campaign {@link ViewerContext} into the slice used by detail spec builders.
 */
export function toDetailSpecViewer(
  viewerContext: ViewerContext | undefined,
): BuildDetailViewer | undefined {
  if (viewerContext === undefined) return undefined;
  return {
    isPlatformAdmin: viewerContext.isPlatformAdmin,
    campaignRole: viewerContext.campaignRole,
  };
}

export type BuildContentDetailSectionsFromSpecsArgs<T, Ctx> = {
  specs: DetailSpec<T, Ctx>[];
  item: T;
  ctx: Ctx;
  viewerContext?: ViewerContext | undefined;
  /**
   * When set, used for all section builds instead of {@link toDetailSpecViewer}(viewerContext).
   * Routes may call `toDetailSpecViewer(viewerContext)` once and pass it here for clarity.
   */
  viewer?: BuildDetailViewer | undefined;
};

export type BuildContentDetailSectionsFromSpecsResult = {
  metaItems: ContentDetailSectionItems;
  mainItems: ContentDetailSectionItems;
  advancedItems: ContentDetailSectionItems;
  /** Normalized viewer passed to every `buildDetailItemsFromSpecs` call. */
  viewer: BuildDetailViewer | undefined;
};

/**
 * Apply default placement/audience to specs that have a {@link DetailSpec.getValue}
 * but no explicit {@link DetailSpec.placement}.
 *
 * Behavior: such specs are treated as {@link structuredMainAndAdvanced} — friendly
 * cell in `main`, raw JSON in `advanced` for platform owners only, hidden when empty.
 *
 * Specs that already declare `placement` (including legacy `'advanced'` raw-record
 * rows) are returned unchanged. Pure `render`-only specs are also unchanged.
 */
function applyStructuredDefaults<T, Ctx>(
  specs: DetailSpec<T, Ctx>[],
): DetailSpec<T, Ctx>[] {
  return specs.map((spec) => {
    if (spec.placement !== undefined) return spec;
    if (spec.getValue === undefined) return spec;
    return { ...structuredMainAndAdvanced, ...spec };
  });
}

/**
 * Builds meta, main, and advanced {@link KeyValueSection} row lists from one spec array.
 * Composes {@link buildDetailItemsFromSpecs}; does not duplicate filtering logic.
 *
 * Specs with `getValue` and no `placement` default to {@link structuredMainAndAdvanced}
 * (friendly main + platform-owner raw advanced, hidden when empty). Specs that declare
 * `placement` explicitly always win.
 */
export function buildContentDetailSectionsFromSpecs<T, Ctx>(
  args: BuildContentDetailSectionsFromSpecsArgs<T, Ctx>,
): BuildContentDetailSectionsFromSpecsResult {
  const viewer = args.viewer ?? toDetailSpecViewer(args.viewerContext);
  const opts = { viewer };
  const normalizedSpecs = applyStructuredDefaults(args.specs);
  return {
    metaItems: buildDetailItemsFromSpecs(normalizedSpecs, args.item, args.ctx, {
      section: 'meta',
      ...opts,
    }),
    mainItems: buildDetailItemsFromSpecs(normalizedSpecs, args.item, args.ctx, {
      section: 'main',
      ...opts,
    }),
    advancedItems: buildDetailItemsFromSpecs(normalizedSpecs, args.item, args.ctx, {
      section: 'advanced',
      ...opts,
    }),
    viewer,
  };
}
