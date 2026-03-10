import type { CharacterClass } from '@/features/content/classes/domain/types';
import type { DetailSpec } from '@/features/content/shared/forms/registry';
import { abilityIdToName } from '@/features/mechanics/domain/core/character/abilities.utils';
import type { AbilityId } from '@/features/mechanics/domain/core/character/abilities.types';

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

export const CLASS_DETAIL_SPECS: DetailSpec<CharacterClass, ClassDetailCtx>[] = [
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
