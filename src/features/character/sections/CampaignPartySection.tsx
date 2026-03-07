import { useCampaignParty } from '@/features/campaign/hooks'
import { CharacterMediaTopCard } from '@/features/character/cards'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import { AppAlert } from '@/ui/primitives'

function formatClassDisplay(classes: { className: string; subclassName?: string | null }[]): string {
  if (classes.length === 0) return '—'
  return classes
    .map((c) => (c.subclassName ? `${c.className} (${c.subclassName})` : c.className))
    .join(', ')
}

function totalLevel(classes: { level: number }[]): number {
  return classes.reduce((sum, c) => sum + c.level, 0)
}

export interface CampaignPartySectionProps {
  status?: 'pending' | 'approved'
}

export default function CampaignPartySection({
  status = 'approved',
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
              key={char.id}
              characterId={char.id}
              name={char.name}
              race={char.race?.name ?? '—'}
              class={formatClassDisplay(char.classes)}
              level={totalLevel(char.classes)}
              imageUrl={char.imageUrl ?? undefined}
              status={char.status}
              attribution={{ name: char.ownerName, imageUrl: char.ownerAvatarUrl ?? undefined }}
              link={`/characters/${char.id}`}
            />
          ))
        )}
      </Box>
    </>
  )
}
