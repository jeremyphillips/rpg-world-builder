import { useCampaignParty } from '@/features/campaign/hooks'
import { CharacterMediaTopCard } from '@/features/character/components'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import { AppAlert } from '@/ui/primitives'

export type CampaignPartyApprovalStatus = 'pending' | 'approved'

export type CampaignPartyPresenceStatus = 'here' | 'not_here' | 'unknown'

export interface CampaignPartySectionProps {
  /** Which campaign party members to load (membership approval on the roster). */
  approvalStatus?: CampaignPartyApprovalStatus
  /**
   * Optional live presence overlay for characters already in this section.
   * Omitted keys and `'unknown'` mean no presence badge and normal opacity.
   */
  presenceByCharacterId?: Record<string, CampaignPartyPresenceStatus>
}

function presenceToIsPresent(p: CampaignPartyPresenceStatus | undefined): boolean | undefined {
  if (p === undefined || p === 'unknown') return undefined
  return p === 'here'
}

function presenceCardOpacity(p: CampaignPartyPresenceStatus | undefined): number {
  return p === 'not_here' ? 0.45 : 1
}

export default function CampaignPartySection({
  approvalStatus = 'approved',
  presenceByCharacterId,
}: CampaignPartySectionProps) {
  const {
    party: approvedPartyCharacters,
    loading: approvedPartyCharactersLoading,
  } = useCampaignParty(approvalStatus)

  const heading =
    approvalStatus === 'approved' ? 'Active party members' : 'Pending party members'

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
          <AppAlert tone="info">No {approvalStatus} characters in this campaign.</AppAlert>
        ) : (
          approvedPartyCharacters.map((char) => {
            const presence = presenceByCharacterId?.[char.id]
            const isPresent = presenceToIsPresent(presence)
            return (
              <Box
                key={char.id}
                sx={{
                  opacity: presenceCardOpacity(presence),
                  transition: 'opacity 0.2s ease',
                }}
              >
                <CharacterMediaTopCard
                  characterId={char.id}
                  name={char.name}
                  race={char.race?.name ?? '—'}
                  classes={char.classes}
                  imageUrl={char.imageUrl ?? undefined}
                  status={char.status}
                  isPresent={isPresent}
                  attribution={{ name: char.ownerName, imageUrl: char.ownerAvatarUrl ?? undefined }}
                  link={`/characters/${char.id}`}
                />
              </Box>
            )
          })
        )}
      </Box>
    </>
  )
}
