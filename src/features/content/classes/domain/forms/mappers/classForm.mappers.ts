/**
 * Pure mappers for Class form values ↔ domain types.
 * Registry-backed.
 */
import type { CharacterClass } from '@/features/content/classes/domain/types';
import type { Subclass } from '@/features/content/classes/domain/types/subclass.types';
import { DEFAULT_VISIBILITY_PUBLIC } from '@/ui/patterns';
import type { ClassFormValues, ClassInput } from '../types/classForm.types';
import {
  buildToInput,
  buildToFormValues,
} from '@/features/content/shared/forms/registry';
import {
  mergePreserveExtras,
  tagRowsWithIds,
} from '@/features/content/shared/forms/assembly/mergePreserveExtras';
import { CLASS_FORM_FIELDS } from '../registry/classForm.registry';
import { CLASS_FORM_DEFAULTS } from '../config/classForm.config';

const SUBCLASS_OPTION_OWNED_KEYS = ['id', 'name', 'description'] as const satisfies readonly (
  keyof Subclass & string
)[];

const toInput = buildToInput(CLASS_FORM_FIELDS);
const toFormValuesFromItem = buildToFormValues(CLASS_FORM_FIELDS);

function trimStr(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

/**
 * Converts domain subclass option rows → form rows, carrying stable `__rowId`s for merges.
 *
 * Rows are tagged with ids so save-time merge can preserve `features` and other MVP extras.
 */
function definitionsOptionsToFormRows(
  options: ReadonlyArray<Subclass & { __rowId?: string }> | undefined
): ClassFormValues['definitionsOptions'] {
  if (!options?.length) return [];
  const tagged = tagRowsWithIds(options as readonly Record<string, unknown>[]);
  return tagged.map((row, i) => {
    const sourceRow = options[i];
    const fallbackId = (row as { __rowId: string }).__rowId;
    const stableId = sourceRow.__rowId ?? fallbackId;
    return {
      __rowId: stableId,
      id: sourceRow.id ?? '',
      name: sourceRow.name ?? '',
      description: sourceRow.description ?? '',
    };
  });
}

/**
 * Tag structured `definitions.options` rows with transient `__rowId`s for editing/patch merges.
 *
 * Memoize once per loaded entry on the edit route (same pattern as {@link tagMonsterForEditing}).
 */
export function tagClassForEditing(charClass: CharacterClass): CharacterClass {
  const def = charClass.definitions;
  if (!def?.options?.length) return charClass;
  const taggedOptions = tagRowsWithIds(def.options as readonly Record<string, unknown>[]) as Subclass[];
  return {
    ...charClass,
    definitions: {
      ...def,
      options: taggedOptions,
    },
  };
}

/**
 * Converts a CharacterClass domain object to form values.
 */
export const classToFormValues = (
  charClass: CharacterClass & { accessPolicy?: ClassFormValues['accessPolicy'] }
): ClassFormValues => ({
  ...(CLASS_FORM_DEFAULTS as ClassFormValues),
  ...toFormValuesFromItem(charClass as CharacterClass & Record<string, unknown>),
  accessPolicy: (charClass.accessPolicy ?? DEFAULT_VISIBILITY_PUBLIC) as ClassFormValues['accessPolicy'],
  definitionsId: charClass.definitions?.id ?? '',
  definitionsName: charClass.definitions?.name ?? '',
  definitionsSelectionLevel:
    charClass.definitions?.selectionLevel != null && Number.isFinite(charClass.definitions.selectionLevel)
      ? String(charClass.definitions.selectionLevel)
      : '',
  definitionsOptions: definitionsOptionsToFormRows(charClass.definitions?.options),
});

/**
 * Converts form values to ClassInput for create/update.
 *
 * `original` is required for subclass option rows whose domain carries fields (e.g. `features`)
 * the form does not author yet (`mergePreserveExtras`).
 */
export const toClassInput = (
  values: ClassFormValues,
  original?: CharacterClass | undefined
): ClassInput => {
  const base = toInput(values) as ClassInput;

  const id = trimStr(values.definitionsId);
  const name = trimStr(values.definitionsName);
  const lvlRaw = trimStr(values.definitionsSelectionLevel);
  let selectionLevel: number | null = null;
  if (lvlRaw !== '') {
    const n = Number(lvlRaw);
    selectionLevel = Number.isFinite(n) ? n : null;
  }

  const mergedOptions = Array.isArray(values.definitionsOptions)
    ? mergePreserveExtras(
        values.definitionsOptions,
        original?.definitions?.options as
          | ReadonlyArray<Subclass & { __rowId?: string }>
          | undefined,
        SUBCLASS_OPTION_OWNED_KEYS
      )
    : [];

  const shouldIncludeDefinitions =
    id !== '' ||
    name !== '' ||
    selectionLevel !== null ||
    mergedOptions.length > 0;

  const definitions: CharacterClass['definitions'] = shouldIncludeDefinitions
    ? {
        id: id || 'subclass_selection',
        name: name || 'Subclass',
        selectionLevel,
        options: mergedOptions,
      }
    : undefined;

  return {
    ...base,
    definitions,
  };
};
