import Typography from '@mui/material/Typography';

import type { Monster } from '@/features/content/monsters/domain/types';
import { formatMonsterLanguagesLine } from '@/features/content/monsters/domain/details/display';

export type MonsterLanguagesSummaryProps = {
  monster: Monster;
};

export default function MonsterLanguagesSummary({ monster }: MonsterLanguagesSummaryProps) {
  return (
    <Typography variant="body2" component="div">
      {formatMonsterLanguagesLine(monster.languages)}
    </Typography>
  );
}
