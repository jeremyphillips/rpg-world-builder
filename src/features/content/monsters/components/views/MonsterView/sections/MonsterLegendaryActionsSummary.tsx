import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { Monster } from '@/features/content/monsters/domain/types';
import {
  formatMonsterLegendaryActionsLines,
  formatMonsterLegendaryHeaderSummary,
} from '@/features/content/monsters/domain/details/display';

export type MonsterLegendaryActionsSummaryProps = {
  monster: Monster;
};

export default function MonsterLegendaryActionsSummary({ monster }: MonsterLegendaryActionsSummaryProps) {
  const block = monster.mechanics?.legendaryActions;
  if (!block?.actions?.length) return '—';

  const header = formatMonsterLegendaryHeaderSummary(block);
  const lines = formatMonsterLegendaryActionsLines(monster, block);

  return (
    <Stack spacing={1} component="div">
      <Typography variant="body2" color="text.secondary">
        {header}
      </Typography>
      <Box component="ul" sx={{ m: 0, pl: 2.25 }}>
        {lines.map((line, i) => (
          <Box key={i} component="li" sx={{ mb: 0.75, '&:last-child': { mb: 0 } }}>
            <Typography variant="body2">{line}</Typography>
          </Box>
        ))}
      </Box>
    </Stack>
  );
}
