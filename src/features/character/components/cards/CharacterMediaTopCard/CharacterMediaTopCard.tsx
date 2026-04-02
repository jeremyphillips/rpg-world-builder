import { MediaTopCard } from '@/ui/patterns'
import type { CardBadgeProps } from '@/ui/primitives'
import Box from '@mui/material/Box'
import PersonIcon from '@mui/icons-material/Person'
import { formatCharacterIdentityLine } from '@/features/character/formatters'
import type { CharacterClassSummary } from '@/features/character/read-model'

interface CharacterMediaTopCardProps {
  characterId: string
  name: string
  race?: string
  classes: CharacterClassSummary[]
  description?: string
  imageUrl?: string
  /** Campaign roster approval — renders the standard pending/approved status badge. */
  status?: 'pending' | 'approved'
  /**
   * Live presence — when set, adds a Here now / Not here tag (AppToneBase) after any roster `status` badge.
   */
  isPresent?: boolean
  attribution?: string | { name: string; imageUrl?: string }
  link?: string
  isEditable?: boolean
  onEdit?: () => void
  actions?: React.ReactNode
}

const CharacterMediaTopCard = ({
  characterId,
  name,
  race,
  classes,
  description,
  imageUrl,
  status,
  isPresent,
  attribution,
  link,
  isEditable,
  onEdit,
  actions,
}: CharacterMediaTopCardProps) => {
  const classLine = formatCharacterIdentityLine(classes)
  const subheadline = [race, classLine]
    .filter(Boolean)
    .join(' · ')
  const badges: CardBadgeProps[] = []
  if (status) {
    badges.push({ type: 'status', value: status })
  }
  if (isPresent !== undefined) {
    badges.push({
      type: 'tag',
      value: isPresent ? 'Here now' : 'Not here',
      tone: isPresent ? 'success' : 'warning',
    })
  }

  const placeholder = (
    <Box
      sx={{
        height: 180,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'action.hover',
      }}
    >
      <PersonIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
    </Box>
  )

  return (
    <MediaTopCard
      image={imageUrl}
      imageFallback={placeholder}
      headline={name}
      subheadline={subheadline}
      description={description}
      badges={badges}
      attribution={attribution}
      link={link ?? `/characters/${characterId}`}
      isEditable={isEditable}
      onEdit={onEdit}
      actions={actions}
    />
  )
}

export default CharacterMediaTopCard
