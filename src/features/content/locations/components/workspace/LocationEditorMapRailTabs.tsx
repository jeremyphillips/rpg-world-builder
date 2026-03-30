import { useState, type ReactNode } from 'react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { AppTabs, AppTab } from '@/ui/patterns'
import { parseGridCellId } from '@/shared/domain/grid'

type LocationEditorMapRailTabsProps = {
  metadata: ReactNode
  selectedCellId: string | null
}

export function LocationEditorMapRailTabs({
  metadata,
  selectedCellId,
}: LocationEditorMapRailTabsProps) {
  const [tab, setTab] = useState(0)

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
      }}
    >
      <AppTabs
        value={tab}
        onChange={(_e, v) => setTab(v as number)}
        variant="fullWidth"
        sx={{ flexShrink: 0 }}
      >
        <AppTab label="Metadata" />
        <AppTab label="Cell" />
      </AppTabs>
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', p: 2.5 }}>
        {tab === 0 ? metadata : <CellRailPanel selectedCellId={selectedCellId} />}
      </Box>
    </Box>
  )
}

function CellRailPanel({ selectedCellId }: { selectedCellId: string | null }) {
  if (selectedCellId == null) {
    return (
      <Typography variant="body2" color="text.secondary">
        Select a cell to inspect
      </Typography>
    )
  }

  const point = parseGridCellId(selectedCellId)

  return (
    <Stack spacing={1.5}>
      <Stack spacing={0.5}>
        <Typography variant="caption" color="text.secondary">
          Cell ID
        </Typography>
        <Typography variant="body2">{selectedCellId}</Typography>
      </Stack>
      <Stack direction="row" spacing={3}>
        <Stack spacing={0.5}>
          <Typography variant="caption" color="text.secondary">
            X
          </Typography>
          <Typography variant="body2">
            {point != null ? String(point.x) : '—'}
          </Typography>
        </Stack>
        <Stack spacing={0.5}>
          <Typography variant="caption" color="text.secondary">
            Y
          </Typography>
          <Typography variant="body2">
            {point != null ? String(point.y) : '—'}
          </Typography>
        </Stack>
      </Stack>
    </Stack>
  )
}
