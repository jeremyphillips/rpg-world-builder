/**
 * Builds KeyValueSection items from FieldSpecs for detail view display.
 */
import type { ReactNode } from 'react';
import type { KeyValueItem } from '@/ui/patterns';
import type { FieldSpec } from './fieldSpec.types';

export type BuildDetailItemsOptions<ItemShape> = {
  /** Exclude specs from output. */
  exclude?: (spec: FieldSpec<unknown, unknown, ItemShape>) => boolean;
  /** Override display for specific fields. Receives full item. */
  overrides?: Partial<
    Record<string, (item: ItemShape) => ReactNode>
  >;
  /** Value shown when empty. Default '—'. */
  emptyValue?: ReactNode;
};

const isEmpty = (v: unknown): boolean =>
  v === undefined || v === null || v === '';

/**
 * Builds KeyValueItem[] from FieldSpecs for a given item.
 * Uses spec.label, spec.formatForDisplay or spec.format for value.
 * Select options: displays label when options available.
 */
export const buildDetailItems = <
  FormValues extends Record<string, unknown>,
  InputShape extends Record<string, unknown>,
  ItemShape extends object,
>(
  specs: readonly FieldSpec<FormValues, InputShape, ItemShape>[],
  item: ItemShape,
  options: BuildDetailItemsOptions<ItemShape> = {}
): KeyValueItem[] => {
  const {
    exclude,
    overrides,
    emptyValue = '—',
  } = options;

  const items: KeyValueItem[] = [];

  for (const spec of specs) {
    if (exclude?.(spec as FieldSpec<unknown, unknown, ItemShape>)) continue;

    let value: ReactNode;

    if (overrides?.[spec.name]) {
      value = overrides[spec.name](item);
    } else {
      const itemValue = (item as Record<string, unknown>)[
        spec.name as string
      ];

      if (spec.formatForDisplay) {
        value = spec.formatForDisplay(itemValue);
      } else if (spec.options && typeof itemValue === 'string') {
        const option = spec.options.find((o) => o.value === itemValue);
        value = option?.label ?? itemValue;
      } else if (spec.format) {
        value = spec.format(itemValue);
      } else {
        value = itemValue != null ? String(itemValue) : '';
      }
    }

    items.push({
      label: spec.label,
      value: isEmpty(value) ? emptyValue : value,
    });
  }

  return items;
};
