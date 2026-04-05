import { useState } from 'react'

import CloseIcon from '@mui/icons-material/Close'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { LocationSummaryCard } from '@/features/content/locations/components'
import type { Location } from '@/features/content/locations/domain/model/location'
import { SelectedEntitiesLane, SelectEntityModal, type SelectEntityOption } from '@/ui/patterns'
import { resolveImageUrl } from '@/shared/lib/media'

export type SimulatorEncounterBuildingLocationProps = {
  selectedBuildingIds: string[]
  onChange: (ids: string[]) => void
  locations: Location[]
  buildingSelectOptions: SelectEntityOption[]
  campaignId: string | undefined
}

/**
 * Building-scale location picker for **Encounter Simulator** setup (map host for **Start combat**).
 * Game session uses {@link GameSessionBuildingLocationField} instead; this stays simulator-owned.
 */
export function SimulatorEncounterBuildingLocation({
  selectedBuildingIds,
  onChange,
  locations,
  buildingSelectOptions,
  campaignId,
}: SimulatorEncounterBuildingLocationProps) {
  const [modalOpen, setModalOpen] = useState(false)

  const selectedId = selectedBuildingIds[0]
  const selectedLoc = selectedId ? locations.find((l) => l.id === selectedId) : undefined
  const parentName =
    selectedLoc?.parentId != null
      ? locations.find((p) => p.id === selectedLoc.parentId)?.name
      : undefined

  const detailLink =
    campaignId && selectedId ? `/campaigns/${campaignId}/world/locations/${selectedId}` : '#'

  return (
    <>
      <SelectedEntitiesLane
        title="Location (building)"
        description="Only building-scale locations are listed."
        actionLabel={selectedId ? 'Change building' : 'Select building'}
        onAction={() => setModalOpen(true)}
        emptyMessage="No building selected yet."
        hasSelection={Boolean(selectedId)}
      >
        {selectedId && selectedLoc?.scale === 'building' ? (
          <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ width: '100%' }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <LocationSummaryCard
                link={detailLink}
                name={selectedLoc.name}
                scale={selectedLoc.scale}
                imageUrl={selectedLoc.imageKey ? resolveImageUrl(selectedLoc.imageKey) : undefined}
                parentName={parentName}
              />
            </Box>
            <IconButton
              size="small"
              aria-label="Clear building"
              onClick={() => onChange([])}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        ) : selectedId ? (
          <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ width: '100%' }}>
            <Typography variant="body2" color="error" sx={{ flex: 1 }}>
              This location is missing or is not a building-scale location.
            </Typography>
            <IconButton size="small" aria-label="Clear building" onClick={() => onChange([])}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        ) : null}
      </SelectedEntitiesLane>

      <SelectEntityModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        headline="Location (building)"
        subheadline="Choose a building for this encounter."
        options={buildingSelectOptions}
        selectedIds={selectedId ? [selectedId] : []}
        onApply={(ids) => {
          onChange(ids.slice(0, 1))
        }}
        maxSelections={1}
        filterPlaceholder="Search buildings…"
        footerNote={
          buildingSelectOptions.length === 0 ? 'No building locations in this campaign.' : undefined
        }
      />
    </>
  )
}
