import { Link } from 'react-router-dom'
import MuiBreadcrumbs from '@mui/material/Breadcrumbs'
import Typography from '@mui/material/Typography'
import MuiLink from '@mui/material/Link'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BreadcrumbItem {
  label: string
  to?: string
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const Breadcrumbs = ({ items }: BreadcrumbsProps) => (
  <MuiBreadcrumbs
    separator={<NavigateNextIcon fontSize="small" sx={{ color: 'text.disabled' }} />}
    aria-label="breadcrumb"
    sx={{ mb: 2 }}
  >
    {items && items.length > 0 && items.map((item, i) => {
      const isLast = i === items.length - 1

      if (isLast || !item.to) {
        return (
          <Typography
            key={i}
            variant="body2"
            color={isLast ? 'text.primary' : 'text.secondary'}
            fontWeight={isLast ? 600 : 400}
            noWrap
            sx={{ maxWidth: 240 }}
          >
            {item.label}
          </Typography>
        )
      }

      return (
        <MuiLink
          key={i}
          component={Link}
          to={item.to}
          variant="body2"
          color="text.secondary"
          underline="hover"
          noWrap
          sx={{ maxWidth: 240 }}
        >
          {item.label}
        </MuiLink>
      )
    })}
  </MuiBreadcrumbs>
)

export default Breadcrumbs
