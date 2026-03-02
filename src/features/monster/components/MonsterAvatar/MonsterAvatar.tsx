import { AppAvatar } from '@/ui/primitives'

interface MonsterAvatarProps {
  monsterId?: string
  name?: string
  imageUrl?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

const MonsterAvatar = ({ name, imageUrl, size = 'md' }: MonsterAvatarProps) => (
  <AppAvatar src={imageUrl} name={name} size={size} />
)

export default MonsterAvatar
