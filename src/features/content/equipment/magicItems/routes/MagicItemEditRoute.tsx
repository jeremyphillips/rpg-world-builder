/**
 * Magic Item edit route.
 *
 * - source === 'system': field-config patch form via contentPatchRepo
 * - source === 'campaign': real form editor with delete support
 */
import { useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FormProvider, useForm } from 'react-hook-form';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { EntryEditorLayout } from '@/features/content/shared/components';
import { useCampaignMembers } from '@/features/campaign/hooks';
import { magicItemRepo } from '../domain/repo/magicItemRepo';
import { validateMagicItemChange } from '../domain/validation/validateMagicItemChange';
import type { MagicItem } from '@/features/content/shared/domain/types';
import { useCampaignContentEntry } from '@/features/content/shared/hooks/useCampaignContentEntry';
import { ConditionalFormRenderer } from '@/ui/patterns';
import { AppAlert, AppBadge } from '@/ui/primitives';
import {
  type MagicItemFormValues,
  getMagicItemFieldConfigs,
  MAGIC_ITEM_FORM_DEFAULTS,
  magicItemToFormValues,
  toMagicItemInput,
} from '../domain/forms';
import { useEditRouteFeedbackState } from '@/features/content/shared/hooks/useEditRouteFeedbackState';
import { useResetEditFeedbackOnChange } from '@/features/content/shared/hooks/useResetEditFeedbackOnChange';
import { useCampaignEntryFormReset } from '@/features/content/shared/hooks/useCampaignEntryFormReset';
import { useSystemEntryPatchState } from '@/features/content/shared/hooks/useSystemEntryPatchState';
import { useAccessPolicyField } from '@/features/content/shared/hooks/useAccessPolicyField';
import { usePatchDriverState } from '@/features/content/shared/hooks/usePatchDriverState';
import { useCampaignEntrySubmit } from '@/features/content/shared/hooks/useCampaignEntrySubmit';
import { useSystemPatchActions } from '@/features/content/shared/hooks/useSystemPatchActions';
import { useEntryDeleteAction } from '@/features/content/shared/hooks/useEntryDeleteAction';

const FORM_ID = 'magic-item-edit-form';

export default function MagicItemEditRoute() {
  const { campaignId, campaign } = useActiveCampaign();
  const { magicItemId } = useParams<{ magicItemId: string }>();
  const navigate = useNavigate();
  const { approvedCharacters: policyCharacters } = useCampaignMembers();

  const viewer = campaign?.viewer;
  const canDelete = Boolean(
    magicItemId && campaignId && (viewer?.isPlatformAdmin || viewer?.isOwner)
  );

  const { entry: item, loading, error, notFound } = useCampaignContentEntry<MagicItem>({
    campaignId: campaignId ?? undefined,
    entryId: magicItemId,
    fetchEntry: magicItemRepo.getEntry,
  });

  const methods = useForm<MagicItemFormValues>({
    defaultValues: MAGIC_ITEM_FORM_DEFAULTS,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });
  const { reset, setValue, watch, formState: { isDirty } } = methods;

  const {
    saving,
    success,
    errors,
    setSaving,
    setSuccess,
    setErrors,
    clearFeedback,
  } = useEditRouteFeedbackState();

  const isSystem = item?.source === 'system';
  const isCampaign = item?.source === 'campaign';

  const {
    initialPatch,
    setInitialPatch,
    hasExistingPatch,
    onPatchChange,
  } = useSystemEntryPatchState(
    campaignId ?? undefined,
    magicItemId,
    item,
    !!isSystem,
    'magicItems'
  );

  useCampaignEntryFormReset(item, isCampaign ?? false, reset, magicItemToFormValues);
  useResetEditFeedbackOnChange(watch, clearFeedback);

  const { policyValue, handlePolicyChange } = useAccessPolicyField<MagicItemFormValues>(watch, setValue);

  const driver = usePatchDriverState(
    item ? (item as unknown as Record<string, unknown>) : null,
    initialPatch,
    onPatchChange,
    clearFeedback
  );

  const validationApiRef = useRef<{ validateAll: () => boolean } | null>(null);

  const handleCampaignSubmit = useCampaignEntrySubmit({
    campaignId: campaignId ?? undefined,
    entryId: magicItemId,
    updateEntry: magicItemRepo.updateEntry,
    reset,
    toFormValues: magicItemToFormValues,
    toInput: toMagicItemInput,
    feedback: { setSaving, setSuccess, setErrors },
  });

  const { savePatch: handlePatchSave, removePatch: handleRemovePatch } =
    useSystemPatchActions({
      campaignId: campaignId ?? undefined,
      entryId: magicItemId,
      collectionKey: 'magicItems',
      driver,
      setInitialPatch,
      validationApiRef,
      feedback: { setSaving, setSuccess, setErrors },
    });

  const handleDelete = useEntryDeleteAction({
    campaignId: campaignId ?? undefined,
    entryId: magicItemId,
    deleteEntry: (cid, eid) => magicItemRepo.deleteEntry(cid, eid).then(() => {}),
    navigate,
    backPath: `/campaigns/${campaignId}/world/equipment/magic-items`,
  });

  const handleValidateDelete = useCallback(async () => {
    if (!campaignId || !magicItemId) return { allowed: true as const };
    return validateMagicItemChange({ campaignId, magicItemId, mode: 'delete' });
  }, [campaignId, magicItemId]);

  const handleBack = useCallback(
    () => navigate(`/campaigns/${campaignId}/world/equipment/magic-items`),
    [navigate, campaignId]
  );

  if (loading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  if (error || notFound || !item)
    return (
      <AppAlert tone="danger">{error ?? 'Magic item not found.'}</AppAlert>
    );

  const fieldConfigs = getMagicItemFieldConfigs({ policyCharacters });

  if (isSystem && driver) {
    return (
      <EntryEditorLayout
        typeLabel="Magic Item Patch"
        isNew={false}
        saving={saving}
        dirty={driver.isDirty()}
        success={success}
        errors={errors}
        onSave={handlePatchSave}
        onBack={handleBack}
      >
        <Stack spacing={2}>
          <Typography variant="subtitle1" fontWeight={600}>
            Patching: {item.name}
          </Typography>
          {item.patched && (
            <AppBadge label="Patched" tone="warning" size="small" />
          )}
          <ConditionalFormRenderer
            fields={fieldConfigs}
            driver={{
              kind: 'patch',
              getValue: driver.getValue,
              setValue: driver.setValue,
              unsetValue: driver.unsetValue,
            }}
            onValidationApi={(api) => {
              validationApiRef.current = api;
            }}
          />
          {hasExistingPatch && (
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={handleRemovePatch}
              disabled={saving}
              sx={{ alignSelf: 'flex-start' }}
            >
              Remove patch
            </Button>
          )}
        </Stack>
      </EntryEditorLayout>
    );
  }

  return (
    <FormProvider {...methods}>
      <EntryEditorLayout
        typeLabel="Magic Item"
        isNew={false}
        saving={saving}
        dirty={isDirty}
        success={success}
        errors={errors}
        formId={FORM_ID}
        onBack={handleBack}
        canDelete={canDelete}
        onDelete={handleDelete}
        validateDelete={handleValidateDelete}
        showPolicyField
        policyValue={policyValue}
        onPolicyChange={handlePolicyChange}
        policyCharacters={policyCharacters}
      >
        <form
          id={FORM_ID}
          onSubmit={methods.handleSubmit(handleCampaignSubmit)}
          noValidate
        >
          <ConditionalFormRenderer fields={fieldConfigs} />
        </form>
      </EntryEditorLayout>
    </FormProvider>
  );
}
