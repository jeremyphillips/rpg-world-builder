/**
 * Builds KeyValueSection items from FieldSpecs for detail view display.
 */
import type { ReactNode } from 'react';
import type { KeyValueItem } from '@/ui/patterns';
import type { FieldSpec } from './fieldSpec.types';

export type BuildDetailItemsOptions<ItemShape extends Record<string, unknown>> = {
  /** Exclude specs from output. */
  exclude?: (
    spec: FieldSpec<Record<string, unknown>, Record<string, unknown>, ItemShape>
  ) => boolean;
  /** Override display for specific fields. Receives full item. */
  overrides?: Partial<
    Record<string, (item: ItemShape) => ReactNode>
  >;
  /** Value shown when empty. Default '—'. */
  emptyValue?: ReactNode;
};

const isEmpty = (v: unknown): boolean =>
  v === undefined || v === null || v === '';

const toDisplayValue = (value: unknown): ReactNode => {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return value as ReactNode;
};

/**
 * Builds KeyValueItem[] from FieldSpecs for a given item.
 * Uses spec.label, spec.formatForDisplay or spec.format for value.
 * Select options: displays label when options available.
 */
export const buildDetailItems = <
  FormValues extends Record<string, unknown>,
  InputShape extends Record<string, unknown>,
  ItemShape extends Record<string, unknown>,
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
    if (
      exclude?.(
        spec as FieldSpec<Record<string, unknown>, Record<string, unknown>, ItemShape>
      )
    ) {
      continue;
    }

    let value: ReactNode;
    const override = overrides?.[spec.name];

    if (override) {
      value = override(item);
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
        value = toDisplayValue(spec.format(itemValue));
      } else {
        value = toDisplayValue(itemValue);
      }
    }

    items.push({
      label: spec.label,
      value: isEmpty(value) ? emptyValue : value,
    });
  }

  return items;
};
