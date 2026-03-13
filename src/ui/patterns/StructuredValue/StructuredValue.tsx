import type { ReactNode } from 'react';
import Box from '@mui/material/Box';

export type StructuredValueProps = {
  value: unknown;
  emptyFallback?: ReactNode;
  maxHeight?: number;
};

export default function StructuredValue({
  value,
  emptyFallback = '—',
  maxHeight = 200,
}: StructuredValueProps): ReactNode {
  if (value === undefined || value === null) return emptyFallback;

  try {
    const str = JSON.stringify(value, null, 2);
    return (
      <Box
        component="pre"
        sx={{
          m: 0,
          p: 1.5,
          bgcolor: 'action.hover',
          borderRadius: 1,
          fontSize: '0.75rem',
          fontFamily: 'monospace',
          overflow: 'auto',
          maxHeight,
        }}
      >
        {str}
      </Box>
    );
  } catch {
    return String(value);
  }
}
