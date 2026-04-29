import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { Monster } from '@/features/content/monsters/domain/types';

export type MonsterTraitsSummaryProps = {
  monster: Monster;
};

export default function MonsterTraitsSummary({ monster }: MonsterTraitsSummaryProps) {
  const traits = monster.mechanics?.traits;
  if (!traits?.length) return '—';

  return (
    <Stack spacing={1.5} component="div">
      {traits.map((trait) => (
        <Box key={trait.name}>
          <Typography variant="subtitle2" component="div" sx={{ fontWeight: 600 }}>
            {trait.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {trait.description}
          </Typography>
        </Box>
      ))}
    </Stack>
  );
}
