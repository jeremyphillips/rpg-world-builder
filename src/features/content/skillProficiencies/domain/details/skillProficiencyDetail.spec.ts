/**
 * Skill Proficiency detail spec — lists all fields for detail view.
 */
import type { SkillProficiency } from '@/features/content/shared/domain/types';
import type { DetailSpec } from '@/features/content/shared/forms/registry';
import { abilityIdToName } from '@/features/mechanics/domain/core/character/abilities.utils';

export type SkillProficiencyDetailCtx = Record<string, never>;

export const SKILL_PROFICIENCY_DETAIL_SPECS: DetailSpec<
  SkillProficiency,
  SkillProficiencyDetailCtx
>[] = [
  {
    key: 'name',
    label: 'Name',
    order: 0,
    render: (item) => item.name,
  },
  {
    key: 'ability',
    label: 'Ability',
    order: 10,
    render: (item) => abilityIdToName(item.ability),
  },
  {
    key: 'description',
    label: 'Description',
    order: 20,
    render: (item) => item.description ?? '—',
  },
  {
    key: 'suggestedClasses',
    label: 'Suggested Classes',
    order: 30,
    render: (item) =>
      Array.isArray(item.suggestedClasses) && item.suggestedClasses.length > 0
        ? item.suggestedClasses.join(', ')
        : '—',
  },
  {
    key: 'examples',
    label: 'Examples',
    order: 40,
    render: (item) =>
      Array.isArray(item.examples) && item.examples.length > 0
        ? item.examples.join('; ')
        : '—',
  },
  {
    key: 'tags',
    label: 'Tags',
    order: 50,
    render: (item) =>
      Array.isArray(item.tags) && item.tags.length > 0
        ? item.tags.join(', ')
        : '—',
  },
];
