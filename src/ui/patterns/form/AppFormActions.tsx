import { Button, Stack } from '@mui/material';
import { useFormContext } from 'react-hook-form';

export type AppFormActionsProps = {
  submitLabel?: string;
  resetLabel?: string;
  showReset?: boolean;
  disabled?: boolean;
};

export default function AppFormActions({
  submitLabel = 'Submit',
  resetLabel = 'Reset',
  showReset = false,
  disabled,
}: AppFormActionsProps) {
  const {
    reset,
    formState: { isSubmitting },
  } = useFormContext();

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
      <Button type="submit" variant="contained" disabled={disabled || isSubmitting}>
        {submitLabel}
      </Button>
    </Stack>
  );
}
