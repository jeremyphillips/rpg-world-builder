import type { ReactNode } from 'react';
import type { PatchDriver } from '@/ui/patterns/form/patchDriver.types';
import type { FieldSpec } from './fieldSpec.types';

export type CustomFormNodeSpecContext = {
  rowPrefix: string;
  usePatchDriver: boolean;
  patchDriver: PatchDriver | null;
};

export type CustomFormNodeSpec = {
  kind: 'custom';
  /** Stable key for layout chunking / React keys */
  key: string;
  render: (ctx: CustomFormNodeSpecContext) => ReactNode;
};

/**
 * Leaf field inside a repeatable group — `name` is relative to each row (e.g. `targeting.selection`, `kind`).
 */
export type NestedFieldSpec<
  FormValues extends Record<string, unknown>,
  InputShape extends Record<string, unknown> = Record<string, unknown>,
  ItemShape extends Record<string, unknown> = Record<string, unknown>,
> = Omit<FieldSpec<FormValues, InputShape, ItemShape>, 'name'> & { name: string };

export type RepeatableGroupSpec<
  FormValues extends Record<string, unknown>,
  InputShape extends Record<string, unknown> = Record<string, unknown>,
  ItemShape extends Record<string, unknown> = Record<string, unknown>,
> = {
  kind: 'repeatable-group';
  /** Top-level form key or nested array key (e.g. `effectGroups`, `effects`). */
  name: string;
  label?: string;
  itemLabel: string;
  children: FormNodeSpec<FormValues, InputShape, ItemShape>[];
  /** Row template when appending (optional). */
  defaultItem?: Record<string, unknown>;
  /** Whole-array patch binding (domain path = array root). */
  patchBinding?: FieldSpec<FormValues, InputShape, ItemShape>['patchBinding'];
};

/**
 * Registry tree: top-level fields + nested repeatable groups.
 */
export type FormNodeSpec<
  FormValues extends Record<string, unknown>,
  InputShape extends Record<string, unknown> = Record<string, unknown>,
  ItemShape extends Record<string, unknown> = Record<string, unknown>,
> =
  | FieldSpec<FormValues, InputShape, ItemShape>
  | NestedFieldSpec<FormValues, InputShape, ItemShape>
  | RepeatableGroupSpec<FormValues, InputShape, ItemShape>
  | CustomFormNodeSpec;

export function isRepeatableGroupSpec<
  FormValues extends Record<string, unknown>,
  InputShape extends Record<string, unknown>,
  ItemShape extends Record<string, unknown>,
>(
  spec: FormNodeSpec<FormValues, InputShape, ItemShape>,
): spec is RepeatableGroupSpec<FormValues, InputShape, ItemShape> {
  return (spec as RepeatableGroupSpec<FormValues, InputShape, ItemShape>).kind === 'repeatable-group';
}

export function isCustomFormNodeSpec<
  FormValues extends Record<string, unknown>,
  InputShape extends Record<string, unknown>,
  ItemShape extends Record<string, unknown>,
>(
  spec: FormNodeSpec<FormValues, InputShape, ItemShape>,
): spec is CustomFormNodeSpec {
  return (spec as CustomFormNodeSpec).kind === 'custom';
}
