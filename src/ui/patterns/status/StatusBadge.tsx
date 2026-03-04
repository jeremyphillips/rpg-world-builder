import type { ChipProps } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import CancelIcon from '@mui/icons-material/Cancel'
import { AppBadge } from '@/ui/primitives'
import type { AppBadgeTone } from '@/ui/types'
import type { StatusType } from '@/shared/types/status'

export interface StatusBadgeProps {
  status: StatusType
  size?: 'small' | 'medium'
  variant?: ChipProps['variant']
}

const chipColorToTone: Record<string, AppBadgeTone> = {
  error: 'danger',
  warning: 'warning',
  success: 'success',
  primary: 'primary',
  default: 'default',
}

const statusConfig: Record<
  StatusType,
  { label: string; color: string; icon?: React.ReactElement }
> = {
  pending: {
    label: 'Pending',
    color: 'warning',
    icon: <HourglassEmptyIcon fontSize="small" />,
  },
  approved: {
    label: 'Approved',
    color: 'success',
    icon: <CheckCircleIcon fontSize="small" />,
  },
  rejected: {
    label: 'Rejected',
    color: 'error',
    icon: <CancelIcon fontSize="small" />,
  },
  draft: {
    label: 'Draft',
    color: 'default',
  },
  archived: {
    label: 'Archived',
    color: 'default',
  },
  active: {
    label: 'Active',
    color: 'primary',
  },
  inactive: {
    label: 'Inactive',
    color: 'default',
  },
  deceased: {
    label: 'Deceased',
    color: 'error',
    icon: <CancelIcon fontSize="small" />,
  },
}

const StatusBadge = ({
  status,
  size = 'small',
  variant = 'filled',
}: StatusBadgeProps) => {
  const { label, color, icon } = statusConfig[status]
  const tone = chipColorToTone[color] ?? 'default'

  return (
    <AppBadge label={label} tone={tone} variant={variant} size={size} icon={icon} />
  )
}

export default StatusBadge
