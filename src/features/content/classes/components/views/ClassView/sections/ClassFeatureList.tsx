import type { ClassFeature } from '@/features/content/classes/domain/types/progression.types';
import { NamedEntryList } from '@/features/content/shared/components';

export type ClassFeatureListProps = {
  features: ClassFeature[] | undefined;
};

/** Level-ordered class feature names + descriptions (`NamedEntryList`). */
export default function ClassFeatureList({ features }: ClassFeatureListProps) {
  const list = features ?? [];
  if (!list.length) return '—';

  const sorted = [...list].sort(
    (a, b) =>
      a.level - b.level ||
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  );

  return (
    <NamedEntryList
      items={sorted.map((f) => ({
        id: f.id,
        name: f.name,
        callout: `Level ${f.level}`,
        description: f.description?.trim() ? f.description : undefined,
      }))}
    />
  );
}
