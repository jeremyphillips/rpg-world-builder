import Typography from '@mui/material/Typography';

import type { Monster } from '@/features/content/monsters/domain/types';
import { formatMonsterResistancesLine } from '@/features/content/monsters/domain/details/display';

export type MonsterResistancesSummaryProps = {
  monster: Monster;
};

export default function MonsterResistancesSummary({ monster }: MonsterResistancesSummaryProps) {
  return (
    <Typography variant="body2" component="div">
      {formatMonsterResistancesLine(monster.mechanics?.resistances)}
    </Typography>
  );
}
