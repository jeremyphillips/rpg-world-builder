import { MediaTopCard, type CardBadgeItem } from '@/ui/cards'
import type { CharacterClassInfo } from '@/shared/types'
import Box from '@mui/material/Box'
import PersonIcon from '@mui/icons-material/Person'
import { getNameById } from '@/utils'
import { classes as classesData } from '@/data/classes'
import { races as racesData } from '@/data/races'
import type { Race } from '@/data/types'
import { ROUTES } from '@/app/routes'
import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider'

interface NpcMediaTopCardProps {
  characterId: string
  name: string
  race: string
  classes: CharacterClassInfo[]
  description?: string
  imageUrl?: string
  status?: 'pending' | 'approved'
  attribution?: string | { name: string; imageUrl?: string }
  link?: string
  // isEditable?: boolean
  // onEdit?: () => void
  actions?: React.ReactNode
}

const formatClassesAndLevelToString = (classes: CharacterClassInfo[]): string => {
  return Array.isArray(classes) ? classes.map(cls => `${getNameById(classesData as unknown as { id: string; name: string }[], cls.classId)}, Lvl ${cls.level}`).join(' / ') : ''
}

// const formatNpcSubheadline = (
//   race: string,
//   classes: CharacterClassInfo[]
// ): string => {
//   const parts: string[] = []

//   if (race) parts.push(npc.race)

//   const primaryClass = npc.classes?.[0]
//   if (primaryClass?.classId) {
//     const cls = getById(classes as unknown as { id: string; name: string }[], primaryClass.classId)
//     const className = cls?.name ?? primaryClass.classId
//     const total = npc.totalLevel ?? primaryClass.level
//     const suffix = npc.classes.length > 1 ? ` (${total})` : ''
//     parts.push(`${className} ${primaryClass.level}${suffix}`)
//   }

//   if (npc.alignment) {
//     const alignment = standardAlignments.find((a) => a.id === npc.alignment)
//     parts.push(alignment?.name ?? (npc.alignment === 'tn' ? 'True Neutral' : npc.alignment))
//   }

//   return parts.filter(Boolean).join(' · ')
// }

const NpcMediaTopCard = ({
  characterId,
  classes,
  race: raceId,
  name,
  link,
  imageUrl,
  status,
}: NpcMediaTopCardProps) => {
  const { campaignId: activeCampaignId } = useActiveCampaign()
  const badges: CardBadgeItem[] = status ? [{ type: 'status', value: status }] : []

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

  const raceName = getNameById(racesData as Race[], raceId)
  
  const npcLink = (npcId: string) =>
    activeCampaignId ? ROUTES.WORLD_NPC.replace(':id', activeCampaignId).replace(':npcId', npcId) : undefined

  return (
    <MediaTopCard
      image={imageUrl}
      imageFallback={placeholder}
      headline={name}
      subheadline={formatClassesAndLevelToString(classes)}
      description={raceName}
      link={npcLink(characterId)}
      badges={badges}
    />
  )
}


export default NpcMediaTopCard