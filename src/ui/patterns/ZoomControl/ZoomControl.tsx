import { useCallback, useEffect } from 'react'

import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong'
import FitScreenIcon from '@mui/icons-material/FitScreen'

export type ZoomControlProps = {
  zoom: number
  min?: number
  max?: number
  step?: number
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
  onLocateToken?: () => void
}

export function ZoomControl({
  zoom,
  min = 0.25,
  max = 3,
  step: _step,
  onZoomIn,
  onZoomOut,
  onReset,
  onLocateToken,
}: ZoomControlProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (!mod) return

      if (e.key === '=' || e.key === '+') {
        e.preventDefault()
        onZoomIn()
      } else if (e.key === '-') {
        e.preventDefault()
        onZoomOut()
      } else if (e.key === '0') {
        e.preventDefault()
        onReset()
      }
    },
    [onZoomIn, onZoomOut, onReset],
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const pct = Math.round(zoom * 100)

  return (
    <Paper
      elevation={4}
      sx={{
        position: 'fixed',
        bottom: 24,
        left: 24,
        zIndex: 'speedDial',
        borderRadius: 2,
        px: 0.5,
        py: 0.5,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={0.25}>
        <Tooltip title="Zoom out (Cmd −)" placement="top">
          <span>
            <IconButton size="small" onClick={onZoomOut} disabled={zoom <= min}>
              <RemoveIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title="Reset zoom (Cmd 0)" placement="top">
          <IconButton size="small" onClick={onReset} sx={{ fontSize: '0.75rem', fontWeight: 600, minWidth: 40 }}>
            {pct}%
          </IconButton>
        </Tooltip>

        <Tooltip title="Zoom in (Cmd +)" placement="top">
          <span>
            <IconButton size="small" onClick={onZoomIn} disabled={zoom >= max}>
              <AddIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title="Fit to view" placement="top">
          <IconButton size="small" onClick={onReset}>
            <FitScreenIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {onLocateToken && (
          <Tooltip title="Center on my token" placement="top">
            <IconButton size="small" onClick={onLocateToken}>
              <CenterFocusStrongIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
    </Paper>
  )
}
