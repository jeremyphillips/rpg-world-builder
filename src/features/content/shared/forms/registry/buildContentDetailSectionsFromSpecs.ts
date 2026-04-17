import type { ReactNode } from 'react';

import type { ViewerContext } from '@/shared/domain/capabilities';

import { buildDetailItemsFromSpecs, type BuildDetailViewer } from './buildDetailItemsFromSpecs';
import type { DetailSpec } from './detailSpec.types';

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
};

export type BuildContentDetailSectionsFromSpecsResult = {
  metaItems: ContentDetailSectionItems;
  mainItems: ContentDetailSectionItems;
  advancedItems: ContentDetailSectionItems;
  /** Normalized viewer passed to every `buildDetailItemsFromSpecs` call. */
  viewer: BuildDetailViewer | undefined;
};

/**
 * Builds meta, main, and advanced {@link KeyValueSection} row lists from one spec array.
 * Composes {@link buildDetailItemsFromSpecs}; does not duplicate filtering logic.
 */
export function buildContentDetailSectionsFromSpecs<T, Ctx>(
  args: BuildContentDetailSectionsFromSpecsArgs<T, Ctx>,
): BuildContentDetailSectionsFromSpecsResult {
  const viewer = toDetailSpecViewer(args.viewerContext);
  const opts = { viewer };
  return {
    metaItems: buildDetailItemsFromSpecs(args.specs, args.item, args.ctx, {
      section: 'meta',
      ...opts,
    }),
    mainItems: buildDetailItemsFromSpecs(args.specs, args.item, args.ctx, {
      section: 'main',
      ...opts,
    }),
    advancedItems: buildDetailItemsFromSpecs(args.specs, args.item, args.ctx, {
      section: 'advanced',
      ...opts,
    }),
    viewer,
  };
}
