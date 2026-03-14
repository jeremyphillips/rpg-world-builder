import { useEffect } from 'react';

export function useResetEditFeedbackOnChange(
  watch: (callback: () => void) => () => void,
  clearFeedback: () => void
) {
  useEffect(() => {
    return watch(() => clearFeedback());
  }, [watch, clearFeedback]);
}
