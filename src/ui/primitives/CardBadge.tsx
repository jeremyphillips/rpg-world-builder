import { AppBadge } from '@/ui/primitives'
import { StatusBadge } from '@/ui/patterns'
import type { StatusType } from '@/shared/types/status'

export interface CardBadgeProps {
  type: 'status' | 'tag' | 'role'
  value: string
}

const CardBadge = ({ type, value }: CardBadgeProps) => {
  if (type === 'status') {
    return <StatusBadge status={value as StatusType} size="small" />
  }
  return (
    <AppBadge
      label={value}
      variant="outlined"
      size="small"
      sx={type === 'role' ? { textTransform: 'capitalize' } : undefined}
    />
  )
}

export default CardBadge
