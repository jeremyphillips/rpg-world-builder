import type { ReactNode } from 'react';

import { defaultDetailRawRender, isEmptyDetailValue } from './detailSpec.helpers';
import type { DetailSpec } from './detailSpec.types';

export type BuildDetailItemsFromSpecsOptions = {
  section?: 'main' | 'advanced';
  /** Required for advanced audience checks (`rawAudience: 'platformOwner'`). */
  viewer?: { isPlatformAdmin: boolean };
};

function placementMatches(
  placement: DetailSpec<unknown, unknown>['placement'],
  section: 'main' | 'advanced',
): boolean {
  const p = placement ?? 'main';
  if (section === 'main') {
    return p === 'main' || p === 'both';
  }
  return p === 'advanced' || p === 'both';
}

function advancedAudienceAllows(
  rawAudience: DetailSpec<unknown, unknown>['rawAudience'],
  viewer: BuildDetailItemsFromSpecsOptions['viewer'],
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
      if (section !== 'advanced') return true;
      return advancedAudienceAllows(spec.rawAudience, viewer);
    })
    .filter((spec) => {
      if (section === 'main') return !shouldHideMainRow(spec, item, ctx);
      return !shouldHideAdvancedRow(spec, item, ctx);
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
