import type { AppDataGridColumn } from '@/ui/patterns';
import { ABILITIES } from '@/features/mechanics/domain/character';
import type { SkillProficiencyListRow } from './skillProficiencyList.types';

const ABILITY_ID_TO_ABBREV = Object.fromEntries(
  ABILITIES.map((a) => [a.id, a.id.toUpperCase()]),
) as Record<string, string>;

function abilityToAbbrev(abilityId: string | undefined): string {
  if (!abilityId) return '—';
  return ABILITY_ID_TO_ABBREV[abilityId] ?? '—';
}

export function buildSkillProficiencyCustomColumns(
  classesById: Record<string, { name?: string }> | undefined,
): AppDataGridColumn<SkillProficiencyListRow>[] {
  return [
    {
      field: 'ability',
      headerName: 'Ability',
      width: 100,
      valueFormatter: (v) => abilityToAbbrev(v as string | undefined),
    },
    // {
    //   field: 'tags',
    //   headerName: 'Tags',
    //   width: 180,
    //   valueFormatter: (v) => {
    //     const arr = (v as string[] | undefined) ?? [];
    //     return arr.length > 0 ? arr.join(', ') : '—';
    //   },
    // },
    {
      field: 'suggestedClasses',
      headerName: 'Suggested for Class',
      flex: 1,
      minWidth: 200,
      valueFormatter: (v) => {
        const byId = classesById ?? {};
        const allowedIds = ((v as string[] | undefined) ?? []).filter((id) => id in byId);
        if (!allowedIds.length) return '—';
        return allowedIds.map((id) => byId[id]?.name ?? id).join(', ');
      },
    },
  ];
}
