import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import { AppAlert } from '@/ui/primitives'

import type { CharacterDoc } from '@/features/character/domain/types'
import type { PendingMembership } from '@/shared/types/campaign.types'

type CharacterAlertsProps = {
  character: CharacterDoc
  pendingMemberships: PendingMembership[]
  isOwner: boolean
  isAdmin: boolean
  ownerName?: string
  approvingId: string | null
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onBeginLevelUp: () => void
  onCancelLevelUp: () => void
}

export default function CharacterAlerts({
  character,
  pendingMemberships,
  isOwner,
  isAdmin,
  ownerName,
  approvingId,
  onApprove,
  onReject,
  onBeginLevelUp,
  onCancelLevelUp,
}: CharacterAlertsProps) {
  return (
    <>
      {/* Pending approval alerts */}
      {pendingMemberships.map((m) => (
        <AppAlert
          key={m.campaignMemberId}
          tone="warning"
          sx={{ mb: 2 }}
          action={
            <Stack direction="row" spacing={1}>
              <Button size="small" color="success" startIcon={<CheckCircleIcon />} onClick={() => onApprove(m.campaignMemberId)} disabled={approvingId !== null}>
                Approve
              </Button>
              <Button size="small" color="error" startIcon={<CancelIcon />} onClick={() => onReject(m.campaignMemberId)} disabled={approvingId !== null}>
                Reject
              </Button>
            </Stack>
          }
        >
          {character.name} is pending approval for {m.campaignName}.
        </AppAlert>
      ))}

      {/* Level-up pending banner */}
      {character.levelUpPending && character.pendingLevel && (
        <AppAlert
          tone="info"
          sx={{ mb: 2 }}
          action={
            isOwner ? (
              <Button size="small" variant="contained" onClick={onBeginLevelUp}>
                Begin Level-Up
              </Button>
            ) : undefined
          }
        >
          {isOwner ? (
            <>
              <strong>{character.name}</strong> is pending advancement to level{' '}
              <strong>{character.pendingLevel}</strong>. Complete your level-up to
              choose new features, spells, and abilities.
            </>
          ) : (
            <>
              <strong>{character.name}</strong> is pending advancement to level{' '}
              <strong>{character.pendingLevel}</strong>. Waiting for{' '}
              <strong>{ownerName ?? 'the character owner'}</strong> to complete
              the level-up process.
              {isAdmin && (
                <>
                  {' '}
                  <Typography
                    component="span"
                    variant="body2"
                    color="primary"
                    sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={onCancelLevelUp}
                  >
                    Cancel level-up
                  </Typography>
                </>
              )}
            </>
          )}
        </AppAlert>
      )}
    </>
  )
}
