/**
 * Magic Item form field registry — single source of truth for config + mapping.
 */
import type { MagicItem, MagicItemInput } from '@/features/content/domain/types';
import { getBaseContentFieldSpecs } from '@/features/content/forms/baseFieldSpecs';
import {
  MAGIC_ITEM_SLOT_OPTIONS,
  MAGIC_ITEM_RARITY_OPTIONS,
} from '@/features/content/domain/vocab';
import { type FieldSpec } from '@/features/content/forms/registry';
import type { MagicItemFormValues } from './magicItemForm.types';

const parseEffects = (v: unknown): MagicItemInput['effects'] => {
  if (v === '' || v == null) return undefined;
  const s = typeof v === 'string' ? v.trim() : String(v);
  if (!s) return undefined;
  try {
    const parsed = JSON.parse(s);
    return Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
};
const formatEffects = (v: unknown): string =>
  v != null && Array.isArray(v)
    ? JSON.stringify(v, null, 2)
    : '[]';

export const MAGIC_ITEM_FORM_FIELDS = [
  ...getBaseContentFieldSpecs<
    MagicItemFormValues,
    MagicItemInput & Record<string, unknown>,
    MagicItem & Record<string, unknown>
  >(),
  {
    name: 'slot',
    label: 'Slot',
    kind: 'select',
    required: true,
    options: MAGIC_ITEM_SLOT_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
    placeholder: 'Select slot',
    defaultValue: '' as MagicItemFormValues['slot'],
    parse: (v) => (v ? (v as MagicItemInput['slot']) : undefined),
    format: (v) => (v ?? '') as MagicItemFormValues['slot'],
  },
  {
    name: 'rarity',
    label: 'Rarity',
    kind: 'select',
    required: true,
    options: MAGIC_ITEM_RARITY_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
    placeholder: 'Select rarity',
    defaultValue: '' as MagicItemFormValues['rarity'],
    parse: (v) => (v ? (v as MagicItemInput['rarity']) : undefined),
    format: (v) => (v ?? '') as MagicItemFormValues['rarity'],
  },
  {
    name: 'requiresAttunement',
    label: 'Requires Attunement',
    kind: 'checkbox',
    defaultValue: false,
    parse: (v) => Boolean(v),
    format: (v) => Boolean(v ?? false),
    formatForDisplay: (v) => (v ? 'Yes' : 'No'),
  },
  {
    name: 'effects',
    label: 'Effects (JSON array)',
    kind: 'json',
    placeholder: '[{ "kind": "bonus", "target": "attack", "value": 1 }]',
    defaultValue: '[]',
    minRows: 3,
    maxRows: 8,
    parse: parseEffects,
    format: formatEffects,
  },
] as const satisfies readonly FieldSpec<
  MagicItemFormValues,
  MagicItemInput & Record<string, unknown>,
  MagicItem & Record<string, unknown>
>[];
