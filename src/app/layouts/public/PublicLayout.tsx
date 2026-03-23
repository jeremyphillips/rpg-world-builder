import { Link, Outlet } from 'react-router-dom'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Container from '@mui/material/Container'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import { ROUTES } from '../../routes'
import { useAuth } from '../../providers/AuthProvider'

export default function PublicLayout() {
  const { user, signOut } = useAuth()

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" color="default" elevation={0}>
        <Toolbar>
          <Typography
            variant="h6"
            component={Link}
            to={ROUTES.HOME}
            sx={{
              flexGrow: 1,
              fontWeight: 700,
              color: 'var(--mui-palette-primary-main)',
              textDecoration: 'none',
            }}
          >
            D&D Character Builder
          </Typography>
          {user ? (
            <Button onClick={() => signOut()} variant="outlined" size="small">
              Log Out
            </Button>
          ) : (
            <Button component={Link} to={ROUTES.LOGIN} variant="outlined" size="small">
              Sign In
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Container component="main" maxWidth="lg" sx={{ flex: 1, py: 4 }}>
        <Outlet />
      </Container>
    </Box>
  )
}
