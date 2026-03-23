import type { Dispatch, SetStateAction } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import LogoutIcon from '@mui/icons-material/Logout'
import { DRAWER_WIDTH, HEADER_HEIGHT } from '../auth-layout.constants'
import { DrawerCampaignSection } from './DrawerCampaignSection'
import { DrawerNav } from './DrawerNav'
import { DrawerUserSection } from './DrawerUserSection'
import type { Campaign } from '@/shared/types/campaign.types'

type AuthDrawerProps = {
  username: string
  avatarUrl?: string
  firstName?: string
  lastName?: string
  role: string
  pathname: string
  onSignOut: () => void
  campaigns: Campaign[]
  campaignsLoading: boolean
  activeCampaignId: string | null
  worldExpanded: boolean
  onWorldExpandedChange: Dispatch<SetStateAction<boolean>>
  onCampaignChange: (value: string) => void
  canAccessAdmin: boolean
  unreadCount: number
}

export function AuthDrawer({
  username,
  avatarUrl,
  firstName,
  lastName,
  role,
  pathname,
  onSignOut,
  campaigns,
  campaignsLoading,
  activeCampaignId,
  worldExpanded,
  onWorldExpandedChange,
  onCampaignChange,
  canAccessAdmin,
  unreadCount,
}: AuthDrawerProps) {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          bgcolor: 'var(--mui-palette-background-paper)',
          borderRight: '1px solid var(--mui-palette-divider)',
          height: `calc(100vh - ${HEADER_HEIGHT}px)`,
        },
      }}
    >
      <DrawerUserSection username={username} avatarUrl={avatarUrl} firstName={firstName} lastName={lastName} role={role} />

      <Divider />

      <List component="nav" sx={{ flex: 1, py: 1 }}>
        <DrawerNav pathname={pathname} userRole={role} />
        <Divider />
        <DrawerCampaignSection
          pathname={pathname}
          activeCampaignId={activeCampaignId}
          campaigns={campaigns}
          campaignsLoading={campaignsLoading}
          worldExpanded={worldExpanded}
          onWorldExpandedChange={onWorldExpandedChange}
          onCampaignChange={onCampaignChange}
          canAccessAdmin={canAccessAdmin}
          unreadCount={unreadCount}
        />
      </List>

      <Divider />

      <Box sx={{ p: 2 }}>
        <Button fullWidth variant="outlined" size="small" startIcon={<LogoutIcon />} onClick={onSignOut} sx={{ justifyContent: 'flex-start' }}>
          Sign Out
        </Button>
      </Box>
    </Drawer>
  )
}
