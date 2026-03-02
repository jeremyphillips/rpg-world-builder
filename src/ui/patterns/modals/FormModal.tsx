import { useState, useCallback, useEffect, useImperativeHandle } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import type { FieldValues } from 'react-hook-form'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'

import { DynamicFormRenderer } from '@/ui/patterns'
import AppModal from './AppModal'
import type { FormModalProps } from './modal.types'

// ---------------------------------------------------------------------------
// FormModal — owns react-hook-form context, auto-tracks async submit,
// auto-closes on success, blocks close when dirty.
// ---------------------------------------------------------------------------

function FormModal<T extends FieldValues>({
  open,
  onClose,
  onSubmit,
  headline,
  headlineIcon,
  subheadline,
  description,
  fields,
  defaultValues,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  size = 'standard',
  loading: externalLoading = false,
  formRef,
  preventCloseOnDirty = true,
  discardWarning,
  footerNote,
  alert: externalAlert,
}: FormModalProps<T>) {
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const methods = useForm<T>({ defaultValues, mode: 'onBlur' })
  const { handleSubmit, reset, formState: { isDirty } } = methods

  // Expose form instance to consumer via ref
  useImperativeHandle(formRef, () => methods, [methods])

  // Reset form state when modal opens with fresh defaults
  useEffect(() => {
    if (open) {
      reset(defaultValues)
      setSubmitError(null)
    }
  }, [open, defaultValues, reset])

  // -----------------------------------
  // Submit handler — async-aware
  // -----------------------------------

  const handleFormSubmit = useCallback(
    async (data: T) => {
      setSubmitting(true)
      setSubmitError(null)
      try {
        await onSubmit(data)
        reset()
        onClose()
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Something went wrong.'
        setSubmitError(message)
      } finally {
        setSubmitting(false)
      }
    },
    [onSubmit, onClose, reset],
  )

  // -----------------------------------
  // Close guard — block when dirty
  // -----------------------------------

  const handleBeforeClose = useCallback(
    () => {
      if (preventCloseOnDirty && isDirty) return false
      return true
    },
    [preventCloseOnDirty, isDirty],
  )

  const handleCancel = useCallback(() => {
    if (preventCloseOnDirty && isDirty) {
      // Let AppModal's discard flow handle it
      return
    }
    reset()
    onClose()
  }, [preventCloseOnDirty, isDirty, reset, onClose])

  // -----------------------------------
  // Derived state
  // -----------------------------------

  const isLoading = externalLoading || submitting

  const alert = submitError
    ? { severity: 'error' as const, message: submitError }
    : externalAlert

  return (
    <AppModal
      open={open}
      onClose={onClose}
      size={size}
      headline={headline}
      headlineIcon={headlineIcon}
      subheadline={subheadline}
      description={description}
      alert={alert}
      loading={isLoading}
      footerNote={footerNote}
      onBeforeClose={handleBeforeClose}
      discardWarning={discardWarning}
      closeOnBackdropClick={!isLoading}
      closeOnEsc={!isLoading}
      actions={
        <Stack direction="row" spacing={1}>
          <Button
            onClick={handleCancel}
            disabled={isLoading}
            variant="outlined"
            color="secondary"
          >
            {cancelLabel}
          </Button>
          <Button
            type="submit"
            form="form-modal-form"
            disabled={isLoading}
            variant="contained"
            startIcon={
              isLoading
                ? <CircularProgress size={18} color="inherit" />
                : undefined
            }
          >
            {submitLabel}
          </Button>
        </Stack>
      }
    >
      <FormProvider {...methods}>
        <form
          id="form-modal-form"
          onSubmit={handleSubmit(handleFormSubmit)}
          noValidate
        >
          <DynamicFormRenderer fields={fields} />
        </form>
      </FormProvider>
    </AppModal>
  )
}

export default FormModal
