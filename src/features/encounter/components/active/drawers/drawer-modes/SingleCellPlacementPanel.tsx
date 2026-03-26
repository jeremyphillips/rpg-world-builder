import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import type { SingleCellPlacementRequirement } from '@/features/mechanics/domain/encounter/resolution/action/action-requirement-model'

export type SingleCellPlacementPanelProps = {
  actionLabel: string
  requirement: SingleCellPlacementRequirement
  placementError?: string | null
  onDismissPlacementError?: () => void
  onBack: () => void
}

export function SingleCellPlacementPanel({
  actionLabel,
  requirement,
  placementError,
  onDismissPlacementError,
  onBack: _onBack,
}: SingleCellPlacementPanelProps) {
  const rangeLine = `${requirement.rangeFt} ft`
  const los = requirement.lineOfSightRequired ? 'Line of sight required' : 'Line of sight not required'
  const occ = requirement.mustBeUnoccupied ? 'Unoccupied cell' : 'Occupied cells allowed'

  return (
    <Stack spacing={2}>
      <header>
        <Typography component="h2" variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          Placement — {actionLabel}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {rangeLine} · {los} · {occ}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Click a valid cell on the map. Your selection stays when you return to the main view.
        </Typography>
      </header>

      {placementError && (
        <Box
          role="alert"
          sx={{
            px: 1.5,
            py: 1,
            borderRadius: 1,
            bgcolor: 'error.dark',
            color: 'error.contrastText',
            typography: 'body2',
          }}
        >
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1}>
            <span>{placementError}</span>
            {onDismissPlacementError && (
              <button type="button" onClick={onDismissPlacementError} style={{ color: 'inherit' }}>
                Dismiss
              </button>
            )}
          </Stack>
        </Box>
      )}

      <Typography variant="caption" color="text.secondary">
        Use the map to choose one cell. Press Done when finished reviewing this panel.
      </Typography>
    </Stack>
  )
}
