import type { SpellSummary } from '../repo/spellRepo';
import { getMagicSchoolDisplayName } from '@/features/content/shared/domain/vocab/magicSchools.vocab';
import { formatSpellLevelShort } from '../spellPresentation';

export type FilterOption = { label: string; value: string };

/** Build school options from current items. */
export function buildSchoolOptions(items: SpellSummary[]): FilterOption[] {
  const schools = [...new Set(items.map((i) => i.school))].sort();
  return [
    { label: 'All', value: '' },
    ...schools.map((s) => ({ label: getMagicSchoolDisplayName(s), value: s })),
  ];
}

/** Build level options from current items. */
export function buildLevelOptions(items: SpellSummary[]): FilterOption[] {
  const levels = [...new Set(items.map((i) => i.level))].sort((a, b) => a - b);
  return [
    { label: 'All', value: '' },
    ...levels.map((l) => ({
      label: formatSpellLevelShort(l),
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
  const byId = classesById ?? {};
  const allowedClassIds = classIds.filter((id) => id in byId);
  return allowedClassIds.map((id) => ({
    label: classesById?.[id]?.name ?? id,
    value: id,
  }));
}
