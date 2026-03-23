import { NavLink } from 'react-router-dom'
import Box from '@mui/material/Box'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import List from '@mui/material/List'
import { ROUTES } from '@/app/routes'
import { NAV_ITEMS } from './nav-items'

type DrawerNavProps = {
  pathname: string
  userRole: string
}

export function DrawerNav({ pathname, userRole }: DrawerNavProps) {
  return (
    <>
      {NAV_ITEMS.filter((item) => !item.superadminOnly || userRole === 'superadmin').map(({ label, to, icon, children }) => (
        <Box key={to}>
          <ListItemButton
            component={NavLink}
            to={to}
            end={to === ROUTES.DASHBOARD || !!children}
            selected={
              to === ROUTES.DASHBOARD
                ? pathname === to
                : !children
                  ? pathname.startsWith(to)
                  : pathname === to
            }
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{icon}</ListItemIcon>
            <ListItemText primary={label} slotProps={{ primary: { fontSize: '0.9rem' } }} />
          </ListItemButton>

          {children && (
            <List component="div" disablePadding>
              {children.map((child) => (
                <ListItemButton
                  key={child.to}
                  component={NavLink}
                  to={child.to}
                  selected={pathname === child.to}
                  sx={{ pl: 4 }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>{child.icon}</ListItemIcon>
                  <ListItemText primary={child.label} slotProps={{ primary: { fontSize: '0.85rem' } }} />
                </ListItemButton>
              ))}
            </List>
          )}
        </Box>
      ))}
    </>
  )
}
