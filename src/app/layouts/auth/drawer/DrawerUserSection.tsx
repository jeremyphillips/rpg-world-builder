import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import SettingsIcon from '@mui/icons-material/Settings'
import { UserAvatar } from '@/features/user/components'
import { ROUTES } from '@/app/routes'

type DrawerUserSectionProps = {
  username: string
  avatarUrl?: string
  firstName?: string
  lastName?: string
  role: string
}

export function DrawerUserSection({ username, avatarUrl, firstName, lastName, role }: DrawerUserSectionProps) {
  const navigate = useNavigate()

  return (
    <Box sx={{ p: 2.5, pb: 1.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
        <UserAvatar username={username} avatarUrl={avatarUrl} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            {firstName} {lastName}
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
            {role}
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
