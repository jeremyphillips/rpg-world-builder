import Typography from '@mui/material/Typography';

import type { Monster } from '@/features/content/monsters/domain/types';
import { formatMonsterVulnerabilitiesLine } from '@/features/content/monsters/domain/details/display';

export type MonsterVulnerabilitiesSummaryProps = {
  monster: Monster;
};

export default function MonsterVulnerabilitiesSummary({ monster }: MonsterVulnerabilitiesSummaryProps) {
  return (
    <Typography variant="body2" component="div">
      {formatMonsterVulnerabilitiesLine(monster.mechanics?.vulnerabilities)}
    </Typography>
  );
}
