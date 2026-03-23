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
  status?: 'pending' | 'approved'
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
  const badges: CardBadgeProps[] = status ? [{ type: 'status', value: status }] : []

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
