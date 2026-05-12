import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { ClassProficiencies } from '@/features/content/classes/domain/types/proficiencies.types';

export type ClassProficienciesSummaryProps = {
  proficiencies: ClassProficiencies | undefined;
};

/** Detail-friendly scaffold for authoring fields (skills, weapons, armor, tools). */
export default function ClassProficienciesSummary({ proficiencies }: ClassProficienciesSummaryProps) {
  if (!proficiencies) return '—';

  const lines: string[] = [];
  const sk = proficiencies.skills;
  if (sk?.type === 'choice') {
    const fromSuffix =
      Array.isArray(sk.from) && sk.from.length ? ` (${sk.from.length} suggested)` : '';
    const pick = typeof sk.choose === 'number' && Number.isFinite(sk.choose) ? sk.choose : '—';
    lines.push(`Skills: choose ${pick} at level ${sk.level}${fromSuffix}`);
  } else {
    lines.push(`Skills: fixed grants at level ${sk?.level ?? '—'}`);
  }

  const w = proficiencies.weapons;
  const wParts = [
    `${w?.type ?? '—'} proficiency`,
    w?.categories?.length ? w.categories.join(', ') : '',
    w?.items?.length ? `${w.items.length} specific item(s)` : '',
    `level ${w?.level ?? '—'}`,
  ].filter(Boolean);
  lines.push(`Weapons: ${wParts.join(' · ')}`);

  const ar = proficiencies.armor;
  const aParts = [
    `${ar?.type ?? '—'} proficiency`,
    ar?.categories?.length ? ar.categories.join(', ') : '',
    ar?.items?.length ? `${ar.items.length} specific armor/shield ids` : '',
    ar?.disallowedMaterials?.length
      ? `exclude materials: ${ar.disallowedMaterials.join(', ')}`
      : '',
    `level ${ar?.level ?? '—'}`,
  ].filter(Boolean);
  lines.push(`Armor: ${aParts.join(' · ')}`);

  if (proficiencies.tools?.items?.length) {
    lines.push(
      `Tools: ${proficiencies.tools.items.join(', ')} (level ${proficiencies.tools.level})`,
    );
  }

  return (
    <Stack spacing={1} component="div">
      {lines.map((line, i) => (
        <Typography key={i} variant="body2" sx={{ whiteSpace: 'pre-line' }}>
          {line}
        </Typography>
      ))}
    </Stack>
  );
}
