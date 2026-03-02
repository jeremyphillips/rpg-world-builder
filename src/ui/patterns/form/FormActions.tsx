import { Button, Stack } from '@mui/material'
import { useFormContext } from 'react-hook-form'

type FormActionsProps = {
  submitLabel?: string
  resetLabel?: string
  showReset?: boolean
  disabled?: boolean
}

export default function FormActions({
  submitLabel = 'Submit',
  resetLabel = 'Reset',
  showReset = false,
  disabled
}: FormActionsProps) {
  const { reset, formState: { isSubmitting } } = useFormContext()

  return (
    <Stack direction="row" spacing={2} justifyContent="flex-end">
      {showReset && (
        <Button
          type="button"
          variant="outlined"
          onClick={() => reset()}
          disabled={isSubmitting}
        >
          {resetLabel}
        </Button>
      )}
      <Button
        type="submit"
        variant="contained"
        disabled={disabled || isSubmitting}
      >
        {submitLabel}
      </Button>
    </Stack>
  )
}
