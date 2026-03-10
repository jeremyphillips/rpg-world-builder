import { AppAvatar } from '@/ui/primitives'

interface CharacterAvatarProps {
  characterId?: string
  name?: string
  imageUrl?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

const CharacterAvatar = ({ name, imageUrl, size = 'md' }: CharacterAvatarProps) => (
  <AppAvatar src={imageUrl} name={name} size={size} />
)

export default CharacterAvatar
