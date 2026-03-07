import { HorizontalCompactCard } from '@/ui/patterns'
import type { CardBadgeProps } from '@/ui/primitives'
import type { CharacterClassInfo } from '../../domain/types'
import type { RaceId } from '@/features/content/shared/domain/types'

interface CharacterHorizontalCardProps {
  characterId: string
  name: string
  race?: RaceId
  classes?: CharacterClassInfo[]
  imageUrl?: string
  status?: 'pending' | 'approved'
  campaign?: { id: string; name: string }
  link?: string
  isEditable?: boolean
  onEdit?: () => void
  actions?: React.ReactNode
}

const CharacterHorizontalCard = ({
  characterId,
  name,
  race,
  classes,
  imageUrl,
  campaign,
  status,
  link,
  isEditable,
  onEdit,
  actions,
}: CharacterHorizontalCardProps) => {

  const classLine =
    Array.isArray(classes) && classes.length > 0
      ? classes
          .filter((c) => c && c.classId) // ensure class and classId are present
          .map((c) => {
            const className = c.classId ?? '';
            const levelStr = c.level ? `Level ${c.level}` : '';
            return levelStr ? `${className}, ${levelStr}` : className;
          })
          .join(' / ')
      : undefined;

  const subheadline = [race, classLine]
    .filter(Boolean)
    .join(' · ')

  const badges: CardBadgeProps[] = [
    ...(status ? [{ type: 'status', value: status }] : []),
    ...(campaign ? [{ type: 'tag', value: `Campaign: ${campaign.name}` }] : []),
  ] as CardBadgeProps[]

  return (
    <HorizontalCompactCard
      image={imageUrl}
      headline={name}
      subheadline={subheadline}
      badges={badges}
      link={link ?? `/characters/${characterId}`}
      isEditable={isEditable}
      onEdit={onEdit}
      actions={actions}
    />
  )
}

export default CharacterHorizontalCard
