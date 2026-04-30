import { useCallback } from 'react';
import type { ValidationError } from './editRoute.types';

type FeedbackSetters = {
  setSaving: (v: boolean) => void;
  setSuccess: (v: boolean) => void;
  setErrors: (v: ValidationError[]) => void;
};

/**
 * Form-values → domain input mapper.
 *
 * The optional `original` argument lets mappers preserve domain-side fields
 * the form does not author yet (see `mergePreserveExtras`). Existing one-arg
 * `toInput(values)` callers continue to work unchanged.
 */
export type CampaignEntryToInput<TFormValues, TInput, TEntity> = (
  values: TFormValues,
  original?: TEntity | undefined,
) => TInput;

export function useCampaignEntrySubmit<TFormValues, TInput, TEntity>(params: {
  campaignId: string | undefined;
  entryId: string | undefined;
  updateEntry: (campaignId: string, entryId: string, input: TInput) => Promise<TEntity>;
  reset: (values: TFormValues) => void;
  toFormValues: (entity: TEntity) => TFormValues;
  toInput: CampaignEntryToInput<TFormValues, TInput, TEntity>;
  /**
   * Currently-loaded domain entry, threaded into `toInput` so mappers can
   * merge form values with fields the UI does not author yet. Optional —
   * mappers that ignore it remain backward-compatible.
   */
  originalEntry?: TEntity | null | undefined;
  feedback: FeedbackSetters;
}) {
  const {
    campaignId,
    entryId,
    updateEntry,
    reset,
    toFormValues,
    toInput,
    originalEntry,
    feedback: { setSaving, setSuccess, setErrors },
  } = params;

  return useCallback(
    async (values: TFormValues) => {
      if (!campaignId || !entryId) return;
      setSaving(true);
      setSuccess(false);
      setErrors([]);
      const input = toInput(values, originalEntry ?? undefined);
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
      originalEntry,
      setSaving,
      setSuccess,
      setErrors,
    ]
  );
}
