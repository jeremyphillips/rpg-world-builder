import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

export type KeyValueItem = {
  label: ReactNode;
  value?: ReactNode;
  helperText?: ReactNode;
};

export interface KeyValueSectionProps {
  title?: ReactNode;
  items: KeyValueItem[];
  columns?: 1 | 2 | 3 | 4;
  emptyValue?: ReactNode;
  dense?: boolean;
  showDividers?: boolean;
  sx?: SxProps<Theme>;
}

const isEmptyValue = (value: ReactNode): boolean =>
  value === undefined || value === null || value === '';

const KeyValueSection = ({
  title,
  items,
  columns = 3,
  emptyValue = '—',
  dense = false,
  showDividers = false,
  sx,
}: KeyValueSectionProps) => {
  if (items.length === 0) return null;

  const gap = dense ? 1.5 : 3;
  const itemGap = dense ? 0.25 : 0.5;

  const gridTemplateColumns =
    columns === 1
      ? { xs: '1fr' }
      : columns === 2
        ? {
            xs: '1fr',
            md: 'repeat(2, minmax(0, 1fr))',
          }
        : columns === 3
          ? {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              md: 'repeat(3, minmax(0, 1fr))',
            }
          : {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              md: 'repeat(3, minmax(0, 1fr))',
              lg: 'repeat(4, minmax(0, 1fr))',
            };

  return (
    <Box sx={sx}>
      {title && (
        <Typography variant="subtitle1" sx={{ mb: dense ? 1 : 2, fontWeight: 600 }}>
          {title}
        </Typography>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns,
          gap,
        }}
      >
        {items.map((item, index) => (
          <Box key={index}>
            {showDividers && index > 0 && (
              <Divider sx={{ mb: dense ? 1 : 1.5, display: { md: 'none' } }} />
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: itemGap }}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={{ lineHeight: 1.4 }}
              >
                {item.label}
              </Typography>

              <Box sx={{ typography: dense ? 'body2' : 'body1', wordBreak: 'break-word' }}>
                {isEmptyValue(item.value) ? emptyValue : item.value}
              </Box>

              {item.helperText != null && (
                <Typography variant="caption" color="text.secondary">
                  {item.helperText}
                </Typography>
              )}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default KeyValueSection;
