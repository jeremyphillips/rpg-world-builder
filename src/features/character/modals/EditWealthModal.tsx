import { useState, useCallback, useMemo } from 'react'

import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

import { AppModal } from '@/ui/patterns'
import { ConfirmModal } from '@/ui/patterns'
import type { Wealth } from '@/features/character/domain/types'
import { AppAlert } from '@/ui/primitives'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EditWealthModalProps = {
  open: boolean
  onClose: () => void
  currentWealth: Wealth
  onSave: (wealth: { gp: number; sp: number; cp: number }) => Promise<void>
}

type Mode = 'delta' | 'exact'
type DeltaDirection = 'add' | 'remove'

// ---------------------------------------------------------------------------
// Currency helpers
// ---------------------------------------------------------------------------

function toCopper(gp: number, sp: number, cp: number): number {
  return gp * 100 + sp * 10 + cp
}

function fromCopper(totalCp: number): { gp: number; sp: number; cp: number } {
  const gp = Math.floor(totalCp / 100)
  const remainder = totalCp - gp * 100
  const sp = Math.floor(remainder / 10)
  const cp = remainder - sp * 10
  return { gp, sp, cp }
}

function safeNum(v: number | null | undefined): number {
  return v ?? 0
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EditWealthModal({
  open,
  onClose,
  currentWealth,
  onSave,
}: EditWealthModalProps) {
  const [mode, setMode] = useState<Mode>('delta')
  const [direction, setDirection] = useState<DeltaDirection>('add')
  const [deltaGp, setDeltaGp] = useState(0)
  const [deltaSp, setDeltaSp] = useState(0)
  const [deltaCp, setDeltaCp] = useState(0)
  const [exactGp, setExactGp] = useState(safeNum(currentWealth.gp))
  const [exactSp, setExactSp] = useState(safeNum(currentWealth.sp))
  const [exactCp, setExactCp] = useState(safeNum(currentWealth.cp))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [discardOpen, setDiscardOpen] = useState(false)

  // Reset all fields whenever the modal opens with fresh data
  const resetFields = useCallback(() => {
    setMode('delta')
    setDirection('add')
    setDeltaGp(0)
    setDeltaSp(0)
    setDeltaCp(0)
    setExactGp(safeNum(currentWealth.gp))
    setExactSp(safeNum(currentWealth.sp))
    setExactCp(safeNum(currentWealth.cp))
    setSaving(false)
    setError(null)
    setDiscardOpen(false)
  }, [currentWealth])

  // ── Dirty check ────────────────────────────────────────────────────────
  const isDirty = useMemo(() => {
    if (mode === 'delta') {
      return deltaGp !== 0 || deltaSp !== 0 || deltaCp !== 0
    }
    return (
      exactGp !== safeNum(currentWealth.gp) ||
      exactSp !== safeNum(currentWealth.sp) ||
      exactCp !== safeNum(currentWealth.cp)
    )
  }, [mode, deltaGp, deltaSp, deltaCp, exactGp, exactSp, exactCp, currentWealth])

  // ── Computed preview (delta mode) ──────────────────────────────────────
  const currentCp = toCopper(safeNum(currentWealth.gp), safeNum(currentWealth.sp), safeNum(currentWealth.cp))
  const deltaTotalCp = toCopper(deltaGp, deltaSp, deltaCp)
  const afterCp =
    direction === 'add' ? currentCp + deltaTotalCp : currentCp - deltaTotalCp
  const afterNormalized = fromCopper(Math.max(0, afterCp))
  const deltaResultNegative = afterCp < 0

  // ── Computed preview (exact mode) ──────────────────────────────────────
  const exactTotalCp = toCopper(exactGp, exactSp, exactCp)
  const exactNormalized = fromCopper(exactTotalCp)
  const exactResultNegative = exactTotalCp < 0

  // ── Save disabled check ────────────────────────────────────────────────
  const saveDisabled =
    saving ||
    !isDirty ||
    (mode === 'delta' && deltaResultNegative) ||
    (mode === 'exact' && exactResultNegative)

  // ── Close guard ────────────────────────────────────────────────────────
  const handleAttemptClose = useCallback(() => {
    if (isDirty) {
      setDiscardOpen(true)
    } else {
      resetFields()
      onClose()
    }
  }, [isDirty, resetFields, onClose])

  const handleDiscard = useCallback(() => {
    setDiscardOpen(false)
    resetFields()
    onClose()
  }, [resetFields, onClose])

  // ── Save ───────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    setSaving(true)
    setError(null)
    try {
      if (mode === 'delta') {
        await onSave(afterNormalized)
      } else {
        await onSave(exactNormalized)
      }
      resetFields()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update wealth')
      setSaving(false)
    }
  }, [mode, afterNormalized, exactNormalized, onSave, resetFields, onClose])

  // ── Number input helper ────────────────────────────────────────────────
  const numField = (
    label: string,
    value: number,
    onChange: (v: number) => void,
    opts?: { min?: number },
  ) => (
    <TextField
      label={label}
      type="number"
      size="small"
      value={value}
      onChange={e => onChange(Math.max(opts?.min ?? 0, parseInt(e.target.value, 10) || 0))}
      slotProps={{ htmlInput: { min: opts?.min ?? 0 } }}
      sx={{ width: 100 }}
    />
  )

  return (
    <>
      <AppModal
        open={open}
        onClose={handleAttemptClose}
        headline="Edit Wealth"
        size="compact"
        actions={
          <>
            <Button onClick={handleAttemptClose} variant="outlined" color="secondary" disabled={saving}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              variant="contained"
              disabled={saveDisabled}
              startIcon={saving ? <CircularProgress size={18} color="inherit" /> : undefined}
            >
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </>
        }
      >
        {error && <AppAlert tone="danger" sx={{ mb: 2 }}>{error}</AppAlert>}

        {/* Mode toggle */}
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={(_, v) => { if (v) setMode(v as Mode) }}
          size="small"
          sx={{ mb: 2 }}
        >
          <ToggleButton value="delta">Add / Remove</ToggleButton>
          <ToggleButton value="exact">Set Exact</ToggleButton>
        </ToggleButtonGroup>

        {/* ── Delta mode ─────────────────────────────────────────── */}
        {mode === 'delta' && (
          <Box>
            <ToggleButtonGroup
              value={direction}
              exclusive
              onChange={(_, v) => { if (v) setDirection(v as DeltaDirection) }}
              size="small"
              color={direction === 'add' ? 'success' : 'error'}
              sx={{ mb: 2 }}
            >
              <ToggleButton value="add">Add</ToggleButton>
              <ToggleButton value="remove">Remove</ToggleButton>
            </ToggleButtonGroup>

            <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
              {numField('GP', deltaGp, setDeltaGp)}
              {numField('SP', deltaSp, setDeltaSp)}
              {numField('CP', deltaCp, setDeltaCp)}
            </Stack>

            {/* Live preview */}
            <Box sx={{ bgcolor: 'action.hover', borderRadius: 1, p: 1.5 }}>
              <Stack spacing={0.5}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Before</Typography>
                  <Typography variant="body2">
                    {safeNum(currentWealth.gp)} gp · {safeNum(currentWealth.sp)} sp · {safeNum(currentWealth.cp)} cp
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Change</Typography>
                  <Typography variant="body2" color={direction === 'add' ? 'success.main' : 'error.main'}>
                    {direction === 'add' ? '+' : '−'}{deltaGp} gp · {deltaSp} sp · {deltaCp} cp
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>After</Typography>
                  <Typography variant="body2" fontWeight={600} color={deltaResultNegative ? 'error.main' : 'text.primary'}>
                    {deltaResultNegative
                      ? 'Insufficient funds'
                      : `${afterNormalized.gp} gp · ${afterNormalized.sp} sp · ${afterNormalized.cp} cp`}
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          </Box>
        )}

        {/* ── Set exact mode ─────────────────────────────────────── */}
        {mode === 'exact' && (
          <Box>
            <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
              {numField('GP', exactGp, setExactGp)}
              {numField('SP', exactSp, setExactSp)}
              {numField('CP', exactCp, setExactCp)}
            </Stack>

            <Typography variant="body2" color="text.secondary">
              Will be saved as: {exactNormalized.gp} gp · {exactNormalized.sp} sp · {exactNormalized.cp} cp
            </Typography>
          </Box>
        )}
      </AppModal>

      {/* Discard confirmation */}
      <ConfirmModal
        open={discardOpen}
        headline="Discard changes?"
        description="You have unsaved changes. Discard them?"
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        onConfirm={handleDiscard}
        onCancel={() => setDiscardOpen(false)}
      />
    </>
  )
}
