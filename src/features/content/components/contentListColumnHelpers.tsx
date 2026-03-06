import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import type { AppDataGridColumn } from '@/ui/patterns';

/**
 * Creates a compact boolean column that shows a checkmark for true, blank for false.
 */
export function makeBooleanGlyphColumn<T>(
  field: string,
  headerName: string,
  accessor: (row: T) => boolean,
): AppDataGridColumn<T> {
  return {
    field,
    headerName,
    width: 80,
    accessor,
    renderCell: (params) =>
      params.value ? (
        <CheckCircleIcon fontSize="small" sx={{ color: 'success.main' }} />
      ) : null,
    valueFormatter: (v) => (v ? '✓' : ''),
  };
}
