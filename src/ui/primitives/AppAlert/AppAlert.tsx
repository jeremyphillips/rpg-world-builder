import React from 'react';
import Alert, { type AlertProps } from '@mui/material/Alert';
import type { SxProps, Theme } from '@mui/material/styles';

import { mapAppAlertToneToMuiSeverity, type AppAlertTone } from '../appTone';

export type { AppAlertTone };

export interface AppAlertProps {
  children: React.ReactNode;
  tone?: AppAlertTone;
  variant?: AlertProps['variant'];
  icon?: React.ReactNode;
  action?: React.ReactNode;
  sx?: SxProps<Theme>;
  onClose?: () => void;
}

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
      severity={mapAppAlertToneToMuiSeverity(tone)}
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