import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { Monster } from '@/features/content/monsters/domain/types';
import { getMonsterProficienciesSummaryParts } from '@/features/content/monsters/domain/details/display';

export type MonsterProficienciesSummaryProps = {
  monster: Monster;
};

export default function MonsterProficienciesSummary({ monster }: MonsterProficienciesSummaryProps) {
  const { skills, saves, weapons } = getMonsterProficienciesSummaryParts(monster);

  if (!skills && !saves && !weapons) {
    return (
      <Typography variant="body2" component="div">
        —
      </Typography>
    );
  }

  return (
    <Stack spacing={0.75} component="div">
      {skills ? (
        <Typography variant="body2" component="div">
          <strong>Skills:</strong> {skills}
        </Typography>
      ) : null}
      {saves ? (
        <Typography variant="body2" component="div">
          <strong>Saves:</strong> {saves}
        </Typography>
      ) : null}
      {weapons ? (
        <Typography variant="body2" component="div">
          <strong>Weapons:</strong> {weapons}
        </Typography>
      ) : null}
    </Stack>
  );
}
