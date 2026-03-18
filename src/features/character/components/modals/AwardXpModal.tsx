import { useState, useCallback } from 'react'

import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { AppAlert } from '@/ui/primitives'
import CircularProgress from '@mui/material/CircularProgress'

import { AppModal } from '@/ui/patterns'
import { getLevelForXp, getXpForLevel } from '@/features/mechanics/domain/progression'
import { useCampaignRules } from '@/app/providers/CampaignRulesProvider'
import { resolveXpTable } from '@/features/mechanics/domain/progression'

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
  /** Max level for this campaign */
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
  maxLevel,
  onAward,
}: AwardXpModalProps) {
  const { ruleset } = useCampaignRules()
  const xpTable = resolveXpTable(ruleset.mechanics.progression.xp); 

  const [step, setStep] = useState<ModalStep>('input')
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calculated values (only meaningful when amount is valid)
  const parsedAmount = parseInt(amount, 10)
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount > 0
  const newXp = currentXp + (isValidAmount ? parsedAmount : 0)
  const calculatedLevel = isValidAmount
    ? getLevelForXp(newXp, xpTable)
    : currentLevel
  const triggersLevelUp = calculatedLevel > currentLevel
  const levelsGained = calculatedLevel - currentLevel
  const isMultiLevelJump = levelsGained > 1
  const nextLevelXp = currentLevel < maxLevel
    ? getXpForLevel(currentLevel + 1, xpTable)
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
      setStep('confirm')
      return
    }

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
        {error && <AppAlert tone="danger" sx={{ mb: 2 }}>{error}</AppAlert>}

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
          <AppAlert tone="warning" sx={{ mt: 2 }}>
            This will advance <strong>{characterName}</strong> by{' '}
            <strong>{levelsGained} levels</strong> (level {currentLevel} &rarr;{' '}
            {calculatedLevel}). Double-check the amount is correct.
          </AppAlert>
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
        {error && <AppAlert tone="danger" sx={{ mb: 2 }}>{error}</AppAlert>}

        <AppAlert tone={isMultiLevelJump ? 'warning' : 'info'} sx={{ mb: 2 }}>
          Awarding <strong>{parsedAmount.toLocaleString()} XP</strong> will advance{' '}
          <strong>{characterName}</strong> from level{' '}
          <strong>{currentLevel}</strong> to level{' '}
          <strong>{calculatedLevel}</strong>
          {isMultiLevelJump && (
            <> — that's <strong>{levelsGained} levels</strong> at once</>
          )}
          .
        </AppAlert>

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
      <AppAlert tone="success">
        <strong>{characterName}</strong> has been awarded{' '}
        <strong>{parsedAmount.toLocaleString()} XP</strong>. Level advancement
        to <strong>{calculatedLevel}</strong> is pending.
      </AppAlert>
    </AppModal>
  )
}
