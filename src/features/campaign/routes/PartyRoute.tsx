import { useAuth } from '@/app/providers/AuthProvider'
import { CampaignPartySection } from '@/features/character/components'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import GroupIcon from '@mui/icons-material/Group'

export default function PartyRoute() {
  useAuth()

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <GroupIcon color="primary" fontSize="large" />
        <Typography variant="h4">Party</Typography>
      </Stack>

      <CampaignPartySection approvalStatus="approved" />
      <CampaignPartySection approvalStatus="pending" />
    </Box>
  )
}
