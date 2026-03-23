import type { ReactNode } from 'react'
import DashboardIcon from '@mui/icons-material/Dashboard'
import ShieldIcon from '@mui/icons-material/Shield'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import { ROUTES } from '@/app/routes'

export type NavItem = {
  label: string
  to: string
  icon: ReactNode
  children?: NavItem[]
  superadminOnly?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Users', to: ROUTES.USERS, icon: <AdminPanelSettingsIcon />, superadminOnly: true },
  { label: 'Dashboard', to: ROUTES.DASHBOARD, icon: <DashboardIcon /> },
  { label: 'Characters', to: ROUTES.CHARACTERS, icon: <ShieldIcon /> },
]
