import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { Monster } from '@/features/content/monsters/domain/types';
import { ABILITIES } from '@/features/mechanics/domain/character';

export type MonsterAbilitiesSummaryProps = {
  monster: Monster;
};

/**
 * Compact STR–CHA grid for stat-block style detail.
 */
export default function MonsterAbilitiesSummary({ monster }: MonsterAbilitiesSummaryProps) {
  const scores = monster.mechanics?.abilities;
  if (!scores) return '—';

  const defined = ABILITIES.filter((a) => scores[a.id] != null);
  if (defined.length === 0) return '—';

  return (
    <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1.5}>
      {defined.map((a) => {
        const v = scores[a.id];
        return (
          <Box
            key={a.id}
            sx={{
              minWidth: 52,
              px: 1,
              py: 0.75,
              borderRadius: 1,
              bgcolor: 'action.hover',
              textAlign: 'center',
            }}
          >
            <Typography variant="caption" color="text.secondary" component="div" sx={{ lineHeight: 1.2 }}>
              {a.id.toUpperCase()}
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
              {v}
            </Typography>
          </Box>
        );
      })}
    </Stack>
  );
}

