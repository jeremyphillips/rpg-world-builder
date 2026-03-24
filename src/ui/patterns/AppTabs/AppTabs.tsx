import { styled } from '@mui/material/styles'
import MuiTab from '@mui/material/Tab'
import MuiTabs from '@mui/material/Tabs'

export const AppTabs = styled(MuiTabs)({
  minHeight: 40,
}) as typeof MuiTabs

export const AppTab = styled(MuiTab)(({ theme }) => ({
  minHeight: 40,
  textTransform: 'none',
  fontWeight: 600,
  fontSize: theme.typography.body2.fontSize,
})) as typeof MuiTab
