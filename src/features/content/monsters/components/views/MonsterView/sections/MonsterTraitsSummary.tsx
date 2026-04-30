import { NamedEntryList } from '@/features/content/shared/components';
import type { Monster } from '@/features/content/monsters/domain/types';

export type MonsterTraitsSummaryProps = {
  monster: Monster;
};

export default function MonsterTraitsSummary({ monster }: MonsterTraitsSummaryProps) {
  const traits = monster.mechanics?.traits;
  if (!traits?.length) return '—';

  return (
    <NamedEntryList
      items={traits.map((trait) => ({
        id: trait.name,
        name: trait.name,
        description: trait.description,
      }))}
    />
  );
}
