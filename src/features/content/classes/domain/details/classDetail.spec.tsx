import type { ClassContentItem } from '@/features/content/classes/domain/repo/classRepo';
import { type DetailSpec, metaAll, metaDmOrPlatformOwner } from '@/features/content/shared/forms/registry';
import { abilityIdToName, type AbilityId } from '@/features/mechanics/domain/character';
import { AppBadge } from '@/ui/primitives';
import { VisibilityBadge } from '@/ui/patterns';

export type ClassDetailCtx = Record<string, never>;

const formatJson = (v: unknown): string => {
  if (v == null) return '—';
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
};

const primaryAbilitiesLabel = (ids: AbilityId[]): string =>
  ids?.length ? ids.map((id) => abilityIdToName(id)).join(', ') : '—';

export const CLASS_DETAIL_SPECS: DetailSpec<ClassContentItem, ClassDetailCtx>[] = [
  {
    key: 'source',
    label: 'Source',
    order: 8,
    render: (c) => (
      <AppBadge
        label={c.source}
        tone={c.source === 'system' ? 'info' : 'default'}
      />
    ),
    ...metaAll,
  },
  {
    key: 'visibility',
    label: 'Visibility',
    order: 9,
    render: (c) =>
      c.accessPolicy && c.accessPolicy.scope !== 'public' ? (
        <VisibilityBadge visibility={c.accessPolicy} />
      ) : (
        'Public'
      ),
    ...metaDmOrPlatformOwner,
  },
  {
    key: 'name',
    label: 'Name',
    order: 10,
    render: (c) => c.name,
  },
  {
    key: 'description',
    label: 'Description',
    order: 20,
    render: (c) => c.description ?? '—',
  },
  {
    key: 'generation',
    label: 'Primary Abilities',
    order: 30,
    render: (c) =>
      primaryAbilitiesLabel((c.generation?.primaryAbilities ?? []) as AbilityId[]),
  },
  {
    key: 'proficiencies',
    label: 'Proficiencies',
    order: 40,
    render: (c) => formatJson(c.proficiencies),
  },
  {
    key: 'progression',
    label: 'Progression',
    order: 50,
    render: (c) => formatJson(c.progression),
  },
  {
    key: 'definitions',
    label: 'Definitions',
    order: 60,
    render: (c) => (c.definitions ? formatJson(c.definitions) : '—'),
  },
  {
    key: 'requirements',
    label: 'Requirements',
    order: 70,
    render: (c) => formatJson(c.requirements),
  },
];
