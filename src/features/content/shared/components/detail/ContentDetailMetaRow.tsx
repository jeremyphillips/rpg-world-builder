import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export type ContentDetailMetaItem = {
  label: ReactNode;
  value?: ReactNode;
};

export type ContentDetailMetaRowProps = {
  items: ContentDetailMetaItem[];
};

/**
 * Compact inline metadata under the detail page header (not KeyValueSection).
 * Each label/value cluster stays on one line where practical; clusters wrap as a row.
 */
export default function ContentDetailMetaRow({ items }: ContentDetailMetaRowProps) {
  if (items.length === 0) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        columnGap: 2,
        rowGap: 0.75,
        mb: 4,
      }}
    >
      {items.map((item, i) => {
        const showLabel = item.label != null && item.label !== '';
        return (
          <Box
            key={i}
            component="span"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: showLabel ? 0.75 : 0,
              maxWidth: '100%',
              whiteSpace: 'nowrap',
            }}
          >
            {showLabel ? (
              <Typography component="span" variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                {item.label}
              </Typography>
            ) : null}
            <Box
              component="span"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                minWidth: 0,
                typography: 'body2',
              }}
            >
              {item.value ?? '—'}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
