import { useEffect, type ReactNode } from 'react'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'

import { useCharacterBuilder } from '../../context'
import { getStepConfig } from '../../constants'
import type { HitPointMode } from '@/features/mechanics/domain/progression'
import InvalidationConfirmDialog from '@/features/characterBuilder/components/InvalidationConfirmDialog/InvalidationConfirmDialog'

export type AbilityScoreMode = 'default' | 'ai' | 'custom'

export type CharacterBuilderWizardProps = {
  onGenerate: () => void
  isGenerating?: boolean
  hitPointMode?: HitPointMode
  /**
   * How ability scores are generated:
   * - 'ai': let the AI generate scores (current behavior)
   * - 'custom': user-defined (TODO)
   */
  abilityScoreMode?: AbilityScoreMode
  /** When set, locks the wizard to a single step with Save/Cancel buttons. */
  editStepId?: string
  onSave?: () => void
  /** Optional cancel/exit action (useful for inline usage without a modal). */
  onCancel?: () => void
  children: (slots: {
    /** The current step's rendered component. */
    content: ReactNode
    /** Back / Next / Generate action buttons. */
    actions: ReactNode
  }) => ReactNode
}

const CharacterBuilderWizard = ({
  onGenerate,
  isGenerating = false,
  hitPointMode = 'average',
  editStepId,
  onSave,
  onCancel,
  children,
}: CharacterBuilderWizardProps) => {
  const {
    state,
    nextStep,
    prevStep,
    setHitPointMode,
    pendingInvalidations,
    confirmChange,
    cancelChange,
  } = useCharacterBuilder()

  useEffect(() => {
    if (hitPointMode !== state.hitPointMode) {
      setHitPointMode(hitPointMode)
    }
  }, [hitPointMode, state.hitPointMode, setHitPointMode])

  const isEditMode = !!editStepId
  const stepConfig = getStepConfig(state.type ?? 'pc')
  const currentStepIndex = Math.max(0, stepConfig.findIndex(step => step.id === state.step.id))
  const currentStep = stepConfig[currentStepIndex]
  const StepComponent = currentStep.component
  const isNextDisabled = !currentStep.selector(state)
  const isLastStep = currentStepIndex === stepConfig.length - 1

  // Find the first non-skipped step to determine if Back should be shown
  const firstVisibleIndex = stepConfig.findIndex(s => !s.shouldSkip?.(state))
  const isFirstStep = currentStepIndex <= firstVisibleIndex

  const content = <StepComponent />

  const actions = isEditMode ? (
    <>
      {onCancel && (
        <Button onClick={onCancel} variant="outlined" color="secondary">
          Cancel
        </Button>
      )}
      <Button
        onClick={onSave ?? onGenerate}
        variant="contained"
        color="primary"
      >
        Save
      </Button>
    </>
  ) : (
    <>
      {onCancel && isFirstStep && (
        <Button onClick={onCancel} variant="outlined" color="secondary" disabled={isGenerating}>
          Cancel
        </Button>
      )}

      {!isFirstStep && (
        <Button onClick={prevStep} variant="outlined" color="secondary" disabled={isGenerating}>
          Back
        </Button>
      )}

      {!isLastStep && (
        <Button onClick={nextStep} disabled={isNextDisabled || isGenerating} variant="contained">
          Next
        </Button>
      )}

      {isLastStep && (
        <Button
          onClick={onGenerate}
          variant="contained"
          color="primary"
          disabled={isGenerating}
          startIcon={isGenerating ? <CircularProgress size={18} color="inherit" /> : undefined}
        >
          {isGenerating ? 'Generating…' : 'Generate Character'}
        </Button>
      )}
    </>
  )

  return (
    <>
      {children({ content, actions })}

      <InvalidationConfirmDialog
        invalidations={pendingInvalidations}
        onConfirm={confirmChange}
        onCancel={cancelChange}
      />
    </>
  )
}

export default CharacterBuilderWizard
