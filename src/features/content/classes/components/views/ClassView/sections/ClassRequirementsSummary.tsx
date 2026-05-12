import type { ReactNode } from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { ClassRequirement } from '@/features/content/classes/domain/types/requirements.types';

export type ClassRequirementsSummaryProps = {
  requirements: ClassRequirement | undefined;
};

export default function ClassRequirementsSummary({ requirements }: ClassRequirementsSummaryProps) {
  if (!requirements) return '—';

  const rows: ReactNode[] = [];

  rows.push(
    <Typography key="races" variant="body2">
      <strong>Races:</strong>{' '}
      {requirements.allowedRaces === 'all'
        ? 'All races'
        : `${requirements.allowedRaces.length} restricted (${requirements.allowedRaces.join(', ')})`}
    </Typography>,
  );

  rows.push(
    <Typography key="align" variant="body2">
      <strong>Alignments:</strong>{' '}
      {requirements.allowedAlignments === 'any'
        ? 'Any'
        : `${requirements.allowedAlignments.length} restricted (${requirements.allowedAlignments.join(', ')})`}
    </Typography>,
  );

  if (requirements.multiclassing) {
    const note =
      typeof requirements.multiclassing.note === 'string'
        ? requirements.multiclassing.note.trim()
        : '';
    const branches =
      Array.isArray(requirements.multiclassing.anyOf) && requirements.multiclassing.anyOf.length > 0;
    rows.push(
      <Typography key="mc" variant="body2">
        <strong>Multiclass:</strong>{' '}
        {note || (branches ? 'Prerequisites expressed as ability checks' : '(configured)')}{' '}
        {branches ? `(${requirements.multiclassing.anyOf.length} OR-branch(es))` : ''}
      </Typography>,
    );
  }

  if (requirements.minStats) {
    const note =
      typeof requirements.minStats.note === 'string' ? requirements.minStats.note.trim() : '';
    rows.push(
      <Typography key="min" variant="body2">
        <strong>Min stats gate:</strong> {note || 'Configured'}{' '}
        {Array.isArray(requirements.minStats.anyOf) && requirements.minStats.anyOf.length > 0
          ? `(${requirements.minStats.anyOf?.length ?? 0} OR-branch(es))`
          : ''}
      </Typography>,
    );
  }

  if (requirements.generationNotes?.length) {
    rows.push(
      <Typography key="gn" variant="body2">
        <strong>Generation notes:</strong> {requirements.generationNotes.length}
      </Typography>,
    );
  }

  return <Stack spacing={0.85}>{rows}</Stack>;
}
