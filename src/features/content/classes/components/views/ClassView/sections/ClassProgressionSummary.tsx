import type { ReactNode } from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { ClassProgression } from '@/features/content/classes/domain/types/progression.types';
import type { AbilityId } from '@/features/mechanics/domain/character';
import { abilityIdToName } from '@/features/mechanics/domain/character';

export type ClassProgressionSummaryProps = {
  progression: ClassProgression | undefined;
};

function attackProgressionLabel(v: ClassProgression['attackProgression']): string {
  if (v === 'good') return 'Good';
  if (v === 'average') return 'Average';
  return 'Poor';
}

function spellcastingLabel(v: NonNullable<ClassProgression['spellcasting']>): string {
  const labels = {
    full: 'Full caster',
    half: 'Half caster',
    pact: 'Pact magic',
    none: 'None',
  } as const;
  return labels[v];
}

/** Non-feature progression facts (hit die, saves, caster tier, ASI tiers, Extra Attack). */
export default function ClassProgressionSummary({
  progression: p,
}: ClassProgressionSummaryProps) {
  if (!p) return <Typography variant="body2">—</Typography>;

  const rows: ReactNode[] = [];
  if (p.hitDie != null) {
    rows.push(
      <Typography key="hit" variant="body2">
        <strong>Hit die:</strong> d{p.hitDie}
        {typeof p.hpPerLevel === 'number' ? (
          <>
            {' '}
            <Typography component="span" variant="caption" color="text.secondary">
              (+{p.hpPerLevel}/level flat HP variant)
            </Typography>
          </>
        ) : null}
      </Typography>
    );
  }
  rows.push(
    <Typography key="atk" variant="body2">
      <strong>Attack:</strong> {attackProgressionLabel(p.attackProgression)}
    </Typography>
  );
  if (p.savingThrows?.length) {
    rows.push(
      <Typography key="st" variant="body2">
        <strong>Saving throws:</strong>{' '}
        {(p.savingThrows as AbilityId[]).map((id) => abilityIdToName(id)).join(', ')}
      </Typography>
    );
  }
  if (p.spellcasting != null && p.spellcasting !== 'none') {
    rows.push(
      <Typography key="sp" variant="body2">
        <strong>Spellcasting:</strong> {spellcastingLabel(p.spellcasting)}
      </Typography>
    );
  }
  if (p.asiLevels?.length) {
    rows.push(
      <Typography key="asi" variant="body2">
        <strong>ASI levels:</strong> {p.asiLevels.join(', ')}
      </Typography>
    );
  }
  if (p.extraAttackLevel != null) {
    rows.push(
      <Typography key="xa" variant="body2">
        <strong>Extra Attack:</strong> level {p.extraAttackLevel}
      </Typography>
    );
  }

  return <Stack spacing={0.75}>{rows}</Stack>;
}
