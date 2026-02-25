import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'

import { ConfirmModal } from '@/ui/modals'
import type { InvalidationResult, InvalidationItem } from '@/features/mechanics/domain/character-build/invalidation'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface InvalidationConfirmDialogProps {
  /** The invalidation result to display.  Dialog is open when non-null. */
  invalidations: InvalidationResult | null
  /** Called when the user confirms the change. */
  onConfirm: () => void
  /** Called when the user cancels. */
  onCancel: () => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const InvalidationConfirmDialog = ({
  invalidations,
  onConfirm,
  onCancel,
}: InvalidationConfirmDialogProps) => {
  const open = invalidations != null && invalidations.hasInvalidations

  // Group affected items by label, deduplicating items that appear in
  // multiple rules targeting the same step (e.g. level→spells + class→spells).
  const groups = new Map<string, InvalidationItem[]>()
  if (invalidations) {
    for (const inv of invalidations.affected) {
      const existing = groups.get(inv.label) ?? []
      groups.set(inv.label, [...existing, ...inv.items])
    }
    for (const [label, items] of groups) {
      const seen = new Set<string>()
      groups.set(label, items.filter(item => {
        if (seen.has(item.id)) return false
        seen.add(item.id)
        return true
      }))
    }
  }

  return (
    <ConfirmModal
      open={open}
      onConfirm={onConfirm}
      onCancel={onCancel}
      headline="This change will affect other steps"
      headlineIcon={<WarningAmberRoundedIcon color="warning" />}
      description="The following selections will be removed because they are no longer valid:"
      confirmLabel="Confirm"
      confirmColor="warning"
    >
      {[...groups.entries()].map(([label, items]) => (
        <Box key={label} sx={{ mb: 2 }}>
          <Typography variant="subtitle2" fontWeight={700}>
            {label}
            <Typography
              component="span"
              variant="body2"
              color="text.secondary"
              sx={{ ml: 0.5 }}
            >
              ({items.length})
            </Typography>
          </Typography>

          <Box component="ul" sx={{ mt: 0.5, mb: 0, pl: 2.5 }}>
            {items.map((item) => (
              <li key={item.id}>
                <Typography variant="body2">{item.label}</Typography>
              </li>
            ))}
          </Box>
        </Box>
      ))}
    </ConfirmModal>
  )
}

export default InvalidationConfirmDialog
