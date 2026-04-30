import type { Monster } from '@/features/content/monsters/domain/types';
import type { MonsterAction } from '@/features/content/monsters/domain/types/monster-actions.types';
import {
  formatMonsterActionCallout,
  resolveMonsterActionTitle,
} from '@/features/content/monsters/domain/details/display';
import NamedEntryList, {
  type NamedEntry,
} from '@/features/content/shared/components/detail/NamedEntryList';

function monsterActionToNamedEntry(monster: Monster, action: MonsterAction, index: number): NamedEntry {
  const title = resolveMonsterActionTitle(monster, action);
  const callout = formatMonsterActionCallout(monster, action);
  const description =
    action.kind === 'special'
      ? action.description
      : action.kind === 'natural'
        ? action.notes
        : undefined;
  const id =
    action.kind === 'weapon'
      ? `weapon-${action.weaponRef}-${index}`
      : action.kind === 'natural'
        ? `natural-${action.id ?? action.name ?? index}`
        : `special-${action.id ?? action.name}-${index}`;

  return {
    id,
    name: title,
    callout,
    description,
  };
}

export type MonsterActionsSummaryProps = {
  monster: Monster;
  /** Which pool from {@link Monster.mechanics} to render. */
  kind: 'actions' | 'bonusActions';
};

export default function MonsterActionsSummary({ monster, kind }: MonsterActionsSummaryProps) {
  const pool = kind === 'actions' ? monster.mechanics?.actions : monster.mechanics?.bonusActions;
  if (!pool?.length) return '—';

  const items: NamedEntry[] = pool.map((action, index) =>
    monsterActionToNamedEntry(monster, action, index),
  );

  return <NamedEntryList items={items} spacing={2} />;
}
