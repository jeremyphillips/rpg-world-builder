import { Box, Stack, Typography } from '@mui/material'
import { Breadcrumbs } from '@/ui/patterns'
import type { BreadcrumbItem } from '@/ui/patterns'

export interface AppPageHeaderProps {
  headline: string
  breadcrumbData?: BreadcrumbItem[]
  actions?: React.ReactNode[]
}

export default function AppPageHeader({
  headline,
  breadcrumbData,
  actions = [],
}: AppPageHeaderProps) {
  return (
    <Box>
      {breadcrumbData && <Breadcrumbs items={breadcrumbData} />}

      <Stack 
        direction="row" 
        alignItems="center" 
        sx={{ mb: 3, width: '100%' }}
      >
        <Typography variant="h1" sx={{ flexGrow: 1 }}>
          {headline}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
          {actions.length > 0 && actions.map((action) => action)}
        </Box>
      </Stack>
    </Box>
  )
}