import { useState, useEffect } from 'react'
import { NavLink, Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import { useNotifications } from '../providers/NotificationProvider'
import { useActiveCampaign } from '../providers/ActiveCampaignProvider'
import { getNotificationLabel, getNotificationRoute, timeAgo } from '@/features/notification'
import type { AppNotification } from '@/features/notification'
import { ROUTES } from '../routes'
import { apiFetch } from '../api'
import { UserAvatar } from '@/features/user/components'

import { alpha } from '@mui/material/styles'
import Box from '@mui/material/Box'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import Collapse from '@mui/material/Collapse'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Badge from '@mui/material/Badge'
import Popover from '@mui/material/Popover'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import Chip from '@mui/material/Chip'
import FormControl from '@mui/material/FormControl'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'

import DashboardIcon from '@mui/icons-material/Dashboard'
import ShieldIcon from '@mui/icons-material/Shield'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import SettingsIcon from '@mui/icons-material/Settings'
import GroupAddIcon from '@mui/icons-material/GroupAdd'
import GavelIcon from '@mui/icons-material/Gavel'
import EventIcon from '@mui/icons-material/Event'
import PlaceIcon from '@mui/icons-material/Place'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import Inventory2Icon from '@mui/icons-material/Inventory2'
import ChatIcon from '@mui/icons-material/Chat'
import LogoutIcon from '@mui/icons-material/Logout'
// import NotificationsIcon from '@mui/icons-material/Notifications'
import DoneAllIcon from '@mui/icons-material/DoneAll'
import MailOutlineIcon from '@mui/icons-material/MailOutline'
import NotificationsIcon from '@mui/icons-material/Notifications'

import type { Campaign } from '@/shared/types/campaign.types'

const DRAWER_WIDTH = 260
const HEADER_HEIGHT = 48

type NavItem = {
  label: string
  to: string
  icon: React.ReactNode
  children?: NavItem[]
  superadminOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Users', to: ROUTES.USERS, icon: <AdminPanelSettingsIcon />, superadminOnly: true },
  { label: 'Dashboard', to: ROUTES.DASHBOARD, icon: <DashboardIcon /> },
  { label: 'Characters', to: ROUTES.CHARACTERS, icon: <ShieldIcon /> },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AuthLayout() {
  const { user, loading, signOut } = useAuth()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const { campaignId:activeCampaignId, campaign: activeCampaignData, setActiveCampaign, clearActiveCampaign } = useActiveCampaign()
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
      {/* Side drawer */}
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
            // top: HEADER_HEIGHT,
            height: `calc(100vh - ${HEADER_HEIGHT}px)`,
          },
        }}
      >
        {/* User header */}
        <Box sx={{ p: 2.5, pb: 1.5 }}>
          <Box sx={{ display: 'flex',  justifyContent: 'space-between', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
            <UserAvatar
              username={user.username}
              avatarUrl={user.avatarUrl}
              //role={user.role}
              //status={user.status}
            />
            <Box sx={{ flex: 1}}>
              <Typography variant="subtitle1" fontWeight={700}>
                {user.firstName} {user.lastName}
              </Typography>
              <IconButton
                size="small"
                onClick={() => navigate(ROUTES.ACCOUNT_SETTINGS)}
                aria-label="Account settings"
                sx={{ color: 'var(--mui-palette-text-secondary)' }}
              >
                <SettingsIcon fontSize="small" />
              </IconButton>
              <Typography variant="caption" sx={{ color: 'var(--mui-palette-text-secondary)', textTransform: 'capitalize' }}>
                {user.role}
              </Typography>
            </Box>  
          </Box>
        </Box>

        <Divider />
        {/* Navigation */}
        <List component="nav" sx={{ flex: 1, py: 1 }}>
          {NAV_ITEMS.filter((item) => !item.superadminOnly || user.role === 'superadmin').map(({ label, to, icon, children }) => (
            <Box key={to}>
              <ListItemButton
                component={NavLink}
                to={to}
                end={to === ROUTES.DASHBOARD || !!children}
                selected={
                  to === ROUTES.DASHBOARD
                    ? location.pathname === to
                    : !children
                      ? location.pathname.startsWith(to)
                      : location.pathname === to
                }
              >
                <ListItemIcon sx={{ minWidth: 40 }}>{icon}</ListItemIcon>
                <ListItemText
                  primary={label}
                  slotProps={{ primary: { fontSize: '0.9rem' } }}
                />
              </ListItemButton>

              {children && (
                <List component="div" disablePadding>
                  {children.map((child) => (
                    <ListItemButton
                      key={child.to}
                      component={NavLink}
                      to={child.to}
                      selected={location.pathname === child.to}
                      sx={{ pl: 4 }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>{child.icon}</ListItemIcon>
                      <ListItemText
                        primary={child.label}
                        slotProps={{ primary: { fontSize: '0.85rem' } }}
                      />
                    </ListItemButton>
                  ))}
                </List>
              )}
            </Box>
          ))}
        
          <Divider />
          {/* Campaign section */}
          <Box
            sx={{
              px: 2,
              py: 2,
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
            }}
          >
            <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1, fontSize: '0.7rem' }}>
              Campaign
            </Typography>

            <FormControl fullWidth size="small">
              <Select
                value={activeCampaignId ?? ''}
                onChange={(e) => handleCampaignChange(e.target.value)}
                displayEmpty
                disabled={!campaignsLoading && campaigns.length === 0}
                renderValue={(value) => {
                  if (!value) return campaignsLoading ? 'Loading…' : campaigns.length === 0 ? 'No Campaigns' : 'Select Campaign'
                  return campaigns.find((c) => c._id === value)?.identity?.name ?? 'Select Campaign'
                }}
                sx={{ fontSize: '0.9rem' }}
              >
                {campaignsLoading ? (
                  <MenuItem disabled>Loading…</MenuItem>
                ) : campaigns.length === 0 ? (
                  <MenuItem disabled>No Campaigns</MenuItem>
                ) : (
                  campaigns.map((c) => (
                    <MenuItem key={c._id} value={c._id}>
                      {c.identity?.name ?? c._id}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>

            {/* Campaign child pages — only when user has campaigns */}
            {campaigns.length > 0 && (
              <List component="nav" disablePadding sx={{ mt: 1 }}>
                {/* Overview */}
                <ListItemButton
                  component={NavLink}
                  to={activeCampaignId ? ROUTES.CAMPAIGN.replace(':id', activeCampaignId) : ROUTES.CAMPAIGNS}
                  selected={activeCampaignId ? location.pathname === `/campaigns/${activeCampaignId}` : false}
                  disabled={!activeCampaignId}
                  sx={{ pl: 0 }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}><DashboardIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Overview" slotProps={{ primary: { fontSize: '0.85rem' } }} />
                </ListItemButton>
                <ListItemButton
                  component={NavLink}
                  to={activeCampaignId ? ROUTES.CAMPAIGN_RULES.replace(':id', activeCampaignId) : ROUTES.CAMPAIGNS}
                  selected={activeCampaignId ? location.pathname === `/campaigns/${activeCampaignId}/rules` : false}
                  disabled={!activeCampaignId}
                  sx={{ pl: 0 }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}><GavelIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Rules" slotProps={{ primary: { fontSize: '0.85rem' } }} />
                </ListItemButton>
                {/* World */}
                <ListItemButton
                  onClick={() => activeCampaignId && setWorldExpanded((v) => !v)}
                  disabled={!activeCampaignId}
                  sx={{ pl: 0 }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}><PlaceIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="World" slotProps={{ primary: { fontSize: '0.85rem' } }} />
                  {activeCampaignId && (worldExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />)}
                </ListItemButton>
                {activeCampaignId && (
                  <Collapse in={worldExpanded} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                    <ListItemButton
                        component={NavLink}
                        to={ROUTES.WORLD_CLASSES.replace(':id', activeCampaignId)}
                        selected={location.pathname.startsWith(`/campaigns/${activeCampaignId}/world/classes`)}
                        sx={{ pl: 2 }}
                      >
                        <ListItemText primary="Classes" slotProps={{ primary: { fontSize: '0.8rem' } }} />
                      </ListItemButton>
                      <ListItemButton
                        component={NavLink}
                        to={ROUTES.WORLD_RACES.replace(':id', activeCampaignId)}
                        selected={location.pathname === `/campaigns/${activeCampaignId}/world/races`}
                        sx={{ pl: 2 }}
                      >
                        <ListItemText primary="Races" slotProps={{ primary: { fontSize: '0.8rem' } }} />
                      </ListItemButton>
                      <ListItemButton
                        component={NavLink}
                        to={activeCampaignId ? ROUTES.WORLD_EQUIPMENT.replace(':id', activeCampaignId) : ROUTES.CAMPAIGNS}
                        selected={activeCampaignId ? location.pathname.startsWith(`/campaigns/${activeCampaignId}/equipment`) : false}
                        disabled={!activeCampaignId}
                        sx={{ pl: 2 }}
                      >
                        <ListItemText primary="Equipment" slotProps={{ primary: { fontSize: '0.85rem' } }} />
                      </ListItemButton>
                      <ListItemButton
                        component={NavLink}
                        to={ROUTES.WORLD_LOCATIONS.replace(':id', activeCampaignId)}
                        selected={location.pathname === `/campaigns/${activeCampaignId}/world/locations`}
                        sx={{ pl: 2 }}
                      >
                        <ListItemText primary="Locations" slotProps={{ primary: { fontSize: '0.8rem' } }} />
                      </ListItemButton>
                      <ListItemButton
                        component={NavLink}
                        to={ROUTES.WORLD_NPCS.replace(':id', activeCampaignId)}
                        selected={location.pathname.startsWith(`/campaigns/${activeCampaignId}/world/npcs`)}
                        sx={{ pl: 2 }}
                      >
                        <ListItemText primary="NPCs" slotProps={{ primary: { fontSize: '0.8rem' } }} />
                      </ListItemButton>
                      <ListItemButton
                        component={NavLink}
                        to={ROUTES.WORLD_MONSTERS.replace(':id', activeCampaignId)}
                        selected={location.pathname.startsWith(`/campaigns/${activeCampaignId}/world/monsters`)}
                        sx={{ pl: 2 }}
                      >
                        <ListItemText primary="Monsters" slotProps={{ primary: { fontSize: '0.8rem' } }} />
                      </ListItemButton>
                      <ListItemButton
                        component={NavLink}
                        to={ROUTES.WORLD_SPELLS.replace(':id', activeCampaignId)}
                        selected={location.pathname.startsWith(`/campaigns/${activeCampaignId}/world/spells`)}
                        sx={{ pl: 2 }}
                      >
                        <ListItemText primary="Spells" slotProps={{ primary: { fontSize: '0.8rem' } }} />
                      </ListItemButton>
                      <ListItemButton
                        component={NavLink}
                        to={ROUTES.WORLD_SKILL_PROFICIENCIES.replace(':id', activeCampaignId)}
                        selected={location.pathname.startsWith(`/campaigns/${activeCampaignId}/world/skill-proficiencies`)}
                        sx={{ pl: 2 }}
                      >
                        <ListItemText primary="Skill Proficiencies" slotProps={{ primary: { fontSize: '0.8rem' } }} />
                      </ListItemButton>
                    </List>
                  </Collapse>
                )}
                <ListItemButton
                  component={NavLink}
                  to={activeCampaignId ? ROUTES.SESSIONS.replace(':id', activeCampaignId) : ROUTES.CAMPAIGNS}
                  selected={activeCampaignId ? location.pathname.startsWith(`/campaigns/${activeCampaignId}/sessions`) : false}
                  disabled={!activeCampaignId}
                  sx={{ pl: 0 }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}><EventIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Sessions" slotProps={{ primary: { fontSize: '0.85rem' } }} />
                </ListItemButton>
                <ListItemButton
                  component={NavLink}
                  to={activeCampaignId ? ROUTES.MESSAGING.replace(':id', activeCampaignId) : ROUTES.CAMPAIGNS}
                  selected={activeCampaignId ? location.pathname.startsWith(`/campaigns/${activeCampaignId}/messages`) : false}
                  disabled={!activeCampaignId}
                  sx={{ pl: 0 }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}><ChatIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Messages" slotProps={{ primary: { fontSize: '0.85rem' } }} />
                  <Badge badgeContent={unreadCount} color="error" max={99} />
                  {/* <IconButton
                    size="small"
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                    sx={{ color: 'var(--mui-palette-text-primary)' }}
                  >
                    <Badge badgeContent={unreadCount} color="error" max={99}>
                      <NotificationsIcon />
                    </Badge>
                  </IconButton> */}
                </ListItemButton>
                {canAccessAdmin && (
                  <>
                    {/* <ListItemButton
                      component={NavLink}
                      to={ROUTES.ADMIN_INVITES}
                      selected={location.pathname.startsWith(ROUTES.ADMIN)}
                      sx={{ pl: 0 }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}><GroupAddIcon fontSize="small" /></ListItemIcon>
                      <ListItemText primary="Invites" slotProps={{ primary: { fontSize: '0.85rem' } }} />
                    </ListItemButton> */}
                    
                    <Divider />

                    <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1, mt: 2, fontSize: '0.7rem' }}>
                      Campaign Settings
                    </Typography>

                    <ListItemButton
                      component={NavLink}
                      to={activeCampaignId ? ROUTES.CAMPAIGN_ADMIN_SETTINGS.replace(':id', activeCampaignId) : ROUTES.CAMPAIGNS}
                      selected={activeCampaignId ? location.pathname === ROUTES.CAMPAIGN_ADMIN_SETTINGS.replace(':id', activeCampaignId) : false}
                      sx={{ pl: 0 }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}><SettingsIcon fontSize="small" /></ListItemIcon>
                      <ListItemText primary="Settings" slotProps={{ primary: { fontSize: '0.85rem' } }} />
                    </ListItemButton>

                    <ListItemButton
                      component={NavLink}
                      to={activeCampaignId ? ROUTES.CAMPAIGN_ADMIN_RULESET.replace(':id', activeCampaignId) : ROUTES.CAMPAIGNS}
                      selected={activeCampaignId ? location.pathname === ROUTES.CAMPAIGN_ADMIN_RULESET.replace(':id', activeCampaignId) : false}
                      sx={{ pl: 0 }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}><GavelIcon fontSize="small" /></ListItemIcon>
                      <ListItemText primary="Ruleset" slotProps={{ primary: { fontSize: '0.85rem' } }} />
                    </ListItemButton>
                  </>
                )}
              </List>
            )}
          </Box>
        </List>

        <Divider />

        {/* Footer */}
        <Box sx={{ p: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            size="small"
            startIcon={<LogoutIcon />}
            onClick={signOut}
            sx={{ justifyContent: 'flex-start' }}
          >
            Sign Out
          </Button>
        </Box>
      </Drawer>



      {/* Notification popover */}
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
        {/* Popover header */}
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
            <Button
              size="small"
              startIcon={<DoneAllIcon fontSize="small" />}
              onClick={markAllAsRead}
              sx={{ fontSize: '0.75rem' }}
            >
              Mark all read
            </Button>
          )}
        </Stack>

        {/* Popover body */}
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

      {/* Main content — offset by header height */}
      <Box
        sx={{
          flex: 1
        }}
      >
        {/* Top header bar */}
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
            <IconButton
              size="small"
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{ color: 'var(--mui-palette-text-primary)' }}
            >
              <Badge badgeContent={unreadCount} color="error" max={99}>
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Toolbar>
        </AppBar>

        <Box
          component="main"
          sx={{
            flex: 1,
            p: 4,
            pt: 3, // `calc(${HEADER_HEIGHT}px + 32px)`,
            overflow: 'auto',
            bgcolor: 'var(--mui-palette-background-default)',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}
