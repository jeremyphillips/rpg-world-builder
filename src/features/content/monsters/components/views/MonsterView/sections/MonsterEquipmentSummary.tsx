import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { Monster } from '@/features/content/monsters/domain/types';
import { getMonsterEquipmentSummaryParts } from '@/features/content/monsters/domain/details/display';

export type MonsterEquipmentSummaryProps = {
  monster: Monster;
};

export default function MonsterEquipmentSummary({ monster }: MonsterEquipmentSummaryProps) {
  const { weapons, armor } = getMonsterEquipmentSummaryParts(monster.mechanics?.equipment);

  if (!weapons && !armor) {
    return (
      <Typography variant="body2" component="div">
        —
      </Typography>
    );
  }

  return (
    <Stack spacing={0.75} component="div">
      {weapons ? (
        <Typography variant="body2" component="div">
          <strong>Weapons:</strong> {weapons}
        </Typography>
      ) : null}
      {armor ? (
        <Typography variant="body2" component="div">
          <strong>Armor:</strong> {armor}
        </Typography>
      ) : null}
    </Stack>
  );
}
