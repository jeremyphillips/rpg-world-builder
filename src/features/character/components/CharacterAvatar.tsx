import { AppAvatar } from '@/ui/primitives'
import { resolveContentImageUrl } from '@/shared/lib/media'

interface CharacterAvatarProps {
  characterId?: string
  name?: string
  /** Resolved URL from API (optional if `imageKey` is set). */
  imageUrl?: string
  /** Storage key or path; resolved the same way as `AppImageUploadField` / IdentityBanner. */
  imageKey?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

const CharacterAvatar = ({ name, imageUrl, imageKey, size = 'md' }: CharacterAvatarProps) => (
  <AppAvatar
    src={resolveContentImageUrl('character', imageKey ?? imageUrl)}
    name={name}
    size={size}
  />
)

export default CharacterAvatar
