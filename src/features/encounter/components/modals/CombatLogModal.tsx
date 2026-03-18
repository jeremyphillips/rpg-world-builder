import { useEffect, useMemo, useRef, useState } from 'react'

import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'

import { AppModal } from '@/ui/patterns'
import type { CombatLogEvent } from '@/features/mechanics/domain/encounter'
import type { CombatLogPresentationMode } from '../../domain/combat-log.types'
import {
  filterLogByMode,
  groupLogEntries,
  formatLogGroupHeader,
} from '../../domain'
import { toCombatLogEntries } from '../../helpers'

type CombatLogModalProps = {
  open: boolean
  onClose: () => void
  log: CombatLogEvent[]
}

export function CombatLogModal({ open, onClose, log }: CombatLogModalProps) {
  const [mode, setMode] = useState<CombatLogPresentationMode>('normal')
  const scrollRef = useRef<HTMLDivElement>(null)

  const entries = useMemo(() => toCombatLogEntries(log), [log])
  const filtered = useMemo(() => filterLogByMode(entries, mode), [entries, mode])
  const groups = useMemo(() => groupLogEntries(filtered), [filtered])

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [groups])

  return (
    <AppModal
      open={open}
      onClose={onClose}
      headline="Combat Log"
      size="wide"
      secondaryAction={{ label: 'Close', onClick: onClose }}
    >
      <Stack spacing={2}>
        <ToggleButtonGroup
          value={mode}
          exclusive
          size="small"
          onChange={(_, next) => next && setMode(next)}
        >
          <ToggleButton value="compact">Headline</ToggleButton>
          <ToggleButton value="normal">Detail</ToggleButton>
          <ToggleButton value="debug">Debug</ToggleButton>
        </ToggleButtonGroup>

        <Box
          ref={scrollRef}
          sx={{ maxHeight: '60vh', overflowY: 'auto' }}
        >
          {groups.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No log entries yet.</Typography>
          ) : (
            <Stack spacing={2}>
              {groups.map((group) => (
                <Box key={group.groupKey}>
                  <Typography
                    variant="overline"
                    color="text.secondary"
                    sx={{ fontSize: '0.7rem', mb: 0.5, display: 'block' }}
                  >
                    {formatLogGroupHeader(group)}
                  </Typography>
                  <Stack spacing={0.5}>
                    {group.entries.map((entry) => (
                      <Box key={entry.id} sx={{ pl: 1, borderLeft: '2px solid', borderColor: 'divider' }}>
                        <Typography variant="body2">{entry.message}</Typography>
                        {entry.details && entry.details.length > 0 && (
                          <Box sx={{ pl: 2 }}>
                            {entry.details.map((d, i) => (
                              <Typography key={i} variant="caption" color="text.secondary" display="block">
                                {d}
                              </Typography>
                            ))}
                          </Box>
                        )}
                        {mode === 'debug' && entry.debugDetails && entry.debugDetails.length > 0 && (
                          <Box sx={{ pl: 2 }}>
                            {entry.debugDetails.map((d, i) => (
                              <Typography
                                key={i}
                                variant="caption"
                                color="text.disabled"
                                display="block"
                                sx={{ fontFamily: 'monospace' }}
                              >
                                {d}
                              </Typography>
                            ))}
                          </Box>
                        )}
                      </Box>
                    ))}
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      </Stack>
    </AppModal>
  )
}
