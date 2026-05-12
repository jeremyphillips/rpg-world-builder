import type { ClassContentItem } from '@/features/content/classes/domain/repo/classRepo';
import {
  ClassFeatureList,
  ClassProficienciesSummary,
  ClassProgressionSummary,
  ClassRequirementsSummary,
  SubclassOptionsSummary,
} from '@/features/content/classes/components/views/ClassView/sections';
import { contentDetailMetaSpecs, contentDetailPatchedMetaSpecs } from '@/features/content/shared/domain';
import {
  structuredMainAndAdvanced,
  type DetailSpec,
} from '@/features/content/shared/forms/registry';
import { abilityIdToName, type AbilityId } from '@/features/mechanics/domain/character';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export type ClassDetailCtx = Record<string, never>;

const primaryAbilitiesLabel = (ids: AbilityId[]): string =>
  ids?.length ? ids.map((id) => abilityIdToName(id)).join(', ') : '—';

function classAdvancedRecord(c: ClassContentItem): Record<string, unknown> {
  const scopeMeta: Record<string, unknown> =
    c.source === 'system'
      ? { systemId: c.systemId }
      : { campaignId: c.campaignId };

  return {
    id: c.id,
    name: c.name,
    source: c.source,
    patched: c.patched,
    ...scopeMeta,
    accessPolicy: c.accessPolicy,
    description: c.description,
    imageKey: c.imageKey,
    generation: c.generation,
    proficiencies: c.proficiencies,
    progression: c.progression,
    definitions: c.definitions,
    requirements: c.requirements,
  };
}

export const CLASS_DETAIL_SPECS: DetailSpec<ClassContentItem, ClassDetailCtx>[] = [
  ...contentDetailMetaSpecs<ClassContentItem, ClassDetailCtx>(),
  ...contentDetailPatchedMetaSpecs<ClassContentItem, ClassDetailCtx>(),
  {
    key: 'description',
    label: 'Description',
    order: 20,
    hidden: (c) => !c.description?.trim(),
    render: (c) => (
      <span style={{ whiteSpace: 'pre-line' }}>{c.description}</span>
    ),
  },
  {
    key: 'generation',
    label: 'Primary abilities',
    order: 30,
    render: (c) =>
      primaryAbilitiesLabel((c.generation?.primaryAbilities ?? []) as AbilityId[]),
  },
  {
    key: 'proficiencies',
    label: 'Proficiencies',
    order: 40,
    getValue: (c) => c.proficiencies,
    renderFriendly: (_v, c) => (
      <ClassProficienciesSummary proficiencies={c.proficiencies} />
    ),
    ...structuredMainAndAdvanced,
  },
  {
    key: 'progression',
    label: 'Progression',
    order: 50,
    getValue: (c) => c.progression,
    renderFriendly: (_v, c) => (
      <Stack spacing={2}>
        <ClassProgressionSummary progression={c.progression} />
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          Class features
        </Typography>
        <ClassFeatureList features={c.progression?.features} />
      </Stack>
    ),
    ...structuredMainAndAdvanced,
  },
  {
    key: 'definitions',
    label: 'Subclass',
    order: 60,
    getValue: (c) => c.definitions,
    renderFriendly: (_v, c) => (
      <SubclassOptionsSummary definitions={c.definitions} />
    ),
    ...structuredMainAndAdvanced,
  },
  {
    key: 'requirements',
    label: 'Requirements',
    order: 70,
    getValue: (c) => c.requirements,
    renderFriendly: (_v, c) => (
      <ClassRequirementsSummary requirements={c.requirements} />
    ),
    ...structuredMainAndAdvanced,
  },
  {
    key: 'classRawRecord',
    label: 'Full record (JSON)',
    order: 2000,
    placement: 'advanced',
    rawAudience: 'platformOwner',
    getValue: (c) => classAdvancedRecord(c),
  },
];
