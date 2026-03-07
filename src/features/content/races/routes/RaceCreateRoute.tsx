// Campaign-owned races are created here. System races are not created via UI.
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
  raceRepo,
  type RaceFormValues,
  getRaceFieldConfigs,
  RACE_FORM_DEFAULTS,
  toRaceInput,
} from '@/features/content/races/domain';
import { ConditionalFormRenderer } from '@/ui/patterns';

const FORM_ID = 'race-create-form';

export default function RaceCreateRoute() {
  const { campaignId } = useActiveCampaign();
  const navigate = useNavigate();
  const { approvedCharacters: policyCharacters } = useCampaignMembers();

  const methods = useForm<RaceFormValues>({
    defaultValues: RACE_FORM_DEFAULTS,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });
  const { setValue, watch, formState: { isDirty } } = methods;

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const { policyValue, handlePolicyChange } =
    useAccessPolicyField<RaceFormValues>(watch, setValue);

  const handleSubmit = useCreateEntrySubmit<
    RaceFormValues,
    Parameters<typeof raceRepo.createEntry>[1],
    Awaited<ReturnType<typeof raceRepo.createEntry>>
  >({
    campaignId,
    navigate,
    createEntry: raceRepo.createEntry,
    toInput: toRaceInput,
    getSuccessPath: (cid, created) =>
      `/campaigns/${cid}/world/races/${created.id}`,
    setSaving,
    setErrors,
  });

  const handleBack = useCallback(() => {
    navigate(`/campaigns/${campaignId}/world/races`);
  }, [navigate, campaignId]);

  const fieldConfigs = getRaceFieldConfigs({ policyCharacters });

  return (
    <FormProvider {...methods}>
      <EntryEditorLayout
        typeLabel="Race"
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
