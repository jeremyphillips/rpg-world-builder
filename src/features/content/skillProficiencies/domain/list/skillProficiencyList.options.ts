import type { SkillProficiencySummary } from '@/features/content/skillProficiencies/domain/types';
import { ABILITIES } from '@/features/mechanics/domain/character';
export type FilterOption = { label: string; value: string };

const ABILITY_ID_TO_ABBREV = Object.fromEntries(
  ABILITIES.map((a) => [a.id, a.id.toUpperCase()]),
) as Record<string, string>;

/** Build ability options from current items. */
export function buildAbilityOptions(items: SkillProficiencySummary[]): FilterOption[] {
  const abilities = [...new Set(items.map((i) => i.ability).filter(Boolean))].sort();
  return [
    { label: 'All', value: '' },
    ...abilities.map((a) => ({
      label: ABILITY_ID_TO_ABBREV[a] ?? a,
      value: a,
    })),
  ];
}

/** Build suggested class options from current items and catalog. */
export function buildSuggestedClassOptions(
  items: SkillProficiencySummary[],
  classesById: Record<string, { name?: string }> | undefined,
): FilterOption[] {
  const classIds = [...new Set(items.flatMap((i) => i.suggestedClasses ?? []))].sort();
  const byId = classesById ?? {};
  const allowedClassIds = classIds.filter((id) => id in byId);
  return allowedClassIds.map((id) => ({
    label: classesById?.[id]?.name ?? id,
    value: id,
  }));
}

/** Build tag options from current items. */
export function buildTagOptions(items: SkillProficiencySummary[]): FilterOption[] {
  const tags = [...new Set(items.flatMap((i) => i.tags ?? []))].sort();
  return tags.map((tag) => ({ label: tag, value: tag }));
}
