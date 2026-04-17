import type { ReactNode } from 'react';

import { canViewDetailMetaDmOrPlatformOwner } from '@/shared/domain/capabilities';
import type { ViewerContext } from '@/shared/domain/capabilities';

import { defaultDetailRawRender, isEmptyDetailValue } from './detailSpec.helpers';
import type { DetailSpec } from './detailSpec.types';

/** Partial viewer slice for detail builders; omit fields when unknown. */
export type BuildDetailViewer = Partial<Pick<ViewerContext, 'isPlatformAdmin' | 'campaignRole'>>;

export type BuildDetailItemsFromSpecsOptions = {
  section?: 'meta' | 'main' | 'advanced';
  /** Used for meta audience checks and advanced `rawAudience: 'platformOwner'`. */
  viewer?: BuildDetailViewer;
};

function normalizePlacement(
  placement: DetailSpec<unknown, unknown>['placement'],
): 'meta' | 'main' | 'advanced' | 'main-and-advanced' {
  const p = placement ?? 'main';
  if (p === 'both') return 'main-and-advanced';
  return p;
}

function placementMatches(
  placement: DetailSpec<unknown, unknown>['placement'],
  section: 'meta' | 'main' | 'advanced',
): boolean {
  const n = normalizePlacement(placement);
  if (section === 'meta') return n === 'meta';
  if (section === 'main') {
    return n === 'main' || n === 'main-and-advanced';
  }
  return n === 'advanced' || n === 'main-and-advanced';
}

function metaAudienceAllows(
  metaAudience: DetailSpec<unknown, unknown>['metaAudience'],
  viewer: BuildDetailViewer | undefined,
): boolean {
  const a = metaAudience ?? 'all';
  if (a === 'all') return true;
  if (a === 'platformOwner') return Boolean(viewer?.isPlatformAdmin);
  return canViewDetailMetaDmOrPlatformOwner(viewer);
}

function advancedAudienceAllows(
  rawAudience: DetailSpec<unknown, unknown>['rawAudience'],
  viewer: BuildDetailViewer | undefined,
): boolean {
  if (rawAudience === 'platformOwner') {
    return Boolean(viewer?.isPlatformAdmin);
  }
  return true;
}

function resolveMainValue<T, Ctx>(
  spec: DetailSpec<T, Ctx>,
  item: T,
  ctx: Ctx,
): ReactNode {
  if (spec.getValue !== undefined && spec.renderFriendly !== undefined) {
    return spec.renderFriendly(spec.getValue(item, ctx), item, ctx);
  }
  if (spec.render !== undefined) {
    return spec.render(item, ctx);
  }
  return '—';
}

function shouldHideMainRow<T, Ctx>(
  spec: DetailSpec<T, Ctx>,
  item: T,
  ctx: Ctx,
): boolean {
  if (!spec.hideIfEmpty) return false;
  if (spec.getValue !== undefined) {
    return isEmptyDetailValue(spec.getValue(item, ctx));
  }
  return false;
}

function shouldHideAdvancedRow<T, Ctx>(
  spec: DetailSpec<T, Ctx>,
  item: T,
  ctx: Ctx,
): boolean {
  if (!spec.hideIfEmpty) return false;
  if (spec.getValue !== undefined) {
    return isEmptyDetailValue(spec.getValue(item, ctx));
  }
  return false;
}

function resolveAdvancedValue<T, Ctx>(
  spec: DetailSpec<T, Ctx>,
  item: T,
  ctx: Ctx,
): ReactNode {
  if (spec.getValue !== undefined) {
    const value = spec.getValue(item, ctx);
    if (spec.renderRaw !== undefined) {
      return spec.renderRaw(value, item, ctx) ?? '—';
    }
    return defaultDetailRawRender(value);
  }
  if (spec.render !== undefined) {
    return spec.render(item, ctx) ?? '—';
  }
  return '—';
}

export const buildDetailItemsFromSpecs = <T, Ctx>(
  specs: DetailSpec<T, Ctx>[],
  item: T,
  ctx: Ctx,
  options?: BuildDetailItemsFromSpecsOptions,
): { label: ReactNode; value?: ReactNode }[] => {
  const section = options?.section ?? 'main';
  const viewer = options?.viewer;

  return specs
    .filter((spec) => !spec.hidden?.(item))
    .filter((spec) => placementMatches(spec.placement, section))
    .filter((spec) => {
      if (section !== 'meta') return true;
      return metaAudienceAllows(spec.metaAudience, viewer);
    })
    .filter((spec) => {
      if (section !== 'advanced') return true;
      return advancedAudienceAllows(spec.rawAudience, viewer);
    })
    .filter((spec) => {
      if (section === 'advanced') return !shouldHideAdvancedRow(spec, item, ctx);
      return !shouldHideMainRow(spec, item, ctx);
    })
    .sort((a, b) => a.order - b.order)
    .map((spec) => ({
      label: spec.label,
      value:
        section === 'advanced'
          ? resolveAdvancedValue(spec, item, ctx) ?? '—'
          : resolveMainValue(spec, item, ctx) ?? '—',
    }));
};
