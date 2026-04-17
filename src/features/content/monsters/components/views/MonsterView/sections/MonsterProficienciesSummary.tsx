import Typography from '@mui/material/Typography';

import type { Monster } from '@/features/content/monsters/domain/types';
import { formatMonsterProficienciesSummary } from '@/features/content/monsters/domain/details/display';

export type MonsterProficienciesSummaryProps = {
  monster: Monster;
};

export default function MonsterProficienciesSummary({ monster }: MonsterProficienciesSummaryProps) {
  return (
    <Typography variant="body2" component="div">
      {formatMonsterProficienciesSummary(monster)}
    </Typography>
  );
}
