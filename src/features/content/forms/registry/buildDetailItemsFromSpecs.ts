import type { ReactNode } from 'react';
import type { DetailSpec } from './detailSpec.types';

export const buildDetailItemsFromSpecs = <T, Ctx>(
  specs: DetailSpec<T, Ctx>[],
  item: T,
  ctx: Ctx
): { label: ReactNode; value?: ReactNode }[] =>
  specs
    .filter((spec) => !spec.hidden?.(item))
    .sort((a, b) => a.order - b.order)
    .map((spec) => ({
      label: spec.label,
      value: spec.render(item, ctx) ?? '—',
    }));
