import { useCallback, type RefObject } from 'react';
import {
  upsertEntryPatch,
  removeEntryPatch,
} from '@/features/content/shared/domain/contentPatchRepo';
import type { ContentTypeKey } from '@/features/content/shared/domain/patches/contentPatch.types';
import type { PatchDriver } from '@/features/content/shared/editor/patchDriver';
import type { ValidationError } from './editRoute.types';

type FeedbackSetters = {
  setSaving: (v: boolean) => void;
  setSuccess: (v: boolean) => void;
  setErrors: (v: ValidationError[]) => void;
};

export function useSystemPatchActions(params: {
  campaignId: string | undefined;
  entryId: string | undefined;
  collectionKey: ContentTypeKey;
  driver: PatchDriver | null;
  setInitialPatch: (patch: Record<string, unknown>) => void;
  validationApiRef?: RefObject<{ validateAll: () => boolean } | null>;
  feedback: FeedbackSetters;
}) {
  const {
    campaignId,
    entryId,
    collectionKey,
    driver,
    setInitialPatch,
    validationApiRef,
    feedback: { setSaving, setSuccess, setErrors },
  } = params;

  const savePatch = useCallback(async () => {
    if (!campaignId || !entryId || !driver) return;
    const ok = validationApiRef?.current?.validateAll?.() ?? true;
    if (!ok) {
      setSuccess(false);
      return;
    }
    setSaving(true);
    setSuccess(false);
    setErrors([]);
    const next = driver.getPatch();
    try {
      await upsertEntryPatch(campaignId, collectionKey, entryId, next);
      setInitialPatch(next);
      setSuccess(true);
    } catch (err) {
      setErrors([
        { path: '', code: 'SAVE_FAILED', message: (err as Error).message },
      ]);
    } finally {
      setSaving(false);
    }
  }, [
    campaignId,
    entryId,
    collectionKey,
    driver,
    setInitialPatch,
    validationApiRef,
    setSaving,
    setSuccess,
    setErrors,
  ]);

  const removePatch = useCallback(async () => {
    if (!campaignId || !entryId) return;
    setSaving(true);
    setSuccess(false);
    setErrors([]);
    try {
      await removeEntryPatch(campaignId, collectionKey, entryId);
      setInitialPatch({});
      setSuccess(true);
    } catch (err) {
      setErrors([
        { path: '', code: 'REMOVE_FAILED', message: (err as Error).message },
      ]);
    } finally {
      setSaving(false);
    }
  }, [
    campaignId,
    entryId,
    collectionKey,
    setSaving,
    setSuccess,
    setErrors,
    setInitialPatch,
  ]);

  return { savePatch, removePatch };
}
