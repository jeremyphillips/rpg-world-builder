import Typography from '@mui/material/Typography';

import type { Monster } from '@/features/content/monsters/domain/types';
import { formatMonsterImmunitiesLine } from '@/features/content/monsters/domain/details/display';

export type MonsterImmunitiesSummaryProps = {
  monster: Monster;
};

export default function MonsterImmunitiesSummary({ monster }: MonsterImmunitiesSummaryProps) {
  return (
    <Typography variant="body2" component="div">
      {formatMonsterImmunitiesLine(monster.mechanics?.immunities)}
    </Typography>
  );
}
