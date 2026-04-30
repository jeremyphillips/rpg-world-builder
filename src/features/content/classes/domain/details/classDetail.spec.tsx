import type { ClassContentItem } from '@/features/content/classes/domain/repo/classRepo';
import {
  ClassFeatureList,
  ClassProgressionSummary,
  SubclassOptionsSummary,
} from '@/features/content/classes/components/views/ClassView/sections';
import type { ClassProficiencies } from '@/features/content/classes/domain/types/proficiencies.types';
import type { ClassRequirement } from '@/features/content/classes/domain/types/requirements.types';
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

function classProficienciesFriendly(p: ClassProficiencies): string {
  const lines: string[] = [];
  const sk = p.skills;
  lines.push(
    `Skills: choose ${sk.choose} at level ${sk.level}${
      sk.from?.length ? ` (${sk.from.length} suggested options)` : ''
    }`,
  );

  const w = p.weapons;
  if (w.categories?.length) {
    lines.push(`Weapons: ${w.categories.join(', ')} (level ${w.level})`);
  } else if (w.items?.length) {
    lines.push(`Weapons: ${w.items.length} specific (level ${w.level})`);
  } else {
    lines.push(`Weapons: ${w.type} (level ${w.level})`);
  }

  const a = p.armor;
  if (a.categories?.length) {
    lines.push(`Armor: ${a.categories.join(', ')} (level ${a.level})`);
  } else {
    lines.push(`Armor: ${a.type} (level ${a.level})`);
  }

  if (p.tools?.items?.length) {
    lines.push(`Tools: ${p.tools.items.join(', ')}`);
  }

  return lines.join('\n');
}

function classRequirementsFriendly(r: ClassRequirement): string {
  const lines: string[] = [];
  lines.push(
    r.allowedRaces === 'all' ? 'Races: All' : `Races: ${r.allowedRaces.length} specific`,
  );
  lines.push(
    r.allowedAlignments === 'any'
      ? 'Alignments: Any'
      : `Alignments: ${r.allowedAlignments.length} allowed`,
  );
  if (r.minStats) {
    lines.push('Ability prerequisites: yes');
  }
  if (r.multiclassing) {
    lines.push('Multiclassing: prerequisites apply');
  }
  if (r.generationNotes?.length) {
    lines.push(`Notes: ${r.generationNotes.length}`);
  }
  return lines.join('\n');
}

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
    render: (c) => (
      <span style={{ whiteSpace: 'pre-line' }}>
        {classProficienciesFriendly(c.proficiencies)}
      </span>
    ),
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
    render: (c) => (
      <span style={{ whiteSpace: 'pre-line' }}>
        {classRequirementsFriendly(c.requirements)}
      </span>
    ),
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
