/**
 * Pure mappers for Magic Item form values ↔ domain types.
 * Registry-backed with required-field merging.
 */
import { DEFAULT_VISIBILITY_PUBLIC } from '@/ui/patterns';
import type { MagicItem, MagicItemInput } from '@/features/content/domain/types';
import type { MagicItemFormValues } from './magicItemForm.types';
import {
  buildToInput,
  buildToFormValues,
  buildDefaultFormValues,
} from '@/features/content/forms/registry';
import { MAGIC_ITEM_FORM_FIELDS } from './magicItemForm.registry';

const toInput = buildToInput(MAGIC_ITEM_FORM_FIELDS);
const toFormValuesFromItem = buildToFormValues(MAGIC_ITEM_FORM_FIELDS);
const defaultFormValues = buildDefaultFormValues(MAGIC_ITEM_FORM_FIELDS);

/**
 * Converts a MagicItem domain object to form values.
 */
export const magicItemToFormValues = (item: MagicItem): MagicItemFormValues => ({
  ...(defaultFormValues as MagicItemFormValues),
  ...toFormValuesFromItem(item),
  accessPolicy:
    (item.accessPolicy ?? DEFAULT_VISIBILITY_PUBLIC) as MagicItemFormValues['accessPolicy'],
});

/**
 * Converts form values to MagicItemInput for create/update.
 * Fully spec-driven — MAGIC_ITEM_FORM_FIELDS parse rules are the source of truth.
 */
export const toMagicItemInput = (values: MagicItemFormValues): MagicItemInput =>
  toInput(values) as MagicItemInput;
