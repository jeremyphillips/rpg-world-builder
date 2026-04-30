/**
 * Pure mappers for Class form values ↔ domain types.
 * Registry-backed.
 */
import type { CharacterClass } from '@/features/content/classes/domain/types';
import type {
  ClassFeature,
  ClassProgression,
  AttackProgression,
  SpellcastingAbility,
} from '@/features/content/classes/domain/types/progression.types';
import type { Subclass } from '@/features/content/classes/domain/types/subclass.types';
import type { AbilityId } from '@/features/mechanics/domain/character';
import { DEFAULT_VISIBILITY_PUBLIC } from '@/ui/patterns';
import { DIE_FACES, type DieFace } from '@/shared/domain/dice';
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

const FEATURE_OWNED_KEYS = ['id', 'level', 'name', 'description'] as const satisfies readonly (
  keyof ClassFeature & string
)[];

const toInput = buildToInput(CLASS_FORM_FIELDS);
const toFormValuesFromItem = buildToFormValues(CLASS_FORM_FIELDS);

function trimStr(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function parseHitDie(formValue: string, fallback: DieFace): DieFace {
  const n = Number(formValue);
  return DIE_FACES.includes(n as DieFace) ? (n as DieFace) : fallback;
}

/** Comma-/space-separated positive integers → ASI tier levels. */
function parseAsiLevels(raw: unknown): number[] | undefined {
  const s = typeof raw === 'string' ? raw.trim() : '';
  if (!s) return undefined;
  const nums = s
    .split(/[\s,]+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => Number(p))
    .filter((n) => Number.isFinite(n) && Number.isInteger(n) && n > 0);
  return nums.length > 0 ? nums : undefined;
}

function progressionFeaturesToFormRows(
  features: ReadonlyArray<ClassFeature & { __rowId?: string }> | undefined
): ClassFormValues['progressionFeatures'] {
  if (!features?.length) return [];
  const tagged = tagRowsWithIds(features as readonly Record<string, unknown>[]);
  return tagged.map((row, i) => {
    const sourceRow = features[i];
    const fallbackId = (row as { __rowId: string }).__rowId;
    const stableId = sourceRow.__rowId ?? fallbackId;
    return {
      __rowId: stableId,
      id: sourceRow.id ?? '',
      level: Number.isFinite(sourceRow.level) ? String(sourceRow.level) : '',
      name: sourceRow.name ?? '',
      description: sourceRow.description ?? '',
    };
  });
}

function normalizeMergedClassFeatures(rows: ClassFeature[]): ClassFeature[] {
  return rows.map((row) => {
    const lvRaw = row.level as unknown;
    const n = typeof lvRaw === 'string' ? Number(lvRaw) : lvRaw;
    const level = typeof n === 'number' && Number.isFinite(n) ? n : 0;
    return { ...row, level };
  });
}

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
 * Tag structured repeatable rows (`definitions.options`, `progression.features`) for editing merges.
 *
 * Memoize once per loaded entry on the edit route (same pattern as monster traits).
 */
export function tagClassForEditing(charClass: CharacterClass): CharacterClass {
  let out: CharacterClass = charClass;

  const def = out.definitions;
  if (def?.options?.length) {
    const taggedOptions = tagRowsWithIds(def.options as readonly Record<string, unknown>[]) as Subclass[];
    out = {
      ...out,
      definitions: {
        ...def,
        options: taggedOptions,
      },
    };
  }

  const prog = out.progression;
  if (prog?.features?.length) {
    const taggedFeats = tagRowsWithIds(
      prog.features as readonly Record<string, unknown>[]
    ) as ClassFeature[];
    out = {
      ...out,
      progression: {
        ...prog,
        features: taggedFeats,
      },
    };
  }

  return out;
}

/**
 * Converts a CharacterClass domain object to form values.
 */
export const classToFormValues = (
  charClass: CharacterClass & { accessPolicy?: ClassFormValues['accessPolicy'] }
): ClassFormValues => {
  const p = charClass.progression;

  const savingThrows =
    Array.isArray(p?.savingThrows) && p.savingThrows.length > 0
      ? ([...p.savingThrows] as AbilityId[])
      : ([] as AbilityId[]);

  return {
    ...(CLASS_FORM_DEFAULTS as ClassFormValues),
    ...toFormValuesFromItem(charClass as CharacterClass & Record<string, unknown>),
    accessPolicy: (charClass.accessPolicy ?? DEFAULT_VISIBILITY_PUBLIC) as ClassFormValues['accessPolicy'],
    progressionHitDie:
      p?.hitDie != null && DIE_FACES.includes(p.hitDie as DieFace) ? String(p.hitDie) : '8',
    progressionAttackProgression: (p?.attackProgression ?? 'good') as AttackProgression,
    progressionSpellcasting: (p?.spellcasting ?? 'none') as SpellcastingAbility,
    progressionSavingThrows: savingThrows,
    progressionAsiLevels: Array.isArray(p?.asiLevels) ? p!.asiLevels!.join(', ') : '',
    progressionExtraAttackLevel:
      p?.extraAttackLevel != null && Number.isFinite(p.extraAttackLevel)
        ? String(p.extraAttackLevel)
        : '',
    progressionFeatures: progressionFeaturesToFormRows(p?.features),

    definitionsId: charClass.definitions?.id ?? '',
    definitionsName: charClass.definitions?.name ?? '',
    definitionsSelectionLevel:
      charClass.definitions?.selectionLevel != null &&
      Number.isFinite(charClass.definitions.selectionLevel)
        ? String(charClass.definitions.selectionLevel)
        : '',
    definitionsOptions: definitionsOptionsToFormRows(charClass.definitions?.options),
  };
};

/**
 * Converts form values to ClassInput for create/update.
 *
 * `original` is required where merge-preserved repeatable rows (`definitions.options`,
 * `progression.features`) carry domain fields the MVP form does not author yet.
 */
export const toClassInput = (
  values: ClassFormValues,
  original?: CharacterClass | undefined
): ClassInput => {
  const base = toInput(values) as ClassInput;

  const baseProg = original?.progression ?? {};

  const mergedFeaturesRaw = Array.isArray(values.progressionFeatures)
    ? mergePreserveExtras<ClassFeature>(
        values.progressionFeatures as ReadonlyArray<
          ClassFeature & { __rowId?: string } & Record<string, unknown>
        >,
        original?.progression?.features as ReadonlyArray<ClassFeature & { __rowId?: string }> | undefined,
        FEATURE_OWNED_KEYS
      )
    : [];

  const normalizedFeatures = normalizeMergedClassFeatures(mergedFeaturesRaw);

  const xlRaw = trimStr(values.progressionExtraAttackLevel);

  const progression: ClassProgression = {
    ...baseProg,
  };

  progression.hitDie = parseHitDie(
    trimStr(values.progressionHitDie),
    (((baseProg as ClassProgression).hitDie ?? 8) as DieFace)
  );

  progression.attackProgression = (trimStr(values.progressionAttackProgression) ||
    baseProg.attackProgression ||
    'good') as AttackProgression;

  const st = values.progressionSavingThrows;
  if (Array.isArray(st) && st.length > 0) {
    progression.savingThrows = [...st];
  } else {
    delete progression.savingThrows;
  }

  progression.spellcasting = (trimStr(values.progressionSpellcasting) ||
    baseProg.spellcasting ||
    'none') as SpellcastingAbility;

  const asi = parseAsiLevels(values.progressionAsiLevels);
  if (asi && asi.length > 0) progression.asiLevels = asi;
  else delete progression.asiLevels;

  if (xlRaw !== '') {
    const n = Number(xlRaw);
    if (Number.isFinite(n)) progression.extraAttackLevel = n;
    else delete progression.extraAttackLevel;
  } else {
    delete progression.extraAttackLevel;
  }

  if (normalizedFeatures.length > 0) progression.features = normalizedFeatures;
  else delete progression.features;

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
    progression,
  };
};
