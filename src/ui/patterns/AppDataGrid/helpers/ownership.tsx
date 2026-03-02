import { Stack, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import type { AppDataGridColumn, AppDataGridFilter } from '../AppDataGrid';
import { AppBadge } from '@/ui/primitives';


// ---------------------------------------------------------------------------
// Example usage
// ---------------------------------------------------------------------------
// const ownedIds = useMemo(() => new Set(viewingCharacter?.equipmentIds ?? []), [viewingCharacter]);

// const columns = useMemo(() => [
//   { field: 'name', headerName: 'Name', flex: 1, linkColumn: true },
//   { field: 'price', headerName: 'Price', width: 120 },
//   { field: 'category', headerName: 'Category', width: 160 },
//   makeOwnedColumn({ ownedIds, columnHeader: 'Owned', mode: 'icon' }),
// ], [ownedIds]);

// const filters = useMemo(() => [
//   {
//     id: 'category',
//     label: 'Category',
//     type: 'select',
//     options: CATEGORY_OPTIONS,
//     accessor: (row) => row.category,
//     defaultValue: CATEGORY_OPTIONS[0]?.value,
//   },
//   makeOwnedFilter({ ownedIds }),
// ], [ownedIds]);

// If you expect “Known”, “Prepared”, “Proficient”, “Equipped” soon, you can generalize with a single helper:
// makeMembershipColumn({ label: 'Known', ids: knownSpellIds, icon: <AutoAwesomeIcon /> })
// makeMembershipFilter({ label: 'Known', ids: knownSpellIds })
// Same pattern, different label + id set.

type OwnableRow = { id: string };

type OwnedConfig = {
  /** Set of ids owned by the viewing character/user */
  ownedIds: ReadonlySet<string>;
  /** Optional label override */
  columnHeader?: string;
  /** Optional filter label override */
  filterLabel?: string;
  /** Show a badge vs an icon-only cell */
  mode?: 'icon' | 'badge';
  /** Optional: treat "owned" as empty cell instead of explicit "No" */
  hideWhenFalse?: boolean;
};

/**
 * Column helper: adds a computed boolean column indicating ownership.
 */
export function makeOwnedColumn<T extends OwnableRow>({
  ownedIds,
  columnHeader = 'Owned',
  mode = 'icon',
  hideWhenFalse = true,
}: OwnedConfig): AppDataGridColumn<T> {
  return {
    field: 'owned',
    headerName: columnHeader,
    width: 120,
    type: 'boolean',
    accessor: (row) => ownedIds.has(row.id),
    renderCell: (_row, value) => {
      const owned = Boolean(value);

      if (!owned && hideWhenFalse) return null;

      if (mode === 'badge') {
        return owned ? <AppBadge label="Owned" tone="success" variant="outlined" /> : <AppBadge label="Not owned" tone="default" variant="outlined" />;
      }

      // icon mode
      return owned ? (
        <Stack direction="row" spacing={1} alignItems="center">
          <CheckCircleIcon fontSize="small" />
          {!hideWhenFalse && (
            <Typography variant="body2">Yes</Typography>
          )}
        </Stack>
      ) : (
        !hideWhenFalse ? <Typography variant="body2" color="text.secondary">No</Typography> : null
      );
    },
    // Optional: makes it searchable if you include 'owned' in searchColumns
    valueFormatter: (value) => (Boolean(value) ? 'owned' : 'not owned'),
  };
}

/**
 * Filter helper: adds a boolean filter: All / Owned / Not owned.
 */
export function makeOwnedFilter<T extends OwnableRow>({
  ownedIds,
  filterLabel = 'Owned',
}: OwnedConfig): AppDataGridFilter<T> {
  return {
    id: 'owned',
    label: filterLabel,
    type: 'boolean',
    defaultValue: 'all',
    accessor: (row) => ownedIds.has(row.id),
    trueLabel: 'Owned',
    falseLabel: 'Not owned',
  };
}