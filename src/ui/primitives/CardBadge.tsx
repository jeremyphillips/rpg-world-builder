import { AppBadge } from '@/ui/primitives'
import { StatusBadge } from '@/ui/patterns'
import type { StatusType } from '@/shared/types/status'
import type { AppToneBase } from '@/ui/types'

export interface CardBadgeProps {
  type: 'status' | 'tag' | 'role'
  value: string
  /** When set (e.g. for tags), uses AppToneBase via AppBadge. */
  tone?: AppToneBase
}

const CardBadge = ({ type, value, tone }: CardBadgeProps) => {
  if (type === 'status') {
    return <StatusBadge status={value as StatusType} size="small" />
  }
  return (
    <AppBadge
      label={value}
      tone={tone ?? 'default'}
      variant="outlined"
      size="small"
      sx={type === 'role' ? { textTransform: 'capitalize' } : undefined}
    />
  )
}

export default CardBadge
