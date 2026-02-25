import { Chip } from '@mui/material'
import { StatusBadge } from '@/ui/badges/StatusBadge/StatusBadge'
import type { StatusType } from '@/shared/types'

export interface CardBadgeProps {
  type: 'status' | 'tag' | 'role'
  value: string
}

const CardBadge = ({ type, value }: CardBadgeProps) => {
  if (type === 'status') {
    return <StatusBadge status={value as StatusType} size="small" />
  }
  return (
    <Chip
      label={value}
      size="small"
      variant="outlined"
      sx={{ textTransform: type === 'role' ? 'capitalize' : undefined }}
    />
  )
}

export { CardBadge }
