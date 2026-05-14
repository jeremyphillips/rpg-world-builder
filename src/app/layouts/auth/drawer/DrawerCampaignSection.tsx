import type { Dispatch, SetStateAction } from 'react'
import { matchPath, NavLink } from 'react-router-dom'
import { alpha } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Badge from '@mui/material/Badge'
import Collapse from '@mui/material/Collapse'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import ChatIcon from '@mui/icons-material/Chat'
import DashboardIcon from '@mui/icons-material/Dashboard'
import EventIcon from '@mui/icons-material/Event'
import LiveTvIcon from '@mui/icons-material/LiveTv'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import GavelIcon from '@mui/icons-material/Gavel'
import PlaceIcon from '@mui/icons-material/Place'
import SettingsIcon from '@mui/icons-material/Settings'
import ShieldIcon from '@mui/icons-material/Shield'

import { ROUTES } from '@/app/routes'
import type { Campaign } from '@/shared/types/campaign.types'
import { AppSelect } from '@/ui/primitives'

type DrawerCampaignSectionProps = {
  pathname: string
  activeCampaignId: string | null
  campaigns: Campaign[]
  campaignsLoading: boolean
  worldExpanded: boolean
  onWorldExpandedChange: Dispatch<SetStateAction<boolean>>
  onCampaignChange: (value: string) => void
  canAccessAdmin: boolean
  unreadCount: number
}

