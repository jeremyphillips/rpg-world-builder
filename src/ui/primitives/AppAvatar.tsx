import { Avatar, Badge, Box } from '@mui/material'
import type { CampaignMemberStoredRole } from '@/shared'

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export interface AppAvatarProps {
  src?: string
  name?: string
  size?: AvatarSize
  shape?: 'circle' | 'rounded'
  role?: CampaignMemberStoredRole
  status?: 'online' | 'offline' | 'pending'
}

const sizeMap: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 72,
}

function getInitials(name?: string) {
  if (!name) return '?'
  const parts = name.split(' ')
  return parts.length === 1
    ? parts[0][0].toUpperCase()
    : `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export default function AppAvatar({
  src,
  name,
  size = 'md',
  shape = 'circle',
  role,
  status,
}: AppAvatarProps) {
  const dimension = sizeMap[size]

  const avatar = (
    <Avatar
      src={src}
      sx={{
        width: dimension,
        height: dimension,
        borderRadius: shape === 'rounded' ? 2 : '50%',
      }}
    >
      {!src && getInitials(name)}
    </Avatar>
  )

  return (
    <Badge
      overlap="circular"
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      badgeContent={
        role === 'dm' ? (
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: 'gold',
              border: '2px solid white',
            }}
          />
        ) : status === 'online' ? (
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: 'green',
              border: '2px solid white',
            }}
          />
        ) : null
      }
    >
      {avatar}
    </Badge>
  )
}
