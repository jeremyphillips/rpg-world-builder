/**
 * Shared `name + description` repeatable group factory.
 *
 * Powers the MVP migration of class/monster JSON fields (traits, definitions.options,
 * progression.features, …) from textareas to structured groups while preserving
 * domain-side fields the form does not author yet.
 *
 * Each generated group:
 *  - Adds a hidden `__rowId` field so rows survive add/reorder/delete cycles and can
 *    be matched back to source rows during `mergePreserveExtras` at save time.
 *  - Renders a `name` text field (always) and a `description` textarea (unless
 *    `includeDescription === false` — used by natural attacks where the row is
 *    name-only).
 *  - Spreads any `extras` (e.g. `{ name: 'level', kind: 'numberText' }` for class
 *    features) after the standard fields.
 *  - Wires a `patchBinding` for system-patch mode that round-trips the array
 *    through `tagRowsWithIds` (load) and `mergePreserveExtras` (save), keyed by
 *    `domainPath`.
 */

import type { RepeatableGroupSpec, NestedFieldSpec } from '../registry/formNodeSpec.types';
import {
  createRowId,
  mergePreserveExtras,
  tagRowsWithIds,
} from '../assembly/mergePreserveExtras';

/**
 * Form-side row shape for `name + description` (and friends). Extra keys are
 * allowed to flow through, including domain extras passed in via `extras`.
 */
export type NamedDescriptionFormRow = {
  __rowId?: string;
  name: string;
  description?: string;
};

export type CreateNamedDescriptionGroupOptions<
  TItem extends Record<string, unknown>,
> = {
  /** Top-level form key or nested array key (RHF array name). */
  name: string;
  /** Patch driver dot-path on the domain object (e.g. `mechanics.traits`). */
  domainPath: string;
  /** Item label rendered in repeatable-group UI (e.g. "Trait"). */
  itemLabel: string;
  /** Optional group label (e.g. "Traits"). */
  label?: string;
  /** Drop the `description` field for name-only variants (e.g. natural attacks). */
  includeDescription?: boolean;
  /** Extra leaf fields rendered after `name`/`description` (e.g. `level`). */
  extras?: ReadonlyArray<NestedFieldSpec<Record<string, unknown>>>;
  /**
   * Domain-side keys the form authoritatively owns. Defaults to
   * `['name','description']` (or `['name']` when `includeDescription === false`).
   * Append extras' `name` here when those leaf fields actually edit a domain key
   * (rather than purely UI-only state).
   */
  ownedKeys?: ReadonlyArray<keyof TItem & string>;
};

/**
 * Build a repeatable-group spec for `name + description` rows.
 *
 * @param opts See {@link CreateNamedDescriptionGroupOptions}.
 */
export function createNamedDescriptionGroup<
  TItem extends Record<string, unknown> = Record<string, unknown>,
  FormValues extends Record<string, unknown> = Record<string, unknown>,
  InputShape extends Record<string, unknown> = Record<string, unknown>,
  ItemShape extends Record<string, unknown> = Record<string, unknown>,
>(
  opts: CreateNamedDescriptionGroupOptions<TItem>,
): RepeatableGroupSpec<FormValues, InputShape, ItemShape> {
  const includeDescription = opts.includeDescription !== false;

  const defaultOwned: (keyof TItem & string)[] = (
    includeDescription ? ['name', 'description'] : ['name']
  ) as (keyof TItem & string)[];
  const ownedKeys = (opts.ownedKeys ?? defaultOwned) as ReadonlyArray<
    keyof TItem & string
  >;

  const children: NestedFieldSpec<FormValues, InputShape, ItemShape>[] = [];

  children.push({
    name: '__rowId',
    label: '',
    kind: 'text',
    skipInForm: true,
    defaultValue: '' as FormValues[keyof FormValues],
  } as NestedFieldSpec<FormValues, InputShape, ItemShape>);

  children.push({
    name: 'name',
    label: 'Name',
    kind: 'text',
    required: true,
    defaultValue: '' as FormValues[keyof FormValues],
  } as NestedFieldSpec<FormValues, InputShape, ItemShape>);

  if (includeDescription) {
    children.push({
      name: 'description',
      label: 'Description',
      kind: 'textarea',
      defaultValue: '' as FormValues[keyof FormValues],
      minRows: 2,
      maxRows: 8,
    } as NestedFieldSpec<FormValues, InputShape, ItemShape>);
  }

  if (opts.extras) {
    for (const extra of opts.extras) {
      children.push(extra as NestedFieldSpec<FormValues, InputShape, ItemShape>);
    }
  }

  const defaultItem: Record<string, unknown> = {
    __rowId: '',
    name: '',
    ...(includeDescription ? { description: '' } : {}),
  };

  return {
    kind: 'repeatable-group',
    name: opts.name,
    ...(opts.label !== undefined ? { label: opts.label } : {}),
    itemLabel: opts.itemLabel,
    defaultItem,
    children,
    patchBinding: {
      domainPath: opts.domainPath,
      parse: (domainValue: unknown) => {
        if (!Array.isArray(domainValue)) return [];
        return tagRowsWithIds(domainValue as TItem[]);
      },
      /**
       * Merge form rows back over the domain source while preserving extras,
       * then re-attach each row's transient `__rowId` on the merged output.
       *
       * Keeping `__rowId` in the patch state is required so subsequent
       * `parse` cycles can match the same row again (the patch-driver
       * replaces array values wholesale, so without ids on the patch state
       * the next render mints fresh ids that no longer match anything).
       *
       * The persist boundary is responsible for stripping these transient
       * ids before saving (see `stripRowIdsDeep` and the slice mappers).
       */
      serialize: (uiValue: unknown, currentDomainValue: unknown) => {
        const formRows = Array.isArray(uiValue)
          ? (uiValue as ReadonlyArray<NamedDescriptionFormRow & Partial<TItem>>)
          : [];
        const sourceRows = Array.isArray(currentDomainValue)
          ? (currentDomainValue as ReadonlyArray<TItem & { __rowId?: string }>)
          : undefined;
        const merged = mergePreserveExtras<TItem>(formRows, sourceRows, ownedKeys);
        return merged.map((row, i) => ({
          ...row,
          __rowId: formRows[i]?.__rowId ?? createRowId(),
        }));
      },
    },
  };
}
