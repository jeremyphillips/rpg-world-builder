import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { Monster } from '@/features/content/monsters/domain/types';
import type { MonsterLegendaryAction } from '@/features/content/monsters/domain/types/monster-legendary.types';
import type { MonsterAction } from '@/features/content/monsters/domain/types/monster-actions.types';
import {
  formatMonsterActionCallout,
  formatMonsterLegendaryHeaderSummary,
} from '@/features/content/monsters/domain/details/display';
import NamedEntryList, {
  type NamedEntry,
} from '@/features/content/shared/components/detail/NamedEntryList';

function formatLegendaryCost(cost: MonsterLegendaryAction['cost']): string {
  return cost != null && cost !== 1 ? ` (${cost} actions)` : '';
}

function legendaryEntryToNamedEntry(monster: Monster, entry: MonsterLegendaryAction, index: number): NamedEntry {
  const costSuffix = formatLegendaryCost('cost' in entry ? entry.cost : undefined);

  if (entry.kind === 'reference') {
    return {
      id: `legendary-ref-${entry.actionId}-${index}`,
      name: `${entry.name}${costSuffix}`,
    };
  }

  const inner = entry.action as MonsterAction;
  const callout = formatMonsterActionCallout(monster, inner);
  const description =
    inner.kind === 'special' ? inner.description : inner.kind === 'natural' ? inner.notes : undefined;

  return {
    id: `legendary-inline-${entry.name}-${index}`,
    name: `${entry.name}${costSuffix}`,
    callout,
    description,
  };
}

export type MonsterLegendaryActionsSummaryProps = {
  monster: Monster;
};

export default function MonsterLegendaryActionsSummary({ monster }: MonsterLegendaryActionsSummaryProps) {
  const block = monster.mechanics?.legendaryActions;
  if (!block?.actions?.length) return '—';

  const header = formatMonsterLegendaryHeaderSummary(block);
  const items: NamedEntry[] = block.actions.map((entry, index) =>
    legendaryEntryToNamedEntry(monster, entry, index),
  );

  return (
    <Stack spacing={1.25} component="div">
      <Typography variant="body2" color="text.secondary">
        {header}
      </Typography>
      <Box component="div">
        <NamedEntryList items={items} spacing={1.75} />
      </Box>
    </Stack>
  );
}
