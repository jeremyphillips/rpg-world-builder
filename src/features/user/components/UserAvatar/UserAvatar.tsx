import { AppAvatar } from '@/ui/primitives'
import type { CampaignMemberStoredRole } from '@/shared'

interface UserAvatarProps {
  userId?: string
  username?: string
  avatarUrl?: string
  role?: CampaignMemberStoredRole
  status?: 'online' | 'offline' | 'pending'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

const UserAvatar = ({
  username,
  avatarUrl,
  role,
  status,
  size = 'md',
}: UserAvatarProps) => (
  <AppAvatar
    src={avatarUrl}
    name={username}
    size={size}
    role={role}
    status={status}
  />
)

export default UserAvatar
