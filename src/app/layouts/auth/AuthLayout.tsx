import { useState, useEffect } from 'react'
import { Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../providers/AuthProvider'
import { useNotifications } from '../../providers/NotificationProvider'
import { useActiveCampaign } from '../../providers/ActiveCampaignProvider'
import { getNotificationLabel, getNotificationRoute, timeAgo } from '@/features/notification'
import type { AppNotification } from '@/features/notification'
import { ROUTES } from '../../routes'
import { apiFetch } from '../../api'
import Box from '@mui/material/Box'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Badge from '@mui/material/Badge'
import Popover from '@mui/material/Popover'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import DoneAllIcon from '@mui/icons-material/DoneAll'
import MailOutlineIcon from '@mui/icons-material/MailOutline'
import NotificationsIcon from '@mui/icons-material/Notifications'
import type { Campaign } from '@/shared/types/campaign.types'
import { HEADER_HEIGHT } from './auth-layout.constants'
import { isAuthMainFocusPath } from './auth-main-path'
import { AuthMainChrome } from './AuthMainChrome'
import { AuthMainFocus } from './AuthMainFocus'
import { AuthDrawer } from './drawer/AuthDrawer'

export default function AuthLayout() {
  const { user, loading, signOut } = useAuth()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const { campaignId: activeCampaignId, campaign: activeCampaignData, setActiveCampaign, clearActiveCampaign } = useActiveCampaign()
  const location = useLocation()
  const navigate = useNavigate()

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [campaignsLoading, setCampaignsLoading] = useState(true)
  const [worldExpanded, setWorldExpanded] = useState(false)
  const popoverOpen = Boolean(anchorEl)

  const canAccessAdmin = activeCampaignData?.viewer?.isOwner || activeCampaignData?.viewer?.isPlatformAdmin || false

  // AbortController prevents StrictMode from completing both duplicate fetches,
  // which would overwrite campaigns state with a second object reference and
  // trigger an unnecessary re-render of the sidebar campaign selector.
  useEffect(() => {
    const controller = new AbortController()
    apiFetch<{ campaigns: Campaign[] }>('/api/campaigns', { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setCampaigns(data.campaigns ?? [])
      })
      .catch(() => {
        if (!controller.signal.aborted) setCampaigns([])
      })
      .finally(() => {
        if (!controller.signal.aborted) setCampaignsLoading(false)
      })
    return () => controller.abort()
  }, [])

  const handleCampaignChange = (value: string) => {
    if (value === '') {
      clearActiveCampaign()
      navigate(ROUTES.CAMPAIGNS)
    } else {
      setActiveCampaign(value)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />
  }

  function handleNotificationClick(n: AppNotification) {
    if (!n.readAt) markAsRead(n._id)
    const link = getNotificationRoute(n, ROUTES)
    if (link) {
      setAnchorEl(null)
      navigate(link)
    }
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AuthDrawer
        username={user.username}
        avatarUrl={user.avatarUrl}
        firstName={user.firstName}
        lastName={user.lastName}
        role={user.role}
        pathname={location.pathname}
        onSignOut={signOut}
        campaigns={campaigns}
        campaignsLoading={campaignsLoading}
        activeCampaignId={activeCampaignId}
        worldExpanded={worldExpanded}
        onWorldExpandedChange={setWorldExpanded}
        onCampaignChange={handleCampaignChange}
        canAccessAdmin={canAccessAdmin}
        unreadCount={unreadCount}
      />

      <Popover
        open={popoverOpen}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: { width: 380, maxHeight: 480, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
          },
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 2, py: 1.5, borderBottom: '1px solid var(--mui-palette-divider)' }}
        >
          <Typography variant="subtitle2" fontWeight={700}>
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Button size="small" startIcon={<DoneAllIcon fontSize="small" />} onClick={markAllAsRead} sx={{ fontSize: '0.75rem' }}>
              Mark all read
            </Button>
          )}
        </Stack>

        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {notifications.length === 0 ? (
            <Box sx={{ py: 5, textAlign: 'center' }}>
              <MailOutlineIcon sx={{ fontSize: 40, color: 'var(--mui-palette-text-disabled)', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                No notifications yet
              </Typography>
            </Box>
          ) : (
            notifications.map((n) => (
              <Box
                key={n._id}
                onClick={() => handleNotificationClick(n)}
                sx={{
                  px: 2,
                  py: 1.5,
                  cursor: getNotificationRoute(n, ROUTES) ? 'pointer' : 'default',
                  borderBottom: '1px solid var(--mui-palette-divider)',
                  bgcolor: n.readAt ? 'transparent' : 'var(--mui-palette-action-hover)',
                  transition: 'background-color 0.15s',
                  '&:hover': {
                    bgcolor: 'var(--mui-palette-action-selected)',
                  },
                }}
              >
                <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: n.readAt ? 400 : 600 }}>
                      {getNotificationLabel(n)}
                    </Typography>
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        {timeAgo(n.createdAt)}
                      </Typography>
                      {n.requiresAction && !n.actionTakenAt && (
                        <Chip label="Action needed" size="small" color="warning" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                      )}
                    </Stack>
                  </Box>
                  {!n.readAt && (
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: 'var(--mui-palette-primary-main)',
                        mt: 0.75,
                        flexShrink: 0,
                      }}
                    />
                  )}
                </Stack>
              </Box>
            ))
          )}
        </Box>
      </Popover>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
        <AppBar
          position="relative"
          elevation={0}
          sx={{
            height: HEADER_HEIGHT,
            bgcolor: 'var(--mui-palette-background-paper)',
            borderBottom: '1px solid var(--mui-palette-divider)',
            zIndex: (theme) => theme.zIndex.drawer + 1,
          }}
        >
          <Toolbar
            variant="dense"
            sx={{
              minHeight: HEADER_HEIGHT,
              justifyContent: 'flex-end',
              pr: 2,
            }}
          >
            <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ color: 'var(--mui-palette-text-primary)' }}>
              <Badge badgeContent={unreadCount} color="error" max={99}>
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Toolbar>
        </AppBar>

        {isAuthMainFocusPath(location.pathname) ? (
          <AuthMainFocus>
            <Outlet />
          </AuthMainFocus>
        ) : (
          <AuthMainChrome>
            <Outlet />
          </AuthMainChrome>
        )}
      </Box>
    </Box>
  )
}
