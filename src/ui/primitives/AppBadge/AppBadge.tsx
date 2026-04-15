import React from 'react';
import Chip, { type ChipProps } from '@mui/material/Chip';
import type { SxProps, Theme } from '@mui/material/styles';
import type { AppBadgeTone } from '@/ui/types';

export interface AppBadgeProps {
  label: React.ReactNode;
  tone?: AppBadgeTone;
  variant?: ChipProps['variant'];
  size?: 'small' | 'medium';
  icon?: React.ReactElement;
  /** When set, shows a dismiss control (e.g. filter / tag badges). */
  onDelete?: ChipProps['onDelete'];
  sx?: SxProps<Theme>;
}

const toneToChipColor: Record<AppBadgeTone, ChipProps['color']> = {
  default: 'default',
  primary: 'primary',
  info: 'info',
  success: 'success',
  warning: 'warning',
  danger: 'error',
};

export const AppBadge = ({
  label,
  tone = 'default',
  variant = 'outlined',
  size = 'small',
  icon,
  onDelete,
  sx,
}: AppBadgeProps) => {
  return (
    <Chip
      icon={icon}
      label={label}
      size={size}
      color={toneToChipColor[tone]}
      variant={variant}
      onDelete={onDelete}
      sx={sx}
    />
  );
};

export default AppBadge;