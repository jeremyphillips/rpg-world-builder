import { AlertTitle, Box, Typography } from '@mui/material'

import type { InvalidationItem } from '@/features/mechanics/domain/character-build/invalidation'
import { AppAlert } from '@/ui/primitives'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface InvalidationNoticeProps {
  /** Items that were removed by the invalidation engine. */
  items: InvalidationItem[]
  /** Called when the user dismisses the notice. */
  onDismiss: () => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * A dismissible warning banner displayed at the top of a builder step
 * when a previous change invalidated selections in this step.
 */
const InvalidationNotice = ({ items, onDismiss }: InvalidationNoticeProps) => {
  if (items.length === 0) return null

  return (
    <AppAlert tone="warning" onClose={onDismiss} sx={{ mb: 2 }}>
      <AlertTitle>Selections updated</AlertTitle>
      The following were removed because they are no longer valid:
      <Box component="ul" sx={{ mt: 0.5, mb: 0, pl: 2 }}>
        {items.map((item) => (
          <li key={item.id}>
            <Typography variant="body2">{item.label}</Typography>
          </li>
        ))}
      </Box>
    </AppAlert>
  )
}

export default InvalidationNotice
