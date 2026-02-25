import { Chip } from '@mui/material'
import type { ChipProps } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import CancelIcon from '@mui/icons-material/Cancel'
import type { StatusType } from '@/shared/types'

interface StatusBadgeProps {
  status: StatusType
  size?: 'small' | 'medium'
  variant?: ChipProps['variant']
}

export function StatusBadge({
  status,
  size = 'small',
  variant = 'filled',
}: StatusBadgeProps) {
  const config: Record<
    StatusType,
    { label: string; color: ChipProps['color']; icon?: React.ReactElement }
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

  const { label, color, icon } = config[status]

  return (
    <Chip
      label={label}
      color={color}
      size={size}
      variant={variant}
      {...(icon && { icon })}
    />
  )
}
