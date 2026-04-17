import Typography from '@mui/material/Typography';

import type { Monster } from '@/features/content/monsters/domain/types';
import { formatMonsterEquipmentSummary } from '@/features/content/monsters/domain/details/display';

export type MonsterEquipmentSummaryProps = {
  monster: Monster;
};

export default function MonsterEquipmentSummary({ monster }: MonsterEquipmentSummaryProps) {
  return (
    <Typography variant="body2" component="div">
      {formatMonsterEquipmentSummary(monster.mechanics?.equipment)}
    </Typography>
  );
}
