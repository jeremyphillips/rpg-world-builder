import { MediaTopCard } from '@/ui/patterns'
import type { CardBadgeProps } from '@/ui/primitives'
import type { CharacterClassInfo } from '@/shared/types'
import Box from '@mui/material/Box'
import PersonIcon from '@mui/icons-material/Person'
import { ROUTES } from '@/app/routes'
import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider'
import { useCampaignRules } from '@/app/providers/CampaignRulesProvider'

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

function formatClassesAndLevel(
  classes: CharacterClassInfo[],
  classesById: Record<string, { name: string }>,
): string {
  if (!Array.isArray(classes)) return '';
  return classes
    .map(cls => `${classesById[cls.classId]?.name ?? cls.classId}, Lvl ${cls.level}`)
    .join(' / ');
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
  const { catalog } = useCampaignRules()
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

  const raceName = catalog.racesById[raceId]?.name ?? raceId
  
  const npcLink = (npcId: string) =>
    activeCampaignId ? ROUTES.WORLD_NPC.replace(':id', activeCampaignId).replace(':npcId', npcId) : undefined

  return (
    <MediaTopCard
      image={imageUrl}
      imageFallback={placeholder}
      headline={name}
      subheadline={formatClassesAndLevel(classes, catalog.classesById)}
      description={raceName}
      link={npcLink(characterId)}
      badges={badges}
    />
  )
}


export default NpcMediaTopCard