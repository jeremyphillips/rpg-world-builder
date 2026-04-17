import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { Monster } from '@/features/content/monsters/domain/types';
import type { MonsterAction } from '@/features/content/monsters/domain/types/monster-actions.types';
import {
  formatMonsterActionCallout,
  resolveMonsterActionTitle,
} from '@/features/content/monsters/domain/details/display';

function MonsterActionEntry({ monster, action }: { monster: Monster; action: MonsterAction }) {
  const title = resolveMonsterActionTitle(monster, action);
  const callout = formatMonsterActionCallout(monster, action);

  const description =
    action.kind === 'special'
      ? action.description
      : action.kind === 'natural'
        ? action.notes
        : undefined;

  return (
    <Box component="article">
      <Typography variant="subtitle2" component="h3" sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      {callout ? (
        <Typography variant="body2" color="primary" sx={{ mt: 0.25 }}>
          {callout}
        </Typography>
      ) : null}
      {description ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {description}
        </Typography>
      ) : null}
    </Box>
  );
}

export type MonsterActionsSummaryProps = {
  monster: Monster;
  /** Which pool from {@link Monster.mechanics} to render. */
  kind: 'actions' | 'bonusActions';
};

export default function MonsterActionsSummary({ monster, kind }: MonsterActionsSummaryProps) {
  const pool = kind === 'actions' ? monster.mechanics?.actions : monster.mechanics?.bonusActions;
  if (!pool?.length) return '—';

  return (
    <Stack spacing={2} component="div">
      {pool.map((action, index) => (
        <MonsterActionEntry
          key={
            action.kind === 'weapon'
              ? `weapon-${action.weaponRef}-${index}`
              : action.kind === 'natural'
                ? `natural-${action.id ?? action.name ?? index}`
                : `special-${action.id ?? action.name}-${index}`
          }
          monster={monster}
          action={action}
        />
      ))}
    </Stack>
  );
}
