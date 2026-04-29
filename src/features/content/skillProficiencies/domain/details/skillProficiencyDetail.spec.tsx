/**
 * Skill Proficiency detail spec — lists all fields for detail view.
 */
import type { SkillProficiency } from '@/features/content/skillProficiencies/domain/types';
import { contentDetailMetaSpecs, contentDetailPatchedMetaSpecs } from '@/features/content/shared/domain';
import type { DetailSpec } from '@/features/content/shared/forms/registry';
import { abilityIdToName } from '@/features/mechanics/domain/character';
import { classIdToName } from '@/features/mechanics/domain/rulesets/system/classes';
import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/rulesets/ids/systemIds';

export type SkillProficiencyDetailCtx = Record<string, never>;

function skillProficiencyAdvancedRecord(item: SkillProficiency): Record<string, unknown> {
  const scopeMeta: Record<string, unknown> =
    item.source === 'system'
      ? { systemId: (item as SkillProficiency & { systemId?: string }).systemId }
      : { campaignId: (item as SkillProficiency & { campaignId?: string }).campaignId };

  return {
    id: item.id,
    name: item.name,
    source: item.source,
    patched: item.patched,
    ...scopeMeta,
    accessPolicy: item.accessPolicy,
    ability: item.ability,
    description: item.description,
    imageKey: item.imageKey,
    suggestedClasses: item.suggestedClasses,
    examples: item.examples,
    tags: item.tags,
    combatUi: item.combatUi,
  };
}

export const SKILL_PROFICIENCY_DETAIL_SPECS: DetailSpec<
  SkillProficiency,
  SkillProficiencyDetailCtx
>[] = [
  ...contentDetailMetaSpecs<SkillProficiency, SkillProficiencyDetailCtx>(),
  ...contentDetailPatchedMetaSpecs<SkillProficiency, SkillProficiencyDetailCtx>(),
  {
    key: 'ability',
    label: 'Ability',
    order: 40,
    render: (item) => abilityIdToName(item.ability),
  },
  {
    key: 'description',
    label: 'Description',
    order: 50,
    hidden: (item) => !item.description?.trim(),
    render: (item) => (
      <span style={{ whiteSpace: 'pre-line' }}>{item.description}</span>
    ),
  },
  {
    key: 'suggestedClasses',
    label: 'Suggested classes',
    order: 55,
    hidden: (item) => !item.suggestedClasses?.length,
    render: (item) =>
      item.suggestedClasses
        .map((id) => classIdToName(DEFAULT_SYSTEM_RULESET_ID, id))
        .join(', '),
  },
  {
    key: 'examples',
    label: 'Examples',
    order: 60,
    hidden: (item) => !item.examples?.length,
    render: (item) => (
      <span style={{ whiteSpace: 'pre-line' }}>{item.examples.join('\n')}</span>
    ),
  },
  {
    key: 'tags',
    label: 'Tags',
    order: 65,
    hidden: (item) => !item.tags?.length,
    render: (item) => item.tags.join(', '),
  },
  {
    key: 'combatUi',
    label: 'Combat UI',
    order: 68,
    hidden: (item) => !item.combatUi,
    render: (item) => item.combatUi?.actionId ?? '—',
  },
  {
    key: 'skillProficiencyRawRecord',
    label: 'Full record (JSON)',
    order: 2000,
    placement: 'advanced',
    rawAudience: 'platformOwner',
    getValue: (item) => skillProficiencyAdvancedRecord(item),
  },
];
