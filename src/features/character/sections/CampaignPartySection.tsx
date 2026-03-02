import { useCampaignParty } from '@/features/campaign/hooks'
import { resolveImageUrl } from '@/utils/image'
import { CharacterMediaTopCard } from '@/features/character/cards'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import { AppAlert } from '@/ui/primitives'

export interface CampaignPartySectionProps {
  status?: 'pending' | 'approved'
}

export default function CampaignPartySection({
  status = 'approved'
}: CampaignPartySectionProps) {
  const {
    party: approvedPartyCharacters,
    loading: approvedPartyCharactersLoading,
  } = useCampaignParty(status)

  const heading = status === 'approved' ? 'Active party members' : 'Pending party members'

  return (
    <>
      <h3>{heading}</h3>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: 2,
        }}
      >
        {approvedPartyCharactersLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : approvedPartyCharacters.length === 0 ? (
          <AppAlert tone="info">No {status} characters in this campaign.</AppAlert>
        ) : (
          approvedPartyCharacters.map((char) => (
            <CharacterMediaTopCard
              key={char._id}
              characterId={char._id}
              name={char.name}
              race={char.race}
              class={char.class}
              level={char.level}
              imageUrl={resolveImageUrl(char.imageKey)}
              status={char.status}
              attribution={{ name: char.ownerName, imageUrl: char.ownerAvatarUrl }}
              link={`/characters/${char._id}`}
            />
          ))
        )}
      </Box>
    </>
  )
}
