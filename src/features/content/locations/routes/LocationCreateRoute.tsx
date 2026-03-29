import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormProvider, useForm } from 'react-hook-form';
import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { EntryEditorLayout } from '@/features/content/shared/components';
import { useCampaignMembers } from '@/features/campaign/hooks';
import { useAccessPolicyField } from '@/features/content/shared/hooks/useAccessPolicyField';
import { useCreateEntrySubmit } from '@/features/content/shared/hooks/useCreateEntrySubmit';
import type { ValidationError } from '@/features/content/shared/hooks/editRoute.types';
import {
  locationRepo,
  type LocationFormValues,
  getLocationFieldConfigs,
  LOCATION_FORM_DEFAULTS,
  toLocationInput,
  useParentLocationPickerOptions,
} from '@/features/content/locations/domain';
import { ConditionalFormRenderer } from '@/ui/patterns';

const FORM_ID = 'location-create-form';

export default function LocationCreateRoute() {
  const { campaignId } = useActiveCampaign();
  const navigate = useNavigate();
  const { approvedCharacters: policyCharacters } = useCampaignMembers();

  const methods = useForm<LocationFormValues>({
    defaultValues: LOCATION_FORM_DEFAULTS,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });
  const { setValue, watch, formState: { isDirty } } = methods;

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const { policyValue, handlePolicyChange } =
    useAccessPolicyField<LocationFormValues>(watch, setValue);

  const parentLocationOptions = useParentLocationPickerOptions(campaignId ?? undefined);

  const handleSubmit = useCreateEntrySubmit<
    LocationFormValues,
    Parameters<typeof locationRepo.createEntry>[1],
    Awaited<ReturnType<typeof locationRepo.createEntry>>
  >({
    campaignId,
    navigate,
    createEntry: locationRepo.createEntry,
    toInput: toLocationInput,
    getSuccessPath: (cid, created) => `/campaigns/${cid}/world/locations/${created.id}`,
    setSaving,
    setErrors,
  });

  const handleBack = useCallback(() => {
    navigate(`/campaigns/${campaignId}/world/locations`);
  }, [navigate, campaignId]);

  const fieldConfigs = getLocationFieldConfigs({
    policyCharacters,
    parentLocationOptions,
  });

  return (
    <FormProvider {...methods}>
      <EntryEditorLayout
        typeLabel="Location"
        isNew
        saving={saving}
        dirty={isDirty}
        success={false}
        errors={errors}
        formId={FORM_ID}
        onBack={handleBack}
        showPolicyField
        policyValue={policyValue}
        onPolicyChange={handlePolicyChange}
        policyCharacters={policyCharacters}
      >
        <form id={FORM_ID} onSubmit={methods.handleSubmit(handleSubmit)} noValidate>
          <ConditionalFormRenderer fields={fieldConfigs} />
        </form>
      </EntryEditorLayout>
    </FormProvider>
  );
}