export function DrawerCampaignSection({
  pathname,
  activeCampaignId,
  campaigns,
  campaignsLoading,
  worldExpanded,
  onWorldExpandedChange,
  onCampaignChange,
  canAccessAdmin,
  unreadCount,
}: DrawerCampaignSectionProps) {
  return (
    <Box
      sx={{
        px: 2,
        py: 2,
        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
      }}
    >
      <AppSelect
        label="Campaign"
        value={activeCampaignId ?? ''}
        onChange={onCampaignChange}
        disabled={!campaignsLoading && campaigns.length === 0}
        placeholder={
          campaignsLoading ? 'Loading…' : campaigns.length === 0 ? 'No Campaigns' : 'Select Campaign'
        }
        options={campaigns.map((c) => ({
          value: c._id,
          label: c.identity?.name ?? c._id,
        }))}
        size="large"
        sx={{ fontSize: '0.9rem' }}
      />

      {campaigns.length > 0 && (
        <List component="nav" disablePadding sx={{ mt: 1 }}>
          <ListItemButton
            component={NavLink}
            to={activeCampaignId ? ROUTES.CAMPAIGN.replace(':id', activeCampaignId) : ROUTES.CAMPAIGNS}
            selected={activeCampaignId ? pathname === `/campaigns/${activeCampaignId}` : false}
            disabled={!activeCampaignId}
            sx={{ pl: 0 }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <DashboardIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Overview" slotProps={{ primary: { fontSize: '0.85rem' } }} />
          </ListItemButton>
          <ListItemButton
            component={NavLink}
            to={activeCampaignId ? ROUTES.CAMPAIGN_RULES.replace(':id', activeCampaignId) : ROUTES.CAMPAIGNS}
            selected={activeCampaignId ? pathname === `/campaigns/${activeCampaignId}/rules` : false}
            disabled={!activeCampaignId}
            sx={{ pl: 0 }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <GavelIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Rules" slotProps={{ primary: { fontSize: '0.85rem' } }} />
          </ListItemButton>
          <ListItemButton
            onClick={() => activeCampaignId && onWorldExpandedChange((v) => !v)}
            disabled={!activeCampaignId}
            sx={{ pl: 0 }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <PlaceIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="World" slotProps={{ primary: { fontSize: '0.85rem' } }} />
            {activeCampaignId && (worldExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />)}
          </ListItemButton>
          {activeCampaignId && (
            <Collapse in={worldExpanded} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                <ListItemButton
                  component={NavLink}
                  to={ROUTES.WORLD_CLASSES.replace(':id', activeCampaignId)}
                  selected={pathname.startsWith(`/campaigns/${activeCampaignId}/world/classes`)}
                  sx={{ pl: 2 }}
                >
                  <ListItemText primary="Classes" slotProps={{ primary: { fontSize: '0.8rem' } }} />
                </ListItemButton>
                <ListItemButton
                  component={NavLink}
                  to={ROUTES.WORLD_RACES.replace(':id', activeCampaignId)}
                  selected={pathname === `/campaigns/${activeCampaignId}/world/races`}
                  sx={{ pl: 2 }}
                >
                  <ListItemText primary="Races" slotProps={{ primary: { fontSize: '0.8rem' } }} />
                </ListItemButton>
                <ListItemButton
                  component={NavLink}
                  to={activeCampaignId ? ROUTES.WORLD_EQUIPMENT.replace(':id', activeCampaignId) : ROUTES.CAMPAIGNS}
                  selected={activeCampaignId ? pathname.startsWith(`/campaigns/${activeCampaignId}/equipment`) : false}
                  disabled={!activeCampaignId}
                  sx={{ pl: 2 }}
                >
                  <ListItemText primary="Equipment" slotProps={{ primary: { fontSize: '0.85rem' } }} />
                </ListItemButton>
                <ListItemButton
                  component={NavLink}
                  to={ROUTES.WORLD_LOCATIONS.replace(':id', activeCampaignId)}
                  selected={pathname === `/campaigns/${activeCampaignId}/world/locations`}
                  sx={{ pl: 2 }}
                >
                  <ListItemText primary="Locations" slotProps={{ primary: { fontSize: '0.8rem' } }} />
                </ListItemButton>
                <ListItemButton
                  component={NavLink}
                  to={ROUTES.WORLD_NPCS.replace(':id', activeCampaignId)}
                  selected={pathname.startsWith(`/campaigns/${activeCampaignId}/world/npcs`)}
                  sx={{ pl: 2 }}
                >
                  <ListItemText primary="NPCs" slotProps={{ primary: { fontSize: '0.8rem' } }} />
                </ListItemButton>
                <ListItemButton
                  component={NavLink}
                  to={ROUTES.WORLD_MONSTERS.replace(':id', activeCampaignId)}
                  selected={pathname.startsWith(`/campaigns/${activeCampaignId}/world/monsters`)}
                  sx={{ pl: 2 }}
                >
                  <ListItemText primary="Monsters" slotProps={{ primary: { fontSize: '0.8rem' } }} />
                </ListItemButton>
                <ListItemButton
                  component={NavLink}
                  to={ROUTES.WORLD_SPELLS.replace(':id', activeCampaignId)}
                  selected={pathname.startsWith(`/campaigns/${activeCampaignId}/world/spells`)}
                  sx={{ pl: 2 }}
                >
                  <ListItemText primary="Spells" slotProps={{ primary: { fontSize: '0.8rem' } }} />
                </ListItemButton>
                <ListItemButton
                  component={NavLink}
                  to={ROUTES.WORLD_SKILL_PROFICIENCIES.replace(':id', activeCampaignId)}
                  selected={pathname.startsWith(`/campaigns/${activeCampaignId}/world/skill-proficiencies`)}
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
            selected={
              activeCampaignId
                ? pathname.startsWith(`/campaigns/${activeCampaignId}/sessions`) &&
                  !pathname.startsWith(`/campaigns/${activeCampaignId}/game-sessions`)
                : false
            }
            disabled={!activeCampaignId}
            sx={{ pl: 0 }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <EventIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Sessions" slotProps={{ primary: { fontSize: '0.85rem' } }} />
          </ListItemButton>
          <ListItemButton
            component={NavLink}
            to={activeCampaignId ? ROUTES.CAMPAIGN_GAME_SESSIONS.replace(':id', activeCampaignId) : ROUTES.CAMPAIGNS}
            selected={activeCampaignId ? pathname.startsWith(`/campaigns/${activeCampaignId}/game-sessions`) : false}
            disabled={!activeCampaignId}
            sx={{ pl: 0 }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <LiveTvIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Live play" slotProps={{ primary: { fontSize: '0.85rem' } }} />
          </ListItemButton>
          <ListItemButton
            component={NavLink}
            to={activeCampaignId ? ROUTES.MESSAGING.replace(':id', activeCampaignId) : ROUTES.CAMPAIGNS}
            selected={activeCampaignId ? pathname.startsWith(`/campaigns/${activeCampaignId}/messages`) : false}
            disabled={!activeCampaignId}
            sx={{ pl: 0 }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <ChatIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Messages" slotProps={{ primary: { fontSize: '0.85rem' } }} />
            <Badge badgeContent={unreadCount} color="error" max={99} />
          </ListItemButton>
          {canAccessAdmin && (
            <>
              <Divider />

              <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1, mt: 2, fontSize: '0.7rem' }}>
                Campaign Settings
              </Typography>

              <ListItemButton
                component={NavLink}
                to={activeCampaignId ? ROUTES.CAMPAIGN_ADMIN_SETTINGS.replace(':id', activeCampaignId) : ROUTES.CAMPAIGNS}
                selected={activeCampaignId ? pathname === ROUTES.CAMPAIGN_ADMIN_SETTINGS.replace(':id', activeCampaignId) : false}
                sx={{ pl: 0 }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <SettingsIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Settings" slotProps={{ primary: { fontSize: '0.85rem' } }} />
              </ListItemButton>

              <ListItemButton
                component={NavLink}
                to={activeCampaignId ? ROUTES.CAMPAIGN_ENCOUNTER.replace(':id', activeCampaignId) : ROUTES.CAMPAIGNS}
                selected={
                  activeCampaignId
                    ? matchPath({ path: ROUTES.CAMPAIGN_ENCOUNTER, end: false }, pathname) != null
                    : false
                }
                sx={{ pl: 0 }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <ShieldIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Encounter simulator" slotProps={{ primary: { fontSize: '0.85rem' } }} />
              </ListItemButton>

              <ListItemButton
                component={NavLink}
                to={activeCampaignId ? ROUTES.CAMPAIGN_ADMIN_RULESET.replace(':id', activeCampaignId) : ROUTES.CAMPAIGNS}
                selected={activeCampaignId ? pathname === ROUTES.CAMPAIGN_ADMIN_RULESET.replace(':id', activeCampaignId) : false}
                sx={{ pl: 0 }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <GavelIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Ruleset" slotProps={{ primary: { fontSize: '0.85rem' } }} />
              </ListItemButton>
            </>
          )}
        </List>
      )}
    </Box>
  )
}
