import type { SpellSummary } from '../repo/spellRepo';
import { MAGIC_SCHOOL_OPTIONS } from '@/features/content/shared/domain/vocab/magicSchools.vocab';
import { filterAllowedIds } from '@/features/content/shared/domain/utils';

export type FilterOption = { label: string; value: string };

const schoolLabel = (value: string) =>
  MAGIC_SCHOOL_OPTIONS.find((o) => o.value === value)?.label ?? value;

/** Build school options from current items. */
export function buildSchoolOptions(items: SpellSummary[]): FilterOption[] {
  const schools = [...new Set(items.map((i) => i.school))].sort();
  return [
    { label: 'All', value: '' },
    ...schools.map((s) => ({ label: schoolLabel(s), value: s })),
  ];
}

/** Build level options from current items. */
export function buildLevelOptions(items: SpellSummary[]): FilterOption[] {
  const levels = [...new Set(items.map((i) => i.level))].sort((a, b) => a - b);
  return [
    { label: 'All', value: '' },
    ...levels.map((l) => ({
      label: l === 0 ? 'Cantrip' : String(l),
      value: String(l),
    })),
  ];
}

/** Build class options from current items and catalog. */
export function buildClassOptions(
  items: SpellSummary[],
  classesById: Record<string, { name?: string }> | undefined,
): FilterOption[] {
  const classIds = [...new Set(items.flatMap((i) => i.classes ?? []))].sort();
  const allowedClassIds = filterAllowedIds(classIds, classesById ?? {}) ?? classIds;
  return allowedClassIds.map((id) => ({
    label: classesById?.[id]?.name ?? id,
    value: id,
  }));
}
