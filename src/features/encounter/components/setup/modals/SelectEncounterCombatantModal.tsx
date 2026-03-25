import { useEffect, useMemo, useState } from 'react'

import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { AppAvatar } from '@/ui/primitives'
import { AppModal, EntitySummaryCard } from '@/ui/patterns'
import type { ModalSize } from '@/ui/patterns'
import { resolveImageUrl } from '@/shared/lib/media'

export type CombatantOption = {
  id: string
  label: string
  subtitle?: string
  imageUrl?: string | null
  imageKey?: string | null
  stats?: Array<{ label: string; value: string; tooltip?: string }>
}

type SelectEncounterCombatantModalProps = {
  open: boolean
  onClose: () => void
  headline: string
  subheadline?: string
  size?: ModalSize
  options: CombatantOption[]
  selectedIds: string[]
  onApply: (selectedIds: string[]) => void
  footerNote?: string
  headerSlot?: React.ReactNode
}

export function SelectEncounterCombatantModal({
  open,
  onClose,
  headline,
  subheadline,
  size = 'standard',
  options,
  selectedIds,
  onApply,
  footerNote,
  headerSlot,
}: SelectEncounterCombatantModalProps) {
  const [filter, setFilter] = useState('')
  const [localSelected, setLocalSelected] = useState<string[]>(selectedIds)

  useEffect(() => {
    if (open) setLocalSelected(selectedIds)
  }, [open, selectedIds])

  const filtered = useMemo(() => {
    if (!filter.trim()) return options
    const lower = filter.toLowerCase()
    return options.filter(
      (o) => o.label.toLowerCase().includes(lower) || o.subtitle?.toLowerCase().includes(lower),
    )
  }, [options, filter])

  const toggleSelection = (id: string) => {
    setLocalSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const handleApply = () => {
    onApply(localSelected)
    onClose()
  }

  return (
    <AppModal
      open={open}
      onClose={onClose}
      headline={headline}
      subheadline={subheadline}
      size={size}
      primaryAction={{ label: 'Apply', onClick: handleApply }}
      secondaryAction={{ label: 'Cancel', onClick: onClose }}
      footerNote={footerNote}
    >
      <Stack spacing={2}>
        {headerSlot}

        <TextField
          fullWidth
          size="small"
          placeholder="Search…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          autoFocus
        />

        <Box sx={{ maxHeight: '50vh', overflowY: 'auto' }}>
          <Stack spacing={1}>
            {filtered.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No results found.
              </Typography>
            ) : (
              filtered.map((option) => {
                const isSelected = localSelected.includes(option.id)
                return (
                  <Paper
                    key={option.id}
                    variant="outlined"
                    onClick={() => toggleSelection(option.id)}
                    sx={{
                      p: 1.5,
                      cursor: 'pointer',
                      borderColor: isSelected ? 'primary.main' : 'divider',
                      bgcolor: isSelected ? 'action.selected' : undefined,
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <EntitySummaryCard
                      avatar={
                        <AppAvatar
                          src={resolveImageUrl(option.imageKey ?? option.imageUrl)}
                          name={option.label}
                          size="sm"
                        />
                      }
                      title={option.label}
                      subtitle={option.subtitle}
                      stats={option.stats}
                      titleVariant="body2"
                    />
                  </Paper>
                )
              })
            )}
          </Stack>
        </Box>
      </Stack>
    </AppModal>
  )
}
