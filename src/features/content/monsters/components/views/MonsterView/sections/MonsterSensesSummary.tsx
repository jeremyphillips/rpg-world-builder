import Typography from '@mui/material/Typography';

import type { Monster } from '@/features/content/monsters/domain/types';
import { formatMonsterSensesLine } from '@/features/content/monsters/domain/details/display';

export type MonsterSensesSummaryProps = {
  monster: Monster;
};

export default function MonsterSensesSummary({ monster }: MonsterSensesSummaryProps) {
  return (
    <Typography variant="body2" component="div">
      {formatMonsterSensesLine(monster.mechanics?.senses)}
    </Typography>
  );
}
