import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import type { AppDataGridColumn } from '@/ui/patterns';

export type BooleanGlyphTone = 'success' | 'warning' | 'default';

const TONE_COLOR: Record<BooleanGlyphTone, string> = {
  success: 'success.main',
  warning: 'warning.main',
  default: 'text.secondary',
};

/**
 * Creates a compact boolean column that shows a checkmark for true, blank for false.
 */
export function makeBooleanGlyphColumn<T>(
  field: string,
  headerName: string,
  accessor: (row: T) => boolean,
  options?: { tone?: BooleanGlyphTone },
): AppDataGridColumn<T> {
  const tone = options?.tone ?? 'default';
  const color = TONE_COLOR[tone];

  return {
    field,
    headerName,
    width: 80,
    accessor,
    renderCell: (params) =>
      params.value ? (
        <CheckCircleIcon fontSize="small" sx={{ color }} />
      ) : null,
    valueFormatter: (v) => (v ? '✓' : ''),
  };
}
