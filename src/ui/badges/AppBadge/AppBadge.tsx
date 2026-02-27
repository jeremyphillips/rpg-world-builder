import { Chip } from '@mui/material'
import type { ChipProps } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'

export type AppBadgeTone =
  | 'default'
  | 'primary'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'

export interface AppBadgeProps {
  label: React.ReactNode
  tone?: AppBadgeTone
  variant?: ChipProps['variant']
  size?: 'small' | 'medium'
  icon?: React.ReactElement
  sx?: SxProps<Theme>
}

const toneToChipColor: Record<AppBadgeTone, ChipProps['color']> = {
  default: 'default',
  primary: 'primary',
  info: 'info',
  success: 'success',
  warning: 'warning',
  danger: 'error',
}

const AppBadge = ({
  label,
  tone = 'default',
  variant = 'outlined',
  size = 'small',
  icon,
  sx,
}: AppBadgeProps) => (
  <Chip
    label={label}
    color={toneToChipColor[tone]}
    variant={variant}
    size={size}
    {...(icon && { icon })}
    {...(sx && { sx })}
  />
)

export { AppBadge }
