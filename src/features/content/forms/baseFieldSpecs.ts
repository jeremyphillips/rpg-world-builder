/**
 * Shared base FieldSpecs for all content types (name, description, imageKey, accessPolicy).
 * Single source of truth — add/remove a base field once, apply everywhere.
 */
import { DEFAULT_VISIBILITY_PUBLIC } from '@/ui/patterns';
import type { ContentFormValues, ContentInput } from '@/features/content/domain/types';
import type { FieldSpec } from '@/features/content/forms/registry';

const trim = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
const trimOrNull = (v: unknown): string | null => (trim(v) ? trim(v) : null);
const strOrEmpty = (v: unknown): string => (v != null ? String(v) : '');

/**
 * Returns base field specs for name, description, imageKey, accessPolicy.
 * Typed for any content form that extends ContentFormValues.
 */
export function getBaseContentFieldSpecs<
  TValues extends ContentFormValues,
  TInput extends ContentInput & Record<string, unknown>,
  TItem extends Record<string, unknown>,
>(): FieldSpec<TValues, TInput, TItem>[] {
  return [
    {
      name: 'name' as keyof TValues & string,
      label: 'Name',
      kind: 'text',
      required: true,
      placeholder: 'Item name',
      defaultValue: '' as TValues['name'],
      parse: (v) => trim(v) as TInput['name'],
      format: (v) => strOrEmpty(v) as TValues['name'],
    },
    {
      name: 'description' as keyof TValues & string,
      label: 'Description',
      kind: 'textarea',
      placeholder: 'Describe the item...',
      defaultValue: '' as TValues['description'],
      parse: (v) => (trim(v) || undefined) as TInput['description'],
      format: (v) => strOrEmpty(v) as TValues['description'],
    },
    {
      name: 'imageKey' as keyof TValues & string,
      label: 'Image',
      kind: 'imageUpload',
      helperText: '/assets/... or CDN key',
      defaultValue: '' as TValues['imageKey'],
      parse: (v) => trimOrNull(v) as TInput['imageKey'],
      format: (v) => strOrEmpty(v) as TValues['imageKey'],
    },
    {
      name: 'accessPolicy' as keyof TValues & string,
      label: 'Visibility',
      kind: 'visibility',
      skipInForm: true,
      defaultValue: DEFAULT_VISIBILITY_PUBLIC as TValues['accessPolicy'],
      parse: (v) => (v ?? DEFAULT_VISIBILITY_PUBLIC) as TInput['accessPolicy'],
      format: (v) => (v ?? DEFAULT_VISIBILITY_PUBLIC) as TValues['accessPolicy'],
    },
  ];
}
