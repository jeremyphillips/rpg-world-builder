import type { AlertProps } from '@mui/material/Alert'

export type AppAlertTone =
  | 'default'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'

const toneToSeverity: Record<AppAlertTone, AlertProps['severity']> = {
  default: 'info',
  info: 'info',
  success: 'success',
  warning: 'warning',
  danger: 'error',
}

export function mapAppAlertToneToMuiSeverity(tone: AppAlertTone): AlertProps['severity'] {
  return toneToSeverity[tone]
}
