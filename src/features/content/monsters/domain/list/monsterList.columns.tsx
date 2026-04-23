import Box from '@mui/material/Box';
import type { AppDataGridColumn } from '@/ui/patterns';
import type { MonsterListRow } from './monsterList.types';
import type { MonsterAction } from '@/features/content/monsters/domain/types';
import {
  formatHitPointsWithAverage,
  formatMonsterArmorClassBreakdown,
} from '@/features/content/monsters/utils/formatters';
import { calculateMonsterArmorClass } from '../mechanics/calculateMonsterArmorClass';
import type { CreatureArmorCatalogEntry } from '@/features/mechanics/domain/equipment/armorClass';
import { getMonsterTypeDisplayName } from '@/features/content/monsters/domain/details/display/monsterTaxonomyDisplay';
import { AppTooltip } from '@/ui/primitives';

function getActionsDisplay(actions?: MonsterAction[]): string {
  if (!actions?.length) return '—';
  return actions
    .map((a) => (a.kind === 'weapon' ? a.weaponRef : a.name ?? '—'))
    .join(', ');
}

function getBonusActionsDisplay(bonusActions?: MonsterAction[]): string {
  if (!bonusActions?.length) return '—';
  return bonusActions
    .map((b) => (b.kind === 'weapon' ? b.weaponRef : b.name ?? '—'))
    .join(', ');
}

function getTraitsDisplay(traits?: { name: string }[]): string {
  if (!traits?.length) return '—';
  return traits.map((t) => t.name).join(', ');
}

export function buildMonsterCustomColumns(
  armorById: Record<string, CreatureArmorCatalogEntry>,
): AppDataGridColumn<MonsterListRow>[] {
  return [
    {
      field: 'monsterType',
      headerName: 'Type',
      width: 120,
      accessor: (row) => getMonsterTypeDisplayName(row.type),
    },
    {
      field: 'hitPoints',
      headerName: 'Hit Points',
      width: 120,
      accessor: (row) => {
        const hp = row.mechanics?.hitPoints;
        return hp ? formatHitPointsWithAverage(hp) : '—';
      },
    },
    {
      field: 'armorClass',
      headerName: 'Armor Class',
      width: 100,
      type: 'number',
      accessor: (row) => calculateMonsterArmorClass(row, armorById).value,
      renderCell: (params) => {
        const row = params.row as MonsterListRow;
        const armorClass = calculateMonsterArmorClass(row, armorById);

        return (
          <AppTooltip title={formatMonsterArmorClassBreakdown(armorClass)}>
            <Box component="span">{String(armorClass.value)}</Box>
          </AppTooltip>
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      minWidth: 120,
      accessor: (row) => getActionsDisplay(row.mechanics?.actions),
    },
    {
      field: 'bonusActions',
      headerName: 'Bonus Actions',
      flex: 1,
      minWidth: 120,
      accessor: (row) => getBonusActionsDisplay(row.mechanics?.bonusActions),
    },
    {
      field: 'traits',
      headerName: 'Traits',
      flex: 1,
      minWidth: 120,
      accessor: (row) => getTraitsDisplay(row.mechanics?.traits),
    },
    {
      field: 'challengeRating',
      headerName: 'CR',
      width: 100,
      accessor: (row) => row.lore.challengeRating ? 
        `${row.lore.challengeRating.toString()}` : '—',
        // (XP: ${row.lore.xpValue?.toLocaleString()})
    },
    // {
    //   field: 'equipment',
    //   headerName: 'Equipment',
    //   flex: 1,
    //   minWidth: 120,
    //   accessor: getEquipmentDisplay,
    // },
  ];
}
