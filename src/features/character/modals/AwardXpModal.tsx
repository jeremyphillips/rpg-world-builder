import { useState, useCallback } from 'react'

import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'

import { AppModal } from '@/ui/modals'
import { getLevelForXp, getXpByLevelAndEdition } from '@/features/mechanics/domain/progression'
import type { EditionId } from '@/data'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AwardXpModalProps {
  open: boolean
  onClose: () => void
  /** Character display name */
  characterName: string
  /** Current confirmed XP */
  currentXp: number
  /** Current character level */
  currentLevel: number
  /** Edition ID for XP table lookups */
  editionId: EditionId
  /** Primary class ID (needed for pre-3e class-specific XP tables) */
  primaryClassId?: string
  /** Max level for this edition */
  maxLevel: number
  /**
   * Called when the admin confirms the XP award.
   * Should persist the change and return a promise.
   */
  onAward: (params: {
    newXp: number
    triggersLevelUp: boolean
    pendingLevel?: number
  }) => Promise<void>
}

type ModalStep = 'input' | 'confirm' | 'success'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AwardXpModal({
  open,
  onClose,
  characterName,
  currentXp,
  currentLevel,
  editionId,
  primaryClassId,
  maxLevel,
  onAward,
}: AwardXpModalProps) {
  const [step, setStep] = useState<ModalStep>('input')
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calculated values (only meaningful when amount is valid)
  const parsedAmount = parseInt(amount, 10)
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount > 0
  const newXp = currentXp + (isValidAmount ? parsedAmount : 0)
  const calculatedLevel = isValidAmount
    ? getLevelForXp(newXp, editionId, primaryClassId)
    : currentLevel
  const triggersLevelUp = calculatedLevel > currentLevel
  const levelsGained = calculatedLevel - currentLevel
  const isMultiLevelJump = levelsGained > 1
  const nextLevelXp = currentLevel < maxLevel
    ? getXpByLevelAndEdition(currentLevel + 1, editionId, primaryClassId)
    : 0

  // ── Reset on open/close ──────────────────────────────────────────────
  const handleClose = useCallback(() => {
    setStep('input')
    setAmount('')
    setError(null)
    setSaving(false)
    onClose()
  }, [onClose])

  // ── Submit handler ───────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!isValidAmount) return

    if (triggersLevelUp && step === 'input') {
      // Show confirmation step
      setStep('confirm')
      return
    }

    // Either no level-up (submit from input) or confirmed (submit from confirm)
    setSaving(true)
    setError(null)
    try {
      await onAward({
        newXp,
        triggersLevelUp,
        pendingLevel: triggersLevelUp ? calculatedLevel : undefined,
      })
      if (triggersLevelUp) {
        setStep('success')
        setSaving(false)
      } else {
        handleClose()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to award XP')
      setSaving(false)
    }
  }, [isValidAmount, triggersLevelUp, step, newXp, calculatedLevel, onAward, handleClose])

  // ── Step: Input ──────────────────────────────────────────────────────
  if (step === 'input') {
    return (
      <AppModal
        open={open}
        onClose={handleClose}
        headline="Award XP"
        size="compact"
        actions={
          <>
            <Button onClick={handleClose} variant="outlined" color="secondary">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={!isValidAmount || saving}
              startIcon={saving ? <CircularProgress size={18} color="inherit" /> : undefined}
            >
              {saving ? 'Saving…' : 'Award'}
            </Button>
          </>
        }
      >
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <TextField
          label="XP to award"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          fullWidth
          autoFocus
          slotProps={{ htmlInput: { min: 1 } }}
          helperText={
            nextLevelXp > 0
              ? `Current: ${currentXp.toLocaleString()} XP · Next level at ${nextLevelXp.toLocaleString()} XP`
              : `Current: ${currentXp.toLocaleString()} XP · Max level reached`
          }
        />

        {isMultiLevelJump && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            This will advance <strong>{characterName}</strong> by{' '}
            <strong>{levelsGained} levels</strong> (level {currentLevel} &rarr;{' '}
            {calculatedLevel}). Double-check the amount is correct.
          </Alert>
        )}
      </AppModal>
    )
  }

  // ── Step: Confirm level-up ───────────────────────────────────────────
  if (step === 'confirm') {
    return (
      <AppModal
        open={open}
        onClose={handleClose}
        headline="Confirm Level Advancement"
        size="compact"
        actions={
          <>
            <Button onClick={() => setStep('input')} variant="outlined" color="secondary" disabled={saving}>
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={saving}
              startIcon={saving ? <CircularProgress size={18} color="inherit" /> : undefined}
            >
              {saving ? 'Saving…' : 'Confirm'}
            </Button>
          </>
        }
      >
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Alert severity={isMultiLevelJump ? 'warning' : 'info'} sx={{ mb: 2 }}>
          Awarding <strong>{parsedAmount.toLocaleString()} XP</strong> will advance{' '}
          <strong>{characterName}</strong> from level{' '}
          <strong>{currentLevel}</strong> to level{' '}
          <strong>{calculatedLevel}</strong>
          {isMultiLevelJump && (
            <> — that's <strong>{levelsGained} levels</strong> at once</>
          )}
          .
        </Alert>

        <Typography variant="body2" color="text.secondary">
          The character's level will not change immediately. {characterName}'s
          owner will receive a notification and must complete the level-up
          process (choose new features, spells, etc.) before the level is
          updated.
        </Typography>
      </AppModal>
    )
  }

  // ── Step: Success ────────────────────────────────────────────────────
  return (
    <AppModal
      open={open}
      onClose={handleClose}
      headline="XP Awarded"
      size="compact"
      showCloseButton={false}
      actions={
        <Button onClick={handleClose} variant="contained">
          Close
        </Button>
      }
    >
      <Alert severity="success">
        <strong>{characterName}</strong> has been awarded{' '}
        <strong>{parsedAmount.toLocaleString()} XP</strong>. Level advancement
        to <strong>{calculatedLevel}</strong> is pending.
      </Alert>
    </AppModal>
  )
}
