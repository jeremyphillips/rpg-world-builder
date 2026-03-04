// features/levelUp/LevelUpWizard.tsx
//
// Lightweight multi-step wizard for completing a pending level-up.
// Uses AppModal as its shell and manages its own local state — fully
// independent of the character builder context.

import { useState, useCallback, useMemo } from 'react'
import { AppModal } from '@/ui/patterns'
import type { CharacterDoc } from '@/features/character/domain/types'
import type { LevelUpState, LevelUpResult, LevelUpStepId } from './levelUp.types'
import { useLevelUpSteps } from './useLevelUpSteps'
import {
  LevelUpHitPointsStep,
  LevelUpSubclassStep,
  LevelUpSpellStep,
  LevelUpFeaturesStep,
  LevelUpConfirmStep,
} from './steps'

import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import Chip from '@mui/material/Chip'
import { AppAlert } from '@/ui/primitives'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface LevelUpWizardProps {
  open: boolean
  onClose: () => void
  character: CharacterDoc
  /**
   * Called with the level-up result when the user confirms.
   * The parent is responsible for persisting the changes.
   */
  onComplete: (result: LevelUpResult) => Promise<void>
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildInitialState(character: CharacterDoc): LevelUpState {
  const primaryClassId =
    character.classes?.find(c => c.classId)?.classId ?? ''

  return {
    characterName: character.name,
    currentLevel: character.totalLevel ?? 1,
    pendingLevel: character.pendingLevel ?? (character.totalLevel ?? 1) + 1,
    classes: character.classes ?? [],
    primaryClassId,
    currentSpells: character.spells ?? [],

    hpGained: null,
    hpMethod: null,
    newSpells: [],
    removedSpells: [],
    subclassId: null,
    asiChoices: null,
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LevelUpWizard({
  open,
  onClose,
  character,
  onComplete,
}: LevelUpWizardProps) {
  const [state, setState] = useState<LevelUpState>(() =>
    buildInitialState(character),
  )
  const [activeIndex, setActiveIndex] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset state when the modal opens with a new character
  const handleOpen = useCallback(() => {
    setState(buildInitialState(character))
    setActiveIndex(0)
    setSaving(false)
    setError(null)
  }, [character])

  // Re-initialize when the character prop changes while open
  // (unlikely but defensive)
  useMemo(() => {
    if (open) handleOpen()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const steps = useLevelUpSteps(state)
  const currentStep = steps[activeIndex]
  const isFirst = activeIndex === 0
  const isLast = activeIndex === steps.length - 1

  // ── State updater ─────────────────────────────────────────────────
  const handleChange = useCallback((patch: Partial<LevelUpState>) => {
    setState(prev => ({ ...prev, ...patch }))
  }, [])

  // ── Validation per step ───────────────────────────────────────────
  const canAdvance = useMemo((): boolean => {
    if (!currentStep) return false

    switch (currentStep.id) {
      case 'hitPoints':
        return state.hpGained != null
      case 'subclass':
        return state.subclassId != null
      case 'spells':
        // Allow advancing even without picking all spells —
        // the confirm step shows the summary for review
        return true
      case 'features':
        return true
      case 'confirm':
        return true
      default:
        return true
    }
  }, [currentStep, state.hpGained, state.subclassId])

  // ── Navigation ────────────────────────────────────────────────────
  const handleBack = useCallback(() => {
    setActiveIndex(i => Math.max(0, i - 1))
  }, [])

  const handleNext = useCallback(() => {
    if (isLast) return
    setActiveIndex(i => Math.min(steps.length - 1, i + 1))
  }, [isLast, steps.length])

  // ── Submit ────────────────────────────────────────────────────────
  const handleConfirm = useCallback(async () => {
    setSaving(true)
    setError(null)

    try {
      // Build the updated classes array with incremented primary class level
      const levelsGained = state.pendingLevel - state.currentLevel
      const updatedClasses = state.classes.map(cls => {
        if (cls.classId === state.primaryClassId) {
          return {
            ...cls,
            level: cls.level + levelsGained,
            ...(state.subclassId ? { subclassId: state.subclassId } : {}),
          }
        }
        return cls
      })

      // Build final spell list
      const spellSet = new Set(state.currentSpells)
      for (const id of state.removedSpells) spellSet.delete(id)
      for (const id of state.newSpells) spellSet.add(id)

      const currentHpTotal = character.hitPoints?.total ?? 0
      const newHpTotal = currentHpTotal + (state.hpGained ?? 0)

      const result: LevelUpResult = {
        totalLevel: state.pendingLevel,
        classes: updatedClasses,
        hitPoints: {
          total: newHpTotal,
          generationMethod: state.hpMethod ?? 'average',
        },
        spells: [...spellSet],
        ...(state.subclassId ? { subclassId: state.subclassId } : {}),
      }

      await onComplete(result)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete level-up')
      setSaving(false)
    }
  }, [state, character, onComplete, onClose])

  // ── Render current step ───────────────────────────────────────────
  const renderStep = () => {
    if (!currentStep) return null

    switch (currentStep.id) {
      case 'subclass':
        return <LevelUpSubclassStep state={state} onChange={handleChange} />
      case 'hitPoints':
        return <LevelUpHitPointsStep state={state} onChange={handleChange} />
      case 'spells':
        return <LevelUpSpellStep state={state} onChange={handleChange} />
      case 'features':
        return <LevelUpFeaturesStep state={state} />
      case 'confirm':
        return <LevelUpConfirmStep state={state} />
      default:
        return null
    }
  }

  // ── Step indicator chips ──────────────────────────────────────────
  const stepChips = (
    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
      {steps.map((step, idx) => (
        <Chip
          key={step.id}
          label={step.label}
          size="small"
          variant={idx === activeIndex ? 'filled' : 'outlined'}
          color={idx < activeIndex ? 'success' : idx === activeIndex ? 'primary' : 'default'}
          onClick={idx < activeIndex ? () => setActiveIndex(idx) : undefined}
          sx={{ cursor: idx < activeIndex ? 'pointer' : 'default' }}
        />
      ))}
    </Stack>
  )

  return (
    <AppModal
      open={open}
      onClose={onClose}
      headline={`Level Up — ${state.characterName}`}
      subheadline={`Level ${state.currentLevel} → ${state.pendingLevel}`}
      size="standard"
      showCloseButton
      closeOnBackdropClick={false}
      closeOnEsc={false}
      discardWarning={{
        headline: 'Abandon level-up?',
        description:
          'Your choices will be lost. You can restart the level-up process later.',
        confirmLabel: 'Abandon',
        cancelLabel: 'Continue',
      }}
      onBeforeClose={() => false}
      actions={
        <>
          {!isFirst && (
            <Button
              onClick={handleBack}
              variant="outlined"
              color="secondary"
              disabled={saving}
            >
              Back
            </Button>
          )}
          {isLast ? (
            <Button
              onClick={handleConfirm}
              variant="contained"
              disabled={saving || !canAdvance}
              startIcon={
                saving ? (
                  <CircularProgress size={18} color="inherit" />
                ) : undefined
              }
            >
              {saving ? 'Saving...' : 'Complete Level-Up'}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              variant="contained"
              disabled={!canAdvance}
            >
              Next
            </Button>
          )}
        </>
      }
    >
      {error && (
        <AppAlert tone="danger" sx={{ mb: 2 }}>
          {error}
        </AppAlert>
      )}

      {stepChips}
      {renderStep()}
    </AppModal>
  )
}
