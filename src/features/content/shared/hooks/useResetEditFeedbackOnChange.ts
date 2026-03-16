import { useEffect } from 'react';

export function useResetEditFeedbackOnChange(
  watch: (callback: () => void) => { unsubscribe: () => void },
  clearFeedback: () => void
) {
  useEffect(() => {
    const subscription = watch(() => clearFeedback());
    return () => subscription.unsubscribe();
  }, [watch, clearFeedback]);
}
