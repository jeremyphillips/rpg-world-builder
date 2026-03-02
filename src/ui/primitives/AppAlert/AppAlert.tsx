import React from 'react';
import Alert, { type AlertProps } from '@mui/material/Alert';
import type { SxProps, Theme } from '@mui/material/styles';

export type AppAlertTone =
  | 'default'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger';

export interface AppAlertProps {
  children: React.ReactNode;
  tone?: AppAlertTone;
  variant?: AlertProps['variant'];
  icon?: React.ReactNode;
  action?: React.ReactNode;
  sx?: SxProps<Theme>;
  onClose?: () => void;
}

const toneToSeverity: Record<AppAlertTone, AlertProps['severity']> = {
  default: 'info',
  info: 'info',
  success: 'success',
  warning: 'warning',
  danger: 'error',
};

export const AppAlert = ({
  children,
  tone = 'info',
  variant = 'standard',
  icon,
  action,
  sx,
  onClose,
}: AppAlertProps) => {
  return (
    <Alert
      severity={toneToSeverity[tone]}
      variant={variant}
      icon={icon}
      action={action}
      sx={sx}
      onClose={onClose ? () => onClose() : undefined}
    >
      {children}
    </Alert>
  );
};

export default AppAlert;