import { useCallback } from 'react';
import type { ValidationError } from './editRoute.types';

type FeedbackSetters = {
  setSaving: (v: boolean) => void;
  setSuccess: (v: boolean) => void;
  setErrors: (v: ValidationError[]) => void;
};

export function useCampaignEntrySubmit<TFormValues, TInput, TEntity>(params: {
  campaignId: string | undefined;
  entryId: string | undefined;
  updateEntry: (campaignId: string, entryId: string, input: TInput) => Promise<TEntity>;
  reset: (values: TFormValues) => void;
  toFormValues: (entity: TEntity) => TFormValues;
  toInput: (values: TFormValues) => TInput;
  feedback: FeedbackSetters;
}) {
  const {
    campaignId,
    entryId,
    updateEntry,
    reset,
    toFormValues,
    toInput,
    feedback: { setSaving, setSuccess, setErrors },
  } = params;

  return useCallback(
    async (values: TFormValues) => {
      if (!campaignId || !entryId) return;
      setSaving(true);
      setSuccess(false);
      setErrors([]);
      const input = toInput(values);
      try {
        const updated = await updateEntry(campaignId, entryId, input);
        reset(toFormValues(updated));
        setSuccess(true);
      } catch (err) {
        setErrors([
          { path: '', code: 'SAVE_FAILED', message: (err as Error).message },
        ]);
      } finally {
        setSaving(false);
      }
    },
    [
      campaignId,
      entryId,
      updateEntry,
      reset,
      toFormValues,
      toInput,
      setSaving,
      setSuccess,
      setErrors,
    ]
  );
}
